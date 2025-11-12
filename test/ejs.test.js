/**
 * Copyright (C) 2025 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs-next/graphs/contributors
 * @url https://ejs.js.org
 */
"use strict";

const ejs = require("../lib/ejs");

describe("Template", () => {
  it("Simple case", (done, reject) => {
    ejs
      .render(`Hello <%= name %>`, { name: "World" })
      .then(function (output) {
        expect(output).toMatchSnapshot();
        done();
      })
      .catch(reject);
  });
  it("Statement", (done, reject) => {
    ejs
      .render(
        `
    <%_ if (true) { _%>
      ok
    <%_ } _%>`
      )
      .then(function (output) {
        expect(output).toMatchSnapshot();
        done();
      })
      .catch(reject);
  });
  it("Read file", (done, reject) => {
    ejs
      .renderFile("/views/page.ejs", { name: "Foo" }, { 
        cache: false, 
        profile: false, 
        strict: false,
        root: __dirname
      })
      .then(function (output) {
        expect(output).toMatchSnapshot();
        done();
      })
      .catch(reject);
  });

  it("test registerFunction", (done, reject) => {
    ejs.registerFunction("toUpperCase", function (_ctx, str) {
      return String(str).toUpperCase();
    });
    ejs
      .render(`Hello <%= toUpperCase(name) %>`, { name: "world" })
      .then(function (output) {
        expect(output).toMatchSnapshot();
        done();
      })
      .catch(reject);
  });
});
