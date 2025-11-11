const transpiler = require("../lib/transpile");
const Lexer = require("../lib/lexer");

function run(name, src, opts) {
  console.log("---[", name, "]---");
  try {
    const program = transpiler(new Lexer(), src, opts);
    console.log(program);
  } catch (e) {
    console.error("Error:", e);
  }
}

// Case 1: simple
run(
  "simple",
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

// Case 2: include-ish
run(
  "include",
  `
    Before Include
    <%- include(foo, function() {@ %>
      Header of Inner Block
      <%- include(bar, function() {@ %>
      Footer of Inner Block
      <% @}) %>  
    <% @}) %>
    After Include
    `,
  { strict: false }
);

// Case 3: strict mode
run(
  "strict",
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

// Case 4: redirected output
run(
  "redirect",
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

// Case 5: more complex
run(
  "complex",
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
