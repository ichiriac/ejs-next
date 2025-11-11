/**
 * Copyright (C) 2025 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs-next/graphs/contributors
 * @url https://ejs.js.org
 */
"use strict";

const lexer = require("../../lib/lexer");
const transpiler = require("../../lib/transpile");

describe("Transpiler", () => {
  it("Simple case", () => {
    var program = transpiler(
      new lexer(),
      `
    <foo> <%%
    <%# comment %>
    <%_ if (foo == "%>\\"%>") { _%>
      <%= bar %>
    <% } %>
    </foo>
    `,
      { strict: false, localsName: "foo" }
    );
    expect(program).toMatchSnapshot();
  });

  it("Simple case", () => {
    expect(
      transpiler(
        new lexer(),
        `
    Before Include
    <%- include(foo, function() {@ %>
      Header of Inner Block
      <%- include(bar, function() {@ %>
      Footer of Inner Block
      <% @}) %>  
    <% @}) %>
    After Include
    `
      )
    ).toMatchSnapshot();
  });

  it("Simple case / strict mode", () => {
    var program = transpiler(
      new lexer(),
      `
    <foo> <%%
    <%# comment %>
    <%_ if (foo == "%>\\"%>") { _%>
      <%= bar %>
    <% } %>
    </foo>
    `,
      { strict: true, localsName: "fooBar" }
    );
    expect(program).toMatchSnapshot();
  });
  it("Template with redirected output", () => {
    var program = transpiler(
      new lexer(),
      `
      <%- include('foo', {
          contents: function() {@ %>
            Hello world
          <% @}
        })
      %>
    `,
      { strict: true, localsName: "_" }
    );
    expect(program).toMatchSnapshot();
  });
  it("More complex", () => {
    var program = transpiler(
      new lexer(),
      `
OK, so have fun! :D
-------------------
<%
    var fruits = ["Apple", "Pear", "Orange", "Lemon"]
      , random = " ".repeat(198).split("").map(x => Math.random())
      ;
%>

These fruits are amazing:
<%_ for(var i = 0; i < fruits.length; ++i) { _%>

  - <%= fruits[i] %>s
<%_ } _%>

Let's see some random numbers:

<% 
  random.forEach(function(c, i) {
%> <%= c.toFixed(10) + ((i + 1) % 6 === 0 ? "\\n": "") %><%
  });
%>

Hello <%= locals.name %> !
    `,
      { strict: false, localsName: "foo" }
    );
    expect(program).toMatchSnapshot();
  });
});
