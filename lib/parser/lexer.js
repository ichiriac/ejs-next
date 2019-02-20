/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
"use strict";

var lexer = function() {
  this.open_tag = '<';
  this.close_tag = '>';
  this.delimiter = '%';
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
  this.lastOffset = source.length - 1;
  this.lookupOffset = source.length - 2;
  this.line = 1;
  this.col = 0;
  this.state = lexer.states.S_INLINE;
  this.prev_col = this.col;
  this.prev_line = this.line;
  this.prev_offset = this.offset;
};

/**
 * Generates an token
 */
lexer.prototype.token = function(type) {
  var src = this.prev_offset > this.lastOffset ? null: this.source.substring(this.prev_offset + 1, this.offset + 1);
  return [type, src, this.prev_offset + 1, this.offset + 1];
};

/**
 * Scans a text
 */
lexer.prototype.scanText = function(lit) {
  while(this.offset < this.lastOffset) {
    this.col ++;
    this.offset ++;
    var char = this.source[this.offset];
    if (char === "\n") {
      this.line ++;
      this.col = 0;
    } else if (char === "\r") {
      this.line ++;
      this.col = 0;
      if (this.offset < this.lookupOffset && this.source[this.offset + 1] === "\n") {
        // windows line style
        this.offset ++;
      }
    } else if (char === "\\") {
      this.col ++;
      this.offset ++;
    } else if (char === lit) {
      break;
    }
  }
}

/**
 * Lexing the next token
 */
lexer.prototype.next = function() {
  this.prev_col = this.col;
  this.prev_line = this.line;
  this.prev_offset = this.offset;
  while(this.offset < this.lastOffset) {
    this.col ++;
    this.offset ++;
    var char = this.source[this.offset];
    if (char === "\n") {
      this.line ++;
      this.col = 0;
    } else if (char === "\r") {
      this.line ++;
      this.col = 0;
      if (this.offset < this.lookupOffset && this.source[this.offset + 1] === "\n") {
        // windows line style
        this.offset ++;
      }
    } else if (this.state === lexer.states.S_INLINE) {
      // OUTPUT INLINE TAGS
      if (char === this.open_tag) {
        if (
          this.offset < this.lookupOffset && 
          this.source[this.offset + 1] === this.delimiter && 
          this.offset + 1 < this.lookupOffset && 
          this.source[this.offset + 2] !== this.delimiter
        ) {
          // flushing
          this.state = lexer.states.S_TAG;
          this.offset --;
          return this.token(lexer.tokens.T_INLINE);
        }
      }
    } else if (this.state === lexer.states.S_TAG) {
      // OUTPUT EJS TAGS
      if (char === this.open_tag) {        
        if (this.offset < this.lastOffset && this.source[this.offset + 1] === this.delimiter) {
          this.col ++;
          this.offset ++;
          // flushing
          return this.token(lexer.tokens.T_OPEN);
        } else {
          throw new Error('Lexing error, expecting ' + this.delimiter);
        }
      } else if (char === this.delimiter) {
        if (this.offset < this.lastOffset && this.source[this.offset + 1] === this.close_tag) {
          this.col ++;
          this.offset ++;
          // flushing
          this.state = lexer.states.S_INLINE;
          return this.token(lexer.tokens.T_CLOSE);
        } else {
          // flushing
          this.state = lexer.states.S_SOURCE;
        }
      } else if (char === '#') {
        // flushing
        return this.token(lexer.tokens.T_OPT_COMMENT);
      } else if (char === '=') {
        // flushing
        return this.token(lexer.tokens.T_OPT_CLEAN_OUTPUT);
      } else if (char === '-') {
        // flushing
        return this.token(lexer.tokens.T_OPT_OUTPUT);
      } else if (char === '_') {
        // flushing
        return this.token(lexer.tokens.T_OPT_WS_STRIP);
      } else {
        // scans the source
        this.state = lexer.states.S_SOURCE;
      }
    } else if (this.state === lexer.states.S_SOURCE) {
      if (char === '"' || char === '\'' || char === '`') {
        // get some texts - ignore
        this.scanText(char);
      } else if (char === this.delimiter) {
        if (this.offset < this.lastOffset && this.source[this.offset + 1] === this.close_tag) {
          // flushing
          this.state = lexer.states.S_TAG;
          this.offset --;
          return this.token(lexer.tokens.T_SOURCE);
        }
      } else if (char === '_' || char === '#' || char === '-') {
        if (
          this.offset < this.lastOffset && 
          this.source[this.offset + 1] === this.delimiter &&
          this.offset + 1< this.lastOffset && 
          this.source[this.offset + 2] === this.close_tag
        ) {
          // flushing
          this.state = lexer.states.S_TAG;
          this.offset --;
          return this.token(lexer.tokens.T_SOURCE);
        }
      }
    } // never goes on else
  }
  if (this.prev_offset === this.offset) {
    return this.token(lexer.tokens.T_EOF);
  } else {
    return this.token(lexer.tokens.T_INLINE);
  }
};

module.exports = lexer;