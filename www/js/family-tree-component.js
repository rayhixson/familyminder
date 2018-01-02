define(function (require) {
    var ko = require('knockout'),
        context = require('js/context'),
        html = require('text!html/family-tree-component.html'),
        ApiClient = require('api-client'),
        $ = require('jquery');

    function personFromEntity(entity, parent) {
	    var p = new Person(entity.uuid, entity.name, entity.birthday,
			               entity.email, entity.picture, entity.picture2, entity.is_spouse);

	    if (entity.child_ids) {
			p.kidsLink(entity.child_ids);
		}
		if (entity.spouse) {
			p.spouseLink(entity.spouse);
		}

        p.parent(parent);

	    return p;
    }

    function Person(uuid, name, bday, email, img, img2, isSpouse) {
	    var self = this;
        self.uuid = ko.observable(uuid);
        self.name = ko.observable(name);
        self.bday = ko.observable(bday);
        self.email = ko.observable(email);
        self.image = ko.observable(img ? img : 'images/default.jpg');
        self.image2 = ko.observable(img2 ? img2 : 'images/default.jpg');
        // WARNING: the existence of these links does not mean that
        // the relationship exists - it means it did at one time
        self.kidsLink = ko.observable("");
        self.spouseLink = ko.observable("");
        self.isSpouse = ko.observable(isSpouse);

	    // need to bind just the names in the UI and then use this info in an event to
	    // link to the actual person in the db
	    self.spouseUuid = ko.observable();

        // A Person object - used to update the parent when this child gets deleted
        // -- I think we can delete this
        self.parent = ko.observable();

        // A Person object
        self.spouse = ko.observable();

        // Logic about the data model we are imposing:
        self.canHaveKids = ko.pureComputed(function() {
            // great grand kids can't have kids
            var isGreatGrandKid = (self.parent() &&
                                   self.parent().parent() &&
                                   self.parent().parent().parent());


            // Spouses can't have kids
            return !self.isSpouse() && !isGreatGrandKid;
        });

        self.canHaveSpouse = ko.pureComputed(function() {
            // can't have a spouse if they already have one
            // or are themselves a spouse
            return (!self.spouse() && !self.isSpouse());
        });

        self.canBeDeleted = ko.pureComputed(function() {
            // don't delete dad (the root person)
            // or anyone with kids
            // dad and spouses don't have a parent
            // so if they have a dad or are a spouse then it's ok to delete
            var haveDependents = self.kids().length > 0 || self.spouse();
            return (self.parent() || self.isSpouse()) && !haveDependents;
        });

        // An Array of Person objects
        self.kids = ko.observableArray([]);

        // --- use this attribute when creating a new spouse of this person ---
        self.newSpouseName = ko.observable();
        // --- use this attribute when creating a new child of this person ---
        self.newChildName = ko.observable();

        // NON-OBSERVABLE

        self.markedForDelete = false;

        // managing the state of Modals
        self.okToClose = ko.observable(false);

        // Toggle the Modals to close
        self.closeModal = function() {
            self.okToClose(true);
            self.okToClose(false);
        };

	    // -------- Behaviors ----------

        self.defineImage = function(name, callback) {
            console.log("Image define: " + name);
            // 1. see if image exists on server:
            var img = "/images/" + name.toLowerCase() + ".jpg";
            $.ajax({
                url: context.homeUrl() + img,
                type: "GET"
            })
                .done(function(resp, status, xhr) {
                    console.log("That exists: " + img);
                    callback(img);
                })
                .fail(function(xhr, status, err) {
                    console.log("That does not exist: " + img);
                    // 2. if image does not exist, use the default
                    callback('images/default.jpg');
                });
        };

        self.createPerson = function(newName, callback) {

            var data = {
                'name': newName
            };

            var person;
            context.client.createPerson(data, function(err, data) {
                if (err) {
                    context.handleError(err);
                } else {
			        person = personFromEntity(data, null);
                    callback(person);

                    // does the server already have images?
                    person.defineImage(newName, function(imageName) {
                        person.image(imageName);

                        person.defineImage(newName+"2", function(imageName) {
                            person.image2(imageName);

                            person.savePerson();
                        });
                    });
                }
		    });
        };

	    self.savePerson = function() {
   	        var data = {
				'uuid': self.uuid(),
                'name': self.name(),
                'picture': self.image(),
                'picture2': self.image2(),
                'birthday': self.bday(),
       	        'email': self.email()
            };

            context.client.savePerson(data, function(err, data) {
                if (err) {
                    context.handleError(err);
                } else {
                    self.closeModal();
                }
		    });
	    };

	    self.deletePerson = function() {
            context.client.deletePerson(self.uuid(), function(err, data) {
                if (err) {
                    context.handleError(err);
                } else {
                    self.markedForDelete = true;
                    self.closeModal();
                }
            });
	    };

        self.addSpouse = function() {

            // reset any previous error dialog
            context.stopShowErrorAlert();

            self.createPerson(self.newSpouseName(), function(person) {
			    self.spouse(person);
                person.isSpouse(true);
			    self.newSpouseName(null);

                // then relate it to this parent
                context.client.makeSpouse(self.uuid(), person.uuid(), function(err, data) {
                    if (err) {
                        context.handleError(err);
                    } else {
                        self.closeModal();
                    }
                });
            });
        };

        self.addKid = function() {
            // reset any previous error dialog
            context.stopShowErrorAlert();

            self.createPerson(self.newChildName(), function(person) {
			    self.kids.push(person);
                person.parent(self);
			    self.newChildName(null);

                // then relate it to this parent
                context.client.addKid(self.uuid(), person.uuid(), function(err, data) {
                    if (err) {
                        self.handleError(err);
                    } else {
                        self.closeModal();
                    }
                });
            });
        };
    };

    function FamilyTreeViewModel() {
        var self = this;

	    self.people = ko.observableArray([]);
	    self.peopleNames = ko.observableArray([]);

	    // need to bind just the names in the UI and then use this info in an event to
	    // link to the actual person in the db
	    self.newPersonName = ko.observable();

	    self.dad = ko.observable();

        //	Functions

	    self.getDad = function() {
            context.client.getDad(function(err, d) {
                if (err) {
                    context.handleError(err);
                } else {
                    var p = personFromEntity(d, null);
			        self.dad(p);
			        self.derefRelations(p);
                }
		    });
	    };

        self.derefRelations = function(parent) {
	        // Get the kids
	        if (parent.kidsLink()) {
		        var kds = [];

				console.log("-------> " + parent.kidsLink())

				var len = parent.kidsLink().length;
				for (var i=0; i < len; i++) {
					context.client.getPerson(parent.kidsLink()[i], function(err, kdata) {
						if (err) {
							context.handleError(err);
						} else {
				            var p = personFromEntity(kdata, parent);
                            parent.kids.push(p);
                            p.parent(parent);
				            self.derefRelations(p);
			            }
					});
				}
	        }

	        if (parent.spouseLink().length > 0) {
                context.client.getPerson(parent.spouseLink(), function(err, kdata) {
                    if (err) {
                        context.handleError(err);
                    } else {
			            var p = personFromEntity(kdata, null);
			            parent.spouse(p);
			            parent.spouseUuid(p.uuid());
                    }
		        });
	        }
        };

        /*
         * This method traverses the family tree handling things that need to be
         * done after bootstrap has done modal closings.
         */
        self.sweep = function(person) {
            if (!person) {
                // start with dad and delete everything marked
                self.sweep(self.dad());
                return;
            }

            for (var i=0; i < person.kids().length; i++) {
                self.sweep(person.kids()[i]);
            }

            if (person.spouse() && person.spouse().markedForDelete) {
                person.spouse(null);
                person.spouseLink(null);
            }

            person.kids.remove(function(k) {
                return k.markedForDelete;
            });

            return;
        };

        // INITIALIZE
        self.getDad();
    };

    return {
        viewModel: FamilyTreeViewModel,
        template: html
    };
});
