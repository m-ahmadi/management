var currentUser = (function () {
	
	var updateProfile = function (user) {
		$('.fn-current_user-profpic').attr({src: user.photo});
		$('.fn-current_user-title').text(user.title);
		$('.fn-current_user-fullnamefa').text(user.fullnameFa);
	};
	
	return {
		updateProfile: updateProfile
	};
}());