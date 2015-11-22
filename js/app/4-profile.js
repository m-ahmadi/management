var profile = (function () {

var updateProfile = function (user) {
	$('#fn-autocomplete').val('');
	$('#autocomplete_1').val('');
	
	
	$('#fn-profile-img').attr({ src: user.photo });
	$('#fn-profile-firstname').html( user.firstname ); 
	$('#fn-profile-lastname').html( user.lastname ); 
	$('#fn-profile-email').html(  user.email );
	$('#fn-profile-title').html( user.title );
	$('#fn-profile-phone').html(  user.number );
};

var setProfileVars = function (user) {
	general.currentProfile.fullnameFa = user.fullnameFa;
	general.currentProfile.fullnameEn = user.fullnameEn;
	general.currentProfile.username = user.username;
	//console.log(user);
};
var prepareForUpdate = function () {
	$('.fn-treetoolbar').addClass('disabled');
	$('#fn-jstree_demo_div-give_access').addClass('disabled');
	$('#fn-jstree_demo_div_2-give_access').addClass('disabled');
};
var callback = function (rdyUser) {
	setProfileVars(rdyUser);
	updateProfile(rdyUser);
	tree.loadTrees();
};
var makeAjax = function (username) {
	$.ajax({
		url : urls.MAIN_SERVER + urls.MAIN_SCRIPT,
		type : 'GET',
		dataType : 'json',
		data : {
			action: urls.actions.GET_USER_INFO,
			session: general.currentSession,
			username: username
		},
		beforeSend: function () {
			prepareForUpdate();
		}
	})
	.done(function ( data, textStatus, jqXHR ) {
		var user = data[0][username],
			rdyUser = general.fns.formatUserInfo(user);
		callback(rdyUser);
	}).fail(function (data, errorTitle, errorDetail) {
		alertify.error('AcUsername failed<br />'+errorTitle+'<br />'+errorDetail);
	});
};
var makeAutocomplete = function (divId) {
	$('#'+divId).autocomplete({
		source: function ( request, response ) {
			$.ajax({
				url: urls.MAIN_SERVER + urls.MAIN_SCRIPT,
				dataType: "json",
				data : {
					action: urls.actions.AC_USERNAME,
					session: 'abc',
					str: request.term
				}
			}).done(function ( data ) {
				var arrList = [],
					key = '',
					res = data[0];
				for ( key in res ) {
					if ( res.hasOwnProperty(key) ) {
						arrList.push(key);
					}
				}
				response( arrList ); // response( data[0] ); 
			}).fail(function (data, errorTitle, errorDetail) {
				alertify.error('AcUsername failed<br />'+errorTitle+'<br />'+errorDetail);
			});
		},
		select: function ( event, ui ) {
			//$('#users_list').empty();
			//$('#users_list').append( $.parseHTML('<li class="list-group-item btn btn-default btn-lg"><a href="#">'+ui.item.value+'</a></li>') );
			$.ajax({
				url : urls.MAIN_SERVER + urls.MAIN_SCRIPT,
				type : 'GET',
				dataType : 'json',
				data : {
					action: urls.actions.GET_USER_INFO,
					session: 'abc',
					username: ui.item.value
				},
				beforeSend: function () {
					prepareForUpdate();
				}
			})
			.done(function ( data, textStatus, jqXHR ) {
				var user = data[0][ui.item.value],
					rdyUser = general.fns.formatUserInfo(user);
				callback(rdyUser);
			}).fail(function (data, errorTitle, errorDetail) {
				alertify.error('AcUsername failed<br />'+errorTitle+'<br />'+errorDetail);
			});
		}
	});
};


return {
	prepareForUpdate: prepareForUpdate,
	callback: callback,
	makeAjax: makeAjax,
	updateProfile: updateProfile,
	setProfileVars: setProfileVars,
	makeAutocomplete: makeAutocomplete
};



}());