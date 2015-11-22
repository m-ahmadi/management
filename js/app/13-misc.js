var misc = (function () {
	
	
var time = (function () {
	var countTime = function (timestamps) {
		var date = new Date(timestamps),
			hour = date.getHours(),
			minute = date.getMinutes(),
			second = date.getSeconds(),
			secondCounter = second,
			minuteCounter = minute,
			hourCounter = hour,
			elSecond = $('.fn-time-second'),
			elMinute = $('.fn-time-minute'),
			elHour = $('.fn-time-hour');
		setInterval(function () {
			if (secondCounter === 60) {
				minuteCounter += 1;
				elMinute.html( (minuteCounter <= 9) ? '0'+minuteCounter : ''+minuteCounter );
				secondCounter = 0;
				elSecond.html( (secondCounter <= 9) ? '0'+secondCounter : ''+secondCounter );
				secondCounter += 1;
			} else {
				elSecond.html( (secondCounter <= 9) ? '0'+secondCounter : ''+secondCounter );
				secondCounter += 1;
			}
			
			if (minuteCounter === 60 ) {
				minuteCounter = 0;
				elMinute.html( (minuteCounter <= 9) ? '0'+minuteCounter : ''+minuteCounter );
				hourCounter += 1;
				elHour.html( (hourCounter <= 9) ? '0'+hourCounter : ''+hourCounter );
			}
			
			if ( hourCounter === 24 ) {
				hourCounter = 0;
				elHour.html( (hourCounter <= 9) ? '0'+hourCounter : ''+hourCounter );
			}
			
		}, 1000);
	};
	return function () {
		$.ajax({
			url : urls.MAIN_SERVER + urls.MAIN_SCRIPT,
			data: {
				action: urls.actions.GET_DATE
			},
			type: 'GET',
			dataType: 'json',
			beforeSend: function () {
				$('.a-nav-time').css({visibility: 'hidden'});
			}
		})
		.done(function (data) {
			var response= data[0],
			timestamp = parseInt(response.timestamp, 10),
				d = new Date(timestamp),
				week = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
				month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
				weekday = week[ d.getDay() ],
				monthNumber = d.getMonth(),
				monthName = month[ monthNumber ];
			
			$('.fn-endate-dayname').html(weekday.toUpperCase());
			$('.fn-endate-monthnumber').html( monthNumber );
			$('.fn-endate-monthname').html( monthName.toUpperCase() );
			$('.fn-endate-year').html( d.getFullYear() );
			
			$('.fn-fadate-dayname').html(response.day.weekday.name);
			$('.fn-fadate-daynumber').html(response.day.monthday.name);
			$('.fn-fadate-monthname').html(response.month.name);
			var year = '' + response.year.full;
			$('.fn-fadate-year').html( year );
			$('.fn-time-hour').html( d.getHours() );
			$('.fn-time-minute').html( d.getMinutes() );
			$('.fn-time-second').html( d.getSeconds() );
			countTime(timestamp);
		})
		.fail(function () {
			$('.a-nav-time').css({visibility: 'hidden'});
		});
	};
}());


return {
	time: time
};
}());