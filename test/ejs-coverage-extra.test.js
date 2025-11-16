"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const ejs = require("../lib/ejs");

describe("ejs extra coverage", () => {
  let tmpRoot;
  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ejs-next-"));
  });
  afterEach(() => {
    try { fs.rmSync(tmpRoot, { recursive: true, force: true }); } catch {}
  });

  function writeFile(rel, contents){
    const p = path.join(tmpRoot, rel + (path.extname(rel) ? "" : ".ejs"));
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, contents);
    return p;
  }

  test("compile syntax error triggers SyntaxError", () => {
    const eng = new ejs();
    expect(() => eng.compile("<% if () { %> hi <% } %>", "syntax_error.ejs")).toThrow(SyntaxError);
  });

  test("renderFile non-strict sanitizes runtime error", async () => {
    const file = writeFile("boom", "<% throw new Error('boom-runtime') %>");
    const eng = new ejs({ strict: false });
    const out = await eng.renderFile(file, {});
    expect(out).toMatch(/<!-- boom-runtime -->/);
  });

  test("renderFile strict rejects runtime error", async () => {
    const file = writeFile("boom-strict", "<% throw new Error('boom-runtime-strict') %>");
    const eng = new ejs({ strict: true });
    // renderFile uses self.strict; set it explicitly
    eng.strict = true;
    await expect(eng.renderFile(file, {})).rejects.toThrow(/boom-runtime-strict/);
  });

  test("profile logging outputs duration and size", async () => {
    const file = writeFile("profile", "Hello profile test");
    const logs = [];
    const origLog = console.log;
    console.log = (msg) => logs.push(String(msg));
    const eng = new ejs({ profile: true });
    const out = await eng.renderFile(file, {});
    await new Promise(r => setTimeout(r, 5));
    console.log = origLog;
    expect(out).toContain("Hello profile test");
    expect(logs.some(l => /Rendering/.test(l))).toBe(true);
  });

  test("cache-hit uses cached buffer instead of fs.readFile", async () => {
    const file = writeFile("cached", "Cached Hello");
    const eng = new ejs({ cache: true });
    // First call populates cache
    const out1 = await eng.renderFile(file, {});
    expect(out1).toContain("Cached Hello");
    // Replace fs.readFile to ensure it's NOT called on subsequent render
    const origRead = fs.readFile;
    const guard = jest.fn(() => { throw new Error("readFile should not be called when cached"); });
    fs.readFile = guard;
    const out2 = await eng.renderFile(file, {});
    fs.readFile = origRead;
    expect(out2).toContain("Cached Hello");
    expect(guard).not.toHaveBeenCalled();
  });

  test("include(): relative include from eval resolves in root", async () => {
    writeFile("inc", "Inclusion");
    const engine = new ejs({ root: tmpRoot });
    const res = await engine.include({}, "eval", "inc");
    expect(res).toBe("Inclusion");
  });

  test("layout(): sets output.hook and returns null", async () => {
    writeFile("layout", "<div><%= contents %></div>");
    const engine = new ejs({ root: tmpRoot });
    const out = engine.output();
    const ret = engine.layout({}, "eval", out, "layout", {});
    expect(ret).toBe(null);
    const content = await out.hook("Body");
    expect(content).toContain("Body");
  });

  test("selectFirstPathMatch resolves from siblings array", () => {
    const a = path.join(tmpRoot, "a");
    const b = path.join(tmpRoot, "b");
    fs.mkdirSync(a, { recursive: true });
    fs.mkdirSync(b, { recursive: true });
    const target = path.join(b, "x", "view.ejs");
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, "Sibling");
    const picked = ejs.selectFirstPathMatch(path.join(a, "x", "view.ejs"), [a, b]);
    expect(picked).toBe(target);
  });

  test("__express happy path and error path", async () => {
    const file = writeFile("page", "Hello Express");
    const res1 = await new Promise((resolve) => {
      ejs.__express(file, { settings: { "view cache": true, views: tmpRoot } }, (err, html) => resolve([err, html]));
    });
    expect(res1[0]).toBeNull();
    expect(res1[1]).toContain("Hello Express");

    const res2 = await new Promise((resolve) => {
      ejs.__express(path.join(tmpRoot, "missing.ejs"), { settings: { views: tmpRoot } }, (err, html) => resolve([err, html]));
    });
    expect(res2[0]).toBeTruthy();
    expect(String(res2[0])).toMatch(/ENOENT|no such file/i);
    expect(res2[1]).toBeNull();
  });
});
