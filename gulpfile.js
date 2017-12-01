'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var newer = require('gulp-newer');

var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var cssnano = require('cssnano');

var cache = require('gulp-cache');
var imagemin = require('gulp-imagemin');

var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var cached = require('gulp-cached');
var remember = require('gulp-remember');

var browserSync = require('browser-sync').create();
var runSequence = require('run-sequence').use(gulp);
var size = require('gulp-size');

var del = require('del');


// Copy all *.html to destination directory
gulp.task('html', function() {
  return gulp.src('src/**/*.html')
    .pipe(newer('public'))
    .pipe(gulp.dest('public'))
    .pipe(browserSync.stream());
});


// Dev version with the soursemaps
gulp.task('scripts', function() {
  return gulp.src([
    'src/**/*.js',
  ])
  .pipe(cached('scripts'))
    .pipe(remember('scripts'))
    .pipe(sourcemaps.init())
    .pipe(concat('scripts.bundle.js'))
    .pipe(sourcemaps.write('.'))
    .pipe(size({ showFiles: true }))
  .pipe(gulp.dest('public'))
  .pipe(browserSync.stream());
});


// Production uglified version without the soursemaps
gulp.task('scripts:prod', function() {
  return gulp.src([
    'src/**/*.js',
  ])
  .pipe(cached('scripts'))
    .pipe(remember('scripts'))
    .pipe(concat('scripts.bundle.js'))
    .pipe(uglify({ mangle: false }))
    .pipe(size({ showFiles: true }))
  .pipe(gulp.dest('public'));
});


// Copy images to destination directory
gulp.task('images', function() {
  return gulp.src('src/images/**/*.+(png|jpg|jpeg|gif|svg)')
    .pipe(cache(imagemin({ optimizationLevel: 5, progressive: true, interlaced: true })))
    .pipe(gulp.dest('public/images'));
});


// Dev version with the soursemaps
gulp.task('styles', function() {
  var plugins = [
    autoprefixer({browsers: ['last 3 version'], map: true }),
    cssnano()
  ];
  return gulp.src('src/scss/**/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass({ includePaths: ['src/scss/'] }).on('error', sass.logError))
    .pipe(postcss(plugins))
    .pipe(sourcemaps.write('.'))
    .pipe(size({ showFiles: true }))
    .pipe(gulp.dest('public'))
    .pipe(browserSync.stream());
});


// Production version without the soursemaps
gulp.task('styles:prod', function() {
  var plugins = [
    autoprefixer({browsers: ['last 3 version']}),
    cssnano()
  ];
  return gulp.src('src/scss/**/*.scss')
    .pipe(sass({ includePaths: ['src/scss/'] }).on('error', sass.logError))
    .pipe(postcss(plugins))
    .pipe(size({ showFiles: true }))
    .pipe(gulp.dest('public'));
});


gulp.task('server', function() {
  browserSync.init({
    server: {
      files: ['/*.css', 'images/**/*.+(png|jpg|jpeg|gif|svg)'],
      baseDir: 'public'
    }
  });
});


gulp.task('clean', function() {
  return del('public');
});


gulp.task('watch', function() {
  gulp.watch('src/scss/**/*.scss', ['styles']);
  gulp.watch('src/**/*.html', ['html']);
  gulp.watch('src/images/**/*.+(png|jpg|jpeg|gif|svg)', ['images']);

  var scriptsWatcher = gulp.watch('src/**/*.js', ['scripts']);
  scriptsWatcher.on('change', function(event) {
    if (event.type === 'deleted') { // if a file is deleted, forget about it
      delete cached.caches['scripts'][event.path];
      remember.forget('scripts', event.path);
    }
  });
});


gulp.task('build', function(done) {
  runSequence('clean',
    ['styles', 'images', 'html', 'scripts'],
    done
  );
});


// Production build
gulp.task('build:prod', function(done) {
  runSequence('clean',
    ['styles:prod', 'images', 'html', 'scripts:prod'],
    done
  );
});


gulp.task('default', function(done) {
  runSequence('build', ['server', 'watch'],
    done
  );
});
