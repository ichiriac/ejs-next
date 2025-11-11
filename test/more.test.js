/* Additional tests to improve coverage */
"use strict";

const path = require("path");
const ejs = require("../lib/ejs");
const Output = require("../lib/output");

describe("ejs utilities", () => {
  test("resolveInclude adds extension and resolves relative paths", () => {
    const out = ejs.resolveInclude("foo", "/tmp/dir/page.ejs", false);
    expect(path.extname(out)).toBe(".ejs");
    expect(out).toBe(path.resolve(path.dirname("/tmp/dir/page.ejs"), "foo.ejs"));
  });

  test("resolveInclude with root or eval behavior", () => {
    // when from is falsy, root should be used
    const out = ejs.resolveInclude("/bar", null, true);
    expect(path.extname(out)).toBe(".ejs");
    // should produce an absolute-like path starting with the configured root (default "/")
    expect(out).toMatch(/\/bar\.ejs$/);
  });

  test("registerFunction makes helper available in templates", async () => {
    // register a helper that upper-cases its first argument
    ejs.registerFunction("__test_up", function (locals, s) {
      return String(s).toUpperCase();
    });

    const output = await ejs.render('<%= __test_up("hello") %>');
    expect(output).toBe("HELLO");

    // cleanup to avoid leaking a helper into other tests
    try {
      delete ejs.__fn["__test_up"];
      delete require("../lib/transpile").__fn["__test_up"];
    } catch (e) {
      /* ignore */
    }
  });

  test("__express rejects when callback missing", async () => {
    await expect(ejs.__express("file", {})).rejects.toThrow("No response callback");
  });
});

describe("Output class behavior", () => {
  test("buffer isolates and restores output state", () => {
    const o = new Output();
    o.write("A");
    const restore = o.buffer();
    o.write("B");
    // current buffer contains B
    expect(o.toString()).toBe("B");
    // restore should return the buffered content (B) and restore previous state
    const r = restore();
    expect(r).toBe("B");
    // after restore, original output should be back (A)
    expect(o.toString()).toBe("A");
  });

  test("safe_write handles Promises (note: single-promise case returns raw resolved value)", async () => {
    const o = new Output();
    const p = Promise.resolve("<&>");
    o.safe_write(p);
    const res = await o.toString();
    // current implementation returns the resolved value directly for the single-promise case
    expect(res).toBe("<&>");
  });

  test("hook is applied to synchronous and asynchronous results", async () => {
    const o = new Output();
    o.write("X");
    o.hook = (s) => `H[${s}]`;
    expect(o.toString()).toBe("H[X]");

    // async case
    const o2 = new Output();
    o2.safe_write(Promise.resolve("<&>"));
    o2.hook = (s) => `H[${s}]`;
    const res = await o2.toString();
    // current implementation does not sanitize the single-promise result
    expect(res).toBe("H[<&>]");
  });
});
