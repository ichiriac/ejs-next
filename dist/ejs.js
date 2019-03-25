/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
(function($, w) {
  "use strict";
  
  // lib/lexer.js at Mon Mar 25 2019 12:14:58 GMT+0100 (GMT+01:00)
/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
/*jslint node: true */
"use strict";

var char_comment = '#';
var char_output = '=';
var char_html = '-';
var char_strip = '_';
var char_ignore = '%';

var lexer = function() {
  this.open_tag = '<%';
  this.close_tag = '%>';
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
  T_OPEN_CAPTURE:       10, // {@
  T_CLOSE_CAPTURE:      11  // @}
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
  this.current = null;
};

/**
 * Generates an token
 */
lexer.prototype.token = function(type) {
  var src = this.prev_offset > this.lastOffset ? null: this.source.substring(this.prev_offset, this.offset + 1);
  this.current = [type, src, this.prev_offset, this.offset + 1];
  return this.current;
};

/**
 * Lexing the next token
 */
lexer.prototype.next = function() {
  var char;
  this.prev_offset = this.offset + 1;
  while(++this.offset < this.lastOffset) {
    if (this.state === lexer.states.S_INLINE) {
      this.offset = this.source.indexOf(this.open_tag, this.offset);
      if (this.offset === -1) {
        this.offset = this.lastOffset;
      } else {
        if (this.source[this.offset + 2] === char_ignore) {
          continue;
        }
        this.state = lexer.states.S_TAG;
        this.offset --;
        return this.token(lexer.tokens.T_INLINE);
      }
    } else if (this.state === lexer.states.S_TAG) {
      char = this.source[this.offset];
      this.state = lexer.states.S_SOURCE;
      this.offset += this.open_tag.length;
      char = this.source[this.offset];
      if (char == char_output) {
        return this.token(lexer.tokens.T_OPT_CLEAN_OUTPUT);
      } else if (char == char_html) {
        return this.token(lexer.tokens.T_OPT_OUTPUT);
      } else if (char == char_strip) {
        return this.token(lexer.tokens.T_OPT_WS_STRIP);
      } else if (char == char_comment) {
        return this.token(lexer.tokens.T_OPT_COMMENT);
      }
      this.offset--;
      return this.token(lexer.tokens.T_OPEN);
    } else {
      // scan js source code 
      do {
        char = this.source[this.offset];

        // scan texts
        if (char == "'" || char == '"' || char == "`") {
          while(++this.offset < this.lastOffset) {
            var c = this.source[this.offset];
            if (c == "\\") {
              this.offset++;
              continue;
            }
            if (c == char) break;
          }
        }

        // scan comments
        if (char == '/' && this.source[this.offset + 1] == '*')  {
          // @fixme handle // and #
          while(++this.offset < this.lastOffset) {
            char = this.source[this.offset];
            if (char == "*" && this.source[this.offset + 1] == '/') {
              ++this.offset;
              break;
            }
          }
        }

        // T_OPEN_CAPTURE
        if (char == '{' && this.source[this.offset + 1] == '@') {
          if (this.prev_offset == this.offset) {
            this.offset ++;
            return this.token(lexer.tokens.T_OPEN_CAPTURE);
          } else {
            this.offset --;
            break;
          }
        }
        
        // T_CLOSE_CAPTURE
        if (char == '@' && this.source[this.offset + 1] == '}') {
          if (this.prev_offset == this.offset) {
            this.offset ++;
           return this.token(lexer.tokens.T_CLOSE_CAPTURE);
          } else {
            this.offset --;
            break;
          }
        }
  
        // close tag
        if (char == this.close_tag[0]) {
          if (this.source.substring(this.offset, this.offset + this.close_tag.length) == this.close_tag) {
            var isStripWs = this.source[this.offset - 1] === char_strip;
            var isStripHtml = this.source[this.offset - 1] === char_html;
            if (isStripWs || isStripHtml) {
              this.offset --;
            }
            if (this.prev_offset == this.offset) {
              this.state = lexer.states.S_INLINE;
              this.offset += this.close_tag.length;
              if (isStripWs) {
                return this.token(lexer.tokens.T_OPT_WS_STRIP);
              } else if (isStripHtml) {
                return this.token(lexer.tokens.T_OPT_NL_STRIP);
              }
              this.offset --;
              return this.token(lexer.tokens.T_CLOSE);
            } else {
              this.offset --;
              break;
            }
          }
        }
      } while(++this.offset < this.lastOffset);
      return this.token(lexer.tokens.T_SOURCE);
    }
  }
  if (this.prev_offset === this.offset) {
    return this.token(lexer.tokens.T_EOF);
  } else {
    return this.token(lexer.tokens.T_INLINE);
  }
};

// lib/transpile.js at Mon Mar 25 2019 12:14:58 GMT+0100 (GMT+01:00)
/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
"use strict";


/**
 * Convert tokens to code
 * @param {*} lex 
 */
var jsCode = function(lex) {
  var result = '';
  var tok = lex.next();
  while(tok[0] != lexer.tokens.T_EOF) {
    if (tok[0] == lexer.tokens.T_CLOSE) break;
    if (tok[0] == lexer.tokens.T_OPT_WS_STRIP) break;
    if (tok[0] == lexer.tokens.T_OPT_NL_STRIP) break;
    result += tok[1];
    tok = lex.next();
  }
  return result;
};

/**
 * Parse every token
 * @param {*} io 
 * @param {*} opts 
 */
var parseTokens = function(io, opts, filename) {
  var code = '';
  var safeEcho = '\t_$e[_$a++] = _$b; _e[_$b++] = ';
  var echo = '\t_e[_$b++] = ';
  if (opts.strict) {
    code += '"use strict";\n';
  }
  code += "var _$e = [], _e = [], _$a = 0, _$b = 0;\n";
  if (filename) {
    code += 'var _$f = "'+filename+'";\n';
    code += 'if (arguments.length < 2) {\n';
    code += '\t' + opts.localsName + ' = ejs;\n';
    code += '\tejs = (typeof global != "undefined" && global.ejs) || (typeof window != "undefined" && window.ejs);\n';
    code += '\tif(!ejs) return Promise.reject(new Error("EJS module is not loaded"));\n';
    code += '\tejs = new ejs('+JSON.stringify(opts)+');\n';
    code += '}\n';
    code += opts.localsName + ' = ' + opts.localsName + ' || {};\n';
    code += 'var include = ejs.include.bind(ejs, '+opts.localsName+', "'+filename+'");\n';  
  }
  if (!opts.strict) {
    code += "with(" + opts.localsName + ") {\n";
  }
  var tok = io.next();
  while(true) {
    if (tok[0] == lexer.tokens.T_INLINE) {
      // we are inside an html chunk
      var source = tok[1];
      tok = io.next();
      if (tok[0] == lexer.tokens.T_OPT_WS_STRIP) {
        source = source.replace(/[ \t]+$/, '');
      }
      if (source.length > 0) {
        code += echo + '`' + source.replace('`', '\\`') + '`;\n';
      }
    } else if (tok[0] == lexer.tokens.T_EOF) {
      // no more tokens
      break;
    } else if (tok[0] == lexer.tokens.T_CLOSE_CAPTURE) {
      // end of closure
      break;
    } else {
      if (tok[0] == lexer.tokens.T_OPT_COMMENT) {
        // a comment token
        code += '\t/* ' + jsCode(io) + '*/\n';
      } else {
        var isCode = tok[0] == lexer.tokens.T_OPEN || tok[0] == lexer.tokens.T_OPT_WS_STRIP;
        var isOutput =  tok[0] == lexer.tokens.T_OPT_OUTPUT;
        var isClean = tok[0] == lexer.tokens.T_OPT_CLEAN_OUTPUT;
        var src = '';
        tok = io.next();
        while(tok[0] != lexer.tokens.T_EOF) {
          if (tok[0] == lexer.tokens.T_CLOSE) break;
          if (tok[0] == lexer.tokens.T_OPT_WS_STRIP) break;
          if (tok[0] == lexer.tokens.T_OPT_NL_STRIP) break;
          if (tok[0] == lexer.tokens.T_CLOSE_CAPTURE) break;
          if (tok[0] == lexer.tokens.T_OPEN_CAPTURE) {
            src += '{';
            src += parseTokens(io, opts);
            src += '}';
          } else {
            src += tok[1];
          }
          tok = io.next();
        }
        if (tok[0] == lexer.tokens.T_CLOSE_CAPTURE) {
          code += src;
          break;
        }
        if (isCode) {
          src += ';\n';
        } else if (isOutput) {
          src = echo + src + ';\n';
        } else if (isClean) {
          src = safeEcho + src + ';\n';
        }
        code += src;
      }
      
      var strip = io.current[0];
      tok = io.next();
      if (tok[0] == lexer.tokens.T_INLINE) {
        if (strip == lexer.tokens.T_OPT_WS_STRIP) {
          // strip spaces on next inline token
          tok[1] = tok[1].replace(/^[ \t]*\n?/, '');
        } else if (strip == lexer.tokens.T_OPT_NL_STRIP) {
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
  code += "return Promise.all(_e).then(function(parts) {\n";
  code += "\tvar r = /[&<>'\"]/g;\n";
  code += "\tfor(var i = 0; i < _$e.length; i++) {\n";
  code += "\t\tvar offset = _$e[i];\n";
  code += "\t\tvar str = parts[offset];\n";
  code += "\t\tif (str != null) {\n";
  code += "\t\t\tparts[offset] = str.replace(r, function(c) {\n";
  code += "\t\t\t\tif (c == '&') return '&amp;';\n";
  code += "\t\t\t\tif (c == '<') return '&lt;';\n";
  code += "\t\t\t\tif (c == '>') return '&gt;';\n";
  code += "\t\t\t\tif (c == '\"') return '&#34;';\n";
  code += "\t\t\t\tif (c == \"'\") return '&#39;';\n";
  code += "\t\t\t\treturn c;\n";
  code += "\t\t\t});\n";
  code += "\t\t}\n";
  code += "\t}\n";
  code += "\treturn parts.join('');\n";
  code += "});\n";
  if (filename) {
    code += '//@ sourceURL=' + filename;
  }
  return code;
};

/**
 * Define the lexer -> token -> code transformations
 */
var transpile = function(io, buffer, opts, filename) {
  io.input(buffer);
  return parseTokens(io, opts, filename || "eval");
};
// lib/ejs.js at Mon Mar 25 2019 12:14:58 GMT+0100 (GMT+01:00)
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
  return this.compile(str)(data);
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
ejs.prototype.include = function(data, from, filename, args) {
  return this.renderFile(
    this.resolveInclude(filename, from), 
    Object.assign({}, data, args)
  );
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
        fn(data).then(resolve).catch(reject);
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