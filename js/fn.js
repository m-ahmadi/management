var a = (function () {
'use strict';
var urls = {
	SERVER_1: 'http://100.80.0.175',
	SERVER_2: 'http://10.255.135.92',
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
		AC_USERNAME: 'AcUsername',
		GET_USER_PERMISSION_LIST: 'GetUserPermissionList',
		GET_USERS_WITH_PERMISSION_LIST: 'GetUsersWithPermission',
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
		return this.mainScript;
	}
},
general = {
	currentSession: sessionStorage.session,
	currentUser: {
		fullname: '',
		username: '',
		email: '',
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
	currentTab: 1,
	authUrl: '',
	treeStructure: undefined,
	localmanagerTreeLoaded: false,
	formatUserInfo: function (user) {
		//console.log( atob( user.ldap_dn.slice(0, -3) ) );
		//console.log(user.ldap_sn);
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
		fullnameArr = nameRow.split(' - '),  // 
		fullnameFa = fullnameArr[1] +' '+ fullnameArr[0],
		fullnameEn = Base64.decode( user.ldap_givenname ) +' '+ Base64.decode( user.ldap_sn ),	// atob( user.ldap_givenname ) +' '+ atob( user.ldap_sn.slice(0, -1) );
		firstname = fullnameArr[1], // Base64.decode( user.ldap_givenname )
		lastname = fullnameArr[0];  // Base64.decode( user.ldap_sn.slice(0, -1) )
		// atob		->		Base64.decode
		
		if (typeof user.number === 'string') {
			number = user.number.slice(4)
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
		return Object.prototype.toString.call(v) === "[object Object]";
	},
	isArray: function (v) {
		if ( typeof Array.isArray === 'function' ) {
			return Array.isArray(v);
		} else {
			return Object.prototype.toString.call(v) === "[object Array]";
		}
	},
	isEmptyString: function (v) {
		return ( typeof v === 'string'  &&  v.length === 0 ) ? true : false;
	},
	isEmptyObject: function (o) {
		if (!this.isObject(o)) { throw new Error('isEmptyObject():  Arg is not an object.'); }
		var k;
		if (typeof Object.keys === 'function') {
			return ( Object.keys(o).length === 0 ) ? true : false;
		} else {
			for (k in o) {
				if ( obj.hasOwnProperty(k) ) { return false; }
			}
			return true;
		}
	},
	extend: function (proto, literal) {
		var result = Object.create(proto);
		Object.keys(literal).forEach(function(key) {
			result[key] = literal[key];
		});
		return result;
	},
	getCommentsInside: function (selector) {
		return $(selector).contents().filter( function () { return this.nodeType == 8; } );
	}
},
pubsub = (function () {
	var subscribers = {},
	getSubscribers = function () {
		return subscribers;
	},
	subscribe = function (evt, fn, pars) {
		if (typeof subscribers[evt] === 'undefined') {
			subscribers[evt] = [];
		}
		subscribers[evt].push({
			fn: fn,
			pars: pars
		});
	},
	on = function (evt, fn, pars) { // alies
		subscribe(evt, fn, pars);
	},
	publish = function (evt) {
		if (typeof subscribers[evt] !== 'undefined') {
			subscribers[evt].forEach(function (i) {
				i.fn(i.pars);
			});
		}
	};
	return {
		getSubscribers: getSubscribers,
		subscribe: subscribe,
		on: on,
		publish: publish
	};
}()),
checkSession = (function () {
	var getAuthUrl = function () {
		$.ajax({
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
		});
	},
	sessionExist = function () {
		if (typeof general.currentSession === 'undefined') {
			return false;
		} else if (typeof general.currentSession === 'string') {
			return true;
		}
	},
	redirect = function () {
		window.location.replace(general.authUrl);
	},
	isSessionValid = function (session, valid, invalid) {
		var user;
		$.ajax({
			url: urls.mainUrl, type: 'GET', dataType: 'json',
			data: {
				action: urls.actions.GET_USER_INFO,
				session: general.currentSession
			}		
		})
		.done(function (data) {
			//console.log(typeof data[0][sessionStorage.username]);
			user = data[0][sessionStorage.username];
			if ( typeof data[0][sessionStorage.username] !== 'undefined' ) {
				valid(user);
			} else if ( typeof data[0].error_msg === 'string' ) {
				invalid();
			}
		})
		.fail(function () {
			setTimeout(function () {
				isSessionValid(session, valid, invalid);
			}, 2000);
		});
	},
	main = function (user) {
		$('body').removeClass('preloading');
		$('.header').removeClass('no-display');
		$('.content').removeClass('no-display');
		$('.footer').removeClass('no-display');
			
		currentUser.updateProfile( general.formatUserInfo(user) );
		
		$('.my-preloader').remove();
		
		a.misc.time();
		a.role.determine(function () {
			if (general.currentUser.roles.serviceAdmin || general.currentUser.roles.emailer) {
				mgmt.tree.initialize(function () {
					a.emailer.tree.loadTree();
					$('.fn-mgmt-tabpre').remove();
					$('.mgmt .mainpanel').removeClass('no-display');
				});
			}
			if (general.currentUser.roles.localAdmin) {
				mgmt.tree.loadAnotherStruc();
			}
		});
		
		mgmt.defEvt();
		// mgmt.tree.initialize(); moved to role
		mgmt.initialize();
		emailer.defEvt();
		emailer.initialize(user);
		manager.defEvt();
		manager.initialize();
		
		a.initializeMaterial();
		$('.fn-tablink').on('click', a.tabs.show);
		$('.fn-logout').on('click', a.misc.logout);
	};
	
	getAuthUrl();
	return function () {
		if (!sessionExist) {
			redirect();
		} else if (sessionExist) {
			isSessionValid(general.currentSession, main, redirect);	// main if valid, redirect if not valid
		}
	};
}()),
sessionTimedout = function (obj) {
	var err;
	if ( util.isObject(obj) ) {
		err = obj.error_code;
		if (typeof err !== 'undefined' && typeof err === 'number') {
			if (err === -4) {
				a.confirm.show();
				return true;
			}
		} else {
			return false;
		}
	} else {
		return false;
	}
},
currentUser = (function () {
	var updateProfile = function (user) {
		$('.fn-current_user-profpic').attr({src: user.photo});
		$('.fn-current_user-title').text(user.title);
		$('.fn-current_user-fullnamefa').text(user.fullnameFa);
	};
	return {
		updateProfile: updateProfile
	};
}()),
role = (function () {
	var callback,
	getCallback = function () {
		return callback;
	},
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
		
		var serviceAdmin = false,
			localAdmin = false,
			manager = false,
			emailer = false;

		perms.forEach(function (i) {
			if ( i === 'PERM_SET_USER_ADMIN_ACCESS' ) {
				general.currentUser.roles.serviceAdmin = true;
			} else if ( i === 'PERM_SET_USER_VIEW_ACCESS' ) {
				general.currentUser.roles.localAdmin = true;
			} else if (i === 'PERM_GET_PERMISSION') {
				general.currentUser.roles.manager = true;
			} else if (i === 'PERM_SEND_MAIL_BILL') {
				general.currentUser.roles.emailer = true;
			} else if (i === 'PERM_RECORDS_MASTER') {
				general.currentUser.permissions.recordsMaster = true;
			}
		});
		addTabs();
		getCallback()();
		
		/*$.ajax({
			url: urls.mainUrl,
			type: 'GET',
			dataType: 'json',
			data: {
				action: urls.actions.GET_MY_ADMIN_ACCESS_LIST,
				session: general.currentSession
			}
		})
		.done(function (data) {
			var resp = data[0],
				cond = (resp.counters.groups.length !== 0	||
						resp.counters.users.length !== 0	||
						resp.records.groups.length !== 0	||
						resp.records.users.length !== 0);
			if (cond === true) {
				general.currentUser.roles.manager = true;
				removeTabs();
			}
		})
		.fail(function () {
			alert('determining role failed.');
		});*/
	},
	makeAjaxCall = function () {
		$.ajax({
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
		});
	},
	determine = function (fn) {
		callback = fn;
		makeAjaxCall();
	};
	
	return {
		determine: determine
	};
}()),
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
		curr = reqLog
		$.ajax({
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
			if (sessionTimedout(data[0])) { return; }
			reqStat = true
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
			fn.call(getSubFnContext(), username)
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
		
		$("#beLowerCase").on('input', function(){
			var start = this.selectionStart,
				end = this.selectionEnd;
			this.value = this.value.toLowerCase();
			this.setSelectionRange(start, end);
		});
	};
	
	return {
		getRoot: getRoot,
		getSubFn: getSubFn,
		setCurrent: setCurrent,
		defEvt: defEvt
	};
}()),
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
		};
		return function () {
			$.ajax({
				url: urls.mainUrl,
				type: 'GET',
				dataType: 'json',
				data: {
					action: urls.actions.GET_DATE
				}
			})
			.done(function (data) {
				var response= data[0],
				timestamp = parseInt(response.timestamp, 10),
					d = new Date(timestamp),
					week = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
					month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
					weekday = week[ d.getDay() ],
					monthNumber = d.getMonth(),
					monthName = month[ monthNumber ];
					
				$('.header-date').removeClass('hidden');
				
				$('.fn-endate-dayname').html(weekday.toUpperCase());
				$('.fn-endate-monthnumber').html( monthNumber );
				$('.fn-endate-monthname').html( monthName.toUpperCase() );
				$('.fn-endate-year').html( d.getFullYear() );
				
				$('.fn-fadate-dayname').html(response.day.weekday.name);
				$('.fn-fadate-daynumber').html(response.day.monthday.name);
				$('.fn-fadate-monthname').html(response.month.name);
				var year = '' + response.year.full;
				$('.fn-fadate-year').html( year );
				$('.fn-time-hour').html( d.getHours() );
				$('.fn-time-minute').html( d.getMinutes() );
				$('.fn-time-second').html( d.getSeconds() );
				countTime(timestamp);
			})
			.fail(function () {
				$('.a-nav-time').css({visibility: 'hidden'});
			});
		};
	}()),
	logout = function () {
		sessionStorage.removeItem('session');
		sessionStorage.removeItem('username');
		sessionStorage.removeItem('state');
		//for (key in sessionStorage) { if(sessionStorage.hasOwnProperty(key) ) { sessionStorage.removeItem(key) } }
		//Object.keys(sessionStorage).forEach(function (i) {sessionStorage.removeItem(i); });
		$.ajax({
			url: urls.mainUrl,
			type: 'GET',
			dataType: 'json',
			data: {
				action: urls.actions.LOGOUT,
				session: general.currentSession
			}
		})
		.done(function () {
			if (sessionTimedout(data[0])) { return; }
			window.location.reload(true);
		})
		.fail(function () {
			alert(urls.actions.LOGOUT + ' failed.');
		});
	};
	
	return {
		time: time,
		logout: logout
	};
}()),
tabs = (function () {
	var show = function (e) {
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
			mgmt.adminList.reset();
			mgmt.userList.reset();
		
			a.mgmt.adminList.refresh();
			a.mgmt.userList.refresh();
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
	};
	return {
		show: show
	};
}()),
confirm = (function () {
	var callback,
		parameters = {},
		
	getCallback = function () {
		return callback;
	},
	getPars = function () {
		return parameters;
	},
	setCallback = function (fn, obj) {
		callback = fn;
		parameters = obj
	},
	ok = function () {
		$('#modal4').closeModal();
		getCallback()( getPars() );
	},
	show = function (okFn, pars) {
		$('#modal4').openModal({
			dismissible: false,
			opacity: .5,
			in_duration: 300,
			out_duration: 200,
			ready: function() {
				$('#modal4 button').trigger('focus');
			},
			complete: function () {}
		});
	},
	defEvt = function () {
		$('#modal4 button').on('click', ok);
	};
	defEvt();
	setCallback(function () {
		window.location.reload();
	});
	return {
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
mgmt = (function () {
	var
	general = {
		counterTree: false,
		recordTree: false,
		tree: {
			loaded: false,
			modified: false,
			localmanagerTreeStruc: {
				counter: undefined,
				record: undefined
			},
			selectedNodes : { // unused
				tree1: {},// unused
				tree2: {}// unused
			}
		},
		fullPriv: {
			groups: {
				forView: [],
				forSend: []
			},
			users: {
				forView: [],
				forSend: []
			}
		},
		halfPriv: {
			groups: {
				forView: [],
				forSend: []
			},
			users: {
				forView: [],
				forSend: []
			}
		}
	},
	profile = util.extend(pubsub, (function () {
		var update = function (user) {
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
			a.general.currentProfile.fullnameFa = user.fullnameFa;
			a.general.currentProfile.fullnameEn = user.fullnameEn;
			a.general.currentProfile.username = user.username;
			//console.log(user);
		},
		callback = function (rdyUser) {
			setVars(rdyUser);
			profile.reset();
			update(rdyUser);
		},
		makeAjax = function (username) {
			var that = this;
			$.ajax({
				url: urls.mainUrl,
				type : 'GET',
				dataType : 'json',
				data : {
					action: urls.actions.GET_USER_INFO,
					session: a.general.currentSession,
					username: username
				},
				beforeSend: function () {
					that.publish('beforeUpdate');
					//tree.resetToolbars(true);
				}
			})
			.done(function ( data, textStatus, jqXHR ) {
				if (sessionTimedout(data[0])) { return; }
				var user = data[0][username],
					rdyUser = a.general.formatUserInfo(user);
				callback(rdyUser);
				//tree.loadTrees();
				that.publish('update');
			}).fail(function (data, errorTitle, errorDetail) {
				alertify.error('AcUsername failed<br />'+errorTitle+'<br />'+errorDetail);
			});
		},
		foo = function () {
			this.publish('update');
			
		},
		makeAutocomplete = function (divId) {
			var that = this;
			$('#'+divId).autocomplete({
				source: function ( request, response ) {
					$.ajax({
						url: urls.mainUrl,
						dataType: "json",
						data : {
							action: urls.actions.AC_USERNAME,
							session: a.general.currentSession,
							str: request.term
						}
					}).done(function ( data ) {
						if (sessionTimedout(data[0])) { return; }
						var arrList = [],
							key = '',
							res = data[0];
						res.forEach(function (i) {
							arrList.push(i.username);
						});
						/*
						for ( key in res ) {
							if ( res.hasOwnProperty(key) ) {
								arrList.push(key);
							}
						}
						*/
						response( arrList ); // response( data[0] ); 
					}).fail(function (data, errorTitle, errorDetail) {
						alertify.error('AcUsername failed<br />'+errorTitle+'<br />'+errorDetail);
					});
				},
				select: function ( event, ui ) {
					//$('#users_list').empty();
					//$('#users_list').append( $.parseHTML('<li class="list-group-item btn btn-default btn-lg"><a href="#">'+ui.item.value+'</a></li>') );
					$.ajax({
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
							that.publish('beforeUpdate');
						}
					})
					.done(function ( data, textStatus, jqXHR ) {
						if (sessionTimedout(data[0])) { return; }
						var user = data[0][ui.item.value],
							rdyUser = a.general.formatUserInfo(user);
						callback(rdyUser);
						that.publish('update');
					}).fail(function (data, errorTitle, errorDetail) {
						alertify.error('AcUsername failed<br />'+errorTitle+'<br />'+errorDetail);
					});
				}
			});
		};
		return {
			foo: foo,
			reset: reset,
			callback: callback,
			makeAjax: makeAjax,
			makeAutocomplete: makeAutocomplete
		};
	}())),
	instantiateLister = function (root) {
		if (typeof root === 'undefined') { throw new Error('You must provide a root element.'); }
		if (typeof root !== 'string') { throw new Error('Root must be a string.'); }
		root.trim();
		root += ' '; 
		
		var refresher = '.fn-update_admin_list' ,
			wrap = '.fn-admin_list',
			item = '.fn-adminlist-item',
			
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
		makeAjax = function () {
			var data =  {
				session: a.general.currentSession
			}
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
			
			$.ajax({
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
				if (sessionTimedout(data[0])) { return; }
				//if (  !data[0]['taslimi-p'] ) { alert('data came back messed up'); }
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
			})
			.fail(function ( data, errorTitle, errorDetail  ) {
				alertify.error(data.action + ' failed<br />'+errorTitle+'<br />'+errorDetail);
				$(root + refresher).removeClass('disabled');
				$(root + refresher + ' > i').removeClass('fa-spin');
			});
		},
		itemClick = function (e) {
			if ( $(root + item).hasClass('disabled') ) { return; }
			$.ajax({
				url: urls.mainUrl,
				type : 'GET',
				dataType : 'json',
				data : {
					action: urls.actions.GET_USER_INFO,
					session: a.general.currentSession,
					username: $(e.target).data().username
				},
				beforeSend: function () {
					
					tree.resetToolbars(true);
					$(root + item).addClass('disabled');
				}
			})
			.done(function ( data, textStatus, jqXHR ) {
				if (sessionTimedout(data[0])) { return; }
				$(root + item).removeClass('disabled');
				var user = data[0][$(e.target).data().username],
					rdyUser = a.general.formatUserInfo(user);
				profile.callback(rdyUser);
				tree.loadTrees();
			})
			.fail(function (data, errorTitle, errorDetail) {
				alertify.error('GetUserInfo failed<br />'+errorTitle+'<br />'+errorDetail);
				$(root + item).removeClass('disabled');
			});
		},
		refresh = function () {
			if ( $(this).hasClass('disabled') ) { return; }
			makeAjax();
		},
		defEvt = function () {
			$(root + refresher).on('click', refresh);
			$(root + wrap).on('click ' + item, itemClick); 
		};
		
		defEvt();
		return {
			reset: reset,
			refresh: refresh,
		};
		
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
				if (sessionTimedout(data[0])) { return; }
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
				if (sessionTimedout(data[0])) { return; }
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
	tree = (function () {
		var useJstree = function (divId, treeStructure) {
			if (typeof treeStructure === 'undefined') { return; }
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
			$('#'+mainTree).on('click #'+mainTree, handler); // select_node.jstree
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

				selected = $( '#'+mainTree).jstree('get_selected', ['full'] );
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
			
			$('#'+divId).jstree(true).deselect_all(); // true
			$('#'+divId).jstree(true).close_all(); // true
			arr.forEach(function (item) {
				if (typeof item === 'string') {
					reCheckHelper( divId, $('#'+divId).jstree(true).get_node(item, false) );
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
			$.ajax({
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
				if (sessionTimedout(data[0])) { return; }
				a.general.treeStructure = data[0];
				createDivAndTree(data[0], true);
				fn();
			})
			.fail(function ( data, errorTitle, errorDetail ) {
				alertify.error('Getgroups failed<br />'+errorTitle+'<br />'+errorDetail);
			});
		},
		changeAlredyLoaded = function () {
			//createDivAndTree(a.general.treeStructure, false);
			$.ajax({
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
				if (sessionTimedout(data[0])) { return; }
				$('.tree-wrap .preloader-wrapper').addClass('no-display');
				$('.tree-wrap .treeroot').removeClass('no-display');
				var userAccessList = extractForRecheck( data[0] );
				setTimeout(function () { // because tree is not ready
					reCheck('jstree_demo_div', userAccessList.counters);
					reCheck('jstree_demo_div_2', userAccessList.records);
					resetToolbars(false);
					$('#jstree_demo_div').removeClass('hidden');
					$('#jstree_demo_div_2').removeClass('hidden');
				}, 100);
			})
			.fail(function ( data, errorTitle, errorDetail ) {
				alertify.error('GetUserAdminAccessList failed<br />'+errorTitle+'<br />'+errorDetail);
			});
		},
		loadAnotherStrucSilently = function () {
			if ($('.mgmt .tab-preloader').length !== 0 && (a.general.currentUser.roles.serviceAdmin || a.general.currentUser.roles.emailer)) { return; }
			$.ajax({
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
					$('.fn-local_admin-tab_link > button').attr({disabled: true})
					$('.mgmt #fn-record-tree').removeClass('no-display');
					$('.mgmt #fn-record-list').removeClass('no-display');
				}
			}).done(function (data) {
				
				if (sessionTimedout(data[0])) { return; }
				/*if (data[0].counters.jtree.length === 0) {
					$('.mgmt #fn-counter-tree').addClass('no-display');
					$('.mgmt #fn-counter-list').addClass('no-display');
				}*/
				if (data[0].records.jtree.length === 0) {
					$('.mgmt #fn-record-tree').addClass('no-display');
					$('.mgmt #fn-record-list').addClass('no-display');
				}
				$('.fn-local_admin-tab_link > button').attr({disabled: false})
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
			$.ajax({
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
				if (sessionTimedout(data[0])) { return; }
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
			});
		},
		loadAnotherStruc = function () { // unused
			$.ajax({
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
				if (sessionTimedout(data[0])) { return; }
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
		var mode = '',
		callback = function () {
			$('#modal1').closeModal();
			var users,
				groups,
				data;
			if ( mode === 'full') {
				users = general.fullPriv.users.forSend.join(',');
				groups =  general.fullPriv.groups.forSend.join(',');
			} else if ( mode === 'half' ) {
				users = general.halfPriv.users.forSend.join(',');
				groups =  general.halfPriv.groups.forSend.join(',');
			}
			data = {
				session: a.general.currentSession,
				type: (mode === 'full') ? 'counter' : 'record',
				users: users || '',
				groups: groups || ''
			};
			if (a.general.currentTab === 1) {
				data.action = urls.actions.SET_USER_ADMIN_ACCESS_LIST;
				data.admin = a.general.currentProfile.username;
			} else if (a.general.currentTab === 2) {
				data.action =  urls.actions.SET_USER_VIEW_ACCESS_LIST;
				data.viewer = a.general.currentProfile.username;
			}
			$.ajax({
				url: urls.mainUrl,
				type : 'GET',
				dataType : 'json',
				data : data,
			})
			.done(function ( data, textStatus, jqXHR ) {
				if (sessionTimedout(data[0])) { return; }
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
			})
			.fail(function ( data, errorTitle, errorDetail ) {
				alertify.error('SetUserAdminAccessList failed<br />'+errorTitle+'<br />'+errorDetail);
			});
		},
		showMessage = function (title, message) {
			$('#modal1 .modal-content').html( '<h1>' + title + '</h1>' +
					'<p>' + message + '</p>' );
			$('#modal1').openModal({
				dismissible: false,
				opacity: .5,
				in_duration: 300,
				out_duration: 200,
				ready: function () {
					$('#modal1 button').trigger('focus');
				},
				complete: function () {}
			});
		},
		main = function (mod, groups, users) {
			mode = mod;
			var title,
				message = '';
			if ( mod === 'full' ) {
				title = 'تغییر دسترسی کانترها';
			} else if (mod === 'half') {
				title = 'تغییر دسترسی رکورد ها';
			}
			message += 'شما می خواهید ';
			if ( (groups.length === 1 && users.length === 0) || (groups.length === 0 && users.length === 1) ) {
				message += 'دسترسی ';
			} else {
				message += 'دسترسی های ';
			}
			message += 'زیر را به ';
			message += '<b>'+a.general.currentProfile.username+'</b> ';
			message += 'بدهید:';
			message += '<br /><br />';
			if (users.length !== 0 && groups.length === 0) {
				message += 'کاربران :';
				message += '<br /><br />';
				message += users.join('    <br />    ');
			} else if (groups.length !== 0 && users.length === 0) {
				message += 'پوشه ها :';
				message += '<br /><br />';
				message += groups.join('<br />');
			} else if ( groups.length !== 0 && users.length !== 0 ) {
				message += 'کاربران :';
				message += '<br /><br />';
				message += users.join('<br />');
				message += '<br /><br />';
				message += 'پوشه ها :';
				message += '<br /><br />';
				message += groups.join('<br />');
			}
			showMessage(title, message);
		},
		defEvt = function () {
			$('#fn-jstree_demo_div-give_access').on('click', function () {
				if ( !$(this).hasClass('disabled') ) {
					main('full', general.fullPriv.groups.forView, general.fullPriv.users.forSend);
				}
			});
			$('#fn-jstree_demo_div_2-give_access').on('click', function () {
				if ( !$(this).hasClass('disabled') ) {
					main('half', general.halfPriv.groups.forView, general.halfPriv.users.forSend);
				}
			});
			$('#modal1 button').on('click', mgmt.confirmation.callback);
		};
		return {
			callback: callback,
			main: main,
			defEvt: defEvt
		};
	}()),
	mediator = util.extend(pubsub, (function () {
		profile.on('update', function () {
			tree.loadTrees();
		});
		profile.on('beforeUpdate', function () {
			tree.resetToolbars(true);
		});
		
		return {
			
		};
	}())),
	initialize = function () {
		if (a.general.currentUser.permissions.recordsMaster === true) {
			$('.mgmt #fn-record-tree').removeClass('no-display');
			$('.mgmt #fn-record-list').removeClass('no-display');
		}
	},
	defEvt = function () {
		a.autoc.defEvt('.mgmt');
		//profile.makeAutocomplete('mgmt-autocomplete_1');
		
		//a.adminList.defEvt();
		a.mgmt.adminList = instantiateLister('#fn-counter-list');
		a.mgmt.userList = instantiateLister('#fn-record-list');
		
		confirmation.defEvt();
	};
	
	return {
		profile: profile,
		instantiateLister: instantiateLister,
		tree: tree,
		confirmation: confirmation,
		initialize: initialize,
		defEvt: defEvt
	};
}()),
manager = (function () {
	var
	general = {
		profileUser: ''
		
	},
	profile = (function () {
		var update = function (user) {
			if (typeof user.photo === 'string') {
				$('.manager .fn-profile-img').attr({ src: user.photo });
			}
			$('.manager .fn-profile-firstname').html( user.firstname ); 
			$('.manager .fn-profile-lastname').html( user.lastname ); 
			$('.manager .fn-profile-email').html(  user.email );
			$('.manager .fn-profile-title').html( user.title );
			$('.manager .fn-profile-phone').html(  user.number );
		},
		reset = function () {
			var img = $.parseHTML(  util.getCommentsInside('.manager .profile-img')[0].nodeValue.trim()  ); 
			$('.manager .fn-autoc-input')			.val('');
			$('.manager .fn-profile-img')			.attr({ src: $(img).attr('src') });
			$('.manager .fn-profile-firstname')		.html( '' ); 
			$('.manager .fn-profile-lastname')		.html( '' ); 
			$('.manager .fn-profile-email')			.html(  '' );
			$('.manager .fn-profile-title')			.html( '' );
			$('.manager .fn-profile-phone')			.html(  '' );
		},
		setVars = function (rdyUser) {
			general.profileUser = rdyUser.username;
		},
		callback = function (rdyUser) {
			setVars(rdyUser);
			reset();
			update(rdyUser);
		},
		makeAjax = function (username) {
			$.ajax({
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
				if (sessionTimedout(data[0])) { return; }
				$('.manager .settings-overlay').addClass('no-display');
				var user = data[0][username],
					rdyUser = a.general.formatUserInfo(user);
				callback(rdyUser);
				settings.makeAjax();
			}).fail(function (data, errorTitle, errorDetail) {
				alertify.error('AcUsername failed<br />'+errorTitle+'<br />'+errorDetail);
				$('.manager .settings-overlay').addClass('no-display');
			});
		};
		return {
			reset: reset,
			callback: callback,
			makeAjax: makeAjax
		};
	}()),
	userList = (function () {
		var createHtml = function (arr) {
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
		reset = function () {
			$('.fn-userlist > tbody').empty();
		},
		makeAjax = function () {
			var data,
				perms,
				dropdownVal = $('.fn-userlist_dropdown').find(':selected').val();
			dropdownVal = parseInt(dropdownVal, 10);
			
			data = {
				action: urls.actions.GET_USERS_WITH_PERMISSION_LIST,
				session: a.general.currentSession
			}
			if (dropdownVal === 0) {
				perms = "ANY";
			} else if (dropdownVal === 1) {
				perms = "PERM_SEND_MAIL_BILL, PERM_GET_USER_ADMIN_ACCESS, PERM_SET_USER_ADMIN_ACCESS, PERM_RECORDS_MASTER, PERM_GET_USERS_WITH_ADMIN_ACCESS, PERM_GET_PERMISSION, PERM_SET_PERMISSION, PERM_GET_USERS_WITH_PERMISSION";
			} else if (dropdownVal === 2) {
				perms = "PERM_GET_USER_VIEW_ACCESS, PERM_SET_USER_VIEW_ACCESS, PERM_GET_USERS_WITH_VIEW_ACCESS";
			} else if (dropdownVal === 3) {
				perms = "PERM_GET_USER_INFO, PERM_GET_GROUPS_LIST, PERM_GET_RECORDS, PERM_GET_COUNTERS, PERM_GET_GROUPS_COUNTERS";
			}
			data.permissions = perms;
			$.ajax({
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
				if (sessionTimedout(data[0])) { return; }
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
			});
		},
		userItem = function (e) {
			if ( $('.manager .fn-userlist_item').hasClass('disabled') ) { return; }
			$.ajax({
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
				if (sessionTimedout(data[0])) { return; }
				$('.manager .fn-userlist_item').removeClass('disabled');
				$('.manager .settings-overlay').addClass('no-display');
				var user = data[0][$(e.target).data().username],
					rdyUser = a.general.formatUserInfo(user);
				profile.callback(rdyUser);
				settings.makeAjax(rdyUser.username);
			})
			.fail(function (data, errorTitle, errorDetail) {
				alertify.error('GetUserInfo failed<br />'+errorTitle+'<br />'+errorDetail);
				$('.manager .fn-userlist_item').removeClass('disabled');
				$('.manager .settings-overlay').addClass('no-display');
			});
		},
		userList = function () {
			if ( $(this).hasClass('disabled') ) { return; }
			makeAjax();
		},
		refresh = function () {
			userList();
		},
		defEvt = function () {
			$('.manager .fn-update_userlist').on('click', userList);
			$('.manager .fn-userlist').on('click .fn-userlist_item', userItem);
		};
		
		return {
			reset: reset,
			refresh: refresh,
			defEvt : defEvt
		};
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
				session: a.general.currentSession,
				username: general.profileUser,
				permission: perms.join(',')
			}
			if (state === false) {
				data.action = urls.actions.ADD_USER_PERMISSION;
				
			} else if (state === true) {
				data.action = urls.actions.DEL_USER_PERMISSION;
			}
			done = function (data) {
				if (sessionTimedout(data[0])) { return; }
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
			$.ajax({
				url: urls.mainUrl,
				type: 'GET',
				dataType: 'json',
				data: data
			})
			.done(done)
			.fail(function () {
				alertify.error(data.action + ' Failed.');
			});
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
				item.prop('checked', true)
				adjustSubgroups( item );
			});
		},
		makeAjax = function (username) {
			$.ajax({
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
				if (sessionTimedout(data[0])) { return; }
				check(data[0]);
			})
			.fail(function () {
				alertify.error("GetUserPermissionList Failed.");
			});
		},
		changePerm = function (o) {
			var data,
				done;
				
			data = {
				session: a.general.currentSession,
				username: general.profileUser,
				permission: o.perm
			};
			if (o.addremove === true) {
				data.action = urls.actions.ADD_USER_PERMISSION;
			} else if (o.addremove === false) {
				data.action = urls.actions.DEL_USER_PERMISSION;
			}
			done = function (data) {
				if (sessionTimedout(data[0])) { return; }
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
			
			$.ajax({
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
			});
		},
		addPerm = function (perm, target) {
			changePerm({
				addremove: true,
				perm: perm,
				target: target
			});
		},
		delPerm = function (perm, target) {
			if (target.attr('id') === 'PERM_SET_PERMISSION' && general.profileUser === a.general.currentUser.username) {
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
			parameters = obj
		},
		show = function (okFn, pars) {
			setCallback(okFn, pars);
			$('#modal3').openModal({
				dismissible: false,
				opacity: .5,
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
		userList.refresh();
		settings.initialize();
	},
	defEvt = function () {
		a.autoc.defEvt('.manager');
		userList.defEvt();
		settings.defEvt();
		confirmation.defEvt();
	};
	
	return {
		reset: reset,
		profile: profile,
		userList: userList,
		settings: settings,
		confirmation: confirmation,
		initialize: initialize,
		defEvt: defEvt
	};
}()),
emailer = (function () {
	var
	general = {
		treeStructure: [],
		allNodes: [],
		jobId: 0,
		selectedNodes: {
			groups:[],
			users: [],
			groupsAndUsers: [],
			groupNames: [],
			userCount: 0
		},
		selectedDate: '',
		currentYear: 0,
		recipient: '',
		specificSend: false
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
			$('#jstree_emailer').remove();
			$('#fn-jstree_emailer-parent').append( $.parseHTML('<div id="jstree_emailer"></div>') );
			
			/*$.ajax({
				url : urls.mainUrl,
				type : 'GET',
				dataType : 'json',
				data : {
					action: urls.actions.GET_GROUPS,
					session: a.general.currentSession,
					base: '0',
					version: '2'	// 1= without icon	2= with icon
				}
			})
			.done(function (data) {
				if (sessionTimedout(data[0])) { return; }
				var treeStructure = data[0];
				useJstree('jstree_emailer', treeStructure);
				treeStructure.forEach(function (i) {
					general.allNodes.push(i.id);
				});
			})
			.fail(function ( data, errorTitle, errorDetail ) {
				alertify.error('Getgroups failed<br />'+errorTitle+'<br />'+errorDetail);
			});*/
			var treeStructure = a.general.treeStructure;
			useJstree('jstree_emailer', treeStructure);
			treeStructure.forEach(function (i) {
				general.allNodes.push(i.id);
			});
			evt('jstree_emailer');
		};
		
		return {
			useJstree: useJstree,
			getSelection: getSelection,
			evt: evt,
			loadTree: loadTree
		};
	}()),
	confirmation = (function () {
		var callback = function () {
			$('#modal2').closeModal();
			
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
				session: a.general.currentSession,
				month: general.selectedDate,
				users: general.selectedNodes.users.join(',') || '',
				groups: general.selectedNodes.groups.join(',') || ''
			};
			if ( !util.isEmptyString(general.recipient) ) {
				data.recipient = general.recipient;
			} else if ( util.isEmptyString(general.recipient) ) {
				data.recipient = inputVal;
			}/* else { inputVal is not going to be empty anymore since it got initialized during page load
				recipient = general.currentUser.username;
			}*/
			
			$.ajax({
				url: urls.mainUrl,
				type: 'GET',
				dataType: 'json',
				data: data,
				beforeSend: function () {
					$('.progress-bar').removeClass('no-opacity');
					$('.fn-progress-main-msg').text('در حال بررسی...');
					
					$('#jstree_emailer').jstree(true).disable_node(general.allNodes);
					$('#fn-mp-input').attr({disabled: true});
					$('.fn-us-input').attr({disabled: true});
					$('.fn-radio').attr({disabled: true});
					$('.mp-wrap > label').addClass('lbl-disabled');
					
				}
			})
			.done(function (data) {
				if (sessionTimedout(data[0])) { return; }
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
			});
		},
		showMessage = function (title, message) {
			var firstBtn = $('#fn-submit-first'),
				secondBtn = $('#fn-submit-second');
			
			$('#modal2 .modal-content').empty();
			$('#modal2 .modal-content').html( '<h1>' + title + '</h1>' +
					'<p>' + message + '</p>' );
			$('#modal2').openModal({
				dismissible: false,
				opacity: .5,
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
		main = function (groups, users) {
			var title = 'فرستادن ایمیل ها',
				message = '',
				inputVal = $('.fn-us-input').val();
			
			message += 'شما می خواهید&nbsp;';
			message += '<span class="larger">'+general.selectedNodes.userCount+' </span>';
			message += 'ایمیل به&nbsp;&nbsp;';
			
			
			if (general.recipient) {
				message += general.recipient;
			} else if ( (!general.recipient  ||  util.isEmptyString(general.recipient)) && !util.isEmptyString(inputVal) ) {
				message += inputVal;
			} else {
				message += general.currentUser.username;
			}
			message += '&nbsp;&nbsp;ارسال کنید:';
			
			message += '<br /><br />';
			if (users.length !== 0 && groups.length === 0) {
				message += 'کاربران :';
				message += '<br /><br />';
				message += users.join('    <br />    ');
			} else if (groups.length !== 0 && users.length === 0) {
				message += 'پوشه ها :';
				message += '<br /><br />';
				message += groups.join('<br />');
			} else if ( groups.length !== 0 && users.length !== 0 ) {
				message += 'کاربران :';
				message += '<br /><br />';
				message += users.join('<br />');
				message += '<br /><br />';
				message += 'پوشه ها :';
				message += '<br /><br />';
				message += groups.join('<br />');
			}
			showMessage(title, message);
		};

		return {
			callback: callback,
			main: main
		};

	}()),
	buttons = (function () {
		var secondClicked = false,
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
			
			confirmation.main(general.selectedNodes.groupNames, general.selectedNodes.users)
			
		},
		updatingDelayed = function () {
			setTimeout(function () {
				updating();
			}, 200);
		},
		updating = function () {
			$.ajax({
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
				if (sessionTimedout(data[0])) { return; }
				var status = data[0].status;
				callback(status);
			})
			.fail(function () {
				updatingDelayed();
			});
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
				arr = status.split('/')
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
			$('#jstree_emailer').jstree(true).enable_node(general.allNodes);
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
		
		return {
			disableBoth: disableBoth,
			changeFirstBtn: changeFirstBtn,
			disable: disable,
			first: first,
			second: second,
			reset: reset,
			updating: updating,
			callback: callback
		};
	}()),
	monthpicker = (function () {
		var currentYear = parseInt( $('.fn-mp-year').text(), 10 ),
		initialize = function () {
			$.ajax({
				url: urls.mainUrl,
				type: 'GET',
				dataType: 'json',
				data: {
					action: urls.actions.GET_DATE
				}
			})
			.done(function (data) {
				if (sessionTimedout(data[0])) { return; }
				var response = data[0],
					month = response.month.number +'',
					year = response.year.full +'';
				general.selectedDate = year + month;
				general.currentYear = response.year.full;
				$('#fn-mp-input').val( year.slice(-2) + '/' + month);
			})
			.fail(function () {
				alertify.error('GetDate failed.');
			});
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
		var isInputValid = function () {
			var el = $('.fn-us-input'),
				cond = ( el.prop('disabled') === false   &&
						!util.isEmptyString( el.val() )  );
			return (cond) ? true : false;
		},
		unsetRecep = function () {
			var userInputVal = $('.fn-us-input').val()
			general.recipient = '';
			if ( util.isEmptyString(userInputVal) ) {
				buttons.disableBoth();
			} else if ( general.selectedNodes.userCount !== 0 ) {
				$('#fn-submit-first').removeClass('disabled');
				
			}
		},
		main = function () {
			var id = $(this).attr('id');
			if ( id === 'self-radio' ) {
				general.specificSend = false;
				general.recipient = a.general.currentUser.username;
				$('.fn-us-input').val('');
				$('.fn-us-input').attr({disabled: true});
				if ( general.selectedNodes.userCount !== 0 ) {
					$('#fn-submit-first').removeClass('disabled');
					
				}
			} else if ( id === 'user-select-radio' ) {
				general.recipient = '';
				general.specificSend = true;
				$('.fn-us-input').attr({disabled: false});
				if ( general.selectedNodes.userCount === 0 || !isInputValid() ) {
					buttons.disableBoth();
				}
			}
		};
		
		return {
			isInputValid: isInputValid,
			unsetRecep: unsetRecep,
			main: main
		};
	}()),
	initialize = function (user) {
		updateProfile( a.general.formatUserInfo(user) );
		a.general.currentUser.username = user.username;
		a.general.currentUser.email = user.email;
		general.recipient = a.general.currentUser.username;
		$('.fn-us-input').val(a.general.currentUser.username);
		
		//tree.loadTree(); in mgmt
		
		
		a.emailer.monthpicker.initialize();
		
	},
	defEvt = function () {
		a.mgmt.profile.makeAutocomplete('emailer-autocomplete_1');
		a.autoc.defEvt('.emailer');//a.autoc.defEvt();
		
		$('.fn-radio').on('click', a.emailer.userSelect.main);
		$('.fn-us-input').on('keyup', a.emailer.userSelect.unsetRecep);
		
		$('#fn-submit-first').on('click', a.emailer.buttons.first);
		$('#fn-submit-second').on('click', a.emailer.buttons.second);
		
		$('body').on('click', a.emailer.monthpicker.hide);
		$('#fn-mp-input').on('click', a.emailer.monthpicker.show);
		$('.fn-month').on('click', a.emailer.monthpicker.main)

		$('.fn-mp-next').on('click', a.emailer.monthpicker.next);
		$('.fn-mp-prev').on('click', a.emailer.monthpicker.prev);
		
		$('#modal2 button').on('click', confirmation.callback);
	};
	return {
		updateProfile: updateProfile,
		tree: tree,
		buttons: buttons,
		monthpicker: monthpicker,
		userSelect: userSelect,
		initialize: initialize,
		defEvt: defEvt
	};
}());

var test = util.extend(pubsub, (function () {
	var a = function () {
		
		return this.getSubscribers();
	};
	
	return {
		a: a
	};
}()));

return {
	urls: urls,
	util: util,
	general: general,
	initializeMaterial: initializeMaterial,
	tabs: tabs,
	checkSession: checkSession,
	sessionTimedout: sessionTimedout,
	currentUser: currentUser,
	role: role,
	autoc: autoc,
	confirm: confirm,
	misc: misc,
	manager: manager,
	mgmt: mgmt,
	emailer: emailer,
	test: test
};
}());