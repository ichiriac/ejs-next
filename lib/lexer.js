/**
 * Copyright (C) 2025 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs-next/graphs/contributors
 * @url https://ejs.js.org
 */
"use strict";

var lexer = function (delimiter) {
  if (!delimiter) delimiter = "%";
  this.open_tag = "<" + delimiter;
  this.close_tag = delimiter + ">";
  this.char_comment = "#";
  this.char_output = "=";
  this.char_html = "-";
  this.char_strip = "_";
  this.char_ignore = delimiter;
};

/**
 * List of tokens
 */
lexer.tokens = {
  T_EOF: 0, //
  T_INLINE: 1, // ...
  T_OPEN: 2, // <%
  T_CLOSE: 3, // %>
  T_OPT_COMMENT: 4, // <%#
  T_OPT_CLEAN_OUTPUT: 5, // <%=
  T_OPT_OUTPUT: 6, // <%-
  T_OPT_WS_STRIP: 7, // <%_
  T_OPT_NL_STRIP: 8, // -%>
  T_CLOSE_STRIP: 9, // _%>
  T_SOURCE: 10, // if (js...)
  T_TEXT: 12, // "..." || '...' || `...`
  T_COMMENT: 13, // /* ... */
};

/**
 * DEFINE LEXER STATES
 */
lexer.states = {
  S_INLINE: 0,
  S_TAG: 1,
  S_SOURCE: 2,
};

/**
 * Initialize the lexer with source contents
 */
lexer.prototype.input = function (source) {
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
lexer.prototype.token = function (type) {
  var src =
    this.prev_offset > this.lastOffset
      ? null
      : this.source.substring(this.prev_offset, this.offset + 1);
  this.current = [type, src, this.prev_offset, this.offset + 1];
  return this.current;
};

/**
 * Lexing the next token
 */
lexer.prototype.next = function () {
  var char;
  this.prev_offset = this.offset + 1;
  while (++this.offset < this.lastOffset) {
    if (this.state === lexer.states.S_INLINE) {
      this.offset = this.source.indexOf(this.open_tag, this.offset);
      if (this.offset === -1) {
        this.offset = this.lastOffset;
      } else {
        if (this.source[this.offset + 2] === this.char_ignore) {
          continue;
        }
        this.state = lexer.states.S_TAG;
        this.offset--;
        return this.token(lexer.tokens.T_INLINE);
      }
    } else if (this.state === lexer.states.S_TAG) {
      char = this.source[this.offset];
      if (char === this.open_tag[0]) {
        this.state = lexer.states.S_SOURCE;
        this.offset += this.open_tag.length;
        char = this.source[this.offset];
        switch (char) {
          case this.char_comment:
            this.state = lexer.states.S_INLINE;
            this.offset = this.source.indexOf(this.close_tag, this.offset);
            if (this.offset == -1) {
              this.offset = this.lastOffset;
            } else this.offset += this.close_tag.length - 1;
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
        if (char == this.char_strip) {
          this.offset += this.close_tag.length;
          return this.token(lexer.tokens.T_CLOSE_STRIP);
        } else if (char == this.char_html) {
          this.offset += this.close_tag.length;
          return this.token(lexer.tokens.T_OPT_NL_STRIP);
        } else {
          this.offset += this.close_tag.length - 1;
          return this.token(lexer.tokens.T_CLOSE);
        }
      }
    } else {
      char = this.source[this.offset];

      // scan texts
      if (char == "'" || char == '"' || char == "`") {
        while (++this.offset < this.lastOffset) {
          var c = this.source[this.offset];
          if (c == "\\") {
            this.offset++;
            continue;
          }
          if (c == char) break;
        }
        return this.token(lexer.tokens.T_TEXT);
      }

      // scan multi-line comments
      if (char == "/" && this.source[this.offset + 1] == "*") {
        while (++this.offset < this.lastOffset) {
          char = this.source[this.offset];
          if (char == "*" && this.source[this.offset + 1] == "/") {
            ++this.offset;
            break;
          }
        }
        return this.token(lexer.tokens.T_COMMENT);
      }

      // scan single-line comments
      if (char == '#' || (char == "/" && this.source[this.offset + 1] == "/")) {
        while (++this.offset < this.lastOffset) {
          char = this.source[this.offset];
          if (char == this.close_tag[0]) {
            if (
              this.source.substring(
                this.offset,
                this.offset + this.close_tag.length
              ) == this.close_tag
            ) {
              this.state = lexer.states.S_TAG;
              if (
                this.source[this.offset - 1] == this.char_strip ||
                this.source[this.offset - 1] == this.char_html
              ) {
                this.offset -= 2;
              } else this.offset--;
              break;
            }
          }
          if (char == "\r" || char == "\n") {
            this.offset--;
            break;
          }
        }
        return this.token(lexer.tokens.T_COMMENT);
      }

      do {
        char = this.source[this.offset];
        if (char == this.close_tag[0]) {
          if (
            this.source.substring(
              this.offset,
              this.offset + this.close_tag.length
            ) == this.close_tag
          ) {
            this.state = lexer.states.S_TAG;
            if (
              this.source[this.offset - 1] == this.char_strip
              || this.source[this.offset - 1] == this.char_html
            ) {
              this.offset--;
            }
            break;
          }
        }
        if (char == "'" || char == '"' || char == "`") {
          break;
        }
        if (char == "/" && this.source[this.offset + 1] == "*") {
          break;
        }
        if (char == "#" || (char == "/" && this.source[this.offset + 1] == "/")) {
          break;
        }
      } while (++this.offset < this.lastOffset);
      this.offset--;
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
