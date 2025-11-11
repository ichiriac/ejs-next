/**
 * Copyright (C) 2025 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs-next/graphs/contributors
 * @url https://ejs.js.org
 */
"use strict";

const lexer = require("../../lib/lexer");

function test(source) {
  var lex = new lexer();
  lex.input(source);
  var tokens = [];
  while (true) {
    var tok = lex.next();
    tokens.push(tok);
    if (tok[0] === lexer.tokens.T_EOF) break;
  }
  return tokens;
}

describe("Lexer", () => {
  it("Simple case", () => {
    expect(
      test(`
    <foo><%% 
    <%# comment %>
    <%_ if (foo == "%>\\"%>") { _%>
      <%= bar %>
    <% } %>
    </foo>
    `)
    ).toMatchSnapshot();
  });

  describe("Comments", () => {
    it("simple", () => {
      expect(
        test(`
      before<%# comment %>after
      `)
      ).toMatchSnapshot();
    });

    it("injection", () => {
      expect(
        test(`
      before<%# comment /* should break */ data %>after
      `)
      ).toMatchSnapshot();
    });

    it("code with /*", () => {
      expect(
        test(`
      before<%= /* ok */ data %>after
      `)
      ).toMatchSnapshot();
    });

    it("code with //", () => {
      expect(
        test(`
      before<%= // no data %>after
      `)
      ).toMatchSnapshot();
    });

    it("code with #", () => {
      expect(
        test(`
      before<%= # no data %>after
      `)
      ).toMatchSnapshot();
    });
  });
});
