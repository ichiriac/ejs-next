const lexer = require("../lib/lexer");

const snapshotSource = (src, delimiter) => {
  const lexerInstance = new lexer(delimiter);
  lexerInstance.input(src);
  const tokens = [];
  let token;
  do {
    token = lexerInstance.next();
    tokens.push(token);
  } while (token[0] !== lexer.tokens.T_EOF);
  expect(tokens).toMatchSnapshot();

}

describe("Lexer", () => {
  it("should tokenize a simple template", () => {
    snapshotSource("Hello <% var a = 1; %> <%= a %>");
  });

  it("should tokenize a comment", () => {
    snapshotSource("Hello <% # this is a % comment %>");
    snapshotSource("Hello <% # this is a comment _%>");
    snapshotSource("Hello <% // this is a comment\n var = 1; %>");
  });

  it("should tokenize whitespace control", () => {
    snapshotSource("Hello <%_ var a = 1; _%> <%= a %>");
  });

  it("should tokenize escaped output", () => {
    snapshotSource("Value: <%= value %>");
  });

  it("should tokenize unescaped output", () => {
    snapshotSource("Value: <%- value -%>");
  }); 

  it("should tokenize texts", () => {
    snapshotSource('<%= "Hello, \\n World!" %>');
  });

  it("should tokenize comment tags", () => {
    snapshotSource('<%# this is a comment %>');
  });

  it("should tokenize multilne comments", () => {
    snapshotSource('<% /* this is a comment, and closing tag %> is ignored */ %>');
  });
  it("should tokenize regexps", () => {
    snapshotSource('<% var re = /<%.*%>/g; %>');
  });
  it("more tests", () => {
    snapshotSource('<% var a = 1; %> ...');
    snapshotSource('<% var a = 1; ');
    snapshotSource('<%# var a = 1; ');
    snapshotSource('<%% var a = 1; ');
    snapshotSource('<?= foo ?>', '?');
  });
});
