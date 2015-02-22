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

                if (hb.slice(-1) === "/") {
                    hb = hb.substring(0,hb.length - 1);
                }

                url = hb + slash + u;

            }

            return url;
        },

        testUrls: function (uarels, httpBase) {

            var i = 0,
                urls = uarels || [],
                len = urls.length,
                fixedUrls = [];

            for (; i < len; i++) {

                if (typeof urls[i] === "string") {
                    if (this.formatUrl(urls[i], httpBase)) {
                        fixedUrls.push(this.formatUrl(urls[i], httpBase));
                    }
                } else {
                    if (this.formatUrl(urls[i].url, httpBase)) {
                        urls[i].url = this.formatUrl(urls[i].url, httpBase);
                        fixedUrls.push(urls[i]);
                    }
                }
            }

            return fixedUrls;
        }
    };

    module.exports = utils;

}());
