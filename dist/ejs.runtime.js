/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
(function($, w) {
  "use strict";
  
  // lib/output.js at Mon Apr 01 2019 23:50:21 GMT+0200 (CEST)
/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
"use strict";

/**
 * Output handler
 */
var output = function() {
  this.hook = null;
  this.output = [];
  this.offset = -1;
  this.sanitize = [];
  this.isPromise = true;
};

/**
 * Sanitize the string
 */
var sanitizeRegex = /[&<>'\"]/g;
output.sanitize = function(str) {
  if (typeof str != "string") str = str.toString();
  return str.replace(sanitizeRegex, function(c) {
    if (c == '&') return '&amp;';
    if (c == '<') return '&lt;';
    if (c == '>') return '&gt;';
    if (c == '"') return '&#34;';
    if (c == "'") return '&#39;';
    return c;
  });
};

/**
 * Outputs a string
 */
output.prototype.write = function(msg) {
  if (msg == null) return;
  var isString = typeof msg == "string";
  if (!isString && typeof msg.then != "function") {
    msg = msg.toString();
    isString = true;
  }
  if (isString) {
    if (this.isPromise) {
      this.output.push(msg);
      this.isPromise = false;
      this.offset++;
    } else {
      this.output[this.offset] += msg;
    }
  } else {
    this.isPromise = true;
    this.offset ++;
    this.output.push(msg);
  }
};

/**
 * safe mode
 */ 
output.prototype.safe_write = function(msg) {
  if (msg == null) return;
  var isString = typeof msg == "string";
  if (!isString && typeof msg.then != "function") {
    msg = msg.toString();
    isString = true;
  }
  if (isString) {
    if (this.isPromise) {
      this.output.push(output.sanitize(msg));
      this.isPromise = false;
      this.offset++;
    } else {
      this.output[this.offset] += output.sanitize(msg);
    }  
  } else {
    this.isPromise = true;
    this.offset ++;
    this.sanitize.push(this.offset);
    this.output.push(msg);
  }
};

/**
 * Renders the output
 */
output.prototype.toString = function() {
  var result;
  if (this.offset == -1) {
    result = "";
  } else if (this.offset == 0) {
    result = this.output[0];
  } else {
    result = Promise.all(this.output).then(function(parts) {
      for(var i = 0, l = this.sanitize.length; i < l; i++) {
        var offset = this.sanitize[i];
        parts[offset] = output.sanitize(parts[offset] == null ? "": parts[offset]);
      }
      return parts.join('');
    }.bind(this));
  }
  if (this.hook) {
    if (result.then) {
      return result.then(function(result) {
        return this.hook(result);
      }.bind(this));
    }
    result = this.hook(result);
  }
  return result;  
};

// lib/ejs.js at Mon Apr 01 2019 23:50:21 GMT+0200 (CEST)
/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */






/**
 * Layer engine constructor
 */
var ejs = function(opts) {
  if (!opts) opts = {};
  this.options = {
    strict: opts.strict || false,
    localsName: opts.localsName || 'locals',
    root: opts.root || '/'
  };
};

/**
 * Compiles a buffer
 * @return Function(any): Promise<string>
 */
ejs.prototype.compile = function(buffer, filename)  {
  var code = transpile(new lexer(), buffer, this.options, filename || "eval");
  try {
    return new Function('ejs,' + this.options.localsName, code).bind(null, this);
  } catch(e) {
    var line = e.lineNumber ? e.lineNumber - 6 : 1;
    var se = new SyntaxError(e.message, filename, line);
    se.stack = e.message + "\n    at " + filename + ":" + line + "\n" + se.stack.split(/\n/g).slice(4).join("\n");
    throw se;
  }
};

/**
 * shortcut to ejs.prototype.compile
 * @return Function(any): Promise<string>
 */
ejs.compile = function(str, options) {
  var instance = new ejs(options);
  return instance.compile(str);
};

/**
 * Renders the specified template using the specified data
 * @return Promise<string>
 */
ejs.prototype.render = function(str, data) {
  var result = this.compile(str)(data);
  if (typeof result.then == "function") {
    return result;
  }
  return Promise.resolve(result);
};

/**
 * Output serializer
 */
ejs.prototype.output = function() {
  return new output();
};

/**
 * Shortcut to ejs.prototype.render
 * @return Promise<string> | <string>
 */
ejs.render = function(str, data, options) {
  var instance = new ejs(options);
  return instance.render(str, data);
};

/**
 * Include a file
 */
ejs.prototype.include = function(ctx, from, filename, args) {
  return this.renderFile(
    this.resolveInclude(filename, from), 
    Object.assign(ctx, args || {})
  );
};

/**
 * Registers a layout output
 */
ejs.prototype.layout = function(ctx, from, output, filename, args) {
  var self = this;
  output.hook = function(contents) {
    args = Object.assign({}, ctx, args || {});
    args.contents = contents;
    return self.renderFile(
      self.resolveInclude(filename, from), 
      args      
    );
  };
  return null;
};

/**
 * Registers blocks
 */
ejs.prototype.block = function(ctx, name, value) {
  if (!name) return null;
  if (!ctx[name]) {
    ctx[name] = this.output();
  }
  if (arguments.length == 3) {
    ctx[name].echo = typeof value == "function" ? value() : value;
    return value;
  }
  return ctx[name].output;
};

/**
 * Resolves a path
 */
ejs.prototype.resolveInclude = function(filename, from, isDir) {
  if (!from || from == 'eval') {
    from = this.options.root;
    isDir = true;
  }
  if (filename[0] == '/')  {
    filename = './' + filename.replace(/^\/*/, '');
    from = this.options.root;
    isDir = true;
  }  
  return ejs.resolveInclude(filename, from, isDir);
};

/**
 * Resolves a path
 */
ejs.resolveInclude = function(filename, from, isDir) {
  if (from) {
    if (!isDir) {
      from = path.dirname(from);
    }
    filename = path.resolve(from, filename);
  }
  if (!path.extname(filename)) {
    filename += '.ejs';
  }
  return filename;
};

/**
 * Renders the specified template using the specified data
 * @return Promise<string>
 */
ejs.prototype.renderFile = function(filename, data) {
  var self = this;
  return new Promise(function(resolve, reject) {
    if (filename.substring(0, self.options.root.length) != self.options.root) {
      filename = ejs.resolveInclude(filename, self.options.root, true);
    }
    fs.readFile(filename, function(err, str) {
      if (err) {
        return reject(err);
      }
      try {
        var fn = self.compile(str.toString(), filename);
        var result = fn(data);
        if (result && typeof result.then == "function") {
          result.then(resolve).catch(reject);
        } else {
          resolve(result);
        }
      } catch(e) {
        return reject(e);
      }
    });
  });
};

/**
 * Shortcut to ejs.prototype.renderFile
 * @return Promise<string>
 */
ejs.renderFile = function(filename, data, options) {
  var instance = new ejs(options);
  return instance.renderFile(filename, data);
};

/**
 * Express.js support.
 *
 * This is an alias for {@link module:ejs.renderFile}, in order to support
 * Express.js out-of-the-box.
 *
 * @func
 */
ejs.__express = ejs.renderFile;

/**
 * Expose it as a global for standalone (serialized ?) functions
 */
if (typeof window !== 'undefined') {
  window.ejs = ejs;
} else if (typeof global !== 'undefined') {
  global.ejs = ejs;
}



  // global definition (window.ejs)
  if (w) {
    w['ejs'] = ejs;
  }
  // amd definition (define(['ejs'], function() ...))
  if(typeof define === 'function' && define.amd) {
    define('ejs', ejs);
  }
  // define the jquery helper
  if ($ && $.fn) {
    $.fn.extend({
      ejs: function(data, options) {
        var opt = $.fn.ejs.options;
        if (options) {
          opt = $.extend(true, opt, options);
        }
        var ejs = new ejs(opt);
        return this.each(function() {
          var tpl = $(this).html();
          ejs.compile(tpl)(data).then(function(str) {
            $(this).html(str);
          }.bind(this)).catch(function(err) {
            $(this).html(
              '<pre class="ejs-error">' + err.toString() + '</pre>'
            );
          });
        });
      }
    });
    // default options
    $.fn.ejs.options = {};
  }
})(jQuery, window);