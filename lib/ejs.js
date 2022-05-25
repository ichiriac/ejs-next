/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
var fs = require('fs');
var path = require('path');
var lexer = require('./lexer');
var transpile = require('./transpile');
var output = require('./output');

/**
 * Layer engine constructor
 */
var ejs = function(opts) {
  if (!opts) opts = {};
  this.options = {
    cache: opts.cache || ejs.cache,
    strict: opts.strict || ejs.strict,
    localsName: opts.localsName || 'locals',
    delimiter: opts.delimiter || ejs.delimiter,
    root: opts.root || ejs.root
  };
  this._session = {};
};

ejs.root = '/';


ejs.cache = false;

ejs.strict = false;

ejs.delimiter = '%';

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
ejs.prototype.compile = function(buffer, filename)  {
  if (this.options.cache && ejs.__cache.hasOwnProperty(buffer)) {
    return ejs.__cache[buffer];
  }
  var io = new lexer(this.options.delimiter);
  io.input(buffer);
  var out = new transpile(io, this.options, filename || "eval");
  var code = out.toString();
  try {
    var fn = new Function('ejs,' + this.options.localsName, code).bind(null, this);
    if (this.options.cache) {
      ejs.__cache[buffer] = fn;
    }
    return fn;
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

ejs.prototype.prepareContext = function(data) {
  return data;
}

/**
 * Renders the specified template using the specified data
 * @return Promise<string>
 */
ejs.prototype.render = function(str, data) {
  var result = this.compile(str)(
    this.prepareContext(data)
  );
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
  if (typeof args == 'function') {
    args =  { contents: args() };
  }
  if (typeof args == 'string') {
    args =  { contents: args };
  }
  return this.renderFile(
    this.resolveInclude(filename, from), 
    Object.assign({}, ctx, args || {})
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
  if (!this._session[name]) {
    this._session[name] = this.output();
  }
  if (arguments.length == 3) {
    if (typeof value == 'function') {
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
 * Registers a function
 */
ejs.registerFunction = function(name, cb) {
  ejs.__fn[name] = cb;
  transpile.__fn[name] = true;
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
    var run = function(str) {
      try {
        var fn = self.compile(str.toString(), filename);
        var result = fn(
          self.prepareContext(data)
        );
        if (result && typeof result.then == "function") {
          result.then(resolve).catch(reject);
        } else {
          resolve(result);
        }
      } catch(e) {
        return reject(e);
      }
    };
    if (self.options.cache && ejs.__cache.hasOwnProperty(filename)) {
      run(ejs.__cache[filename]);
    } else {
      fs.readFile(filename, function(err, str) {
        if (err) {
          return reject(err);
        }
        if (self.options.cache) ejs.__cache[filename] = str;
        run(str);
      });
    }
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
ejs.__express = function(filename, data, cb) {
  var opt = {};
  if (data.settings) {
    if (data.settings['view cache']) {
      opt.cache = true;
    }
    if (data.settings['views']) {
      opt.root = data.settings['views'];
    }
  }
  ejs.renderFile(filename, data, opt).then(function(output) {
    if (cb && typeof cb == 'function') {
      cb(null, output);
    } else {
      throw new Error('No response callback');
    }
  }).catch(function(err) {
    if (cb && typeof cb == 'function') {
      cb(err, null);
    } else throw err;
  });
};

/**
 * Expose it as a global for standalone (serialized ?) functions
 */
if (typeof window !== 'undefined') {
  window.ejs = ejs;
} else if (typeof global !== 'undefined') {
  global.ejs = ejs;
}

module.exports = ejs;
