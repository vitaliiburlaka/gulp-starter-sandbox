'use strict';

var gulp = require('gulp');

var sass = require('gulp-sass');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var cssnano = require('cssnano');

var sourcemaps = require('gulp-sourcemaps');
var changed = require('gulp-changed');
var rename = require('gulp-rename');

var cache = require('gulp-cache');
var imagemin = require('gulp-imagemin');

var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var cached = require('gulp-cached');
var remember = require('gulp-remember');
var wrap = require('gulp-wrap');

var browserSync = require('browser-sync').create();
var runSequence = require('run-sequence').use(gulp);
var size = require('gulp-size');

var htmlmin = require('gulp-htmlmin');

var del = require('del');
var yargs = require('yargs');
var gulpif = require('gulp-if');
var path = require('path');


var argv = yargs.argv;
var root = 'src/';
var paths = {
  dist: './dist/',
  scripts: [root + '/js/**/*.js', !root + '/js/**/*.spec.js'],
  tests: root + '/js/**/*.spec.js',
  styles: root + '/scss/**/*.scss',
  html: root + '/**/*.html',
  images: root + '/img/**/*.+(png|jpg|jpeg|gif|svg)',
  modules: [
    'jquery/dist/jquery.js'
  ],
  static: [
    root + '/fonts/**/*'
  ]
};


// Remove Destination directory with all files
gulp.task('clean', function() {
  return del(paths.dist + '**/*');
});


// Copy satic assets to destination directory
gulp.task('copy', function() {
  return gulp.src(paths.static, { base: 'src' })
    .pipe(changed(paths.dist))
    .pipe(gulp.dest(paths.dist))
    .pipe(gulpif(!argv.prod, browserSync.stream()));
});


// Copy all *.html templates to destination directory
gulp.task('html', function() {
  return gulp.src(paths.html, { base: 'src' })
    .pipe(changed(paths.dist))
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest(paths.dist))
    .pipe(gulpif(!argv.prod, browserSync.stream()));
});


// Compile App styles
gulp.task('styles', function() {
  var plugins = [
    autoprefixer(),
    cssnano()
  ];
  return gulp.src(paths.styles)
    .pipe(gulpif(!argv.prod, sourcemaps.init()))
    .pipe(sass({ includePaths: ['src/scss/'] }).on('error', sass.logError))
    .pipe(postcss(plugins))
    .pipe(rename('styles.css'))
    .pipe(gulpif(!argv.prod, sourcemaps.write('.')))
    .pipe(size({ showFiles: true }))
    .pipe(gulp.dest(paths.dist + 'css/'))
    .pipe(gulpif(!argv.prod, browserSync.stream()));
});


// Bundle App scripts
gulp.task('scripts', function() {
  return gulp.src(paths.scripts)
    .pipe(cached('scripts'))
    .pipe(gulpif(!argv.prod, sourcemaps.init()))
    .pipe(wrap('(function(){\n\'use strict\';\n<%= contents %>})();'))
    .pipe(remember('scripts'))
    .pipe(concat('scripts.js'))
    .pipe(gulpif(argv.prod, uglify()))
    .pipe(gulpif(!argv.prod, sourcemaps.write('.')))
    .pipe(size({ showFiles: true }))
    .pipe(gulp.dest(paths.dist + 'js/'))
    .pipe(gulpif(!argv.prod, browserSync.stream()));
});


// Bundle App dependencies(vendor) modules
gulp.task('modules', function() {
  return gulp.src(paths.modules.map(function(item) {
    return 'node_modules/' + item;
  }))
    .pipe(concat('vendor.js'))
    .pipe(gulpif(argv.prod, uglify()))
    .pipe(size({ showFiles: true }))
    .pipe(gulp.dest(paths.dist + 'js/'));
});


// Optimize and Copy images to destination directory
gulp.task('images', function() {
  return gulp.src(paths.images)
    .pipe(changed(paths.dist))
    .pipe(cache(imagemin([
      imagemin.gifsicle({interlaced: true}),
      imagemin.jpegtran({progressive: true}),
      imagemin.optipng({optimizationLevel: 5}),
      imagemin.svgo({
        plugins: [
          {cleanupIDs: true}
        ]
      })
    ])))
    .pipe(gulp.dest(paths.dist + '/img'));
});


// Starts local dev server
gulp.task('serve', function() {
  return browserSync.init({
    server: {
      files: ['/*.css', 'images/**/*.+(png|jpg|jpeg|gif|svg)'],
      baseDir: paths.dist
    }
  });
});


// Watch files on changes
gulp.task('watch', function() {
  var watchers = [
    gulp.watch(paths.static, ['copy']),
    gulp.watch(paths.html, ['html']),
    gulp.watch(paths.styles, ['styles']),
    gulp.watch(paths.images, ['images'])
  ];

  // Handling the Delete Event on Watch
  watchers.forEach(function(task) {
    task.on('change', function(event) {
      if (event.type === 'deleted') {
        // Simulating the {base: 'src'} used with gulp.src in the watched task
        var filePathFromSrc = path.relative(path.resolve('src'), event.path);

        // Concatenating the 'dist' absolute path used by gulp.dest in the watched task
        var destFilePath = path.resolve(paths.dist, filePathFromSrc);

        del.sync(destFilePath);
      }
    });
  });

  var scriptsWatcher = gulp.watch(paths.scripts, ['scripts']);
  scriptsWatcher.on('change', function(event) {
    if (event.type === 'deleted') { // if a file is deleted, forget about it
      delete cached.caches['scripts'][event.path];
      remember.forget('scripts', event.path);
    }
  });
});


// Bundle the App files
gulp.task('build', function(cb) {
  runSequence('clean',
    ['copy', 'html', 'styles', 'images', 'scripts', 'modules'],
    cb
  );
});


// Bundle the App, start dev server and watch files on changes
gulp.task('default', function(cb) {
  runSequence('build', ['serve', 'watch'],
    cb
  );
});
