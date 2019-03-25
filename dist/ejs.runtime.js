/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
(function($, w) {
  "use strict";
  
  // lib/ejs.js at Mon Mar 25 2019 21:57:33 GMT+0100 (CET)
/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
"use strict";





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
 * 
 */
var sanitizeRegex = /[&<>'\"]/g;
ejs.sanitize = function(str) {
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
 * Output serializer
 */
ejs.prototype.output = function() {
  var sanitize = [];
  var hook = null;
  var output = [];
  var offset = -1;
  var isPromise = true;
  return new Proxy(output, {
    get: function(obj, prop) {
      if (prop == 'output') {
        var result;
        if (offset == -1) {
          result = "";
        } else if (offset == 0) {
          result = output[0];
        } else {
          result = Promise.all(output).then(function(parts) {
            for(var i = 0, l = sanitize.length; i < l; i++) {
              var offset = sanitize[i];
              parts[offset] = ejs.sanitize(parts[offset] == null ? "": parts[offset]);
            }
            return parts.join('');
          });
        }
        if (hook) {
          if (offset > 0) {
            return result.then(function(result) {
              return hook(result);
            });
          }
          return hook(result);
        }
        return result;
      } else if (prop == "toString") {
        return this.get.bind(this, obj, "output");
      }
      return null;
    },
    set: function(obj, prop, data) {
      if (data == null) return true;
      if (prop == 'echo') {
        if (typeof data != "string" && typeof data.then != "function") {
          data = data.toString();
        }
        if (typeof data.then == "function") {
          isPromise = true;
          offset ++;
          output.push(data);
        } else if (isPromise) {
          output.push(data);
          isPromise = false;
          offset++;
        } else {
          output[offset] += data;
        }
      } else if (prop == "safe") {
        // safe mode
        if (typeof data != "string" && typeof data.then != "function") {
          data = data.toString();
        }
        if (typeof data.then === 'function') {
          isPromise = true;
          offset ++;
          sanitize.push(offset);
          output.push(data);
        } else if (isPromise) {
          output.push(ejs.sanitize(data));
          isPromise = false;
          offset++;
        } else {
          output[offset] += ejs.sanitize(data);
        }
      } else if (prop == "hook") {
        hook = data;
      } else {
        throw new Error("Undefined property " + prop);
      }
      return true;
    },
    toString: function() {
      return this.get(output, "output");
    }
  });
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
    args.contents = contents;
    return self.renderFile(
      self.resolveInclude(filename, from), 
      Object.assign({}, ctx, args || {})
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
    if (filename[0] == '/')  {
      filename = './' + filename.replace(/^\/*/, '');
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