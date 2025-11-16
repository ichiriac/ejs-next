/**
 * Copyright (C) 2025 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs-next/graphs/contributors
 * @url https://ejs.js.org
 */
"use strict";
const { transpiler, compiler } = require("../lib/transpiler");

describe("Transpiler", () => {
  it("should transpile a simple template", () => {
    const src = "Hello <% var a = 1; %>\n\n<%= a %>";
    const program = transpiler(src, { strict: false });
    expect(program).toMatchSnapshot();
  });
  it("should transpile handle pre and post whitespace", () => {
    const src = "Hello \n<%_ var a = 1; -%>\n\n<%= a _%>\nEnd";
    const program = transpiler(src, { strict: false });
    expect(program).toMatchSnapshot();
  });

  it('should handle closing tags missing', () => {
    const src = "Hello <%- name ";
    const program = transpiler(src, { strict: false });
    expect(program).toMatchSnapshot();
  });
  it("should handle unclosed tags", () => {
    const src = "Hello <%= name ";
    expect(() => {
      transpiler(src, { strict: true });
    }).toThrow();
  });
  it('should handle tag comments and opt comments', () => {
    const src = `
    <%# This is a tag comment %>
    Hello <% /* This is an opt comment */ %>
    <%= name %>
    `;
    const program = transpiler(src, { strict: false });
    expect(program).toMatchSnapshot();
  });

  it("Simple case", () => {
    var program = transpiler(
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

  it("test globals", () => {
    var program = compiler(
      `<%= Math.PI %><%= include %><%= var1 %>`,
      { strict: false, localsName: "foo" }
    );
    expect(program.toString()).toMatchSnapshot();
  });
  it("test globals / strict", () => {
    var program = compiler(
      `<%= Math.PI %><%= include %><%= var1 %>`,
      { strict: true, localsName: "foo" }
    );
    expect(program.toString()).toMatchSnapshot();
  });
  it("test property access", () => {
    var program = compiler(
      `<%= arr['foo'].bar %>`,
      { strict: true, localsName: "foo" }
    );
    expect(program.toString()).toMatchSnapshot();
  });
  it("test assignment access", () => {
    var program = compiler(
      `<% var arr  = [bar, 2, 3]; %>`,
      { strict: true, localsName: "foo" }
    );
    expect(program.toString()).toMatchSnapshot();
  });
  it("test var declaration", () => {
    var program = compiler(
      `<% var arr; %>`,
      { strict: true, localsName: "foo" }
    );
    expect(program.toString()).toMatchSnapshot();
  });  
  it("test local assignement access", () => {
    var program = compiler(
      `<% arr = [bar, 2, 3]; %>`,
      { strict: true, localsName: "foo" }
    );
    expect(program.toString()).toMatchSnapshot();
  });  
  it("test assignment error", () => {
    expect(() => {
      compiler('<% var [ arr ] = [ 1 ]; %>', { strict: true });
    }).toThrow();
  });  
  it("test local assignment error", () => {
    expect(() => {
      compiler('<% [ arr ] = [ 1 ]; %>', { strict: true });
    }).toThrow();
  });
  it("test property access", () => {
    var program = compiler(
      `<% arr = { foo: bar }; %>`,
      { strict: true, localsName: "foo" }
    );
    expect(program.toString()).toMatchSnapshot();
  });  
  it("test computed property access", () => {
    var program = compiler(
      `<% arr = { [arg]: bar }; %>`,
      { strict: true, localsName: "foo" }
    );
    expect(program.toString()).toMatchSnapshot();
  });    
  it("test without options", () => {
    var program = compiler(
      `<%= bar %>`
    );
    expect(program.toString()).toMatchSnapshot();
  });  
  it("test default template", () => {
    var program = compiler(`
OK, so have fun! :D
-------------------
<%
    var fruits = ["Apple", "Pear", "Orange", "Lemon"]
      , random = " ".repeat(198).split("").map(function(x) { return Math.random(); })
      ;
%>

These fruits are amazing:
<%_ for(var i = 0; i < fruits.length; ++i) { %>
  - <%=fruits[i]%>s
<%_ } %>

Let's see some random numbers:

<% 
  random.forEach(function foo(c, i) {
%> <%= c.toFixed(10) + ((i + 1) % 6 === 0 ? "\\n": "") %><%
  });
%>
`);
    expect(program.toString()).toMatchSnapshot();
  });

  it("test nested methods (with local args)", () => {
    var program = compiler(
      `<% function outer(arg) { %>
         <% function inner() { return arg + globalVar; } %>
         <%= inner() %>
       <% } %>
       <%= outer("test") %>`,
      { strict: true, localsName: "foo" }
    );
    expect(program.toString()).toMatchSnapshot();
  });
  
});