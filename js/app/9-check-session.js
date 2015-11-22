var checkSession = (function () {
	var sessionExist = function () {
		return (typeof currentSession === 'undefined' ) ? false : true;
	};
	var redirect = function () {
		
		$.ajax({
			url: urls.MAIN_SERVER + urls.MAIN_SCRIPT,
			type: 'GET',
			dataType: 'json',
			data: {
				action: urls.actions.GET_AUTH_URL,
				return_url: urls.RETURN_URL
			}
		})
		.done(function (data) {
			window.location.replace(data[0].auth_url + urls.STATE);
		})
		.fail(function () {
			setTimeout(function () {
				redirect();
			}, 2000);
		});
	};
	var isSessionValid = function (session, valid, invalid) {
		var user;
		
		$.ajax({
			url: urls.MAIN_SERVER + urls.MAIN_SCRIPT, type: 'GET', dataType: 'json',
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
	};
	var main = function (user) {
		$('body').removeClass('preloading');
		$('.header').removeClass('no-display');
		$('.content').removeClass('no-display');
		$('.footer').removeClass('no-display');
		
		//profile.updateProfile( general.fns.formatUserInfo(user) );
		//tree.loadTree();
		currentUser.updateProfile( general.fns.formatUserInfo(user) );
		$('.my-preloader').remove();
		
		a.misc.time();
		a.role.determine();
	};
	
	return function () {
		if (!sessionExist) {
			redirect();
		} else if (sessionExist) {
			isSessionValid(general.currentSession, main, redirect);	// main if valid, redirect if not valid
		}
	};
}());