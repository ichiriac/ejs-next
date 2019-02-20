/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
"use strict";

var lexer = require('./lexer');

/**
 * Initialize a new parser instance
 */
var parser = function() {
  this.lexer = new lexer();
};

/**
 * Eval helper (see parse function)
 */
parser.prototype.eval = function(source) {
  return this.parse(source, 'eval');
};

/**
 * Creates a node
 */
parser.prototype.node = function(type, data) {
  var start = {
    line: this.lexer.prev_line,
    col: this.lexer.prev_col,
    offset: this.lexer.prev_offset + 1
  };
  var fn = function(obj, obj2) {
    if (!type) {
      type = obj;
      obj = obj2;
    }
    return Object.assign(obj || {}, {
      kind: type,
      location: {
        start: start,
        end: {
          line: this.lexer.prev_line,
          col: this.lexer.prev_col,
          offset: this.lexer.prev_offset + 1
        },
        src: this.lexer.source.substring(start.offset, this.lexer.prev_offset + 1)
      }
    });
  }.bind(this);
  if (data) {
    this.next();
    fn = fn(data);
  }
  return fn;
};

/**
 * Raise an error
 */
parser.prototype.error = function(expect) {
  var message = 'Parse Error : syntax error';
  message += ", unexpected " + this.token[1];
  if (expect) {
    message += ', expecting ' + expect;
  }
  var err = new SyntaxError(
    message,
    this.filename,
    this.lexer.line
  );
  err.lineNumber = this.lexer.line;
  err.columnNumber = this.lexer.col;
  err.filename = this.filename;
  throw err;
};

/**
 * Parse the next token
 */
parser.prototype.next = function() {
  this.token = this.lexer.next();
  this.tok = this.token[0];
  return this.tok;
};

/**
 * Parsing function
 */
parser.prototype.parse = function(source, filename) {
  this.filename = filename;
  this.lexer.input(source);
  var program = this.node('program');
  var childs = [];
  this.next();
  while(this.tok !== lexer.tokens.T_EOF) {
    childs.push(this.parse_main());
  }
  return program({
    childs: childs
  });
};

/**
 * Main parser
 */
parser.prototype.parse_main = function() {
  switch(this.tok) {
    case lexer.tokens.T_INLINE:
      return this.node('inline', {
        source: this.token[1]
      });
    case lexer.tokens.T_OPEN:
      return this.parse_tag();
    default:
      this.error();
  }
};

/**
 * Tag parser
 */
parser.prototype.parse_tag = function() {
  var tag = this.node();
  var type = this.next();
  switch(type) {
    case lexer.tokens.T_SOURCE:
    case lexer.tokens.T_OPT_WS_STRIP:
      return this.parse_tag_source(tag);
    case lexer.tokens.T_OPT_COMMENT:
      return this.parse_tag_comment(tag);
    case lexer.tokens.T_OPT_CLEAN_OUTPUT:
    case lexer.tokens.T_OPT_OUTPUT:
      return this.parse_tag_output(tag);
    default:
      // dead code : should never be reached
      this.error();
  }
};

parser.prototype.parse_tag_output = function(node) {
  var opt = {
    source: null,
    sanitize: this.tok === lexer.tokens.T_OPT_CLEAN_OUTPUT,
    postStrip: false
  };
  if (this.next() !== lexer.tokens.T_SOURCE) {
    this.error('js code');
  }
  opt.source = this.token[1];
  if (this.next() !== lexer.tokens.T_CLOSE) {
    this.error('closing tag');
  } else this.next();
  return node('output', opt);
};

parser.prototype.parse_tag_comment = function(node) {
  var source = "";
  this.next();
  while (
    this.tok !== lexer.tokens.T_CLOSE
    && this.tok !== lexer.tokens.T_EOF
  ) {
    source += this.token[1];
    this.next();
  }
  this.next(); // consume last node
  return node('comment', { source: source });
};

parser.prototype.parse_tag_source = function(node) {
  var opt = {
    source: null,
    preStrip: false,
    postStrip: false
  };
  if (this.tok === lexer.tokens.T_OPT_WS_STRIP) {
    opt.preStrip = true;
    this.next();
  }
  if (this.tok !== lexer.tokens.T_SOURCE) {
    this.error('js code');
  }
  opt.source = this.token[1];
  this.next();
  if (this.tok === lexer.tokens.T_OPT_WS_STRIP) {
    opt.postStrip = true;
    this.next();
  }
  if (this.tok !== lexer.tokens.T_CLOSE) {
    this.error('closing tag');
  } else this.next();
  return node('statement', opt);
};

module.exports = parser;
