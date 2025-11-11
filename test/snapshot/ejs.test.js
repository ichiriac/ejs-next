/**
 * Copyright (C) 2025 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs-next/graphs/contributors
 * @url https://ejs.js.org
 */
"use strict";

const ejs = require("../../lib/ejs");

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
      .renderFile(__dirname + "/../foo.ejs", { name: "Foo" })
      .then(function (output) {
        expect(output).toMatchSnapshot();
        done();
      })
      .catch(reject);
  });
});
