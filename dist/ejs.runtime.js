/**
 * Copyright (C) 2022 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
(function ($, w) {
  "use strict";

  // lib/output.js at Tue Nov 11 2025 11:29:44 GMT+0000 (Coordinated Universal Time)
/**
 * Copyright (C) 2022 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */


/**
 * Output handler
 */
var output = function () {
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
output.sanitize = function (str) {
  if (typeof str != "string") str = str.toString();
  return str.replace(sanitizeRegex, function (c) {
    if (c == "&") return "&amp;";
    if (c == "<") return "&lt;";
    if (c == ">") return "&gt;";
    if (c == '"') return "&#34;";
    if (c == "'") return "&#39;";
    return c;
  });
};

output.prototype.buffer = function (msg) {
  /**
   * Buffers current state
   */
  var hook = this.hook;
  var output = this.output;
  var offset = this.offset;
  var sanitize = this.sanitize;
  var isPromise = this.isPromise;

  /**
   * Re-initialize buffers
   */
  this.hook = null;
  this.output = [];
  this.offset = -1;
  this.sanitize = [];
  this.isPromise = true;

  /**
   * Flush contents
   */
  return function () {
    var result = this.toString();
    this.hook = hook;
    this.output = output;
    this.offset = offset;
    this.sanitize = sanitize;
    this.isPromise = isPromise;
    return result;
  }.bind(this);
};

/**
 * Outputs a string
 */
output.prototype.write = function (msg) {
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
    this.offset++;
    this.output.push(msg);
  }
};

/**
 * safe mode
 */
output.prototype.safe_write = function (msg) {
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
    this.offset++;
    this.sanitize.push(this.offset);
    this.output.push(msg);
  }
};

/**
 * Renders the output
 */
output.prototype.toString = function () {
  var result;
  if (this.offset == -1) {
    result = "";
  } else if (this.offset == 0) {
    result = this.output[0];
  } else {
    result = Promise.all(this.output).then(
      function (parts) {
        for (var i = 0, l = this.sanitize.length; i < l; i++) {
          var offset = this.sanitize[i];
          parts[offset] = output.sanitize(
            parts[offset] == null ? "" : parts[offset]
          );
        }
        return parts.join("");
      }.bind(this)
    );
  }
  if (this.hook) {
    if (result.then) {
      return result.then(
        function (result) {
          return this.hook(result);
        }.bind(this)
      );
    }
    result = this.hook(result);
  }
  return result;
};


// lib/ejs.js at Tue Nov 11 2025 11:29:44 GMT+0000 (Coordinated Universal Time)
/**
 * Copyright (C) 2022 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */







/**
 * Layer engine constructor
 */
var ejs = function (opts) {
  if (!opts) opts = {};
  this.options = {
    cache: opts.hasOwnProperty("cache") ? opts.cache : ejs.cache,
    strict: opts.hasOwnProperty("strict") ? opts.strict : ejs.strict,
    profile: opts.hasOwnProperty("profile") ? opts.profile : ejs.profile,
    localsName: opts.localsName || "locals",
    delimiter: opts.delimiter || ejs.delimiter,
    root: opts.root || ejs.root,
  };
  this._session = {};
};

ejs.dirname = 'views';

ejs.root = "/";

ejs.cache = false;

ejs.strict = false;

ejs.profile = false;

ejs.sourcemap = false;

ejs.delimiter = "%";

/**
 * List of cached items
 * @see options.cache = true
 */
ejs.__cache = {};

/**
 * List of registered helpers
 * @see ejs.registerFunction
 */
ejs.__fn = {};

/**
 * Compiles a buffer
 * @return Function(any): Promise<string>
 */
ejs.prototype.compile = function (buffer, filename) {
  if (this.options.cache && ejs.__cache.hasOwnProperty(buffer)) {
    return ejs.__cache[buffer];
  }
  var io = new lexer(this.options.delimiter);
  io.input(buffer);
  var out = new transpile(io, this.options, filename || "eval");
  var code = out.toString();
  try {
    const AsyncFunction = async function () { }.constructor;
    var fn = new AsyncFunction("ejs", this.options.localsName, code).bind(
      null,
      this
    );
    if (this.options.cache) {
      ejs.__cache[buffer] = fn;
    }
    return fn;
  } catch (e) {
    var line = e.lineNumber ? e.lineNumber - 6 : 1;
    var se = new SyntaxError(e.message, filename, line);
    console.log("Bad code : " + code);
    se.stack =
      e.message +
      "\n    at " +
      filename +
      ":" +
      line +
      "\n" +
      se.stack.split(/\n/g).slice(4).join("\n");
    throw se;
  }
};

/**
 * shortcut to ejs.prototype.compile
 * @return Function(any): Promise<string>
 */
ejs.compile = function (str, options) {
  var instance = new ejs(options);
  return instance.compile(str);
};

ejs.prototype.prepareContext = function (data) {
  return data;
};

/**
 * Renders the specified template using the specified data
 * @return Promise<string>
 */
ejs.prototype.render = function (str, data) {
  var result = this.compile(str)(this.prepareContext(data));
  if (typeof result.then == "function") {
    return result;
  }
  return Promise.resolve(result);
};

/**
 * Output serializer
 */
ejs.prototype.output = function () {
  return new output();
};

/**
 * Shortcut to ejs.prototype.render
 * @return Promise<string> | <string>
 */
ejs.render = function (str, data, options) {
  var instance = new ejs(options);
  return instance.render(str, data);
};

/**
 * Include a file
 */
ejs.prototype.include = function (ctx, from, filename, args) {
  if (typeof args == "function") {
    args = { contents: args() };
  }
  if (typeof args == "string") {
    args = { contents: args };
  }
  return this.renderFile(
    this.resolveInclude(filename, from),
    Object.assign({}, ctx, args || {})
  );
};

/**
 * Registers a layout output
 */
ejs.prototype.layout = function (ctx, from, output, filename, args) {
  var self = this;
  output.hook = function (contents) {
    args = Object.assign({}, ctx, args || {});
    args.contents = contents;
    return self.renderFile(self.resolveInclude(filename, from), args);
  };
  return null;
};

/**
 * Registers blocks
 */
ejs.prototype.block = function (ctx, name, value) {
  if (!name) return null;
  if (!this._session[name]) {
    this._session[name] = this.output();
  }
  if (arguments.length == 3) {
    if (typeof value == "function") {
      // @fixme : not safe - not immutable, should use ctx instead
      var output = this._output.buffer();
      value();
      value = output();
    }
    this._session[name].write(value);
    return this._session[name];
  }
  return this._session[name].toString();
};

/**
 * Resolves a path
 */
ejs.prototype.resolveInclude = function (filename, from, isDir) {
  if (!from || from == "eval") {
    from = Array.isArray(this.options.root) ? this.options.root[0] : this.options.root;
    isDir = true;
  }

  if (filename[0] == "/" && !path.isAbsolute(filename)) {
    filename = "./" + filename.replace(/^\/*/, "");
    from = Array.isArray(this.options.root) ? this.options.root[0] : this.options.root;
    isDir = true;
  }
  return ejs.resolveInclude(filename, from, isDir, this.options.root);
};

/**
 * Resolves a path
 */
ejs.resolveInclude = function (filename, from, isDir, folders) {
  if (from) {
    if (!isDir) {
      from = path.dirname(from);
    }
    filename = path.resolve(from, filename)
  }

  if (!path.extname(filename)) {
    filename += ".ejs";
  }
  if (folders && Array.isArray(folders)) {
    try {
      return ejs.selectFirstPathMatch(filename, folders);
    } catch (e) {
      throw e;
    }
  } else {
    return filename;
  }

};

/**
 * Registers a function
 */
ejs.registerFunction = function (name, cb) {
  ejs.__fn[name] = cb;
  transpile.__fn[name] = true;
};

/**
 * Get first path that exists according to order of root relative siblings
 * @param {*} root 
 * @param {*} siblings 
 * @param {*} filename 
 * @returns 
 */
ejs.selectFirstPathMatch = function (filename, folders) {
  try {
    const { root, siblings } = ejs.relativeSiblings(filename, folders);
    filename = path.relative(root, filename)
    for (let sib of siblings) {
      const _path = path.join(root, sib, filename)
      if (fs.existsSync(_path)) {
        return _path;
      }
    }
    return path.join(root, filename)

  } catch (e) {
    throw e;
  }
}

/**
 * Get relative path to many roots from filename root
 * @param {*} filename 
 * @param {*} folders 
 * @returns 
 */
ejs.relativeSiblings = function (filename, folders) {
  try {
    const root = ejs.selectRoot(filename, folders);
    if (!root) throw (new Error(`File : ${filename} doesn't exists`))
    const siblings = []
    for (let sibling of folders) {
      siblings.push(path.relative(root, sibling))
    }
    return {
      siblings,
      root: root
    };

  } catch (e) {
    throw e;
  }
}
/**
 * Select root among folders where filename come from
 * @param {*} filename 
 */
ejs.selectRoot = function (filename, folders) {
  for (let root of folders) {
    const test = filename.substring(0, root.length);
    if (root == test) {
      return root;
    }
  }
  return false;
}
/**
 * Renders the specified template using the specified data
 * @return Promise<string>
 */
ejs.prototype.renderFile = function (filename, data) {
  const self = this;
  const renderResult = new Promise(function (resolve, reject) {
    try {
      filename = self.resolveInclude(filename);
    } catch (e) {
      return reject(e);
    }
    var run = function (str) {
      const renderError = function (err, method) {
        const stack = err.stack.split("\n");
        let line = stack;
        let err_method = 'unknown';
        if (stack[1] && stack[1].split && typeof stack[1].split == "function") {
          line = stack[1].split(":");
          err_method = line[0].trim().split(' ')[1];
        }
        if (err_method == 'eval') {
          line = line[line.length - 2] - 18;
          if (isNaN(line)) line = 1;
          const start = line > 5 ? line - 5 : 0;
          const render_code = function (code, index) {
            if (code.length > 123) {
              code =
                code.substring(0, 80) +
                "..." +
                code.substring(code.length - 40);
            }
            let num = start + index + 1;
            if (num == line) {
              return (
                ("" + num).padStart(3, "0") +
                " | " +
                code +
                "\n     " +
                "".padEnd(code.length, "~")
              );
            } else {
              return ("" + num).padStart(3, "0") + " | " + code;
            }
          };

          if (method) {
            method = method.toString();
            const method_lines = method
              .toString()
              .split("\n")
              .slice(start > 18 ? start - 18 : start, line + 18);
            console.error(
              method_lines.map(render_code).join("\n")
            );
          }
          const lines = str
            .toString()
            .split("\n")
            .slice(start, line + 5);
          console.error(
            lines
              .map(render_code)
              .join("\n")
          );
          console.error("\n" + stack[0] + "\n at " + filename + ":" + line);
        } else {
          console.error(err);
        }
        if (data._includes) {
          data._includes.pop();
          if (data._includes.length > 0) {
            console.error(
              "\nIncludes stack : \n- " + data._includes.join("\n- ")
            );
          }
        }
      };
      var fn;
      try {
        if (!data._includes) {
          data._includes = [];
        }
        data._includes.push(filename);
        fn = self.compile(str.toString(), filename);
        var result = fn(self.prepareContext(data));
        if (result && typeof result.then == "function") {
          result
            .then(function (output) {
              data._includes.pop();
              resolve(output);
            })
            .catch(
              self.strict
                ? reject
                : function (err) {
                  renderError(err, fn);
                  resolve("<!-- " + err.message + " -->");
                }
            );
        } else {
          data._includes.pop();
          resolve(result);
        }
      } catch (e) {
        if (!self.strict) {
          renderError(e, fn);
          resolve("<!-- " + e.message + " -->");
        } else {
          return reject(e);
        }
      }
    };

    if (self.options.profile) {
      const now = new Date().getTime();
      nextTick(function () {
        renderResult.then(function (output) {
          let duration = new Date().getTime() - now;
          if (duration < 1000) {
            duration += "ms";
          } else {
            duration = Math.round(duration / 100) / 10 + "sec";
          }
          let size = output ? output.length : 0;
          if (size < 2048) {
            size += "B";
          } else {
            size = Math.round(size / 1024) + "kB";
          }
          console.log(
            "Rendering " + size + " in " + duration + " for " + filename
          );
          return output;
        });
      });
    }

    if (self.options.cache && ejs.__cache.hasOwnProperty(filename)) {
      run(ejs.__cache[filename]);
    } else {
      fs.readFile(filename, function (err, str) {
        if (err) {
          return reject(err);
        }
        if (self.options.cache) ejs.__cache[filename] = str;
        run(str);
      });
    }
  });
  return renderResult;
};

/**
 * Shortcut to ejs.prototype.renderFile
 * @return Promise<string>
 */
ejs.renderFile = function (filename, data, options) {
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
ejs.__express = async function (filename, data, cb) {
  if (!cb || typeof cb != "function") {
    throw new Error("No response callback");
  }
  var opt = {};
  if (data.settings) {
    if (data.settings["view cache"]) {
      opt.cache = true;
    }
    if (data.settings["views"]) {
      opt.root = data.settings["views"];
    }
  }
  try {
    const output = await ejs.renderFile(filename, data, opt);
    if (typeof output === "string") {
      cb(null, output);
    } else {
      cb(output, null);
    }
  } catch (err) {
    cb(err, null);
  }
};

/**
 * Expose it as a global for standalone (serialized ?) functions
 */
if (typeof window !== "undefined") {
  window.ejs = ejs;
} else if (typeof global !== "undefined") {
  global.ejs = ejs;
}




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
