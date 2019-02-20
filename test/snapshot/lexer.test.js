const lexer = require('../../lib/parser/lexer');

describe('Lexer', () => {
  it('Simple case', () => {
    var lex = new lexer();
    lex.input(`
    <foo>
    <%# comment %>
    <%_ if (foo == "%>\\"%>") { _%>
      <%= bar %>
    <% } %>
    </foo>
    `);
    var tokens = [];
    while(true) {
      var tok = lex.next();
      tokens.push(tok);
      if (tok[0] === lexer.tokens.T_EOF) break;
    }
    expect(tokens).toMatchSnapshot();
  });
});