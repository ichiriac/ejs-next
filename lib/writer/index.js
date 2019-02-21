/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
"use strict";

var writer = function() {

};

writer.prototype.generate = function(program, argName, filename) {
  var code = [];
  var sanitize = [];
  var output = 'o_' + argName;
  code.push('var ' + output + ' = [];');
  code.push('with(' + argName + ') {');
  // statements
  for(var i = 0; i < program.childs.length; i++) {
    var child = program.childs[i];
    switch(child.kind) {
      case 'inline':
        if (i + 1 < program.childs.length && program.childs[i + 1].preStrip) {
          child.source = child.source.replace(/[\s\n]+$/, '');
        }
        if (child.source.length > 0) {
          code.push('\t' + output + '.push(`' + child.source.replace(/`/g, '\\`') + '`);');
        }
        break;
      case 'output':
        if (child.sanitize) {
          sanitize.push(i);
        }
        child.source = child.source.replace(/[;\s\n]+$/, '');
        child.source = child.source.replace(/[\s\n]+$/, '');
        if (child.source.length > 0) {
          code.push('\t' + output + '.push(' + child.source + ');');
        }
        break;
      case 'comment':
        code.push('\t/* ' + child.source.replace(/\*\//, '') + ' */');
        break;
      case 'statement':
        code.push('\t' + child.source);
        if (
          child.postStrip && 
          i + 1 < program.childs.length && 
          program.childs[i + 1].kind === 'inline'
        ) {
          program.childs[i + 1].source = program.childs[i + 1].source.replace(/^[\s\n]+/, '');
        }
        break;
    }
  }
  code.push('}');
  code.push('return Promise.all(' + output + ').then(function(p) {');
  if (sanitize.length > 0) {
    code.push('\t[' + sanitize.join(',') + '].forEach(function(i) {');
    code.push('\t\tp[i] = sanitize(p[i]);');
    code.push('\t});');
  }
  code.push('\treturn p.join("");');
  code.push('});');
  return code.join("\n");
};

module.exports = writer;