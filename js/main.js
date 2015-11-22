$(function () {
	a.checkSession();
	
	$(document).on('keydown', function (e) {
		if ( $('.lean-overlay').length !== 0 && e.which === 27 ) {
			$('.modal:visible a').trigger('click');
		}
	});
});