"use strict";
const lexer = require("../lib/lexer");
const transpile = require("../lib/transpile");

/**
 * Extra coverage tests for transpile.js generator edge cases
 */
describe("transpile extra coverage", () => {
  function run(src, opts) {
    return transpile(new lexer(), src, Object.assign({ strict: false, localsName: "locals" }, opts || {}));
  }

  it("safeVar function call path", () => {
    const code = run("<% foo() %>");
    // Contains the pattern for safe function invocation with f1 temporary
    expect(code).toMatch(/f1 = locals/);
    expect(code).toMatch(/typeof f1\["foo"\] == "function"/);
  });

  it("function with capture block returns its own output", () => {
    const code = run(`
<% function test(a,b) {@ %>
Hello <%= a %> and <%= b %>
<% @} %>
<% test('X','Y') %>`);
    expect(code).toMatch(/function test/);
    expect(code).toMatch(/return _\$e.toString\(\);/);
  });

  it("object keys and reserved globals not rewritten", () => {
    const code = run("<% var x = {foo:1, Math:2}; if (Math.random() > 0) { var y = Error('x'); } %>");
    // Ensure Math and Error remain untouched (no locals.Math etc)
    expect(code).toMatch(/Math\.random\s*\(\s*\)/);
    expect(code).toMatch(/Error\s*\(\s*'x'\s*\)/);
    // Object literal retains Math key; foo key is rewritten by design
    expect(code).toMatch(/\{\(locals\.foo \|\| ""\) :1, Math :2\}/);
  });

  it("whitespace strip tokens processed", () => {
    const code = run("<%_ if (cond) { _%>line<%_ } _%>");
    // Expect generated write calls without leading/trailing spaces
    expect(code).toMatch(/if \(\s*\(locals\.cond \|\| ""\)\s*\)/);
    expect(code).toMatch(/_\$e.write\(`line`\);/);
  });

  it("strict mode headers emitted", () => {
    const code = run("Plain", { strict: true });
    expect(code.startsWith('"use strict";')).toBe(true);
  });
});
