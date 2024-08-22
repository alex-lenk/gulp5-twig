'use strict';

import gulp from 'gulp';
import data from 'gulp-data';
import twig from 'gulp5-twig';

export function compile() {
    return gulp.src('./index.twig')
        .pipe(twig({
            data: {
                title: 'Gulp and Twig',
                benefits: [
                    'Fast',
                    'Flexible',
                    'Secure'
                ]
            }
        }))
        .pipe(gulp.dest('./'));
}

export function dataExample() {
    return gulp.src('./index-json.twig')
        .pipe(data(function() {
            return require('./example/index-data.json');
        }))
        .pipe(twig())
        .pipe(gulp.dest('./'));
}

export default gulp.series(compile, dataExample);
