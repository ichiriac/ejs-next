/**
 * Copyright (C) 2022 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs-next/graphs/contributors
 * @url https://ejs.js.org
 */
"use strict";

const ejs = require("../../lib/ejs");

describe("Output", () => {
  it("Sanitize", (done, reject) => {
    ejs
      .render(`Hello <%= name %>`, { name: '<&">' })
      .then(function (output) {
        expect(output).toMatchSnapshot();
        done();
      })
      .catch(reject);
  });
});
