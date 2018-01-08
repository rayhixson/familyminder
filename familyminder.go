package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"regexp"
	"runtime/debug"
	"strings"
	"sync/atomic"

	"github.com/pkg/errors"
)

const serveDir = "www"
const index = "index.html"
const PORT = ":9090"
const ACCESS_TOKEN = "access_token"

const DUMP_REQUESTS = false

var requests uint64 = 0

type Login struct {
	Username  string `json:"username"`
	Password  string `json:"password"`
	GrantType string `json:"grant_type"`
	Token     string `json:"access_token"`
}

// /orgminder/{familyname}/persons/{person_id}
var userPath = regexp.MustCompile("^/orgminder/(.*)/persons(/.*)?")

// /orgminder/{familyname}/persons/{person_id}/children/{child_id}
var childPath = regexp.MustCompile("^/orgminder/(.*)/persons(/.*)/children(/.*)?$")

func fileHandler(w http.ResponseWriter, r *http.Request) {
	//log.Printf("Serve: %v", r.URL.Path)
	http.ServeFile(w, r, serveDir+r.URL.Path)
}

func readBody(reqID uint64, w http.ResponseWriter, r *http.Request) (bytes.Buffer, error) {
	if r.URL.RawQuery == "" {
		log.Printf("[%v]: %v %v", reqID, r.Method, r.URL.Path)
	} else {
		log.Printf("[%v]: %v %v?%v", reqID, r.Method, r.URL.Path, r.URL.RawQuery)
	}
	var buf bytes.Buffer
	if DUMP_REQUESTS {
		bytes, err := httputil.DumpRequest(r, true)
		if err != nil {
			return buf, errors.Wrap(err, "Failed to Dump")
		}
		log.Printf("[%v]: Request: %v", reqID, string(bytes))
	}

	if _, err := buf.ReadFrom(r.Body); err != nil {
		return buf, errors.Wrap(err, "Failed to read")
	}
	if err := r.Body.Close(); err != nil {
		return buf, errors.Wrap(err, "Failed to close")
	}

	if r.Method == "POST" || r.Method == "PUT" {
		log.Printf("[%v]: Body: %v", reqID, buf.String())
	}

	return buf, nil
}

func apiHandler(w http.ResponseWriter, r *http.Request) {
	atomic.AddUint64(&requests, 1)
	reqID := atomic.LoadUint64(&requests)
	responseObject, err := func() (interface{}, error) {
		buf, err := readBody(reqID, w, r)
		if err != nil {
			return nil, err
		}

		user, err := auth(r.URL.Query().Get(ACCESS_TOKEN))
		if err != nil {
			return nil, err
		}

		parts := strings.Split(r.URL.Path, "/")
		family := parts[2]
		action := parts[3]

		// identify the verb after the person id
		if action == "persons" && len(parts) >= 6 {
			action = parts[5]
		}

		log.Printf("[%v]: Family: %v, Action: %v", reqID, family, action)

		switch action {
		case "persons":
			switch r.Method {
			case "GET":
				return getPerson(user, family, parts[4])
			case "PUT":
				return nil, savePerson(user, family, parts[4], buf.Bytes())
			case "POST":
				return createNewPerson(user, family, buf.Bytes())
			case "DELETE":
				return nil, deletePerson(user, family, parts[4])
			default:
				return nil, fmt.Errorf("Unknown [persons] method: %v\n", r.Method)
			}
		case "children":
			personID := parts[4]
			switch r.Method {
			case "POST":
				return addChild(user, family, personID, parts[6])
			default:
				return nil, fmt.Errorf("Unknown [children] method: %v\n", r.Method)
			}
		case "spouse":
			personID := parts[4]
			switch r.Method {
			case "POST":
				return addSpouse(user, family, personID, parts[6])
			default:
				return nil, fmt.Errorf("Unknown [spouse] method: %v\n", r.Method)
			}
		default:
			return nil, fmt.Errorf("Unknown action: %v", action)
		}
	}()

	if err != nil {
		handleErr(w, err)
	} else {
		if responseObject == nil {
			responseObject = ""
		}
		okResponse(reqID, w, responseObject)
	}
}

func addSpouse(user, family, personID, spouseID string) (spouse *Person, err error) {
	spouse, err = GetPerson(user, family, spouseID)
	if err != nil {
		return
	}

	person, err := GetPerson(user, family, personID)
	if err != nil {
		return
	}

	err = person.AddSpouse(spouse)
	return
}

func deletePerson(user, family, personID string) error {
	person, err := GetPerson(user, family, personID)
	if err != nil {
		return err
	}

	return person.Delete()
}

func addChild(user, family, parentID, childID string) (parent *Person, err error) {
	child, err := GetPerson(user, family, childID)
	if err != nil {
		return
	}

	parent, err = GetPerson(user, family, parentID)
	if err != nil {
		return
	}

	err = parent.AddChild(child)

	return
}

func createNewPerson(user, family string, buf []byte) (*Person, error) {
	person := Person{}
	err := json.Unmarshal(buf, &person)
	if err != nil {
		return &person, err
	}
	fmt.Printf("====> creating new person: %v for family %v\n", person.Name, family)

	person.Uuid = NewID()
	person.Owner = user
	person.Familyname = family
	err = person.Save()

	return &person, err
}

func savePerson(user, family string, who string, buf []byte) error {
	u := Person{}
	err := json.Unmarshal(buf, &u)
	if err != nil {
		return err
	}

	u.Owner = user
	u.Familyname = family
	u.Uuid = who

	return u.Save()
}

func getPerson(user, family string, who string) (person *Person, err error) {
	if IsID(who) {
		return GetPerson(user, family, who)
	} else {
		return GetFamilyRoot(user, family)
	}
}

func adminHandler(w http.ResponseWriter, r *http.Request) {
	responseObject, err := func() (interface{}, error) {
		buf, err := readBody(0, w, r)
		if err != nil {
			return nil, err
		}

		parts := strings.Split(r.URL.Path, "/")
		action := parts[2]

		switch action {
		case "token":
			login := Login{}
			err = json.Unmarshal(buf.Bytes(), &login)
			if err != nil {
				return nil, err
			}

			log.Printf("tokenHandler body: %+v", login)

			token, err := auth(login.Username)
			login.Token = token
			return &login, err

		case "orgs":
			user, err := auth(r.URL.Query().Get(ACCESS_TOKEN))
			if err != nil {
				return nil, err
			}

			switch r.Method {
			case "GET":
				orgs, err := GetOrgs(user)
				log.Printf("Orgs: %v", orgs)

				return orgs, err

			case "POST":
				org := Org{}
				err = json.Unmarshal(buf.Bytes(), &org)
				if err != nil {
					return nil, err
				}

				return nil, SaveOrg(user, org.Name)
			default:
				return nil, fmt.Errorf("/admin/orgs - unimplemented method: %v", r.Method)
			}
		default:
			return nil, fmt.Errorf("adminHandler - unknown action: %v", action)
		}
	}()

	if err != nil {
		handleErr(w, err)
	} else {
		if responseObject == nil {
			responseObject = ""
		}
		okResponse(0, w, responseObject)
	}
}

func auth(userName string) (string, error) {
	_, err := GetUserDir(userName)
	return userName, err
}

func okResponse(reqID uint64, w http.ResponseWriter, thing interface{}) {
	res, err := json.Marshal(thing)
	if err != nil {
		handleErr(w, err)
		return
	}

	log.Printf("[%v]: OK RESPONSE: %v", reqID, string(res))

	_, err = w.Write(res)
	if err != nil {
		handleErr(w, err)
	}
}

func handleErr(w http.ResponseWriter, e error) {
	log.Printf("ERROR RESPONSE: %v", e)
	debug.PrintStack()
	http.Error(w, e.Error(), http.StatusInternalServerError)
}

func main() {
	http.HandleFunc("/", fileHandler)
	http.HandleFunc("/orgminder/", apiHandler)
	http.HandleFunc("/admin/", adminHandler)
	fmt.Printf("Listening on %s\n", PORT)
	http.ListenAndServe(PORT, nil)
}
