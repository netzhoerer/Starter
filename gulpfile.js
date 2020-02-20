const bsConsoleQrcode = require('bs-console-qrcode');
const {
  series, watch, src, dest, parallel,
} = require('gulp');
const pump = require('pump');

// gulp plugins and utils
const postcss = require('gulp-postcss');
const zip = require('gulp-zip');
const uglify = require('gulp-uglify');
const beeper = require('beeper');
const sass = require('gulp-sass');
const browserSync = require('browser-sync')
.create();
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const eslint = require('gulp-eslint');
const friendlyFormatter = require('eslint-formatter-friendly');

// postcss plugins
const autoprefixer = require('autoprefixer');
const colorFunction = require('postcss-color-function');
const cssnano = require('cssnano');
const customProperties = require('postcss-custom-properties');
const easyimport = require('postcss-easy-import');
const postcssScss = require('postcss-scss');
const themeName = require('./package.json').name;

const port = 2368;

function serve(done) {
  // livereload.listen();
  browserSync.init({
    proxy: `http://localhost:${port}`,
    open: false,
    notify: false,
    plugins: [bsConsoleQrcode],
  });
  done();
}

function browserSyncReload(done) {// eslint-disable-line
  browserSync.reload();
  done();
}

const handleError = (done) => (err) => {
  if (err) {
    beeper();
  }
  return done(err);
};

function hbs(done) {
  pump(
    [src(['*.hbs', '**/**/*.hbs', '!node_modules/**/*.hbs']), browserSync.stream()],
    handleError(done),
  );
}

function css(done) {
  const processors = [
    easyimport,
    customProperties({ preserve: false }),
    colorFunction(),
    autoprefixer(),
    cssnano(),
  ];

  pump(
    [
      src('assets/css/*.css', { sourcemaps: true }),
      postcss(processors),
      dest('assets/built/', { sourcemaps: '.' }),
      browserSync.stream(),
    ],
    handleError(done),
  );
}

function scss(done) {
  const processors = [
    easyimport,
    customProperties({ preserve: false }),
    colorFunction(),
    autoprefixer(),
    cssnano(),
  ];

  pump(
    [
      src('assets/scss/*.scss', { sourcemaps: true }),
      postcss(processors, {
        parser: postcssScss,
        syntax: postcssScss,
      }),
      sass(),
      concat('main.css'),
      dest('assets/built/', { sourcemaps: '.' }),
      browserSync.stream(),
    ],
    handleError(done),
  );
}

function js(done) {
  pump(
    [
      src('assets/js/*.js', { sourcemaps: true }),
      // eslint(),
      // eslint.format(friendlyFormatter),
      babel({
        presets: ['@babel/env'],
      }),
      concat('main.js'),
      uglify(),
      dest('assets/built/', { sourcemaps: '.' }),
      // eslint.results((results) => {
      //   browserSync.sockets.emit('msg:eslint', results);
      // }),
      browserSync.stream(),
    ],
    handleError(done),
  );
}

function lint(done) {
  pump(
    [
      src('assets/js/*.js', { sourcemaps: true }),
      eslint(),
      eslint.results((results) => {
        browserSync.sockets.emit('msg:eslint', results);
      }),
      eslint.format(friendlyFormatter),
    ],
    handleError(done),
  );
}

function zipper(done) {
  const targetDir = 'dist/';
  const filename = `${themeName}.zip`;

  pump(
    [src(['**', '!node_modules', '!node_modules/**', '!dist', '!dist/**']), zip(filename), dest(targetDir)],
    handleError(done),
  );
}

const cssWatcher = () => watch('assets/css/**', css);
const jsWatcher = () => watch('assets/js/**', js);
const lintWatcher = () => watch('assets/js/**', lint);
const scssWatcher = () => watch('assets/scss/**', scss);
const hbsWatcher = () => watch(['*.hbs', '**/**/*.hbs', '!node_modules/**/*.hbs'], hbs);
const watcher = parallel(scssWatcher, hbsWatcher, jsWatcher, lintWatcher);
const build = series(scss, js, lint);
const dev = series(build, serve, watcher);

exports.build = build;
exports.zip = series(build, zipper);
exports.default = dev;
