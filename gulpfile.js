/*
 * Copyright (c) 2015, Joel Richard
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

var gulp = require('gulp');
var plumber = require('gulp-plumber');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var jshint = require('gulp-jshint');

gulp.task('default', function () {

    gulp.src(['./src/vdom.js'])
        .pipe(plumber())
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(concat('cito.js'))
        .pipe(gulp.dest('./dist'))
        .pipe(rename('cito.min.js'))
        .pipe(uglify({compress: {}}))
        .pipe(gulp.dest('./dist'))
        .on('error', function (error) {
            console.error('' + error);
        });

    // TODO make compatible with closure compiler
    /*
    var closureCompiler = require('gulp-closure-compiler');
        .pipe(closureCompiler({
            compilerPath: 'node_modules/closure-compiler/lib/vendor/compiler.jar',
            fileName: 'cito.min-advanced.js',
            compilerFlags: {
                compilation_level: 'ADVANCED_OPTIMIZATIONS',
                language_in: "ECMASCRIPT5"
            }
        }))
        .pipe(gulp.dest('./dist'));
    */

});

gulp.task('watch', function() {
    gulp.start('default');
    gulp.watch('src/**', ['default']);
});
