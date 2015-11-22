sessionStorage.session = 'abc';
sessionStorage.username = 'ortogoli';
var a = (function () {
'use strict';

var urls = {
	SERVER_1: 'http://100.80.0.175',
	SERVER_2: 'http://10.255.135.92',
	DATE_URL: 'http://10.255.148.60/cgi-bin/oauth2/date',
	CPNI: '/cgi-bin/cpni',
	FCPNI: '/fcpni',
	GET_DATE_URL: 'http://100.80.0.175/fcpni?action=GetDate', // '/cgi-bin/oauth2/date'
	actions: {
		GET_AUTH_URL: 'GetAuthURL',
		GET_DATE: 'GetDate',
		GET_GROUPS: 'Getgroups',
		AC_USERNAME: 'AcUsername',
		GET_USER_INFO: 'GetUserInfo',
		SET_USER_ADMIN_ACCESS_LIST: 'SetUserAdminAccessList',
		GET_USER_ADMIN_ACCESS_LIST: 'GetUserAdminAccessList',
		GET_MY_ADMIN_ACCESS_LIST: 'GetMyAdminAccessList',
		GET_USERS_WITH_ADMIN_ACCESS: 'GetUsersWithAdminAccess',
		GET_MY_PERMISSION_LIST: 'GetMyPermissionList'
	}
};
urls.MAIN_SERVER = urls.SERVER_1;
urls.MAIN_SCRIPT = urls.FCPNI;
urls.RETURN_URL = urls.MAIN_SERVER + 'management';

var general = {
	currentSession: sessionStorage.session,
	currentUser: {
		fullname: '',
		username: '',
		roles: {
			serviceAdmin: false,
			localAdmin: false,
			manager: false
		},
		roleReqSuccess: false,
		roleReqFail: false
	},
	currentProfile: {
		username: '',
		fullnameFa: '',
		fullnameEn: ''
	},
	tree: {
		loaded: false,
		modified: false,
		structure: undefined
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
	},
	constants: {
		PERM_SERVICE_ADMIN: 'PERM_SET_USER_ADMIN_ACCESS',
		PERM_LOCAL_ADMIN: 'PERM_SET_USER_VIEW_ACCESS'
	},
	fns: {}
};