var gulp              = require('gulp'),
    $                   = require('gulp-load-plugins')(),

// Non gulp specific plugins.
    browserSync         = require('browser-sync').create(),
    del                 = require('del'),
    runSequence         = require('run-sequence');

/**
 * @task reload-and-clear
 * Do sass and reload tasks in sequence.
 */

gulp.task('reload-and-clear', function () {
    runSequence('clearcache',
        'reload');
});

gulp.task('reload-and-clear-cached', function () {
    if (config.caches_disabled) {
        runSequence('reload');
    }
    else {
        runSequence('clearcache', 'reload');
    }
});

gulp.task('sass-compile', function () {
    return gulp.src('sass/**/*.s+(a|c)ss') // Gets all files ending
        .pipe($.sassLint())
        .pipe($.sassLint.format())
        .pipe($.sassLint.failOnError())
        .pipe($.sourcemaps.init())
        .pipe($.sass())
        .on('error', function (err) {
            console.log(err);
            this.emit('end');
        })
        .pipe($.autoprefixer({
            browsers: ['ie 8-9', 'last 2 versions']
        }))
        .pipe($.sourcemaps.write('maps'))
        .pipe(gulp.dest('css'))
        .pipe(browserSync.stream());
});

/**
 * @task js
 * Do javascript stuff.
 */
gulp.task('js', function () {
    return gulp.src(['js/**/*.js', '!js/lib/*.js'])
        .pipe($.jshint())
        .pipe($.jshint.reporter('default'))
        .pipe($.jshint.reporter('fail'))
        .pipe($.uglify());
});

/**
 * @task clean
 * Clean the dist folder.
 */
gulp.task('clean', function () {
    return del(['css/*', '!css/maps']);
});

/**
 * @task reload
 * Refresh the page after clearing cache.
 */
gulp.task('reload', function () {
    if (config.enable_bs) {
        browserSync.reload();
    }
});

/**
 * @task watch
 * Watch files and do stuff.
 */
gulp.task('watch', ['clean', 'sass-compile', 'js'], function () {
    gulp.watch('sass/**/*.+(scss|sass)', ['sass-compile']);
    gulp.watch('js/**/*.js', ['js'], ['reload-and-clear']);

    // Watch php, inc, twig, theme and yml file changes to run drush task and reload page.
    gulp.watch('**/*.{php,inc,twig,yml,theme}', ['reload-and-clear-cached']);
});

/**
 * @task clearcache
 * Run drush to clear the theme registry.
 */
gulp.task('clearcache', $.shell.task([
    'drush cr'
]));

/**
 * @task browser-sync
 * Launch the server.
 */
gulp.task('browser-sync', ['sass-compile', 'js'], function () {
    if (config.enable_bs) {
        browserSync.init({
            proxy: config.localhost,
            open: false,
            socket: {
                domain: 'localhost:3000'
            }
        });
    }
});

/**
 * @task load-config
 * Load the local configuration.
 */
gulp.task('load-config', function() {
    try {
        console.log('Loading config.json. Change the values in gulp.config.json to suit your needs.');
        config = require('./gulp.config.json');
    } catch (error) {
        console.log('No local config.json found. Using the defaults.');
        console.log('Debug info: ' + error.code + ' => ' + error);
    }
});

/**
 * @task default
 * Watch files and do stuff.
 */
gulp.task('default', ['load-config', 'browser-sync', 'watch']);