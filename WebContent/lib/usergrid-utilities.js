/**
 * 
 */
define(function(require) {
    var $ = require('jquery');

    /*
     * 
     */
    var UgClient = function(ugHost, ugOrganization, appName, isAdminClient) {
        this.isAdminClient = isAdminClient;
        
        this.ugHost = ugHost;
        this.ugOrganization = ugOrganization;
        this.appName = appName;

        this.tokenKey = isAdminClient ? "fm_ug_admin_token" : "fm_ug_family_token";

        this.token = localStorage.getItem(this.tokenKey);
    };

    UgClient.prototype._buildUrl = function() {
        return this.ugHost + '/' + this.ugOrganization +
            '/' + this.appName;
    };

    UgClient.prototype.isLoggedIn = function() {
        return (this.token != null);
    };

    /**
     * Auth a user and set the token in local storage for future calls
     */
    UgClient.prototype.login = function(username, password, callback) {
        var url = this._buildUrl() + "/token";
        
        if (this.isAdminClient) {
            url = this.ugHost + "/management/token";
        }

        // don't reuse the old token if there is one
        this.token = null;
        
        var data = {
            username: username,
            password: password,
            grant_type: "password"
        };

        var client = this;

        this._http(url, "POST", data, function(err, response) {
            if (!err) {
                localStorage.setItem(client.tokenKey, response.access_token);
                client.token = response.access_token;
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

        // admin type request?
        if (options.endpoint.startsWith("management")) {
            uri = this.ugHost;
        }
        
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
	    
        if (this.token) {
            //headers = {'Authorization' : 'Bearer ' + token};
            uri += '?access_token=' + this.token;
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
				console.log("Post Data: " + JSON.stringify(data));
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
