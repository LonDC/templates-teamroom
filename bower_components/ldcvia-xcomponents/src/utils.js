
var app = angular.module('xcomponents');

app.factory('xcUtils', function($rootScope, $http) {

	return {

		getConfig : function(param) {
			if ($rootScope.config) {
				return $rootScope.config[param];
			}
		},

		calculateFormFields : function(form, model, callback) {

			//add computed fields: get the list of fields that need to be computed
			var f = model.fieldsFormula;

			for (var i=0; i<f.length; i++) {

				var fieldName = f[i].field;
				var fields = f[i].formula;
				var _res = [];

				for (var j=0; j<fields.length; j++) {
					_res.push( form[ fields[j] ] );
				}
				form[fieldName] = _res.join(' ');
			}
			for (var i=0; i<model.fields.length; i++){
				if (model.fields[i].savetype){
					form[model.fields[i].field] = form[model.fields[i].field].split(",");
				}else if (model.fields[i].field.indexOf("__parsed") > -1){
					//Add LDC Via RT field
					form.From = $rootScope.username;
					form[model.fields[i].field.split("_")[0]] = {
						"type": "multipart",
						"content": [{
							"contentType": "text/html; charset=UTF-8",
							"data": form[model.fields[i].field]
						}]
					};
				}
			}

			try{
				var fileInput = document.getElementById('file');
				if (fileInput && fileInput.value != ""){
					form.file = {
						"type": "multipart",
						"content": [{
							"contentType": "text/html; charset=UTF-8",
							"data": "See Attached File (" + fileInput.value + ")"
						}]
					};
					var file = fileInput.files[0];
					var reader = new FileReader();
					reader.onload = function(e) {
						form.file.content.push({
							"contentType": file.type + "; name=\"" + file.name + "\"",
							"contentDisposition": "attachment; filename=\"" + file.name + "\"",
							"contentTransferEncoding": "base64",
							"data": reader.result.match(/,(.*)$/)[1]
						});
						callback();
					};
					reader.readAsDataURL(file);
				}else{
					callback()
				}
			}catch(e){
				callback();
			}

		},

		getSortByFunction : function(orderBy, orderReversed) {
			//function to sort an array of objects on a specific property and order

			if (typeof orderReversed == 'string') {
				orderReversed = (orderReversed == 'true' ? true : false);
			}

			return function(a,b) {

				var _a = (a[orderBy] || '');
				var _b = (b[orderBy] || '');

				if (typeof _a === 'string') { _a = _a.toLowerCase(); }
				if (typeof _b === 'string') { _b = _b.toLowerCase(); }

				var modifier = (orderReversed ? -1 : 1);
				if ( _a < _b )
					return -1 * modifier;
				if ( _a > _b )
					return 1 * modifier;
				return 0;
			};

		},

		getGroups : function(entries, groupBy, orderBy, orderReversed) {
			//group an array by a property of the objects in that array
			//returns an array containing the grouped entries

			var groups = [];
			var numEntries = entries.length;

			//organise results per group
			for (var i=0; i<numEntries; i++) {
				var entry = entries[i];
				var entryGroup = entry[groupBy];
				if (!entryGroup) entryGroup="(none)";

				var added = false;
			   	for (var g in groups) {
			     if (groups[g].name == entryGroup) {
			        groups[g].entries.push( entry);
			        added = true;
			        break;
			     }
			   	}

				if (!added) {
					groups.push({"name": entryGroup, "collapsed" : true, "entries" : [entry] });
				}
			}

		    //sort groups by group name
	    	groups.sort( function(a,b) {
				var _n1 = (a['name'] || '');
				var _n2 = (b['name'] || '');

				return ( _n1 < _n2 ? -1 : (_n1>_n2 ? 1 : 0));
	    	} );

	    	var sortFunction = this.getSortByFunction( orderBy, orderReversed)

	    	//now sort the entries in the group
	    	angular.forEach(groups, function(group) {
	    		group.entries.sort(sortFunction);
	    	});

			return groups;

		},

		resolveRemoteOptionsList : function(optionSettings) {

			var o = [];

			return $http.get(optionSettings.endpoint).then( function (res) {

				angular.forEach( res.data, function(option) {
					if (optionSettings.label && optionSettings.value){
						o.push( {label : option[optionSettings.label], value : option[optionSettings.value] });
					}else{
						o.push( {label: option, value: option});
					}
				});

				return o;

			});
		}


	};

});
