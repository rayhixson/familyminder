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

var ErrPersonNotFound = errors.New("Person not found")

type Person struct {
	ChildIDs   []string `json:"child_ids"`
	Uuid       string   `json:"uuid"`
	Familyname string   `json:"familyname"`
	Owner      string   `json:"owner"`
	SpouseUuid string   `json:"spouse"`
	IsSpouse   bool     `json:"is_spouse"`
	Name       string   `json:"name"`
	Birthday   string   `json:"birthday"`
	Email      string   `json:"email"`
	Picture    string   `json:"picture"`
	Picture2   string   `json:"picture2"`
}

type FilterFunc func(user *Person) bool

func GetPerson(user, family, uuid string) (*Person, error) {
	users, err := GetPersons(user, family, func(u *Person) bool {
		return u.Uuid == uuid
	})
	if err != nil {
		return nil, err
	}

	return users[0], nil
}

func GetPersons(user, family string, filter FilterFunc) (users []*Person, err error) {

	dir := getFamilyDir(user, family)

	usersInDir, err := ioutil.ReadDir(dir)
	if err != nil {
		fmt.Printf("Failed to read family dir: %v, %v", dir, err)
		return users, ErrPersonNotFound
	}

	all := make([]*Person, 0)

	for _, file := range usersInDir {
		if !strings.HasSuffix(file.Name(), ".json") {
			continue
		}

		filedata, err := ioutil.ReadFile(dir + "/" + file.Name())
		if err != nil {
			return users, errors.Wrap(err, "Failed to open a file")
		}
		var u Person
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
		return users, ErrPersonNotFound
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

func GetFamilyRoot(user, family string) (*Person, error) {
	members, err := GetPersons(user, family, nil)
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

func (u Person) Save() error {
	if u.Uuid == "" {
		return fmt.Errorf("No UUID on this user: %v", u.Name)
	}

	body, err := json.Marshal(u)
	if err != nil {
		return errors.Wrap(err, "Failed to marshal user")
	}

	dir := getFamilyDir(u.Owner, u.Familyname)

	return ioutil.WriteFile(dir+"/"+u.Uuid+".json", body, 0660)
}

// AddChild updates this parent with the child ref
func (u Person) AddChild(child *Person) error {
	if u.IsSpouse {
		return errors.New("Cannot add a child to a spouse")
	}
	u.ChildIDs = append(u.ChildIDs, child.Uuid)
	return u.Save()
}

func (u Person) AddSpouse(spouse *Person) error {
	spouse.IsSpouse = true
	err := spouse.Save()
	if err != nil {
		return err
	}

	u.SpouseUuid = spouse.Uuid
	return u.Save()
}

func (u Person) RemoveChild(childID string) error {
	for i, kid := range u.ChildIDs {
		if kid == childID {
			u.ChildIDs[i] = u.ChildIDs[0]
			u.ChildIDs = u.ChildIDs[1:]
			return u.Save()
		}
	}

	return nil
}

func (u Person) RemoveSpouse(spouseID string) error {
	if u.SpouseUuid == spouseID {
		u.SpouseUuid = ""
		return u.Save()
	}
	return nil
}

func (u Person) Delete() error {
	members, err := GetPersons(u.Owner, u.Familyname, nil)
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

	dir := getFamilyDir(u.Owner, u.Familyname)
	return os.Remove(dir + "/" + u.Uuid + ".json")
}

func hasReferences(uuid string, members []*Person) bool {
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

func isSpouse(uuid string, members []*Person) bool {
	for _, j := range members {
		if j.SpouseUuid == uuid {
			return true
		}
	}
	return false
}

func getFamilyDir(userDir, family string) string {
	return fmt.Sprintf("%s/%s/%s", DATA_DIR, userDir, strings.ToLower(family))
}
