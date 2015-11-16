/**
 * 
 */
define(function(require) {
    var $ = require('jquery');

    var APP_NAME_KEY = "fm_ug_app_name";
    var ORG_NAME_KEY = "fm_ug_org_name";
    var HOST_KEY = "fm_ug_host";

    /*
     * default ctor - resurrect from disk
     */
    var UgClient = function(isAdminClient) {
        this.isAdminClient = isAdminClient;

        this.tokenKey = isAdminClient ? "fm_ug_admin_token" : "fm_ug_family_token";

        this.token = this.get(this.tokenKey);
        this.ugHost = this.get(HOST_KEY);
        this.ugOrganization = this.get(ORG_NAME_KEY);
        this.appName = this.get(APP_NAME_KEY);
    };

    UgClient.prototype.create = function(ugHost, ugOrganization, appName, isAdminClient) {
        var client = new UgClient(isAdminClient);
        
        client.ugHost = ugHost;
        client.ugOrganization = ugOrganization;
        client.appName = appName;

        client.tokenKey = isAdminClient ? "fm_ug_admin_token" : "fm_ug_family_token";
        
        // save these for later
        client.set(ORG_NAME_KEY, ugOrganization);
        client.set(APP_NAME_KEY, appName);
        client.set(HOST_KEY, ugHost);
        
        return client;
    };

    UgClient.prototype.getAppName = function() {
        return this.get(APP_NAME_KEY);
    };

    UgClient.prototype.setAppName = function(appName) {
        this.set(APP_NAME_KEY, appName);
    };

    UgClient.prototype._buildUrl = function() {
        return this.ugHost + '/' + this.get(ORG_NAME_KEY) +
            '/' + this.get(APP_NAME_KEY);
    };

    UgClient.prototype.adminLogin = function(username, password, callback) {
        var url = this.ugHost + "/management/token";
        var data = {
            username: username,
            password: password,
            grant_type: "password"
        };

        var client = this;
        this._http(url, "POST", data, function(err, response) {
            if (!err) {
                client.set(client.tokenKey, response.access_token);
            }
            // either way invoke the callback
            callback(err, response);
        });
    };

    UgClient.prototype.isLoggedIn = function() {
        return (this.token != null);
    };

    /**
     * Auth a user and set the token in local storage for future calls
     */
    UgClient.prototype.login = function(username, password, callback) {
        var url = this._buildUrl() + "/token";
        var data = {
            username: username,
            password: password,
            grant_type: "password"
        };

        var client = this;

        this._http(url, "POST", data, function(err, response) {
            if (!err) {
                client.set(client.tokenKey, response.access_token);
            }
            // either way invoke the callback
            callback(err, response);
        });
    };

    UgClient.prototype.logout = function(username, callback) {
        localStorage.removeItem(this.tokenKey);
        
        var url = this._buildUrl() + "/users/" + username + "/revoketokens";

        this._http(url, "PUT", null, callback);
    };

    UgClient.prototype.set = function(key, arg) {
        localStorage.setItem(key, arg);
    };

    UgClient.prototype.get = function(key) {
        return localStorage.getItem(key);
    };

    /*
     * Expections options like this:
     * {
     *   endpoint : "users",
     *   method : "POST",
     *   body {
     *     username: "bob"
     *   }
     * }
     *
     */
    UgClient.prototype.request = function(options, callback) {
        var uri = this._buildUrl();
        if (!options.endpoint.startsWith('/')) {
            uri += '/';
        }
        uri += options.endpoint;

        this._http(uri, options.method, options.body, callback);
    };

    UgClient.prototype.adminRequest = function(options, callback) {
        var uri = this.ugHost;
        if (!options.endpoint.startsWith('/')) {
            uri += '/';
        }
        uri += options.endpoint;

        this._http(uri, options.method, options.body, callback);
    };

    UgClient.prototype._http = function(uri, method, data, callback) {
	    var headers = null;
	    if (method == 'POST' || method == 'PUT') {
		    headers = {
			    'Content-Type': 'application/json'		
		    };
	    }
	    
	    var token = this.get(this.tokenKey);
        if (token) {
            //headers = {'Authorization' : 'Bearer ' + token};
            uri += '?access_token=' + token;
        }

	    $.ajax({
		    url: uri,
		    data: JSON.stringify(data),
		    type: method,
		    headers: headers,
		    dataType: "json"
	    })
		    .done(function(resp, status, xhr) {
			    //if (method != 'GET') {
				console.log("URL: " + uri);
				console.log("Post Data: " + data);
				console.log("Response: " + JSON.stringify(resp, null, 2));
			    //}
			    if (callback) {
				    callback(null, resp);
			    }
		    })
		    .fail(function(xhr, status, err) {
			    console.log("Fail to "+method+": URL="+uri+"; " + status +", " + err + ", "+ xhr.responseText);
                var e = null;
                if (xhr.responseText) {
                    var r = JSON.parse(xhr.responseText);
                    e = r.error_description
                        ? r.error_description
                        : xhr.responseText;
                }
                if (!err) {
                    err = "Unknown failure";
                }
                if (e) {
                    err = e;
                }
                
                callback(err, xhr.responseText);
	        });
    };

    return UgClient;
});
/*    
function getUser(nameOrId, callback) {
	var url = '/'+ORG+'/'+APP+'/users/'+nameOrId;
	
	var person = null;
	http(url, 'GET', null, function(data) {
		$("#raw").append(JSON.stringify(data, null, 2));

		person = personFromEntity(data.entities[0]);
		
		callback(person);
	});
}

function getUsers(callback) {
	var url = '/'+ORG+'/'+APP+'/users';
	
	http(url, 'GET', null, function(data) {
		//$("#raw").append(JSON.stringify(data, null, 2));

		var parray = [];
		
		var len = data.entities.length;
		for (var i=0; i < len; i++) {
			var person = personFromEntity(data.entities[i]);
			parray.push(person);
		}
		
		callback(parray);
	});
}

function removeChildRelation(dad, child, callback) {
	var url = '/'+ORG+'/'+APP+'/users/'+dad.uuid()+'/children/users/'+child;
	http(url, 'DELETE', null, function(data) {
		callback();
	});
}

function removeSpouseRelation(person, callback) {
	// do they have an existing spouse?
	if (person.spouse()) {
		//var url = '/'+ORG+'/'+APP+'/users/'+person.uuid()+'/spouse/users/'+person.spouseName
		var url = '/'+ORG+'/'+APP+ person.spouseLink() + "/" + person.spouse().uuid();
		http(url, 'DELETE', null, callback);
	}
}

function addChildRelation(dad, child, callback) {
	if (dad.uuid == child) {
		alert("One cannot father oneself.");
		return false;
	}
	var url = '/'+ORG+'/'+APP+'/users/'+dad.uuid()+'/children/'+child;
   	http(url, 'POST', null, callback);
}

/**
 * Will first delete the old spouse relation if there is one 
 * @param person Person object
 * @param spouseUuid String of the uuid for a person
 * @param callback
 * @returns {Boolean}

function addSpouseRelation(person, spouseUuid, callback) {
	if (person.uuid() == spouseUuid) {
		alert("One cannot spouse oneself.");
		return false;
	}

	removeSpouseRelation(person);
	
	// if it's 'undefined' then this is just a delete
	if (spouseUuid && !spouseUuid.startsWith("undefined")) {
		var url = '/'+ORG+'/'+APP+'/users/'+person.uuid()+'/spouse/'+spouseUuid;
   		http(url, 'POST', null, callback);
	}
}

function createUser(username, callback) {
   	var postData = {
        'username': username
    };
   	
    var url = '/'+ORG+'/'+APP+'/users';
    http(url, 'POST', JSON.stringify(postData), function (data) {
 		var len = data.entities.length;
		for (var i=0; i < len; i++) {
			var person = personFromEntity(data.entities[i]);
			
			callback(person);
		}
	});
}

function saveUser(id, username, bday, email, imgUrl, callback) {
   	var postData = {
        'username': username,
        'picture': imgUrl,
        'birthday': bday,
       	'email': email
    };
   	
    var url = '/'+ORG+'/'+APP+'/users/'+id;
    http(url, 'PUT', JSON.stringify(postData), callback);
}
 */
