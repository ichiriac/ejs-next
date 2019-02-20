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
  T_OPT_IGNORE:         7,  // <%% | %%>
  T_OPT_WS_STRIP:       8,  // <%_ | _%>
  T_SOURCE:             9,  // if (js...)
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
};

/**
 * Generates an token
 */
lexer.prototype.token = function(type, from) {
  var src = from > this.lastOffset ? null: this.source.substring(from + 1, this.offset + 1);
  return [type, src, from + 1, this.offset + 1];
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
  var start = this.offset;
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
        if (this.offset < this.lookupOffset && this.source[this.offset + 1] === this.delimiter) {
          // flushing
          this.state = lexer.states.S_TAG;
          this.offset --;
          return this.token(lexer.tokens.T_INLINE, start);
        }
      }
    } else if (this.state === lexer.states.S_TAG) {
      // OUTPUT EJS TAGS
      if (char === this.open_tag) {        
        if (this.offset < this.lastOffset && this.source[this.offset + 1] === this.delimiter) {
          this.col ++;
          this.offset ++;
          // flushing
          return this.token(lexer.tokens.T_OPEN, start);
        } else {
          throw new Error('Lexing error, expecting ' + this.delimiter);
        }
      } else if (char === this.delimiter) {
        if (this.offset < this.lastOffset && this.source[this.offset + 1] === this.close_tag) {
          this.col ++;
          this.offset ++;
          // flushing
          this.state = lexer.states.S_INLINE;
          return this.token(lexer.tokens.T_CLOSE, start);
        } else {
          // flushing
          return this.token(lexer.tokens.T_OPT_IGNORE, start);
        }
      } else if (char === '#') {
        // flushing
        return this.token(lexer.tokens.T_OPT_COMMENT, start);
      } else if (char === '=') {
        // flushing
        return this.token(lexer.tokens.T_OPT_CLEAN_OUTPUT, start);
      } else if (char === '-') {
        // flushing
        return this.token(lexer.tokens.T_OPT_OUTPUT, start);
      } else if (char === '_') {
        // flushing
        return this.token(lexer.tokens.T_OPT_WS_STRIP, start);
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
          return this.token(lexer.tokens.T_SOURCE, start);
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
          return this.token(lexer.tokens.T_SOURCE, start);
        }
      }
    } // never goes on else
  }
  if (start === this.offset) {
    return this.token(lexer.tokens.T_EOF, start);
  } else {
    return this.token(lexer.tokens.T_INLINE, start);
  }
};

module.exports = lexer;