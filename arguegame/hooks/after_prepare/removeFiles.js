#!/usr/bin/env node

var fs = require('fs');
var path = require('path');


var rootDir = process.argv[2];
var platformPath = path.join(rootDir, 'platforms');
var platform = process.env.CORDOVA_PLATFORMS;

// hook configuration
var isRelease = true; // by default this hook is always enabled, see the line below on how to execute it only for release
//var isRelease = (cliCommand.indexOf('--release') > -1); 
var recursiveFolderSearch = true; // set this to false to manually indicate the folders to process

var filesToRemove = [ // add other www folders in here if needed (ex. js/controllers)
	'index-dev.html',
	'simulator-multiple.html',
	'simulator-prod.html',
	'simulator.html',
	'.jslintrc',
	'.remote-sync.json',
	'src/',
	'Docs/',
	'.dev/'
];


switch (platform) {
    case 'android':
        platformPath = path.join(platformPath, platform, 'assets', 'www');
        break;
    case 'ios':
        platformPath = path.join(platformPath, platform, 'www');
        break;
    case 'browser':
	case 'browser,ios':
	    platformPath = path.join(platformPath, 'browser', 'www');
	    break;
    default:
        console.log("\n\n\nThis hook (uglify.js) only supports android and ios currently (platform = '"+platform+"')\n\n\n");
        return;
}

filesToRemove.forEach(function(filePath) {
    processFile(path.join(platformPath, filePath));
});

function deleteFolderRecursive(path) {
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}

function processFile(filePath) {
	try {
		if (filePath.substr(-1)=='/')
			deleteFolderRecursive(filePath)
		else
			fs.unlinkSync(filePath);
		console.log("\nRemoved file or folder at path '",filePath,"'\n");
	} catch(e) {
		console.warn("\nWARNING: Could not delete file or folder at path '",filePath,"'\n");
		
	}
}