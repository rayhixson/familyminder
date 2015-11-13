/*
 *  This is the enum of all views
 * Usage:
 * var views = require('views');
 *
 * to check the view:
 *   views.LOGIN.isCurrent() ? ...
 *
 * to set the view:
 *   views.LOGIN.setCurrent();
 */

define(["knockout"], function(ko) {
    var viewsEnum = function() {
        var self = this;

        self._View = function(name) {
            var loc = this;
            loc._name = name;
            loc.isCurrent = ko.observable(false);
            
            loc.setCurrent = function() {
                for (var p in self.Views) {
                    if (self.Views[p]._name !== loc._name) {
                        self.Views[p].isCurrent(false);
                    }
                }
                loc.isCurrent(true);
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

    return viewsEnum();
});

