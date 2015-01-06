// Karma configuration
// Generated on Fri Dec 05 2014 10:01:24 GMT+0100 (CET)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'expect'],


    // list of files / patterns to load in the browser
    files: [
      'node_modules/lodash/dist/lodash.js',
      'src/*.js',
      'test/*.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'src/*.js': 'coverage'
    },

    coverageReporter: {
      dir: 'coverage',
      reporters: [
        {type: 'html', subdir: 'report-html'}
      ]
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['mocha', 'coverage'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher

    browsers: ['Chrome', 'Firefox', 'Safari', 'IE6 - WinXP', 'IE11 - Win7'],
    //browsers: ['Chrome'],

    transports: ['jsonp-polling'], // IE6
    //hostname: require("os").hostname(), // WebDriver

    customLaunchers: {
      IE6_wd: IE_wd(6),
      IE7_wd: IE_wd(7),
      IE8_wd: IE_wd(8),
      IE9_wd: IE_wd(9),
      IE10_wd: IE_wd(10),
      IE11_wd: IE_wd(11)
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};

function IE_wd(version) {
  return {
    base: 'WebDriver',
    config: {
      hostname: '', // arp -a | grep 'vmnet' | cut -d '(' -f2 | cut -d ')' -f1 | grep -vE '\.(1|255)$'
      port: 4444
    },
    browserName: 'IE_wd' + version,
    'x-ua-compatible': 'IE=EmulateIE' + version
  }
}