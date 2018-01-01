package main

import (
	"fmt"
	"os"
	"strings"

	"github.com/pkg/errors"
)

var ErrUserNotFound = errors.New("User not found")

type User struct {
	UserName string `json:"username"`
}

func GetUserDir(userName string) (string, error) {
	if userName == "" {
		return "", ErrUserNotFound
	}
	dir := getUserDir(strings.ToLower(userName))

	if _, err := os.Stat(dir); os.IsNotExist(err) {
		return "", ErrUserNotFound
	}

	return dir, nil
}

func getUserDir(userName string) string {
	return fmt.Sprintf("%s/%s", DATA_DIR, userName)
}
