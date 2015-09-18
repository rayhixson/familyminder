// -------------- BEGIN Person CLASS -------------

function Person(name, parent, spouse, bday, email) {
    this.id = name.toLowerCase();
    this.name = name;
    this.bday = bday;
    this.email = email;

    // relations
    this.children = [];
    this.parent = parent;
    
    if (parent != null) {
        parent.addChild(this);
    }
    this.spouse = spouse;
}

// Methods of Person
Person.prototype.addChild = function(child) {
    this.children[this.children.length++] = child;
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
////-----------CallOut-----------------
//function CallOut(nom) {
//    $("div#" + nom && "div.callout").show();
//}


function draw(p) {
    var s = "<div class='mainLevel'>";
    s += "<div class='mainPerson'><div id='"+p.id+"' class='person'></div><div class='hidden'></div>";
    
    if (p.spouse != null) {
        s += "<div class='mainPerson'><div id='"+p.spouse.id+"' class='person'> </div>";
    }
    s += "</mainLevel>";

    $(".mainContent").append(s);

    for (i in p.children) {
        s = drawKid(this, p.children[i]);
        $(".mainContent").append(s);
    }
    
    
}

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
    
    for (i in kid.children) {
        s += drawGrandkid(this, kid.children[i]);
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
    for (i in kid.children) {
        s += drawGreatGrandkid(this, kid.children[i]);
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

