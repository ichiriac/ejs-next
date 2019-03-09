/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
"use strict";

const ejs = require('../lib/ejs');
ejs.render(`
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
`,
    { 
      name: 'World' 
    },
    {
      strict: true
    }
  )
  .then(function(output) {
    console.log(output);
  })
;