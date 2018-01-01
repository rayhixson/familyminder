package main

import (
	"io/ioutil"
	"os"

	"github.com/pkg/errors"
)

type Org struct {
	Name string `json:"name"`
}

type Orgs []Org

func GetOrgs(username string) (Orgs, error) {
	orgs := Orgs{}
	dirs, err := ioutil.ReadDir(DATA_DIR + "/" + username)
	if err != nil {
		return orgs, errors.Wrap(err, "Failed to read data dir:")
	}

	for _, d := range dirs {
		if d.IsDir() {
			orgs = append(orgs, Org{d.Name()})
		}
	}

	return orgs, nil
}

func SaveOrg(username, name string) error {
	dir := getFamilyDir(username, name)
	err := os.MkdirAll(dir, 0777)
	if err != nil {
		return errors.Wrap(err, "Failed to create org dir")
	}
	return nil
}
