var autoc = (function () {
	
var currentItem = 0;

var setFocus = function (key) {
	if (typeof key !== 'number') { throw new Error('setFocus():  Argument is not a number.'); }
	var up = false,
		down = false,
		currentItemStr = '',
		el,
		items = $('.autoc-suggestions > tbody').children().length;
		
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
			$('.focused').removeClass('focused');
			el = $('#fn-num-' + currentItemStr );
			el.addClass('focused');
			$('#fn-autocomplete').val( el.contents().filter(':first-child').data().username );
			
		} else if (up) {
			
			currentItem -= 1;
			if (currentItem < 1 ) {
				currentItem = items;
			}
			currentItemStr = currentItem + '';
			$('.focused').removeClass('focused');
			el = $('#fn-num-' + currentItemStr );
			el.addClass('focused');
			$('#fn-autocomplete').val( el.contents().filter(':first-child').data().username );
			
		}
	}
};
var createHtml = function (arr) {
	//var html = '';
	var baseHtml = '',
		els = [],
		tr,
		counter = 1;
		
	baseHtml = util.getCommentsInside('.autoc-suggestions')[0].nodeValue.trim();
	
	arr.forEach(function (i) {
		var formatted = general.fns.formatUserInfo(i),
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
	$('.autoc-suggestions > tbody').empty();
	currentItem = 0;
	els.forEach(function (i) {
		$('.autoc-suggestions > tbody').append(i);
	});
	//$('.suggestions > tbody').html(html);
};
var makeAjax = function (term) {
	$.ajax({
		url: urls.MAIN_SERVER + urls.MAIN_SCRIPT,
		type: 'GET',
		dataType: 'json',
		data: {
			action: urls.actions.AC_USERNAME,
			session: general.currentSession,
			term: term
		},
		beforeSend: function () {
			
		}
	})
	.done(function (data) {
		var resp = data[0],
			key,
			arr = [];
		
		for (key in resp) {
			if ( resp.hasOwnProperty(key) ) {
				arr.push( resp[key] );
			}
		}
		$('.autoc-suggestions').removeClass('no-display');
		createHtml(arr);
	})
	.fail(function () {
		
	});
};
var hide = function (e) {
	var el = $('.autoc'),
		inputVal = $('#fn-autocomplete').val();
		
	if( !$(e.target).closest('.autoc').length ) {
		if( !el.hasClass('no-display') ) {
			$('.autoc-suggestions').addClass('no-display');
			if ( util.isEmptyString(inputVal) ) {
				$('#fn-autocomplete').val('');
			}
		}
	}
};
var keyup = function (e) {
	var arrowKey = false,
		enterKey = false,
		term = '',
		key = e.which,
		inputVal = $(this).val().trim();
		
	if (key === 37 || key === 38 || key === 39 || key === 40) {
		arrowKey = true;
		
	}
	if (key === 13) {
		enterKey = true;
		if ( $('.autoc-suggestions > tbody').children().length !== 0 ) {
			$(this).val( $('.focused').contents().filter(':first-child').data().username );
			$('.autoc-suggestions > tbody').empty();
			currentItem = 0;
			submit( $('#fn-autocomplete').val() );
		}
	}
	
	if ( util.isEmptyString(inputVal) ) {
		$('.autoc-suggestions > tbody').empty();
		currentItem = 0;
	} else if ( !arrowKey && !util.isEmptyString(inputVal) && !enterKey) {
		term = $(this).val().trim();
		makeAjax( term );
	}
};
var keydown = function (e) {
	// e.which === 37 // left
	// e.which === 39 // right
	// e.which === 38 // up
	// e.which === 40 // down
	var key = e.which;
	if ( key === 38 || key === 40) {
		setFocus(key);
	}
};
var mouseenter = function () {
	var id = '',
		numStr = '',
		num = 0;
	id = $(this).attr('id');
	numStr = id.match(/[-]{1}\d{0,3}$/)[0].slice(1);
	num = parseInt(numStr, 10);
	currentItem = num;
	
	$('.focused').removeClass('focused');
	$(this).addClass('focused');
	//$('#fn-autocomplete').val($(this).find('.item-wrap').data().username);
};
var mouseleave = function () {
	currentItem = 0;
	$(this).removeClass('focused');
	//$('#fn-autocomplete').val($(this).find('.item-wrap').data().username);
};
var click = function () {
	$('.autoc-suggestions').addClass('no-display');
	$('#fn-autocomplete').val( $(this).find('.item-wrap').data().username );
	submit( $('#fn-autocomplete').val() );
};
var submit = function (username) {
	profile.makeAjax(username);
};
var defEvt = function () {
	$('body').on('click', hide);
	$('#fn-autocomplete').on('keyup', keyup);
	$('#fn-autocomplete').on('keydown', keydown);
	$('.autoc').on('mouseenter', '.fn-autoc-item', mouseenter);
	$('.autoc').on('mouseleave', '.fn-autoc-item', mouseleave);
	$('.autoc').on('click', '.fn-autoc-item', click);
};

return {
	defEvt: defEvt
};

}());