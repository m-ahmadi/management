var tabs = (function () {
	
	var show = function (e) {
		var target = $(this).data().tab;
		$('.tab-link').addClass('disabled');
		$(this).removeClass('disabled');
		$('.tab-item').addClass('no-display');
		$('.tab'+target).removeClass('no-display');
	};
	
	return {
		show: show
	};
}());