"use strict";

const fs = require("fs");
const path = require("path");
const ejs = require("../lib/ejs");

describe("ejs more core branches", () => {
  const tmpRoot = path.join(__dirname, "__tmp_more__");
  const basic = path.join(tmpRoot, "basic.ejs");
  const layout = path.join(tmpRoot, "layout.ejs");
  const inc = path.join(tmpRoot, "inc.ejs");

  beforeAll(() => {
    fs.mkdirSync(tmpRoot, { recursive: true });
    fs.writeFileSync(layout, `<div class="wrap"><%- contents %></div>`);
    fs.writeFileSync(inc, `Inclusion`);
    fs.writeFileSync(basic, `Hello`);
  });

  afterAll(() => {
    for (const f of [basic, layout, inc]) {
      try { fs.unlinkSync(f); } catch (e) {}
    }
    try { fs.rmdirSync(tmpRoot); } catch (e) {}
  });

  beforeEach(() => {
    for (const k of Object.keys(ejs.__cache)) delete ejs.__cache[k];
  });

  test("block(): no name returns null and append/return behaviors", async () => {
    const engine = new ejs({ root: tmpRoot });
    // no name
    expect(engine.block({}, null)).toBeNull();
    // create and append values
    engine.block({}, "js", "A");
    engine.block({}, "js", "B");
    const result = engine.block({}, "js");
    expect(result).toBe("AB");
  });

  test("layout(): sets output.hook and returns null", async () => {
    const engine = new ejs({ root: tmpRoot });
    const out = engine.output();
    const ret = engine.layout({}, "eval", out, "layout.ejs", { title: "T" });
    expect(ret).toBeNull();
    // hook should exist and wrap provided contents
    expect(typeof out.hook).toBe("function");
    const content = await out.hook("Body");
    expect(content).toContain("Body");
  });

  test("include(): absolute path resolves against root", async () => {
    const engine = new ejs({ root: tmpRoot });
    const res = await engine.include({}, path.join("/", path.basename(inc)));
    expect(res).toBe("Inclusion");
  });

  test("renderFile uses cache on repeated reads (no fs second time)", async () => {
    const engine = new ejs({ root: tmpRoot, cache: true });
    const readSpy = jest.spyOn(fs, "readFile");
    await engine.renderFile(basic, {});
    const firstCalls = readSpy.mock.calls.length;
    await engine.renderFile(basic, {});
    const secondCalls = readSpy.mock.calls.length;
    expect(secondCalls).toBe(firstCalls); // no new fs.readFile calls
    readSpy.mockRestore();
  });

  test("resolveInclude from a file vs from a directory", () => {
    const engine = new ejs({ root: tmpRoot });
    const fromFile = path.join(tmpRoot, "dir", "a.ejs");
    const resolved1 = ejs.resolveInclude("../inc", fromFile, false);
    expect(path.basename(resolved1)).toBe("inc.ejs");
    const resolved2 = ejs.resolveInclude("inc", tmpRoot, true);
    expect(path.basename(resolved2)).toBe("inc.ejs");
  });
});
