/**
 * Copyright (C) 2022 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
"use strict";
var lexer = require("./lexer");
var SourceListMap = require("source-list-map").SourceListMap;

/**
 * List of reserved keywords in javascript
 */
var reserved = {
  abstract: true,
  else: true,
  instanceof: true,
  super: true,
  boolean: true,
  enum: true,
  int: true,
  switch: true,
  break: true,
  export: true,
  interface: true,
  synchronized: true,
  byte: true,
  extends: true,
  let: true,
  this: true,
  case: true,
  false: true,
  long: true,
  throw: true,
  catch: true,
  final: true,
  native: true,
  throws: true,
  char: true,
  finally: true,
  new: true,
  transient: true,
  class: true,
  float: true,
  null: true,
  true: true,
  const: true,
  for: true,
  package: true,
  try: true,
  continue: true,
  function: true,
  private: true,
  typeof: true,
  debugger: true,
  goto: true,
  protected: true,
  var: true,
  default: true,
  if: true,
  public: true,
  void: true,
  delete: true,
  implements: true,
  return: true,
  volatile: true,
  do: true,
  import: true,
  short: true,
  while: true,
  double: true,
  in: true,
  static: true,
  with: true,
  /** Framework related objects (& globals) **/
  layout: true,
  include: true,
  block: true,
  Math: true,
  Array: true,
  Object: true,
  String: true,
  Function: true,
  Date: true,
  Error: true,
  TypeError: true,
  SyntaxError: true,
  ReferenceError: true,
  RangeError: true,
  EvalError: true,
  URIError: true,
  Number: true,
  Symbol: true,
  BigInt: true,
  RegExp: true,
  Promise: true,
  Map: true,
  Set: true,
  WeakMap: true,
  WeakSet: true,
  Reflect: true,
  Proxy: true,
  Intl: true,
  console: true,
  Boolean: true,
  RegExp: true,
  Number: true,
  parseInt: true,
  parseFloat: true,
  isNaN: true,
  isFinite: true,
  eval: true,
  JSON: true,
  console: true,
  global: true,
  require: true,
  window: true,
  JSON: true,
  document: true,
  $: true,
  module: true,
  const: true,
  let: true,
  await: true,
  async: true,
};

/**
 * Creates a generator
 */
var generator = function (lexer, opts, filename) {
  if (!this) {
    lexer.input(opts);
    var tr = new generator(lexer, filename, "eval");
    return tr.toString();
  }
  this.opts = opts || {};
  if (this.opts.sourcemap) {
    this.code = new SourceListMap();
  } else {
    this.code = [];
  }
  this.source = "";
  this.source_offset = 0;
  this.lexer = lexer;
  this.locals = [{}];
  this.mappings = [];
  this.filename = filename;
  this.names = [];
  this.useInclude = false;
  this.useLayout = false;
  this.useBlock = false;
  this.inObject = 0;
  this.helpers = {};
  this.tmp = 0;
  if (!this.opts.localsName) {
    this.opts.localsName = "locals";
  }
  var headers = "";
  if (this.opts.strict) {
    headers += '"use strict";';
  }
  headers += "if (arguments.length < 2) {\n";
  headers += "\t" + this.opts.localsName + " = ejs;\n";
  headers +=
    '\tejs = (typeof global != "undefined" && global.ejs) || (typeof window != "undefined" && window.ejs);\n';
  headers +=
    '\tif(!ejs) return Promise.reject(new Error("EJS module is not loaded"));\n';
  headers += "\tejs = new ejs(" + JSON.stringify(this.opts) + ");\n";
  headers += "}\n";
  headers += this.opts.localsName + " = " + this.opts.localsName + " || {};\n";
  headers +=
    "var include = ejs.include.bind(ejs, " +
    this.opts.localsName +
    ", " +
    JSON.stringify(filename) +
    ");\n";
  headers += "var block = ejs.block.bind(ejs, " + this.opts.localsName + ");\n";
  headers += "var _$e = ejs.output();\n";
  headers += "ejs._output = _$e;\n";
  headers +=
    this.opts.localsName + "._filename = " + JSON.stringify(filename) + ";\n";
  headers += this.opts.localsName + "._include = include;\n";
  headers += this.opts.localsName + "._output = _$e;\n";
  headers += "var echo = _$e.safe_write.bind(_$e);\n";
  headers += "var write = _$e.write.bind(_$e);\n";
  headers +=
    "var layout = ejs.layout.bind(ejs, " +
    this.opts.localsName +
    ", " +
    JSON.stringify(filename) +
    ", _$e);";
  this.setLocalVar(this.opts.localsName);
  this.setLocalVar("echo");
  this.setLocalVar("write");
  this.next().parseBody();
  for (var k in this.helpers) {
    headers +=
      "var " +
      k +
      " = ejs.constructor.__fn." +
      k +
      ".bind(ejs, " +
      this.opts.localsName +
      ");";
  }
  if (this.tmp > 0) {
    headers += "var f1=null";
    for (var t = 1; t < this.tmp; t++) {
      headers += ",f" + (t + 1) + "=null";
    }
    headers += ";";
  }
  if (this.opts.sourcemap) {
    this.code.preprend(headers);
  } else {
    this.code.unshift(headers);
  }
  this.write("\nreturn _$e.toString();\n");
};

generator.__fn = {};

/**
 * Reads the next token
 */
generator.prototype.next = function () {
  this.tok = this.lexer.next();
  this.source += this.tok[1];
  if (this.tok[1] == "{") {
    this.inObject += 1;
  }
  if (this.tok[1] == "}") {
    this.inObject -= 1;
    if (this.inObject < 0) this.inObject = 0;
  }
  if (this.tok[1] == ":") {
    this.inKey = true;
  } else {
    this.inKey = false;
  }

  return this;
};

/**
 * Reads the next token, strips comments or white spaces
 */
generator.prototype.nextTok = function () {
  this.prev = this.tok;
  this.next();
  while (
    this.tok[0] == lexer.tokens.T_WHITESPACE ||
    this.tok[0] == lexer.tokens.T_COMMENT
  ) {
    this.write().next();
    if (this.tok[0] == lexer.tokens.T_EOF) break;
  }
  return this;
};

/**
 * Writing the output
 */
generator.prototype.write = function (code) {
  if (!code) code = this.tok[1];
  if (code) {
    if (this.source_offset != this.source.length) {
      if (this.opts.sourcemap) {
        this.code.add(
          code,
          this.filename,
          this.source.substring(this.source_offset, this.source.length)
        );
      } else {
        this.code.push(code);
      }
      this.source_offset = this.source.length;
    } else {
      if (this.opts.sourcemap) {
        this.code.add(code);
      } else {
        this.code.push(code);
      }
    }
  }
  return this;
};

/**
 * Renders the output
 */
generator.prototype.toString = function () {
  if (!this.opts.sourcemap) {
    return this.code.join("");
  }
  var out = this.code.toStringWithSourceMap();
  out.map.sourcesContent = this.source;
  var buff = Buffer.from(JSON.stringify(out.map));
  return (
    out.source +
    "\n//# sourceMappingURL=data:application/json;charset=utf-8;base64," +
    buff.toString("base64")
  );
};

/**
 * Check if a local var is used
 */
generator.prototype.isReserved = function (name) {
  name = name.split(".", 2)[0];
  if (reserved[name]) return true;
  if (generator.__fn[name]) return true;
  for (var i = this.locals.length - 1; i > -1; i--) {
    if (this.locals[i][name]) return true;
  }
  return false;
};

/**
 * Sets a local varname
 */
generator.prototype.setLocalVar = function (name) {
  if (!name) name = this.tok[1];
  this.locals[this.locals.length - 1][name] = true;
  return this;
};

/**
 *
 */
generator.prototype.parseValue = function (stop) {
  while (this.tok[0] != lexer.tokens.T_EOF) {
    if (this.tok[1] == stop) return this;
    if (this.tok[1] == "(") {
      this.write().nextTok().parseValue(")");
    }
    if (this.tok[1] == "{") {
      this.write().nextTok().parseValue("}");
    }
    if (this.tok[1] == "[") {
      this.write().nextTok().parseValue("]");
    }
    if (this.tok[1] == "function") {
      this.write().nextTok().parseFunction();
    }
    if (!stop && (this.tok[1] == ";" || this.tok[1] == ",")) return this;

    if (this.tok[0] == lexer.tokens.T_IDENTIFIER) {
      var varname = this.tok[1];
      if (this.inObject > 0 && this.inKey) {
        this.write(varname + " ");
      } else if (this.prev && this.prev[1] === ".") {
        this.write(varname + " ");
      } else {
        if (!this.isReserved(varname)) {
          if (!this.opts.strict) {
            this.safeVar(varname);
          } else {
            this.write(this.opts.localsName + "." + varname + " ");
          }
        } else {
          if (generator.__fn[varname]) {
            if (!this.helpers[varname]) {
              this.helpers[varname] = true;
            }
            this.write(varname + " ");
          } else {
            this.write(varname + " ");
          }
        }
      }
      this.nextTok();
    } else {
      this.write().nextTok();
    }
  }
  return this;
};

/**
 * Generates a safe variable output
 */
generator.prototype.safeVar = function (varname) {
  varname = varname.split(".");
  var code = this.opts.localsName;
  if (this.tok[1] == "(") {
    // check function :
    for (var i = 0; i < varname.length - 1; i++) {
      code = "(" + code + "." + varname[i] + ' || "")';
    }
    this.write(
      "(( (f" +
        ++this.tmp +
        " = " +
        code +
        ") && f" +
        this.tmp +
        " && typeof f" +
        this.tmp +
        '["' +
        varname[varname.length - 1] +
        '"] == "function") ? f' +
        this.tmp +
        '["' +
        varname[varname.length - 1] +
        '"]('
    );
    this.nextTok().parseValue(")");
    this.write('): "") ').nextTok();
  } else {
    for (var i = 0; i < varname.length; i++) {
      code = "(" + code + "." + varname[i] + ' || "")';
    }
    this.write(code + " ");
  }
};

/**
 * Parsing a variable
 */
generator.prototype.parseVar = function () {
  if (this.tok[0] == lexer.tokens.T_IDENTIFIER) {
    this.setLocalVar().write().nextTok();
  }
  if (this.tok[1] == "=") {
    // read var contents
    this.write().nextTok().parseValue();
  }
  if (this.tok[1] == ",") {
    // next var
    this.write().nextTok().parseVar();
  }
  if (this.tok[1] == ";") {
    return this.write().nextTok();
  }
};

/**
 * Parsing a closure structure
 */
generator.prototype.parseFunction = function (isOut) {
  if (this.tok[0] == lexer.tokens.T_IDENTIFIER) {
    this.setLocalVar().write().nextTok();
  }
  this.locals.push({});
  if (this.tok[0] == lexer.tokens.T_OPEN_PARA) this.write() && this.nextTok();
  if (this.tok[0] == lexer.tokens.T_IDENTIFIER) {
    this.setLocalVar().write().nextTok();
  }
  while (this.tok[1] == ",") {
    this.write().nextTok();
    if (this.tok[0] == lexer.tokens.T_CLOSE_PARA) {
      break;
    }
    this.setLocalVar().write().nextTok();
  }
  if (this.tok[0] == lexer.tokens.T_CLOSE_PARA) this.write().nextTok();
  if (this.tok[0] == lexer.tokens.T_OPEN_CAPTURE) {
    this.write("{ var _$e = ejs.output(); ");
    this.write("var echo = _$e.safe_write.bind(_$e); ");
    this.write("var write = _$e.write.bind(_$e); ");
    this.nextTok().parseBody(lexer.tokens.T_CLOSE_CAPTURE);
    this.write("return _$e.toString(); }");
  } else {
    if (this.tok[0] == lexer.tokens.OPEN_BRACKET) this.write().nextTok();
    this.parseBody(lexer.tokens.CLOSE_BRACKET);
    if (this.tok[0] == lexer.tokens.CLOSE_BRACKET) this.write();
  }
  this.locals.pop();
};

/**
 * Iterate over tokens
 */
generator.prototype.parseBody = function (escape) {
  while (true) {
    if (this.tok[0] == lexer.tokens.T_INLINE) {
      // we are inside an html chunk
      var source = this.tok[1];
      if (this.next().tok[0] == lexer.tokens.T_OPT_WS_STRIP) {
        source = source.replace(/[ \t]+$/, "");
      }
      if (source.length > 0) {
        this.write("_$e.write(`" + source.replace("`", "\\`") + "`);");
      }
    } else if (this.tok[0] == lexer.tokens.T_EOF || this.tok[0] == escape) {
      // no more tokens
      break;
    } else if (this.tok[0] == lexer.tokens.T_OPT_COMMENT) {
      // comments
      this.write("/* " + this.tok[1].replace("/", "?") + " */").next();
    } else {
      // inner code block
      var out = false;
      if (this.tok[0] == lexer.tokens.T_OPT_OUTPUT) {
        this.write("_$e.write(");
        out = true;
        this.nextTok();
      } else if (this.tok[0] == lexer.tokens.T_OPT_CLEAN_OUTPUT) {
        this.write("_$e.safe_write(");
        out = true;
        this.nextTok();
      } else if (
        this.tok[0] == lexer.tokens.T_OPEN ||
        this.tok[0] == lexer.tokens.T_OPT_WS_STRIP
      ) {
        out = false;
        this.nextTok();
      }
      while (this.tok[0] != lexer.tokens.T_EOF) {
        if (this.tok[0] == lexer.tokens.T_CLOSE) break;
        if (this.tok[0] == lexer.tokens.T_CLOSE_STRIP) break;
        if (this.tok[0] == lexer.tokens.T_OPT_NL_STRIP) break;
        if (this.tok[0] == escape) return this;
        if (this.tok[0] == lexer.tokens.T_IDENTIFIER) {
          if (this.tok[1] == "function") {
            this.write().nextTok().parseFunction(out);
          } else if (
            this.tok[1] == "var" ||
            this.tok[1] == "let" ||
            this.tok[1] == "const"
          ) {
            this.write("var").nextTok().parseVar();
            continue;
          } else {
            var varname = this.tok[1];
            this.nextTok();
            if (this.inObject > 0 && this.inKey) {
              this.write(varname + " ");
            } else if (this.prev && this.prev[1] === ".") {
              this.write(varname + " ");
            } else {
              if (!this.isReserved(varname)) {
                if (!this.opts.strict) {
                  this.safeVar(varname);
                } else {
                  this.write(this.opts.localsName + "." + varname + " ");
                }
              } else {
                if (generator.__fn[varname]) {
                  if (!this.helpers[varname]) {
                    this.helpers[varname] = true;
                  }
                  this.write(varname + " ");
                } else {
                  this.write(varname + " ");
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
        this.write(");");
      } else {
        this.write(";");
      }
      var strip = this.tok[0];
      if (this.next().tok[0] == lexer.tokens.T_INLINE) {
        if (strip == lexer.tokens.T_CLOSE_STRIP) {
          // strip spaces on next inline token
          this.tok[1] = this.tok[1].replace(/^[ \t]*\n?/, "");
        } else if (strip == lexer.tokens.T_OPT_NL_STRIP) {
          // @fixme need to check the spec on what to strip ?
          this.tok[1] = this.tok[1].replace(/^[ \t]*\n?/, "");
        }
      }
    }
  }
  return this;
};

module.exports = generator;
