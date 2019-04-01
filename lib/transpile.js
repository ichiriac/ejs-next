/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
"use strict";
var lexer = require('./lexer');

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
  this.code = '';
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
  if (!this.opts.localsName) {
    this.opts.localsName = 'locals';
  }
  if (this.opts.strict) {
    this.write('"use strict";\n');
  }
  this.write('if (arguments.length < 2) {\n');
  this.write('\t' + this.opts.localsName + ' = ejs;\n');
  this.write('\tejs = (typeof global != "undefined" && global.ejs) || (typeof window != "undefined" && window.ejs);\n');
  this.write('\tif(!ejs) return Promise.reject(new Error("EJS module is not loaded"));\n');
  this.write('\tejs = new ejs('+JSON.stringify(this.opts)+');\n');
  this.write('}\n');
  this.write(this.opts.localsName + ' = ' + this.opts.localsName + ' || {};\n');
  this.write('var include = ejs.include.bind(ejs, '+this.opts.localsName+', "'+filename+'");\n');  
  this.write('var block = ejs.block.bind(ejs, '+this.opts.localsName+');\n');  
  this.write('var _$e = ejs.output();\n');  
  this.write('var layout = ejs.layout.bind(ejs, '+this.opts.localsName+', "'+filename+'", _$e);\n');  
  this.setLocalVar(this.opts.localsName);
  this.next().parseBody();
  this.write('\nreturn _$e.toString();\n');
};

/**
 * Generate the sourcemap
 */
generator.prototype.sourcemap = function() {
  var data = {
    "version": 3,
    "sources": [this.filename],
    "names": this.names,
    "mappings": ";;;;;;;;;;;;AAAA",
    "file":this.filename,
    "sourcesContent":this.source
  };
  var buff = new Buffer(JSON.stringify(data));
  return "//# sourceMappingURL=data:application/json;charset=utf-8;base64," + buff.toString('base64');
};

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
    this.mappings.push(
      [this.source_offset, this.code.length]
    );
    this.source_offset = this.source.length;
  }
  this.code += code;
  return this;
};

/**
 * Renders the output
 */
generator.prototype.toString = function() {
  if (this.opts.debug) {
    return this.code + "\n" + this.sourcemap();
  }
  return this.code;
};

/**
 * Check if a local var is used
 */
generator.prototype.isReserved = function(name) {
  name = name.split('.', 2)[0];
  if (reserved[name]) return true;
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
    this.write().nextTok();
  }
  return this;
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
              this.write(varname);
            } else {
              if (!this.isReserved(varname)) {
                if (!this.opts.strict) {
                  varname = varname.split('.');
                  var code = this.opts.localsName;
                  for(var i = 0; i < varname.length; i++) {
                    code = '(' + code + '.' + varname[i] + ' || "")';
                  }
                  this.write(code);
                } else {
                  this.write(this.opts.localsName + '.' + varname);
                }
              } else {
                this.write(varname);
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

/**
 * Define the lexer -> token -> code transformations
 */
var transpile = function(io, buffer, opts, filename) {
  io.input(buffer);
  var out = new generator(io, opts, filename || "eval");
  return out.toString();
};
module.exports = transpile;