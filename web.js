/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
var fs = require('fs');
var extract = function(file) {
  var contents = fs.readFileSync(file).toString();
  contents = "// " + file + " at " + (new Date()).toString() + "\n" + contents;
  return contents
    .replace(/var\s[^=]+\s=\srequire\([^\)]+\);/g, '')
    .replace(/module\.exports[^;]+;/g, '')
  ;
};


var output = [];
[
  "lib/lexer.js",
  "lib/compile.js",
  "lib/output.js",
  "lib/context.js",
  "lib/ejs.js"
].forEach(function(file) {
  output.push(extract(file));
})

var code = fs.readFileSync("lib/browser.js").toString();
code = code.replace(/\/\/ @body/g, output.join(""));
fs.writeFileSync("dist/ejs.js", code);
