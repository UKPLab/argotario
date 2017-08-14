module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
	pkg: grunt.file.readJSON('package.json'),
	
	xgettext: {
		options: {
		  functionName: "t",
		  potFile: "messages.pot",
		  //processMessage: function(message) { ... }
		},
		target: {
		  files: {
			handlebars: ['www/Views/**.html'],
			javascript: ['www/Controllers/**.js']
		  }
		}
	},
	
	i18nextract: {
	  default_options: {
		src: [ 'www/Controllers/**/*.js','www/Views/**.html' ],
		lang:     ['de_DR'],
		dest:     'tmp'
	  }
	},
	
	
	ngtemplates: {
		app: {
		 src: 'www/Views/*.html',
		 dest: 'bin/templates.js',
		 options: {
		 htmlmin: {
			 collapseBooleanAttributes:      true,
			 collapseWhitespace:             true,
			 removeAttributeQuotes:          false,
			 removeComments:                 true, // Only if you don't use comment directives! 
			 removeEmptyAttributes:          true,
			 removeRedundantAttributes:      true,
			 removeScriptTypeAttributes:     false,
			 removeStyleLinkTypeAttributes:  false
	     }}
		}
	}
  });

  // Load the plugin that provides the "uglify" task.
  //grunt.loadNpmTasks('grunt-contrib-uglify');
  //grunt.loadNpmTasks('grunt-xgettext');
  
  grunt.loadNpmTasks('grunt-angular-translate');
  
  grunt.loadNpmTasks('grunt-angular-templates');


  // Default task(s).
  //grunt.registerTask('default', ['i18nextract']);
  grunt.registerTask('default', ['ngtemplates']);
  
};