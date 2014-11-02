/*
 * tenon
 *
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>',
      ],
      options: {
        jshintrc: '.jshintrc',
      },
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp'],
    },

    // Configuration to be run (and then tested).
    tenon: {
        local: {
        /*
            src: [
                'somepathtoastaticfile/content.html'
            ],
            */
            options: {
                httpBase: "http://te-publish.ngrok.com",
                contentPaths: [
                    //'/content/te-dev/us/en/non-amd.html',
                    '/content/te-dev/usa/en/index.html'
                ]//,
//                urls: [
//                    'http://www.te.com/en/home.html'
//                ]
            },
        },
        mb: {
            options: {
                urls: [
                    'http://www.mbusa.com'
                ],
                urlService: false
            }
        },
        options: {
            apiKey: "5478f49618ac809e9801c66279e3e52a",
            timeout: 20000,
            urlService: "content/te-dev/usa/en/admin/testaccessibilty.json.html"
        }
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js'],
    },

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  // grunt.registerTask('test', ['clean', 'tenon', 'nodeunit']);
  grunt.registerTask('test', ['clean', 'tenon', 'nodeunit']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};
