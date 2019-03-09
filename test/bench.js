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

// define benchmark
var suite = new benchmark.Suite;
suite.add('ejs1 - compile', function() {
  ejs.compile(tpl);
});
suite.add('ejs2 - compile', function() {
  ejs2.compile(tpl);
});
// add listeners
suite.on('cycle', function(event) {
  console.log(String(event.target));
});
suite.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
  // define benchmark
  var suite2 = new benchmark.Suite;
  suite2.add('ejs1 - render', function() {
    ejs.render(tpl);
  });
  suite2.add('ejs2 - render', function() {
    ejs2.render(tpl);
  });
  // add listeners
  suite2.on('cycle', function(event) {
    console.log(String(event.target));
  });
  suite2.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  });
  // run async
  suite2.run({ 'async': true });
});
// run async
suite.run({ 'async': true });
