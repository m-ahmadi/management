var adminList = (function () {


var adminEvt = function () {
	$('#fn-update_admin_list').on('click', function () {
		if ( $(this).hasClass('disabled') ) { return; }
		
		$.ajax({
			url : urls.MAIN_SERVER + urls.MAIN_SCRIPT,
			type : 'GET',
			dataType : 'json',
			data : {
				action: urls.actions.GET_USERS_WITH_ADMIN_ACCESS, // w12 GetUsersWithViewAccess
				session: general.currentSession,
				type: 'counter'
			},
			beforeSend : function () {
				$('#fn-update_admin_list').addClass('disabled');
				$('#fn-update_admin_list > i').addClass('fa-spin');
				
			}
		})
		.done(function ( data ) {
			//if (  !data[0]['taslimi-p'] ) { alert('data came back messed up'); }
			console.log(data);
			var response = data[0],
				arr = [],
				html = '',
				target,
				targetClass;
				
			for (var prop in response) {
				if ( response.hasOwnProperty(prop) ) {
					arr.push(response[prop]);
				}
			}
			target = $.parseHTML( util.getCommentsInside('#fn-admin_list')[0].nodeValue.trim() );
			targetClass= $(target).attr('class');
			
			arr.forEach(function (item) {
				/*
				html +=	'<li>';
				html +=		'<button class="btn btn-default btn-xs col-md-8 ma-grads-btn-main ma-mrgnbtm-05em fn-adminlist-item" data-username='+item.username+'>';
				html +=			atob( item.ldap_givenname ) +' '+ atob( item.ldap_sn.slice(0, -1) );
				html +=		'</button>';
				html +=	'</li>';;
				*/
				html +=	'<tr>';
				html +=		'<td class="'+ targetClass +'" data-username='+item.username+'>';
				html +=			general.fns.formatUserInfo(item).fullnameFa; // atob( item.ldap_givenname ) +' '+ atob( item.ldap_sn.slice(0, -1) );
				html +=		'</td>';
				html +=	'</tr>';
				
			});
			$('#fn-update_admin_list').removeClass('disabled');
			$('#fn-update_admin_list > i').removeClass('fa-spin');
			$('#fn-admin_list > tbody').html(html);
		})
		.fail(function ( data, errorTitle, errorDetail  ) {
			alertify.error('GetUsersWithAdminAccess failed<br />'+errorTitle+'<br />'+errorDetail);
			$('#fn-update_admin_list').removeClass('disabled');
			$('#fn-update_admin_list > i').removeClass('fa-spin');
		});
	});
	
	$('#fn-admin_list').on('click .fn-adminlist-item', function (e) {
		if ( $('.fn-adminlist-item').hasClass('disabled') ) { return; }
		//console.log($(e.target).data().username);
		$.ajax({
			url : urls.MAIN_SERVER + urls.MAIN_SCRIPT,
			type : 'GET',
			dataType : 'json',
			data : {
				action: urls.actions.GET_USER_INFO,
				session: 'abc',
				username: $(e.target).data().username
			},
			beforeSend: function () {
				$('.fn-treetoolbar').addClass('disabled');
				$('#fn-jstree_demo_div-give_access').addClass('disabled');
				$('#fn-jstree_demo_div_2-give_access').addClass('disabled');
				$('.fn-adminlist-item').addClass('disabled');
			}
		})
		.done(function ( data, textStatus, jqXHR ) {
			$('.fn-adminlist-item').removeClass('disabled');
			var user = data[0][$(e.target).data().username],
				rdyUser = general.fns.formatUserInfo(user);
			profile.setProfileVars(rdyUser);
			profile.updateProfile(rdyUser);
			tree.loadTrees();
		})
		.fail(function (data, errorTitle, errorDetail) {
			alertify.error('GetUserInfo failed<br />'+errorTitle+'<br />'+errorDetail);
			$('.fn-adminlist-item').removeClass('disabled');
		});
	});
};



return {
	adminEvt : adminEvt
	
};


}());