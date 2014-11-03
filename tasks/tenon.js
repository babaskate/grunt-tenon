/*
 * grunt-tenon
 * https://github.com/babaskate/grunt-tenon
 * Copyright (c) 2014 Andrew Babaian
 */

'use strict';

module.exports = function(grunt) {

    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks

    // Utilities
    //var _ = require('lodash');
    var curl = require('node-curl');
    var async = require('async');

    // Nodejs libs.
    //var path = require('path');

    // A special thanks to "Cowboy" Ben Alman without who's code this would not be possible
    // https://github.com/gruntjs/grunt-contrib-qunit/blob/master/tasks/qunit.js

    // Allow an error message to retain its color when split across multiple lines.
    var formatMessage = function(str) {
        return String(str).split('\n').map(function(s) { return s.magenta; }).join('\n');
    };

    // If options.force then log an error, otherwise exit with a warning
    var warnUnlessForced = function (message, options) {
        if (options && options.force) {
            grunt.log.error(message);
        } else {
            grunt.warn(message);
        }
    };

    // Keep track of failed assertions for pretty-printing.
    var failedAssertions = [];
    var logFailedAssertions = function() {
        var assertion;
        // Print each assertion error.
        while (assertion = failedAssertions.shift()) {
            grunt.verbose.or.error(assertion.testName);
            grunt.log.error('Message: ' + formatMessage(assertion.message));
            if (assertion.actual !== assertion.expected) {
                grunt.log.error('Actual: ' + formatMessage(assertion.actual));
                grunt.log.error('Expected: ' + formatMessage(assertion.expected));
            }
            if (assertion.source) {
                grunt.log.error(assertion.source.replace(/ {4}(at)/g, '  $1'));
            }
            grunt.log.writeln();
        }
    };

    function pad(msg,length) {
        while (msg.length < length) {
            msg = ' ' + msg;
        }
        return msg;
    }

    // http://james.padolsey.com/javascript/wordwrap-for-javascript/
    function wordwrap( str, width, brk, cut ) {
        brk = brk || '\n';
        width = width || 75;
        cut = cut || false;

        if (!str) { return str; }
        var regex = '.{1,' +width+ '}(\\s|$)' + (cut ? '|.{' +width+ '}|.+$' : '|\\S+?(\\s|$)');

        return str.match( new RegExp(regex, 'g') ).join( brk );
    }

    function htmlDecode(str) {
        return String(str)
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, '\'')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
    }

    // reutrn just the first line with no whitespace to the right
    function firstLine(str) {
        return String(str).split('\n')[0].trimRight();
    }

    // Default Grunt JSHint reporter
    function reporter(results) {
        // Dont report empty data as its an ignored file
        if (results.length < 1) {
            grunt.log.error('0 issues found.');
            return;
        }

        if (results.length === 0) {
            // Success!
            grunt.verbose.ok();
            return;
        }

        // var options = data[0].options;

        grunt.log.writeln();

        //var lastfile = null;

        // Iterate over all errors.
        results.forEach(function(result) {

            var e = result;

            // Sometimes there's no error object.
            if (!e) { return; }

            if (e) {
                // Manually increment errorcount since we're not using grunt.log.error().
                grunt.fail.errorcount++;

                // No idea why JSHint treats tabs as options.indent # characters wide, but it
                // does. See issue: https://github.com/jshint/jshint/issues/430
                // Replacing tabs with appropriate spaces (i.e. columns) ensures that
                // caret will line up correctly.
                var errorSnippet = e.errorSnippet.replace(/\t/g,grunt.util.repeat('\t',' '));
                errorSnippet = firstLine(errorSnippet);
                errorSnippet = htmlDecode(errorSnippet);
                errorSnippet = wordwrap(errorSnippet, 70, '\n         ');
                //AB: I don't know enought about the service to figure out why some data comes back without positio info. A string is output to prevent it from failing.
                grunt.log.writeln((pad(e.position ? e.position.line.toString() : 'no-position',7) + ' |') + errorSnippet.grey);
                // grunt.log.write(grunt.util.repeat(9,' ') + grunt.util.repeat(e.position.column -1,' ') + '^ ');
                grunt.log.write(grunt.util.repeat(9,' ') + ' ^ ');
                grunt.verbose.write('[' + e.signature + '] ');
                var resultTitle = wordwrap(e.resultTitle + ' (col:' + e.position.column + ')', 75, '\n         ');
                grunt.log.writeln(resultTitle);
                grunt.log.writeln();

            } else {
                // Generic "Whoops, too many errors" error.
                grunt.log.error(e.reason);
            }
        });

        grunt.log.writeln();
    }

    function fetchUrls(service, callback) {

        curl(service, function (err) {

            if (!err && this.status === 200 && callback) {
                callback(JSON.parse(this.body));
            } else {

                grunt.log.writeln('Problem fetching urls. ' + this.status + ' - ' + this.body);

                if (err) {
                    grunt.log.writeln(err);
                    grunt.log.error(err);
                }

                //callback without passing data
                callback();
            }

        });

    }

    function testUrls(urls, apiKey, done, timeout) {

        // Reset status.
        var responseStatus = {
            failed: 0,
            passed: 0,
            total: 0,
            duration: 0
        };

        // Process each filepath in-order.
        async.eachSeries(urls, function(url, next) {

            grunt.verbose.subhead('Testing:  ' + url.cyan + '\n').or.write('Testing:  ' + url.cyan + '\n');

            //Hit the tenon API
            curl(
                'http://www.tenon.io/api/',
                {
                    POSTFIELDS: 'url=' + url +
                    '&key=' + apiKey +
                    '&certainty=' + 80 +
                    '&level=' + 'A' +
                    '&priority=' + 40,
                    TIMEOUT_MS: timeout || 3000
                },
                function (err) {

                    if (this.status === 200 && !err) {

                        var results = JSON.parse(this.body),
                            issues,
                            errors,
                            warnings,
                            duration = 0;

                        if (results.status !== 200) {

                            grunt.log.error(results.message + "- " + results.code);
                            grunt.log.verbose.writeflags(results, "tenon error: ");

                        } else {

                            issues = results.resultSummary.issues.totalIssues;
                            errors = results.resultSummary.issues.totalErrors;
                            warnings = results.resultSummary.issues.totalWarnings;
                            duration = parseFloat(results.responseExecTime);

                            grunt.log.writeln();
                            grunt.log.writeln('warnings: ', warnings);
                            grunt.log.writeln('  errors: ', errors);
                            grunt.log.writeln('duration: ', duration);

                            reporter(results.resultSet);

                            if (errors >= 1) {
                                responseStatus.failed ++;
                            } else {
                                responseStatus.passed ++;
                            }

                            responseStatus.total ++;

                            responseStatus.duration = duration + responseStatus.duration;

                            var failed = responseStatus.failed,
                                total = responseStatus.total;

                            // Print assertion errors here, if verbose mode is disabled.
                            if (!grunt.option('verbose')) {
                                if (failed > 0) {
                                    grunt.log.writeln();
                                    logFailedAssertions();
                                } else if (total === 0) {
                                    warnUnlessForced('0/0 pages tested (' + duration.toFixed(2) + 'sec)');
                                } else {
                                    grunt.log.ok();
                                }
                            }

                        }

                        next();

                    } else {

                        var errPrefix = "curl error";

                        if (err) {
                            grunt.log.error(errPrefix + ": " + err);
                        } else {
                            grunt.log.error(errPrefix + ": " + this.status);
                            var response = {
                                code: this.code,
                                status: this.status,
                                body: this.body
                            };
                            grunt.verbose.writeflags(response, errPrefix);
                        }
//                        done();
                    }

                }
            );


        },
        // All tests have been run.
        function() {

            // Log results.
            if (responseStatus.failed > 0) {
                warnUnlessForced(responseStatus.failed + '/' + responseStatus.total +
                        ' pages failed (' + responseStatus.duration.toFixed(2) + 'sec)');
            } else if (responseStatus.total === 0) {
                warnUnlessForced('0/0 pages tested (' + responseStatus.duration.toFixed(2) + 'sec)');
            } else {
                grunt.verbose.writeln("--");
                grunt.log.ok(responseStatus.total + ' pages passed (' + responseStatus.duration.toFixed(2) + 'sec)');
            }

            // All done!
            done();
        });

    }

    grunt.registerMultiTask('tenon', 'Accessibility testing tool', function() {

        // Merge task-specific and/or target-specific options with these defaults.
        var options = this.options({
            // Default PhantomJS timeout.
            timeout: 3000,
            // Explicit non-file URLs to test.
            urls: [],
            force: false,
            // Do not use an HTTP base by default
            httpBase: false,
            //tenon API Key
            apiKey: false,
            //url service
            urlService: false
        }),
        urls,
        done = this.async(); // This task is asynchronous.

        // Combine any specified URLs with src files.
        if (options.httpBase) {

            //If URLs are explicitly referenced, use them still
            urls = options.urls;

            //any explict non-static content paths? if so, concat with the domain
            options.contentPaths.forEach(function (path) {
                urls.push(options.httpBase + (path.indexOf('/') === 0 ? '' : '/') + path);
            });

            //Then create URLs for the src files
            this.filesSrc.forEach(function(testFile) {
                urls.push(options.httpBase + '/' + testFile);
            });

        } else {
            // Combine any specified URLs with src files.
            urls = options.urls.concat(this.filesSrc);
        }

        //If the site has a service that returns URLs to pages, hit the service to fetch the urls and pass to tenon
        if (options.urlService) {

            var slash = "";
            if (options.urlService.indexOf("/") === 0) {
                slash = "/";
            }

            var service = options.httpBase + slash + options.urlService;

            fetchUrls(service, function(extraUrls) {

                //push the extra urls passed back from the service on the urls array
                if (extraUrls) {
                    extraUrls.urls.forEach(function(url) {
                        urls.push(options.httpBase + url.path + '.html');
                    });
                }

                //test each url against tennon
                testUrls(urls, options.apiKey, done, options.timeout);

            });

        } else {
            //test each url against tennon
            testUrls(urls, options.apiKey, done, options.timeout);

        }

    });

};
