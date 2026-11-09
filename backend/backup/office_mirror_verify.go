package backup

import (
	"crypto/sha256"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sort"
)

// verifyDirectoryIntegrity calculates a deterministic SHA-256
// over all regular files in a directory.
//
// The relative path is included in the hash stream so that:
//   - content changes are detected
//   - deletion is detected
//   - addition is detected
//   - rename/path changes are detected
//
// This function is intentionally filesystem-only and does not
// modify the source or destination.
func verifyDirectoryIntegrity(root string) (string, error) {
	if root == "" {
		return "", fmt.Errorf("mirror root is empty")
	}

	info, err := os.Stat(root)
	if err != nil {
		return "", fmt.Errorf("mirror root unavailable: %w", err)
	}

	if !info.IsDir() {
		return "", fmt.Errorf("mirror root is not a directory")
	}

	type item struct {
		rel  string
		hash [32]byte
	}

	var items []item

	err = filepath.Walk(root, func(
		path string,
		info os.FileInfo,
		err error,
	) error {
		if err != nil {
			return err
		}

		if info.IsDir() {
			return nil
		}

		if !info.Mode().IsRegular() {
			return nil
		}

		rel, err := filepath.Rel(root, path)
		if err != nil {
			return err
		}

		rel = filepath.ToSlash(rel)

		f, err := os.Open(path)
		if err != nil {
			return err
		}

		h := sha256.New()

		_, copyErr := io.Copy(h, f)
		closeErr := f.Close()

		if copyErr != nil {
			return copyErr
		}

		if closeErr != nil {
			return closeErr
		}

		var digest [32]byte
		copy(digest[:], h.Sum(nil))

		items = append(items, item{
			rel:  rel,
			hash: digest,
		})

		return nil
	})

	if err != nil {
		return "", err
	}

	sort.Slice(items, func(i, j int) bool {
		return items[i].rel < items[j].rel
	})

	final := sha256.New()

	for _, item := range items {
		final.Write([]byte(item.rel))
		final.Write([]byte{0})
		final.Write(item.hash[:])
		final.Write([]byte{0})
	}

	return fmt.Sprintf("%x", final.Sum(nil)), nil
}
