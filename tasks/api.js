(function () {

    'use strict';

    var api = module.exports = {},
        curl = require('node-curl'),
        async = require('async'),
        extend = require('extend'),
        reporter = require('./reporter'),
        grunt,
        responseStatus = {
            failed: 0,
            passed: 0,
            total: 0,
            duration: 0
        },
        errPrefix = "curl error";



    api.init = function (parentGrunt) {
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

    api.fetchUrls = function (service, callback) {

        curl(service, {}, function (err) {

            if (!err && this.status === 200 && callback) {
                callback(JSON.parse(this.body));
            } else {

//                grunt.log.writeln(this);
                grunt.log.writeln(service + '\n');
                grunt.log.error('Problem fetching urls. ' + this.status + ' ' + JSON.parse(this.body));

                if (err) {
                    grunt.log.writeln(err);
                    grunt.log.error(err);
                }

                //callback without passing data
                callback();
            }

        });

    };

    function writeOptParams(obj) {

        var str = "";

        str += obj.certainty ? '&certainty=' + obj.certainty : '';
        str += obj.fragment ? '&fragment=' + obj.fragment : '';
        str += obj.importance ? '&importance=' + obj.importance : '';
        str += obj.level ? '&level=' + obj.level : '';
        str += obj.priority ? '&priority=' + obj.priority : '';
        str += obj.ref ? '&ref=' + obj.ref : '';
        str += obj.store ? '&store=' + obj.store : '';
        str += obj.systemID ? '&systemID=' + obj.systemID : '';
        str += obj.projectID ? '&projectID=' + obj.projectID : '';
        str += obj.uaString ? '&uaString=' + obj.uaString : '';
        str += obj.viewPortHeight ? '&viewPortHeight=' + obj.viewPortHeight : '';
        str += obj.viewPortWidth ? '&viewPortWidth=' + obj.viewPortWidth : '';

        return str;
    }

    function tenonSuccess(obj, force) {

        var results = JSON.parse(obj.body),
            errors,
            duration = 0;

        //tenon status
        if (results.status !== 200) {

            grunt.log.error(results.message + "- " + results.code);
            grunt.log.verbose.writeflags(results, "tenon error: ");

        } else {

            errors = results.resultSummary.issues.totalErrors;
            duration = parseFloat(results.responseExecTime);

            reporter.logger(results, errors, duration);

            if (errors >= 1) {
                responseStatus.failed ++;
            } else {
                responseStatus.passed ++;
            }

            responseStatus.total ++;
            responseStatus.duration = duration + responseStatus.duration;

            // Print assertion errors here, if verbose mode is disabled.
            if (!grunt.option('verbose')) {
                if (responseStatus.failed > 0) {
                    grunt.log.writeln();
                    logFailedAssertions();
                } else if (responseStatus.total === 0) {
                    warnUnlessForced('0/0 pages tested (' + responseStatus.duration.toFixed(2) + 'sec)', force);
                } else {
                    grunt.log.ok();
                }
            }

        }

    }

    function tenonError (obj, err) {

        if (err) {
            grunt.log.error(errPrefix + ": " + err);
        } else {
            grunt.log.error(errPrefix + ": " + obj.status);
            var response = {
                code: obj.code,
                status: obj.status,
                body: obj.body
            };
            grunt.verbose.writeflags(response, errPrefix);
        }
    }

    //TODO: pass individual opts per URL
    //report added params passed as options
    //Add ability to filter specific tests?

    api.testUrls = function (urls, apiKey, done, timeout, force, tenonOpts) {

        // Process each filepath in-order.
        async.eachSeries(urls, function (urlArg, next) {

            var url = urlArg,
                options = tenonOpts;

            if (typeof url === "object") {
                url = urlArg.url;
                options = extend(tenonOpts, urlArg.apiOptions);
            }

            grunt.verbose.subhead('Testing:  ' + url.cyan + '\n').or.write('Testing:  ' + url.cyan + '\n');

            //Hit the tenon API
            curl(
                'http://tenon.io/api/',
                {
                    POSTFIELDS: 'url=' + url + '&key=' + apiKey + writeOptParams(options),
                    TIMEOUT_MS: timeout || 3000
                },
                function (err) {

                    var obj = this;

                    if (obj.status === 200 && !err) {

                        tenonSuccess(obj, force);
                        next();

                    } else {

                        tenonError(obj, err);
                        done(false);
                        next(errPrefix);
                    }

                }

            );

        },
        // All tests have been run.
        function (err) {

            if (err) {
                grunt.log.error("grunt tenon error iterating over URLs: " + err);
            }

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
//            done();
        });

    };

}());
