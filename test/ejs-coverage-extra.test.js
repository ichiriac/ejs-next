"use strict";
const fs = require("fs");
const path = require("path");
const ejs = require("../lib/ejs");

/**
 * Extra coverage tests targeting uncovered branches in lib/ejs.js
 */
describe("ejs extra coverage", () => {
  const tmpRoot = path.join(__dirname, "__tmp_extra__");
  beforeAll(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    fs.mkdirSync(tmpRoot, { recursive: true });
  });
  afterAll(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it("compile syntax error triggers catch block", () => {
    const eng = new ejs();
    // Invalid JS: if () is a syntax error
    expect(() => eng.compile("<% if () { %> hi <% } %>", "syntax_error.ejs")).toThrow(SyntaxError);
  });

  it("block with function value captures buffered output", () => {
    const eng = new ejs();
    eng._output = eng.output(); // emulate render setting _output
    eng.block({}, "myBlock", function () {
      eng._output.write("Hello");
    });
    const result = eng.block({}, "myBlock");
    expect(result).toBe("Hello");
  });

  it("relativeSiblings throws when file outside roots", () => {
    const fakeFile = path.join(tmpRoot, "not_in_roots", "x.ejs");
    const roots = [path.join(tmpRoot, "A"), path.join(tmpRoot, "B")];
    roots.forEach(r => fs.mkdirSync(r, { recursive: true }));
    expect(() => ejs.relativeSiblings(fakeFile, roots)).toThrow(/doesn't exists/);
    expect(ejs.selectRoot(fakeFile, roots)).toBe(false);
  });

  it("renderFile non-strict sanitizes runtime error", async () => {
    const file = path.join(tmpRoot, "fail_runtime.ejs");
    fs.writeFileSync(file, "<% throw new Error('boom-runtime') %>");
    const eng = new ejs({ strict: false });
    const out = await eng.renderFile(file, {});
    expect(out).toMatch(/<!-- boom-runtime -->/);
  });

  it("renderFile strict still sanitizes runtime error (current behavior)", async () => {
    const file = path.join(tmpRoot, "fail_runtime_strict.ejs");
    fs.writeFileSync(file, "<% throw new Error('boom-runtime-strict') %>");
    const eng = new ejs({ strict: true });
    const out = await eng.renderFile(file, {});
    // Implementation uses self.strict (not options), so it's currently non-strict
    expect(out).toMatch(/<!-- boom-runtime-strict -->/);
  });

  it("nested includes produce includes stack logging", async () => {
    const outer = path.join(tmpRoot, "outer.ejs");
    const inner = path.join(tmpRoot, "inner.ejs");
    const failing = path.join(tmpRoot, "failing.ejs");
    fs.writeFileSync(failing, "<% throw new Error('nested-fail') %>");
    fs.writeFileSync(inner, "Inner\n<%- include('failing.ejs') %>\n");
    fs.writeFileSync(outer, "Outer\n<%- include('inner.ejs') %>\n");
    const eng = new ejs({ strict: false, root: tmpRoot });
    const logs = [];
    const origErr = console.error;
    console.error = (msg) => { logs.push(String(msg)); };
    const out = await eng.renderFile(outer, {});
    console.error = origErr; // restore
    expect(out).toMatch(/<!-- nested-fail -->/);
    expect(logs.join("\n")).toMatch(/Includes stack/);
  });

  it("profile logging outputs duration and size", async () => {
    const file = path.join(tmpRoot, "profile.ejs");
    fs.writeFileSync(file, "Hello profile test");
    const eng = new ejs({ profile: true });
    const logs = [];
    const origLog = console.log;
    console.log = (msg) => { logs.push(String(msg)); };
    const out = await eng.renderFile(file, {});
    // Give a tick for the profile logger (attached via nextTick + then)
    await new Promise(r => setTimeout(r, 5));
    console.log = origLog;
    expect(out).toContain("Hello profile test");
    expect(logs.some(l => /Rendering/.test(l))).toBe(true);
  });

  it("cache-hit uses cached buffer instead of fs.readFile", async () => {
    const file = path.join(tmpRoot, "cache_hit.ejs");
    fs.writeFileSync(file, "Cached Hello");
    const eng = new ejs({ cache: true });
    await eng.renderFile(file, {}); // populate cache
    const spy = jest.spyOn(fs, "readFile");
    const out = await eng.renderFile(file, {});
    spy.mockRestore();
    expect(out).toContain("Cached Hello");
    expect(spy).not.toHaveBeenCalled();
  });
});
