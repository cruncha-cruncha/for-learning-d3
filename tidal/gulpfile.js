let fileinclude = require("gulp-file-include"),
  gulp = require("gulp");

gulp.task("build-js", function() {
  return gulp
    .src(["all_together.js"])
    .pipe(
      fileinclude({
        prefix: "@@",
        basepath: "@file"
      })
    )
    .pipe(gulp.dest("./build/"));
});

gulp.task("default", gulp.series("build-js"));
