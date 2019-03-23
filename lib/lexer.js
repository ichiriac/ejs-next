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
      if (char === this.open_tag[0]) {
        this.state = lexer.states.S_SOURCE;
        this.offset += this.open_tag.length;
        char = this.source[this.offset];
        switch(char) {
          case char_comment:
            return this.token(lexer.tokens.T_OPT_COMMENT);
          case char_output:
            return this.token(lexer.tokens.T_OPT_CLEAN_OUTPUT);
          case char_html:
            return this.token(lexer.tokens.T_OPT_OUTPUT);
          case char_strip:
            return this.token(lexer.tokens.T_OPT_WS_STRIP);
          default:
            this.offset--;
            return this.token(lexer.tokens.T_OPEN);
        }
      } else {
        this.state = lexer.states.S_INLINE;
        if (char === char_strip) {
          this.offset += this.close_tag.length;
          return this.token(lexer.tokens.T_OPT_WS_STRIP);
        } else if (char === char_html) {
          this.offset += this.close_tag.length;
          return this.token(lexer.tokens.T_OPT_NL_STRIP);
        } else {
          this.offset += this.close_tag.length - 1;
          return this.token(lexer.tokens.T_CLOSE);
        }
      }
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

module.exports = lexer;