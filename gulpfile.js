'use strict'

const gulp = require('gulp')

const sass = require('gulp-sass')
const postcss = require('gulp-postcss')
const autoprefixer = require('autoprefixer')
const cssnano = require('cssnano')

const sourcemaps = require('gulp-sourcemaps')
const changed = require('gulp-changed')
const rename = require('gulp-rename')

const cache = require('gulp-cache')
const imagemin = require('gulp-imagemin')

const concat = require('gulp-concat')
const uglify = require('gulp-uglify')
const cached = require('gulp-cached')
const remember = require('gulp-remember')
const wrap = require('gulp-wrap')

const browserSync = require('browser-sync').create()
const size = require('gulp-size')

const htmlmin = require('gulp-htmlmin')

const del = require('del')
const yargs = require('yargs')
const gulpif = require('gulp-if')

const argv = yargs.argv
const srcPath = './src'
const paths = {
  dist: './dist/',
  scripts: [srcPath + '/js/**/*.js', !srcPath + '/js/**/*.spec.js'],
  tests: srcPath + '/js/**/*.spec.js',
  styles: srcPath + '/scss/**/*.scss',
  html: srcPath + '/**/*.html',
  images: srcPath + '/img/**/*.+(png|jpg|jpeg|gif|svg)',
  modules: [],
  static: [srcPath + '/fonts/**/*'],
}

// Remove Destination directory with all files
function clean() {
  return del(paths.dist + '**/*')
}

// Copy satic assets to destination directory
function copy() {
  return gulp
    .src(paths.static, { base: 'src' })
    .pipe(changed(paths.dist))
    .pipe(gulp.dest(paths.dist))
    .pipe(gulpif(!argv.prod, browserSync.stream()))
}

// Copy all *.html templates to destination directory
function html() {
  return gulp
    .src(paths.html, { base: 'src' })
    .pipe(changed(paths.dist))
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest(paths.dist))
    .pipe(gulpif(!argv.prod, browserSync.stream()))
}

// Compile App styles
function styles() {
  const plugins = [autoprefixer({ flexbox: 'no-2009' }), cssnano()]
  return gulp
    .src(paths.styles)
    .pipe(gulpif(!argv.prod, sourcemaps.init()))
    .pipe(sass({ includePaths: ['src/scss/'] }).on('error', sass.logError))
    .pipe(postcss(plugins))
    .pipe(rename('styles.css'))
    .pipe(gulpif(!argv.prod, sourcemaps.write('.')))
    .pipe(size({ showFiles: true }))
    .pipe(gulp.dest(paths.dist + 'css/'))
    .pipe(gulpif(!argv.prod, browserSync.stream()))
}

// Bundle App scripts
function scripts() {
  return gulp
    .src(paths.scripts)
    .pipe(cached('scripts'))
    .pipe(gulpif(!argv.prod, sourcemaps.init()))
    .pipe(wrap("(function(){\n'use strict';\n<%= contents %>})();"))
    .pipe(remember('scripts'))
    .pipe(concat('scripts.js'))
    .pipe(gulpif(argv.prod, uglify()))
    .pipe(gulpif(!argv.prod, sourcemaps.write('.')))
    .pipe(size({ showFiles: true }))
    .pipe(gulp.dest(paths.dist + 'js/'))
    .pipe(gulpif(!argv.prod, browserSync.stream()))
}

// Bundle App vendor dependencies
function vendor(cb) {
  if (paths.modules.length) {
    gulp
      .src(paths.modules.map(item => `node_modules/${item}`))
      .pipe(concat('vendor.js'))
      .pipe(gulpif(argv.prod, uglify()))
      .pipe(size({ showFiles: true }))
      .pipe(gulp.dest(paths.dist + 'js/'))
  }

  cb()
}

// Optimize and Copy images to destination directory
function images() {
  return gulp
    .src(paths.images)
    .pipe(changed(paths.dist))
    .pipe(
      cache(
        imagemin([
          imagemin.gifsicle({ interlaced: true }),
          imagemin.jpegtran({ progressive: true }),
          imagemin.optipng({ optimizationLevel: 5 }),
          imagemin.svgo({
            plugins: [{ cleanupIDs: true }],
          }),
        ])
      )
    )
    .pipe(gulp.dest(paths.dist + '/img'))
    .pipe(gulpif(!argv.prod, browserSync.stream()))
}

// Starts local dev server
function serve(cb) {
  browserSync.init({
    server: {
      files: ['/*.css', 'images/**/*.+(png|jpg|jpeg|gif|svg)'],
      baseDir: paths.dist,
    },
  })

  cb()
}

function reload(cb) {
  browserSync.reload()

  cb()
}

// Watch files on changes
function watchFiles(cb) {
  gulp.watch(paths.styles, styles)
  gulp.watch(paths.static, gulp.series(copy, reload))
  gulp.watch(paths.scripts, gulp.series(scripts, reload))
  gulp.watch(paths.images, gulp.series(images, reload))
  gulp.watch(paths.html, gulp.series(html, reload))

  cb()
}

gulp.task(
  'build',
  gulp.series(
    clean,
    gulp.parallel(copy, html, styles, images, scripts, vendor)
  ),
  cb => {
    cb()
  }
)

gulp.task(
  'default',
  gulp.series('build', watchFiles, serve, cb => {
    cb()
  })
)
