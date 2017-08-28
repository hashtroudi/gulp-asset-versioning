var gulp = require('gulp');
var assetRev = require('./index.js');

gulp.task('css',function() {
    gulp.src("./test/styles/test.css")
        .pipe(assetVersion())
        .pipe(gulp.dest('./dest/styles'));
});

gulp.task('html',function() {
    gulp.src("./test/test.html")
        .pipe(assetVersion())
        .pipe(gulp.dest('./dest'));
});
