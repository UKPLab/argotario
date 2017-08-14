String.prototype.endsWith = function(suffix) {
	return this.indexOf(suffix, this.length - suffix.length)!==-1;
};

// Allows retrieving a value of a multi-level dictionary by providing a key-path.
// Key-path is a dot-chained path to the desired object.
// Key-path can contain array indexes.
// If the path cannot reach the desired object, undefined is returned.
// Example: valueForKeyPath({a:[{b:[{a:123}]}]}, 'a[0].b[0].a') === 123
valueForKeyPath = function(obj, keyPath, fallbackValue) {
	keyPath = keyPath.replace(/\[/g,'.').replace(/\]/g,'');
	var chunks = keyPath.split('.');
	var pointed = obj;
	angular.forEach(chunks, function(chunk){
		//if (pointed!==undefined)
		//	console.log(pointed, 'has',chunk, (chunk in pointed), (typeof pointed[chunk]!=='undefined') );
		try {
			if (pointed===undefined || (chunk!==undefined && (!(chunk in pointed)))) {
				pointed = undefined;
				return;
			};
			pointed = pointed[chunk];
		} catch(e) {
			return;
		}
	});
	if (pointed===undefined && fallbackValue!==undefined)
		pointed = fallbackValue;
	return pointed;
}

// From: User named 'con',
// http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
Array.prototype.shuffle = function() {
  var i = this.length, j, temp;
  if ( i == 0 ) return this;
  while ( --i ) {
     j = Math.floor( Math.random() * ( i + 1 ) );
     temp = this[i];
     this[i] = this[j];
     this[j] = temp;
  }
  return this;
}

Array.prototype.randomizedSubrange = function(start, length) {
	var toRandomize = this.slice().splice(start,length);
	toRandomize = toRandomize.shuffle();
	return this.slice(0,start).concat(toRandomize).concat(this.slice(start+length));
}

shuffle = function(array) {
  var currentIndex = array.length, temporaryValue, randomIndex ;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}


ensure = function(params,keys) {
	if (typeof keys == 'string') {
		keys = keys.split(',');
	}
    console.log("checking params", params);
    console.log("checking keys", keys);

	angular.forEach(keys, function(key,_) { // values are actually 'keys'
        console.log("in for loop", key);
		if (!params.hasOwnProperty(key))
			throw new Error("Missing parameter named '"+key+"' in API call.");
	});
	return true;
}

// Actually modifies the argument
moveObjectAtIndexToIndex = function (arr, from, to) {
	if (to >= arr.length) {
		var i = to -arr.length;
		while ((i--) + 1) arr.push(undefined);
	}
	arr.splice(to, 0, arr.splice(from, 1)[0]);
};
