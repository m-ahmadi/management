general.fns.formatUserInfo = function (user) {
	//console.log( atob( user.ldap_dn.slice(0, -3) ) );
	//console.log(user.ldap_sn);
	var nameRow,
		result;
	
	if (typeof user.ldap_cn !== 'undefined') {
		
		nameRow = Base64.decode( user.ldap_cn );
		
	} else if (typeof user.ldap_dn !== 'undefined') {
		
		Base64.decode( user.ldap_dn ).split(',').forEach(function (i) {
			if ( i.slice(0, 3) === 'CN=' ) {
				nameRow = i.slice(3);
				return;
			}
		});
	}
	
	
	var fullnameArr = nameRow.split(' - '),  // 
		fullnameFa = fullnameArr[1] +' '+ fullnameArr[0],
		fullnameEn = Base64.decode( user.ldap_givenname ) +' '+ Base64.decode( user.ldap_sn.slice(0, -1) ),	// atob( user.ldap_givenname ) +' '+ atob( user.ldap_sn.slice(0, -1) );
		firstname = fullnameArr[1], // Base64.decode( user.ldap_givenname )
		lastname = fullnameArr[0];  // Base64.decode( user.ldap_sn.slice(0, -1) )
	// atob		->		Base64.decode
	
	result = {
		username: user.username,
		fullnameFa: fullnameFa,
		fullnameEn: fullnameEn,
		firstname: firstname,
		lastname: lastname,
		email: user.email,
		title: Base64.decode( user.ldap_title ),
		number: user.number
	};
	if ( typeof user.photo === 'string' && !util.isEmptyString(user.photo) ) {
		result.photo = urls.MAIN_SERVER + user.photo;
	}
	return result;
};