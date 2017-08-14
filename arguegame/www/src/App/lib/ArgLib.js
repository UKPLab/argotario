// Commonly used JS functions specifically targeting the argue project.

(function (ext) {

ext.angularServices = {};

// ext == window.

/** Returns a sanitized version of the object / dictionary, that is safe to be stored in the back-end.
 * Strips all functions, and all values that are referenced by keys with certain char prefixes, e.g.,
 * '&', '$' and '#'.
 * It also removes 'id' keys, since they are used to reference existing entities. Set removeId to false
 * if you'd like to keep it, to overwrite an existing DB entity referenced by the id.
 */
ext.preparedForSaving = function(obj, removeId) {
	if (removeId!==undefined && removeId && 'id' in obj) {
		delete obj.id;
	}

	switch(typeof obj) {
		case 'object':
			var objIsArray = obj!=null && obj.constructor === Array;
			var copy = obj==null ? null : (objIsArray ? [] : {});
			angular.forEach(obj, function(value,key){
				if (typeof key == "number" || "$%&#".indexOf(key.substr(0,1))==-1) {
					var prepared = preparedForSaving(value);
					if (prepared!==undefined) {
						if (objIsArray) {
							copy.push(prepared);
						} else {
							copy[key] = prepared;
						}
					}
				}
			});
			return copy;
		case 'string':
		case 'number':
		case 'boolean':
		case 'undefined':
			return obj;
	}
	return undefined;
}

/** Return the highest key value pair within a voting distribution.
* The returned object contains the keys 'key' and 'value', that models the
* determined key-value pair, or null, if the distribution is empty.
* @param	distribution		The voting distribution, which is a dictionary of
* 								keys, and their voting (procentual, e.g., 0.5) as
* 								their value.
* @return	The key-value pair with the highest voting value, or null.
*/
ext.highestVotedKeyAndValue = function( distribution ) {
	var highestVoting = -1,
		highestKeyValue = null;
	angular.forEach(distribution, function (votingValue, key) {
		if (votingValue > highestVoting) {
			highestVoting = votingValue;
			highestKeyValue = {
				key: key,
				value: votingValue
			};
		}
	});
	return highestKeyValue;
}

/** Return the highest key value pair within a voting distribution, but only, if
 * the value exceeds the specified threshold.
 * The returned object contains the keys 'key' and 'value', that models the
 * determined key-value pair, or null, if no voted object with that threshold
 * could be found.
 * @param	distribution		The voting distribution, which is a dictionary of
 * 								keys, and their voting (procentual, e.g., 0.5) as
 * 								their value.
 * @param	votingThreshold		The required threshold the most confident voting
 * 								should exceed.
 * @return	An object with the keys key and value, whereas key references the
 * 			voted value, and value references the decimal value of the voting.
 * 			If the distribution does not contain a tuple that is assumed to be
 * 			confident, an object with both key and value set to null is returned.
 */
kConstMinimumConfidenceThreshold	= 0.65;
kConstMinimumMajorityThreshold		= 0.75
ext.reliablyHighestVotedKeyAndValue = function( distribution ) {
	var hv = highestVotedKeyAndValue(distribution);
	return (hv && hv.value > kConstMinimumMajorityThreshold && distribution['#confidence'] > kConstMinimumConfidenceThreshold) ? hv : {
		key: null,
		value: null // return a semi-null object, that which is guaranteed to always have a 'key' key
	};
}

})(window);
