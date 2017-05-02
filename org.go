package main

import (
	"fmt"
	"io/ioutil"
	"os"

	"github.com/pkg/errors"
)

type Org struct {
	Name string `json:"name"`
}

type Orgs []Org

func GetOrgs() (Orgs, error) {
	orgs := Orgs{}
	dirs, err := ioutil.ReadDir(DATA_DIR)
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

func SaveOrg(name string) error {
	dir := fmt.Sprintf("%s/%s", DATA_DIR, name)
	err := os.MkdirAll(dir, 0777)
	if err != nil {
		return errors.Wrap(err, "Failed to make org dir")
	}

	return nil
}
