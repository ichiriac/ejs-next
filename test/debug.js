/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
"use strict";

const ejs = require('../lib/ejs');
ejs.render(`
  <%_ if (wat) { _%>
    ok
  <%_ } _%>
`, { name: 'World' })
  .then(function(output) {
    console.log(output);
  })
;