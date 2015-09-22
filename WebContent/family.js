// -------------- BEGIN Person CLASS -------------

function Person(uuid, name, bday, email, image) {
	var self = this;
    self.id = name.toLowerCase();
    self.uuid = uuid;
    self.username = name;
    self.bday = bday;
    self.email = email;
    self.image = ko.observable(image);
    self.kidsLink = null;
    self.spouseLink = null;
    self.spouseName = ko.observable();
    
    self.dataTitle = ko.computed(function() { return "title-" + self.id; });
    self.secondImage = ko.computed(function() { return "images/" + self.id +"2.jpg" });
    self.mainImage = ko.computed(function() { return "images/" + self.id +".jpg"; });
    self.mailTo = ko.computed(function() { return "mailto:" + self.email; });
    
    // relations
    self.kids = ko.observableArray([]);
    
	// functions
	self.save = function() {
		saveUser(this.uuid, this.username, this.bday, 
				this.email, this.image, function() {
			personViewModel.showSavedAlert(true);
		});
	};

    self.makeChild = function(parent) {
    	addChildRelation(parent, self.uuid, function() {
    		parent.kids.push({ "username": self.username});
    	});
    }
    
    self.removeKid = function(kid) {
    	removeChildRelation(self, kid, function() {
    		var len = self.kids().length;
    		for (var i=0; i < len; i++) {
    			if (self.kids()[i].username == kid) {
    				self.kids.splice(i, 1);
    				break;
    			}
    		}
    	});
    }
}

function PersonViewModel() {
	var self = this;
	
	self.people = ko.observableArray([]);
	self.showSavedAlert = ko.observable(false);
	self.newPersonName = ko.observable();
	
	self.dad = new Person("1", "Dad", "Mar 28", "spoog@mon.com");
	
	self.addUser = function() {
		createUser(this.newPersonName(), function(person) {
			self.people.push(person);
			this.newPersonName = "";
		});
	};

	getUsers(function(people) {
		self.people(people);
		for (var i=0; i < self.people().length; i++) {
			var p = self.people()[i];
			derefRelations(p);
		}
	});
}

var personViewModel = new PersonViewModel();
ko.applyBindings(personViewModel);

// Methods of Person
Person.prototype.addKid = function(child) {
    this.kids[this.kids.length++] = child;
}

// Can be a child, grandchild, great, etc
// use this information in the future to figure out which css to use
Person.prototype.getRelation = function() {
    if (this.parent == null) {
        return "mainPerson";
    }
    
    if (this.parent.parent == null) {
        return "child";
    }
    
    if (this.parent.parent.parent == null) {
        return "grandchild";
    }

    return "greatGrandchild";
}


// -------------- END Person CLASS ----------------


function drawKid(parent, kid) {
    // find <div id="Dad"
    // and put the child below it
    var s = "<div id='" + kid.id + "' class='childSpace'>";
    s += "  <div class='child'>";
    s += "    <div id='" + kid.id + "' class='person'>";
//    s += "      <img src='http://glassbeadinc.com/tree/images/" + kid.id + ".jpg' class='img-circle'/>";
    s += "    </div>";
    s += "  <span class='divName' style='font-family: Arial, sans-serif; display: block;'>" + kid.name + " </span>";
    s += "  <span class='divBDay' style='font-family: Arial, sans-serif'>" + kid.bday + " </span>";
    s += "  </div>";
    
    // kid spouse
    if (kid.spouse != null) {
        s += "<div id='" + kid.spouse.id + "' class='childSpouse'>";
        s += "  <span class='divCSName' style='font-family: Arial, sans-serif'></span>";
        s += "  <div id='" + kid.spouse.id + "' class='person'>";
//        s += "    <img src='http://glassbeadinc.com/tree/images/" + kid.spouse.id + ".jpg' class='img-circle' />";
        s += "  </div>";
    s += "  <span class='divName' style='font-family: Arial, sans-serif; display: block;'>" + kid.spouse.name + " </span>";
    s += "  <span class='divBDay' style='font-family: Arial, sans-serif'>" + kid.spouse.bday + " </span>";
        s += "</div>";
    }
    
    for (i in kid.kids) {
        s += drawGrandkid(this, kid.kids[i]);
    }

    return s + "</div>";
}

function drawGrandkid(parent, kid) {
    var s = "<div id='" + kid.id + "' class='grandchildSpace'>";
    s += "  <span class='divGCName' style='font-family: Arial, sans-serif'></span>";
//    s += "  <br/><br/>";
    s += "  <div class='grandchild'>";
    s += "    <div id='" + kid.id + "' class='person'>";
//    s += "      <img src='http://glassbeadinc.com/tree/images/" + kid.id + ".jpg' class='img-circle'/>";
    s += "    </div>";
    s += "  <span class='divName' style='font-family: Arial, sans-serif; display: block;'>" + kid.name + " </span>";
    s += "  <span class='divBDay' style='font-family: Arial, sans-serif'>" + kid.bday + " </span>";
    s += "  </div>";

    if (kid.spouse != null) {
        s += "<div id='" + kid.spouse.id + "' class='grandchildSpouse'>";
        s += "  <span class='divGCSName' style='font-family: Arial, sans-serif'></span>";
  //      s += "  <br/>";
        s += "  <div id='" + kid.spouse.id + "' class='person'>";
 //       s += "    <img src='http://glassbeadinc.com/tree/images/" + kid.spouse.id + ".jpg' class='img-circle'/>";
        s += "  </div>";
    s += "  <span class='divName' style='font-family: Arial, sans-serif; display: block;'>" + kid.spouse.name + " </span>";
    s += "  <span class='divBDay' style='font-family: Arial, sans-serif'>" + kid.spouse.bday + " </span>";
        s += "</div>";
    }

    // still within the grandchildSpace
    for (i in kid.kids) {
        s += drawGreatGrandkid(this, kid.kids[i]);
    }

    return s + "</div>";
}

function drawGreatGrandkid(parent, kid) {
    var s = "<div id='" + kid.id + "' class='greatGrandchild'>";
    s += "  <span class='divGGCName' style='font-family: Arial, sans-serif'></span>";
 //   s += "  <br/>";
    s += "  <div id='" + kid.id + "' class='person'>";
//    s += "    <img src='http://glassbeadinc.com/tree/images/" + kid.id + ".jpg' class='img-circle'/>";
    s += "  </div>";
    s += "  <span class='divName' style='font-family: Arial, sans-serif; display: block;'>" + kid.name + " </span>";
    s += "  <span class='divBDay' style='font-family: Arial, sans-serif'>" + kid.bday + " </span>";
    s += "</div>";
    
    return s;
}


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
