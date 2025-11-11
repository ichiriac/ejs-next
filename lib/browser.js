/**
 * Copyright (C) 2025 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs-next/graphs/contributors
 * @url https://ejs.js.org
 */
(function ($, w) {
  "use strict";

  // @body

  // global definition (window.ejs)
  if (w) {
    w["ejs"] = ejs;
  }
  // amd definition (define(['ejs'], function() ...))
  if (typeof define === "function" && define.amd) {
    define("ejs", ejs);
  }
  // define the jquery helper
  if ($ && $.fn) {
    $.fn.extend({
      ejs: function (data, options) {
        var opt = $.fn.ejs.options;
        if (options) {
          opt = $.extend(true, opt, options);
        }
        var ejs = new ejs(opt);
        return this.each(function () {
          var tpl = $(this).html();
          ejs
            .compile(tpl)(data)
            .then(
              function (str) {
                $(this).html(str);
              }.bind(this)
            )
            .catch(function (err) {
              $(this).html(
                '<pre class="ejs-error">' + err.toString() + "</pre>"
              );
            });
        });
      },
    });
    // default options
    $.fn.ejs.options = {};
  }
})(jQuery, window);
