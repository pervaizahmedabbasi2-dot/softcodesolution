package main

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"io"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"golang.org/x/crypto/hkdf"
)

const vaultCipherPrefix = "enc:v1:"

var (
	vaultKeyOnce     sync.Once
	cachedMasterKEK  []byte
	vaultDekCacheMu  sync.RWMutex
	vaultDekCacheMap = make(map[string][]byte)
)

type vaultMasterKeyFile struct {
	MasterKey string `json:"masterKey"`
	BlindKey  string `json:"blindKey"`
}

func loadVaultMasterKEK() []byte {
	vaultKeyOnce.Do(func() {
		rawMaster := strings.TrimSpace(os.Getenv("SCS_VAULT_MASTER_KEY"))
		if rawMaster == "" {
			keyFile := getenvDefault("SCS_VAULT_KEY_FILE", filepath.Join("backend", "auth_security", ".vault_master.key"))
			if data, err := os.ReadFile(keyFile); err == nil {
				var parsed vaultMasterKeyFile
				if jsonErr := json.Unmarshal(data, &parsed); jsonErr == nil && strings.TrimSpace(parsed.MasterKey) != "" {
					rawMaster = strings.TrimSpace(parsed.MasterKey)
				}
			}
		}
		if rawMaster == "" {
			buf := make([]byte, 32)
			if _, err := rand.Read(buf); err == nil {
				rawMaster = hex.EncodeToString(buf)
			} else {
				rawMaster = "softcode-ephemeral-master-fallback"
			}
		}
		reader := hkdf.New(sha256.New, []byte(rawMaster), []byte("softcode-envelope-kek-v1"), []byte("aes-256-gcm"))
		kek := make([]byte, 32)
		if _, err := io.ReadFull(reader, kek); err == nil {
			cachedMasterKEK = kek
		}
	})
	return cachedMasterKEK
}

func aesGCMWrap(key []byte, plaintext []byte, aad string) (string, bool) {
	if len(key) != 32 {
		return "", false
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", false
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", false
	}
	iv := make([]byte, 12)
	if _, err := rand.Read(iv); err != nil {
		return "", false
	}
	sealed := gcm.Seal(nil, iv, plaintext, []byte(aad))
	if len(sealed) < 16 {
		return "", false
	}
	tagStart := len(sealed) - 16
	ciphertext := sealed[:tagStart]
	tag := sealed[tagStart:]
	return vaultCipherPrefix +
		base64.RawURLEncoding.EncodeToString(iv) + ":" +
		base64.RawURLEncoding.EncodeToString(tag) + ":" +
		base64.RawURLEncoding.EncodeToString(ciphertext), true
}

func aesGCMUnwrap(key []byte, encoded string, aad string) ([]byte, bool) {
	if len(key) != 32 || !strings.HasPrefix(encoded, vaultCipherPrefix) {
		return nil, false
	}
	raw := strings.TrimPrefix(encoded, vaultCipherPrefix)
	parts := strings.Split(raw, ":")
	if len(parts) != 3 || parts[0] == "" || parts[1] == "" || parts[2] == "" {
		return nil, false
	}
	iv, err1 := base64.RawURLEncoding.DecodeString(parts[0])
	tag, err2 := base64.RawURLEncoding.DecodeString(parts[1])
	ciphertext, err3 := base64.RawURLEncoding.DecodeString(parts[2])
	if err1 != nil || err2 != nil || err3 != nil {
		return nil, false
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, false
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, false
	}
	if len(iv) != gcm.NonceSize() || len(tag) != gcm.Overhead() {
		return nil, false
	}
	combined := make([]byte, 0, len(ciphertext)+len(tag))
	combined = append(combined, ciphertext...)
	combined = append(combined, tag...)
	plain, err := gcm.Open(nil, iv, combined, []byte(aad))
	if err != nil {
		return nil, false
	}
	return plain, true
}

func ensureVaultSchema(db *sql.DB) {
	if db == nil {
		return
	}
	_, _ = db.Exec(`
		CREATE TABLE IF NOT EXISTS tenant_crypto_keys (
			tenant_id TEXT PRIMARY KEY,
			wrapped_dek TEXT,
			wrapped_dek_vip TEXT,
			vip_salt TEXT,
			argon2_params TEXT,
			encryption_mode TEXT DEFAULT 'SERVER_MANAGED_ENVELOPE',
			key_version INTEGER DEFAULT 1,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);
	`)
}

func ensureTenantDEK(db *sql.DB, tenantID string) ([]byte, string) {
	tid := strings.TrimSpace(tenantID)
	if tid == "" {
		tid = "tenant-root-platform"
	}

	vaultDekCacheMu.RLock()
	cached, exists := vaultDekCacheMap[tid]
	vaultDekCacheMu.RUnlock()
	if exists && len(cached) == 32 {
		return cached, "SERVER_MANAGED_ENVELOPE"
	}

	kek := loadVaultMasterKEK()
	if db != nil {
		ensureVaultSchema(db)
		var wrapped sql.NullString
		var mode sql.NullString
		err := db.QueryRow(`SELECT wrapped_dek, encryption_mode FROM tenant_crypto_keys WHERE tenant_id = ? LIMIT 1`, tid).Scan(&wrapped, &mode)
		if err == nil {
			m := strings.TrimSpace(mode.String)
			if m == "SHREDDED" || m == "VIP_ZERO_KNOWLEDGE" {
				return nil, m
			}
			if wrapped.Valid && wrapped.String != "" {
				if dek, ok := aesGCMUnwrap(kek, wrapped.String, tid); ok && len(dek) == 32 {
					vaultDekCacheMu.Lock()
					vaultDekCacheMap[tid] = dek
					vaultDekCacheMu.Unlock()
					return dek, m
				}
			}
		}
	}

	fresh := make([]byte, 32)
	if _, err := rand.Read(fresh); err != nil {
		return nil, "ERROR"
	}
	if wrapped, ok := aesGCMWrap(kek, fresh, tid); ok && db != nil {
		_, _ = db.Exec(`
			INSERT OR IGNORE INTO tenant_crypto_keys (tenant_id, wrapped_dek, encryption_mode, key_version)
			VALUES (?, ?, 'SERVER_MANAGED_ENVELOPE', 1)
		`, tid, wrapped)
	}
	vaultDekCacheMu.Lock()
	vaultDekCacheMap[tid] = fresh
	vaultDekCacheMu.Unlock()
	return fresh, "SERVER_MANAGED_ENVELOPE"
}

// vaultEncryptField encrypts non-empty strings using per-tenant AES-256-GCM matching Node crypto_vault.js.
func vaultEncryptField(db *sql.DB, tenantID string, plaintext string) string {
	if plaintext == "" || strings.HasPrefix(plaintext, vaultCipherPrefix) {
		return plaintext
	}
	tid := strings.TrimSpace(tenantID)
	if tid == "" {
		tid = "tenant-root-platform"
	}
	dek, _ := ensureTenantDEK(db, tid)
	if len(dek) != 32 {
		return plaintext
	}
	if enc, ok := aesGCMWrap(dek, []byte(plaintext), tid); ok {
		return enc
	}
	return plaintext
}

// vaultDecryptField decrypts enc:v1: payloads using per-tenant AES-256-GCM, passing plaintext through unchanged.
func vaultDecryptField(db *sql.DB, tenantID string, stored string) string {
	if stored == "" || !strings.HasPrefix(stored, vaultCipherPrefix) {
		return stored
	}
	tid := strings.TrimSpace(tenantID)
	if tid == "" {
		tid = "tenant-root-platform"
	}
	dek, _ := ensureTenantDEK(db, tid)
	if len(dek) != 32 {
		return "[LOCKED_VIP_VAULT]"
	}
	plain, ok := aesGCMUnwrap(dek, stored, tid)
	if !ok {
		return "[ENCRYPTED_PROTECTED]"
	}
	return string(plain)
}
