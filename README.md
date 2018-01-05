A web app that allows you to easily build a family tree. Motivated by parents with Alzheimer's who are forgetting their children's and grandchildren's names.

# Technical Overview

### Frontend
* Bootstrap <http://getbootstrap.com>
* Knockout <http://knockoutjs.com>
* RequireJS <http://requirejs.org>

### Backend
* Usergrid <https://usergrid.apache.org>

## Finding your way around
The following is a high level description of the code but it is assumed that you know how Knockout works.

---
### <a href="www/index.html">www/index.html</a>
* The home page, you will see at the bottom the use of require.js and a reference to "main" (see below)
* In the middle of this page you will see the view rendering - one of these will only be active at any one time and this will render the middle of the page. This code starts with this line:

      <!--ko with: views-->
      
* Whichever view enum is "current" causes that Knockout ViewModel to render; which is one of:
  * login-component
  * admin-component
  * family-tree-component
* Each of those components if made up of a similarly named html and js file.

---
### <a href="www/js/main.js">www/js/main.js</a>
* Where all the JavaScript starts, libraries are loaded, and the MainViewModel is initialized with "views" and "context"
  * "views": <a href="www/js/views.js">www/js/views.js</a> An object that tracks the current view state and only allows one to be "current" at a time.
  * "context": <a href="www/js/context.js">www/js/context.js</a> An object that contains all the values you see in the "ADMIN" view - the args you need to access the database basically: url, name, password, etc. Components will pass this information to the UsergridClient.
* Knockout Components are defined:
  * login-component:
    * <a href="www/login-component.html">www/login-component.html</a>
    * <a href="www/js/login-component.js">www/js/login-component.js</a>
  * admin-component:
    * <a href="www/admin-component.html">www/admin-component.html</a>
    * <a href="www/js/admin-component.js">www/js/admin-component.js</a>
  * family-tree-component:
    * <a href="www/family-tree-component.html">www/family-tree-component.html</a>
    * <a
    href="www/js/family-tree-component.js">www/js/family-tree-component.js</a>

---
### <a href="www/lib/api-client.js">www/lib/api-client.js</a>
* Simple client to the webserver API.

---
### Users
Password authentication is not yet implemented but to add a user to the system:
* `make new user=bob password=foo`



