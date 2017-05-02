package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"

	"github.com/pkg/errors"
)

const DATA_DIR = "./data"

type User struct {
	ChildIDs   []string `json:"child_ids"`
	Uuid       string   `json:"uuid"`
	Familyname string   `json:"familyname"`
	IsSpouse   bool     `json:"is_spouse"`
	Username   string   `json:"username"`
	Birthday   string   `json:"birthday"`
	Email      string   `json:"email"`
	Picture    string   `json:"picture"`
	Picture2   string   `json:"picture2"`
}

func GetUser(family, uuid string) (User, error) {
	dir, err := familyDir(family)
	if err != nil {
		return User{}, err
	}

	body, err := ioutil.ReadFile(dir + "/" + uuid)
	if err != nil {
		return User{}, errors.Wrap(err, "Failed to read data:")
	}

	var u User
	err = json.Unmarshal(body, &u)
	if err != nil {
		return User{}, errors.Wrap(err, "Failed to unmarshal:")
	}

	return u, nil
}

func (u User) Save() error {
	if u.Uuid == "" {
		return fmt.Errorf("No UUID on this user: %v", u.Username)
	}

	body, err := json.Marshal(u)
	if err != nil {
		return errors.Wrap(err, "Failed to marshal user")
	}

	dir, err := familyDir(u.Familyname)
	if err != nil {
		return err
	}

	return ioutil.WriteFile(dir+"/"+u.Uuid, body, 0660)
}

// AddChild updates this parent with the child ref
func (u User) AddChild(child User) error {
	u.ChildIDs = append(u.ChildIDs, child.Uuid)
	return u.Save()
}

func familyDir(family string) (string, error) {
	dir := fmt.Sprintf("%s/%s", DATA_DIR, family)
	err := os.MkdirAll(dir, 0777)
	if err != nil {
		return dir, errors.Wrap(err, "Failed to get family dir")
	}

	return dir, nil
}
