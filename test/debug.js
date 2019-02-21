/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
"use strict";

const parser = require('../lib/ejs');
const reader = new parser();
const program = reader.eval(`
<foo> <%%
<%# comment %>
<%_ if (foo == "%>\\"%>") { _%>
  <%= bar %>
<% } %>
</foo>
`);
console.log(program);