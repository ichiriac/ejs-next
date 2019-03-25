/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
"use strict";
var lexer = require('./lexer');

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
  code += "return _e.join(''); Promise.all(_e).then(function(parts) {\n";
  code += "\tvar r = /[&<>'\"]/g;\n";
  code += "\tfor(var i = 0; i < _$a; i++) {\n";
  code += "\t\tvar offset = _$e[i];\n";
  code += "\t\tvar str = parts[offset];\n";
  code += "\t\tif (str != null) {\n";
  code += "\t\t\tif (typeof str != 'string') str = str.toString();\n";
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
    // code += '//@ sourceURL=' + filename;
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
module.exports = transpile;