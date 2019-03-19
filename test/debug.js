/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
"use strict";
const ejs = require('../lib/ejs');
const opt = {
  root: __dirname + '/snapshot/views/'
};

var fn = ejs.compile(`
<%= locals.foo ? locals.bar : locals.baz %>
<foo><%% 
<%# comment %>
<%_ if (foo == "%>\\"%>") { _%>
  <%= bar %>
<% } %>
</foo>
`);
fn({
  foo: true,
  bar: 'bar',
  baz: null
}).then(function(out) {
  console.log(out)
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