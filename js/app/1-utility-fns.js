var util = {
	isObject: function (v) {
		return Object.prototype.toString.call(v) === "[object Object]";
	},
	isArray: function (v) {
		if ( typeof Array.isArray === 'function' ) {
			return Array.isArray(v);
		} else {
			return Object.prototype.toString.call(v) === "[object Array]";
		}
	},
	isEmptyString: function (v) {
		return ( typeof v === 'string'  &&  v.length === 0 ) ? true : false;
	},
	getCommentsInside: function (selector) {
		return $(selector).contents().filter(function () { return this.nodeType == 8; });
	}
};