var tree = (function () {


var useJstree = function (divId, treeStructure) {
	$.jstree.defaults.plugins = [
		//"grid"
		"checkbox"
		// "contextmenu", 
		// "dnd", 
		// "massload", 
		// "search", 
		// "sort", 
		// "state", 
		// "types", 
		// "unique", 
		// "wholerow", 
		// "changed", 
		// "conditionalselect"
	];
	
	$('#'+divId).jstree({
		core : {
			//animation : 0,
			data : treeStructure
		},
		types : {
			"default" : {
				//"icon" : "jstree-icon jstree-file"
				"disabled" : { 
					"check_node" : false, 
					"uncheck_node" : false 
				}
			},
			"demo" : {
			}
		}
	});
};

var getSelection = function (selected, treeId) {
	if ( !util.isArray(selected) ) { throw new Error('getSelection:  Argument is not an array.'); }
	
	var status = '',
		childless = [],
		withChild = [];
		
	var result = {
		counter: {
			groups: {
				forSend: [],
				forView: []
			},
			users: {
				forSend: [],
				forView: []
			}
		},
		record: {
			groups: {
				forSend: [],
				forView: []
			},
			users: {
				forSend: [],
				forView: []
			}
		},
		groupsAndUsers: []
	};
	if ( treeId === 'jstree_demo_div') {
		status = 'counter';
	} else if ( treeId === 'jstree_demo_div_2' ) {
		status = 'record';
	}
	/*
		2 ways to achive our goal:
		go through childless items and grab their parent and then see if all the childs of their parent is selected or not,
		if yes just select the parent, if not select all the siblings.
		
		go through withChild items and check all of their childs to see if they are select or not.
			if		item.children.length !== 0		&&		item.state.selected === true  
			groupList.push(item.id)
	*/
	selected.forEach(function (item) { // extract childless abd withChild node objects
		if (item.children.length === 0) { // childless node
			
			if (  $.inArray( item.text, childless ) === -1  ) { // item doesn't exists in our array
				childless.push(item);
				
			}
		} else if (item.children.length !== 0) { //idk(item);
			// item has child
			withChild.push(item);
		}
	});
	childless.forEach(function (item) {
		var parent = $('#'+treeId).jstree('get_node', item.parent);
		if ( parent.state.selected === false ) {
			//console.log(item);
			
			if ( status === 'counter' ) {
				result.counter.users.forSend.push(item.text);
				//result.counter.users.forView.push(item.text);
			} else if ( status === 'record' ) {
				result.record.users.forSend.push(item.text);
				//result.records.users.forView.push(item.text);
			}
			result.groupsAndUsers.push({
				text: item.text,
				icon: item.icon
			});
		}
	});
	// withChild	->		// [Object, Object, Object, Object]
	withChild.forEach(function (item) { // [Object,
		if ( item.children.length !== 0 && item.state.selected === true ) { // completely selected folder
			var parent = $('#'+treeId).jstree('get_node', item.parent);
			if ( parent.state.selected === false ) {
				if ( status === 'counter' ) {
					result.counter.groups.forSend.push(item.id);
					result.counter.groups.forView.push(item.text);
				} else if ( status === 'record' ) {
					result.record.groups.forSend.push(item.id);
					result.record.groups.forView.push(item.text);
				}
				result.groupsAndUsers.push(item.text);
			}
		}
	});
	//console.log(result.groupsAndUsers);
	return result;
};

var evt = function (mainTree, listTree) {
	var selected = [],
		result;
	
	var handler = function (e, node) {
		//console.log(e);
		//console.log(node);
		general.tree.modified = true;
		
		if ( $(e.target).hasClass('jstree-anchhor') || $(e.target).hasClass('jstree-checkbox') ) {
			
			if ( general.tree.modified ) {
				$('#fn-'+mainTree+'-give_access').removeClass('disabled');
			} else if ( !general.tree.modified ) {
				$('#fn-'+mainTree+'-give_access').addClass('disabled');
			}
		}
	};
	$('#'+mainTree).on('click #'+mainTree, handler); // select_node.jstree
	//$('#'+mainTree).on('click #jstree_demo_div_2', handler); //  deselect_node.jstree
	
	$('#'+mainTree).on('ready.jstree', function (e, data) {
		//$('.fn-'+mainTree+'-treetoolbar').removeClass('disabled');
	});
	$('#'+mainTree).on("changed.jstree", function (e, data) {
		
		/*	make give access button disable if nothing is selected
		
		if ( $('#'+mainTree).jstree('get_selected', ['full']).length === 0 ) {
			$('#fn-'+mainTree+'-give_access').addClass('disabled');
		} else {
			$('#fn-'+mainTree+'-give_access').removeClass('disabled');
		}
		*/

		selected = $( '#'+mainTree).jstree('get_selected', ['full'] );
		result = getSelection( selected, mainTree );
		
		general.fullPriv.groups.forSend = result.counter.groups.forSend;
		general.fullPriv.groups.forView = result.counter.groups.forView;
		general.fullPriv.users.forSend = result.counter.users.forSend;
		general.halfPriv.groups.forSend = result.record.groups.forSend;
		general.halfPriv.groups.forView = result.record.groups.forSend;
		general.halfPriv.users.forSend = result.record.users.forSend;
		
		$('#'+listTree).remove();
		$('#fn-'+listTree+'-parent').append( $.parseHTML('<div id="'+listTree+'" class="col-md-2 text-right"></div>') );
		$('#'+listTree).jstree({
			core : {
				data : result.groupsAndUsers
			}
		});
	});
	
	$('#fn-'+mainTree+'-open_all').on('click', function () {
		if ( !$(this).hasClass('disabled') ) {
			$('#'+mainTree).jstree(true).open_all();
		}
	});
	$('#fn-'+mainTree+'-close_all').on('click', function () {
		if ( !$(this).hasClass('disabled') ) {
			$('#'+mainTree).jstree(true).close_all();
		}
	});
	$('#fn-'+mainTree+'-select_all').on('click', function () {
		if ( !$(this).hasClass('disabled') ) {
			$('#'+mainTree).jstree(true).select_all();
			$('#fn-'+mainTree+'-give_access').removeClass('disabled');
		}
	});
	$('#fn-'+mainTree+'-deselect_all').on('click', function () {
		if ( !$(this).hasClass('disabled') ) {
			$('#'+mainTree).jstree(true).deselect_all();
			$('#fn-'+mainTree+'-give_access').removeClass('disabled');
		}
	});
};

var extractForRecheck = function (obj) {
	if ( !util.isObject(obj) ) { throw new Error('extractForRecheck:  Argument is not an object.'); }
	var counters = [],
		records = [];
	
	obj.counters.users.forEach(function (item) {
		if ( typeof item !== 'undefined' && typeof item === 'string') {
			counters.push(item);
		}
	});
	obj.counters.groups.forEach(function (item) {
		if ( typeof item !== 'undefined' ) {
			counters.push(item);
		}
	});
	obj.records.users.forEach(function (item) {
		if ( typeof item !== 'undefined' ) {
			records.push(item);
		}
	});
	obj.records.groups.forEach(function (item) {
		if ( typeof item !== 'undefined' ) {
			records.push(item);
		}
	});
	return {
		counters: counters,
		records: records
	};
};

var reCheckHelper = function (divId, node) {
	// console.log(node);
	if ( !util.isObject(node) ) { throw new Error('reCheckHelper:  Argument is not an object.'); }
	
	if (node) {
		$('#'+divId).jstree(true).select_node(node.id, true, false); // 3true: closed,    3false:  opened
		/*if (node.parent === '#' && typeof node.parent === 'string') { // root node
			
			$('#'+divId).jstree(true).open_node(node.id);
			$('#'+divId).jstree(true).select_node(node.id, true, false);
			return;
			
		} else if (node.parent !== '#' && typeof node.parent === 'string') { // node that has a parrent
		
			//$('#'+divId).jstree(true).select_node(node.id, true, false);
			
			$('#'+divId).jstree(true).open_node(node.parent);
			// $('#'+divId).jstree(true).select_node(node.id, true, false);
			
			var node = $('#'+divId).jstree(true).get_node(node.parent, false);
			if ( !util.isObject(node) ) {
				reCheckHelper(node);
			}
		}*/
	}
};

var reCheck = function (divId, arr) {
	if ( !util.isArray( arr ) ) { throw new Error('reChekd:  Second argument is not an array.'); }
	
	$('#'+divId).jstree(true).deselect_all(); // true
	$('#'+divId).jstree(true).close_all(); // true
	arr.forEach(function (item) {
		if (typeof item === 'string') {
			reCheckHelper( divId, $('#'+divId).jstree(true).get_node(item, false) );
		}
	});
	general.tree.modified = false;
};



(function () {
	$.ajax({
		url : urls.MAIN_SERVER + urls.MAIN_SCRIPT,
		type : 'GET',
		dataType : 'json',
		data : {
			action: urls.actions.GET_GROUPS, //http://100.80.0.175/cgi-bin/FCPNI?&action=GetMyViewAccessList&session=abc&admin=taslimi-p
			session: general.currentSession,
			base: '0',
			version: '2'	// 1= without icon	2= with icon
		}
	})
	.done(function (a) {
		general.tree.structure = a[0];
		
		$('#jstree_demo_div').remove();
		$('#fn-jstree_demo_div-parent').append( $.parseHTML('<div id="jstree_demo_div" class="hidden"></div>') );
		$('#jstree_demo_div_2').remove();
		$('#fn-jstree_demo_div_2-parent').append( $.parseHTML('<div id="jstree_demo_div_2" class="hidden"></div>') );
		
		useJstree('jstree_demo_div', general.tree.structure);
		useJstree('jstree_demo_div_2', general.tree.structure);
		evt('jstree_demo_div', 'jstree_demo_div_3');
		evt('jstree_demo_div_2', 'jstree_demo_div_4');
	})
	.fail(function ( data, errorTitle, errorDetail ) {
		alertify.error('Getgroups failed<br />'+errorTitle+'<br />'+errorDetail);
	});
}());

var loadTrees = function () {
	
	$.ajax({
		url: urls.MAIN_SERVER + urls.MAIN_SCRIPT,
		type: 'GET',
		dataType: 'json',
		data: {
			action: urls.actions.GET_USER_ADMIN_ACCESS_LIST,
			session: general.currentSession,
			admin: general.currentProfile.username
		}
	})
	.done(function (data) {
		var userAccessList = extractForRecheck( data[0] );
		reCheck('jstree_demo_div', userAccessList.counters);
		reCheck('jstree_demo_div_2', userAccessList.records);
		$('.fn-treetoolbar').removeClass('disabled');
		$('#fn-jstree_demo_div-give_access').addClass('disabled');
		$('#fn-jstree_demo_div_2-give_access').addClass('disabled');
		$('#jstree_demo_div').removeClass('hidden');
		$('#jstree_demo_div_2').removeClass('hidden');
	})
	.fail(function ( data, errorTitle, errorDetail ) {
		alertify.error('GetUserAdminAccessList failed<br />'+errorTitle+'<br />'+errorDetail);
	});
	
};



return {
	useJstree: useJstree,
	getSelection: getSelection,
	evt: evt,
	extractForRecheck: extractForRecheck,
	reCheckHelper: reCheckHelper,
	reCheck: reCheck,
	loadTrees: loadTrees
};

}());