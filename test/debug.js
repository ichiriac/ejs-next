/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
"use strict";
const ejs = require('../lib/ejs');
const ejs1 = require('ejs');
const tpl = `<%= include('foo.ejs', { name: "John Wick" }) %>`;
ejs.render(tpl, { name: 'World' }, { root: __dirname })
  .then(function(output) {
    console.log(output);
    // console.log(ejs1.render(tpl));
  })
  .catch(function(err) {
    console.error(err);
  })
;