// -------------- BEGIN Person CLASS -------------

function personFromEntity(entity, parent, adminView) {
	var p = new Person(entity.uuid, entity.username, entity.birthday, 
			           entity.email, entity.picture, adminView);

	if (entity.metadata.connections) {
		if (entity.metadata.connections.children) {
			p.kidsLink(entity.metadata.connections.children);
		}
		if (entity.metadata.connections.spouse) {
			p.spouseLink(entity.metadata.connections.spouse);
		}
	}

    if (entity.metadata.connecting) {
        if (entity.metadata.connecting.spouse) {
            p.isSpouse(true);
        }
    }

    p.parent(parent);
	
	return p;
}

function Person(uuid, name, bday, email, img, adminView) {
	var self = this;
    self.id = ko.observable(name.toLowerCase());
    self.uuid = ko.observable(uuid);
    self.username = ko.observable(name);
    self.bday = ko.observable(bday);
    self.email = ko.observable(email);
    self.image = ko.observable(img ? img : 'images/default.jpg');
    self.kidsLink = ko.observable("");
    self.spouseLink = ko.observable("");
    self.isSpouse = ko.observable(false);

	// need to bind just the names in the UI and then use this info in an event to 
	// link to the actual person in the db
	self.spouseUuid = ko.observable();

    // A Person object - used to update the parent when this child gets deleted
    // -- I think we can delete this
    self.parent = ko.observable();
    
    // A Person object
    self.spouse = ko.observable();
    
    self.showAlert = ko.observable(false);
    self.showErrorAlert = ko.observable(false);
    self.errorMessage = ko.observable();

    // An Array of Person objects
    self.kids = ko.observableArray([]);

    // --- use this attribute when creating a new spouse of this person ---
    self.newSpouseUsername = ko.observable();
    // --- use this attribute when creating a new child of this person ---
    self.newChildUsername = ko.observable();

    // NON-OBSERVABLE
    self.adminView = adminView;

    self.markedForDelete = false;
    
    // managing the state of Modals
    self.okToClose = ko.observable(false);
    
    // Toggle the Modals to close
    self.closeModal = function() {
        self.okToClose(true);
        self.okToClose(false);
    };
    
	// -------- Behaviors ----------

    self.stopShowErrorAlert = function() {
        self.showErrorAlert(false);
        self.errorMessage(null);
    };

    self.handleError = function(err) {
        self.errorMessage(err.message);
        self.showErrorAlert(true);
    };
    
    self.createPerson = function(newUsername, callback) {
        var options = {
            method: 'POST',
            endpoint: 'users',
            body: { 'username': newUsername }
        };

        var person;
        self.adminView.ugClient.request(options, function(err, data) {
            if (err) {
                self.handleError(err);
            } else {
			    person = personFromEntity(data.entities[0], null, self.adminView);
                callback(person);
            }
		});
    };

	self.savePerson = function() {
   	    var options = {
            method: 'PUT',
            endpoint: 'users/' + self.uuid(),
            body: {
                'username': self.username(),
                'picture': self.image(),
                'birthday': self.bday(),
       	        'email': self.email()
            }
        };

        self.adminView.ugClient.request(options, function(err, data) {
            if (err) {
                self.handleError(err);
            } else {
                self.closeModal();
            }
		});
/*
		self.addSpouseRelation(function() {
			self.derefRelations(self);
		});
*/
	};

	self.deletePerson = function() {
        alert("TRYING>>>");
        var options = {
            method: 'DELETE',
            endpoint: 'users/' + self.uuid()
        };

        self.adminView.ugClient.request(options, function(err, data) {
            if (err) {
                self.handleError(err);
            } else {
                self.markedForDelete = true;
                self.closeModal();
            }
        });
	};

    self.removeCurrentSpouseRelation = function(callback) { 
        // remove the current spouse to make room for a new one
        if (self.spouse()) {
            var options = {
                method: 'DELETE',
                endpoint: self.spouseLink() + '/' + self.spouse().uuid()
            };

            self.adminView.ugClient.request(options, function(err, data) {
                if (err) {
                    self.handleError(err);
                }
                callback();
            });
        }
    };

    /**
     * OLD STYLE - DELETE
     * Will first delete the old spouse relation if there is one 
     * @param person Person object
     * @param spouseUuid String of the uuid for a person
     * @param callback
     * @returns {Boolean}
     */
    self.addSpouseRelation = function(callback) {
	    if (self.uuid() == self.spouseUuid()) {
		    alert("One cannot spouse oneself.");
		    return false;
	    }

	    self.removeCurrentSpouseRelation();
	    
	    // if it's 'undefined' then this is just a delete
	    if (self.spouseUuid() && !self.spouseUuid().startsWith("undefined")) {
            var options = {
                method: 'POST',
                endpoint: 'users/' + self.uuid() + '/spouse/' + self.spouseUuid()
                // data: null
            };

            self.adminView.ugClient.request(options, function(err, data) {
                if (err) {
                    self.handleError(err);
                } else {
                    callback();
                }
            });
	    }
        return true;
    };

    self.addSpouse = function() {
        // reset any previous error dialog
        self.stopShowErrorAlert();

        self.createPerson(self.newSpouseUsername(), function(person) {
			self.spouse(person);
			self.newSpouseUsername(null);

            // then relate it to this parent
            var options = {
                method: 'POST',
                endpoint: 'users/' + self.uuid() + '/spouse/' + person.uuid()
                // data: null
            };

            self.adminView.ugClient.request(options, function(err, data) {
                if (err) {
                    self.handleError(err);
                } else {
                    self.closeModal();
                }
            });
        });
    };
	
    // OLD style - delete
    self.makeChildRelation = function(parent) {
        if (parent.uuid() == self.uuid()) {
            throw new MinderError('One cannot father oneself.');
            return false;
        }

        var options = {
            method: 'POST',
            endpoint: 'users/' + parent.uuid() + '/children/' + self.uuid()
            // data: null
        };

        self.adminView.ugClient.request(options, function(err, data) {
            if (err) {
                self.handleError(err);
            } else {
    		    parent.kids.push(self);
            }
    	});
    };

    self.addKid = function() {
        // reset any previous error dialog
        self.stopShowErrorAlert();
        
        self.createPerson(self.newChildUsername(), function(person) {
			self.kids.push(person);
            person.parent(self);
			self.newChildUsername(null);

            // then relate it to this parent
            var options = {
                method: 'POST',
                endpoint: 'users/' + self.uuid() + '/children/' + person.uuid()
                // data: null
            };

            self.adminView.ugClient.request(options, function(err, data) {
                if (err) {
                    self.handleError(err);
                } else {
                    self.closeModal();
                }
            });
        });
    };
            
    /**
     * @param kid String kids' username
     */
    self.removeKid = function(kidUsername) {
        var options = {
            method: 'DELETE',
            endpoint: 'users/' + self.uuid() + '/children/users/' + kidUsername
        };

        self.adminView.ugClient.request(options, function(err, data) {
            if (err) {
                self.handleError(err);
            } else {
                // deleted from db, now update the local
                // collection of kids
                self.kids.remove(function(k) {
                    return k.username() == kidUsername;
                });
            }
    	});
    };
}

function PersonViewModel(adminView, dadsName) {
	var self = this;
    self.adminView = adminView;
    self.dadsName = dadsName;
	
	self.people = ko.observableArray([]);
	self.peopleNames = ko.observableArray([]);

	// need to bind just the names in the UI and then use this info in an event to 
	// link to the actual person in the db
	self.newPersonName = ko.observable();
	
	self.dad = ko.observable();
	
	//	Functions
	
	self.getDad = function() {
        var options = {
            type: "users",
            username: dadsName
        };
        
        self.adminView.ugClient.getEntity(options, function(err, d) {
            if (err) {
                throw new MinderError(err);
            } else {
                var p = personFromEntity(d.getEntity(), null, self.adminView);
			    self.dad(p);
			    self.derefRelations(p);
            }
		});
	};

    self.derefRelations = function(parent) {
	    // Get the kids
	    if (parent.kidsLink()) {
		    var kds = [];

            var options = {
                method: "GET",
                endpoint: parent.kidsLink()
            };

            self.adminView.ugClient.request(options, function(err, kdata) {
                if (err) {
                    throw new MinderError(err);
                } else {
			        var len = kdata.entities.length;
			        for (var i=0; i < len; i++) {
				        var p = personFromEntity(kdata.entities[i], parent, self.adminView);
                        parent.kids.push(p);
				        self.derefRelations(p);
			        }
                }
		    });
	    }
        
	    if (parent.spouseLink().length > 0) {
            var options = {
                method: "GET",
                endpoint: parent.spouseLink()
            };

            self.adminView.ugClient.request(options, function(err, kdata) {
                if (err) {
                    throw new MinderError(err);
                } else {
			        var p = personFromEntity(kdata.entities[0], null, self.adminView);
			        parent.spouse(p);
			        parent.spouseUuid(p.uuid());
                }
		    });
	    }
    };
	/*
	self.getAllPeople = function() {
		getUsers(function(peoples) {
			for (var i=0; i < peoples.length; i++) {
				var p = peoples[i];
				self.people.push(p);
				derefRelations(p);
			}
			self.updatePeopleNames();
		});
	};
*/
	
	self.updatePeopleNames = function() {
		var len = self.people().length;
		self.peopleNames.push("");
		for (var i=0; i < len; i++) {
			self.peopleNames.push(self.people()[i].uuid);
		}
	};

	// old style - can we delete?
	self.addUser = function() {
        var options = {
            method: 'POST',
            endpoint: 'users',
            body: { 'username': self.newPersonName() }
        };

        self.adminView.ugClient.request(options, function(err, data) {
            if (err) {
                throw new MinderError(err);
            } else {
                if (data.entities.length > 0) {
			        var person = personFromEntity(data.entities[0], null, self.adminView);
			        self.people.push(person);
			        self.updatePeopleNames();
			        this.newPersonName = "";
                }
            }
		});
	};

    /*
     * This method traverses the family tree handling things that need to be
     * done after bootstrap has done modal closings.
     */
    self.sweep = function() {
        // start with dad and delete everything marked
        self.sweepPrivate(self.dad());
    };

    self.sweepPrivate = function(person) {
        for (var i=0; i < person.kids().length; i++) {
            self.sweepPrivate(person.kids()[i]);
        }
            
        person.kids.remove(function(k) {
            return k.markedForDelete;
        });
    };

    // INITIALIZE
    self.getDad();
}

// -------------- END Person CLASS ----------------


// create the family
/*
var mom = new Person("Mom", null, dad, "Dec 14");
var dad = new Person("Dad", null, mom, "Dec 31");

var chipper = new Person("Chipper", null, marieta, "Sept 27");
var marieta = new Person("Marieta", dad, chipper, "June 22");
var troy = new Person("Troy", null, megan, "B-Day");
var megan = new Person("Megan", marieta, troy, "Oct 25");
var masha = new Person("Masha", null, nick, "B-Day");
var nick = new Person("Nick", marieta, masha, "March 29");
new Person("Sylvie", megan, null, "B-Day");
new Person("Liam", megan, null, "B-Day");
new Person("Elizabeth", nick, null, "B-Day");

var margie = new Person("Margie", dad, null, "Nov 5");
var peter = new Person("Peter", null, null, "B-Day");
new Person("Jade", margie, peter, "Jan 8");
var braden = new Person("Braden", null, null, "B-Day");
new Person("Nina", margie, braden, "Feb 17");

var julie = new Person("Julie", null, tony, "Apr 24", "jewel_anne@yahoo.com");
var tony = new Person("Tony", dad, julie, "Dec 29", "tonyalferez@yahoo.com");
new Person("Arielle", tony, null, "July 13");
new Person("Mariquia", tony, null, "Nov 21");
new Person("Haley", tony, null, "Sep 11");

var rosie = new Person("Rosie", dad, null, "Dec 26th");
new Person("Ben", rosie, null, "Nov 11");
new Person("Mary", rosie, null, "B-Day");

var tim = new Person("Tim", null, francie, "June 18");
var francie = new Person("Francie", dad, tim, "Aug 25");
new Person("Kaleb", francie, null, "B-Day");
new Person("David", francie, null, "June 21");
*/
