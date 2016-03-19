sessionStorage.session = 'xyz';
sessionStorage.username = 'ershadi-mo';var t;

if (!window.console) { window.console = {}; }
if (!window.console.log) { window.console.log = function () {}; }
$.support.cors = true;

var a = (function () {
'use strict';
var urls = {
	SERVER_1: 'http://100.80.0.175',
	SERVER_2: 'http://10.255.135.92',
	SERVER_3: 'http://100.80.0.177',
	SERVER_4: 'http://185.4.29.188', // only "cgi-bin/cpni" script on this server
	CPNI: '/cgi-bin/cpni',
	FCPNI: '/fcpni',
	actions: {
		GET_AUTH_URL: 'GetAuthURL',
		GET_DATE: 'GetDate',
		GET_GROUPS: 'Getgroups',
		AC_USERNAME: 'AcUsername',
		GET_USER_INFO: 'GetUserInfo',
		SET_USER_ADMIN_ACCESS_LIST: 'SetUserAdminAccessList',
		SET_USER_VIEW_ACCESS_LIST: 'SetUserViewAccessList',
		GET_USER_VIEW_ACCESS_LIST: 'GetUserViewAccessList',
		GET_USER_ADMIN_ACCESS_LIST: 'GetUserAdminAccessList',
		GET_MY_ADMIN_ACCESS_LIST: 'GetMyAdminAccessList',
		GET_USERS_WITH_ADMIN_ACCESS: 'GetUsersWithAdminAccess',
		GET_USERS_WITH_VIEW_ACCESS: 'GetUsersWithViewAccess',
		GET_MY_PERMISSION_LIST: 'GetMyPermissionList',
		SEND_MAIL_BILL: 'SendMailBill',
		GET_JOB_STATUS: 'GetJobStatus',
		GET_USER_PERMISSION_LIST: 'GetUserPermissionList',
		GET_USERS_WITH_PERMISSION: 'GetUsersWithPermission',
		ADD_USER_PERMISSION: 'AddUserPermission',
		DEL_USER_PERMISSION: 'DelUserPermission',
		LOGOUT: 'Logout'
	},
	get returnUrl() {
		return window.location.href;
	},
	get mainServer() {
		return this.SERVER_2;
	},
	get mainScript() {
		return this.FCPNI;
	},
	get mainUrl() {
		return this.mainServer + this.mainScript;
	}
},
general = {
	currentSession: window.sessionStorage.session,
	currentUser: {
		username: '',
		email: '',
		fullnameFa: '',
		fullNameEn: '',
		roles: {
			serviceAdmin: false,
			localAdmin: false,
			manager: false,
			emailer: false
		},
		permissions: {
			recordsMaster: false
		},
		roleReqSuccess: false,
		roleReqFail: false
	},
	currentProfile: {
		username: '',
		fullnameFa: '',
		fullnameEn: ''
	},
	currentTab: 0,
	authUrl: '',
	treeStructure: undefined,
	localmanagerTreeLoaded: false,
	formatUserInfo: function (user) {
		//console.log(arguments.callee.caller.toString());
		if (!user) { throw new Error('general.formatUserInfo():  Empty user.'); }
		var nameRow = '',
			fullnameArr = [],
			fullnameFa = '',
			fullnameEn = '',
			firstname = '',
			lastname = '',
			number = '',
			result;
		if (typeof user.ldap_cn !== 'undefined') {
			nameRow = Base64.decode( user.ldap_cn );
		} else if (typeof user.ldap_dn !== 'undefined') {
			Base64.decode( user.ldap_dn ).split(',').forEach(function (i) {
				if ( i.slice(0, 3) === 'CN=' ) {
					nameRow = i.slice(3);
					return;
				}
			});
		}
		fullnameArr = nameRow.split(' - ');
		fullnameFa = fullnameArr[1] +' '+ fullnameArr[0];
		fullnameEn = Base64.decode( user.ldap_givenname ) +' '+ Base64.decode( user.ldap_sn );
		firstname = fullnameArr[1];
		lastname = fullnameArr[0]; 
		
		if (typeof user.number === 'string') {
			number = user.number.slice(4);
		}
		result = {
			username: user.username,
			fullnameFa: fullnameFa,
			fullnameEn: fullnameEn,
			firstname: firstname,
			lastname: lastname,
			email: user.email,
			title: Base64.decode( user.ldap_title ),
			number: number
		};
		if ( typeof user.photo === 'string' && !util.isEmptyString(user.photo) ) {
			result.photo = urls.mainServer + user.photo;
		}
		return result;
	}
},
util = {
	isObject: function (v) {
		return (
			v &&
			typeof v === 'object' &&
			typeof v !== null &&
			Object.prototype.toString.call(v) === "[object Object]"
		) ? true : false;
	},
	isArray: function (v) {
		if ( typeof Array.isArray === 'function' ) {
			return Array.isArray(v);
		}
		return (
			v &&
			typeof v === 'object' &&
			typeof v.length === 'number' &&
			typeof v.splice === 'function' &&
			!v.propertyIsEnumerable('length') &&
			Object.prototype.toString.call(v) === "[object Array]"
		) ? true : false;
	},
	isEmptyString: function (v) {
		return ( typeof v === 'string'  &&  v.length === 0 ) ? true : false;
	},
	objectLength: function (o) {
		if ( this.isObject(o) ) {
			return Object.keys(o).length;
		}
	},
	extend: function () {
		var args = Array.prototype.slice.call(arguments),
			len = args.length,
			arr = [],
			objects = [],
			first, last,
			result;
			
		if (len === 1) {
			first = args[0];
			if ( this.isArray(first)  &&  first.length > 1 ) {
				last = first.pop();
				objects = first;
			} else if ( this.isObject(first) ){
				result = Object.create(first);
			}
		} else if (len === 2) {
			first = args[0];
			last = args[len-1];
			if ( this.isObject(first) ) {
				result = Object.create(first);
			}
		} else if (len > 2) {
			last = args.pop();
			objects = args;
		}
		
		if (objects.length !== 0) {
			arr.push( {} );
			objects.forEach(function (el, i) {
				if ( this.isObject(el) ) {
					Object.keys(el).forEach(function (k) {
						arr[i][k] = el[k];
					});
					arr.push( Object.create(arr[i]) );
				}
			});
			result = arr[arr.length-1];
		}
		
		if ( typeof last !== 'undefined'  &&  this.isObject(last) ) {
			Object.keys(last).forEach(function(key) {
				result[key] = last[key];
			});
		}
		return result;
	},
	getCommentsInside: function (selector) {
		return $(selector).contents().filter( function () { return this.nodeType == 8; } );
	}
},
instantiatePubsub = function () {
	var subscribers = {},
	getSubscribers = function () {
		return subscribers;
	},
	subscribe = function (evt, fn, par) {
		var events,
			add = function (str) {
				if (typeof subscribers[str] === 'undefined') {
					subscribers[str] = [];
				}
				subscribers[str].push({
					fn: fn,
					par: par
				});
			};
		
		if (typeof evt === 'string') {
			if ( evt.indexOf(' ') === -1 ) {
				add(evt);
			} else {
				events = evt.split(' ');
				events.forEach(function (el) {
					add(el);
				});
			}
		} else if ( util.isObject(evt) ) {
			Object.keys(evt).forEach(function (i) {
				if (typeof subscribers[i] === 'undefined') {
					subscribers[i] = [];
				}
				if (typeof evt[i] === 'function') {
					subscribers[i].push({
						fn: evt[i],
						par: undefined
					});
				} else if ( util.isObject(evt[i]) ) {
					subscribers[i].push({
						fn: evt[i].fn,
						par: evt[i].par
					});
				}
			});
		}
	},
	on = function (evt, fn, par) { // alies
		subscribe(evt, fn, par);
	},
	publish = function (evtName, evtData) {
		if (typeof subscribers[evtName] !== 'undefined') {
			subscribers[evtName].forEach(function (i) {
				i.fn(evtData, i.par);
			});
		}
	};
	return {
		getSubscribers: getSubscribers,
		subscribe: subscribe,
		on: on,
		publish: publish
	};
},
ajax = (function () {
	var fns = {
		done: {},
		fail: {},
		always: {}
	},
	num = 0,
	u = function () {
		var r = 'a' + num;
		num += 1;
		return r;
	},
	callback = function (type, uid, a, b, c) {
		var o = fns[type],
			f = o[uid];
		if (typeof f === 'function') {
			f(a, b, c);
		}
	},
	ajax = function (o) {
		var s = (o) ? o : {},
			uid = u();
		
		ajax.id = uid;
		
		if ( s.data.session !== false ) {
			s.data.session = general.currentSession;
		}
		
		$.ajax({
			url: urls.mainUrl,
			type: 'GET',
			dataType: 'json',
			data: s.data,
			beforeSend: s.beforeSend
		})
		.done(function (data, txt, obj) {
			var r = data[0],
				eCode = r.error_code,
				eMsg = r.error_msg;
			
			if (eCode  &&  typeof eCode === 'number'  &&  !o.skip) {
				if (eCode === -3) {
					
					a.dialog.setCallback(function () {
						callback('done', uid, data, txt, obj);
					});
					a.dialog.setMsg('permission_denied');
					//alertify.error(eMsg);
					a.dialog.show();
					
				} else if (eCode === -4) {
					
					a.dialog.setCallback(function () {
						window.location.reload(true);
					});
					a.dialog.setMsg('invalid_session');
					alertify.error(eMsg);
					a.dialog.show();
					
				}
				return;
			}
			
			callback('done', uid, data, txt, obj);
		})
		.fail(function (obj, txt, err) {
			alertify.error(data.action + ' failed. <br>'+ txt +'<br>'+ err);
			
			callback('fail', uid, obj, txt, err);
			
		})
		.always(function (obj, txt) {
			
			callback('always', uid, obj, txt);
			
		});
		return ajax;
	};
	ajax.done = function (fn) {
		fns.done[this.id] = fn;
		return this;
	};
	ajax.fail = function (fn) {
		fns.fail[this.id] = fn;
		return this;
	};
	ajax.always = function (fn) {
		fns.always[this.id] = fn;
		return this;
	};
	ajax.callbacks = fns;
	
	return ajax;
}()),
session = (function () {
	var instance = util.extend( instantiatePubsub() ),
		authFinished = false,
	
	getAuthUrl = function () {
		ajax({
			data: {
				action: urls.actions.GET_AUTH_URL,
				return_url: urls.returnUrl
			},
			skip: true
		})
		.done(function (data) {
			authFinished = true;
			general.authUrl = data[0].auth_url;
		})
		.fail(function () {
			setTimeout(function () {
				getAuthUrl();
			}, 500);
		});
		
		/*$.ajax({
			url: urls.mainUrl,
			type: 'GET',
			dataType: 'json',
			data: {
				action: urls.actions.GET_AUTH_URL,
				return_url: urls.returnUrl
			}
		})
		.done(function (data) {
			general.authUrl = data[0].auth_url;
		})
		.fail(function () {
			setTimeout(function () {
				getAuthUrl();
			}, 500);
		});*/
	},
	sessionExist = function () {
		if ( !general.currentSession ) {
			return false;
		} else if (typeof general.currentSession === 'string') {
			return true;
		}
	},
	redirect = function () {
		if (authFinished) {
			window.location.replace(general.authUrl);
		} else {
			setTimeout(function () {
				redirect();
			}, 50);
		}
	},
	isSessionValid = function (session, valid, invalid) {
		var that = this;
		
		ajax({
			data: {
				action: urls.actions.GET_USER_INFO
			},
			skip: true
		})
		.done(function (data) {
			var user = data[0][sessionStorage.username],
				rdyUser;
			if ( typeof data[0][sessionStorage.username] !== 'undefined' ) {
				rdyUser = general.formatUserInfo(user);
				valid(rdyUser);							// playing with fire
				instance.publish('valid', rdyUser);		// playing with fire
			} else if ( typeof data[0].error_msg === 'string' ) {
				invalid();
			}
		})
		.fail(function () {
			setTimeout(function () {
				isSessionValid(session, valid, invalid);
			}, 2000);
		});
		/*$.ajax({
			url: urls.mainUrl, type: 'GET', dataType: 'json',
			data: {
				action: urls.actions.GET_USER_INFO,
				session: general.currentSession
			}		
		})
		.done(function (data) {
			var user = data[0][sessionStorage.username],
				rdyUser;
			if ( typeof data[0][sessionStorage.username] !== 'undefined' ) {
				rdyUser = general.formatUserInfo(user);
				valid(rdyUser);							// playing with fire
				instance.publish('valid', rdyUser);		// playing with fire
			} else if ( typeof data[0].error_msg === 'string' ) {
				invalid();
			}
		})
		.fail(function () {
			setTimeout(function () {
				isSessionValid(session, valid, invalid);
			}, 2000);
		});*/
	},
	check = function (main) {
		if ( !sessionExist() ) {
			redirect();
		} else if ( sessionExist() ) {
			isSessionValid(general.currentSession, main, redirect);	// main if valid, redirect if not valid
		}
	};
	
	getAuthUrl();
	
	instance.check = check;
	return instance;
}()),
sessionInvalid = function (obj) {
	var err;
	if ( util.isObject(obj) ) {
		err = obj.error_code;
		if (err  &&  typeof err === 'number') {
			if (err === -3) {
				a.dialog.setCallback(undefined);
				a.dialog.setMsg('permission_denied');
				a.dialog.show();
				return false;
			} else if (err === -4) {
				a.dialog.setMsg('invalid_session');
				a.dialog.setCallback(function () {
					window.location.reload(true);
				});
				a.dialog.show();
				alertify.error(obj.error_msg);
				return true;
			}
			//a.dialog.setMsg('idle');
			//a.dialog.setCallback(undefined);
			//a.dialog.setMsg('unknown_err');
			
		} else {
			return false;
		}
	} else {
		return false;
	}
},
currentUser = (function () {
	var updateProfile = function (user) {
		if (typeof user.photo === 'string') {
			$('.fn-current_user-profpic').attr({src: user.photo});
		}
		$('.fn-current_user-title').text(user.title);
		$('.fn-current_user-fullnamefa').text(user.fullnameFa);
	},
	setVars = function (user) {
		general.currentUser.username = user.username;
		general.currentUser.email = user.email;
		general.currentUser.fullnameFa = user.fullnameFa;
		general.currentUser.fullNameEn = user.fullNameEn;
	};
	return {
		setVars: setVars,
		updateProfile: updateProfile
	};
}()),
role = (function () {
	var instance = util.extend( instantiatePubsub() ),
	
	addTabs = function () {
		var roles = general.currentUser.roles,
			keyStr,
			extracted;
		for ( role in roles ) {
			if ( roles.hasOwnProperty(role) ) {
				if ( roles[role] === true ) {	// 'serviceAdmin'.replace(/([A-Z])/g, '_$1').toLowerCase()
					keyStr = role;
					extracted = keyStr.replace(/([A-Z])/g, '_$1').toLowerCase();
					$('.fn-'+ extracted +'-tab_link').removeClass('no-display'); // $('.fn-service_admin-tab_link').remove();
				}
			}
		}
	},
	setRole = function (perms) {
		if ( !util.isArray(perms) ) { throw new Error('role.determine():  Argument is not an array.'); }
		
		var result = {
			serviceAdmin: false,
			localAdmin: false,
			manager: false,
			emailer: false,
			recordsMaster: false
		};
		
		perms.forEach(function (i) {
			if ( i === 'PERM_SET_USER_ADMIN_ACCESS' ) {
				
				general.currentUser.roles.serviceAdmin = true;
				result.serviceAdmin = true;
				
			} else if ( i === 'PERM_SET_USER_VIEW_ACCESS' ) {
				
				general.currentUser.roles.localAdmin = true;
				result.localAdmin = true;
				
			} else if (i === 'PERM_GET_PERMISSION') {
				
				general.currentUser.roles.manager = true;
				result.manager = true;
				
			} else if (i === 'PERM_SEND_MAIL_BILL') {
				
				general.currentUser.roles.emailer = true;
				result.emailer = true;
				
			} else if (i === 'PERM_RECORDS_MASTER') {
				
				general.currentUser.permissions.recordsMaster = true;
				result.recordsMaster = true;

			}
		});
		instance.publish('determined', result);
		addTabs();
	},
	makeAjaxCall = function () {
		ajax({
			data: {
				action: urls.actions.GET_MY_PERMISSION_LIST
			}
		})
		.done(function (data) {
			general.currentUser.roleReqSuccess = true;
			setRole(data[0]);
		})
		.fail(function () {
			general.currentUser.roleReqFail = true;
		});
		
		/*$.ajax({
			url: urls.mainUrl,
			type: 'GET',
			dataType: 'json',
			data: {
				action: urls.actions.GET_MY_PERMISSION_LIST,
				session: general.currentSession
			}
		})
		.done(function (data) {
			general.currentUser.roleReqSuccess = true;
			setRole(data[0]);
		})
		.fail(function () {
			general.currentUser.roleReqFail = true;
			alertify.error('GetMyPermissionList failed.');
		});*/
	},
	determine = function () {
		makeAjaxCall();
	};
	
	instance.determine = determine;
	return instance;
}()),
instantiateAutoComp = function (root, submitFn) {
	root.trim();
	root += ' ';
	var input = $(root+'.fn-autoc-input'),
		rootEl = $(root+'.autoc'),
		itemsWrap = $(root+'.items-wrap'),
		table = $(root+'.autoc-suggestions'),
		tbody = $(root+'.autoc-suggestions > tbody'),
		currentItem = 0,
		reqStat = false,
		reqLog = 0,
		instance = util.extend( instantiatePubsub() ),
		
	
	setFocus = function (key) {
		if (typeof key !== 'number') { throw new Error('setFocus():  Argument is not a number.'); }
		var up = false,
			down = false,
			currentItemStr = '',
			el,
			items = tbody.children().length,
			wrapHeight = itemsWrap.prop('offsetHeight'),
			wrapScrollHeight = itemsWrap.prop('scrollHeight'),
			wrapScrollTop = itemsWrap.scrollTop(),
			elOffsetBott,
			elOffsetTop;
			
		if (key === 38) {
			up = true;  down = false;
		} else if (key === 40) {
			up = false; down = true;
		}
		
		if ( items !== 0 ) {
			if (down) {
				currentItem += 1;
				if (currentItem > items) {
					currentItem = 1;
				}
				currentItemStr = currentItem + '';
				rootEl.find('.focused').removeClass('focused');
				el = rootEl.find('#fn-num-' + currentItemStr );
				el.addClass('focused');
				input.val( el.contents().filter(':first-child').data().username );
				
				elOffsetBott = el.prop('offsetTop') + el.prop('offsetHeight');
				elOffsetTop = el.prop('offsetTop');
				if ( elOffsetBott > wrapHeight ) {
					itemsWrap.scrollTop( elOffsetBott - wrapHeight );
				}
				if (elOffsetTop === 0) {
					itemsWrap.scrollTop(0);
				}
				
			} else if (up) {
				
				currentItem -= 1;
				if (currentItem < 1 ) {
					currentItem = items;
				}
				currentItemStr = currentItem + '';
				rootEl.find('.focused').removeClass('focused');
				el = rootEl.find('#fn-num-' + currentItemStr );
				el.addClass('focused');
				input.val( el.contents().filter(':first-child').data().username );
				
				elOffsetTop = el.prop('offsetTop');
				elOffsetBott = el.prop('offsetTop') + el.prop('offsetHeight');
				if ( elOffsetTop < wrapScrollTop ) {
					itemsWrap.scrollTop( itemsWrap.scrollTop() - elOffsetTop );
				}
				if ( elOffsetBott ===  (wrapScrollHeight - 1) ) {
					itemsWrap.scrollTop(elOffsetBott);
				}
				
			}
		}
	},
	createHtml = function (arr) {
		var baseHtml = '',
			els = [],
			tr,
			counter = 1;
			
		baseHtml = util.getCommentsInside(table)[0].nodeValue.trim();
		
		arr.forEach(function (i) {
			var formatted = general.formatUserInfo(i),
				trId = '';
			tr = $.parseHTML(baseHtml)[0];
			tr = $(tr);
			if (formatted.photo) {
				tr.find('img')				.attr( 'src', formatted.photo	);
			}
			tr.find('.autoc-fullname-fa')	.text( formatted.fullnameFa		);
			tr.find('.autoc-title')			.text( formatted.title			);
			tr.find('.autoc-email')			.text( formatted.email			);
			tr.find('.item-wrap')			.attr('data-username', formatted.username);
			
			trId = tr.attr('id');
			tr.attr('id', trId + counter + '');
			
			els.push(tr[0]);
			counter += 1;
		});
		tbody.empty();
		currentItem = 0;
		els.forEach(function (i) {
			tbody.append(i);
		});
	},
	makeAjax = function (term) {
		var curr;
		reqLog += 1;
		curr = reqLog;
		
		ajax({
			data: {
				action: urls.actions.AC_USERNAME,
				term: term
			},
			beforeSend: function () {
				reqStat = false;
			}
		})
		.done(function (data) {
			reqStat = true;
			var resp = data[0],
				key,
				arr = [];
			
			for (key in resp) {
				if ( resp.hasOwnProperty(key) ) {
					arr.push( resp[key] );
				}
			}
			itemsWrap.removeClass('no-display');
			table.removeClass('no-display');
			
			if (reqStat === true && curr === reqLog) {
				createHtml(arr);
			}
		})
		.fail(function () {
			
		});
		/*$.ajax({
			url: urls.mainUrl,
			type: 'GET',
			dataType: 'json',
			data: {
				action: urls.actions.AC_USERNAME,
				session: general.currentSession,
				term: term
			},
			beforeSend: function () {
				reqStat = false;
			}
		})
		.done(function (data) {
			if (sessionInvalid(data[0])) { return; }
			reqStat = true;
			var resp = data[0],
				key,
				arr = [];
			
			for (key in resp) {
				if ( resp.hasOwnProperty(key) ) {
					arr.push( resp[key] );
				}
			}
			itemsWrap.removeClass('no-display');
			table.removeClass('no-display');
			
			if (reqStat === true && curr === reqLog) {
				createHtml(arr);
			}
		})
		.fail(function () {
			
		});*/
	},
	hide = function (e) {
		var inputVal = input.val();
		if( !$(e.target).closest(rootEl).length ) {
			if( !rootEl.hasClass('no-display') ) {
				itemsWrap.addClass('no-display');
				if ( util.isEmptyString(inputVal) ) {
					input.val('');
				}
			}
		}
	},
	keyup = function (e) {
		var arrowKey = false,
			enterKey = false,
			escapeKey = false,
			term = '',
			key = e.which,
			inputVal = $(this).val().trim();
			
		if (key === 37 || key === 38 || key === 39 || key === 40) {
			arrowKey = true;
		}
		if (key === 13) {
			enterKey = true;
			if ( tbody.children().length !== 0 ) {
				$(this).val( rootEl.find('.focused').contents().filter(':first-child').data().username );
				tbody.empty();
				currentItem = 0;
				submit( input.val() );
				itemsWrap.addClass('no-display');
				input.trigger('focus');
			}
		}
		if (key === 27) { // escape
			escapeKey = true;
		}
		
		if ( util.isEmptyString(inputVal) ) {
			tbody.empty();
			itemsWrap.addClass('no-display');
			currentItem = 0;
		} else if ( !arrowKey && !util.isEmptyString(inputVal) && !enterKey && !escapeKey) {
			term = $(this).val().trim();
			makeAjax( term );
		} else if (escapeKey) {
			itemsWrap.addClass('no-display');
		}
	},
	keydown = function (e) {
		// e.which === 37 // left
		// e.which === 39 // right
		// e.which === 38 // up
		// e.which === 40 // down
		var key = e.which;
		if ( key === 38 || key === 40) {
			setFocus(key);
		}
	},
	mouseenter = function () {
		var id = '',
			numStr = '',
			num = 0;
		id = $(this).attr('id');
		numStr = id.match(/[-]{1}\d{0,3}$/)[0].slice(1);
		num = parseInt(numStr, 10);
		currentItem = num;
		
		rootEl.find('.focused').removeClass('focused');
		$(this).addClass('focused');
		//$('#fn-autocomplete').val($(this).find('.item-wrap').data().username);
	},
	mouseleave = function () {
		currentItem = 0;
		$(this).removeClass('focused');
		//$('#fn-autocomplete').val($(this).find('.item-wrap').data().username);
	},
	click = function () {
		table.addClass('no-display');
		itemsWrap.addClass('no-display');
		input.val( $(this).find('.item-wrap').data().username );
		submit( input.val() );
	},
	submit = function (username) {
		instance.publish('select', username);
		if (typeof submitFn === 'function') {
			submitFn(username);
		}
	},
	defEvt = function (evtRoot) {
		$('html').on('click', hide);
		input.on({
			'keyup': keyup,
			'keydown': keydown
		});
		rootEl.on({
			'mouseenter': mouseenter,
			'mouseleave': mouseleave,
			'click': click
		}, '.fn-autoc-item');
	};
	
	defEvt();
	
	instance.rootEl = rootEl;
	instance.itemsWrap = itemsWrap;
	instance.table = table;
	instance.tbody = tbody;
	return instance;
},
autoc = (function () {
	var currentItem = 0,
		root = '',
		submitFn, submitFnContext,
		reqStat = false,
		reqLog = 0,
		
	getRoot = function () {
		return root;
	},
	getSubFn = function () {
		return submitFn;
	},
	getSubFnContext = function () {
		return submitFnContext;
	},
	setFocus = function (key) {
		if (typeof key !== 'number') { throw new Error('setFocus():  Argument is not a number.'); }
		var up = false,
			down = false,
			currentItemStr = '',
			el,
			items = $(getRoot() + '.autoc-suggestions > tbody').children().length,
			wrap = $(getRoot() + '.items-wrap'),
			wrapHeight = wrap.prop('offsetHeight'),
			wrapScrollHeight = wrap.prop('scrollHeight'),
			wrapScrollTop = wrap.scrollTop(),
			elOffsetBott,
			elOffsetTop,
			input = $(getRoot() + '.fn-autoc-input');
			
		if (key === 38) {
			up = true;  down = false;
		} else if (key === 40) {
			up = false; down = true;
		}
		
		if ( items !== 0 ) {
			if (down) {
				currentItem += 1;
				if (currentItem > items) {
					currentItem = 1;
				}
				currentItemStr = currentItem + '';
				$(getRoot() + '.focused').removeClass('focused');
				el = $(getRoot() + '#fn-num-' + currentItemStr );
				el.addClass('focused');
				input.val( el.contents().filter(':first-child').data().username );
				
				elOffsetBott = el.prop('offsetTop') + el.prop('offsetHeight');
				elOffsetTop = el.prop('offsetTop');
				if ( elOffsetBott > wrapHeight ) {
					wrap.scrollTop( elOffsetBott - wrapHeight );
				}
				if (elOffsetTop === 0) {
					wrap.scrollTop(0);
				}
				
			} else if (up) {
				
				currentItem -= 1;
				if (currentItem < 1 ) {
					currentItem = items;
				}
				currentItemStr = currentItem + '';
				$(getRoot() + '.focused').removeClass('focused');
				el = $(getRoot() + '#fn-num-' + currentItemStr );
				el.addClass('focused');
				input.val( el.contents().filter(':first-child').data().username );
				
				elOffsetTop = el.prop('offsetTop');
				if ( elOffsetTop < wrapScrollTop ) {
					wrap.scrollTop(elOffsetTop);
				}
				if (elOffsetTop > wrapHeight) {
					wrap.scrollTop(wrapScrollHeight - wrapHeight);
				}
			}
		}
	},
	createHtml = function (arr) {
		//var html = '';
		var baseHtml = '',
			els = [],
			tr,
			counter = 1;
			
		baseHtml = util.getCommentsInside(getRoot() + '.autoc-suggestions')[0].nodeValue.trim();
		
		arr.forEach(function (i) {
			var formatted = general.formatUserInfo(i),
				trId = '';
			tr = $.parseHTML(baseHtml)[0];
			tr = $(tr);
			if (formatted.photo) {
				tr.find('img')				.attr( 'src', formatted.photo	);
			}
			tr.find('.autoc-fullname-fa')	.text( formatted.fullnameFa		);
			tr.find('.autoc-title')			.text( formatted.title			);
			// tr.find('.autoc-username')		.text( formatted.username		);
			tr.find('.autoc-email')			.text( formatted.email			);
			tr.find('.item-wrap')			.attr('data-username', formatted.username);
			
			trId = tr.attr('id');
			tr.attr('id', trId + counter + '');
			
			els.push(tr[0]);
			counter += 1;
			/*
			html +=	'<tr>';
			html +=		'<td class="item-wrap">';
			html +=				'<img src="'+ formatted.photo+ '" alt="Profile Pic"/>';
			html +=				'<span class="autoc-fullname-fa">'	+ formatted.fullnameFa	+ '</span><br />';
			html +=				'<span class="autoc-title">'		+ formatted.title	+ '</span><br />';
			//html +=				'<span class="autoc-username">'		+ formatted.username	+ '</span><br />';
			html +=				'<span class="autoc-email">'		+ formatted.email	+ '</span>';
			html +=		'</td>';
			html +=	'</tr>';
			*/
		});
		$(getRoot() + '.autoc-suggestions > tbody').empty();
		currentItem = 0;
		els.forEach(function (i) {
			$(getRoot() + '.autoc-suggestions > tbody').append(i);
		});
		//$('.suggestions > tbody').html(html);
	},
	makeAjax = function (term) {
		var curr;
		reqLog += 1;
		curr = reqLog;
		
		ajax({
			data: {
				action: urls.actions.AC_USERNAME,
				term: term
			},
			beforeSend: function () {
				reqStat = false;
			}
		})
		.done(function (data) {
			reqStat = true;
			var resp = data[0],
				key,
				arr = [];
			
			for (key in resp) {
				if ( resp.hasOwnProperty(key) ) {
					arr.push( resp[key] );
				}
			}
			$(getRoot() + '.items-wrap').removeClass('no-display');
			$(getRoot() + '.autoc-suggestions').removeClass('no-display');
			
			if (reqStat === true && curr === reqLog) {
				createHtml(arr);
			}
			
		})
		.fail(function () {
			
		});
		/*$.ajax({
			url: urls.mainUrl,
			type: 'GET',
			dataType: 'json',
			data: {
				action: urls.actions.AC_USERNAME,
				term: term,
				session: general.currentSession
			},
			beforeSend: function () {
				reqStat = false;
			}
		})
		.done(function (data) {
			if (sessionInvalid(data[0])) { return; }
			reqStat = true;
			var resp = data[0],
				key,
				arr = [];
			
			for (key in resp) {
				if ( resp.hasOwnProperty(key) ) {
					arr.push( resp[key] );
				}
			}
			$(getRoot() + '.items-wrap').removeClass('no-display');
			$(getRoot() + '.autoc-suggestions').removeClass('no-display');
			
			if (reqStat === true && curr === reqLog) {
				createHtml(arr);
			}
			
		})
		.fail(function () {
			
		});*/
	},
	hide = function (e) {
		var el = $(getRoot() + '.autoc'),
			inputVal = $(getRoot() + '.fn-autoc-input').val();
			
		if( !$(e.target).closest(getRoot() + '.autoc').length ) {
			if( !el.hasClass('no-display') ) {
				$(getRoot() + '.items-wrap').addClass('no-display');
				if ( util.isEmptyString(inputVal) ) {
					$(getRoot() + '.fn-autoc-input').val('');
				}
			}
		}
	},
	keyup = function (e) {
		var arrowKey = false,
			enterKey = false,
			escapeKey = false,
			term = '',
			key = e.which,
			inputVal = $(this).val().trim();
			
		if (key === 37 || key === 38 || key === 39 || key === 40) {
			arrowKey = true;
		}
		if (key === 13) {
			enterKey = true;
			if ( $(getRoot() + '.autoc-suggestions > tbody').children().length !== 0 ) {
				$(this).val( $(getRoot() + '.focused').contents().filter(':first-child').data().username );
				$(getRoot() + '.autoc-suggestions > tbody').empty();
				currentItem = 0;
				submit( $(getRoot() + '.fn-autoc-input').val() );
				$(getRoot() + '.items-wrap').addClass('no-display');
				$(getRoot() + '.fn-autoc-input').trigger('focus');
			}
		}
		if (key === 27) { // escape
			escapeKey = true;
		}
		
		if ( util.isEmptyString(inputVal) ) {
			$(getRoot() + '.autoc-suggestions > tbody').empty();
			$(getRoot() + '.items-wrap').addClass('no-display');
			currentItem = 0;
		} else if ( !arrowKey && !util.isEmptyString(inputVal) && !enterKey && !escapeKey) {
			term = $(this).val().trim();
			makeAjax( term );
		} else if (escapeKey) {
			$(getRoot() + '.items-wrap').addClass('no-display');
		}
	},
	keydown = function (e) {
		// e.which === 37 // left
		// e.which === 39 // right
		// e.which === 38 // up
		// e.which === 40 // down
		var key = e.which;
		if ( key === 38 || key === 40) {
			setFocus(key);
		}
	},
	mouseenter = function () {
		var id = '',
			numStr = '',
			num = 0;
		id = $(this).attr('id');
		numStr = id.match(/[-]{1}\d{0,3}$/)[0].slice(1);
		num = parseInt(numStr, 10);
		currentItem = num;
		
		$(getRoot() + '.focused').removeClass('focused');
		$(this).addClass('focused');
		//$('#fn-autocomplete').val($(this).find('.item-wrap').data().username);
	},
	mouseleave = function () {
		currentItem = 0;
		$(this).removeClass('focused');
		//$('#fn-autocomplete').val($(this).find('.item-wrap').data().username);
	},
	click = function () {
		$(getRoot() + '.autoc-suggestions').addClass('no-display');
		$(getRoot() + '.items-wrap').addClass('no-display');
		$(getRoot() + '.fn-autoc-input').val( $(this).find('.item-wrap').data().username );
		submit( $(getRoot() + '.fn-autoc-input').val() );
	},
	submit = function (username) {
		var fn = getSubFn();
		if (typeof fn === 'function') {
			fn.call(getSubFnContext(), username);
		}
	},
	setCurrent = function (selector, fn, obj) {
		root = selector+' ';
		submitFn = fn;
		submitFnContext = obj;
	},
	
	defEvt = function (evtRoot) {
		$('body').on('click', hide);
		$(evtRoot + ' .fn-autoc-input').on('keyup', keyup);
		$(evtRoot + ' .fn-autoc-input').on('keydown', keydown);
		$(evtRoot + ' .autoc').on('mouseenter', '.fn-autoc-item', mouseenter);
		$(evtRoot + ' .autoc').on('mouseleave', '.fn-autoc-item', mouseleave);
		$(evtRoot + ' .autoc').on('click', '.fn-autoc-item', click);
	};
	
	return {
		getRoot: getRoot,
		getSubFn: getSubFn,
		setCurrent: setCurrent,
		defEvt: defEvt
	};
}()),
instantiateMonthpicker = function (root) {
	root.trim();
	root += ' '; 
	var instance = util.extend( instantiatePubsub() ),
		rootEl = $(root+'.mp-wrap'),
		input = $(root+'#fn-mp-input'),
		box = $(root+'.monthpicker'),
		yearEl = $(root+'.fn-mp-year'),
		months = $(root+'.fn-month'),
		nextBtn = $(root+'.fn-mp-next'),
		prevBtn = $(root+'.fn-mp-prev'),
		selectedDate = '',
		currentYear = parseInt( yearEl.text(), 10 ),
		yearLimit = currentYear,
	
	getAppropriateDate = function (month) {
		var prev;
		prev = month - 1;
		if (prev) {
			
		} else {
			res = month - 1;
		}
		return;
	},
	initialize = function (date) {
		var monthNum = date.month.number,
			yearNum = date.year.full,
			prev,
			year,
			month;
		
		prev = monthNum - 1;
		if ( prev !== 0 ) {
			year = yearNum+'';
			month = prev+'';
		} else if ( prev === 0 ) {
			year = (yearNum - 1)+'';
			month = 12+'';
		}
		
		selectedDate = year + month;
		currentYear = date.year.full;
		months.removeClass('selected');
		months.filter('[data-val='+month+']').addClass('selected');
		input.val( year.slice(-2) + '/' + month);
		instance.publish('select', selectedDate);
	},
	show = function (e) {
		e.stopPropagation();
		box.removeClass('no-display');
	},
	hide = function (e) {
		if( !$(e.target).closest('.monthpicker').length ) {
			if( box.is(":visible") ) {
				box.addClass('no-display');
			}
		}
	},
	next = function () {
		currentYear += 1;
		if ( currentYear <= yearLimit ) {
			$('.fn-mp-year').text(''+currentYear);
		} else {
			currentYear = yearLimit;
		}
	},
	prev = function () {
		currentYear -= 1;
		yearEl.text(currentYear+'');
	},
	select = function () {
		var year = $('.fn-mp-year').text(),
			month = $(this).data().val,
			selectedDate = year + month;
		input.val( year.slice(-2) + '/' + month);
		
		months.removeClass('selected');
		months.filter('[data-val='+month+']').addClass('selected');
		box.addClass('no-display');
		instance.publish('select', selectedDate);
	},
	defEvt = function () {
		$('html').on('click', hide);
		input.on('click', show);
		months.on('click', select);
		nextBtn.on('click', next);
		prevBtn.on('click', prev);
	};
	
	defEvt();
	
	instance.initialize = initialize;
	return instance;
},
instantiateDatepicker = function (root) {
	root.trim();
	root += ' '; 
	var instance = util.extend( instantiatePubsub() ),
		
		rootElSelector = '.datepicker',
		rootEl = $(root+rootElSelector),
		input = $(root+'.fn-dp-input'),
		box = $(root+'.box'),
		monthsWrap = $('.dp-months'),
		daysWrap = $('.dp-days'),
		currSecEl = $(root+'.fn-dp-currsec'),
		monthEls = $(root+'.fn-month'),
		dayEls = $(root+'.fn-day'),
		nextBtn = $(root+'.fn-dp-next'),
		prevBtn = $(root+'.fn-dp-prev'),
		clearBtn = $(root+'.fn-dp-clear'),
		todayBtn = $(root+'.fn-dp-today'),
		day30 = $(root+'.fn-dp-day30'),
		day31 = $(root+'.fn-dp-day31'),
		
		months = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'],
		index = 0,
		role = 'day',
		currYear = 0,
		currDay = 0,
		yearLimit = 0,
		selected = {
			year: 0,
			monthName: '',
			monthNumber: 0,
			day: 0
		},
		today = {
			year: 0,
			month: 0,
			day: 0
		},
	
	adjustMonth = function () {
		var month = currMonth().number,
		handle = function (el, wh) {
			if (wh === true) {
				el.text( el.data().val );
				el.addClass('fn-dp-day');
				el.on('click', selectDay);
			} else if (wh === false) {
				el.text('00');
				el.removeClass('fn-dp-day');
				el.removeClass('selected');
				el.off('click');
			}
		};
		
		if ( month <= 6 ) {
			handle(day31, true);
		} else if ( month >= 7  &&  month <= 11 ) {
			handle(day30, true);
			handle(day31, false);
		} else if (month === 12) {
			if (currYear % 4 === 0) { // kabise
				handle(day30, false);
				handle(day31, false);
			} else {
				handle(day31, false);
			}
		}
	},
	currMonth = function () {
		return {
			name: months[index],
			number: index + 1
		};
	},
	yearmonth = function () {
		return currMonth().name +' '+ currYear;
	},
	show = function (e) {
		e.stopPropagation();
		box.removeClass('no-display');
	},
	hide = function (e) {
		if( !$(e.target).closest(rootElSelector).length ) {
			if( box.is(":visible") ) {
				box.addClass('no-display');
			}
		}
	},
	highlightMonth = function () {
		monthEls.removeClass('selected');
		monthEls.filter('[data-val='+currMonth().number+']').addClass('selected');
	},
	highlightDay = function () {
		dayEls.removeClass('selected');
		dayEls.filter('[data-val='+currDay+']').addClass('selected');
	},
	setIndex = function (direction) {
		var next,
			prev, 
			realLength = months.length - 1;
		
		if ( direction === true ) {
			next = index + 1;
			index = ( next <= realLength ) ? next: 0;
		} else if ( direction === false ) {
			prev = index - 1;
			index = ( prev > 0 ) ? prev: realLength;
		}
	},
	switchRole = function () {
		if (role === 'day') {
			daysWrap.addClass('no-display');
			monthsWrap.removeClass('no-display');
			currSecEl.text(currYear);
			role = 'month';
		} else if (role === 'month') {
			monthsWrap.addClass('no-display');
			daysWrap.removeClass('no-display');
			currSecEl.text( yearmonth() );
			role = 'day';
		}
	},
	prev = function () {
		var n;
		if (role === 'day') {
			setIndex(false);
			adjustMonth();
			currSecEl.text( yearmonth() );
			highlightMonth();
		} else if (role === 'month') {
			n = currYear - 1;
			if ( n > 0 ) {
				currYear -= 1;
			}
			currSecEl.text(''+currYear);
		}
	},
	next = function () {
		var n;
		if (role === 'day') {
			setIndex(true);
			adjustMonth();
			currSecEl.text( yearmonth() );
		} else if (role === 'month') {
			n = currYear + 1;
			if ( n <= yearLimit ) {
				currYear += 1;
			}
			currSecEl.text(''+currYear);
		}
	},
	selectMonth = function () {
		var num = parseInt( $(this).data().val, 10),
			month = num - 1;
		
		index = month;
		currSecEl.text( yearmonth() );
		highlightMonth();
		adjustMonth();
		switchRole();
	},
	selectDay = function () {
		var day = $(this).data().val,
			forInp = day +' '+ yearmonth();
		
		currDay = day;
		selected.year = currYear;
		selected.monthName = currMonth().name;
		selected.monthNumber = currMonth().number;
		selected.day = day;
		input.data({
			year: currYear,
			month: currMonth().number,
			day: day
		});
		currSecEl.text( yearmonth() );
		input.val( forInp );
		highlightDay();
		box.addClass('no-display');
		
		instance.publish('select', selected);
	},
	clear = function () {
		monthEls.removeClass('selected');
		dayEls.removeClass('selected');
		input.val( '' );
		input.data({});
		box.addClass('no-display');
	},
	goToday = function () {
		currYear = today.year;
		index = today.month;
		currDay = today.day;
		
		adjustMonth();
		currSecEl.text( yearmonth() );
		input.val( currDay +' '+ yearmonth() );
		highlightMonth();
		highlightDay();
		
	},
	initialize = function (date) {
		currYear = date.year.full;
		index = date.month.number - 1;
		currDay = date.day.monthday.number;
		yearLimit = date.year.full;
		
		today.year = currYear;
		today.month = index;
		today.day = currDay;
		
		adjustMonth();
		currSecEl.text( yearmonth() );
		highlightMonth();
		highlightDay();
	},
	defEvt = function () {
		$('html').on('click', hide);
		input.on('click', show);
		currSecEl.on('click', switchRole);
		monthEls.on('click', selectMonth);
		dayEls.on('click', selectDay);
		nextBtn.on('click', next);
		prevBtn.on('click', prev);
		clearBtn.on('click', clear);
		todayBtn.on('click', goToday);
	};
	
	defEvt();
	
	instance.initialize = initialize;
	return instance;
},
instantiateTree = function (root, treeSelector, toolbarItemsSelector) {
	root.trim();
	treeSelector.trim();
	toolbarItemsSelector.trim();
	var	treeRdy = false,
		mainSelector = root+' '+treeSelector,
		treeParent = $(root+' .fn-'+treeSelector+'-parent'),
		treeDom = $(mainSelector),
		toolbarItems = $(root+' '+toolbarItemsSelector),
		toolbarPrefix = root+' #fn-'+treeSelector.slice(1)+'-',
		treeInstance,
		instance;
	
	
	treeInstance = $.jstree.create(mainSelector, {
		plugins: [
			//"grid"
			"checkbox"
			//"contextmenu", 
			// "dnd", 
			//"massload", 
			// "search", 
			// "sort", 
			// "state", 
			// "types", 
			// "unique", 
			// "wholerow", 
			// "changed", 
			// "conditionalselect"
		],
		types : {
			"default" : {
				//"icon" : "jstree-icon jstree-file"
				"disabled" : { 
					"check_node" : false, 
					"uncheck_node" : false 
				}
			},
			"demo" : {
			}
		}
	});
	instance = util.extend( instantiatePubsub(), (function () {
	var
	getTreeDom = function () {
		return treeDom;
	},
	getTreeInstance = function () {
		return treeInstance;
	},
	getObjName = function () {
		return root+' '+treeSelector+'.';
	},	
	setReadyData = function () {
		treeRdy = true;
		treeInstance.deselect_all(true);
		treeInstance.close_all();
	},
	openAll = function () {
		if ( $(this).hasClass('disabled') ) { return; }
		treeInstance.open_all();
		instance.publish('open_all');
	},
	closeAll = function () {
		if ( $(this).hasClass('disabled') ) { return; }
		treeInstance.close_all();
		instance.publish('close_all');
	},
	selectAll = function () {
		if ( $(this).hasClass('disabled') ) { return; }
		treeInstance.select_all();
		instance.publish('select_all');
	},
	deselectAll = function () {
		if ( $(this).hasClass('disabled') ) { return; }
		treeInstance.deselect_all();
		instance.publish('deselect_all');
	},
	disableAll = function () {
		treeInstance.settings.core.data.forEach(function (obj) {
			treeInstance.disable_node(obj.id);
		});
	},
	enableAll = function () {
		treeInstance.settings.core.data.forEach(function (obj) {
			treeInstance.enable_node(obj.id);
		});
	},
	selectedCount = function () {
		return treeInstance.get_selected().length;
	},
	show = function () {
		treeDom.removeClass('no-display');
	},
	hide = function () {
		treeDom.addClass('no-display');
	},
	getCustomSelection = function (selected) {
		var childless = [],
			withChild = [],
			groups = {
				forSend: [],
				forView: []
			},
			users = {
				forSend: [],
				forView: []
			},
			groupsAndUsers = [],
			userCount = 0,
			result;
			
		if ( selected &&
				util.isArray(selected) &&
				selected.length !== 0 ) {
			
			selected.forEach(function (item) { // extract childless and withChild node objects
				if (item.children.length === 0) { // childless node
					// $.inArray( item.text, childless ) === -1
					if ( childless.indexOf(item.text) === -1 ) { // item doesn't exists in our array
						childless.push(item);
						userCount += 1;
					}
					
				} else if (item.children.length !== 0) { // item has child
					withChild.push(item);
				}
			});
			childless.forEach(function (item) {
				var parent = treeInstance.get_node(item.parent);
				if ( parent.state.selected === false || item.parent === '#' ) {
					if (typeof item.icon === 'string') {	// file
						users.forSend.push(item.text);
						users.forView.push(item.text); // not good
						groupsAndUsers.push({
							text: item.text,
							icon: item.icon
						});
					} else if (typeof item.icon === 'undefined' || typeof item.icon === 'boolean') { // childless folder
					
						groups.forSend.push(item.id);
						groups.forView.push(item.text);
						groupsAndUsers.push(item.text);
					}
				}
			});
			withChild.forEach(function (item) { // [Object,
				if ( item.children.length !== 0 && item.state.selected === true ) { // completely selected folder
					var parent = treeInstance.get_node(item.parent);
					if ( parent.state.selected === false || item.parent === '#' ) {
						groups.forSend.push(item.id);
						groups.forView.push(item.text);
						groupsAndUsers.push(item.text);
					}
				}
			});
		}
		
		result = {
			users: users,
			groups: groups,
			groupsAndUsers: groupsAndUsers,
			userCount: userCount
		};
		return result;
	},
	getSelected = function (e, o) {
		//var action = o.action,
		var	selected,
			custom;
		
		/*if ( action &&
				(action === 'select_node' ||
				action === 'deselect_node' ||
				action === 'select_all' ||
				action === 'deselect_all') ) {
				
			selected = treeInstance.get_selected(true);
			if (selected) {
				getCustomSelection( selected );
			}
		}*/
		selected = treeInstance.get_selected(true);
		if (selected) {
			custom = getCustomSelection( selected );
		}
		return custom;
	},
	publishChange = function (e, o) {
		var action = o.action,
			selected;
		if ( action &&
				(action === 'select_node' ||
				action === 'deselect_node' ||
				action === 'select_all' ||
				action === 'deselect_all') ) {
				
			selected = treeInstance.get_selected(true);
			if (selected) {
				instance.publish('select_deselect');
			}
		}
	},
	setStruc = function (newStruc) {
		if ( treeInstance !== false ) {
			treeInstance.settings.core.data = newStruc;
		}
	},
	getStruc = function () {
		return treeInstance.settings.core.data;
	},
	refresh = function () {
		treeInstance.refresh();
	},
	defEvt = function () {
		treeDom.on('refresh.jstree', setReadyData);
		//treeDom.on('select_node.jstree  deselect_node.jstree  select_all.jstree  deselect_all.jstree', getSelected);
		//treeDom.on('changed.jstree', getSelected);
		treeDom.on('changed.jstree', publishChange);
		$(toolbarPrefix+'open_all').on('click', openAll);
		$(toolbarPrefix+'close_all').on('click', closeAll);
		$(toolbarPrefix+'select_all').on('click', selectAll);
		$(toolbarPrefix+'deselect_all').on('click', deselectAll);
	};
	
	defEvt();
	return {
		treeDom: treeDom,
		treeInstance: treeInstance,
		isTreeRdy: function () { return treeRdy; },
		toolbarItems: toolbarItems,
		toolbarPrefix: toolbarPrefix,
		getObjName: getObjName,
		openAll: openAll,
		closeAll: closeAll,
		selectAll: selectAll,
		deselectAll: deselectAll,
		disableAll: disableAll,
		enableAll: enableAll,
		selectedCount: selectedCount,
		show: show,
		hide: hide,
		getCustomSelection: getCustomSelection,
		getSelected: getSelected,
		getStruc: getStruc,
		setStruc: setStruc,
		refresh: refresh,
		defEvt: defEvt
	};
	}()));
	
	return instance;
},
misc = (function () {
	var time = (function () {
		var countTime = function (timestamps) {
			var date = new Date(timestamps),
				hour = date.getHours(),
				minute = date.getMinutes(),
				second = date.getSeconds(),
				secondCounter = second,
				minuteCounter = minute,
				hourCounter = hour,
				elSecond = $('.fn-time-second'),
				elMinute = $('.fn-time-minute'),
				elHour = $('.fn-time-hour');
			setInterval(function () {
				if (secondCounter === 60) {
					minuteCounter += 1;
					elMinute.html( (minuteCounter <= 9) ? '0'+minuteCounter : ''+minuteCounter );
					secondCounter = 0;
					elSecond.html( (secondCounter <= 9) ? '0'+secondCounter : ''+secondCounter );
					secondCounter += 1;
				} else {
					elSecond.html( (secondCounter <= 9) ? '0'+secondCounter : ''+secondCounter );
					secondCounter += 1;
				}
				
				if (minuteCounter === 60 ) {
					minuteCounter = 0;
					elMinute.html( (minuteCounter <= 9) ? '0'+minuteCounter : ''+minuteCounter );
					hourCounter += 1;
					elHour.html( (hourCounter <= 9) ? '0'+hourCounter : ''+hourCounter );
				}
				
				if ( hourCounter === 24 ) {
					hourCounter = 0;
					elHour.html( (hourCounter <= 9) ? '0'+hourCounter : ''+hourCounter );
				}
				
			}, 1000);
		},
		adjust = function (data) {
			var timestamp = parseInt(data.timestamp, 10),
				d = new Date(timestamp),
				week = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
				month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
				weekday = week[ d.getDay() ],
				monthName = month[ d.getMonth() ];
				
			$('.fn-endate-dayname').html( weekday.toUpperCase() );
			$('.fn-endate-daynumber').html( d.getDate() );
			$('.fn-endate-monthname').html( monthName.toUpperCase() );
			$('.fn-endate-year').html( d.getFullYear() );
			
			$('.fn-fadate-dayname').html(data.day.weekday.name);
			$('.fn-fadate-daynumber').html(data.day.monthday.name);
			$('.fn-fadate-monthname').html(data.month.name);
			var year = '' + data.year.full;
			$('.fn-fadate-year').html( year );
			
			$('.header-date').removeClass('hidden');
			
			$('.fn-time-hour').html( d.getHours() );
			$('.fn-time-minute').html( d.getMinutes() );
			$('.fn-time-second').html( d.getSeconds() );
			countTime(timestamp);
		};
		return adjust;
	}()),
	logout = function () {
		sessionStorage.removeItem('session');
		sessionStorage.removeItem('username');
		sessionStorage.removeItem('state');
		//for (key in sessionStorage) { if(sessionStorage.hasOwnProperty(key) ) { sessionStorage.removeItem(key) } }
		//Object.keys(sessionStorage).forEach(function (i) {sessionStorage.removeItem(i); });
		$('body').addClass('preloading');
		$('.header').addClass('no-display');
		$('.content').addClass('no-display');
		$('.footer').addClass('no-display');
		$('.my-preloader > h2').text('در حال خارج شدن از سامانه...');
		$('.my-preloader').removeClass('no-display');
		
		ajax({
			data: {
				action: urls.actions.LOGOUT
			}
		})
		.done(function () { // strange behaviour caused by href="", fixed by href="#"
			window.location.replace(general.authUrl);
		})
		.fail(function () {
			$('body').removeClass('preloading');
			$('.header').removeClass('no-display');
			$('.content').removeClass('no-display');
			$('.footer').removeClass('no-display');
			$('.my-preloader').addClass('no-display');
		});
		/*$.ajax({
			url: urls.mainUrl,
			type: 'GET',
			dataType: 'json',
			data: {
				action: urls.actions.LOGOUT,
				session: general.currentSession
			}
		})
		.done(function () { // strange behaviour caused by href="", fixed by href="#"
			window.location.replace(general.authUrl);
		})
		.fail(function () {
			alertify.error(urls.actions.LOGOUT + ' failed.');
			$('body').removeClass('preloading');
			$('.header').removeClass('no-display');
			$('.content').removeClass('no-display');
			$('.footer').removeClass('no-display');
			$('.my-preloader').addClass('no-display');
		});*/
	};
	
	return {
		time: time,
		logout: logout
	};
}()),
tab = (function () {
	var instance = util.extend( instantiatePubsub() ),
	
	show = function (e) {
		var target = $(this).data().tab;
		general.currentTab = target;
		$('.fn-tablink').removeClass('current');
		$(this).addClass('current');
		$('.tab-item').addClass('no-display');
		
		if (target === 1 || target === 2) {
			autoc.setCurrent('.mgmt', mgmt.profile.makeAjax, mgmt.profile);
			mgmt.tree.reset();
			mgmt.profile.reset();
			//adminList.reset();
			mgmt.counterList.reset();
			mgmt.recordList.reset();
		
			a.mgmt.counterList.refresh();
			a.mgmt.recordList.refresh();
		}
		if ( target === 0 ) {
		} else if ( target === 1 ) {
			if (general.currentUser.permissions.recordsMaster === true) {
				$('.mgmt .fn-hiddenable_subpanel').removeClass('no-display');
			} else {
				$('.mgmt .fn-hiddenable_subpanel').addClass('no-display');
			}
			mgmt.tree.createDivAndTree(general.treeStructure, true);
		} else if ( target === 2 ) {
			if ( $(this).hasClass('disabled') ) { return; }
			mgmt.tree.loadAnotherStrucSilently(); // new
			$('.tab1').removeClass('no-display');
			return;
		} else if (target === 3) {
			autoc.setCurrent('.manager', manager.profile.makeAjax, manager.profile);
			//a.manager.reset();
			//a.manager.userList.refresh();
		} else if (target === 4) {
			autoc.setCurrent('.emailer');
		}
		$('.tab'+target).removeClass('no-display');
	},
	change = function () {
		var tabNum = $(this).data().tab;
		general.currentTab = tabNum;
		$('.fn-tablink').removeClass('current');
		$(this).addClass('current');
		$('.tab-item').addClass('no-display');
		instance.publish('change');
		if ( tabNum === 0 ) {
			
			instance.publish('home');
			
		} else if ( tabNum === 1 ) {
			
			instance.publish('mgmt', 'service_admin');
			
		} else if ( tabNum === 2 ) {
			
			$('.tab1').removeClass('no-display');
			instance.publish('mgmt', 'local_admin');
			return;
			
		} else if (tabNum === 3) {
			
			instance.publish('manager');
			
		} else if (tabNum === 4) {
			
			instance.publish('emailer');
		}
		$('.tab'+tabNum).removeClass('no-display');
	};
	
	instance.change = change;
	return instance;
}()),
dialog = (function () {
	var root = '#modal4 ',
		callback,
		pars = {},
	
	setCallback = function (fn, obj) {
		callback = fn;
		pars = obj;
	},
	ok = function () {
		var fn = callback;
		
		$(root).closeModal();
		if (typeof fn === 'function') {
			fn( pars );
		}
	},
	setMsg = function (type) {
		$(root+'.fn-sesinv-msg').addClass('no-display');
		
		if ( type === 'idle' ) {
			
			$(root+'.fn-errs-idle').removeClass('no-display');
			
		} else if ( type === 'invalid_session' ) {
			
			$(root+'.fn-errs-invalid_session').removeClass('no-display');
			
		} else if (type === 'permission_denied') {
			
			$(root+'.fn-errs-permission_denied').removeClass('no-display');
			
		} else if (type === 'unknown_err') {
			
			$(root+'.fn-errs-unknown').removeClass('no-display');
		}
	},
	show = function (okFn, pars) {
		$(root).openModal({
			dismissible: false,
			opacity: 0.5,
			in_duration: 300,
			out_duration: 200,
			ready: function() {
				$(root+'button').trigger('focus');
			},
			complete: function () {}
		});
	},
	defEvt = function () {
		$(root+'button').on('click', ok);
	};
	defEvt();
	
	return {
		setCallback: setCallback,
		setMsg: setMsg,
		show: show
	};
}()),
initializeMaterial = function () {
	// $('.modal-trigger').leanModal({
		// dismissible: false, // Modal can be dismissed by clicking outside of the modal
		// opacity: .5, // Opacity of modal background
		// in_duration: 300, // Transition in duration
		// out_duration: 200, // Transition out duration
		// ready: function() {   }, // Callback for Modal open
		// complete: function() {   } // Callback for Modal close
	// });
	
	$(".button-collapse").sideNav();
	//$('select').material_select();
},
help = (function () {
	var handleModal = function () {
		$('#modal5').openModal({
			dismissible: false,
			opacity: 0.5,
			in_duration: 300,
			out_duration: 200,
			ready: function() {
				$('#modal5 button').trigger('focus');
			},
			complete: function () {}
		});
	},
	adjustSvg = function (e) {
		e.preventDefault();
		var target = $(e.target),
			tarId = target.attr('id'),
			svgs = $('.fn-helpimg'),
			links = $('.fn-hlpnav'),
			root;
		
		links.removeClass('current_item');
		target.addClass('current_item');
		$('.fn-helpimg').addClass('no-display');
		
		root = util.getCommentsInside('.fn-hlp-svgroot')[0].nodeValue.trim();
		$('.fn-helpimg[src="'+root+tarId+'.svg"]').removeClass('no-display');

	},
	defEvt = function () {
		$('.helpnav').on('click', adjustSvg);
		$('.fn-showhelp').on('click', handleModal);
		$('#modal5 .closemodal').on('click', function () {
			$('#modal5').closeModal();
		});
	};
	
	return {
		defEvt: defEvt
		
	};
}()),
audio = (function () {
	var perm = false,
		sounds = {
			success: $('.fn-audio-success')[0],
			error: $('.fn-audio-error')[0],
			tabchange: $('.fn-audio-tabchange')[0]
		},
	
	toggleOnOff = function () {
		if (perm === false) {
			perm = true;
		} else if (perm === true) {
			perm = false;
		}
	},
	play = function (which) {
		if (perm) {
			sounds[which].play();
		}
	};
	
	return {
		toggleOnOff: toggleOnOff,
		play: play
	};
}()),

mgmt = (function () {
	var autoc,
		counterTree,
		recordTree,
		counterList,
		recordList,
	
	general = {
		currentProfile: {
			fullnameFa: '',
			fullnameEn: '',
			username: '',
		},
		counterTree: false,
		recordTree: false,
		tree: {
			loaded: false,
			modified: false,
			localmanagerTreeStruc: {
				counter: undefined,
				record: undefined
			}
		}
	},
	profile = (function () {
		var instance = util.extend( instantiatePubsub() ),
			currentTab,
		
		update = function (user) {
			if (typeof user.photo === 'string') {
				$('.mgmt .fn-profile-img').attr({ src: user.photo });
			}
			$('.mgmt .fn-profile-firstname').html( user.firstname ); 
			$('.mgmt .fn-profile-lastname').html( user.lastname ); 
			$('.mgmt .fn-profile-email').html(  user.email );
			$('.mgmt .fn-profile-title').html( user.title );
			$('.mgmt .fn-profile-phone').html(  user.number );
		},
		reset = function () {
			var img = $.parseHTML(  util.getCommentsInside('.profile-img')[0].nodeValue.trim()  ); 
			$('.mgmt .fn-autoc-input')			.val('');
			$('.mgmt #mgmt-autocomplete_1')		.val('');
			$('.mgmt .fn-profile-img')			.attr({ src: $(img).attr('src') });
			$('.mgmt .fn-profile-firstname')	.html( '' ); 
			$('.mgmt .fn-profile-lastname')		.html( '' ); 
			$('.mgmt .fn-profile-email')		.html(  '' );
			$('.mgmt .fn-profile-title')		.html( '' );
			$('.mgmt .fn-profile-phone')		.html(  '' );
			this.publish('reset');
		},
		setVars = function (user) {
			general.currentProfile.fullnameFa = user.fullnameFa;
			general.currentProfile.fullnameEn = user.fullnameEn;
			general.currentProfile.username = user.username;
		},
		callback = function (rdyUser, initTab) {
			profile.reset();
			if (initTab === currentTab) {
				setVars(rdyUser);
				update(rdyUser);
			}
		},
		makeAjax = function (username) {
			var initiationTab = currentTab;
			
			ajax({
				data : {
					action: urls.actions.GET_USER_INFO,
					username: username
				},
				beforeSend: function () {
					instance.publish('beforeUpdate');
					//tree.resetToolbars(true);
				}
			})
			.done(function (data) {
				var user = data[0][username],
					rdyUser = a.general.formatUserInfo(user);
				callback(rdyUser, initiationTab);
				//tree.loadTrees();
				instance.publish('update', {
					initTab: initiationTab
				});
			}).fail(function () {
				
			});
			/*$.ajax({
				url: urls.mainUrl,
				type : 'GET',
				dataType : 'json',
				data : {
					action: urls.actions.GET_USER_INFO,
					session: a.general.currentSession,
					username: username
				},
				beforeSend: function () {
					instance.publish('beforeUpdate');
					//tree.resetToolbars(true);
				}
			})
			.done(function (data) {
				if (sessionInvalid(data[0])) { return; }
				var user = data[0][username],
					rdyUser = a.general.formatUserInfo(user);
				callback(rdyUser, initiationTab);
				//tree.loadTrees();
				instance.publish('update', {
					initTab: initiationTab
				});
			}).fail(function (data, errorTitle, errorDetail) {
				alertify.error('AcUsername failed<br />'+errorTitle+'<br />'+errorDetail);
			});*/
		},
		makeAutocomplete = function (divId) {
			$('#'+divId).autocomplete({
				source: function ( request, response ) {
					ajax({
						data : {
							action: urls.actions.AC_USERNAME,
							str: request.term
						}
					}).done(function ( data ) {
						var arrList = [],
							key = '',
							res = data[0];
						res.forEach(function (i) {
							arrList.push(i.username);
						});
						
					//	for ( key in res ) {
					//		if ( res.hasOwnProperty(key) ) {
					//			arrList.push(key);
					//		}
					//	}
						
						response( arrList ); // response( data[0] ); 
					}).fail(function () {
						
					});
					/*$.ajax({
						url: urls.mainUrl,
						dataType: "json",
						data : {
							action: urls.actions.AC_USERNAME,
							session: a.general.currentSession,
							str: request.term
						}
					}).done(function ( data ) {
						if (sessionInvalid(data[0])) { return; }
						var arrList = [],
							key = '',
							res = data[0];
						res.forEach(function (i) {
							arrList.push(i.username);
						});
						
					//	for ( key in res ) {
					//		if ( res.hasOwnProperty(key) ) {
					//			arrList.push(key);
					//		}
					//	}
						
						response( arrList ); // response( data[0] ); 
					}).fail(function (data, errorTitle, errorDetail) {
						alertify.error('AcUsername failed<br />'+errorTitle+'<br />'+errorDetail);
					});*/
				},
				select: function ( event, ui ) {
					//$('#users_list').empty();
					//$('#users_list').append( $.parseHTML('<li class="list-group-item btn btn-default btn-lg"><a href="#">'+ui.item.value+'</a></li>') );
					
					ajax({
						data : {
							action: urls.actions.GET_USER_INFO,
							username: ui.item.value
						},
						beforeSend: function () {
							//tree.resetToolbars(true);
							instance.publish('beforeUpdate');
						}
					})
					.done(function ( data, textStatus, jqXHR ) {
						var user = data[0][ui.item.value],
							rdyUser = a.general.formatUserInfo(user);
						callback(rdyUser);
						instance.publish('update');
					}).fail(function () {
						
					});
					/*$.ajax({
						url: urls.mainUrl,
						type : 'GET',
						dataType : 'json',
						data : {
							action: urls.actions.GET_USER_INFO,
							session: a.general.currentSession,
							username: ui.item.value
						},
						beforeSend: function () {
							//tree.resetToolbars(true);
							instance.publish('beforeUpdate');
						}
					})
					.done(function ( data, textStatus, jqXHR ) {
						if (sessionInvalid(data[0])) { return; }
						var user = data[0][ui.item.value],
							rdyUser = a.general.formatUserInfo(user);
						callback(rdyUser);
						instance.publish('update');
					}).fail(function (data, errorTitle, errorDetail) {
						alertify.error('AcUsername failed<br />'+errorTitle+'<br />'+errorDetail);
					});*/
				}
			});
		},
		defCusEvt = function () {
			a.tab.on('mgmt', function (data) {
				currentTab = data;
			});
		};
		
		
		instance.reset = reset;
		instance.callback = callback;
		instance.makeAjax = makeAjax;
		instance.makeAutocomplete = makeAutocomplete;
		instance.defCusEvt = defCusEvt;
		return instance;
	}()),
	instantiateLister = function (root) {
		if (typeof root === 'undefined') { throw new Error('You must provide a root element.'); }
		if (typeof root !== 'string') { throw new Error('Root must be a string.'); }
		root.trim();
		root += ' '; 
		
		var instance = util.extend( instantiatePubsub() ),
			refresher = '.fn-update_admin_list' ,
			wrap = '.fn-admin_list',
			item = '.fn-adminlist-item',
			currentTab,
		
		createHtml = function (arr) {
			var baseHtml = '',
				els = [],
				tr,
				td;
			baseHtml = util.getCommentsInside(root + wrap)[0].nodeValue.trim();
			arr.forEach(function (i) {
				var formatted = a.general.formatUserInfo(i);
				tr = $.parseHTML(baseHtml)[0];
				tr = $(tr);
				tr.contents().filter('td').attr('data-username', formatted.username);
				tr.contents().filter('td').html(formatted.fullnameFa);
				els.push(tr[0]);
			});
			$(root + wrap + ' > tbody').empty();
			els.forEach(function (i) {
				$(root + wrap + ' > tbody').append(i);
			});
		},
		reset = function () {
			$(root + wrap + ' > tbody').empty();
		},
		makeAjax = function (initTab) {
			var data =  {};
			if (a.general.currentTab === 1) {
				data.action = urls.actions.GET_USERS_WITH_ADMIN_ACCESS; // w12 GetUsersWithViewAccess
			} else if (a.general.currentTab === 2) {
				data.action = urls.actions.GET_USERS_WITH_VIEW_ACCESS;
			}
			
			if (root === '#fn-counter-list ') {
				data.type = 'counter';
			} else if (root === '#fn-record-list ') {
				data.type = 'record';
			}
			
			ajax({
				data : data,
				beforeSend : function () {
					$(root + refresher).addClass('disabled');
					$(root + refresher + ' > i').addClass('fa-spin');
				}
			})
			.done(function ( data ) {
				//if (  !data[0]['taslimi-p'] ) { alert('data came back messed up'); }
				if (initTab !== currentTab) { return; }
				
				var response = data[0],
					arr = [];
				for (var prop in response) {
					if ( response.hasOwnProperty(prop) ) {
						arr.push(response[prop]);
					}
				}
				$(root + refresher).removeClass('disabled');
				$(root + refresher + ' > i').removeClass('fa-spin');
				createHtml(arr);
				
				instance.publish('refresh');
			})
			.fail(function () {
				$(root + refresher).removeClass('disabled');
				$(root + refresher + ' > i').removeClass('fa-spin');
			});
			/*$.ajax({
				url: urls.mainUrl,
				type : 'GET',
				dataType : 'json',
				data : data,
				beforeSend : function () {
					$(root + refresher).addClass('disabled');
					$(root + refresher + ' > i').addClass('fa-spin');
				}
			})
			.done(function ( data ) {
				if (sessionInvalid(data[0])) { return; }
				//if (  !data[0]['taslimi-p'] ) { alert('data came back messed up'); }
				if (initTab !== currentTab) { return; }
				
				var response = data[0],
					arr = [];
				for (var prop in response) {
					if ( response.hasOwnProperty(prop) ) {
						arr.push(response[prop]);
					}
				}
				$(root + refresher).removeClass('disabled');
				$(root + refresher + ' > i').removeClass('fa-spin');
				createHtml(arr);
				
				instance.publish('refresh');
			})
			.fail(function ( data, errorTitle, errorDetail  ) {
				alertify.error(data.action + ' failed<br />'+errorTitle+'<br />'+errorDetail);
				$(root + refresher).removeClass('disabled');
				$(root + refresher + ' > i').removeClass('fa-spin');
			});*/
		},
		itemClick = function (e) {
			if ( $(root + item).hasClass('disabled') ) { return; }
			var initiationTab = currentTab;
			
			ajax({
				data : {
					action: urls.actions.GET_USER_INFO,
					username: $(e.target).data().username
				},
				beforeSend: function () {
					instance.publish('beforeItemClick');
					//tree.resetToolbars(true);
					$(root + item).addClass('disabled');
				}
			})
			.done(function (data) {
				$(root + item).removeClass('disabled');
				var user = data[0][$(e.target).data().username],
					rdyUser = a.general.formatUserInfo(user);
				instance.publish('itemClick', {
					user: rdyUser,
					initTab: initiationTab
				});
				//profile.callback(rdyUser);
				//tree.loadTrees();
			})
			.fail(function () {
				$(root + item).removeClass('disabled');
			});
			/*$.ajax({
				url: urls.mainUrl,
				type : 'GET',
				dataType : 'json',
				data : {
					action: urls.actions.GET_USER_INFO,
					session: a.general.currentSession,
					username: $(e.target).data().username
				},
				beforeSend: function () {
					instance.publish('beforeItemClick');
					//tree.resetToolbars(true);
					$(root + item).addClass('disabled');
				}
			})
			.done(function (data) {
				if (sessionInvalid(data[0])) { return; }
				$(root + item).removeClass('disabled');
				var user = data[0][$(e.target).data().username],
					rdyUser = a.general.formatUserInfo(user);
				instance.publish('itemClick', {
					user: rdyUser,
					initTab: initiationTab
				});
				//profile.callback(rdyUser);
				//tree.loadTrees();
			})
			.fail(function (data, errorTitle, errorDetail) {
				alertify.error('GetUserInfo failed<br />'+errorTitle+'<br />'+errorDetail);
				$(root + item).removeClass('disabled');
			});*/
		},
		handle = function () {
			if ( $(this).hasClass('disabled') ) { return; }
			refresh();
		},
		refresh = function () {
			makeAjax(currentTab);
		},
		defEvt = function () {
			$(root + refresher).on('click', handle);
			$(root + wrap).on('click', item, itemClick); 
		},
		defCusEvt = function () {
			a.tab.on('mgmt', function (data) {
				currentTab = data;
			});
		};
		
		defEvt();
		defCusEvt();
		instance.reset = reset;
		instance.refresh = refresh;
		return instance;
	},
	/*adminList = (function () {
		var root = '',
			associatedRoots = [],
		getRoot = function () {
			return root;
		},
		setRoot = function (selector) {
			root = selector;
		},
		createHtml = function (arr) {
			var baseHtml = '',
				els = [],
				tr,
				td;
			baseHtml = util.getCommentsInside(getRoot() + '.fn-admin_list')[0].nodeValue.trim();
			arr.forEach(function (i) {
				var formatted = general.formatUserInfo(i);
				tr = $.parseHTML(baseHtml)[0];
				tr = $(tr);
				tr.contents().filter('td').attr('data-username', formatted.username);
				tr.contents().filter('td').html(formatted.fullnameFa);
				els.push(tr[0]);
			});
			$(getRoot() + '.fn-admin_list > tbody').empty();
			els.forEach(function (i) {
				$(getRoot() + '.fn-admin_list > tbody').append(i);
			});
		},
		reset = function () {
			$(getRoot() + '.fn-admin_list > tbody').empty();
		},
		makeAjax = function () {
			var data =  {
				session: general.currentSession
			}
			if (general.currentTab === 1) {
				data.action = urls.actions.GET_USERS_WITH_ADMIN_ACCESS; // w12 GetUsersWithViewAccess
			} else if (general.currentTab === 2) {
				data.action = urls.actions.GET_USERS_WITH_VIEW_ACCESS;
			}
			
			if (getRoot() === '#fn-counter-list ') {
				data.type = 'counter';
			} else if (getRoot() === '#fn-record-list ') {
				data.type = 'record';
			}
			
			$.ajax({
				url: urls.mainUrl,
				type : 'GET',
				dataType : 'json',
				data : data,
				beforeSend : function () {
					$(getRoot() + '.fn-update_admin_list').addClass('disabled');
					$(getRoot() + '.fn-update_admin_list > i').addClass('fa-spin');
				}
			})
			.done(function ( data ) {
				if (sessionInvalid(data[0])) { return; }
				//if (  !data[0]['taslimi-p'] ) { alert('data came back messed up'); }
				var response = data[0],
					arr = [];
				for (var prop in response) {
					if ( response.hasOwnProperty(prop) ) {
						arr.push(response[prop]);
					}
				}
				$(getRoot() + '.fn-update_admin_list').removeClass('disabled');
				$(getRoot() + '.fn-update_admin_list > i').removeClass('fa-spin');
				createHtml(arr);
				
			})
			.fail(function ( data, errorTitle, errorDetail  ) {
				alertify.error('GetUsersWithAdminAccess failed<br />'+errorTitle+'<br />'+errorDetail);
				$(getRoot() + '.fn-update_admin_list').removeClass('disabled');
				$(getRoot() + '.fn-update_admin_list > i').removeClass('fa-spin');
			});
		},
		adminItem = function (e) {
			if ( $(getRoot() + '.fn-adminlist-item').hasClass('disabled') ) { return; }
			root = '#' + $(this).parent().parent().parent().parent().parent().parent().attr('id') + ' ';
			//console.log($(e.target).data().username);
			$.ajax({
				url: urls.mainUrl,
				type : 'GET',
				dataType : 'json',
				data : {
					action: urls.actions.GET_USER_INFO,
					session: general.currentSession,
					username: $(e.target).data().username
				},
				beforeSend: function () {
					
					tree.resetToolbars(true);
					$(getRoot() + '.fn-adminlist-item').addClass('disabled');
				}
			})
			.done(function ( data, textStatus, jqXHR ) {
				if (sessionInvalid(data[0])) { return; }
				$(getRoot() + '.fn-adminlist-item').removeClass('disabled');
				var user = data[0][$(e.target).data().username],
					rdyUser = general.formatUserInfo(user);
				profile.setProfileVars(rdyUser);
				profile.reset();
				profile.updateProfile(rdyUser);
				tree.loadTrees();
			})
			.fail(function (data, errorTitle, errorDetail) {
				alertify.error('GetUserInfo failed<br />'+errorTitle+'<br />'+errorDetail);
				$(getRoot() + '.fn-adminlist-item').removeClass('disabled');
			});
		},
		adminList = function () {
			if ( $(this).hasClass('disabled') ) { return; }
			root = '#' + $(this).parent().parent().attr('id') + ' ';
			makeAjax();
		},
		defEvt = function (selector) {
			associatedRoots.push(selector);
			root = selector + ' ';
			$(getroot() + '.fn-update_admin_list').on('click', adminList);
			$(getroot() + '.fn-admin_list').on('click .fn-adminlist-item', adminItem);
		};
		
		return {
			reset: reset,
			setRoot: setRoot,
			defEvt : defEvt
		};
	}()),*/
	instantiateTreeMgmt = function (root, treeSelector, toolbarItemsSelector, submitSelector) {
		var baseTree = instantiateTree(root, treeSelector, toolbarItemsSelector),
			instance = util.extend( baseTree ),
			submit = $(root+' '+submitSelector),
		
		recheck = function (arr) {
			if ( !util.isArray( arr ) ) { throw new Error('tree.reChek(): The list of nodes to check must be an array.'); }
			if ( !instance.isTreeRdy() ) {
				setTimeout(function () {
					recheck(arr);
				}, 50);
				return;
			}
			var node;
			instance.treeInstance.deselect_all(); // true
			instance.treeInstance.close_all(); // true
			
			if ( arr.length === 0 ) { return; }
			
			instance.treeInstance.select_node(arr, true, false);
			/*arr.forEach(function (item) {
				console.log(item);
				if (typeof item === 'string') {
					node = instance.treeInstance.get_node(item, false); // 2true: as dom
					instance.treeInstance.select_node(node.id, true, false); // 3true: closed,    3false:  opened
					//instance.treeInstance.select_node(item, true, false); // 3true: closed,    3false:  opened
				}
			});*/
			
			
		},
		recheckAndShow = function (rdyRecheckData) {
			recheck(rdyRecheckData);
			instance.show();
		},
		resetToolbar = function (full) {
			if (typeof full === 'undefined' || typeof full !== 'boolean') { throw new Error(instance.getObjName()+'resetToolbar(): A boolean argument is necessary.'); }
			if (full === true) {
				
				instance.toolbarItems.addClass('disabled');		// disable
				submit.addClass('disabled');			// disable
				
			} else if (full === false) {
			
				instance.toolbarItems.removeClass('disabled'); 	// enable
				submit.addClass('disabled');			// disable
				
			}
		},
		reset = function () {
			instance.treeInstance.destroy().empty();
			resetToolbar(true);
		},
		adjustSubmitBtn = function (e) {
			var target = $(e.target);
			if ( e.which === 1 ) { // click
				if ( target.hasClass('jstree-anchor') || target.hasClass('jstree-checkbox') ) {
					$(instance.toolbarPrefix+'give_access').removeClass('disabled');
				}
			} else if ( e.which === 13 ) { // enter
				$(instance.toolbarPrefix+'give_access').removeClass('disabled');
			}
		},
		defEvt = function (mainTree) {//$(mainSelector)
			instance.treeDom.on('click keydown', adjustSubmitBtn);
		},
		defCusEvt = function () {
			instance.on('select_all deselect_all', function () {
				submit.removeClass('disabled');
			});
			
		};
		
		defEvt();
		defCusEvt();
		
		instance.recheck = recheck;
		instance.recheckAndShow = recheckAndShow;
		instance.resetToolbar = resetToolbar;
		instance.reset = reset;
		instance.adjustSubmitBtn = adjustSubmitBtn;
		instance.defEvt = defEvt;
		return instance;
	},
	tree = (function () {
		var useJstree = function (divId, treeStructure) {
			if (typeof treeStructure === 'undefined') { return; }
			$.jstree.defaults.plugins = [
				//"grid"
				"checkbox"
				//"contextmenu", 
				// "dnd", 
				//"massload", 
				// "search", 
				// "sort", 
				// "state", 
				// "types", 
				// "unique", 
				// "wholerow", 
				// "changed", 
				// "conditionalselect"
			];
			
			$('#'+divId).jstree({
				core : {
					//animation : 0,
					data : treeStructure
				},
				types : {
					"default" : {
						//"icon" : "jstree-icon jstree-file"
						"disabled" : { 
							"check_node" : false, 
							"uncheck_node" : false 
						}
					},
					"demo" : {
					}
				}
			});
		},
		getSelection = function (selected, treeId) {
			if ( !util.isArray(selected) ) { throw new Error('getSelection:  Argument is not an array.'); }
			
			var status = '',
				childless = [],
				withChild = [];
				
			var result = {
				counter: {
					groups: {
						forSend: [],
						forView: []
					},
					users: {
						forSend: [],
						forView: []
					}
				},
				record: {
					groups: {
						forSend: [],
						forView: []
					},
					users: {
						forSend: [],
						forView: []
					}
				},
				groupsAndUsers: []
			};
			if ( treeId === 'jstree_demo_div') {
				status = 'counter';
			} else if ( treeId === 'jstree_demo_div_2' ) {
				status = 'record';
			}
			/*
				2 ways to achive our goal:
				go through childless items and grab their parent and then see if all the childs of their parent is selected or not,
				if yes just select the parent, if not select all the siblings.
				
				go through withChild items and check all of their childs to see if they are select or not.
					if		item.children.length !== 0		&&		item.state.selected === true  
					groupList.push(item.id)
			*/
			selected.forEach(function (item) { // extract childless abd withChild node objects
				if (item.children.length === 0) { // childless node
					
					if (  $.inArray( item.text, childless ) === -1  ) { // item doesn't exists in our array
						childless.push(item);
					}
				} else if (item.children.length !== 0) { // item has child
					withChild.push(item);
				}
			});
			
			childless.forEach(function (item) {
				var parent = $('#'+treeId).jstree(true).get_node(item.parent);
				if ( parent.state.selected === false || item.parent === '#' ) {
					//console.log(item);

					if (typeof item.icon === 'string') {	// file
						
						if ( status === 'counter' ) {
							result.counter.users.forSend.push(item.text);
							//result.counter.users.forView.push(item.text);
						} else if ( status === 'record' ) {
							result.record.users.forSend.push(item.text);
							//result.records.users.forView.push(item.text);
						}
						result.groupsAndUsers.push({
							text: item.text,
							icon: item.icon
						});
						
					} else if (typeof item.icon === 'undefined' || typeof item.icon === 'boolean') { // childless folder
						
						if ( status === 'counter' ) {
							result.counter.groups.forSend.push(item.id);
							result.counter.groups.forView.push(item.text);
						} else if ( status === 'record' ) {
							result.record.groups.forSend.push(item.id);
							result.record.groups.forView.push(item.text);
						}
						result.groupsAndUsers.push(item.text);
					
					}
					
					
				}
			});
			// withChild	->		// [Object, Object, Object, Object]
			withChild.forEach(function (item) { // [Object,
				if ( item.children.length !== 0 && item.state.selected === true ) { // completely selected folder
					var parent = $('#'+treeId).jstree(true).get_node(item.parent);
					if ( parent.state.selected === false || item.parent === '#' ) {
						if ( status === 'counter' ) {
							
							result.counter.groups.forSend.push(item.id);
							result.counter.groups.forView.push(item.text);
							
						} else if ( status === 'record' ) {
							
							result.record.groups.forSend.push(item.id);
							result.record.groups.forView.push(item.text);
							
						}
						result.groupsAndUsers.push(item.text);
					}
				}
			});
			//console.log(result.groupsAndUsers);
			return result;
		},
		evt = function (mainTree, listTree) {
			var selected = [],
				result,
				root;
			
			var handler = function (e, node) {
				//console.log(e);
				//console.log(node);
				general.tree.modified = true;
				
				if ( $(e.target).hasClass('jstree-anchhor') || $(e.target).hasClass('jstree-checkbox') ) {
					
					if ( general.tree.modified ) {
						$('#fn-'+mainTree+'-give_access').removeClass('disabled');
					} else if ( !general.tree.modified ) {
						$('#fn-'+mainTree+'-give_access').addClass('disabled');
					}
				}
			};
			$('#'+mainTree).on('click', handler); // select_node.jstree
			//$('#'+mainTree).on('click #jstree_demo_div_2', handler); //  deselect_node.jstree
			
			$('#'+mainTree).on('ready.jstree', function (e, data) {
				//$('.fn-'+mainTree+'-treetoolbar').removeClass('disabled');
			});
			$('#'+mainTree).on("changed.jstree", function (e, data) {
				
				/*	make give access button disable if nothing is selected
				
				if ( $('#'+mainTree).jstree('get_selected', ['full']).length === 0 ) {
					$('#fn-'+mainTree+'-give_access').addClass('disabled');
				} else {
					$('#fn-'+mainTree+'-give_access').removeClass('disabled');
				}
				*/

				selected = $( '#'+mainTree).jstree(true).get_selected(true); // true: full node objects, false: only ids
				result = getSelection( selected, mainTree );
				
				if (mainTree === 'jstree_demo_div') {
					general.fullPriv.groups.forSend = result.counter.groups.forSend;
					general.fullPriv.groups.forView = result.counter.groups.forView;
					general.fullPriv.users.forSend = result.counter.users.forSend;
				} else if (mainTree === 'jstree_demo_div_2') {
					general.halfPriv.groups.forSend = result.record.groups.forSend;
					general.halfPriv.groups.forView = result.record.groups.forView;
					general.halfPriv.users.forSend = result.record.users.forSend;
				}
				
				
				
				$('#'+listTree).remove();
				$('#fn-'+listTree+'-parent').append( $.parseHTML('<div id="'+listTree+'" class="col-md-2 text-right"></div>') );
				$('#'+listTree).jstree({
					core : {
						data : result.groupsAndUsers
					}
				});
			});
			
			$('#fn-'+mainTree+'-open_all').on('click', function () {
				if ( !$(this).hasClass('disabled') ) {
					$('#'+mainTree).jstree(true).open_all();
				}
			});
			$('#fn-'+mainTree+'-close_all').on('click', function () {
				if ( !$(this).hasClass('disabled') ) {
					$('#'+mainTree).jstree(true).close_all();
				}
			});
			$('#fn-'+mainTree+'-select_all').on('click', function () {
				if ( !$(this).hasClass('disabled') ) {
					$('#'+mainTree).jstree(true).select_all();
					$('#fn-'+mainTree+'-give_access').removeClass('disabled');
				}
			});
			$('#fn-'+mainTree+'-deselect_all').on('click', function () {
				if ( !$(this).hasClass('disabled') ) {
					$('#'+mainTree).jstree(true).deselect_all();
					$('#fn-'+mainTree+'-give_access').removeClass('disabled');
				}
			});
		},
		extractForRecheck = function (obj) {
			if ( !util.isObject(obj) ) { throw new Error('tree.extractForRecheck():  Argument is not an object.'); }
			if ( typeof obj === 'undefined' ) { throw new Error('tree.extractForRecheck():  Argument is undefined.'); }
			var counters = [],
				records = [];
			
			obj.counters.users.forEach(function (item) {
				if ( typeof item !== 'undefined' && typeof item === 'string') {
					counters.push(item);
				}
			});
			obj.counters.groups.forEach(function (item) {
				if ( typeof item !== 'undefined' ) {
					counters.push(item);
				}
			});
			obj.records.users.forEach(function (item) {
				if ( typeof item !== 'undefined' ) {
					records.push(item);
				}
			});
			obj.records.groups.forEach(function (item) {
				if ( typeof item !== 'undefined' ) {
					records.push(item);
				}
			});
			return {
				counters: counters,
				records: records
			};
		},
		reCheckHelper = function (divId, node) {
			// console.log(node);
			if ( !util.isObject(node) ) { throw new Error("tree.reCheckHelper():  Argument is not an object. (Tree wasn't ready)"); }
			
			if (node) {
				$('#'+divId).jstree(true).select_node(node.id, true, false); // 3true: closed,    3false:  opened
				/*if (node.parent === '#' && typeof node.parent === 'string') { // root node
					
					$('#'+divId).jstree(true).open_node(node.id);
					$('#'+divId).jstree(true).select_node(node.id, true, false);
					return;
					
				} else if (node.parent !== '#' && typeof node.parent === 'string') { // node that has a parrent
				
					//$('#'+divId).jstree(true).select_node(node.id, true, false);
					
					$('#'+divId).jstree(true).open_node(node.parent);
					// $('#'+divId).jstree(true).select_node(node.id, true, false);
					
					var node = $('#'+divId).jstree(true).get_node(node.parent, false);
					if ( !util.isObject(node) ) {
						reCheckHelper(node);
					}
				}*/
			}
		},
		reCheck = function (divId, arr) {
			if ( !util.isArray( arr ) ) { throw new Error('tree.reChek():  Second argument is not an array.'); }
			var node,
				treeDiv = $('#'+divId);
				
			treeDiv.jstree(true).deselect_all(); // true
			treeDiv.jstree(true).close_all(); // true
			arr.forEach(function (item) {
				if (typeof item === 'string') {
					node = treeDiv.jstree(true).get_node(item, false);
					treeDiv.jstree(true).select_node(node.id, true, false); // 3true: closed,    3false:  opened
					//reCheckHelper( divId, treeDiv.jstree(true).get_node(item, false) );
				}
			});
			general.tree.modified = false;
		},
		resetToolbars = function (full, root) {
			if (typeof full === 'undefined' || typeof full !== 'boolean') { throw new Error('tree.resetToolbars(): Arg undefined or not bool.'); }
			var treeRoot = root || '';
			if (full === true) {
				
				$('.mgmt '+treeRoot+' .fn-treetoolbar').addClass('disabled');						// disable
				$('.mgmt '+treeRoot+' #fn-jstree_demo_div-give_access').addClass('disabled');		// disable
				$('.mgmt '+treeRoot+' #fn-jstree_demo_div_2-give_access').addClass('disabled');		// disable
				
			} else if (full === false) {
				
				$('.mgmt '+treeRoot+' .fn-treetoolbar').removeClass('disabled'); 					// enable
				$('.mgmt '+treeRoot+' #fn-jstree_demo_div-give_access').addClass('disabled');		// disable
				$('.mgmt '+treeRoot+' #fn-jstree_demo_div_2-give_access').addClass('disabled');		// disable
			}
		},
		reset = function () {
			createFreshDiv();
			resetToolbars(true);
		},
		createFreshDiv = function (hidden) {
			$('#jstree_demo_div').remove();
			$('#fn-jstree_demo_div-parent').append( $.parseHTML( util.getCommentsInside('#fn-jstree_demo_div-parent')[0].nodeValue.trim() ) );
			$('#jstree_demo_div_2').remove();
			$('#fn-jstree_demo_div_2-parent').append( $.parseHTML( util.getCommentsInside('#fn-jstree_demo_div_2-parent')[0].nodeValue.trim() ) );
			if (hidden === true) {
				$('#jstree_demo_div').addClass('hidden');
				$('#jstree_demo_div_2').addClass('hidden');
			} else if (hidden === false) {
				$('#jstree_demo_div').removeClass('hidden');
				$('#jstree_demo_div_2').removeClass('hidden');
			}
		},
		createDivAndTree = function (treeStructure, hidden) {
			if ( typeof hidden === 'undefined' ) { throw new Error('tree.createDivAndTree():  hidden argument is not set.'); }
			createFreshDiv(hidden);
			useJstree('jstree_demo_div', treeStructure);
			useJstree('jstree_demo_div_2', treeStructure);
			evt('jstree_demo_div', 'jstree_demo_div_3');
			evt('jstree_demo_div_2', 'jstree_demo_div_4');
		},
		initialize = function (fn) {
			ajax({
				data : {
					action: urls.actions.GET_GROUPS, //http://100.80.0.175/cgi-bin/FCPNI?&action=GetMyViewAccessList&session=abc&admin=taslimi-p
					base: '0',
					version: '2'	// 1= without icon	2= with icon
				}
			})
			.done(function (data) {
				a.general.treeStructure = data[0];
				createDivAndTree(data[0], true);
				fn();
			})
			.fail(function () {
			});
			/*$.ajax({
				url: urls.mainUrl,
				type : 'GET',
				dataType : 'json',
				data : {
					action: urls.actions.GET_GROUPS, //http://100.80.0.175/cgi-bin/FCPNI?&action=GetMyViewAccessList&session=abc&admin=taslimi-p
					session: a.general.currentSession,
					base: '0',
					version: '2'	// 1= without icon	2= with icon
				}
			})
			.done(function (data) {
				if (sessionInvalid(data[0])) { return; }
				a.general.treeStructure = data[0];
				createDivAndTree(data[0], true);
				fn();
			})
			.fail(function ( data, errorTitle, errorDetail ) {
				alertify.error('Getgroups failed<br />'+errorTitle+'<br />'+errorDetail);
			});*/
		},
		changeAlredyLoaded = function () {
			//createDivAndTree(a.general.treeStructure, false);
			ajax({
				data: {
					action: urls.actions.GET_USER_ADMIN_ACCESS_LIST,
					admin: a.general.currentProfile.username
				},
				beforeSend: function () {
					$('.tree-wrap .preloader-wrapper').removeClass('no-display');
					$('.tree-wrap .treeroot').addClass('no-display');
				}
			})
			.done(function (data) {
				var userAccessList = extractForRecheck( data[0] );
				setTimeout(function () { // because tree is not ready (ui-wise)
					$('.tree-wrap .preloader-wrapper').addClass('no-display');
					$('.tree-wrap .treeroot').removeClass('no-display');
					
					reCheck('jstree_demo_div', userAccessList.counters);
					reCheck('jstree_demo_div_2', userAccessList.records);
					
					$('#jstree_demo_div').removeClass('hidden');
					$('#jstree_demo_div_2').removeClass('hidden');
					resetToolbars(false);
				}, 100);
			})
			.fail(function () {
				
			});
			/*$.ajax({
				url: urls.mainUrl,
				type: 'GET',
				dataType: 'json',
				data: {
					action: urls.actions.GET_USER_ADMIN_ACCESS_LIST,
					session: a.general.currentSession,
					admin: a.general.currentProfile.username
				},
				beforeSend: function () {
					$('.tree-wrap .preloader-wrapper').removeClass('no-display');
					$('.tree-wrap .treeroot').addClass('no-display');
				}
			})
			.done(function (data) {
				if (sessionInvalid(data[0])) { return; }
				
				var userAccessList = extractForRecheck( data[0] );
				setTimeout(function () { // because tree is not ready (ui-wise)
					$('.tree-wrap .preloader-wrapper').addClass('no-display');
					$('.tree-wrap .treeroot').removeClass('no-display');
					
					reCheck('jstree_demo_div', userAccessList.counters);
					reCheck('jstree_demo_div_2', userAccessList.records);
					
					$('#jstree_demo_div').removeClass('hidden');
					$('#jstree_demo_div_2').removeClass('hidden');
					resetToolbars(false);
				}, 100);
			})
			.fail(function ( data, errorTitle, errorDetail ) {
				alertify.error('GetUserAdminAccessList failed<br />'+errorTitle+'<br />'+errorDetail);
			});*/
		},
		loadAnotherStrucSilently = function () {
			if ($('.mgmt .tab-preloader').length !== 0 && (a.general.currentUser.roles.serviceAdmin || a.general.currentUser.roles.emailer)) { return; }
			
			ajax({
				data: {
					action: urls.actions.GET_MY_ADMIN_ACCESS_LIST
				},
				beforeSend: function () {
					var html;
					a.general.localmanagerTreeLoaded = false;
					general.counterTree = false;
					general.recordTree = false;
					html = util.getCommentsInside('.tab-preloader-comment')[0].nodeValue.trim();
					$('.mgmt').prepend( $.parseHTML(html) );
					$('.mgmt .mainpanel').addClass('no-display');
					$('.fn-local_admin-tab_link > button').attr({disabled: true});
					$('.mgmt #fn-record-tree').removeClass('no-display');
					$('.mgmt #fn-record-list').removeClass('no-display');
				}
			}).done(function (data) {
				//if (data[0].counters.jtree.length === 0) {
				//	$('.mgmt #fn-counter-tree').addClass('no-display');
				//	$('.mgmt #fn-counter-list').addClass('no-display');
				// }
				if (data[0].records.jtree.length === 0) {
					$('.mgmt #fn-record-tree').addClass('no-display');
					$('.mgmt #fn-record-list').addClass('no-display');
				}
				$('.fn-local_admin-tab_link > button').attr({disabled: false});
				$('.fn-mgmt-tabpre').remove();
				$('.mgmt .mainpanel').removeClass('no-display');
				a.general.localmanagerTreeLoaded = true;
				var resp = data[0],
					counters = resp.counters.jtree,
					records = resp.records.jtree;
				createFreshDiv(true);
				if (counters.length !== 0) {
					general.counterTree = true;
					useJstree('jstree_demo_div', counters);
					evt('jstree_demo_div', 'jstree_demo_div_3');
				}
				if (records.length !==  0) {
					general.recordTree = true;
					useJstree('jstree_demo_div_2', records);
					evt('jstree_demo_div_2', 'jstree_demo_div_4');
				}
			});
			/*$.ajax({
				url: urls.mainUrl,
				type: 'GET',
				dataType: 'json',
				data: {
					action: urls.actions.GET_MY_ADMIN_ACCESS_LIST,
					session: a.general.currentSession
				},
				beforeSend: function () {
					var html;
					a.general.localmanagerTreeLoaded = false;
					general.counterTree = false;
					general.recordTree = false;
					html = util.getCommentsInside('.tab-preloader-comment')[0].nodeValue.trim();
					$('.mgmt').prepend( $.parseHTML(html) );
					$('.mgmt .mainpanel').addClass('no-display');
					$('.fn-local_admin-tab_link > button').attr({disabled: true});
					$('.mgmt #fn-record-tree').removeClass('no-display');
					$('.mgmt #fn-record-list').removeClass('no-display');
				}
			}).done(function (data) {
				
				if (sessionInvalid(data[0])) { return; }
				//if (data[0].counters.jtree.length === 0) {
				//	$('.mgmt #fn-counter-tree').addClass('no-display');
				//	$('.mgmt #fn-counter-list').addClass('no-display');
				// }
				if (data[0].records.jtree.length === 0) {
					$('.mgmt #fn-record-tree').addClass('no-display');
					$('.mgmt #fn-record-list').addClass('no-display');
				}
				$('.fn-local_admin-tab_link > button').attr({disabled: false});
				$('.fn-mgmt-tabpre').remove();
				$('.mgmt .mainpanel').removeClass('no-display');
				a.general.localmanagerTreeLoaded = true;
				var resp = data[0],
					counters = resp.counters.jtree,
					records = resp.records.jtree;
				createFreshDiv(true);
				if (counters.length !== 0) {
					general.counterTree = true;
					useJstree('jstree_demo_div', counters);
					evt('jstree_demo_div', 'jstree_demo_div_3');
				}
				if (records.length !==  0) {
					general.recordTree = true;
					useJstree('jstree_demo_div_2', records);
					evt('jstree_demo_div_2', 'jstree_demo_div_4');
				}
			});*/
			
			/*createFreshDiv(true);
			if (general.counterTree === true) {
				useJstree('jstree_demo_div', general.tree.localmanagerTreeStruc.counter);
				evt('jstree_demo_div', 'jstree_demo_div_3');
			}
			if (general.recordTree ===  true) {
				useJstree('jstree_demo_div_2', general.tree.localmanagerTreeStruc.record);
				evt('jstree_demo_div_2', 'jstree_demo_div_4');
			}*/
			
		},
		recheckAndShow = function () {
			ajax({
				data: {
					action: urls.actions.GET_USER_VIEW_ACCESS_LIST,
					viewer: a.general.currentProfile.username
				},
				beforeSend: function () {
					$('.tree-wrap .preloader-wrapper').removeClass('no-display');
					$('.tree-wrap .treeroot').addClass('hidden');
				}
			})
			.done(function (data) {
				$('.tree-wrap .preloader-wrapper').addClass('no-display');
				$('.tree-wrap .treeroot').removeClass('hidden');
				var userAccessList = extractForRecheck( data[0] );
				if (general.counterTree === true) {
					if (userAccessList.counters.length !== 0) {
						reCheck('jstree_demo_div', userAccessList.counters);
					}
					$('#jstree_demo_div').removeClass('hidden');
					resetToolbars(false, '#fn-counter-tree');
				}
				if (general.recordTree === true) {
					if (userAccessList.records.length !== 0) {
						reCheck('jstree_demo_div_2', userAccessList.records);
					}
					$('#jstree_demo_div_2').removeClass('hidden');
					resetToolbars(false, '#fn-record-tree');
				}
			})
			.fail(function () {
				
			});
			/*$.ajax({
				url: urls.mainUrl,
				type: 'GET',
				dataType: 'json',
				data: {
					action: urls.actions.GET_USER_VIEW_ACCESS_LIST,
					session: a.general.currentSession,
					viewer: a.general.currentProfile.username
				},
				beforeSend: function () {
					$('.tree-wrap .preloader-wrapper').removeClass('no-display');
					$('.tree-wrap .treeroot').addClass('hidden');
				}
			})
			.done(function (data) {
				if (sessionInvalid(data[0])) { return; }
				$('.tree-wrap .preloader-wrapper').addClass('no-display');
				$('.tree-wrap .treeroot').removeClass('hidden');
				var userAccessList = extractForRecheck( data[0] );
				if (general.counterTree === true) {
					if (userAccessList.counters.length !== 0) {
						reCheck('jstree_demo_div', userAccessList.counters);
					}
					$('#jstree_demo_div').removeClass('hidden');
					resetToolbars(false, '#fn-counter-tree');
				}
				if (general.recordTree === true) {
					if (userAccessList.records.length !== 0) {
						reCheck('jstree_demo_div_2', userAccessList.records);
					}
					$('#jstree_demo_div_2').removeClass('hidden');
					resetToolbars(false, '#fn-record-tree');
				}
			})
			.fail(function ( data, errorTitle, errorDetail ) {
				alertify.error(urls.actions.GET_USER_VIEW_ACCESS_LIST + ' failed<br />'+errorTitle+'<br />'+errorDetail);
			});*/
		},
		loadAnotherStruc = function () {
			ajax({
				data: {
					action: urls.actions.GET_MY_ADMIN_ACCESS_LIST
				},
				beforeSend: function () {
					general.counterTree = false;
					general.recordTree = false;
				}
			}).done(function (data) {
				var resp = data[0],
					counters = resp.counters.jtree,
					records = resp.records.jtree;
					
				if (counters.length !== 0) {
					general.tree.localmanagerTreeStruc.counter = counters;
					general.counterTree = true;
				}
				if (records.length !==  0) {
					general.recordTree = true;
					general.tree.localmanagerTreeStruc.record = records;
				}
			});
			/*$.ajax({
				url: urls.mainUrl,
				type: 'GET',
				dataType: 'json',
				data: {
					action: urls.actions.GET_MY_ADMIN_ACCESS_LIST,
					session: a.general.currentSession
				},
				beforeSend: function () {
					general.counterTree = false;
					general.recordTree = false;
				}
			}).done(function (data) {
				if (sessionInvalid(data[0])) { return; }
				var resp = data[0],
					counters = resp.counters.jtree,
					records = resp.records.jtree;
					
				if (counters.length !== 0) {
					general.tree.localmanagerTreeStruc.counter = counters;
					general.counterTree = true;
				}
				if (records.length !==  0) {
					general.recordTree = true;
					general.tree.localmanagerTreeStruc.record = records;
				}
			});*/
		},
		loadTrees = function () {
			if (a.general.currentTab === 1) {
				changeAlredyLoaded();
			} else if (a.general.currentTab === 2) {
				//loadAnotherStruc();
				recheckAndShow();
			}
		};
		
		return {
			reset: reset,
			createDivAndTree: createDivAndTree,
			resetToolbars: resetToolbars,
			useJstree: useJstree,
			getSelection: getSelection,
			evt: evt,
			//extractForRecheck: extractForRecheck,
			//reCheckHelper: reCheckHelper,
			//reCheck: reCheck,
			loadAnotherStruc: loadAnotherStruc,
			loadAnotherStrucSilently: loadAnotherStrucSilently,
			loadTrees: loadTrees,
			initialize: initialize
		};
	}()),
	confirmation = (function () {
		var instance = util.extend( instantiatePubsub() ),
			groups,
			users,
			type = '',
			currentTab,
		
		getData = function () {
			var data = {};
			
			if (currentTab === 'service_admin') {
				data.action = urls.actions.SET_USER_ADMIN_ACCESS_LIST;
				data.admin = general.currentProfile.username;
			} else if (currentTab === 'local_admin') {
				data.action =  urls.actions.SET_USER_VIEW_ACCESS_LIST;
				data.viewer = general.currentProfile.username;
			}
			data.type = type;
			data.groups = groups.forSend.join(',') || '';
			data.users = users.forSend.join(',') || '';
			
			return data;
		},
		makeAjax = function () {
			ajax({
				data : getData(),
			})
			.done(function (data) {
				var status = '', // 'error' || 'success'
					message = '';
				
				if ( typeof data[0].result !== 'undefined' ) {
					status = 'success';
				} else if ( typeof data[0].error_msg !== 'undefined' ) {
					status = 'error';
				}
				
				if ( status === 'success' ) {
					message = 'تغییر دسترسی با موفقیت انجام شد.';
					message += '<br />';
					message += 'پیام سرور: ';
					message += '<br />';
					message += data[0].result;
				} else if ( status === 'error' ) {
					if (data[0].error_code === -3) {
						message = 'مجوز های شما تغییر کرده اند، برای انجام عملیات مورد نظر صفحه را رفرش کنید.';
						message += '<br />';
						message += 'پیام سرور: ';
						message += '<br />';
					} else {
						message = 'تغییر دسترسی شکست خورد.';
						message += '<br />';
						message += 'پیام سرور: ';
						message += '<br />';
						message += data[0].error_msg;
					}
				}
				alertify[status](message);
				instance.publish('gave_access', type);
			})
			.fail(function () {
				instance.publish('gave_access_fail');
			});
			/*$.ajax({
				url: urls.mainUrl,
				type : 'GET',
				dataType : 'json',
				data : data,
			})
			.done(function ( data, textStatus, jqXHR ) {
				if (sessionInvalid(data[0])) { return; }
				var status = '', // 'error' || 'success'
					message = '';
				
				if ( typeof data[0].result !== 'undefined' ) {
					status = 'success';
				} else if ( typeof data[0].error_msg !== 'undefined' ) {
					status = 'error';
				}
				
				if ( status === 'success' ) {
					message = 'تغییر دسترسی با موفقیت انجام شد.';
					message += '<br />';
					message += 'پیام سرور: ';
					message += '<br />';
					message += data[0].result;
				} else if ( status === 'error' ) {
					if (data[0].error_code === -3) {
						message = 'مجوز های شما تغییر کرده اند، برای انجام عملیات مورد نظر صفحه را رفرش کنید.';
						message += '<br />';
						message += 'پیام سرور: ';
						message += '<br />';
					} else {
						message = 'تغییر دسترسی شکست خورد.';
						message += '<br />';
						message += 'پیام سرور: ';
						message += '<br />';
						message += data[0].error_msg;
					}
				}
				alertify[status](message);
				instance.publish('gave_access', type);
			})
			.fail(function ( data, errorTitle, errorDetail ) {
				alertify.error('SetUserAdminAccessList failed<br />'+errorTitle+'<br />'+errorDetail);
				instance.publish('gave_access_fail');
			});*/
		},
		callback = function () {
			$('#modal1').closeModal();
			makeAjax();
		},
		showMessage = function (title, message) {
			$('#modal1').openModal({
				dismissible: false,
				opacity: 0.5,
				in_duration: 300,
				out_duration: 200,
				ready: function () {
					$('#modal1 button').trigger('focus');
				},
				complete: function () {}
			});
		},
		main = function (typeArg, groupsArg, usersArg) {
			type = typeArg;
			groups = groupsArg;
			users = usersArg;
			
			var g = groups.forView,
				u = users.forView,
				usersContainer = $('.fn-cnfr-userscontainer'),
				foldersContainer = $('.fn-cnfr-folderscontainer'),
				html;
				
			$('.fn-cnfr-hiddenable').addClass('no-display');
			$('.fn-cnfr-'+type).removeClass('no-display');
			if ( (g.length === 1  &&  u.length === 0) ||
					(g.length === 0  &&  u.length === 1) ) {
				
				$('.fn-cnfr-singular').removeClass('no-display');
				
			} else {
				$('.fn-cnfr-plural').removeClass('no-display');
			}
			$('.fn-cnfr-user').text(general.currentProfile.username);
			
			html = util.getCommentsInside('.fn-cnfr-item-template')[0].nodeValue.trim();
			usersContainer.empty();
			foldersContainer.empty();
			
			u.forEach(function (i) {
					var el = $.parseHTML(html);
					el = $(el);
					el.text(i);
					usersContainer.append(el[0]);
				});
				
			g.forEach(function (i) {
				var el = $.parseHTML(html);
				el = $(el);
				el.text(i);
				foldersContainer.append(el[0]);
			});

			showMessage();
		},
		defEvt = function () {
			$('#modal1 button').on('click', callback);
			a.tab.on('mgmt', function (data) {
				currentTab = data;
			});
		};
		
		instance.call = callback;
		instance.main = main;
		instance.defEvt = defEvt;
		return instance;
	}()),
	mediator = (function () {
		var instance = util.extend( instantiatePubsub() ),
			bigTreeLoaded = false,
			smallTreeLoaded = false,
			smallCounterTree = false,
			smallRecordTree = false,
			currentTab,
		
		extractForRecheck = function (obj) {
			if ( !util.isObject(obj) ) { throw new Error('tree.extractForRecheck():  Argument is not an object.'); }
			if ( typeof obj === 'undefined' ) { throw new Error('tree.extractForRecheck():  Argument is undefined.'); }
			var counters = [],
				records = [];
			
			obj.counters.users.forEach(function (item) {
				if ( typeof item !== 'undefined' && typeof item === 'string') {
					counters.push(item);
				}
			});
			obj.counters.groups.forEach(function (item) {
				if ( typeof item !== 'undefined' ) {
					counters.push(item);
				}
			});
			obj.records.users.forEach(function (item) {
				if ( typeof item !== 'undefined' ) {
					records.push(item);
				}
			});
			obj.records.groups.forEach(function (item) {
				if ( typeof item !== 'undefined' ) {
					records.push(item);
				}
			});
			return {
				counters: counters,
				records: records
			};
		},
		getSmallTree = function (initTab) {
			ajax({
				data: {
					action: urls.actions.GET_MY_ADMIN_ACCESS_LIST
				},
				beforeSend: function () {
					var html;
					smallCounterTree = false;
					smallRecordTree = false;
					if ( $('.mgmt .tab-preloader').length === 0 ) {
						html = util.getCommentsInside('.tab-preloader-comment')[0].nodeValue.trim();
						$('.mgmt').prepend( $.parseHTML(html) );
						$('.mgmt .mainpanel').addClass('no-display');
					}
					//$('.fn-local_admin-tab_link > button').attr({disabled: true});
					$('.mgmt #fn-record-tree').removeClass('no-display');
					$('.mgmt #fn-record-list').removeClass('no-display');
				}
			})
			.done(function (data) {
				//$('.fn-local_admin-tab_link > button').attr({disabled: false});
				$('.fn-mgmt-tabpre').remove();
				$('.mgmt .mainpanel').removeClass('no-display');
				if (initTab !== currentTab) { return; }
				
				smallTreeLoaded = true;
				if (data[0].counters.jtree.length !== 0) {
					smallCounterTree = true;
				}
				if (data[0].records.jtree.length !== 0) {
					smallRecordTree = true;
				}
				
				if (smallCounterTree) {
					general.counterTree = true;
					counterTree.setStruc(data[0].counters.jtree);
					counterTree.refresh();
				}
				
				if (smallRecordTree) {
					general.recordTree = true;
					recordTree.setStruc(data[0].records.jtree);
					recordTree.refresh();
				} else {
					$('.mgmt #fn-record-tree').addClass('no-display');
					$('.mgmt #fn-record-list').addClass('no-display');
				}
			})
			.fail(function () {
				$('.fn-local_admin-tab_link > button').attr({disabled: false});
				$('.fn-mgmt-tabpre').remove();
				$('.mgmt .mainpanel').removeClass('no-display');
			});
			/*$.ajax({
				url: urls.mainUrl,
				type: 'GET',
				dataType: 'json',
				data: {
					action: urls.actions.GET_MY_ADMIN_ACCESS_LIST,
					session: a.general.currentSession
				},
				beforeSend: function () {
					var html;
					smallCounterTree = false;
					smallRecordTree = false;
					if ( $('.mgmt .tab-preloader').length === 0 ) {
						html = util.getCommentsInside('.tab-preloader-comment')[0].nodeValue.trim();
						$('.mgmt').prepend( $.parseHTML(html) );
						$('.mgmt .mainpanel').addClass('no-display');
					}
					//$('.fn-local_admin-tab_link > button').attr({disabled: true});
					$('.mgmt #fn-record-tree').removeClass('no-display');
					$('.mgmt #fn-record-list').removeClass('no-display');
				}
			})
			.done(function (data) {
				if (sessionInvalid(data[0])) { return; }
				
				//$('.fn-local_admin-tab_link > button').attr({disabled: false});
				$('.fn-mgmt-tabpre').remove();
				$('.mgmt .mainpanel').removeClass('no-display');
				if (initTab !== currentTab) { return; }
				
				smallTreeLoaded = true;
				if (data[0].counters.jtree.length !== 0) {
					smallCounterTree = true;
				}
				if (data[0].records.jtree.length !== 0) {
					smallRecordTree = true;
				}
				
				if (smallCounterTree) {
					general.counterTree = true;
					counterTree.setStruc(data[0].counters.jtree);
					counterTree.refresh();
				}
				
				if (smallRecordTree) {
					general.recordTree = true;
					recordTree.setStruc(data[0].records.jtree);
					recordTree.refresh();
				} else {
					$('.mgmt #fn-record-tree').addClass('no-display');
					$('.mgmt #fn-record-list').addClass('no-display');
				}
			})
			.fail(function () {
				alertify.error('GetMyAdminAccessList Failed.');
				$('.fn-local_admin-tab_link > button').attr({disabled: false});
				$('.fn-mgmt-tabpre').remove();
				$('.mgmt .mainpanel').removeClass('no-display');
			});*/
		},
		getRecheckData = function (initiationTab) {
			var data = {},
				username = general.currentProfile.username,
				c = function () {
					return (currentTab !== initiationTab) ? true : false;
				},
				preloader = function (s) {
					var preWrap = $('.tree-wrap .preloader-wrapper'),
						treeRoot = $('.tree-wrap .treeroot');
					if (s) {
						preWrap.removeClass('no-display');
						treeRoot.addClass('no-display');
					} else {
						preWrap.addClass('no-display');
						treeRoot.removeClass('no-display');
					}
				};
			
			if (currentTab === 'service_admin') {
				data.action = urls.actions.GET_USER_ADMIN_ACCESS_LIST;
				data.admin = username;
			} else if (currentTab === 'local_admin') {
				data.action = urls.actions.GET_USER_VIEW_ACCESS_LIST;
				data.viewer = username;
			}
			
			ajax({
				data: data,
				beforeSend: function () {
					preloader(true);
					counterTree.hide();
					counterTree.resetToolbar(true);
					recordTree.hide();
					recordTree.resetToolbar(true);
				}
			})
			.done(function (data) {
				var recheckData = extractForRecheck(data[0]);
				preloader(false);
				
				if ( c() ) { return; }
				if (initiationTab === 'service_admin') {
					counterTree.recheck( recheckData.counters );
					if ( c() ) { return; }
					counterTree.show();
					counterTree.resetToolbar(false);
					
					recordTree.recheck( recheckData.records );
					if ( c() ) { return; }
					recordTree.show();
					recordTree.resetToolbar(false);
					
				} else if (initiationTab === 'local_admin') {
					if ( smallCounterTree ) {
						counterTree.recheck( recheckData.counters );
						if ( c() ) { return; }
						counterTree.show();
						counterTree.resetToolbar(false);
					}
					if ( smallRecordTree ) {
						recordTree.recheck( recheckData.records );
						if ( c() ) { return; }
						recordTree.show();
						recordTree.resetToolbar(false);
					}
				}
			})
			.fail(function () {
				preloader(false);
			});
			/*$.ajax({
				url: urls.mainUrl,
				type: 'GET',
				dataType: 'json',
				data: data,
				beforeSend: function () {
					preloader(true);
					counterTree.hide();
					counterTree.resetToolbar(true);
					recordTree.hide();
					recordTree.resetToolbar(true);
				}
			})
			.done(function (data) {
				if (sessionInvalid(data[0])) { return; }
				
				var recheckData = extractForRecheck(data[0]);
				preloader(false);
				
				if ( c() ) { return; }
				if (initiationTab === 'service_admin') {
					counterTree.recheck( recheckData.counters );
					if ( c() ) { return; }
					counterTree.show();
					counterTree.resetToolbar(false);
					
					recordTree.recheck( recheckData.records );
					if ( c() ) { return; }
					recordTree.show();
					recordTree.resetToolbar(false);
					
				} else if (initiationTab === 'local_admin') {
					if ( smallCounterTree ) {
						counterTree.recheck( recheckData.counters );
						if ( c() ) { return; }
						counterTree.show();
						counterTree.resetToolbar(false);
					}
					if ( smallRecordTree ) {
						recordTree.recheck( recheckData.records );
						if ( c() ) { return; }
						recordTree.show();
						recordTree.resetToolbar(false);
					}
				}
			})
			.fail(function ( data, errorTitle, errorDetail ) {
				alertify.error('GetUserAdminAccessList failed<br />'+errorTitle+'<br />'+errorDetail);
				preloader(false);
			});*/
			
		},
		instantiate = function () {
			autoc = a.instantiateAutoComp('.mgmt', profile.makeAjax);
			counterTree = instantiateTreeMgmt('.mgmt #fn-counter-tree', '#jstree_demo_div', '.fn-treetoolbar', '#fn-jstree_demo_div-give_access');
			recordTree = instantiateTreeMgmt('.mgmt #fn-record-tree', '#jstree_demo_div_2', '.fn-treetoolbar', '#fn-jstree_demo_div_2-give_access');
			counterList = instantiateLister('#fn-counter-list');
			recordList =  instantiateLister('#fn-record-list');
			
			mgmt.autoc = autoc;
			mgmt.counterTree = counterTree;
			mgmt.recordTree = recordTree;
			mgmt.counterList = counterList;
			mgmt.recordList = recordList;
		},
		defEvt = function () {
			//a.autoc.defEvt('.mgmt');
			
			//profile.makeAutocomplete('mgmt-autocomplete_1');
			
			//a.adminList.defEvt();
			
			profile.defCusEvt();
			confirmation.defEvt();
			
			$('#fn-jstree_demo_div-give_access').on('click', function () {
				if ( $(this).hasClass('disabled') ) { return; }
				
				var selected = mgmt.counterTree.getSelected();
				confirmation.main('counter', selected.groups, selected.users);
			});
			$('#fn-jstree_demo_div_2-give_access').on('click', function () {
				if ( $(this).hasClass('disabled') ) { return; }
				
				var selected = mgmt.recordTree.getSelected();
				confirmation.main('record', selected.groups, selected.users);
			});
		},
		defCusEvt = function () {
			a.mediator.on('fullStrucLoaded', function () {
				//mgmt.tree.createDivAndTree(a.general.treeStructure, true);
				bigTreeLoaded = true;
				if (currentTab === 'service_admin') {
					counterTree.setStruc(a.general.treeStructure);
					counterTree.refresh();
					recordTree.setStruc(a.general.treeStructure);
					recordTree.refresh();
					
					counterTree.treeInstance.deselect_all(true);
					counterTree.treeInstance.close_all();
					recordTree.treeInstance.deselect_all(true);
					recordTree.treeInstance.close_all();
						
					$('.fn-mgmt-tabpre').remove();
					$('.mgmt .mainpanel').removeClass('no-display');
				}
			});
			role.on('determined', function (data) {
				if (data.localAdmin) {
					//mgmt.tree.loadAnotherStruc();
				}
				if (data.recordsMaster === true) {
					$('.mgmt #fn-record-tree').removeClass('no-display');
					$('.mgmt #fn-record-list').removeClass('no-display');
				}
			});
			a.tab.on('mgmt', function (data) {
				//autoc.setCurrent('.mgmt', mgmt.profile.makeAjax, mgmt.profile);
				//mgmt.tree.reset();
				currentTab = data;
				
				profile.reset();
				counterList.reset();
				recordList.reset();
				
				if (data === 'service_admin') {
					if (bigTreeLoaded === true) {
						$('.fn-mgmt-tabpre').remove();
						$('.mgmt .mainpanel').removeClass('no-display');
						
						counterTree.setStruc(a.general.treeStructure);
						counterTree.refresh();
						recordTree.setStruc(a.general.treeStructure);
						recordTree.refresh();
						
						counterTree.treeInstance.deselect_all(true);
						counterTree.treeInstance.close_all();
						recordTree.treeInstance.deselect_all(true);
						recordTree.treeInstance.close_all();
					}
					
					if (a.general.currentUser.permissions.recordsMaster === true) {
						$('.mgmt .fn-hiddenable_subpanel').removeClass('no-display');
					} else {
						$('.mgmt .fn-hiddenable_subpanel').addClass('no-display');
					}
					//mgmt.tree.createDivAndTree(a.general.treeStructure, true);
					
				} else if (data === 'local_admin') {
					//if ( $(this).hasClass('disabled') ) { return; }
					//mgmt.tree.loadAnotherStrucSilently(); // new
					
					getSmallTree(data);
				}
				
				counterList.refresh(data);
				recordList.refresh(data);
				
				counterTree.hide();
				counterTree.resetToolbar(true);
				recordTree.hide();
				recordTree.resetToolbar(true);
			});
			profile.on('beforeUpdate', function () {
				//tree.loadTrees();
				//tree.resetToolbars(true);
			});
			profile.on('update', function (d) {
				getRecheckData(d.initTab);
			});
			counterList.on('beforeItemClick', function () {
				
			});
			counterList.on('itemClick', function (d) {
				profile.callback(d.user, d.initTab);
				//tree.resetToolbars(true);
				//tree.loadTrees();
				getRecheckData(d.initTab);
			});
			recordList.on('beforeitemClick', function () {
				
			});
			recordList.on('itemClick', function (d) {
				profile.callback(d.user, d.initTab);
				//tree.resetToolbars(true);
				//tree.loadTrees();
				getRecheckData(d.initTab);
			});
			counterTree.on('select_deselect', function () {
				
			});
			recordTree.on('select_deselect', function () {
				
			});
			confirmation.on('gave_access', function (d) {
				if (d === 'counter') {
					counterTree.resetToolbar(false);
				} else if (d === 'record') {
					recordTree.resetToolbar(false);
				}
				instance.publish('audio_time', 'success');
			});
			confirmation.on('gave_access_fail', function () {
				instance.publish('audio_time', 'error');
			});
		},
		start = function () {
			instantiate();
			defEvt();
			defCusEvt();
		};
		
		instance.start = start;
		return instance;
	}());
	
	return {
		mediator: mediator
	};
}()),
manager = (function () {
	var
	general = {
		profileUser: ''
		
	},
	profile = (function () {
		var instance = util.extend( instantiatePubsub() ),
		
		updateUi = function (user) {
			if (typeof user.photo === 'string') {
				$('.manager .fn-profile-img').attr({ src: user.photo });
			}
			$('.manager .fn-profile-firstname').html( user.firstname ); 
			$('.manager .fn-profile-lastname').html( user.lastname ); 
			$('.manager .fn-profile-email').html(  user.email );
			$('.manager .fn-profile-title').html( user.title );
			$('.manager .fn-profile-phone').html(  user.number );
		},
		resetUi = function () {
			var img = $.parseHTML(  util.getCommentsInside('.manager .profile-img')[0].nodeValue.trim()  ); 
			$('.manager .fn-autoc-input')			.val('');
			$('.manager .fn-profile-img')			.attr({ src: $(img).attr('src') });
			$('.manager .fn-profile-firstname')		.html( '' ); 
			$('.manager .fn-profile-lastname')		.html( '' ); 
			$('.manager .fn-profile-email')			.html(  '' );
			$('.manager .fn-profile-title')			.html( '' );
			$('.manager .fn-profile-phone')			.html(  '' );
		},
		resetAndUpdateUi = function (rdyUser) {
			resetUi();
			updateUi(rdyUser);
		},
		makeAjax = function (username) {
			ajax({
				data : {
					action: urls.actions.GET_USER_INFO,
					username: username
				},
				beforeSend: function () {
					$('.manager .settings-overlay').removeClass('no-display');
				}
			})
			.done(function ( data, textStatus, jqXHR ) {
				//if (sessionInvalid(data[0])) { return; }
				$('.manager .settings-overlay').addClass('no-display');
				var user = data[0][username],
					rdyUser = a.general.formatUserInfo(user);
				resetAndUpdateUi(rdyUser);
				instance.publish('update', rdyUser);
				
			}).fail(function () {
				$('.manager .settings-overlay').addClass('no-display');
			});
			/*$.ajax({
				url: urls.mainUrl,
				type : 'GET',
				dataType : 'json',
				data : {
					action: urls.actions.GET_USER_INFO,
					session: a.general.currentSession,
					username: username
				},
				beforeSend: function () {
					$('.manager .settings-overlay').removeClass('no-display');
				}
			})
			.done(function ( data, textStatus, jqXHR ) {
				if (sessionInvalid(data[0])) { return; }
				$('.manager .settings-overlay').addClass('no-display');
				var user = data[0][username],
					rdyUser = a.general.formatUserInfo(user);
				resetAndUpdateUi(rdyUser);
				instance.publish('update', rdyUser);
				
			}).fail(function (data, errorTitle, errorDetail) {
				alertify.error('AcUsername failed<br />'+errorTitle+'<br />'+errorDetail);
				$('.manager .settings-overlay').addClass('no-display');
			});*/
		};
		
		instance.resetUi = resetUi;
		instance.resetAndUpdateUi = resetAndUpdateUi;
		instance.makeAjax = makeAjax;
		return instance;
	}()),
	usersList = (function () {
		var instance = util.extend( instantiatePubsub() ),
		createHtml = function (arr) {
			var baseHtml = '',
				els = [],
				tr,
				td;
			baseHtml = util.getCommentsInside('.fn-userlist')[0].nodeValue.trim();
			arr.forEach(function (i) {
				var formatted = a.general.formatUserInfo(i);
				tr = $.parseHTML(baseHtml)[0];
				tr = $(tr);
				tr.contents().filter('td').attr('data-username', formatted.username);
				tr.contents().filter('td').html(formatted.fullnameFa);
				els.push(tr[0]);
			});
			$('.fn-userlist > tbody').empty();
			els.forEach(function (i) {
				$('.fn-userlist > tbody').append(i);
			});
		},
		resetUi = function () {
			$('.fn-userlist > tbody').empty();
		},
		makeAjax = function () {
			var data,
				perms,
				dropdownVal = $('.fn-userlist_dropdown').find(':selected').val();
			dropdownVal = parseInt(dropdownVal, 10);
			
			data = {
				action: urls.actions.GET_USERS_WITH_PERMISSION
			};
			if (dropdownVal === 0) {
				perms = "ANY";
			} else if (dropdownVal === 1) {
				perms = "PERM_SEND_MAIL_BILL,PERM_GET_USER_ADMIN_ACCESS,PERM_SET_USER_ADMIN_ACCESS,PERM_RECORDS_MASTER,PERM_GET_USERS_WITH_ADMIN_ACCESS,PERM_GET_PERMISSION,PERM_SET_PERMISSION,PERM_GET_USERS_WITH_PERMISSION";
			} else if (dropdownVal === 2) {
				perms = "PERM_GET_USER_VIEW_ACCESS,PERM_SET_USER_VIEW_ACCESS,PERM_GET_USERS_WITH_VIEW_ACCESS";
			} else if (dropdownVal === 3) {
				perms = "PERM_GET_USER_INFO,PERM_GET_GROUPS_LIST,PERM_GET_RECORDS,PERM_GET_COUNTERS,PERM_GET_GROUPS_COUNTERS";
			}
			data.permissions = perms;
			ajax({
				data : data,
				beforeSend : function () {
					$('.manager .fn-update_userlist').addClass('disabled');
					$('.manager .fn-update_userlist > i').addClass('fa-spin');
					
				}
			})
			.done(function ( data ) {
				var response = data[0],
					arr = [];
				for (var prop in response) {
					if ( response.hasOwnProperty(prop) ) {
						arr.push(response[prop]);
					}
				}
				$('.manager .fn-update_userlist').removeClass('disabled');
				$('.manager .fn-update_userlist > i').removeClass('fa-spin');
				createHtml(arr);
				
			})
			.fail(function ( data, errorTitle, errorDetail  ) {
				$('.manager .fn-update_admin_list').removeClass('disabled');
				$('.manager .fn-update_admin_list > i').removeClass('fa-spin');
			});
			/*$.ajax({
				url: urls.mainUrl,
				type : 'GET',
				dataType : 'json',
				data : data,
				beforeSend : function () {
					$('.manager .fn-update_userlist').addClass('disabled');
					$('.manager .fn-update_userlist > i').addClass('fa-spin');
					
				}
			})
			.done(function ( data ) {
				if (sessionInvalid(data[0])) { return; }
				//if (  !data[0]['taslimi-p'] ) { alert('data came back messed up'); }
				var response = data[0],
					arr = [];
				for (var prop in response) {
					if ( response.hasOwnProperty(prop) ) {
						arr.push(response[prop]);
					}
				}
				$('.manager .fn-update_userlist').removeClass('disabled');
				$('.manager .fn-update_userlist > i').removeClass('fa-spin');
				createHtml(arr);
				
			})
			.fail(function ( data, errorTitle, errorDetail  ) {
				alertify.error('GetUsersWithAdminAccess failed<br />'+errorTitle+'<br />'+errorDetail);
				$('.manager .fn-update_admin_list').removeClass('disabled');
				$('.manager .fn-update_admin_list > i').removeClass('fa-spin');
			});*/
		},
		itemClicked = function (e) {
			if ( $('.manager .fn-userlist_item').hasClass('disabled') ) { return; }
			ajax({
				data : {
					action: urls.actions.GET_USER_INFO,
					username: $(e.target).data().username
				},
				beforeSend: function () {
					$('.manager .fn-userlist_item').addClass('disabled');
					$('.manager .settings-overlay').removeClass('no-display');
				}
			})
			.done(function (data) {
				$('.manager .fn-userlist_item').removeClass('disabled');
				$('.manager .settings-overlay').addClass('no-display');
				var user = data[0][$(e.target).data().username],
					rdyUser = a.general.formatUserInfo(user);
				instance.publish('submit', rdyUser);
			})
			.fail(function () {
				$('.manager .fn-userlist_item').removeClass('disabled');
				$('.manager .settings-overlay').addClass('no-display');
			});
			/*$.ajax({
				url: urls.mainUrl,
				type : 'GET',
				dataType : 'json',
				data : {
					action: urls.actions.GET_USER_INFO,
					session: a.general.currentSession,
					username: $(e.target).data().username
				},
				beforeSend: function () {
					$('.manager .fn-userlist_item').addClass('disabled');
					$('.manager .settings-overlay').removeClass('no-display');
				}
			})
			.done(function ( data, textStatus, jqXHR ) {
				if (sessionInvalid(data[0])) { return; }
				$('.manager .fn-userlist_item').removeClass('disabled');
				$('.manager .settings-overlay').addClass('no-display');
				var user = data[0][$(e.target).data().username],
					rdyUser = a.general.formatUserInfo(user);
				instance.publish('submit', rdyUser);
			})
			.fail(function (data, errorTitle, errorDetail) {
				alertify.error('GetUserInfo failed<br />'+errorTitle+'<br />'+errorDetail);
				$('.manager .fn-userlist_item').removeClass('disabled');
				$('.manager .settings-overlay').addClass('no-display');
			});*/
		},
		updateList = function () {
			if ( $(this).hasClass('disabled') ) { return; }
			makeAjax();
		},
		refresh = function () {
			updateList();
		},
		defEvt = function () {
			$('.manager .fn-update_userlist').on('click', updateList);
			$('.manager .fn-userlist').on('click .fn-userlist_item', itemClicked);
		};
		
		instance.resetUi = resetUi;
		instance.refresh = refresh;
		instance.defEvt = defEvt;
		return instance;
	}()),
	settings = (function () {
		var
		addAppropriateClass = function (name, length, total) {
			var el;
			$('.manager .fn-subgroup-'+ name +'-btn').removeClass('nonechecked allchecked somechecked');
			if ( length === 0 ) {
				el = $('.manager .fn-subgroup-'+ name +'-btn');
				el.addClass('nonechecked');
				el.data().state = false;
			} else if (length === total) {
				el = $('.manager .fn-subgroup-'+ name +'-btn');
				el.addClass('allchecked');
				el.data().state = true;
			} else if (length > 0 || length < 1) {
				el = $('.manager .fn-subgroup-'+ name +'-btn');
				el.addClass('somechecked');
				el.data().state = false;
			}
		},
		resetSubgroups = function () {
			$('.fn-subgroup-btn').removeClass('nonechecked allchecked somechecked');
			$('.fn-subgroup-btn').addClass('nonechecked');
		},
		adjustSubgroups = function (target) {
			var length;
			if ( target.hasClass('fn-subgroup-action') ) {
				length = $('.manager .fn-subgroup-action:checked').length;
				addAppropriateClass('action', length, 1);
				
			} else if ( target.hasClass('fn-subgroup-service_admin') ) {
				length = $('.manager .fn-subgroup-service_admin:checked').length;
				addAppropriateClass('service_admin', length, 7);
				
			} else if ( target.hasClass('fn-subgroup-local_admin') ) {
				length = $('.manager .fn-subgroup-local_admin:checked').length;
				addAppropriateClass('local_admin', length, 3);

			} else if ( target.hasClass('fn-subgroup-manager') ) {
				length = $('.manager .fn-subgroup-manager:checked').length;
				addAppropriateClass('manager', length, 5);
			}
		},
		subgroupCheck = function (e) {
			if ( $(this).hasClass('disabled') ) { return; }
			var target = $(this),
				state = target.data().state,
				perms = [],
				name = target.data().subgroupname,
				subgroupInputs = $('.manager .'+name+'-sec .fn-settings-checkbox'),
				data,
				done;
				
			subgroupInputs.each(function() {
				perms.push( $(this).attr('id') );
			});
			data = {
				username: general.profileUser,
				permission: perms.join(',')
			};
			if (state === false) {
				data.action = urls.actions.ADD_USER_PERMISSION;
				
			} else if (state === true) {
				data.action = urls.actions.DEL_USER_PERMISSION;
			}
			done = function (data) {
				if (data[0].result) {
					target.removeClass('nonechecked allchecked somechecked');
					if (state === false) {
						subgroupInputs.prop({checked: true});
						target.addClass('allchecked');
						target.data().state = true;
						
					} else if (state === true) {
						subgroupInputs.prop({checked: false});
						target.addClass('nonechecked');
						target.data().state = false;
					}
					Materialize.toast(data[0].result, 1000);
				} else if (data[0].error_msg) {
					Materialize.toast(data[0].error_msg, 1000);
				}
			};
			ajax({
				data: data
			})
			.done(done)
			.fail(function () {
				
			});
			/*$.ajax({
				url: urls.mainUrl,
				type: 'GET',
				dataType: 'json',
				data: data
			})
			.done(done)
			.fail(function () {
				alertify.error(data.action + ' Failed.');
			});*/
		},
		reset = function () {
			var checkboxes = $('.manager .fn-settings-checkbox');
			checkboxes.prop({checked: false});
			checkboxes.prop({disabled: true});
		},
		check = function (toCheckArr) {
			$('.manager .fn-subgroup-btn').removeClass('disabled');
			resetSubgroups();
			$('.manager .fn-settings-checkbox').prop({disabled: false});
			$('.manager .fn-settings-checkbox').prop('checked', false);
			toCheckArr.forEach(function (i) {
				var item = $('#'+i);
				item.prop('checked', true);
				adjustSubgroups( item );
			});
		},
		makeAjax = function (username) {
			ajax({
				data: {
					action: urls.actions.GET_USER_PERMISSION_LIST,
					username: general.profileUser || username
				}
			})
			.done(function (data) {
				
				check(data[0]);
			})
			.fail(function () {
				
			});
			/*$.ajax({
				url: urls.mainUrl,
				type: 'GET',
				dataType: 'json',
				data: {
					action: urls.actions.GET_USER_PERMISSION_LIST,
					username: general.profileUser || username,
					session: a.general.currentSession
				}
			})
			.done(function (data) {
				if ( sessionInvalid(data[0]) ) { return; }
				check(data[0]);
			})
			.fail(function () {
				alertify.error("GetUserPermissionList Failed.");
			});*/
		},
		changePerm = function (o) {
			var data = {},
				done;
			
			if (o.addremove === true) {
				data.action = urls.actions.ADD_USER_PERMISSION;
			} else if (o.addremove === false) {
				data.action = urls.actions.DEL_USER_PERMISSION;
			}
			data.username = general.profileUser;
			data.permission = o.perm;
			
			done = function (data) {
				//if (sessionInvalid(data[0])) { return; }
				$('.manager .settings-overlay').addClass('no-display');
				if (data[0].result) {
					//alertify.success(data[0].result);
					
					if (o.addremove === true) {
						o.target.prop('checked', true);
					} else if (o.addremove === false) {
						o.target.prop('checked', false);
					}
					
					adjustSubgroups(o.target);
					Materialize.toast(data[0].result, 1000);
				} else if (data[0].error_msg) {
					//alertify.error(data[0].error_msg);
					Materialize.toast(data[0].error_msg, 1000);
				}
			};
			
			ajax({
				data: data,
				beforeSend: function () {
					$('.manager .settings-overlay').removeClass('no-display');
				}
			})
			.done(done)
			.fail(function () {
				$('.manager .settings-overlay').addClass('no-display');
			});
			/*$.ajax({
				url: urls.mainUrl,
				type: 'GET',
				dataType: 'json',
				data: data,
				beforeSend: function () {
					$('.manager .settings-overlay').removeClass('no-display');
				}
			})
			.done(done)
			.fail(function () {
				alertify.error(data.action + ' Failed.');
				$('.manager .settings-overlay').addClass('no-display');
			});*/
		},
		addPerm = function (perm, target) {
			changePerm({
				addremove: true,
				perm: perm,
				target: target
			});
		},
		delPerm = function (perm, target) {
			var id = target.attr('id');
			if ( general.profileUser === a.general.currentUser.username &&
					(id === 'PERM_SET_PERMISSION' || id === 'PERM_GET_PERMISSION') ) {
				confirmation.show(changePerm, {
					addremove: false,
					perm: perm,
					target: target
				});
			} else {
				changePerm({
					addremove: false,
					perm: perm,
					target: target
				});
			}
		},
		determineCheckbox = function (e) {
			e.preventDefault();
			var target = $(e.target),
				checked = target.prop('checked'),
				perm = target.attr('id');
				
			if (checked === true) {
				addPerm(perm, target);
			} else if (checked === false) {
				delPerm(perm, target);
			}
		},
		initialize = function () {
			reset();
		},
		defEvt = function () {
			$('.manager .fn-settings-checkbox').on('click', determineCheckbox);
			// $('.manager .fn-checkall').on('click', checkAll);
			$('.manager .fn-subgroup-btn').on('click', subgroupCheck);
			
		};
		
		return {
			reset: reset,
			makeAjax: makeAjax,
			initialize: initialize,
			defEvt: defEvt
		};
	}()),
	confirmation = (function () {
		var callback,
			parameters = {},
		
		ok = function () {
			$('#modal3').closeModal();
			getCallback()( getPars() );
		},
		getCallback = function () {
			return callback;
		},
		getPars = function () {
			return parameters;
		},
		setCallback = function (fn, obj) {
			callback = fn;
			parameters = obj;
		},
		show = function (okFn, pars) {
			setCallback(okFn, pars);
			$('#modal3').openModal({
				dismissible: false,
				opacity: 0.5,
				in_duration: 300,
				out_duration: 200,
				ready: function() {
					$('#modal3 button').trigger('focus');
				},
				complete: function () {}
			});
		},
		defEvt = function () {
			$('#modal3 button').on('click', ok);
		};
		return {
			show: show,
			defEvt: defEvt
		};
	}()),
	reset = function () {
		profile.reset();
		settings.reset();
	},
	initialize = function () {
		usersList.refresh();
		settings.initialize();
	},
	mediator = (function () {
		var instance = util.extend( instantiatePubsub() ),
		
		defEvt = function () {
			//a.autoc.defEvt('.manager');
			a.manager.autoc = a.instantiateAutoComp('.manager', profile.makeAjax);
			usersList.defEvt();
			settings.defEvt();
			confirmation.defEvt();
		},
		defCusEvt = function () {
			a.tab.on('manager', function () {
				//autoc.setCurrent('.manager', manager.profile.makeAjax, manager.profile);
				//a.manager.reset();
				//a.manager.userList.refresh();
			});
			profile.on('update', function (user) {
				general.profileUser = user.username;
				settings.makeAjax();
			});
			usersList.on('submit', function (user) {
				general.profileUser = user.username;
				profile.resetAndUpdateUi(user);
				settings.makeAjax(user.username);
			});
			
		},
		start = function () {
			defEvt();
			defCusEvt();
			initialize();
		};
		
		instance.start = start;
		return instance;
	}());
	
	return {
		mediator: mediator
	};
}()),
emailer = (function () {
	var autoc,
		monthpicker,
		theTree,
	
	general = {
		treeStructure: [],
		allNodes: [],
		jobId: 0,
		selectedDate: '',
		currentYear: 0,
		recipient: '',
		specificSend: true
	},
	updateProfile = function (user) {
		if (typeof user.photo === 'string') {
			$('.emailer .fn-profile-img').attr({ src: user.photo });
		}
		$('.emailer .fn-profile-firstname').html( user.firstname );
		$('.emailer .fn-profile-lastname').html( user.lastname );
		$('.emailer .fn-profile-email').html(  user.email );
		$('.emailer .fn-profile-title').html( user.title );
		$('.emailer .fn-profile-phone').html(  user.number );
	},
	instantiateTreeEmailer = function (root, treeSelector, toolbarItemsSelector) {
		var baseTree = instantiateTree(root, treeSelector, toolbarItemsSelector),
			instance = util.extend( baseTree ),
		
		setToolbar = function (full) {
			if (typeof full === 'undefined' || typeof full !== 'boolean') { throw new Error(instance.getObjName()+'resetToolbar(): A boolean argument is necessary.'); }
			if (full === true) {
				instance.toolbarItems.removeClass('disabled'); 	// enable
			} else if (full === false) {
				instance.toolbarItems.addClass('disabled');		// disable
			}
		};
		
		instance.setToolbar = setToolbar;
		return instance;
	},
	tree = (function () {
		var useJstree = function (divId, treeStructure) {
			$.jstree.defaults.plugins = [
				//"grid"
				"checkbox"
				// "contextmenu", 
				// "dnd", 
				// "massload", 
				// "search", 
				// "sort", 
				// "state", 
				// "types", 
				// "unique", 
				// "wholerow", 
				// "changed", 
				// "conditionalselect"
			];
			
			$('#'+divId).jstree({
				core : {
					//animation : 0,
					data : treeStructure
				},
				types : {
					"default" : {
						//"icon" : "jstree-icon jstree-file"
						"disabled" : { 
							"check_node" : false, 
							"uncheck_node" : false 
						}
					},
					"demo" : {
					}
				}
			});
			$('.emailer .fn-treetoolbar').removeClass('disabled');
		},
		getSelection = function (selected, treeId) {
			if ( !util.isArray(selected) ) { throw new Error('getSelection:  Argument is not an array.'); }
			var childless = [],
				withChild = [];
				
			general.selectedNodes.groups = [];
			general.selectedNodes.users = [];
			general.selectedNodes.groupsAndUsers = [];
			general.selectedNodes.groupNames = [];
			general.selectedNodes.userCount = 0;
			
			selected.forEach(function (item) {
				if (item.children.length === 0) {
					if (  $.inArray( item.text, childless ) === -1  ) {
						childless.push(item);
						general.selectedNodes.userCount += 1;
					}
				} else if (item.children.length !== 0) {
					withChild.push(item);
				}
			});
			childless.forEach(function (item) {
				var parent = $('#'+treeId).jstree(true).get_node(item.parent);
				if ( parent.state.selected === false || item.parent === '#' ) {

					if (typeof item.icon === 'string') {	// file
						
						general.selectedNodes.users.push(item.text);
						
					} else if (typeof item.icon === 'undefined' || typeof item.icon === 'boolean') { // childless folder
					
						general.selectedNodes.groups.push(item.id);
						general.selectedNodes.groupNames.push(item.text);

					}
					
					general.selectedNodes.groupsAndUsers.push(item.text);
				}
			});
			withChild.forEach(function (item) {
				if ( item.children.length !== 0 && item.state.selected === true ) {
					var parent = $('#'+treeId).jstree(true).get_node(item.parent);
					if ( parent.state.selected === false || item.parent === '#') {
						general.selectedNodes.groups.push(item.id);
						general.selectedNodes.groupNames.push(item.text);
						general.selectedNodes.groupsAndUsers.push(item.text);
					}
				}
			});
		},
		evt = function (mainTree) {
			var selected = [];
			
			$('#'+mainTree).on("changed.jstree", function (e, data) {
				if ( $('#'+mainTree).jstree(true).get_selected().length === 0 ) {
					buttons.changeFirstBtn(false);
				} else {
					buttons.changeFirstBtn(true);
				}
				selected = $( '#'+mainTree).jstree('get_selected', ['full'] );
				getSelection( selected, mainTree );
			});
			
			$('#fn-'+mainTree+'-open_all').on('click', function () {
				if ( !$(this).hasClass('disabled') ) {
					$('#'+mainTree).jstree(true).open_all();
				}
			});
			$('#fn-'+mainTree+'-close_all').on('click', function () {
				if ( !$(this).hasClass('disabled') ) {
				$('#'+mainTree).jstree(true).close_all();
				}
			});
			$('#fn-'+mainTree+'-select_all').on('click', function () {
				if ( !$(this).hasClass('disabled') ) {
					$('#'+mainTree).jstree(true).select_all();
				}
			});
			$('#fn-'+mainTree+'-deselect_all').on('click', function () {
				if ( !$(this).hasClass('disabled') ) {
					$('#'+mainTree).jstree(true).deselect_all();
					buttons.disable();
				}
			});
		},
		loadTree = function () {	
			//$('#jstree_emailer').remove();
			$('#fn-jstree_emailer-parent').append( $.parseHTML('<div id="jstree_emailer"></div>') );
			
			/*var treeStructure = a.general.treeStructure;
			useJstree('jstree_emailer', treeStructure);
			treeStructure.forEach(function (i) {
				general.allNodes.push(i.id);
			});
			evt('jstree_emailer');*/
		};
		
		return {
			useJstree: useJstree,
			getSelection: getSelection,
			evt: evt,
			loadTree: loadTree
		};
	}()),
	confirmation = (function () {
		var groups,
			users,
		
		getData = function () {
			var inputVal = $('.fn-us-input').val(),
				recipient,
				data;
			/*
			// first
			if ( inputVal.match(/^[.]{0,3}$/) || util.isEmptyString(inputVal) ) {
				finalVal = 'self';
			} else if ( inputVal.indexOf('@') === -1 || inputVal.slice(-3 !== 'tehran.ir') ) {
				finalVal = inputVal;
			}
			*/
			data = {
				action: a.urls.actions.SEND_MAIL_BILL,
				month: general.selectedDate,
				users: users.forSend.join(',') || '',
				groups: groups.forSend.join(',') || ''
			};
			if ( !util.isEmptyString(general.recipient) ) {
				data.recipient = general.recipient;
			} else if ( util.isEmptyString(general.recipient) ) {
				data.recipient = inputVal;
			}
			// else { inputVal is not going to be empty anymore since it got initialized during page load
			//	recipient = general.currentUser.username;
			// }
			return data;
		},
		makeAjax = function () {
			ajax({
				data: getData(),
				beforeSend: function () {
					$('.progress-bar').removeClass('no-opacity');
					$('.fn-progress-main-msg').text('در حال بررسی...');
					
					theTree.disableAll();
					$('#fn-mp-input').attr({disabled: true});
					$('.fn-us-input').attr({disabled: true});
					$('.fn-radio').attr({disabled: true});
					$('.mp-wrap > label').addClass('lbl-disabled');
					
				}
			})
			.done(function (data) {
				var response = data[0],
					error = '';
				if (response.jobid) {
					general.jobId = data[0].jobid;
					buttons.updating();
				} else if (response.error_msg) {
					error = response.error_msg;
					if ( error === 'empty users and groups list.') {
						// this never happens for now
					} else if ( error === 'reuested recipient not found in db!' ) {
						buttons.callback(false);
					}
					
				}
				
			})
			.fail(function () {
				resetEverything();
			});
			/*$.ajax({
				url: urls.mainUrl,
				type: 'GET',
				dataType: 'json',
				data: data,
				beforeSend: function () {
					$('.progress-bar').removeClass('no-opacity');
					$('.fn-progress-main-msg').text('در حال بررسی...');
					
					theTree.disableAll();
					$('#fn-mp-input').attr({disabled: true});
					$('.fn-us-input').attr({disabled: true});
					$('.fn-radio').attr({disabled: true});
					$('.mp-wrap > label').addClass('lbl-disabled');
					
				}
			})
			.done(function (data) {
				if (sessionInvalid(data[0])) { return; }
				var response = data[0],
					error = '';
				if (response.jobid) {
					general.jobId = data[0].jobid;
					buttons.updating();
				} else if (response.error_msg) {
					error = response.error_msg;
					if ( error === 'empty users and groups list.') {
						// this never happens for now
					} else if ( error === 'reuested recipient not found in db!' ) {
						buttons.callback(false);
					}
					
				}
				
			})
			.fail(function () {
				alert('خطا');
				resetEverything();
			});*/
		},
		callback = function () {
			$('#modal2').closeModal();
			makeAjax();
		},
		showMessage = function (title, message) {
			var firstBtn = $('#fn-submit-first'),
				secondBtn = $('#fn-submit-second');
			
			$('#modal2 .modal-content').empty();
			$('#modal2 .modal-content').html( '<h1>' + title + '</h1>' +
					'<p>' + message + '</p>' );
			$('#modal2').openModal({
				dismissible: false,
				opacity: 0.5,
				in_duration: 300,
				out_duration: 200,
				ready: function () {
					$('#modal2 button').trigger('focus');
					firstBtn.attr({disabled: true});
					secondBtn.attr({disabled: true});
					$('.fn-treetoolbar').attr({disabled: true});
					buttons.reset();
				},
				complete: function () {
					firstBtn.attr({disabled: false});
					secondBtn.attr({disabled: false});
					$('.fn-treetoolbar').attr({disabled: false});
					
				}
			});
		},
		main = function (groupsArg, usersArg, userCount) {
			groups = groupsArg;
			users = usersArg;
			
			var g = groups.forView,
				u = users.forView,
				title = 'فرستادن ایمیل ها',
				message = '',
				inputVal = $('.fn-us-input').val();
			
			message += 'شما می خواهید&nbsp;';
			message += '<span class="larger">'+userCount+' </span>';
			message += 'ایمیل به&nbsp;&nbsp;';
			
			
			if (general.recipient) {
				if (general.recipient === '_ToOwner_') {
					message += 'صاحبان آنها';
				} else {
					message += general.recipient;
				}
			} else if ( (!general.recipient  ||  util.isEmptyString(general.recipient)) && !util.isEmptyString(inputVal) ) {
				message += inputVal;
			} else {
				message += general.currentUser.username;
			}
			message += '&nbsp;&nbsp;ارسال کنید:';
			
			message += '<br /><br />';
			if (u.length !== 0 && g.length === 0) {
				message += 'کاربران :';
				message += '<br /><br />';
				message += u.join('    <br />    ');
			} else if (g.length !== 0 && u.length === 0) {
				message += 'پوشه ها :';
				message += '<br /><br />';
				message += g.join('<br />');
			} else if ( g.length !== 0 && u.length !== 0 ) {
				message += 'کاربران :';
				message += '<br /><br />';
				message += u.join('<br />');
				message += '<br /><br />';
				message += 'پوشه ها :';
				message += '<br /><br />';
				message += g.join('<br />');
			}
			showMessage(title, message);
		},
		defEvt = function () {
			$('#modal2 button').on('click', callback);
		};
		
		return {
			defEvt: defEvt,
			main: main
		};
		
	}()),
	buttons = (function () {
		var instance = util.extend( instantiatePubsub() ),
			secondClicked = false,
			inProcess = false,
			timer,
			counter = 3,
			firstBtn = $('#fn-submit-first'),
			secondBtn = $('#fn-submit-second'),
			//span = $('#fn-submit-first-text'),
			//def = span.text();
			def = firstBtn.html(),
			msgMain = 'در حال فرستادن ایمیل ها...',
			msgRemain = 'ایمیل باقی مانده است.',
			msgStarting = 'در حال شروع...',
			msgInprog = 'در جریان...',
			msgErr = 'وضعییت ناشناس.',
		changeFirstBtn = function (state) {
			if ( typeof state !== 'boolean' ) { throw new Error('changeFirstBtn():  Argument is not boolean.'); }
			
			if (state === true) { // something selected
				if (general.specificSend === false) {
					firstBtn.removeClass('disabled');
				} else if (general.specificSend === true) {
					if ( userSelect.isInputValid() ) {
						firstBtn.removeClass('disabled');
					} 
				}
			} else if (state === false) { // nothing selected
				buttons.disableBoth();
			} 
		},
		disable = function () {
			secondBtn.addClass('disabled');
			firstBtn.removeClass('button-action');
			firstBtn.addClass('button-caution');
			firstBtn.html(def);
			inProcess = false;
			clearInterval(timer);
		},
		first = function () {
			if ( $(this).hasClass('disabled') || inProcess === true ) { return; }
			
			inProcess = true;
			secondBtn.removeClass('disabled');
			secondBtn.addClass('button-action');
			firstBtn.removeClass('button-caution');
			firstBtn.addClass('button-action');
			//span.text(counter+'');
			firstBtn.text(counter+'');
			
			timer = setInterval(function () {
				counter -= 1;
				//span.text(counter+'');
				firstBtn.html(counter+'');
				if ( counter === 0 ) {
					inProcess = false;
					counter = 3;
					clearInterval(timer);
					if (secondClicked === false) {
						secondBtn.removeClass('button-action');
						secondBtn.addClass('disabled');
						firstBtn.removeClass('button-action');
						firstBtn.addClass('button-caution');
						firstBtn.html(def);
						//span.text(def);
					} else {
						//span.text(def);
					}
				}
			}, 1000);
		},
		second = function () {
			if ( $(this).hasClass('disabled') ) { return; }
			secondClicked = true;
			
			// firstBtn.attr({disabled: true});
			// secondBtn.attr({disabled: true});
			// $('.fn-treetoolbar').attr({disabled: true});
			
			//var selected = theTree.getSelected();
			//confirmation.main(selected.groups, selected.users, selected.userCount);
			instance.publish('final_submit');
		},
		updatingDelayed = function () {
			setTimeout(function () {
				updating();
			}, 200);
		},
		updating = function () {
			ajax({
				data: {
					action: urls.actions.GET_JOB_STATUS,
					jobid: general.jobId
				}
			})
			.done(function (data) {
				var status = data[0].status;
				callback(status);
			})
			.fail(function () {
				updatingDelayed();
			});
			/*$.ajax({
				url: urls.mainUrl,
				type: 'GET',
				dataType: 'json',
				data: {
					action: urls.actions.GET_JOB_STATUS,
					session: a.general.currentSession,
					jobid: general.jobId
				}
			})
			.done(function (data) {
				if (sessionInvalid(data[0])) { return; }
				var status = data[0].status;
				callback(status);
			})
			.fail(function () {
				updatingDelayed();
			});*/
		},
		callback = function (status) {
			var arr = [],
				remainingItems = 0;
			
			if ( status === false ) {
				$('.fn-remaining').addClass('hidden');
				$('.fn-progress-msg').text('کاربر وجود ندارد.');
				
				
				setTimeout(function () {
					resetEverything('کاربر وجود ندارد.', 'error');
				}, 1000);
				
				
			} else if (status === 'starting') {
				$('.fn-progress-main-msg').text(msgMain);
				$('.fn-remaining').addClass('hidden');
				$('.fn-progress-msg').text(msgStarting);
				updatingDelayed();
				
			} else if (status === 'in progress') {
				$('.fn-progress-main-msg').text(msgMain);
				$('.fn-remaining').addClass('hidden');
				$('.fn-progress-msg').text(msgInprog);
				updatingDelayed();
				
			} else if (status === '') {
				$('.fn-progress-main-msg').text(msgMain);
				$('.fn-remaining').addClass('hidden');
				$('.fn-progress-msg').text(msgErr);
				updatingDelayed();
				
			} else if (status.indexOf('/') !== -1) {
				$('.fn-progress-main-msg').text(msgMain);
				$('.fn-progress-msg').text(msgRemain);
				$('.fn-remaining').removeClass('hidden');
				arr = status.split('/');
				remainingItems = parseInt(arr[1], 10) - parseInt(arr[0], 10);
				$('.fn-remaining').text(remainingItems);
				updatingDelayed();
				
			} else if (status === 'finished') {
				resetEverything('تمامی ایمیل ها فرستاده شد.', 'success');
			}
		},
		resetEverything = function (logMsg, logType) {
			inProcess = false;
			secondClicked = false;
			alertify[logType](logMsg);
			$('.progress-bar').addClass('no-opacity');
			theTree.enableAll();
			firstBtn.attr({disabled: false});
			firstBtn.removeClass('button-action');
			firstBtn.addClass('button-caution');
			firstBtn.html(def);
			secondBtn.attr({disabled: false});
			secondBtn.removeClass('button-action');
			secondBtn.addClass('disabled');
			$('.fn-treetoolbar').attr({disabled: false});
			$('#fn-mp-input').attr({disabled: false});
			$('.fn-us-input').attr({disabled: false});
			$('.fn-radio').attr({disabled: false});
			$('.mp-wrap > label').removeClass('lbl-disabled');
			
			$('.fn-progress-main-msg').text('');
			$('.fn-progress-msg').text('');
			$('.fn-remaining').text('');
		},
		reset = function () {
			inProcess = false;
			secondClicked = false;
			clearInterval(timer);
			secondBtn.removeClass('button-action');
			secondBtn.addClass('disabled');
			firstBtn.removeClass('button-action');
			firstBtn.addClass('button-caution');
			firstBtn.html(def);
		},
		disableBoth = function () {
			inProcess = false;
			secondClicked = false;
			clearInterval(timer);
			firstBtn.addClass('disabled');
			firstBtn.html(def);
			secondBtn.addClass('disabled');
			firstBtn.addClass('button-caution');
		};
		
		
		instance.disableBoth = disableBoth;
		instance.changeFirstBtn = changeFirstBtn;
		instance.disable = disable;
		instance.first = first;
		instance.second = second;
		instance.reset = reset;
		instance.updating = updating;
		instance.callback = callback;
		
		return instance;
	}()),
	monthpickerOld = (function () {
		var currentYear = parseInt( $('.fn-mp-year').text(), 10 ),
		initialize = function (date) {
			var month = date.month.number +'',
				year = date.year.full +'';
			
			general.selectedDate = year + month;
			general.currentYear = date.year.full;
			$('#fn-mp-input').val( year.slice(-2) + '/' + month);
		},
		show = function (e) {
			e.stopPropagation();
			$('.monthpicker').removeClass('hidden opacity-none');
			$('.monthpicker').addClass('visible opacity-full');
		},
		hide = function (e) {
			var el = $('.monthpicker');
			if( !$(e.target).closest('.monthpicker').length ) {
				if( el.is(":visible") ) {
					el.removeClass('visible opacity-full');
					el.addClass('opacity-none hidden');
				}
			}
		},
		next = function () {
			currentYear += 1;
			if ( currentYear <= general.currentYear ) {
				$('.fn-mp-year').text(''+currentYear);
			} else {
				currentYear = general.currentYear;
			}
		},
		prev = function () {
			currentYear -= 1;
			$('.fn-mp-year').text(currentYear+'');
		},
		main = function () {
			var year = $('.fn-mp-year').text(),
				month = $(this).data().val;
			general.selectedDate = year + month;
			$('#fn-mp-input').val( year.slice(-2) + '/' + month);
			$('.monthpicker').removeClass('visible opacity-full');
			$('.monthpicker').addClass('opacity-none hidden');
		};
		
		return {
			initialize: initialize,
			next: next,
			prev: prev,
			show: show,
			hide: hide,
			main: main
		};
	}()),
	userSelect = (function () {
		var userCount,
		isInputValid = function () {
			var el = $('.fn-us-input'),
				cond = ( el.prop('disabled') === false   &&
						!util.isEmptyString( el.val() )  );
			return (cond) ? true : false;
		},
		unsetRecep = function () {
			var userInputVal = $('.fn-us-input').val();
			general.recipient = '';
			if ( util.isEmptyString(userInputVal) ) {
				buttons.disableBoth();
			} else if ( userCount !== 0 ) {
				$('#fn-submit-first').removeClass('disabled');
				
			}
		},
		main = function () {
			var id = $(this).attr('id');
			if ( id === 'self-radio' || id === 'ebillingvoip' ) {
				general.specificSend = false;
				if ( id === 'self-radio' ) {
					general.recipient = '_ToOwner_';
				} else if ( id === 'ebillingvoip' ) {
					general.recipient = 'ebillingvoip';
				}
				$('.fn-us-input').val('');
				$('.fn-us-input').attr({disabled: true});
				if ( userCount !== 0 ) {
					$('#fn-submit-first').removeClass('disabled');
				}
			} else if ( id === 'user-select-radio' ) {
				general.recipient = '';
				general.specificSend = true;
				$('.fn-us-input').attr({disabled: false});
				if ( userCount === 0 || !isInputValid() ) {
					buttons.disableBoth();
				}
			}
		};
		
		return {
			set userCount(v) { userCount = v; },
			isInputValid: isInputValid,
			unsetRecep: unsetRecep,
			main: main
		};
	}()),
	initialize = function (user) {
		updateProfile(user);
		general.recipient = a.general.currentUser.username;
		$('.fn-us-input').val(a.general.currentUser.username);
		
		//tree.loadTree(); in mgmt
		//a.emailer.monthpicker.initialize();
		
	},
	mediator = (function () {
		var instance = util.extend( instantiatePubsub() ),
		instantiate = function () {
			autoc = a.instantiateAutoComp('.emailer');
			theTree = instantiateTreeEmailer('.emailer', '#jstree_emailer', '.fn-treetoolbar');
			monthpicker = instantiateMonthpicker('.emailer');
			
			a.emailer.autoc = autoc;
			a.emailer.theTree = theTree;
			a.emailer.monthpicker = monthpicker;
		},
		defEvt = function () {
			//a.mgmt.profile.makeAutocomplete('emailer-autocomplete_1');
			//a.autoc.defEvt('.emailer');//a.autoc.defEvt();
			
			
			$('.fn-radio').on('click', userSelect.main);
			$('.fn-us-input').on('keyup', userSelect.unsetRecep);
			
			$('#fn-submit-first').on('click', buttons.first);
			$('#fn-submit-second').on('click', buttons.second);
			
			//monthpicker
			//$('body').on('click', monthpicker.hide);
			//$('#fn-mp-input').on('click', monthpicker.show);
			//$('.fn-month').on('click', monthpicker.main);
			//$('.fn-mp-next').on('click', monthpicker.next);
			//$('.fn-mp-prev').on('click', monthpicker.prev);
			confirmation.defEvt();
		},
		defCusEvt = function () {
			a.mediator.on('fullStrucLoaded', function () {
				//tree.loadTree();
				//$('#fn-jstree_emailer-parent').append( document.createElement('div') ); // I don't why, but without this, recheck keeps hanging
				theTree.setStruc(a.general.treeStructure);
				theTree.refresh();
				theTree.setToolbar(true);
			});
			a.mediator.on('gotDate', function (d) {
				monthpicker.initialize(d);
			});
			a.session.on('valid', function (d) {
				initialize(d);
			});
			a.tab.on('emailer', function () {
				//autoc.setCurrent('.emailer');
			});
			monthpicker.on('select', function (data) {
				general.selectedDate = data;
			});
			theTree.on('select_deselect', function (data) {
				//general.selectedNodes.users = data.users.forSend;
				//general.selectedNodes.groups = data.groups.forSend;
				//general.selectedNodes.groupNames = data.groups.forView;
				//general.selectedNodes.userCount = data.userCount;
				
				userSelect.userCount = theTree.getSelected().userCount;
				if ( theTree.selectedCount() === 0 ) {
					buttons.changeFirstBtn(false);
				} else {
					buttons.changeFirstBtn(true);
				}
			});
			theTree.on('deselect_all', function (data) {
				buttons.disable();
			});
			buttons.on('final_submit', function () {
				var selected = theTree.getSelected();
				confirmation.main(selected.groups, selected.users, selected.userCount);
			});
			autoc.on('select', function () {
				$('.emailer #fn-submit-first').removeClass('disabled');
			});
		},
		start = function () {
			instantiate();
			defEvt();
			defCusEvt();
		};
		
		instance.start = start;
		return instance;
	}());
	
	return {
		mediator: mediator
	};
}()),
reporting = (function () {
	var datepick,
	
	mediator = (function () {
		var instantiate = function () {
			datepick = instantiateDatepicker('.reporting');
			a.reporting.datepick = datepick;
		},
		defEvt = function () {
			
		},
		defCusEvt = function () {
			a.mediator.on('gotDate', function (d) {
				datepick.initialize(d);
			});
			
		},
		start = function () {
			instantiate();
			defEvt();
			defCusEvt();
		};
		
		return {
			start: start
		};
	}());
	
	return {
		mediator: mediator
	};
}()),
mediator = (function () {
	var instance = util.extend( instantiatePubsub() ),
	
	sessioncheckCallback = function (user) {
		$('body').removeClass('preloading');
		$('.header').removeClass('no-display');
		$('.content').removeClass('no-display');
		$('.footer').removeClass('no-display');
			
		currentUser.updateProfile(user);
		currentUser.setVars(user);
		
		$('.my-preloader').addClass('no-display');
		
		start(); // start assinging, binding, instantiating, etc
		role.determine();
	},
	checkSession = function () {
		session.check(sessioncheckCallback);
	},
	getDate = function () {
		ajax({
			data: {
				action: urls.actions.GET_DATE
			}
		})
		.done(function (data) {
			instance.publish('gotDate', data[0]);
		})
		.fail(function () {
			
		});
		/*$.ajax({
			url: urls.mainUrl,
			type: 'GET',
			dataType: 'json',
			data: {
				action: urls.actions.GET_DATE
			}
		})
		.done(function (data) {
			if (sessionInvalid(data[0])) { return; }
			instance.publish('gotDate', data[0]);
		})
		.fail(function () {
			alertify.error('GetDate failed.');
		});*/
	},
	getFullTreeStruc = function () {
		ajax({
			data : {
				action: urls.actions.GET_GROUPS,
				session: a.general.currentSession,
				base: '0',
				version: '2'
			}
		})
		.done(function (data) {
			a.general.treeStructure = data[0];
			instance.publish('fullStrucLoaded');
		})
		.fail(function () {
			
		});
		/*$.ajax({
			url: urls.mainUrl,
			type : 'GET',
			dataType : 'json',
			data : {
				action: urls.actions.GET_GROUPS,
				session: a.general.currentSession,
				base: '0',
				version: '2'
			}
		})
		.done(function (data) {
			if (sessionInvalid(data[0])) { return; }
			a.general.treeStructure = data[0];
			instance.publish('fullStrucLoaded');
		})
		.fail(function ( data, errorTitle, errorDetail ) {
			alertify.error('Getgroups failed<br />'+errorTitle+'<br />'+errorDetail);
		});*/
	},
	defEvt = function () {
		a.initializeMaterial();
		$('.fn-tablink').on('click', a.tab.change);
		$('.fn-logout').on('click', a.misc.logout);
		$(document).on('keydown', function (e) {
			if ( $('.lean-overlay').length !== 0 && e.which === 27 ) {
				$('.modal:visible .fn-closemodal').trigger('click');
			}
		});
		$('.fn-themebtn').on('click', function (e) {
			var target = $(e.target),
				el = $('html');
				
			el.attr('class', '');
			
			if ( target.hasClass('fn-theme1') ) {
				
			} else if ( target.hasClass('fn-theme2') ) {
				
				el.addClass('theme');
				
			} else if ( target.hasClass('fn-theme3') ) {
				
				el.addClass('themeBlue');
				
			}
		});
		$('.fn-soundbtn').on('click', function () {
			$(this).toggleClass('red');
			audio.toggleOnOff();
		});
		help.defEvt();
	},
	defCusEvt = function () {
		role.on('determined', function (data) {
			if (data.serviceAdmin || data.emailer) {
				getFullTreeStruc();
			}
			getDate();
		});
		instance.on('gotDate', function (d) {
			a.misc.time(d);
		});
		tab.on('change', function () {
			audio.play('tabchange');
		});
		mgmt.mediator.on('audio_time', function (d) {
			audio.play(d);
		});
		
	},
	start = function () {
		defEvt();
		defCusEvt();
		mgmt.mediator.start();
		emailer.mediator.start();
		manager.mediator.start();
		reporting.mediator.start();
	};
	
	instance.start = start;
	instance.checkSession = checkSession;
	return instance;
}());


return {
	instantiateAutoComp: instantiateAutoComp,
	instantiateMonthpicker: instantiateMonthpicker,
	urls: urls,
	util: util,
	ajax: ajax,
	general: general,
	initializeMaterial: initializeMaterial,
	tab: tab,
	session: session,
	sessionInvalid: sessionInvalid,
	currentUser: currentUser,
	role: role,
	autoc: autoc,
	dialog: dialog,
	misc: misc,
	manager: manager,
	mgmt: mgmt,
	emailer: emailer,
	reporting: reporting,
	mediator: mediator,
	t: instantiateMonthpicker('.reporting')
};
}());