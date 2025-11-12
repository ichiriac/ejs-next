/**
 * Copyright (C) 2025 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs-next/graphs/contributors
 * @url https://ejs-next.js.org
 */

const lexer = require("./lexer");
const { parse } = require("meriyah");
const astring = require("astring");

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


function compiler(source, options, filename) {
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

  let header = options.strict ? `"use strict";\n` : "";
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
    
  header += options.localsName + "._include = include;\n";
  header += options.localsName + "._output = _$e;\n";
  header += "const echo = _$e.safe_write.bind(_$e);\n";
  header += "const write = _$e.write.bind(_$e);\n";
  header +=
    "const layout = ejs.layout.bind(ejs, " +
    options.localsName +
    ", " +
    JSON.stringify(filename) +
    ", _$e);";

  // console.log("Compiled code:\n", header + bindings + output + "\nreturn _$e.toString();"); 
  return new AsyncFunction("ejs", options.localsName, header + bindings + output + "\nreturn _$e.toString();");
}

module.exports = { transpiler, compiler };
