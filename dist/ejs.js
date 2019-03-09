/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
(function($, w) {
  "use strict";
  
  // lib/lexer.js at Sat Mar 09 2019 16:25:27 GMT+0100 (CET)
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
  T_SOURCE:             8,  // if (js...)
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
        if( this.source[this.offset - 1] === this.char_strip) {
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

// lib/transpile.js at Sat Mar 09 2019 16:25:27 GMT+0100 (CET)
/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
"use strict";


/**
 * Define the lexer -> token -> code transformations
 */
var transpile = function(io, buffer, opts) {
  io.input(buffer);
  var tok, code = '', safeEcho, echo;
  if (opts.strict) {
    code += '"use strict";\n';
    safeEcho = opts.localsName + '.safeEcho(';
    echo = opts.localsName + '.echo(';
  } else {
    code += "with(" + opts.localsName + ") {\n";
    safeEcho = '\tsafeEcho(';
    echo = '\techo(';
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
        var strip = tok[0] === lexer.tokens.T_OPT_WS_STRIP;
        tok = io.next();
        if (strip && tok[0] === lexer.tokens.T_INLINE) {
          // strip spaces on next inline token
          tok[1] = tok[1].replace(/^[ \t]*\n?/, '');
        }
      } else if (tok[0] === lexer.tokens.T_OPEN || tok[0] === lexer.tokens.T_OPT_WS_STRIP) {
        // plain JS statement
        tok = io.next();
        if (tok[0] === lexer.tokens.T_SOURCE) {
          code += '\t' + tok[1] + ';\n';
          tok = io.next();
        }
        var strip = tok[0] === lexer.tokens.T_OPT_WS_STRIP;
        tok = io.next();
        if (strip && tok[0] === lexer.tokens.T_INLINE) {
          // strip spaces on next inline token
          tok[1] = tok[1].replace(/^[ \t]*\n?/, '');
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
        var strip = tok[0] === lexer.tokens.T_OPT_WS_STRIP;
        tok = io.next();
        if (strip && tok[0] === lexer.tokens.T_INLINE) {
          // strip spaces on next inline token
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
// lib/output.js at Sat Mar 09 2019 16:25:27 GMT+0100 (CET)
/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
var output = function() {
  this._buffer = '';
  this._parts = [];
  this._levels = [];
};

/**
 * Turn on output buffering
 */
output.prototype.ob_start = function() {
  this._levels.push(this._parts.length);
  return this;
};

/**
 * Clean (erase) the output buffer and turn off output buffering
 */
output.prototype.ob_end_clean = function() {
  if (this._levels.length > 0) {
    this._parts.splice(this._levels.pop());
  } else {
    throw new Error('Bad output level, use ob_start before');
  }
  return this;
};

/**
 * Flush (send) the output buffer and turn off output buffering
 */
output.prototype.ob_end_flush = function() {
  if (this._levels.length > 0) {
    this._levels.pop();
  } else {
    throw new Error('Bad output level, use ob_start before');
  }
};

/**
 * Clean (erase) the output buffer
 */
output.prototype.ob_clean = function() {
  if (this._levels.length > 0) {
    this._parts.splice(
      this._levels[this._levels.length - 1]
    );
  } else {
    throw new Error('Bad output level, use ob_start before');
  }
  return this;
};

/**
 * Return the contents of the output buffer
 */
output.prototype.ob_get_contents = function() {
  if (this._levels.length > 0) {
    return Promise.all(this._parts.slice(
      this._levels[this._levels.length - 1]
    )).then(function(p) {
      return p.join("");
    });
  } else {
    throw new Error('Bad output level, use ob_start before');
  }
};

/**
 * Get current buffer contents and delete current output buffer
 */
output.prototype.ob_get_clean = function() {
  var str = this.ob_get_contents();
  this.ob_end_clean();
  return str;
};

/**
 * Flush the output buffer, return it as a string and turn off output buffering
 */
output.prototype.ob_get_flush = function() {
  var str = this.ob_get_contents();
  this._levels.pop();
  return str;
};

/**
 * Return the nesting level of the output buffering mechanism
 */
output.prototype.ob_get_level = function() {
  return this._levels.length;
};

/**
 * Echo function
 */
output.prototype.echo = function(data) {
  if (typeof data.then === 'function') {
    this._parts.push(this._buffer);
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
    this.echo(
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
 * Renders the output
 */
output.prototype.toString = function() {
  if (this._parts.length === 0) {
    return this._buffer;
  }
  if (this._buffer.length > 0) {
    this._parts.push(this._buffer);
    this._buffer = '';
  }
  return this._parts.join("");
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


// lib/context.js at Sat Mar 09 2019 16:25:27 GMT+0100 (CET)
/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */


var context = function(initial, engine) {
  // Expose globals
  this._state = [{
    Math: Math,
    Date: Date
  }];
  this._engine = engine;
  if (initial) {
    this.push(initial);
  }
  this._output = new output(this);
};

/**
 * Injects a list of variables
 */
context.prototype.push = function(vars) {
  this._state.push(vars);
  for(var k in vars) {
    if (!this.hasOwnProperty(k)) {
      Object.defineProperty(
        this, k, {
          configurable: true,
          enumerable: true,
          get: this.get.bind(this, k),
          set: this.set.bind(this, k)
        }
      );
    }
  }
  return this;
};

/**
 * Removes the state
 */
context.prototype.pop = function() {
  this._state.pop();
  return this;
};

/**
 * Executes an include
 */
context.prototype.include = function(filename, vars) {
  if (typeof vars === 'function') {
    this.ob_start();
    vars();
    vars = {
      contents: this.ob_get_clean()
    };
  }
  this.push(vars);
  this.ob_start();
  this.engine.renderFile(filename, this);
  this.pop();
  return this.ob_get_clean();
};

/**
 * expose output functions
 */
for(var k in output.prototype) {
  (function(property) {
    context.prototype[property] = function() {
      return this._output[property].apply(this._output, arguments);
    };
  })(k);
}

/**
 * Sets a value
 */
context.prototype.set = function(key, value) {
  this._state[this._state.length - 1][key] = value;
  return this;
};

/**
 * Gets a value
 */
context.prototype.get = function(key) {
  if (key[0] !== '_' && context.prototype.hasOwnProperty(key)) {
    return this[key].bind(this);
  }
  for(var i = this._state.length - 1; i > -1 ; i--) {
    if (this._state[i].hasOwnProperty(key)) {
      return this._state[i][key];
    }
  }
  return null;
};

/**
 * Basic proxy handler (for native instructions)
 */
var proxyHandler =  {
  get: function(ctx, prop) {
    return ctx.get(prop);
  },
  set: function(ctx, prop, value) {
    return ctx.set(prop, value);
  },
  has: function (ctx, prop) {
    return prop[0] !== '_' && prop !== 'locals';
  }
};

/**
 * Creates a new context instance
 */
context.create = function(obj, engine) {
  if (obj instanceof Proxy || obj instanceof context) {
    // bypass (already instanciated)
    return obj;
  }
  if (engine.options.strict) {
    var ctx = new output(engine);
    return Object.assign(ctx, obj);
  }
  if (typeof Proxy === 'function') {
    return new Proxy(new context(obj, engine), proxyHandler);
  }
  return new context(obj, engine);
};

// lib/ejs.js at Sat Mar 09 2019 16:25:27 GMT+0100 (CET)
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
    localsName: opts.localsName || 'locals' 
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
  var code = transpile(new lexer(), buffer, this.options);
  try {
    return new Function(this.options.localsName, code);
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
    context.create(data || {}, this)
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
 * Renders the specified template using the specified data
 * @return Promise<string>
 */
ejs.prototype.renderFile = function(filename, data) {
  var self = this;
  return new Promise(function(resolve, reject) {
    fs.readFile(filename, function(err, str) {
      if (err) {
        return reject(err);
      }
      try {
        var fn = self.compile(str, filename);
        fn(
          context.create(data || {}, this)
        ).then(resolve).catch(reject);
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