var role = (function () {
	
	var removeTabs = function () {
		var roles = general.currentUser.roles,
			keyStr,
			extracted;
		
		
		for ( role in roles ) {
			if ( roles.hasOwnProperty(role) ) {
				if ( roles[role] === false ) {	// 'serviceAdmin'.replace(/([A-Z])/g, '_$1').toLowerCase()
					keyStr = role;
					extracted = keyStr.replace(/([A-Z])/g, '_$1').toLowerCase();
					$('.fn-'+ extracted +'-tab_link').remove(); // $('.fn-service_admin-tab_link').remove();
				}
			}
		}
	};
	var setRole = function (perms) {
		if ( !util.isArray(perms) ) { throw new Error('role.determine():  Argument is not an array.'); }
		
		var serviceAdmin = false,
			localAdmin = false,
			manager = false;
			
		perms.forEach(function (i) {
			if ( i === general.constants.PERM_SERVICE_ADMIN ) {
				general.currentUser.roles.serviceAdmin = true;
			} else if ( i === general.constants.PERM_LOCAL_ADMIN ) {
				general.currentUser.roles.localAdmin = true;
			}
		});
		
		removeTabs();
	};
	var makeAjaxCall = function () {
		$.ajax({
			url: urls.MAIN_SERVER + urls.MAIN_SCRIPT,
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
	};
	
	var determine = function () {
		makeAjaxCall();
	};
	return {
		determine: determine
	};
}());