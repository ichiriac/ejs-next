/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
"use strict";
var lexer = require('./lexer');

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
module.exports = transpile;