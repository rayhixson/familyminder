package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"strings"

	"github.com/pkg/errors"
)

const DATA_DIR = "./data"

var ErrUserNotFound = errors.New("User not found")

type User struct {
	ChildIDs   []string `json:"child_ids"`
	Uuid       string   `json:"uuid"`
	Familyname string   `json:"familyname"`
	SpouseUuid string   `json:"spouse"`
	IsSpouse   bool     `json:"is_spouse"`
	Username   string   `json:"username"`
	Birthday   string   `json:"birthday"`
	Email      string   `json:"email"`
	Picture    string   `json:"picture"`
	Picture2   string   `json:"picture2"`
}

type FilterFunc func(user *User) bool

func GetUser(family, uuid string) (*User, error) {
	users, err := GetUsers(family, func(u *User) bool {
		return u.Uuid == uuid
	})
	if err != nil {
		return nil, err
	}

	return users[0], nil
}

func GetUsers(family string, filter FilterFunc) (users []*User, err error) {
	dir := getFamilyDir(family)

	usersInDir, err := ioutil.ReadDir(dir)
	if err != nil {
		fmt.Printf("Failed to read family dir: %v, %v", family, err)
		return users, ErrUserNotFound
	}

	all := make([]*User, 0)

	for _, file := range usersInDir {
		if !strings.HasSuffix(file.Name(), ".json") {
			continue
		}

		filedata, err := ioutil.ReadFile(dir + "/" + file.Name())
		if err != nil {
			return users, errors.Wrap(err, "Failed to open a file")
		}
		var u User
		err = json.Unmarshal(filedata, &u)
		if err != nil {
			return users, errors.Wrap(err, "Failed to unmarshal")
		}
		all = append(all, &u)

		if filter != nil {
			if filter(&u) {
				users = append(users, &u)
			}
		} else {
			users = append(users, &u)
		}
	}
	if len(users) < 1 {
		return users, ErrUserNotFound
	}

	// fill in the spouse info for each user we want to return
	for _, m := range users {
		if isSpouse(m.Uuid, all) {
			m.IsSpouse = true
			continue
		}
	}

	return users, nil
}

func GetFamilyRoot(family string) (*User, error) {
	members, err := GetUsers(family, nil)
	if err != nil {
		return nil, err
	}

	for _, m := range members {
		if !hasReferences(m.Uuid, members) {
			return m, nil
		}
	}

	return nil, fmt.Errorf("Failed to find dad for family: %v", family)
}

func hasReferences(uuid string, members []*User) bool {
	for _, j := range members {
		if j.SpouseUuid == uuid {
			return true
		}
		for _, k := range j.ChildIDs {
			if k == uuid {
				return true
			}
		}
	}
	return false
}

func isSpouse(uuid string, members []*User) bool {
	for _, j := range members {
		if j.SpouseUuid == uuid {
			return true
		}
	}
	return false
}

func (u User) Save() error {
	if u.Uuid == "" {
		return fmt.Errorf("No UUID on this user: %v", u.Username)
	}

	body, err := json.Marshal(u)
	if err != nil {
		return errors.Wrap(err, "Failed to marshal user")
	}

	dir, err := createFamilyDir(u.Familyname)
	if err != nil {
		return err
	}

	return ioutil.WriteFile(dir+"/"+u.Uuid+".json", body, 0660)
}

// AddChild updates this parent with the child ref
func (u User) AddChild(child *User) error {
	if u.IsSpouse {
		return errors.New("Cannot add a child to a spouse")
	}
	u.ChildIDs = append(u.ChildIDs, child.Uuid)
	return u.Save()
}

func (u User) AddSpouse(spouse *User) error {
	spouse.IsSpouse = true
	err := spouse.Save()
	if err != nil {
		return err
	}

	u.SpouseUuid = spouse.Uuid
	return u.Save()
}

func (u User) RemoveChild(childID string) error {
	for i, kid := range u.ChildIDs {
		if kid == childID {
			u.ChildIDs[i] = u.ChildIDs[0]
			u.ChildIDs = u.ChildIDs[1:]
			return u.Save()
		}
	}

	return nil
}

func (u User) RemoveSpouse(spouseID string) error {
	if u.SpouseUuid == spouseID {
		u.SpouseUuid = ""
		return u.Save()
	}
	return nil
}

func (u User) Delete() error {
	members, err := GetUsers(u.Familyname, nil)
	if err != nil {
		return err
	}

	// go through the whole family finding references
	for _, fm := range members {
		err = fm.RemoveSpouse(u.Uuid)
		if err != nil {
			return err
		}
		err = fm.RemoveChild(u.Uuid)
		if err != nil {
			return err
		}
	}

	dir := getFamilyDir(u.Familyname)

	return os.Remove(dir + "/" + u.Uuid + ".json")
}

func getFamilyDir(family string) string {
	return fmt.Sprintf("%s/%s", DATA_DIR, family)
}

func createFamilyDir(family string) (string, error) {
	dir := getFamilyDir(family)
	err := os.MkdirAll(dir, 0777)
	if err != nil {
		return dir, errors.Wrap(err, "Failed to get family dir")
	}
	return dir, nil
}
