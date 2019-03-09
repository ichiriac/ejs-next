const ejs2 = require('../lib/ejs');
const ejs = require('ejs');
const benchmark = require('benchmark');
var tpl = `
OK, so have fun! :D
-------------------
<%
    var fruits = ["Apple", "Pear", "Orange", "Lemon"]
      , random = " ".repeat(198).split("").map(x => Math.random())
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
  // define benchmark
  var suite = new benchmark.Suite;
  suite.add('ejs1 - ' + name, function() {
    fn(ejs);
  });
  suite.add('ejs2 - ' + name, function() {
    fn(ejs2);
  });
  // add listeners
  suite.on('cycle', function(event) {
    console.log(String(event.target));
  });
  suite.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  });
  // run async
  suite.run();
}

// define benchmark
test('compile', function(instance) {
  instance.compile(tpl);
});
test('render strict', function(instance) {
  instance.render(tpl, null, { strict: true });
});
test('render silent', function(instance) {
  instance.render(tpl, null, { strict: false });
});
test('render strict (micro)', function(instance) {
  instance.render('<%= locals.foo ? locals.bar : locals.baz %>', {
    foo: true,
    bar: 'bar',
    baz: null
  });
});

