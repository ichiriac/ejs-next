/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
"use strict";
const lexer = require('./lexer');
module.exports = function(io, buffer) {
  io.input(buffer);
  let tok;
  let code = ["with(context) {"];
  tok = io.next();
  while(true) {
    if (tok[0] === lexer.tokens.T_INLINE) {
      let source = tok[1];
      tok = io.next();
      if (tok[0] === lexer.tokens.T_OPT_WS_STRIP) {
        source = source.replace(/[ \t]+$/, '');
      }
      if (source.length > 0) {
        code.push('echo(`' + source.replace('`', '\\`') + '`);');
      }
    } else if (tok[0] === lexer.tokens.T_EOF) {
      break;
    } else {
      if (tok[0] === lexer.tokens.T_OPT_COMMENT) {
        node.kind = 'comment';
        tok = io.next();
        if (tok[0] === lexer.tokens.T_SOURCE) {
          code.push('/* ' + tok[1].replace(/\*\//, '') + '*/');
          tok = io.next();
        } 
        let strip = tok[0] === lexer.tokens.T_OPT_WS_STRIP;
        tok = io.next();
        if (strip && tok[0] === lexer.tokens.T_INLINE) {
          tok[1] = tok[1].replace(/$[ \t]+/, '');
        }
      } else if (tok[0] === lexer.tokens.T_OPEN || tok[0] === lexer.tokens.T_OPT_WS_STRIP) {
        tok = io.next();
        if (tok[0] === lexer.tokens.T_SOURCE) {
          code.push(tok[1] + ';');
          tok = io.next();
        }
        let strip = tok[0] === lexer.tokens.T_OPT_WS_STRIP;
        tok = io.next();
        if (strip && tok[0] === lexer.tokens.T_INLINE) {
          tok[1] = tok[1].replace(/$[ \t]+/, '');
        }
      } else {
        let clean = tok[0] === lexer.tokens.T_OPT_CLEAN_OUTPUT;
        tok = io.next();
        if (tok[0] === lexer.tokens.T_SOURCE) {
          if (clean) {
            code.push('safeEcho(' + tok[1] + ');');
          } else {
            code.push('echo(' + tok[1] + ');');
          }
          tok = io.next();
        }
        let strip = tok[0] === lexer.tokens.T_OPT_WS_STRIP;
        tok = io.next();
        if (strip && tok[0] === lexer.tokens.T_INLINE) {
          tok[1] = tok[1].replace(/$[ \t]+/, '');
        }
      }
    }
  }
  code.push("\n}\nreturn context.resolveOutput();");
  return code.join("\n\t");
};