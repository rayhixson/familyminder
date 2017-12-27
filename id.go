package main

// NewID generates a new uuid or panics if it fails
import (
	"log"
	"regexp"

	uuid "github.com/nu7hatch/gouuid"
)

// The only panic possible here should be /dev/unrandom is unreadable
// which shouldn't happen in practice unless something is configured wrong
func NewID() string {
	id, err := uuid.NewV4()
	if err != nil {
		log.Panic(err)
	}
	return id.String()
}

const IDPattern = "[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}"

var IDRegexp = regexp.MustCompile(IDPattern)

// IsID checks a string to determine if its a vertex id (uuid)
func IsID(id string) bool {
	return IDRegexp.MatchString(id)
}
