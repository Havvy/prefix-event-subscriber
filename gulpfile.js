var gulp = require('gulp');
var sweetjs = require("gulp-sweetjs");
var sourcemaps = require('gulp-sourcemaps');

gulp.task('default', function() {
  console.log("Use the 'build' task.");
});

gulp.task("build", function () {
    gulp.src("test.sjs")
    .pipe(sourcemaps.init())
    .pipe(sweetjs({
        modules: ['sweet-bdd'],
        readableNames: true
    }))
    .pipe(sourcemaps.write('../sourcemaps/'))
    .pipe(gulp.dest('.'))
});