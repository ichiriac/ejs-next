const ejs_next = require("../lib/ejs");
const ejs = require("ejs");
const benchmark = require("benchmark");
var tpl = `
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
  random.forEach(function(c, i) {
%> <%= c.toFixed(10) + ((i + 1) % 6 === 0 ? "\\n": "") %><%
  });
%>
`;

/**
 * Test helper
 */
function test(name, fn) {
  console.log("\nStart to test " + name);
  // define benchmark
  var suite = new benchmark.Suite();
  var local1 = {},
    local2 = {};
  suite.add("ejs@1 - " + name, function () {
    fn(ejs, local1);
  });
  suite.add("ejs@2 - " + name, function () {
    fn(ejs_next, local2);
  });
  // add listeners
  suite.on("cycle", function (event) {
    console.log(String(event.target));
  });
  suite.on("complete", function () {
    console.log("> Fastest is " + this.filter("fastest").map("name"));
    console.log("------------------------------------------------");
  });
  suite.on("error", function (e) {
    console.error(e);
  });
  // run async
  suite.run();
}

// define benchmark
test("compile", function (instance) {
  instance.compile(tpl, { strict: true });
});
test("render strict (micro)", function (instance, local) {
  if (!local.fn) {
    local.fn = instance.compile("<%= locals.foo ? locals.bar : locals.baz %>", {
      strict: true,
    });
  }
  local.fn({
    foo: true,
    bar: "bar",
    baz: null,
  });
});
test("render strict", function (instance, local) {
  if (!local.fn) {
    local.fn = instance.compile(tpl, { strict: true });
  }
  local.fn();
});
test("render silent", function (instance, local) {
  if (!local.fn) {
    local.fn = instance.compile(tpl, { strict: false });
  }
  local.fn();
});
test("render include", function (instance, local) {
  if (!local.fn) {
    local.fn = instance.compile('<%= include("/views/foo.ejs", { name: "foo" }) %>', {
      strict: true,
      root: __dirname,
    });
  }
  local.fn({ name: "world" });
});
