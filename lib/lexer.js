/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
/*jslint node: true */
"use strict";

var lexer = function() {
  this.open_tag = '<%';
  this.close_tag = '%>';
  this.char_comment = '#';
  this.char_output = '=';
  this.char_html = '-';
  this.char_strip = '_';
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
  T_WHITESPACE:         10, // ' ' || \t || \r || \n 
  T_TEXT:               11, // "..." || '...' || `...` 
  T_COMMENT:            12, // /* ... */ 
  T_IDENTIFIER:         13, // [A-Za-z][A-Za-z0-9]*
  T_OPEN_BRACKET:       14, 
  T_CLOSE_BRACKET:      15,
  T_OPEN_PARA:          16,
  T_CLOSE_PARA:         17,
  T_DBL_COLON:          18
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
  var char;
  this.prev_offset = this.offset + 1;
  while(++this.offset < this.lastOffset) {
    if (this.state === lexer.states.S_INLINE) {
      this.offset = this.source.indexOf(this.open_tag, this.offset);
      if (this.offset === -1) {
        this.offset = this.lastOffset;
      } else {
        if (this.source[this.offset + 2] === this.char_ignore) {
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
      char = this.source[this.offset];
      // scan white space
      if (char == " " || char == "\n" || char == "\t" || char == "\r") {
        while(++this.offset < this.lastOffset) {
          char = this.source[this.offset];
          if (char != " " && char != "\n" && char != "\t" && char != "\r") {
            this.offset--;
            break;
          }
        }
        return this.token(lexer.tokens.T_WHITESPACE);
      }
      // scan texts
      if (char == "'" || char == '"' || char == "`") {
        while(++this.offset < this.lastOffset) {
          var c = this.source[this.offset];
          if (c == "\\") {
            ++this.offset;
            continue;
          }
          if (c === char) break;
        }
        return this.token(lexer.tokens.T_TEXT);
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
        return this.token(lexer.tokens.T_COMMENT);
      }
      // detect identifier
      if ((char >= "a" && char <= "z") || (char >= "A" && char <= "Z") || char == "_" || char == "$") {
        while(++this.offset < this.lastOffset) {
          char = this.source[this.offset];
          if (char >= "a" && char <= "z") continue;
          if (char >= "A" && char <= "Z") continue;
          if (char >= "0" && char <= "9") continue;
          if (char == "_" || char == "$") continue;
          // @fixme _%>
          this.offset--;
          break;
        }
        return this.token(lexer.tokens.T_IDENTIFIER);
      }
      // detect symbols
      if (char == "(") return this.token(lexer.tokens.T_OPEN_PARA);
      if (char == ")") return this.token(lexer.tokens.T_CLOSE_PARA);
      if (char == "{") return this.token(lexer.tokens.T_OPEN_BRACKET);
      if (char == "}") return this.token(lexer.tokens.T_CLOSE_BRACKET);
      if (char == ":") return this.token(lexer.tokens.T_DBL_COLON);
      // INNER CODES
      do {
        char = this.source[this.offset];
        if (char == this.close_tag[0]) {
          if (this.source.substring(this.offset, this.offset + this.close_tag.length) == this.close_tag) {
            var isStripWs = this.source[this.offset - 1] === this.char_strip;
            var isStripHtml = this.source[this.offset - 1] === this.char_html;
            if (this.prev_offset == this.offset) {
              this.state = lexer.states.S_INLINE;
              this.offset += this.close_tag.length - 1;
              if (isStripWs) {
                this.prev_offset --;
                return this.token(lexer.tokens.T_OPT_WS_STRIP);
              } else if (isStripHtml) {
                this.prev_offset --;
                return this.token(lexer.tokens.T_OPT_NL_STRIP);
              }
              return this.token(lexer.tokens.T_CLOSE);
            } else {
              this.offset --;
              return this.token(lexer.tokens.T_SOURCE);
            }
          }
        }
        if (char == ' ' || char == "\t" || char == "\r" || char == "\n") break;
        if (char >= 'a' && char <= "z") break;
        if (char >= 'A' && char <= "Z") break;
        if (char == '_' || char == "$") break;
        if (char == '(' || char == ")") break;
        if (char == '{' || char == "}" || char == ':') break;
      } while(++this.offset < this.lastOffset);
      this.offset --;
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