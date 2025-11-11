"use strict";
const ejs = require("../../lib/ejs");

describe("Loop constructs", () => {
  it("for loop", async () => {
    const tpl = `Items:<% for(var i=0;i<3;i++){ %> [<%= i %>]<% } %>`;
    const out = await ejs.render(tpl, {});
    expect(out).toMatchSnapshot();
  });

  it("while loop", async () => {
    const tpl = `<% var i=0; while(i<3){ %><%= i++ %>-<% } %>`;
    const out = await ejs.render(tpl, {});
    expect(out).toMatchSnapshot();
  });

  it("forEach callback", async () => {
    const tpl = `<% var list=["a","b","c"]; list.forEach(function(x,idx){ %>(<%= idx %>:<%= x %>)<% }); %>`;
    const out = await ejs.render(tpl, {});
    expect(out).toMatchSnapshot();
  });

  it("forEach callback from file", async () => {
    const out = await ejs.renderFile('loop.ejs', {
      stats: [
        { id: 1, label: "Alice", value: 30 },
        { id: 2, label: "Bob", value: 25 },
        { id: 3, label: "Charlie", value: 35 }
      ]
    }, { root: __dirname + '/views' });
    expect(out).toMatchSnapshot();
  });
});
