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
)

const serveDir = "www"
const index = "index.html"
const PORT = ":9090"

const DUMP_REQUESTS = false

//var validPath = regexp.MustCompile("^/(edit|save|view)/([a-zA-Z0-9]+)$")

var tokenPath = regexp.MustCompile("^/orgminder/(.*)/token$")
var userPath = regexp.MustCompile("^/orgminder/(.*)/users(/.*)?")
var childPath = regexp.MustCompile("^/orgminder/(.*)/users(/.*)/children(/.*)?$")

func fileHandler(w http.ResponseWriter, r *http.Request) {
	//log.Printf("Serve: %v", r.URL.Path)
	http.ServeFile(w, r, serveDir+r.URL.Path)
}

func mgmtHandler(w http.ResponseWriter, r *http.Request) {
	log.Printf("-------------- %v: %v", r.Method, r.URL.Path)
	var buf bytes.Buffer
	if _, err := buf.ReadFrom(r.Body); err != nil {
		log.Printf("Failed to read: %v", err)
		return
	}
	if err := r.Body.Close(); err != nil {
		log.Printf("Failed to close: %v", err)
	}

	parts := strings.Split(r.URL.Path, "/")
	action := parts[2]

	switch action {
	case "token":
		login := Login{}
		err := json.Unmarshal(buf.Bytes(), &login)
		if err != nil {
			handleErr(w, err)
			return
		}

		// this is where the admin logs in - just let it go
		log.Printf("Allowing management login indiscriminately")
		okResponse(w, &login)
	case "orgs":
		orgs, err := GetOrgs()
		log.Printf("Orgs: %v", orgs)
		if err != nil {
			handleErr(w, err)
		} else {
			okResponse(w, orgs)
		}
	default:
		log.Printf("mgmtHandler - unknown action: %v", action)
	}
}

func apiHandler(w http.ResponseWriter, r *http.Request) {
	log.Printf("-------------- %v: %v", r.Method, r.URL.Path)
	if DUMP_REQUESTS {
		bytes, err := httputil.DumpRequest(r, true)
		if err != nil {
			log.Printf("Failed to Dump: %v", err)
			return
		}
		log.Printf("Request: %v", string(bytes))
	}

	parts := strings.Split(r.URL.Path, "/")
	family := parts[2]
	action := parts[3]

	// identify the verb after the user id
	if action == "users" && len(parts) >= 6 {
		action = parts[5]
	}

	log.Printf("Family: %v, Action: %v", family, action)

	var buf bytes.Buffer
	if _, err := buf.ReadFrom(r.Body); err != nil {
		log.Printf("Failed to read: %v", err)
		return
	}
	if err := r.Body.Close(); err != nil {
		log.Printf("Failed to close: %v", err)
	}

	if r.Method == "POST" || r.Method == "PUT" {
		log.Printf("Body: %v", buf.String())
	}

	switch action {
	case "token":
		tokenHandler(w, family, buf.Bytes())
	case "users":
		switch r.Method {
		case "GET":
			getUsersHandler(w, family, parts[4])
		case "PUT":
			saveUserHandler(w, family, parts[4], buf.Bytes())
		case "POST":
			createNewUserHandler(w, family, buf.Bytes())
		case "DELETE":
			deleteUserHandler(w, family, parts[4])
		default:
			log.Printf("Unknown [users] method: %v\n", r.Method)
		}
	case "revoketokens":
		userID := parts[4]
		switch r.Method {
		case "PUT":
			logoutUserHandler(w, family, userID)
		default:
			log.Printf("Unknown [revoketokens] method: %v\n", r.Method)
		}
	case "children":
		userID := parts[4]
		switch r.Method {
		case "POST":
			addChildHandler(w, family, userID, parts[6])
		default:
			log.Printf("Unknown [children] method: %v\n", r.Method)
		}
	case "spouse":
		userID := parts[4]
		switch r.Method {
		case "POST":
			addSpouseHandler(w, family, userID, parts[6])
		default:
			log.Printf("Unknown [spouse] method: %v\n", r.Method)
		}
	default:
		log.Printf("Unknown action: %v", action)
	}
}

func logoutUserHandler(w http.ResponseWriter, family, userID string) {
	log.Printf("Logout: which is currently a noop")
	okResponse(w, nil)
}

func addSpouseHandler(w http.ResponseWriter, family, userID, spouseID string) {
	spouse, err := GetUser(family, spouseID)
	if err != nil {
		handleErr(w, err)
		return
	}

	user, err := GetUser(family, userID)
	if err != nil {
		handleErr(w, err)
		return
	}

	user.AddSpouse(spouse)
	okResponse(w, &spouse)
}

func deleteUserHandler(w http.ResponseWriter, family, userID string) {
	user, err := GetUser(family, userID)
	if err != nil {
		handleErr(w, err)
		return
	}

	err = user.Delete()
	if err != nil {
		handleErr(w, err)
		return
	}
	okResponse(w, &user)
}

func addChildHandler(w http.ResponseWriter, family, parentID, childID string) {
	child, err := GetUser(family, childID)
	if err != nil {
		handleErr(w, err)
		return
	}

	parent, err := GetUser(family, parentID)
	if err != nil {
		handleErr(w, err)
		return
	}

	parent.AddChild(child)
	okResponse(w, &parent)
}

func createNewUserHandler(w http.ResponseWriter, family string, buf []byte) {
	u := User{}
	err := json.Unmarshal(buf, &u)
	if err != nil {
		handleErr(w, err)
		return
	}

	existingUser, err := GetUserByName(family, u.Username)
	if err != nil && err != ErrUserNotFound {
		handleErr(w, err)
		return
	}

	if existingUser != nil {
		handleErr(w, fmt.Errorf("User [%v] for family [%v] exists", u.Username, family))
		return
	}

	u.Uuid = NewID()
	u.Familyname = family
	err = u.Save()
	if err != nil {
		handleErr(w, err)
	} else {
		okResponse(w, &u)
	}
}

func saveUserHandler(w http.ResponseWriter, family string, who string, buf []byte) {
	u := User{}
	err := json.Unmarshal(buf, &u)
	if err != nil {
		handleErr(w, err)
		return
	}

	// delete this code why is it here!!!
	if u.Uuid == "" {
		u.Uuid = NewID()
	}

	u.Familyname = family
	err = u.Save()
	if err != nil {
		handleErr(w, err)
	} else {
		okResponse(w, nil)
	}
}

func getUsersHandler(w http.ResponseWriter, family string, who string) {
	var u *User
	var err error
	if IsID(who) {
		u, err = GetUser(family, who)
	} else {
		u, err = GetUserByName(family, who)
	}

	if err != nil {
		handleErr(w, err)
	} else {
		okResponse(w, &u)
	}
}

func tokenHandler(w http.ResponseWriter, family string, buf []byte) {
	login := Login{}
	err := json.Unmarshal(buf, &login)
	if err != nil {
		handleErr(w, err)
		return
	}

	log.Printf("tokenHandler: Family: %v, body: %+v", family, login)
	_, err = GetUserByName(family, login.Username)

	if err != nil {
		handleErr(w, err)
	} else {
		okResponse(w, &login)
	}
}

func okResponse(w http.ResponseWriter, thing interface{}) {
	res, err := json.Marshal(thing)
	if err != nil {
		handleErr(w, err)
		return
	}

	log.Printf("OK RESPONSE: %v", string(res))

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
	http.HandleFunc("/management/", mgmtHandler)
	fmt.Printf("Listening on %s\n", PORT)
	http.ListenAndServe(PORT, nil)
}

type Login struct {
	Username  string `json:"username"`
	Password  string `json:"password"`
	GrantType string `json:"grant_type"`
}
