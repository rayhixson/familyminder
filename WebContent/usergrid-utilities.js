/**
 * 
 */
var HOST = 'http://localhost:8080';
var ORG = "grannyminder";
var APP = "gminder";

function getApp() {
	var url = '/'+ORG+'/'+APP;
	
	http(url, 'GET', null, function(data) {
		$("#app code").html(JSON.stringify(data));
	});
}

function getUsers() {
	var url = '/'+ORG+'/'+APP+'/users';
	
	http(url, 'GET', null, function(data) {
		$("#raw").append(JSON.stringify(data, null, 2));
		
		var html = '';
		var people = '';
		var len = data.entities.length;
		for (var i=0; i < len; i++) {
			var e = data.entities[i];
			html += "<hr/>";
			html += '<form id="saveform-' + e.uuid + '">';
			html += 'ID: <input id="id" value="'+e.uuid+'" type="text" disabled="true" size="40"></input><br/>';
			html += 'Name: <input id="username" value="'+e.username+'" type="text"></input><br/>';
			html += 'Email: <input id="email" value="'+e.email+'" type="text"></input><br/>';
			if (e.metadata.connections) {
				html += '<div class="kids">' + e.metadata.connections.children + "</div>"; 
			} else {
				html += "No kids";
			}
			html += "<br/>";
			html += 'Image URL: <input id="image" value="'+e.picture+'" type="text" size="100"></input><br/>';
			html += '<img src="' + e.picture + '" width="100" height="100"/><br/>';
			html += '<input type="button" value="Save Changes"'
				+ ' onclick="saveUser($(\'#saveform-'+e.uuid+' > #id\').val(), $(\'#saveform-'+e.uuid+' > #username\').val(), $(\'#saveform-'+e.uuid+' > #email\').val(), $(\'#saveform-'+e.uuid+' > #image\').val());"></input><br/>';
			html += "</form>";
			
			people += '<option value="'+e.uuid+'">'
				+ e.username + '</option>';
		}
		$("#users").html(html);
		$("#father").html(people);
		$("#child").html(people);
		
		// now get the kids
		$(".kids").each(function(i, el) {
			var kurl = '/'+ORG+'/'+APP+$(el).text();
			// find dads uid in this link
			var dad = $(el).text().split('/')[2];
			http(kurl, 'GET', null, function(data) {
				//console.log("Kiddo: " + JSON.stringify(data, null, 2));
				var html = 'Kids: ';
				var len = data.entities.length;
				for (var i=0; i < len; i++) {
					if (i > 0) {
						html += ", ";
					}
					html += data.entities[i].username
						+ '<button onclick="removeKid(\'' + dad + '\', \'' + data.entities[i].username + '\');">'
						+ 'x</button>';
				}
				
				$(el).html(html);
			});
		});
	});
}

function removeKid(dad, child) {
	var url = '/'+ORG+'/'+APP+'/users/'+dad+'/children/users/'+child
	http(url, 'DELETE', null, function(data) {
		getUsers();
	});
}

function showToken(token) {
	$("#loggedin").show();
	$("#token").append(token);
	$("#login").hide();
}

function showLogin() {
	$("#loggedin").hide();
	$("#login").show();
}

function logout() {
	Cookies.remove('token');
	showLogin();
}

function login(name, password) {
    var args = "grant_type=password&username="+name+"&password="+password;

    var url = '/'+ORG+'/'+APP+'/token';

    http(url, 'GET', args, function (data) {
    	var token = data.access_token;

		Cookies.set('token', token, { expires: 30 })
		showToken(token);
	});
}

function createUser(username, email, imgUrl) {
   	var postData = {
        'username': username,
        'picture': imgUrl,
       	'email': email
    };
   	
    var url = '/'+ORG+'/'+APP+'/users';
    http(url, 'POST', JSON.stringify(postData), function (data) {
	   	getUsers();
	});
}

function saveUser(id, username, email, imgUrl) {
   	var postData = {
        'username': username,
        'picture': imgUrl,
       	'email': email
    };
   	
    var url = '/'+ORG+'/'+APP+'/users/'+id;
    http(url, 'PUT', JSON.stringify(postData), function (data) {
	   	getUsers();
	});
}

function relate(dad, child) {
	if (dad == child) {
		alert("One cannot father oneself.");
		return false;
	}
	var url = '/'+ORG+'/'+APP+'/users/'+dad+'/children/'+child;
   	http(url, 'POST', null, function(data) {
   		getUsers();
	});
}

function http(url, method, data, callback) {

	var headers = null;
	if (method == 'POST') {
		headers = {
			'Content-Type': 'application/json'		
		};
	}
	
	var token = Cookies.get('token');
    if (token) {
        headers = {'Authorization' : 'Bearer ' + token};
    }

	var uri = HOST + url;
	
	$.ajax({
		url: uri,
		data: data,
		type: method,
		headers: headers,
		dataType: "json"
	})
		.done(function(data, status, xhr) {
			if (method == 'POST')
				console.log("Done: " + xhr.responseText);
			callback(data);
		})
		.fail(function(xhr, status, err) {
			alert("Fail to "+method+": " + status +", " + err + ", "+ xhr.responseText);
	});
}
