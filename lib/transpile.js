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

var reserved = {
  'abstract': true,
  'else': true,
  'instanceof': true,
  'super': true,
  'boolean': true,
  'enum': true,
  'int': true,
  'switch': true,
  'break': true,
  'export': true,
  'interface': true,
  'synchronized': true,
  'byte': true,
  'extends': true,
  'let': true,
  'this': true,
  'case': true,
  'false': true,
  'long': true,
  'throw': true,
  'catch': true,
  'final': true,
  'native': true,
  'throws': true,
  'char': true,
  'finally': true,
  'new': true,
  'transient': true,
  'class': true,
  'float': true,
  'null': true,
  'true': true,
  'const': true,
  'for': true,
  'package': true,
  'try': true,
  'continue': true,
  'function': true,
  'private': true,
  'typeof': true,
  'debugger': true,
  'goto': true,
  'protected': true,
  'var': true,
  'default': true,
  'if': true,
  'public': true,
  'void': true,
  'delete': true,
  'implements': true,
  'return': true,
  'volatile': true,
  'do': true,
  'import': true,
  'short': true,
  'while': true,
  'double': true,
  'in': true,
  'static': true,
  'with': true,
  'layout': true,
  'include': true,
  'block': true
}

/**
 * Parse every token
 * @param {*} io 
 * @param {*} opts 
 */
var parseTokens = function(io, opts, filename) {
  var code = '';
  var safeEcho = '\t_$e.safe = ';
  var echo = '\t_$e.echo = ';
  if (opts.strict) {
    code += '"use strict";\n';
  }
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
  code += 'var _$e = ejs.output();\n';  
  if (filename) {
    code += 'var layout = ejs.layout.bind(ejs, '+opts.localsName+', "'+filename+'", _$e);\n';  
    code += 'var block = ejs.block.bind(ejs, '+opts.localsName+');\n';  
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
            if (tok[0] == lexer.tokens.T_IDENTIFIER) {
              if (!reserved[tok[1]]) {
                var varname = tok[1];
                tok = io.next();
                if (tok[1] == ':' || varname.substring(0, opts.localsName.length) == opts.localsName) {
                  src += varname;
                } else {
                  src += opts.localsName + '.' + varname;
                }
                continue;
              } else {
                src += tok[1];
              }
            } else {
              src += tok[1];
            }
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
  code += "return _$e.output;\n";
  if (filename && filename != 'eval') {
    //code += '//@ sourceURL=' + filename;
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