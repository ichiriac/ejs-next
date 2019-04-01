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

var fn = ejs.compile(`
    Before Include
    <%- include(foo, function() {@ %>
      Header of Inner Block
      <%- include(bar, function() {@ %>
      Footer of Inner Block
      <% @}) %>  
    <% @}) %>
    After Include
`, { strict: false, root: __dirname });
for(var i = 0; i < 1; i++) {
  Promise.resolve(
    fn({
      foo: true,
      bar: 'bar',
      baz: null
    })
  ).then(function(output) {
    console.log(output);
  }).catch(function(e) {
    console.error(e);
  });
}