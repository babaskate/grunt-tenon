/*
 * grunt-tenon
 * https://github.com/babaskate/grunt-tenon
 * Copyright (c) 2015 Andrew Babaian
 */

'use strict';

module.exports = function (grunt) {

    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks

    // A special thanks to "Cowboy" Ben Alman without who's code this would not be possible
    // https://github.com/gruntjs/grunt-contrib-qunit/blob/master/tasks/qunit.js

    var srvc = require('./service'),
        utils = require('./utils');

    srvc.init(grunt);

    grunt.registerMultiTask('tenon', 'Accessibility testing tool', function () {

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
            urlService: false,
            //tenon options
            apiOptions: {}
        }),
        urls = [],
        done = this.async(); // This task is asynchronous.

        if (this.data.urls) {
            urls = urls.concat(this.data.urls);
        }

        if (this.data.src) {
            urls = urls.concat(this.data.src);
        }

        if (options.urls) {
            urls = urls.concat(options.urls);
        }

        if (options.contentPaths) {
            urls = urls.concat(options.contentPaths);
        }

        //If the site has a service that returns URLs to pages, hit the service to fetch the urls and pass to tenon
        if (options.urlService) {

            var service = utils.formatUrl(options.urlService, options.httpBase);

//            console.log("service = " + service);

            if (service) {

                srvc.fetchUrls(service, function(extraUrls) {

                    //push the extra urls passed back from the service on the urls array
                    if (extraUrls) {
                        extraUrls.urls.forEach(function(url) {
                            urls.push(url.path + '.html');
                        });
                    }

                    urls = utils.testUrls(urls, options.httpBase);

                    //test each url against tennon
                    if (urls.length > 0) {
                        srvc.testUrls(urls, options.apiKey, done, options.timeout, options.force, options.apiOptions);
                    }

                });

            } else {
                grunt.log.error("grunt tenon error: If custom service is not a fully qualified path, you must use the httpBase option");
            }

        } else {
            //test each url against tennon
            urls = utils.testUrls(urls, options.httpBase);
            if (urls.length > 0) {
                srvc.testUrls(urls, options.apiKey, done, options.timeout, options.force, options.apiOptions);
            }

        }

    });

};
