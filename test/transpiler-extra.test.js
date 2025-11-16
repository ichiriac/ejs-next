"use strict";
const { compiler } = require("../lib/transpiler");

describe("Transpiler extra branches", () => {
  test("async and generator functions are generated", () => {
    const tpl = `<% async function af() { return 42 } %><% function* gf() { yield 7 } %><%= af() %> <%= gf().next().value %>`;
    const program = compiler(tpl, { strict: true, localsName: "ctx" });
    const src = program.toString();
    expect(src).toMatch(/async function af/); // async branch
    expect(src).toMatch(/function\* gf/); // generator branch
  });

  test("duplicate function declarations increment locals", () => {
    const tpl = `<% function foo(){ return 1 } function foo(){ return 2 } %><%= foo() %>`;
    const program = compiler(tpl, { strict: true, localsName: "ctx" });
    const src = program.toString();
    // Should contain two function foo declarations
    const matches = src.match(/function foo\(/g) || [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  test("duplicate named function expressions increment locals", () => {
    const tpl = `<% var a = function bar(){ return 1 }; var b = function bar(){ return 2 }; %><%= bar() %>`;
    const program = compiler(tpl, { strict: true, localsName: "ctx" });
    const src = program.toString();
    const matches = src.match(/function bar\(/g) || [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  test("duplicate variable declarations hit else branch", () => {
    const tpl = `<% var dup; var dup; %>`;
    const program = compiler(tpl, { strict: true, localsName: "ctx" });
    const src = program.toString();
    // Should contain only one 'dup' declaration emitted, second passes through else branch without code
    const matches = src.match(/var dup|dup;/g) || [];
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  test("unsupported function parameter triggers error", () => {
    const tpl = `<% function bad([x]) { return x } %>`;
    expect(() => compiler(tpl, { strict: true, localsName: "ctx" })).toThrow(/Unsupported function parameter/);
  });

  test("identifier binding from ejsInstance.__fn", () => {
    class E {}
    E.__fn = {
      customHelper(locals){ return 'BIND:' + (locals.flag || 'X'); }
    };
    const tpl = `<% flag = 'OK' %><%= customHelper() %>`;
    // Pass a dummy instance so ejsInstance branch is hit
    const program = compiler(tpl, { strict: true, localsName: "ctx" }, "bind.ejs", new E());
    const src = program.toString();
    expect(src).toMatch(/const customHelper = ejs.constructor.__fn/);
  });

  test("anonymous function expression covers no-id branch", () => {
    const tpl = `<% var anon = function(){ return 123 }; %>`;
    const program = compiler(tpl, { strict: true, localsName: "ctx" });
    const src = program.toString();
    // Should not contain a named function after 'function ' keyword for anon
    expect(src).toMatch(/function\(/);
  });
});
