/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
(function($, w) {
  "use strict";
  
  // lib/lexer.js at Sat Mar 09 2019 23:26:50 GMT+0100 (CET)
/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
"use strict";

var lexer = function() {
  this.open_tag = '<%';
  this.close_tag = '%>';
  this.char_comment = '#';
  this.char_output = '=';
  this.char_html = '-';
  this.char_strip = '_';
  this.char_buffering = '{@';
  this.char_ignore = '%';
};

/**
 * List of tokens
 */
lexer.tokens = {
  T_EOF:                0,  // 
  T_INLINE:             1,  // ...
  T_OPEN:               2,  // <%
  T_CLOSE:              3,  // %>
  T_OPT_COMMENT:        4,  // <%#
  T_OPT_CLEAN_OUTPUT:   5,  // <%=
  T_OPT_OUTPUT:         6,  // <%-
  T_OPT_WS_STRIP:       7,  // <%_ | _%>
  T_OPT_NL_STRIP:       8,  // -%>
  T_SOURCE:             9,  // if (js...)
};

/**
 * DEFINE LEXER STATES
 */
lexer.states = {
  S_INLINE:   0,
  S_TAG:      1,
  S_SOURCE:   2
};

/**
 * Initialize the lexer with source contents
 */
lexer.prototype.input = function(source) {
  this.source = source;
  this.offset = -1;
  this.prev_offset = this.offset;
  this.lastOffset = source.length - 1;
  this.lookupOffset = source.length - 2;
  this.state = lexer.states.S_INLINE;
};

/**
 * Generates an token
 */
lexer.prototype.token = function(type) {
  var src = this.prev_offset > this.lastOffset ? null: this.source.substring(this.prev_offset, this.offset + 1);
  return [type, src, this.prev_offset, this.offset + 1];
};

/**
 * Lexing the next token
 */
lexer.prototype.next = function() {
  this.prev_offset = this.offset + 1;
  while(++this.offset < this.lastOffset) {
    if (this.state === lexer.states.S_INLINE) {
      this.offset = this.source.indexOf(this.open_tag, this.offset);
      if (this.offset === -1) {
        this.offset = this.lastOffset;
      } else {
        this.state = lexer.states.S_TAG;
        this.offset --;
        return this.token(lexer.tokens.T_INLINE);
      }
    } else if (this.state === lexer.states.S_TAG) {
      var char = this.source[this.offset];
      if (char === this.open_tag[0]) {
        this.state = lexer.states.S_SOURCE;
        this.offset += this.open_tag.length;
        char = this.source[this.offset];
        switch(char) {
          case this.char_comment:
            return this.token(lexer.tokens.T_OPT_COMMENT);
          case this.char_output:
            return this.token(lexer.tokens.T_OPT_CLEAN_OUTPUT);
          case this.char_html:
            return this.token(lexer.tokens.T_OPT_OUTPUT);
          case this.char_strip:
            return this.token(lexer.tokens.T_OPT_WS_STRIP);
          default:
            this.offset--;
            return this.token(lexer.tokens.T_OPEN);
        }
      } else {
        this.state = lexer.states.S_INLINE;
        if (char === this.char_strip) {
          this.offset += this.close_tag.length;
          return this.token(lexer.tokens.T_OPT_WS_STRIP);
        } else if (char === this.char_html) {
          this.offset += this.close_tag.length;
          return this.token(lexer.tokens.T_OPT_NL_STRIP);
        } else {
          this.offset += this.close_tag.length - 1;
          return this.token(lexer.tokens.T_CLOSE);
        }
      }
    } else {
      this.offset = this.source.indexOf(this.close_tag, this.offset);
      if (this.offset === -1) {
        this.offset = this.lastOffset;
      } else {
        this.state = lexer.states.S_TAG;
        if (
          this.source[this.offset - 1] === this.char_strip ||
          this.source[this.offset - 1] === this.char_html
        ) {
          this.offset -= 2;
        } else {
          this.offset --;
        }
        return this.token(lexer.tokens.T_SOURCE);
      }
    }
  }
  if (this.prev_offset === this.offset) {
    return this.token(lexer.tokens.T_EOF);
  } else {
    return this.token(lexer.tokens.T_INLINE);
  }
};

// lib/transpile.js at Sat Mar 09 2019 23:26:50 GMT+0100 (CET)
/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
"use strict";


/**
 * Define the lexer -> token -> code transformations
 */
var transpile = function(io, buffer, opts, filename) {
  io.input(buffer);
  var tok, code = '', safeEcho, echo;
  if (opts.strict) {
    code += '"use strict";\n';
    safeEcho = opts.localsName + '.safeEcho(';
    echo = opts.localsName + '.echo(';
  } else {
    safeEcho = '\tsafeEcho(';
    echo = '\techo(';
  }
  code += 'if (!ejs || typeof ejs.context !== "function") {\n';
  code += '\t' + opts.localsName + ' = ejs;\n';
  code += '\tif (typeof window !== "undefined") {\n';
  code += '\t\tejs = window.ejs;\n';
  code += '\t} else if (typeof global !== "undefined") {\n';
  code += '\t\tejs = global.ejs;\n';
  code += '\t} else {\n';
  code += '\t\treturn Promise.reject(new Error("EJS module is not loaded"));\n';
  code += '\t}\n';
  code += '}\n';
  code += opts.localsName + ' = ejs.context(' + opts.localsName + ', '+JSON.stringify(opts)+',"'+filename+'");\n';
  if (!opts.strict) {
    code += "with(" + opts.localsName + ") {\n";
  }
  tok = io.next();
  while(true) {
    if (tok[0] === lexer.tokens.T_INLINE) {
      // we are inside an html chunk
      var source = tok[1];
      tok = io.next();
      if (tok[0] === lexer.tokens.T_OPT_WS_STRIP) {
        source = source.replace(/[ \t]+$/, '');
      }
      if (source.length > 0) {
        code += echo + '`' + source.replace('`', '\\`') + '`);\n';
      }
    } else if (tok[0] === lexer.tokens.T_EOF) {
      // no more tokens
      break;
    } else {
      if (tok[0] === lexer.tokens.T_OPT_COMMENT) {
        // a comment token
        tok = io.next();
        if (tok[0] === lexer.tokens.T_SOURCE) {
          code += '\t/* ' + tok[1].replace(/\*\//, '') + '*/\n';
          tok = io.next();
        } 
      } else if (tok[0] === lexer.tokens.T_OPEN || tok[0] === lexer.tokens.T_OPT_WS_STRIP) {
        // plain JS statement
        tok = io.next();
        if (tok[0] === lexer.tokens.T_SOURCE) {
          code += '\t' + tok[1] + ';\n';
          tok = io.next();
        }
      } else {
        // output statement
        var clean = tok[0] === lexer.tokens.T_OPT_CLEAN_OUTPUT;
        tok = io.next();
        if (tok[0] === lexer.tokens.T_SOURCE) {
          if (clean) {
            code += safeEcho + tok[1] + ');\n';
          } else {
            code += echo + tok[1] + ');\n';
          }
          tok = io.next();
        }
      }
      var strip = tok[0];
      tok = io.next();
      if (tok[0] === lexer.tokens.T_INLINE) {
        if (strip === lexer.tokens.T_OPT_WS_STRIP) {
          // strip spaces on next inline token
          tok[1] = tok[1].replace(/^[ \t]*\n?/, '');
        } else if (strip === lexer.tokens.T_OPT_NL_STRIP) {
          // @fixme need to check the spec on what to strip ?
          tok[1] = tok[1].replace(/^[ \t]*\n?/, '');
        }
      }
    }
  }
  // results
  if (!opts.strict) {
    code += "}\n";
  }
  code += "return " + opts.localsName + ".resolveOutput();";
  return code;
};
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