(function () {

    'use strict';

    var service = module.exports = {},
        curl = require('node-curl'),
        async = require('async'),
        reporter = require('./reporter'),
        grunt;

    service.init = function (parentGrunt) {
        grunt = parentGrunt;
        reporter.init(grunt);
    };


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

    service.fetchUrls = function (service, callback) {

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

    };

    service.testUrls = function (urls, apiKey, done, timeout, force, tenonOpts) {

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
                    '&certainty=' + (tenonOpts.certainty || 80) +
                    '&level=' + (tenonOpts.level || 'A') +
                    '&priority=' + (tenonOpts.priority || 40),
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

                            reporter.logger(results.resultSet);

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
                                    warnUnlessForced('0/0 pages tested (' + duration.toFixed(2) + 'sec)', force);
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
                        ' pages failed (' + responseStatus.duration.toFixed(2) + 'sec)', force);
            } else if (responseStatus.total === 0) {
                warnUnlessForced('0/0 pages tested (' + responseStatus.duration.toFixed(2) + 'sec)', force);
            } else {
                grunt.verbose.writeln("--");
                grunt.log.ok(responseStatus.total + ' pages passed (' + responseStatus.duration.toFixed(2) + 'sec)', force);
            }

            // All done!
            done();
        });

    };

}());
