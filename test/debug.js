const lexer = require('../lib/parser/lexer');
var lex = new lexer();
lex.input(`
<foo>
<%# comment %>
<%_ if (foo) { _%>
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
console.log(tokens);