/**
 * Copyright (C) 2022 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs-next/graphs/contributors
 * @url https://ejs.js.org
 */
/*jslint node: true */
"use strict";
var ejs = require("../lib/ejs");
var opt = {
  root: __dirname + "/snapshot/views/",
};

  ejs.renderFile('page.ejs',{}, opt)
  .then(function (output) {
    console.log(output);
  })
  .catch(function (e) {
    console.error(e);
  });

var fn = ejs.compile(
  `
OK, so have fun! :D
-------------------
<%
    var fruits = ["Apple", "Pear", "Orange", "Lemon"]
      , random = " ".repeat(198).split("").map(function(x) { return Math.random() })
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
`,
  { strict: false, root: __dirname }
);
for (var i = 0; i < 1; i++) {
  Promise.resolve(
    fn({
      foo: true,
      bar: "bar",
      baz: null,
    })
  )
    .then(function (output) {
      console.log(output);
    })
    .catch(function (e) {
      console.error(e);
    });
}
