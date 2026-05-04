package utils

import (
	"crypto/md5"
	"encoding/hex"
)

func MD5Hash(text string) string {
	hash := md5.Sum([]byte(text))
	return hex.EncodeToString(hash[:])
}

func VerifyMD5(text, hash string) bool {
	return MD5Hash(text) == hash
}
