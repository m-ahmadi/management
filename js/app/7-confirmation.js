var confirmation = (function () {

var mode = '';


var defineEvt = function () {
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
};

var bbox = function  (o) {
	bootbox.dialog({
		title: o.title,
		message: o.message,
		show: true,
		backdrop: true,
		animate: true,
		onEscape: function () {
			
		},
		buttons: o.btns
	});
};

var callback = function () {
	$('#modal1').closeModal();
	var users,
		groups;
	if ( mode === 'full') {
		users = general.fullPriv.users.forSend.join(',');
		groups =  general.fullPriv.groups.forSend.join(',');
	} else if ( mode === 'half' ) {
		users = general.halfPriv.users.forSend.join(',');
		groups =  general.halfPriv.groups.forSend.join(',');
	}
	
	$.ajax({
		url : urls.MAIN_SERVER + urls.MAIN_SCRIPT,
		type : 'GET',
		dataType : 'json',
		data : {
			action: urls.actions.SET_USER_ADMIN_ACCESS_LIST,
			session: general.currentSession,
			admin: general.currentProfile.username,
			type: (mode === 'full') ? 'counter' : 'record',
			users: users || '',
			groups: groups || ''
		},
	})
	.done(function ( data, textStatus, jqXHR ) {
		
		var status = '', // 'error' || 'success'
			message = '';
		
		if ( data[0].result === 'accesses set successfully!' ) {
			status = 'success';
		} else if ( data[0].error_msg ) {
			status = 'error';
		}
		
		if ( status === 'success' ) {
			message = 'تغییر دسترسی با موفقیت انجام شد.';
			message += '<br />';
			message += 'پیام سرور: ';
			message += '<br />';
			message += data[0].result;
		} else if ( status === 'error' ) {
			message = 'تغییر دسترسی شکست خورد.';
			message += '<br />';
			message += 'پیام سرور: ';
			message += '<br />';
			message += data[0].error_msg;
		}
		alertify[status](message);
	})
	.fail(function ( data, errorTitle, errorDetail ) {
		alertify.error('SetUserAdminAccessList failed<br />'+errorTitle+'<br />'+errorDetail);
	});
};

(function () {
	$('#modal1 button').on('click', callback);
}());

var showMessage = function (title, message) {
	
	$('.modal-trigger').leanModal({
		dismissible: false, // Modal can be dismissed by clicking outside of the modal
		opacity: .5, // Opacity of modal background
		in_duration: 300, // Transition in duration
		out_duration: 200, // Transition out duration
		ready: function() { alert('here');  }, // Callback for Modal open
		complete: function () { alert('here'); } // Callback for Modal close
	});
	
	$('#modal1 .modal-content').html( '<h1>' + title + '</h1>' +
			'<p>' + message + '</p>' );
	$('#modal1').openModal();
	
	/*bbox({
		title: title,
		message: message,
		btns: {
			success: {
				label: 'انجام بده',
				className: "btn-primary",
				callback: callback
			},
			"Danger!": {
				label: 'برگرد',
				className: "btn-default",
				callback: function () {
					
				}
			
			}
		}
	});*/
	
	
};

var main = function (mod, groups, users) {
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
	message += '<b>'+general.currentProfile.username+'</b> ';
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
};

return {
	main: main,
	defineEvt: defineEvt,
	bbox: bbox
};

}());