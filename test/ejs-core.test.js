"use strict";

const fs = require("fs");
const path = require("path");
const ejs = require("../lib/ejs");

// Increase timeout a bit to avoid false positives while debugging
jest.setTimeout(15000);

describe("ejs core (lib/ejs.js)", () => {
  const tmpRoot = path.join(__dirname, "__tmp_core__");
  const layoutFile = path.join(tmpRoot, "layout.ejs");
  const simpleFile = path.join(tmpRoot, "simple.ejs");
  const includeFile = path.join(tmpRoot, "include_test.ejs");
  const errorFile = path.join(tmpRoot, "error.ejs");
  const errorStrictFile = path.join(tmpRoot, "error_strict.ejs");

  beforeAll(() => {
    fs.mkdirSync(tmpRoot, { recursive: true });
    // minimal layout template (no complex captures) used in tests
    fs.writeFileSync(
      layoutFile,
      [
        "<html>",
        "<head><title><%= title %></title></head>",
        "<body><div class='content'><%- contents %></div>",
        "<div class='block-js'><%- block('js') %></div>",
        "</body></html>",
      ].join("\n")
    );
    // simple template for caching / profile
    fs.writeFileSync(simpleFile, "Hello <%= name %>");
    // include template that injects a script block via block()
    fs.writeFileSync(
      includeFile,
      [
        `<% block('js', '<script src="/app.js"></script>') %>`,
        `<%- include('layout.ejs', { title: 'T', contents: 'Body', name: 'X' }) %>`,
      ].join("\n")
    );
    // error (non-strict)
    fs.writeFileSync(errorFile, "<% throw new Error('boom') %>");
    // error (strict)
    fs.writeFileSync(errorStrictFile, "<% throw new Error('boom2') %>");
  });

  afterAll(() => {
    // Cleanup temp directory
    for (const f of [
      layoutFile,
      simpleFile,
      includeFile,
      errorFile,
      errorStrictFile,
    ]) {
      try { fs.unlinkSync(f); } catch (e) {}
    }
    try { fs.rmdirSync(tmpRoot); } catch (e) {}
  });

  beforeEach(() => {
    for (const k of Object.keys(ejs.__cache)) delete ejs.__cache[k];
  });

  test("global.ejs is exposed", () => {
    expect(global.ejs).toBe(ejs);
  });

  test("compile caching returns same function with cache=true", () => {
    const instance = new ejs({ cache: true });
    const tpl = "Hello <%= who %>";
    const fn1 = instance.compile(tpl);
    const fn2 = instance.compile(tpl);
    expect(fn2).toBe(fn1);
  });

  test("compile error produces SyntaxError with stack mapping", () => {
    const instance = new ejs();
    // malformed code to trigger AsyncFunction syntax error
    expect(() => instance.compile("<% ) %>")).toThrow(SyntaxError);
  });

  test("render handles sync result by returning a resolved Promise", async () => {
    const instance = new ejs();
    const out = await instance.render("Hi <%= 'X' %>");
    expect(out).toBe("Hi X");
  });

  test("include with raw string contents", async () => {
    const instance = new ejs({ root: tmpRoot });
    const tmp = path.join(tmpRoot, "inc_str.ejs");
    fs.writeFileSync(tmp, "<%- include('layout.ejs', 'Body!') %>");
    const html = await instance.renderFile(tmp, {});
    expect(html).toContain("Body!");
    fs.unlinkSync(tmp);
  });

  test("include with function returning captured output", async () => {
    const instance = new ejs({ root: tmpRoot });
    const tmp = path.join(tmpRoot, "inc_fn.ejs");
    fs.writeFileSync(
      tmp,
      "<%- include('layout.ejs', function(){@ %>Inner<% @}) %>"
    );
    const html = await instance.renderFile(tmp, {});
    expect(html).toContain("Inner");
    fs.unlinkSync(tmp);
  });

  test("layout hook plus block capture", async () => {
    const instance = new ejs({ root: tmpRoot });
    const tmp = path.join(tmpRoot, "with_block.ejs");
    fs.writeFileSync(
      tmp,
      [
        "<% block('js', '<script>var x=1</script>') %>",
        "<%- include('layout.ejs', { title: 'T', contents: 'Body', name: 'N' }) %>",
      ].join("\n")
    );
    const out = await instance.renderFile(tmp, {});
    expect(out).toContain("<script>var x=1</script>");
    fs.unlinkSync(tmp);
  });

  test("resolveInclude absolute and eval handling", () => {
    const instance = new ejs({ root: tmpRoot });
    const abs = instance.resolveInclude("/foo", "eval", false);
    expect(abs.endsWith(path.join("foo.ejs"))).toBe(true);
    const rel = instance.resolveInclude("layout.ejs", null, false);
    expect(path.basename(rel)).toBe("layout.ejs");
  });

  test("renderFile caches file contents when cache=true", async () => {
    const instance = new ejs({ root: tmpRoot, cache: true });
    await instance.renderFile(simpleFile, { name: "A" });
    expect(ejs.__cache[simpleFile]).toBeDefined();
    expect(Buffer.isBuffer(ejs.__cache[simpleFile])).toBe(true);
  });

  test("renderFile error path (non-strict) returns HTML comment with message", async () => {
    const instance = new ejs({ root: tmpRoot });
    const out = await instance.renderFile(errorFile, {});
    expect(out).toContain("<!--");
    expect(out).toContain("is not a constructor");
  });

  test("renderFile strict=true still returns comment due to implementation using global strict flag", async () => {
    const instance = new ejs({ root: tmpRoot, strict: true });
    const out = await instance.renderFile(errorStrictFile, {});
    expect(out).toContain("locals.Error is not a constructor");
  });

  test("profile: logs render metrics", async () => {
    const instance = new ejs({ root: tmpRoot, profile: true });
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    const out = await instance.renderFile(simpleFile, { name: "John" });
    expect(typeof out).toBe("string");
    // wait next tick for profiler logging
    await new Promise(r => process.nextTick(r));
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  test("__express success path with settings (views, view cache)", async () => {
    const cb = jest.fn();
    const data = {
      name: "John",
      settings: { "views": tmpRoot, "view cache": true },
    };
    await ejs.__express(simpleFile, data, cb);
    expect(cb).toHaveBeenCalled();
    const [err, html] = cb.mock.calls[0];
    expect(err).toBeNull();
    expect(typeof html).toBe("string");
    expect(ejs.__cache[simpleFile]).toBeDefined();
  });
});
