package code_source_recovery

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

var ErrSourceIntegrityMismatch = errors.New("source integrity mismatch")

type SourceIntegrityResult struct {
	Digest   string
	Files    int
	Verified bool
}

type SourceIntegrityVerifier struct {
	Root string
}

func NewSourceIntegrityVerifier(root string) *SourceIntegrityVerifier {
	return &SourceIntegrityVerifier{
		Root: root,
	}
}

func excludedIntegrityPath(relative string) bool {
	relative = filepath.ToSlash(relative)

	if relative == "" || relative == "." {
		return true
	}

	parts := strings.Split(relative, "/")

	for _, part := range parts {
		switch part {
		case ".git", "node_modules", "dist", ".scs-patch-backups", ".postgres":
			return true
		}
	}

	return false
}

func (v *SourceIntegrityVerifier) files() ([]string, error) {
	var files []string

	err := filepath.Walk(v.Root, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if path == v.Root {
			return nil
		}

		relative, err := filepath.Rel(v.Root, path)
		if err != nil {
			return err
		}

		if excludedIntegrityPath(relative) {
			if info.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}

		if info.Mode().IsRegular() {
			files = append(files, relative)
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	sort.Strings(files)
	return files, nil
}

func (v *SourceIntegrityVerifier) Digest() (SourceIntegrityResult, error) {
	files, err := v.files()
	if err != nil {
		return SourceIntegrityResult{}, err
	}

	digest := sha256.New()

	for _, relative := range files {
		full := filepath.Join(v.Root, relative)

		file, err := os.Open(full)
		if err != nil {
			return SourceIntegrityResult{}, err
		}

		_, err = io.Copy(digest, file)
		closeErr := file.Close()

		if err != nil {
			return SourceIntegrityResult{}, err
		}

		if closeErr != nil {
			return SourceIntegrityResult{}, closeErr
		}

		if _, err := digest.Write([]byte{0}); err != nil {
			return SourceIntegrityResult{}, err
		}

		if _, err := digest.Write([]byte(filepath.ToSlash(relative))); err != nil {
			return SourceIntegrityResult{}, err
		}

		if _, err := digest.Write([]byte{0}); err != nil {
			return SourceIntegrityResult{}, err
		}
	}

	return SourceIntegrityResult{
		Digest:   hex.EncodeToString(digest.Sum(nil)),
		Files:    len(files),
		Verified: false,
	}, nil
}

func (v *SourceIntegrityVerifier) VerifyExpected(expected string) (SourceIntegrityResult, error) {
	expected = strings.ToLower(strings.TrimSpace(expected))

	if len(expected) != 64 {
		return SourceIntegrityResult{}, ErrSourceIntegrityMismatch
	}

	actual, err := v.Digest()
	if err != nil {
		return SourceIntegrityResult{}, err
	}

	actual.Verified = actual.Digest == expected

	if !actual.Verified {
		return actual, ErrSourceIntegrityMismatch
	}

	return actual, nil
}

func (v *SourceIntegrityVerifier) VerifyAgainst(result SourceIntegrityResult) (SourceIntegrityResult, error) {
	return v.VerifyExpected(result.Digest)
}
