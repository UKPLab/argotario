var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs');
var rsync = require('gulp-rsync');
var concatCss = require('gulp-concat-css');

var paths = {
	sass:	[
		'./www/**/*.scss'
	],
	
	/** Files matching the following rules will be merged into the App.js file. */
	appJs: [
		'www/src/App/**/*.js',
	],
	
	/** Files matching the following rules will be merged into the Vendor.js file. */
	vendorJs: [
		'www/src/Vendor/**/*.js',
	],
	
	stylesheets: [
		'www/src/**/*.css'
	]
};

/** This task is being executed if you run '$ gulp' in the app's root dir. */
gulp.task('default', [
	'concatAppJs','concatVendorJs'
]);

/** Watch files */
gulp.task('watchAppJs', function(){
    gulp.watch(paths.appJs, ['concatAppJs']);
});

gulp.task('watchVendorJs', function(){
    gulp.watch(paths.vendorJs, ['concatVendorJs']);
});

gulp.task('watchStylesheets', function(){
    gulp.watch(paths.stylesheets, ['concatStylesheets']);
});

gulp.task('watchSass', function(){
    gulp.watch(paths.sass, ['compileSass']);
});

gulp.task('concatStylesheets', function () {
  gulp.src(paths.stylesheets)
    .pipe(concatCss("styles/bundle.css",{
        targetFile:'../../bin/stylesheet.css'
    }))
    .pipe(gulp.dest('bin/'));
});

/** Compile tasks */
gulp.task('sass', function(done) {
//  gulp.src('./scss/ionic.app.scss')
  gulp.src('./www/**/*.scss')
    .pipe(sass())
    .pipe(gulp.dest('./www/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/'))
    .on('end', done);
});

gulp.task('compileSass', function(){
    gulp.src(['./www/**/*.scss'])
    .pipe(sass())
    .pipe(gulp.dest('./www/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/'))
    .on('end', done);
});


/** Raffael:end */

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
    .on('log', function(data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});

/** This task pushes the game onto the argue/ server. Requires active VPN connection. */
gulp.task('deploy', function() {
	var options = {
	    hostname: 'argue.ukp.informatik.tu-darmstadt.de',
	    username: 'klamm',
	    exclude: [
	    	'platforms/browser/www/src',
	    	'platforms/browser/www/Docs'
	    ],
	    destination: '/var/www/arguegame2',
	    root: 'platforms/browser'
	};
	
	return gulp.src('platforms/browser/www/**')
        .pipe(rsync(options));
});

gulp.task('concatAppJs', function() {
	return gulp.src(paths.appJs).pipe(concat('App.js'))
		  .pipe(gulp.dest('./www/bin/'));
});

gulp.task('concatVendorJs', function(){
	return gulp.src(paths.vendorJs).pipe(concat('Vendor.js'))
	  .pipe(gulp.dest('./www/bin/'));
});
