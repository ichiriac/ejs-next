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
<%_ layout("snapshot/views/layout.ejs", {
  title: "Hello world"
}) _%>
<%- include("/foo.ejs") %>
<% block('js', '<script src="#1">') %>
`, { strict: false, root: __dirname });
for(var i = 0; i < 1; i++) {
  fn({
    foo: true,
    bar: 'bar',
    baz: null
  }).then(function(output) {
    console.log(output);
  }).catch(function(e) {
    console.error(e);
  });
}
/*
ejs.renderFile('page', null, opt)
  .then(function(output) {
    console.log(output);
  })
  .catch(function(err) {
    console.error(err);
  })
;**/