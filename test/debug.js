/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
/*jslint node: true */
"use strict";
var ejs = require('../lib/ejs');
var opt = {
  root: __dirname + '/snapshot/views/'
};

<<<<<<< HEAD
var fn = ejs.compile('<%= locals.foo ? locals.bar : locals.baz %>');
=======
var fn = ejs.compile(`
<%= locals.foo ? locals.bar : locals.baz %>
<foo><%% 
<%# comment %>
<%_ if (foo == "%>\\"%>") { _%>
  <%= bar %>
<% } %>
</foo>
`);
>>>>>>> 5702ba235ee915ac2baf679094157d08fbe50d6e
fn({
  foo: true,
  bar: 'bar',
  baz: null
}).then(function(out) {
  console.log(out);
});
/*
ejs.renderFile('page', null, opt)
  .then(function(output) {
    console.log(output);
  })
  .catch(function(err) {
    console.error(err);
  })
;**/