(function () {

    "use strict";

    var utils = {

        formatUrl: function (u, httpBase) {

            var url;

            if (u.indexOf("http") === 0) {
                url = u;
            } else if (httpBase) {

                var slash = "/",
                    hb = httpBase;

                if (u.indexOf("/") === 0) {
                    u = u.substring(1, u.length);
                }

//                console.log("url = " + u);

                if (hb.slice(-1) === "/") {
                    hb = hb.substring(0,hb.length - 1);
                }

//                console.log("httpBase = " + hb);

                url = hb + slash + u;

            }

//            console.log(url);

            return url;
        },

        testUrls: function (uarels, httpBase) {

            var i = 0,
                urls = uarels || [],
                len = urls.length,
                fixedUrls = [];

            for (; i < len; i++) {
                if (this.formatUrl(urls[i], httpBase)) {
                    fixedUrls.push(this.formatUrl(urls[i], httpBase));
                }
            }

//            console.dir(fixedUrls);

            return fixedUrls;
        }
    };

    module.exports = utils;

}());
