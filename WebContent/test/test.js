var ViewsEnum = function() {
    var self = this;
    
    self._View = function(name) {
        var loc = this;
        loc._name = name;
        loc._current = false;
        
        loc.isCurrent = function() { return loc._current; };
        loc.setCurrent = function() {
            for (var p in self.Views) {
                if (self.Views[p]._name !== loc._name) {
                    self.Views[p]._current = false;
                }
            }
            loc._current = true;
        };
    };

    self.Views = {
        LOGIN: new self._View("LOGIN"),
        ADMIN: new self._View("ADMIN"),
        TREE: new self._View("TREE")
    };

    self.Views.LOGIN.setCurrent();

    return self.Views;
};

var check = function(t) {
    console.log("--> LOGIN: " + t.LOGIN.isCurrent());
    console.log("--> TREE: " + t.TREE.isCurrent());
    console.log("--> ADMIN: " + t.ADMIN.isCurrent());
};
            
var ViewsEn = ViewsEnum();

check(ViewsEn);

ViewsEn.TREE.setCurrent();

check(ViewsEn);
