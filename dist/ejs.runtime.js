/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
(function($, w) {
  "use strict";
  
  // lib/output.js at Sat Mar 09 2019 23:26:50 GMT+0100 (CET)
/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */


var output = function(engine, filename) {
  this._buffer = '';
  this._parts = [];
  this._filename = filename;
  if (engine) {
    this._engine = engine;
  } else {
    
    this._engine = new ejs();
  }
};

/**
 * Creates a new context
 */
output.prototype.push = function(data) {
  var result = new output(this._engine, this._filename);
  Object.assign(result, data);
  for(var k in this) {
    if (k[0] !== '_' && this.hasOwnProperty(k) && typeof data[k] === undefined) {
      result[k] = this[k];
    }
  }
  return result;
};

/**
 * Echo function
 */
output.prototype.echo = function(data) {
  if (typeof data.then === 'function') {
    if (this._buffer.length > 0) {
      this._parts.push(this._buffer);
    }
    this._parts.push(data);
    this._buffer = '';
  } else  {
    this._buffer += data;
  }
  return this;
};

/**
 * list of results
 */
var escape = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&#34;',
  "'": '&#39;'
};

/**
 * Clean output function
 */
output.prototype.safeEcho = function(data) {
  if (typeof data.then === 'function') {
    return this.echo(
      Promise.resolve(data).then(function(text) {
        if (text === null) return null;
        return text.replace(/[&<>'"]/g, function(c) {
          return escape[c];
        });
      })
    );
  }
  if (typeof data === 'string') {
    this.echo(
      data.replace(/[&<>'"]/g, function(c) {
        return escape[c];
      })
    );
  } else {
    this.echo(
      (new String(data)).replace(/[&<>'"]/g, function(c) {
        return escape[c];
      })
    );
  }
};

/**
 * Executes an include
 */
output.prototype.include = function(filename, vars) {
  if (filename[0] !== '/') {
    filename = path.relative(
      this._engine.options.root,
      this._engine.resolveInclude(filename, this._filename, false)
    );
  }
  return this._engine.renderFile(filename, this.push(vars));
};

/**
 * Registers a block
 */
output.prototype.block = function(name, fn) {
  if (!this.blocks) {
    this.blocks = {};
  }
  if (!this.blocks[name]) {
    this.blocks[name] = [];
  }
  if (fn && typeof fn === 'function') {
    var result = fn({});
    this.blocks[name].push(result);
    return result;
  }
  return this.blocks[name];
};

/**
 * Resolves the current output
 */
output.prototype.resolveOutput = function() {
  if (this._parts.length === 0) {
    return Promise.resolve(this._buffer);
  }
  if (this._buffer.length > 0) {
    this._parts.push(this._buffer);
    this._buffer = '';
  }
  return Promise.all(this._parts).then(function(p) {
    this._buffer = p.join("");
    this._parts = [];
    return this._buffer;
  }.bind(this));
};


// lib/context.js at Sat Mar 09 2019 23:26:50 GMT+0100 (CET)
/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */


// remove from proxy scope
var unscopables = {
  locals: true,
  Math: true,
  Date: true,
  global: true,
  window: true,
  Function: true
};
for(var k in global || window) {
  unscopables[k] = true;
}
/**
 * Basic proxy handler (for native instructions)
 */
var proxyHandler =  {
  get: function(ctx, prop) {
    if (prop === Symbol.unscopables) return unscopables;
    if (ctx[prop] === undefined) {
      ctx[prop] = new Proxy({}, proxyHandler);
    }
    return ctx[prop];
  },
  set: function(ctx, prop, value) {
    ctx[prop] = value;
  },
  has: function (ctx, prop) {
    return !unscopables.hasOwnProperty(prop);
  }
};

/**
 * Creates a new context instance
 */
context = function(obj, engine, filename) {
  if (obj instanceof Proxy) {
    // bypass (already instanciated)
    return obj;
  }
  var ctx;
  if (obj instanceof output) {
    ctx = obj;
  } else {
    ctx = Object.assign(new output(engine, filename), obj);
  }
  if (!engine.options.strict && typeof Proxy === 'function') {
    for(var i in ctx) {
      if (typeof ctx[i] === 'function') {
        ctx[i] = ctx[i].bind(ctx);
      }
    }
    return new Proxy(ctx, proxyHandler);
  }
  return ctx;
};

// lib/ejs.js at Sat Mar 09 2019 23:26:50 GMT+0100 (CET)
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
  if (!filename) {
    filename = 'eval';
  }
  var code = transpile(new lexer(), buffer, this.options, filename);
  try {
    return new Function('ejs,' + this.options.localsName, code).bind(null, ejs);
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
  return this.compile(str)(
    context(data || {}, this)
  );
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
 * Resolves a path
 */
ejs.prototype.resolveInclude = function(filename, from, isDir) {
  if (!from) {
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
    filename = ejs.resolveInclude(filename, self.options.root, true);
    fs.readFile(filename, function(err, str) {
      if (err) {
        return reject(err);
      }
      try {
        var fn = self.compile(str.toString(), filename);
        fn(
          context(data || {}, self, filename)
        ).then(resolve).catch(reject);
      } catch(e) {
        return reject(e);
      }
    });
  });
};

/**
 * Generic context creator
 */
ejs.context = function(data, opts, filename) {
  if (data instanceof output) {
    return data;
  }
  return context(data, new ejs(opts), filename);
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