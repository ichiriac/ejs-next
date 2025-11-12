/**
 * Copyright (C) 2025 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs-next/graphs/contributors
 * @url https://ejs.js.org
 */
(function ($, w) {
  "use strict";

  // lib/lexer.js at Wed Nov 12 2025 23:20:06 GMT+0000 (Coordinated Universal Time)
/**
 * Copyright (C) 2025 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs-next/graphs/contributors
 * @url https://ejs.js.org
 */


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


// lib/transpiler.js at Wed Nov 12 2025 23:20:06 GMT+0000 (Coordinated Universal Time)
/**
 * Copyright (C) 2025 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs-next/graphs/contributors
 * @url https://ejs-next.js.org
 */





const envGlobals = {
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
  global: true,
  require: true,
  window: true,
  document: true,
  $: true
};

const AsyncFunction = async function () { }.constructor;

function transpiler(source, options) {

  const reader = new lexer(options.delimiter);
  reader.input(source);
  const pre_code = [];
  let token = reader.next();
  let prev = null, next = null;
  let expectingOutputEnd = false;
  while (token[0] !== lexer.tokens.T_EOF) {
    if (token[0] === lexer.tokens.T_SOURCE || token[0] === lexer.tokens.T_TEXT || token[0] === lexer.tokens.T_COMMENT ) {
      pre_code.push(token[1]);
    } else if (token[0] === lexer.tokens.T_OPT_COMMENT) {
      pre_code.push('/*' +  token[1] + '*/');
    } else if (token[0] === lexer.tokens.T_INLINE) {
      next = reader.next();
      let source = token[1].replace("`", "\\`");
      let pre_space = ""; // used for keeping same line formatting
      let post_space = ""; // used for keeping same line formatting
      if (next[0] === lexer.tokens.T_OPT_WS_STRIP) {
        source = source.trimEnd();
        post_space = token[1].substring(source.length);
      }
      if (prev && (prev[0] === lexer.tokens.T_OPT_NL_STRIP || prev[0] === lexer.tokens.T_CLOSE_STRIP)) {
        source = source.trimStart();
        pre_space = token[1].substring(0, token[1].length - source.length - post_space.length);
      }
      pre_code.push(pre_space + ";_$e.write(`" + source + "`);" + post_space);
      prev = token;
      token = next;
      continue;
    } else if (token[0] === lexer.tokens.T_OPT_CLEAN_OUTPUT) {
      pre_code.push(";_$e.safe_write(");
      expectingOutputEnd = true;
    } else if (token[0] === lexer.tokens.T_OPT_OUTPUT) {
      pre_code.push(";_$e.write(");
      expectingOutputEnd = true;
    } else if (token[0] === lexer.tokens.T_CLOSE || token[0] === lexer.tokens.T_CLOSE_STRIP || token[0] === lexer.tokens.T_OPT_NL_STRIP) {
      if (expectingOutputEnd) {
        pre_code.push(");");
        expectingOutputEnd = false;
      }
    }
    prev = token;
    token = reader.next();
  } 

  // missing closing output tag
  if (expectingOutputEnd) {
    if (options.strict) {
      throw new Error("Unclosed tag at end of template");
    }
    pre_code.push(");");
  }
  return pre_code.join("");
}


function compiler(source, options, filename, ejsInstance) {
  if (!options) options = {};
  if (!options.localsName) options.localsName = "locals";
  const code = transpiler(source, options);
  const ast = parse(code, { module: true, next: true });
  const locals = {
    _$e: true,
    layout: false,
    include: false,
    block: false,
    echo: false,
    write: false,
    [options.localsName]: true
  };

  let bindings = '';


  var customGenerator = Object.assign({}, astring.GENERATOR, {
    Identifier: function (node, state) {
      if (envGlobals.hasOwnProperty(node.name)) {
        state.write(node.name);
      } else if (locals.hasOwnProperty(node.name)) {
        state.write(node.name);
      } else if (ejsInstance && ejsInstance.constructor.__fn.hasOwnProperty(node.name)) {
        bindings += "const " + node.name + " = ejs.constructor.__fn[" + JSON.stringify(node.name) + "].bind(ejs, " + options.localsName + ");\n";
        state.write(node.name);
        locals[node.name] = true;
      } else {
        if (options.strict) {
          state.write(options.localsName + "." + node.name);
        } else {
          state.write('(' + options.localsName + "." + node.name + " ?? '')");
        }
      }
    },
    EmptyStatement: function () {
      // Ignore empty statements
    },
    VariableDeclarator: function (node, state) {
      if (node.id.type === "Identifier") {
        state.write(node.id.name);
        if (!locals[node.id.name]) {
          // @fixme : should handle declarations from scopes (example, nested functions)
          locals[node.id.name] = 1;
        }
      } else {
        throw new Error("Unsupported variable declarator");
      }
      if (node.init) {
        state.write(" = ");
        this[node.init.type](node.init, state);
      }
    },
    Property: function (node, state) {
      if (node.computed) {
        state.write("[");
        this[node.key.type](node.key, state);
        state.write("]");
      } else {
        state.write(node.key.name);
      }
      state.write(": ");
      this[node.value.type](node.value, state);
    },
    AssignmentExpression: function (node, state) {
      if (node.left.type === "Identifier") {
        state.write(options.localsName + "." + node.left.name);
      } else {
        throw new Error("Unsupported assignment expression");
      }
      state.write(" " + node.operator + " ");
      this[node.right.type](node.right, state);
    },
    FunctionDeclaration: function (node, state) {
      this['FunctionExpression'](node, state);
      if (node.id) {
        if (!locals[node.id.name]) {
          locals[node.id.name] = 1;
        } else {
          locals[node.id.name]++;
        }
      }
    },
    FunctionExpression: function (node, state) {
      if (node.async) state.write("async ");
      state.write("function");
      if (node.generator) state.write("*");
      if (node.id) {
        state.write(" " + node.id.name);
        if (!locals[node.id.name]) {
          locals[node.id.name] = 1;
        } else {
          locals[node.id.name]++;
        }
      }
      state.write("(");
      for (let i = 0; i < node.params.length; i++) {
        if (i > 0) state.write(", ");
        if (node.params[i].type === "Identifier") {
          state.write(node.params[i].name);
          if (!locals[node.params[i].name]) {
            locals[node.params[i].name] = 1;
          } else {
            locals[node.params[i].name]++;
          }
        } else {
          throw new Error("Unsupported function parameter");
        }
      }
      state.write(") ");
      this[node.body.type](node.body, state);
      for (let i = 0; i < node.params.length; i++) {
        locals[node.params[i].name]--;
        if (locals[node.params[i].name] === 0) {
          delete locals[node.params[i].name];
        }
      }
      if (node.id) {
        locals[node.id.name]--;
        if (locals[node.id.name] === 0) {
          delete locals[node.id.name];
        }
      }
    },
    MemberExpression: function (node, state) {
      if (node.computed) {
        this[node.object.type](node.object, state);
        state.write("[");
        this[node.property.type](node.property, state);
        state.write("]");
      } else {
        this[node.object.type](node.object, state);
        state.write(".");
        state.write(node.property.name);
      }
    }
  });

  let output = astring.generate(ast, {
    generator: customGenerator
  });

  let header = options.strict ? `\n` : "";
  header += "if (arguments.length < 2) {\n";
  header += "\t" + options.localsName + " = ejs;\n";
  header +=
    '\tejs = (typeof global != "undefined" && global.ejs) || (typeof window != "undefined" && window.ejs);\n';
  header +=
    '\tif(!ejs) return Promise.reject(new Error("EJS module is not loaded"));\n';
  header += "\tejs = new ejs(" + JSON.stringify(options) + ");\n";
  header += "} else {\n";
  header += "\t" + options.localsName + " = " + options.localsName + " || {};\n";
  header += "}\n";
  header += "const _$e = ejs.output();\n";
  header += "ejs._output = _$e;\n";
  header +=
    options.localsName + "._filename = " + JSON.stringify(filename) + ";\n";
  header +=
    "const include = ejs.include.bind(ejs, " +
    options.localsName +
    ", " +
    JSON.stringify(filename) +
    ");\n";
  header += "const block = ejs.block.bind(ejs, " + options.localsName + ");\n";    
  header +=
    "const layout = ejs.layout.bind(ejs, " +
    options.localsName +
    ", " +
    JSON.stringify(filename) +
    ", _$e);";
  header += options.localsName + "._include = include;\n";
  header += options.localsName + "._output = _$e;\n";
  header += "const echo = _$e.safe_write.bind(_$e);\n";
  header += "const write = _$e.write.bind(_$e);\n";

  // console.log("Compiled code:\n", header + bindings + output + "\nreturn _$e.toString();"); 
  return new AsyncFunction("ejs", options.localsName, header + bindings + output + "\nreturn _$e.toString();");
}


// lib/output.js at Wed Nov 12 2025 23:20:06 GMT+0000 (Coordinated Universal Time)
/**
 * Copyright (C) 2025 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs-next/graphs/contributors
 * @url https://ejs.js.org
 */


/**
 * Output handler
 */
var output = function () {
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
output.sanitize = function (str) {
  if (typeof str != "string") str = str.toString();
  return str.replace(sanitizeRegex, function (c) {
    if (c == "&") return "&amp;";
    if (c == "<") return "&lt;";
    if (c == ">") return "&gt;";
    if (c == '"') return "&#34;";
    if (c == "'") return "&#39;";
    return c;
  });
};

output.prototype.buffer = function (msg) {
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
  return function () {
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
output.prototype.write = function (msg) {
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
    this.offset++;
    this.output.push(msg);
  }
};

/**
 * safe mode
 */
output.prototype.safe_write = function (msg) {
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
    this.offset++;
    this.sanitize.push(this.offset);
    this.output.push(msg);
  }
};

/**
 * Renders the output
 */
output.prototype.toString = function () {
  var result;
  if (this.offset == -1) {
    result = "";
  } else if (this.offset == 0) {
    result = this.output[0];
  } else {
    result = Promise.all(this.output).then(
      function (parts) {
        for (var i = 0, l = this.sanitize.length; i < l; i++) {
          var offset = this.sanitize[i];
          parts[offset] = output.sanitize(
            parts[offset] == null ? "" : parts[offset]
          );
        }
        return parts.join("");
      }.bind(this)
    );
  }
  if (this.hook) {
    if (result.then) {
      return result.then(
        function (result) {
          return this.hook(result);
        }.bind(this)
      );
    }
    result = this.hook(result);
  }
  return result;
};


// lib/ejs.js at Wed Nov 12 2025 23:20:06 GMT+0000 (Coordinated Universal Time)
/**
 * Copyright (C) 2025 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs-next/graphs/contributors
 * @url https://ejs.js.org
 */






/**
 * Layer engine constructor
 */
var ejs = function (opts) {
  if (!opts) opts = {};
  this.options = {
    cache: opts.hasOwnProperty("cache") ? opts.cache : ejs.cache,
    strict: opts.hasOwnProperty("strict") ? opts.strict : ejs.strict,
    profile: opts.hasOwnProperty("profile") ? opts.profile : ejs.profile,
    localsName: opts.localsName || "locals",
    delimiter: opts.delimiter || ejs.delimiter,
    root: opts.root || ejs.root,
  };
  this._session = {};
};

ejs.dirname = 'views';
ejs.root = "/";
ejs.cache = false;
ejs.strict = false;
ejs.profile = false;
ejs.sourcemap = false;
ejs.delimiter = "%";

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
ejs.prototype.compile = function (buffer, filename) {
  if (this.options.cache && ejs.__cache.hasOwnProperty(buffer)) {
    return ejs.__cache[buffer];
  }
  try {
    var fn = compiler(buffer, this.options, filename || "eval", this).bind(
      null,
      this
    )
    if (this.options.cache) {
      ejs.__cache[buffer] = fn;
    }
    return fn;
  } catch (e) {
    var line = e.lineNumber ? e.lineNumber: 1;
    var se = new SyntaxError(e.message, filename, line);
    se.stack =
      e.message +
      "\n    at " +
      filename +
      ":" +
      line +
      "\n" +
      se.stack.split(/\n/g).slice(4).join("\n");
    throw se;
  }
};

/**
 * shortcut to ejs.prototype.compile
 * @return Function(any): Promise<string>
 */
ejs.compile = function (str, options) {
  var instance = new ejs(options);
  return instance.compile(str);
};

ejs.prototype.prepareContext = function (data) {
  return data;
};

/**
 * Renders the specified template using the specified data
 * @return Promise<string>
 */
ejs.prototype.render = function (str, data) {
  var result = this.compile(str)(this.prepareContext(data));
  if (typeof result.then == "function") {
    return result;
  }
  return Promise.resolve(result);
};

/**
 * Output serializer
 */
ejs.prototype.output = function () {
  return new output();
};

/**
 * Shortcut to ejs.prototype.render
 * @return Promise<string> | <string>
 */
ejs.render = function (str, data, options) {
  var instance = new ejs(options);
  return instance.render(str, data);
};

/**
 * Include a file
 */
ejs.prototype.include = function (ctx, from, filename, args) {
  if (typeof args == "function") {
    args = { contents: args() };
  }
  if (typeof args == "string") {
    args = { contents: args };
  }
  return this.renderFile(
    this.resolveInclude(filename, from),
    Object.assign({}, ctx, args || {})
  );
};

/**
 * Registers a layout output
 */
ejs.prototype.layout = function (ctx, from, output, filename, args) {
  var self = this;
  output.hook = function (contents) {
    args = Object.assign({}, ctx, args || {});
    args.contents = contents;
    return self.renderFile(self.resolveInclude(filename, from), args);
  };
  return null;
};

/**
 * Registers blocks
 */
ejs.prototype.block = function (ctx, name, value) {
  if (!name) return null;
  if (!this._session[name]) {
    this._session[name] = this.output();
  }
  if (arguments.length == 3) {
    if (typeof value == "function") {
      // @fixme : not safe - not immutable, should use ctx instead
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
ejs.prototype.resolveInclude = function (filename, from, isDir) {
  if (!from || from == "eval") {
    from = Array.isArray(this.options.root) ? this.options.root[0] : this.options.root;
    isDir = true;
  }

  if (path.isAbsolute(filename)) {
    if (filename.startsWith(from)) {
      filename = filename.substring(from.length);
    }
    filename = "./" + filename.replace(/^\/*/, "");
    from = Array.isArray(this.options.root) ? this.options.root[0] : this.options.root;
    isDir = true;
  }
  return ejs.resolveInclude(filename, from, isDir, this.options.root);
};

/**
 * Resolves a path
 */
ejs.resolveInclude = function (filename, from, isDir, folders) {
  if (from) {
    if (!isDir) {
      from = path.dirname(from);
    }
    filename = path.resolve(from, filename)
  }

  if (!path.extname(filename)) {
    filename += ".ejs";
  }
  if (folders && Array.isArray(folders)) {
    try {
      return ejs.selectFirstPathMatch(filename, folders);
    } catch (e) {
      throw e;
    }
  } else {
    return filename;
  }

};

/**
 * Registers a function
 */
ejs.registerFunction = function (name, cb) {
  ejs.__fn[name] = cb;
};

/**
 * Get first path that exists according to order of root relative siblings
 * @param {*} root 
 * @param {*} siblings 
 * @param {*} filename 
 * @returns 
 */
ejs.selectFirstPathMatch = function (filename, folders) {
  try {
    const { root, siblings } = ejs.relativeSiblings(filename, folders);
    filename = path.relative(root, filename)
    for (let sib of siblings) {
      const _path = path.join(root, sib, filename)
      if (fs.existsSync(_path)) {
        return _path;
      }
    }
    return path.join(root, filename)

  } catch (e) {
    throw e;
  }
}

/**
 * Get relative path to many roots from filename root
 * @param {*} filename 
 * @param {*} folders 
 * @returns 
 */
ejs.relativeSiblings = function (filename, folders) {
  try {
    const root = ejs.selectRoot(filename, folders);
    if (!root) throw (new Error(`File : ${filename} doesn't exists`))
    const siblings = []
    for (let sibling of folders) {
      siblings.push(path.relative(root, sibling))
    }
    return {
      siblings,
      root: root
    };

  } catch (e) {
    throw e;
  }
}
/**
 * Select root among folders where filename come from
 * @param {*} filename 
 */
ejs.selectRoot = function (filename, folders) {
  for (let root of folders) {
    const test = filename.substring(0, root.length);
    if (root == test) {
      return root;
    }
  }
  return false;
}
/**
 * Renders the specified template using the specified data
 * @return Promise<string>
 */
ejs.prototype.renderFile = function (filename, data) {
  const self = this;
  const renderResult = new Promise(function (resolve, reject) {
    try {
      filename = self.resolveInclude(filename);
    } catch (e) {
      return reject(e);
    }
    var run = function (str) {
      const renderError = function (err, method) {
        const stack = err.stack.split("\n");
        let line = stack;
        let err_method = 'unknown';
        if (stack[1] && stack[1].split && typeof stack[1].split == "function") {
          line = stack[1].split(":");
          err_method = line[0].trim().split(' ')[1];
        }
        if (err_method == 'eval') {
          line = line[line.length - 2] - 18;
          if (isNaN(line)) line = 1;
          const start = line > 5 ? line - 5 : 0;
          const render_code = function (code, index) {
            if (code.length > 123) {
              code =
                code.substring(0, 80) +
                "..." +
                code.substring(code.length - 40);
            }
            let num = start + index + 1;
            if (num == line) {
              return (
                ("" + num).padStart(3, "0") +
                " | " +
                code +
                "\n     " +
                "".padEnd(code.length, "~")
              );
            } else {
              return ("" + num).padStart(3, "0") + " | " + code;
            }
          };

          if (method) {
            method = method.toString();
            const method_lines = method
              .toString()
              .split("\n")
              .slice(start > 18 ? start - 18 : start, line + 18);
            console.error(
              method_lines.map(render_code).join("\n")
            );
          }
          const lines = str
            .toString()
            .split("\n")
            .slice(start, line + 5);
          console.error(
            lines
              .map(render_code)
              .join("\n")
          );
          console.error("\n" + stack[0] + "\n at " + filename + ":" + line);
        } else {
          console.error(err);
        }
        if (data._includes) {
          data._includes.pop();
          if (data._includes.length > 0) {
            console.error(
              "\nIncludes stack : \n- " + data._includes.join("\n- ")
            );
          }
        }
      };
      var fn;
      try {
        if (!data._includes) {
          data._includes = [];
        }
        data._includes.push(filename);
        fn = self.compile(str.toString(), filename);
        var result = fn(self.prepareContext(data));
        if (result && typeof result.then == "function") {
          result
            .then(function (output) {
              data._includes.pop();
              resolve(output);
            })
            .catch(
              self.strict
                ? reject
                : function (err) {
                  renderError(err, fn);
                  resolve("<!-- " + err.message + " -->");
                }
            );
        } else {
          data._includes.pop();
          resolve(result);
        }
      } catch (e) {
        if (!self.strict) {
          renderError(e, fn);
          resolve("<!-- " + e.message + " -->");
        } else {
          return reject(e);
        }
      }
    };

    if (self.options.profile) {
      const now = new Date().getTime();
      nextTick(function () {
        renderResult.then(function (output) {
          let duration = new Date().getTime() - now;
          if (duration < 1000) {
            duration += "ms";
          } else {
            duration = Math.round(duration / 100) / 10 + "sec";
          }
          let size = output ? output.length : 0;
          if (size < 2048) {
            size += "B";
          } else {
            size = Math.round(size / 1024) + "kB";
          }
          console.log(
            "Rendering " + size + " in " + duration + " for " + filename
          );
          return output;
        });
      });
    }

    if (self.options.cache && ejs.__cache.hasOwnProperty(filename)) {
      run(ejs.__cache[filename]);
    } else {
      fs.readFile(filename, function (err, str) {
        if (err) {
          return reject(err);
        }
        if (self.options.cache) ejs.__cache[filename] = str;
        run(str);
      });
    }
  });
  return renderResult;
};

/**
 * Shortcut to ejs.prototype.renderFile
 * @return Promise<string>
 */
ejs.renderFile = function (filename, data, options) {
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
ejs.__express = async function (filename, data, cb) {
  if (!cb || typeof cb != "function") {
    throw new Error("No response callback");
  }
  var opt = {};
  if (data.settings) {
    if (data.settings["view cache"]) {
      opt.cache = true;
    }
    if (data.settings["views"]) {
      opt.root = data.settings["views"];
    }
  }
  try {
    const output = await ejs.renderFile(filename, data, opt);
    if (typeof output === "string") {
      cb(null, output);
    } else {
      cb(output, null);
    }
  } catch (err) {
    cb(err, null);
  }
};

/**
 * Expose it as a global for standalone (serialized ?) functions
 */
if (typeof window !== "undefined") {
  window.ejs = ejs;
} else if (typeof global !== "undefined") {
  global.ejs = ejs;
}




  // global definition (window.ejs)
  if (w) {
    w["ejs"] = ejs;
  }
  // amd definition (define(['ejs'], function() ...))
  if (typeof define === "function" && define.amd) {
    define("ejs", ejs);
  }
  // define the jquery helper
  if ($ && $.fn) {
    $.fn.extend({
      ejs: function (data, options) {
        var opt = $.fn.ejs.options;
        if (options) {
          opt = $.extend(true, opt, options);
        }
        var ejs = new ejs(opt);
        return this.each(function () {
          var tpl = $(this).html();
          ejs
            .compile(tpl)(data)
            .then(
              function (str) {
                $(this).html(str);
              }.bind(this)
            )
            .catch(function (err) {
              $(this).html(
                '<pre class="ejs-error">' + err.toString() + "</pre>"
              );
            });
        });
      },
    });
    // default options
    $.fn.ejs.options = {};
  }
})(jQuery, window);
