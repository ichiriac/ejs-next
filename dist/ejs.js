/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
(function($, w) {
  "use strict";
  
  // lib/lexer.js at Sat Apr 27 2019 01:09:26 GMT+0200 (CEST)
/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */


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
  T_OPT_WS_STRIP:       7,  // <%_
  T_OPT_NL_STRIP:       8,  // -%>
  T_CLOSE_STRIP:        9,  // _%>
  T_SOURCE:             10,  // if (js...)
  T_WHITESPACE:         11, // ' ' || \t || \r || \n 
  T_TEXT:               12, // "..." || '...' || `...` 
  T_COMMENT:            13, // /* ... */ 
  T_IDENTIFIER:         14, // [A-Za-z][A-Za-z0-9]*
  T_OPEN_BRACKET:       15, 
  T_CLOSE_BRACKET:      16,
  T_OPEN_PARA:          17,
  T_CLOSE_PARA:         18,
  T_DBL_COLON:          19,
  T_OPEN_CAPTURE:       20, // {@
  T_CLOSE_CAPTURE:      21  // @}
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
            this.offset++;
            continue;
          }
          if (c == char) break;
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
          if (char == "_" || char == "$" || char == ".") continue;
          this.offset--;
          break;
        }
        if (this.source[this.offset] != "_" || this.prev_offset < this.offset) {
          return this.token(lexer.tokens.T_IDENTIFIER);
        }
      }
      // detect symbols
      if (char == "(") return this.token(lexer.tokens.T_OPEN_PARA);
      if (char == ")") return this.token(lexer.tokens.T_CLOSE_PARA);
      if (char == "{") {
        if (this.source[this.offset + 1] == '@') {
          this.offset++;
          return this.token(lexer.tokens.T_OPEN_CAPTURE);
        }
        return this.token(lexer.tokens.T_OPEN_BRACKET);
      }
      if (char == "@") {
        if (this.source[this.offset + 1] == '}') {
          this.offset++;
          return this.token(lexer.tokens.T_CLOSE_CAPTURE);
        }
      }
      if (char == "}") {
        return this.token(lexer.tokens.T_CLOSE_BRACKET);
      }
      if (char == ":") return this.token(lexer.tokens.T_DBL_COLON);
      if (char == ",") return this.token(lexer.tokens.T_SOURCE);
      if (char == ";") return this.token(lexer.tokens.T_SOURCE);
      if (char == "=") return this.token(lexer.tokens.T_SOURCE);
      // INNER CODES
      do {
        char = this.source[this.offset];
        if (char == this.close_tag[0]) {
          if (this.source.substring(this.offset, this.offset + this.close_tag.length) == this.close_tag) {
            var isStripWs = this.source[this.offset - 1] == this.char_strip;
            var isStripHtml = this.source[this.offset - 1] == this.char_html;
            if (isStripWs || isStripHtml) {
              this.offset --;
            }
            if (this.prev_offset == this.offset) {
              this.state = lexer.states.S_INLINE;
              this.offset += this.close_tag.length;
              if (isStripWs) {
                return this.token(lexer.tokens.T_CLOSE_STRIP);
              } else if (isStripHtml) {
                return this.token(lexer.tokens.T_OPT_NL_STRIP);
              }
              this.offset --;
              return this.token(lexer.tokens.T_CLOSE);
            } else {
              this.offset --;
              return this.token(lexer.tokens.T_SOURCE);
            }
          }
        }
        if ((char == this.char_strip || char == this.char_html) && this.source[this.offset + 1] == this.close_tag[0]) continue;
        if (char == ' ' || char == "\t" || char == "\r" || char == "\n") break;
        if (char >= 'a' && char <= "z") break;
        if (char >= 'A' && char <= "Z") break;
        if (char == '_' || char == "$") break;
        if (char == '(' || char == ")") break;
        if (char == '"' || char == "'" || char == '`') break;
        if (char == '{' || char == "}" || char == ':' || char == '@' || char == '=' || char == ';' || char == ',') break;
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

// lib/transpile.js at Sat Apr 27 2019 01:09:26 GMT+0200 (CEST)
/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */


var SourceListMap = require("source-list-map").SourceListMap;

/**
 * List of reserved keywords in javascript
 */
var reserved = {
  'abstract': true,     'else': true,         'instanceof': true,   'super': true,
  'boolean': true,      'enum': true,         'int': true,          'switch': true,
  'break': true,        'export': true,       'interface': true,    'synchronized': true,
  'byte': true,         'extends': true,      'let': true,          'this': true,
  'case': true,         'false': true,        'long': true,         'throw': true,
  'catch': true,        'final': true,        'native': true,       'throws': true,
  'char': true,         'finally': true,      'new': true,          'transient': true,
  'class': true,        'float': true,        'null': true,         'true': true,
  'const': true,        'for': true,          'package': true,      'try': true,
  'continue': true,     'function': true,     'private': true,      'typeof': true,
  'debugger': true,     'goto': true,         'protected': true,    'var': true,
  'default': true,      'if': true,           'public': true,       'void': true,
  'delete': true,       'implements': true,   'return': true,       'volatile': true,
  'do': true,           'import': true,       'short': true,        'while': true,
  'double': true,       'in': true,           'static': true,       'with': true,
  /** Framework related objects (& globals) **/
  'layout': true,       'include': true,      'block': true,        'Math': true,
  'Array': true,        'Object': true,       'String': true,       'Function': true,
  'Date': true,         'require': true,      'window': true,       'document': true,
  '$': true,            'module': true
};

/**
 * Creates a generator
 */
var generator = function(lexer, opts, filename) {
  this.code = new SourceListMap();
  this.source = '';
  this.source_offset = 0;
  this.lexer = lexer;
  this.locals = [{}];
  this.mappings = [];
  this.filename = filename;
  this.names = [];
  this.useInclude = false;
  this.useLayout = false;
  this.useBlock = false;
  this.opts = opts || {};
  this.helpers = {};
  this.tmp=0;
  if (!this.opts.localsName) {
    this.opts.localsName = 'locals';
  }
  var headers = '';
  if (this.opts.strict) {
    headers += '\n';
  }
  headers += 'if (arguments.length < 2) {\n';
  headers += '\t' + this.opts.localsName + ' = ejs;\n';
  headers += '\tejs = (typeof global != "undefined" && global.ejs) || (typeof window != "undefined" && window.ejs);\n';
  headers += '\tif(!ejs) return Promise.reject(new Error("EJS module is not loaded"));\n';
  headers += '\tejs = new ejs('+JSON.stringify(this.opts)+');\n';
  headers += '}\n';
  headers += this.opts.localsName + ' = ' + this.opts.localsName + ' || {};\n';
  headers += 'var include = ejs.include.bind(ejs, '+this.opts.localsName+', "'+filename+'");\n';
  headers += 'var block = ejs.block.bind(ejs, '+this.opts.localsName+');\n';
  headers += 'var _$e = ejs.output();\n';
  headers += 'ejs._output = _$e;\n';
  headers += 'var layout = ejs.layout.bind(ejs, '+this.opts.localsName+', "'+filename+'", _$e);\n';
  this.setLocalVar(this.opts.localsName);
  this.next().parseBody();
  for(var k in this.helpers) {
    headers += 'var '+k+' = ejs.constructor.__fn.' + k + '.bind(ejs, '+this.opts.localsName+');\n';
  }
  if (this.tmp  > 0) {
    headers += 'var f1=null';
    for(var t = 1; t < this.tmp; t++) {
      headers += ',f' + (t + 1) + '=null';  
    }
    headers += ';\n';
  }

  this.code.preprend(headers);
  this.write('\nreturn _$e.toString();\n');
};

generator.__fn = {};

/**
 * Reads the next token
 */
generator.prototype.next = function() {
  this.tok = this.lexer.next();
  this.source += this.tok[1];
  if (this.tok[1] == '{') {
    this.inObject = true;
  }
  if (this.tok[1] == '}') {
    this.inObject = false;
  }
  if (this.tok[1] == ':') {
    this.inKey = true;
  } else {
    this.inKey = false;
  }

  return this;
};

/**
 * Reads the next token, strips comments or white spaces
 */
generator.prototype.nextTok = function() {
  this.next();
  while (this.tok[0] == lexer.tokens.T_WHITESPACE  || this.tok[0] == lexer.tokens.T_COMMENT) {
    this.write().next();
    if (this.tok[0] == lexer.tokens.T_EOF) break;
  }
  return this;
};

/**
 * Writing the output
 */
generator.prototype.write = function(code) {
  if (!code) code = this.tok[1];
  if (this.source_offset != this.source.length) {
    this.code.add(code, this.filename, this.source.substring(this.source_offset, this.source.length));
    this.source_offset = this.source.length;
  } else {
    this.code.add(code);
  }
  return this;
};

/**
 * Renders the output
 */
generator.prototype.toString = function() {
  var out = this.code.toStringWithSourceMap();
  out.map.sourcesContent = this.source;
  var buff = new Buffer(JSON.stringify(out.map));
  return out.source; // + "\n//# sourceMappingURL=data:application/json;charset=utf-8;base64," + buff.toString('base64');
};

/**
 * Check if a local var is used
 */
generator.prototype.isReserved = function(name) {
  name = name.split('.', 2)[0];
  if (reserved[name]) return true;
  if (generator.__fn[name]) return true;
  for(var i = this.locals.length - 1; i > -1; i--) {
    if (this.locals[i][name]) return true;
  }
  return false;
};

/**
 * Sets a local varname
 */
generator.prototype.setLocalVar = function(name) {
  if (!name) name = this.tok[1];
  this.locals[this.locals.length - 1][name] = true;
  return this;
}

/**
 *
 */
generator.prototype.parseValue = function(stop) {
  while(this.tok[0] != lexer.tokens.T_EOF) {
    if (this.tok[1] == stop) return this;
    if (this.tok[1] == '(') {
      this.write().nextTok().parseValue(')');
    }
    if (this.tok[1] == '{') {
      this.write().nextTok().parseValue('}');
    }
    if (this.tok[1] == '[') {
      this.write().nextTok().parseValue(']');
    }
    if (this.tok[1] == 'function') {
      this.write().nextTok().parseFunction();
    }
    if (!stop && (this.tok[1] == ';' || this.tok[1] == ',')) return this;
    
    if (this.tok[0] == lexer.tokens.T_IDENTIFIER) {
      var varname = this.tok[1];
      this.nextTok();
      if (this.inObject && this.inKey) {
        this.write(varname + ' ');
      } else {
        if (!this.isReserved(varname)) {
          if (!this.opts.strict) {
            this.safeVar(varname);
          } else {
            this.write(this.opts.localsName + '.' + varname  + ' ');
          }
        } else {
          if (generator.__fn[varname]) {
            if (!this.helpers[varname]) {
              this.helpers[varname] = true;
            }
            this.write(varname + ' ');
          } else {
            this.write(varname + ' ');
          }
        }
      }
    } else {
      this.write().nextTok();
    }
  }
  return this;
};

/**
 * Generates a safe variable output
 */
generator.prototype.safeVar = function(varname) {
  varname = varname.split('.');
  var code = this.opts.localsName;
  if (this.tok[1] == '(') {
    // check function :
    for(var i = 0; i < varname.length - 1; i++) {
      code = '(' + code + '.' + varname[i] + ' || "")';
    }
    this.write('(( (f'+(++this.tmp)+' = ' + code  + ') && f'+(this.tmp)+' && typeof f'+this.tmp+'["'+varname[varname.length - 1]+'"] == "function") ? f'+this.tmp+'["'+varname[varname.length - 1]+'"](');
    this.nextTok().parseValue(')');
    this.write('): "") ').nextTok();
  } else {
    for(var i = 0; i < varname.length; i++) {
      code = '(' + code + '.' + varname[i] + ' || "")';
    }
    this.write(code  + ' ');
  }
};

/**
 * Parsing a variable
 */
generator.prototype.parseVar = function() {
  if (this.tok[0] == lexer.tokens.T_IDENTIFIER) {
    this.setLocalVar().write().nextTok();
  }
  if (this.tok[1] == '=') {
    // read var contents
    this.write().nextTok().parseValue();
  }
  if (this.tok[1] == ',') {
    // next var
    this.write().nextTok().parseVar();
  }
  if (this.tok[1] == ';') {
    return this.write().nextTok();
  }
};

/**
 * Parsing a closure structure
 */
generator.prototype.parseFunction = function(isOut) {
  if (this.tok[0] == lexer.tokens.T_IDENTIFIER) {
    this.setLocalVar().write().nextTok();
  }
  this.locals.push({});
  if (this.tok[0] == lexer.tokens.T_OPEN_PARA) this.write() && this.nextTok();
  if (this.tok[0] == lexer.tokens.T_IDENTIFIER) {
    this.setLocalVar().write().nextTok();
  }
  while(this.tok[1] == ',') {
    this.write().nextTok();
    if (this.tok[0] == lexer.tokens.T_CLOSE_PARA) {
      break;
    }
    this.setLocalVar().write().nextTok();
  }
  if (this.tok[0] == lexer.tokens.T_CLOSE_PARA) this.write().nextTok();
  if (this.tok[0] == lexer.tokens.T_OPEN_CAPTURE) {
    this.write("{\nvar _$e = ejs.output();\n"); 
    this.nextTok().parseBody(lexer.tokens.T_CLOSE_CAPTURE);
    this.write("\nreturn _$e.toString();\n}" + (isOut ? ')' : ''));
    if (this.tok[0] == lexer.tokens.T_CLOSE_CAPTURE) this.nextTok();
  } else {
    if (this.tok[0] == lexer.tokens.OPEN_BRACKET) this.write().nextTok();
    this.parseBody(lexer.tokens.CLOSE_BRACKET);
    if (this.tok[0] == lexer.tokens.CLOSE_BRACKET) this.write().nextTok();
  }
  this.locals.pop();
};

/**
 * Iterate over tokens
 */
generator.prototype.parseBody = function(escape) {
  while(true) {
    if (this.tok[0] == lexer.tokens.T_INLINE) {
      // we are inside an html chunk
      var source = this.tok[1];
      if (this.next().tok[0] == lexer.tokens.T_OPT_WS_STRIP) {
        source = source.replace(/[ \t]+$/, '');
      }
      if (source.length > 0) {
        this.write('_$e.write(`' + source.replace('`', '\\`') + '`);\n');
      }
    } else if (this.tok[0] == lexer.tokens.T_EOF || this.tok[0] == escape) {
      // no more tokens
      break;
    } else if (this.tok[0] == lexer.tokens.T_OPT_COMMENT) {
      // comments
      this.write('/* ' + this.tok[1].replace('/', '?') + ' */\n').next();
    } else {
      // inner code block
      var out = false;
      if (this.tok[0] == lexer.tokens.T_OPT_OUTPUT) {
        this.write('_$e.write(');
        out = true;
        this.nextTok();
      } else if (this.tok[0] == lexer.tokens.T_OPT_CLEAN_OUTPUT) {
        this.write('_$e.safe_write(');
        out = true;
        this.nextTok();
      } else if (this.tok[0] == lexer.tokens.T_OPEN || this.tok[0] == lexer.tokens.T_OPT_WS_STRIP) {
        out = false;
        this.nextTok();
      }
      
      while(this.tok[0] != lexer.tokens.T_EOF) {
        if (this.tok[0] == lexer.tokens.T_CLOSE) break;
        if (this.tok[0] == lexer.tokens.T_CLOSE_STRIP) break;
        if (this.tok[0] == lexer.tokens.T_OPT_NL_STRIP) break;
        if (this.tok[0] == escape) return this;
        if (this.tok[0] == lexer.tokens.T_IDENTIFIER) {
          if (this.tok[1] == 'function') {
            this.write().nextTok().parseFunction(out);
          } else if (this.tok[1] == 'var' || this.tok[1] == 'let' || this.tok[1] == 'const') {
            this.write('var').nextTok().parseVar();
            continue;
          } else {
            var varname = this.tok[1];
            this.nextTok();
            if (this.inObject && this.inKey) {
              this.write(varname + ' ');
            } else {
              if (!this.isReserved(varname)) {
                if (!this.opts.strict) {
                  this.safeVar(varname);
                } else {
                  this.write(this.opts.localsName + '.' + varname  + ' ');
                }
              } else {
                if (generator.__fn[varname]) {
                  if (!this.helpers[varname]) {
                    this.helpers[varname] = true;
                  }
                  this.write(varname + ' ');
                } else {
                  this.write(varname + ' ');
                }
              }
            }
            continue;
          }
        } else {
          this.write();
        }
        this.nextTok();
      }
      if (out) {
        this.write(');\n');
      } else {
        this.write(';');
      }
      var strip = this.tok[0];
      if (this.next().tok[0] == lexer.tokens.T_INLINE) {
        if (strip == lexer.tokens.T_CLOSE_STRIP) {
          // strip spaces on next inline token
          this.tok[1] = this.tok[1].replace(/^[ \t]*\n?/, '');
        } else if (strip == lexer.tokens.T_OPT_NL_STRIP) {
          // @fixme need to check the spec on what to strip ?
          this.tok[1] = this.tok[1].replace(/^[ \t]*\n?/, '');
        }
      }
    }
  }
  return this;
};

// lib/output.js at Sat Apr 27 2019 01:09:26 GMT+0200 (CEST)
/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */


/**
 * Output handler
 */
var output = function() {
  this.hook = null;
  this.output = [];
  this.offset = -1;
  this.sanitize = [];
  this.isPromise = true;
};

/**
 * Sanitize the string
 */
var sanitizeRegex = /[&<>'\"]/g;
output.sanitize = function(str) {
  if (typeof str != "string") str = str.toString();
  return str.replace(sanitizeRegex, function(c) {
    if (c == '&') return '&amp;';
    if (c == '<') return '&lt;';
    if (c == '>') return '&gt;';
    if (c == '"') return '&#34;';
    if (c == "'") return '&#39;';
    return c;
  });
};

output.prototype.buffer = function(msg) {

  /**
   * Buffers current state
   */
  var hook = this.hook;
  var output = this.output;
  var offset = this.offset;
  var sanitize = this.sanitize;
  var isPromise = this.isPromise;

  /**
   * Re-initialize buffers
   */
  this.hook = null;
  this.output = [];
  this.offset = -1;
  this.sanitize = [];
  this.isPromise = true;

  /**
   * Flush contents
   */
  return function() {
    var result = this.toString();
    this.hook = hook;
    this.output = output;
    this.offset = offset;
    this.sanitize = sanitize;
    this.isPromise = isPromise;
    return result;
  }.bind(this);
};

/**
 * Outputs a string
 */
output.prototype.write = function(msg) {
  if (msg == null) return;
  var isString = typeof msg == "string";
  if (!isString && typeof msg.then != "function") {
    msg = msg.toString();
    isString = true;
  }
  if (isString) {
    if (this.isPromise) {
      this.output.push(msg);
      this.isPromise = false;
      this.offset++;
    } else {
      this.output[this.offset] += msg;
    }
  } else {
    this.isPromise = true;
    this.offset ++;
    this.output.push(msg);
  }
};

/**
 * safe mode
 */ 
output.prototype.safe_write = function(msg) {
  if (msg == null) return;
  var isString = typeof msg == "string";
  if (!isString && typeof msg.then != "function") {
    msg = msg.toString();
    isString = true;
  }
  if (isString) {
    if (this.isPromise) {
      this.output.push(output.sanitize(msg));
      this.isPromise = false;
      this.offset++;
    } else {
      this.output[this.offset] += output.sanitize(msg);
    }  
  } else {
    this.isPromise = true;
    this.offset ++;
    this.sanitize.push(this.offset);
    this.output.push(msg);
  }
};

/**
 * Renders the output
 */
output.prototype.toString = function() {
  var result;
  if (this.offset == -1) {
    result = "";
  } else if (this.offset == 0) {
    result = this.output[0];
  } else {
    result = Promise.all(this.output).then(function(parts) {
      for(var i = 0, l = this.sanitize.length; i < l; i++) {
        var offset = this.sanitize[i];
        parts[offset] = output.sanitize(parts[offset] == null ? "": parts[offset]);
      }
      return parts.join('');
    }.bind(this));
  }
  if (this.hook) {
    if (result.then) {
      return result.then(function(result) {
        return this.hook(result);
      }.bind(this));
    }
    result = this.hook(result);
  }
  return result;  
};

// lib/ejs.js at Sat Apr 27 2019 01:09:26 GMT+0200 (CEST)
/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */






/**
 * Layer engine constructor
 */
var ejs = function(opts) {
  if (!opts) opts = {};
  this.options = {
    cache: opts.cache || false,
    strict: opts.strict || false,
    localsName: opts.localsName || 'locals',
    root: opts.root || '/'
  };
  this._session = {};
};

/**
 * List of cached items
 * @see options.cache = true
 */
ejs.__cache = {};

/**
 * List of registered helpers
 * @see ejs.registerFunction
 */
ejs.__fn = {};

/**
 * Compiles a buffer
 * @return Function(any): Promise<string>
 */
ejs.prototype.compile = function(buffer, filename)  {
  if (this.options.cache && ejs.__cache.hasOwnProperty(buffer)) {
    return ejs.__cache[buffer];
  }
  var io = new lexer();
  io.input(buffer);
  var out = new transpile(io, this.options, filename || "eval");
  var code = out.toString();
  try {
    var fn = new Function('ejs,' + this.options.localsName, code).bind(null, this);
    if (this.options.cache) {
      ejs.__cache[buffer] = fn;
    }
    return fn;
  } catch(e) {
    var line = e.lineNumber ? e.lineNumber - 6 : 1;
    var se = new SyntaxError(e.message, filename, line);
    se.stack = e.message + "\n    at " + filename + ":" + line + "\n" + se.stack.split(/\n/g).slice(4).join("\n");
    throw se;
  }
};

/**
 * shortcut to ejs.prototype.compile
 * @return Function(any): Promise<string>
 */
ejs.compile = function(str, options) {
  var instance = new ejs(options);
  return instance.compile(str);
};

/**
 * Renders the specified template using the specified data
 * @return Promise<string>
 */
ejs.prototype.render = function(str, data) {
  var result = this.compile(str)(data);
  if (typeof result.then == "function") {
    return result;
  }
  return Promise.resolve(result);
};

/**
 * Output serializer
 */
ejs.prototype.output = function() {
  return new output();
};

/**
 * Shortcut to ejs.prototype.render
 * @return Promise<string> | <string>
 */
ejs.render = function(str, data, options) {
  var instance = new ejs(options);
  return instance.render(str, data);
};

/**
 * Include a file
 */
ejs.prototype.include = function(ctx, from, filename, args) {
  if (typeof args == 'function') {
    args =  { contents: args() };
  }
  if (typeof args == 'string') {
    args =  { contents: args };
  }
  return this.renderFile(
    this.resolveInclude(filename, from), 
    Object.assign({}, ctx, args || {})
  );
};

/**
 * Registers a layout output
 */
ejs.prototype.layout = function(ctx, from, output, filename, args) {
  var self = this;
  output.hook = function(contents) {
    args = Object.assign({}, ctx, args || {});
    args.contents = contents;
    return self.renderFile(
      self.resolveInclude(filename, from), 
      args      
    );
  };
  return null;
};

/**
 * Registers blocks
 */
ejs.prototype.block = function(ctx, name, value) {
  if (!name) return null;
  if (!this._session[name]) {
    this._session[name] = this.output();
  }
  if (arguments.length == 3) {
    if (typeof value == 'function') {
      var output = this._output.buffer();
      value();
      value = output();
    }
    this._session[name].write(value);
    return this._session[name];
  }
  return this._session[name].toString();
};

/**
 * Resolves a path
 */
ejs.prototype.resolveInclude = function(filename, from, isDir) {
  if (!from || from == 'eval') {
    from = this.options.root;
    isDir = true;
  }
  if (filename[0] == '/')  {
    filename = './' + filename.replace(/^\/*/, '');
    from = this.options.root;
    isDir = true;
  }  
  return ejs.resolveInclude(filename, from, isDir);
};

/**
 * Resolves a path
 */
ejs.resolveInclude = function(filename, from, isDir) {
  if (from) {
    if (!isDir) {
      from = path.dirname(from);
    }
    filename = path.resolve(from, filename);
  }
  if (!path.extname(filename)) {
    filename += '.ejs';
  }
  return filename;
};

/**
 * Registers a function
 */
ejs.registerFunction = function(name, cb) {
  ejs.__fn[name] = cb;
  transpile.__fn[name] = true;
};

/**
 * Renders the specified template using the specified data
 * @return Promise<string>
 */
ejs.prototype.renderFile = function(filename, data) {
  var self = this;
  return new Promise(function(resolve, reject) {
    if (filename.substring(0, self.options.root.length) != self.options.root) {
      filename = ejs.resolveInclude(filename, self.options.root, true);
    }
    var run = function(str) {
      try {
        var fn = self.compile(str.toString(), filename);
        var result = fn(data);
        if (result && typeof result.then == "function") {
          result.then(resolve).catch(reject);
        } else {
          resolve(result);
        }
      } catch(e) {
        return reject(e);
      }
    };
    if (self.options.cache && ejs.__cache.hasOwnProperty(filename)) {
      run(ejs.__cache[filename]);
    } else {
      fs.readFile(filename, function(err, str) {
        if (err) {
          return reject(err);
        }
        if (self.options.cache) ejs.__cache[filename] = str;
        run(str);
      });
    }
  });
};

/**
 * Shortcut to ejs.prototype.renderFile
 * @return Promise<string>
 */
ejs.renderFile = function(filename, data, options) {
  var instance = new ejs(options);
  return instance.renderFile(filename, data);
};

/**
 * Express.js support.
 *
 * This is an alias for {@link module:ejs.renderFile}, in order to support
 * Express.js out-of-the-box.
 *
 * @func
 */
ejs.__express = function(filename, data, cb) {
  var opt = {};
  if (data.settings) {
    if (data.settings['view cache']) {
      opt.cache = true;
    }
    if (data.settings['views']) {
      opt.root = data.settings['views'];
    }
  }
  ejs.renderFile(filename, data, opt).then(function(output) {
    if (cb && typeof cb == 'function') {
      cb(null, output);
    } else {
      throw new Error('No response callback');
    }
  }).catch(function(err) {
    if (cb && typeof cb == 'function') {
      cb(err, null);
    } else throw err;
  });
};

/**
 * Expose it as a global for standalone (serialized ?) functions
 */
if (typeof window !== 'undefined') {
  window.ejs = ejs;
} else if (typeof global !== 'undefined') {
  global.ejs = ejs;
}



  // global definition (window.ejs)
  if (w) {
    w['ejs'] = ejs;
  }
  // amd definition (define(['ejs'], function() ...))
  if(typeof define === 'function' && define.amd) {
    define('ejs', ejs);
  }
  // define the jquery helper
  if ($ && $.fn) {
    $.fn.extend({
      ejs: function(data, options) {
        var opt = $.fn.ejs.options;
        if (options) {
          opt = $.extend(true, opt, options);
        }
        var ejs = new ejs(opt);
        return this.each(function() {
          var tpl = $(this).html();
          ejs.compile(tpl)(data).then(function(str) {
            $(this).html(str);
          }.bind(this)).catch(function(err) {
            $(this).html(
              '<pre class="ejs-error">' + err.toString() + '</pre>'
            );
          });
        });
      }
    });
    // default options
    $.fn.ejs.options = {};
  }
})(jQuery, window);