const { series, watch, src, dest, parallel } = require('gulp');
const pump = require('pump');

// gulp plugins and utils
var livereload = require('gulp-livereload');
var postcss = require('gulp-postcss');
var zip = require('gulp-zip');
var uglify = require('gulp-uglify');
var beeper = require('beeper');
var sass = require('gulp-sass');

// postcss plugins
var autoprefixer = require('autoprefixer');
var colorFunction = require('postcss-color-function');
var cssnano = require('cssnano');
var customProperties = require('postcss-custom-properties');
var easyimport = require('postcss-easy-import');
var postcssScss = require('postcss-scss');

function serve(done) {
	livereload.listen();
	done();
}
// @todo: https://browsersync.io/docs/gulp

const handleError = (done) => {
	return function(err) {
		if (err) {
			beeper();
		}
		return done(err);
	};
};

function hbs(done) {
	pump([ src([ '*.hbs', '**/**/*.hbs', '!node_modules/**/*.hbs' ]), livereload() ], handleError(done));
}

function css(done) {
	var processors = [ easyimport, customProperties({ preserve: false }), colorFunction(), autoprefixer(), cssnano() ];

	pump(
		[
			src('assets/css/*.css', { sourcemaps: true }),
			postcss(processors),
			dest('assets/built/', { sourcemaps: '.' }),
			livereload(),
		],
		handleError(done)
	);
}

function scss(done) {
	var processors = [ easyimport, customProperties({ preserve: false }), colorFunction(), autoprefixer(), cssnano() ];

	pump(
		[
			src('assets/scss/*.scss', { sourcemaps: true }),
			postcss(processors, { parser: postcssScss, sytax: postcssScss }),
			sass(),
			dest('assets/built/', { sourcemaps: '.' }),
			livereload(),
		],
		handleError(done)
	);
}

function js(done) {
	pump(
		[
			src('assets/js/*.js', { sourcemaps: true }),
			uglify(),
			dest('assets/built/', { sourcemaps: '.' }),
			livereload(),
		],
		handleError(done)
	);
}

function zipper(done) {
	var targetDir = 'dist/';
	var themeName = require('./package.json').name;
	var filename = themeName + '.zip';

	pump(
		[ src([ '**', '!node_modules', '!node_modules/**', '!dist', '!dist/**' ]), zip(filename), dest(targetDir) ],
		handleError(done)
	);
}
css;
const cssWatcher = () => watch('assets/css/**', css);
const scssWatcher = () => watch('assets/scss/**', scss);
const hbsWatcher = () => watch([ '*.hbs', '**/**/*.hbs', '!node_modules/**/*.hbs' ], hbs);
const watcher = parallel(scssWatcher, hbsWatcher);
const build = series(scss, js);
const dev = series(build, serve, watcher);

exports.build = build;
exports.zip = series(build, zipper);
exports.default = dev;
