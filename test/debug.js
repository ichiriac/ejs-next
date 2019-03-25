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
<%= include("/foo.ejs") %>
`, { strict: true, root: __dirname });
for(var i = 0; i < 10; i++) {
  fn({
    foo: true,
    bar: 'bar',
    baz: null
  }).then(function(output) {
    console.log(output);
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