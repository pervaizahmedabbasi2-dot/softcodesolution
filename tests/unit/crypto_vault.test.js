import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { SoftCodeCryptoVault } from '../../backend/auth_security/crypto_vault.js';

function createMemoryVault() {
  const db = new DatabaseSync(':memory:');
  const vault = new SoftCodeCryptoVault(db);
  return { db, vault };
}

test('SoftCodeCryptoVault: encrypts and decrypts tenant fields with AES-256-GCM', () => {
  const { db, vault } = createMemoryVault();
  try {
    const tenantId = 'tenant-alpha-01';
    const secretEmail = 'founder@softcodesolution.pk';
    const encrypted = vault.encryptField(tenantId, secretEmail);

    assert.ok(encrypted.startsWith('enc:v1:'), 'Encrypted value should carry enc:v1: prefix');
    assert.notEqual(encrypted, secretEmail);

    const decrypted = vault.decryptField(tenantId, encrypted);
    assert.equal(decrypted, secretEmail);

    // Non-deterministic IV check
    const encryptedAgain = vault.encryptField(tenantId, secretEmail);
    assert.notEqual(encrypted, encryptedAgain, 'Same plaintext should produce distinct IV ciphertext');
  } finally {
    db.close();
  }
});

test('SoftCodeCryptoVault: enforces cross-tenant AAD isolation', () => {
  const { db, vault } = createMemoryVault();
  try {
    const cipherForA = vault.encryptField('tenant-a', 'Sensitive Ledger Data');
    const decryptedByB = vault.decryptField('tenant-b', cipherForA);
    assert.equal(decryptedByB, '[ENCRYPTED_PROTECTED]', 'Tenant B must never decrypt Tenant A ciphertext');
  } finally {
    db.close();
  }
});

test('SoftCodeCryptoVault: produces normalized deterministic HMAC-SHA256 blind indexes', () => {
  const { db, vault } = createMemoryVault();
  try {
    const idx1 = vault.blindIndex('  CEO@Company.PK ', 'email');
    const idx2 = vault.blindIndex('ceo@company.pk', 'email');
    const idxOtherPurpose = vault.blindIndex('ceo@company.pk', 'phone');

    assert.equal(idx1.length, 64);
    assert.equal(idx1, idx2);
    assert.notEqual(idx1, idxOtherPurpose);
    assert.equal(vault.blindIndex('', 'email'), '');
  } finally {
    db.close();
  }
});

test('SoftCodeCryptoVault: supports VIP zero-knowledge Argon2id lock, unlock, and crypto-shredding', async () => {
  const { db, vault } = createMemoryVault();
  try {
    const tenantId = 'tenant-vip-01';
    const passphrase = 'UltraStrong#VipPassphrase2026';

    const beforeCipher = vault.encryptField(tenantId, 'Confidential Salary Sheet');
    assert.equal(vault.decryptField(tenantId, beforeCipher), 'Confidential Salary Sheet');

    const vipStatus = await vault.enableVipZeroKnowledge(tenantId, passphrase);
    assert.equal(vipStatus.ok, true);
    assert.equal(vipStatus.mode, 'VIP_ZERO_KNOWLEDGE');

    // Lock session clears cached DEK
    vault.lockVipSession(tenantId);
    assert.equal(vault.isTenantLocked(tenantId), true);
    assert.equal(vault.decryptField(tenantId, beforeCipher), '[LOCKED_VIP_VAULT]');

    // Wrong passphrase must fail
    const wrongUnlock = await vault.unlockVipTenantKey(tenantId, 'WrongPassphrase123!');
    assert.equal(wrongUnlock, false);

    // Correct passphrase must unlock and decrypt
    const rightUnlock = await vault.unlockVipTenantKey(tenantId, passphrase);
    assert.equal(rightUnlock, true);
    assert.equal(vault.decryptField(tenantId, beforeCipher), 'Confidential Salary Sheet');

    // Crypto-shred permanently destroys key material
    vault.cryptoShredTenant(tenantId);
    assert.equal(vault.isTenantLocked(tenantId), true);
    assert.equal(await vault.unlockVipTenantKey(tenantId, passphrase), false);
    assert.equal(vault.decryptField(tenantId, beforeCipher), '[LOCKED_VIP_VAULT]');
  } finally {
    db.close();
  }
});

test('SoftCodeCryptoVault: masks nested sensitive fields when tenant vault is locked', () => {
  const { db, vault } = createMemoryVault();
  try {
    const masked = vault.maskSensitiveObject({
      id: 'ord-1',
      total: 1500,
      customerName: 'Ayesha Khan',
      nested: { phone: '03001234567', status: 'PAID' }
    });

    assert.equal(masked.id, 'ord-1');
    assert.equal(masked.total, 1500);
    assert.equal(masked.customerName, '[LOCKED_VIP_VAULT]');
    assert.equal(masked.nested.phone, '[LOCKED_VIP_VAULT]');
    assert.equal(masked.nested.status, 'PAID');
  } finally {
    db.close();
  }
});
