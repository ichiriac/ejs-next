const { transpiler } = require("../lib/transpiler");

describe("Transpiler", () => {
  it("should transpile a simple template", () => {
    const src = "Hello <% var a = 1; %>\n\n<%= a %>";
    const program = transpiler(src, { strict: false });
    expect(program).toMatchSnapshot();
  });
  it("should transpile handle pre and post whitespace", () => {
    const src = "Hello \n<%_ var a = 1; -%>\n\n<%= a _%>\nEnd";
    const program = transpiler(src, { strict: false });
    expect(program).toMatchSnapshot();
  });

  it('should handle closing tags missing', () => {
    const src = "Hello <%- name ";
    const program = transpiler(src, { strict: false });
    expect(program).toMatchSnapshot();
  });
  it("should handle unclosed tags", () => {
    const src = "Hello <%= name ";
    expect(() => {
      transpiler(src, { strict: true });
    }).toThrow();
  });
  it('should handle tag comments and opt comments', () => {
    const src = `
    <%# This is a tag comment %>
    Hello <% /* This is an opt comment */ %>
    <%= name %>
    `;
    const program = transpiler(src, { strict: false });
    expect(program).toMatchSnapshot();
  });

    it("Simple case", () => {
    var program = transpiler(
      `
    <foo> <%%
    <%# comment %>
    <%_ if (foo == "%>\\"%>") { _%>
      <%= bar %>
    <% } %>
    </foo>
    `,
      { strict: false, localsName: "foo" }
    );
    expect(program).toMatchSnapshot();
  });
});
