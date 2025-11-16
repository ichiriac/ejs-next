/**
 * Copyright (C) 2025 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs-next/graphs/contributors
 * @url https://ejs.js.org
 */
/*jslint node: true */
"use strict";
const ejs = require("../lib/ejs");
const { compiler } = require("../lib/transpiler");
var opt = {
  root: __dirname + "/views/",
};
const src = "Hello <%= name %>, pi is approx. <%= Math.PI.size %>, can also <%= Math['PI'] %>!";
const fn = compiler(src, { strict: false });

    ejs
      .render(`
<% title = 'Hello World' %>
<% var contents = () => { %>
  Hello <%= name %>
<% } %>
<%- include('layout.ejs', { name: 'John Wick' }) %>
        `, { name: "World" })
      .then(function (output) {
        console.log(output);
      });