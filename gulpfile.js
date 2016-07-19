/**
 * Weather Widget Frontend files: ASSET PIPELINE
 */
/**
 * require all necessary gulp plugins and additional helper libraries
 */
const gulp        = require('gulp');
const $           = require('gulp-load-plugins')({ camelCase: true, lazy: true });
var help          = require('gulp-help-docs');
const wiredep     = require('wiredep').stream;
const del         = require('del');
const runSequence = require('run-sequence');

// Config variable can be empty or come with predefined docs
var helpConfig = require('./package.json')['helpDocs'] || {};

// postCSS processors
const cssnano      = require('cssnano');
const autoprefixer = require('autoprefixer');

// ------------------------------------------------------------------------------------
/* ------------------------------------ *
 * Pipeline configuration
 * ------------------------------------ */
/**
 * paths configuration used throughout the build process
 * @type {Object}
 */
const paths = {
  src: {
    root: './src',
    index: './src/index.html',
    styles: './src/sass/app.scss',
    images: './src/images/**/*',
    videos: './src/videos/**/*'
  },
  dist: {
    root: './dist',
    styles: './dist/styles',
    scripts: './dist/scripts',
    images: './dist/images',
    videos: './dist/videos'
  }
};

/**
 * postCSS preprocessors for optimizing CSS compiled files
 * @type {Array}
 */
const preprocessors = [
  autoprefixer({ browsers: ['last 3 versions'] }),
  cssnano()
];

/**
 * configure wiredep to fetch the correct information from bower
 * @type {Object}
 */
const wiredepConfig = {
  bowerJson: require('./bower.json')
};

// ------------------------------------------------------------------------------------
/* ------------------------------------ *
 * Assets Tasks
 * ------------------------------------ */

/**
 * compile SASS sources to a minified and concatenated CSS file.
 * export additional sourcemaps for development
 */
gulp.task('styles', () => {
  return gulp.src(paths.src.styles)
    .pipe($.sass())
    .pipe($.sourcemaps.init())
    .pipe($.postcss(preprocessors))
    .pipe($.rename({ extname: '.min.css' }))
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest(paths.dist.styles))
    .pipe($.connect.reload());
});

/**
 * wire up script dependencies and build script files based
 * on useref configuration defined in the main index file.
 *
 * Additionally, minify the HTML output
 */
gulp.task('inject', () => {
  return gulp.src(paths.src.index)
  .pipe(wiredep(wiredepConfig))
  .pipe($.useref())
  .pipe($.if('*.js', $.uglify()))
  .pipe($.if('*.css', $.postcss(preprocessors)))
  .pipe($.if('*.html', $.htmlmin({collapseWhitespace: true})))
  .pipe(gulp.dest(paths.dist.root))
  .pipe($.connect.reload());
});

/**
 * copy and optimize images in the project
 */
gulp.task('assets:images', () => {
  return gulp.src(paths.src.images)
    .pipe(gulp.dest(paths.dist.images))
    .pipe($.connect.reload());
});

/**
 * copy and optimize media files for web: video sources
 */
gulp.task('assets:videos', () => {
  return gulp.src(paths.src.videos)
    .pipe(gulp.dest(paths.dist.videos))
    .pipe($.connect.reload());
});

// ------------------------------------------------------------------------------------
/* ------------------------------------ *
 * Helper Tasks
 * ------------------------------------ */
/**
 * clean up the build destination directory by deleting it
 */
gulp.task('clean:dist', () => {
  return del(paths.dist.root);
});

/**
 * open a development server at localhost:8080
 * with live reload enabled
 */
gulp.task('connect', () => {
  return $.connect.server({
    root: paths.dist.root,
    livereload: true
  });
});

// ------------------------------------------------------------------------------------
/**
 * Watch tasks used in development for automatic re-compilation
 */
gulp.task('watch', () => {
  gulp.watch('./src/sass/**/*.scss', ['styles']);
  gulp.watch('./src/index.html', ['inject']);
  gulp.watch('./src/js/**/*.js', ['inject']);
  gulp.watch('./src/images/*', ['assets:images']);
  gulp.watch('./src/videos/*', ['assets:videos']);
});

// ------------------------------------------------------------------------------------
/* ------------------------------------ *
 * main Tasks
 * ------------------------------------ */

/**
 * build the project into their final HTML/CSS/ JS forms
 */
gulp.task('build', (done) => {
  runSequence('clean:dist', [
    'styles',
    'inject',
    'assets:images',
    'assets:videos'
  ], done);
});

/**
 * Default task
 * build the project, start a development server in the build directory
 * with live reload enabled and add watchers to the source files
 * to reload the development server
 */
gulp.task('default', (done) => runSequence('build', ['connect', 'watch'], done));
