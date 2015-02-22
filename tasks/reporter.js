(function () {

    'use strict';

    var reporter = module.exports = {},
        grunt;

    reporter.init = function (parentGrunt) {
        grunt = parentGrunt;
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
    reporter.logger = function (results) {
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
                //AB: I don't know enought about the service to figure out why some data comes back without position info. A string is output to prevent it from failing.
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
    };

}());
