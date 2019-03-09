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

// compressed version
var UglifyJS = require('uglify-js');
var result = UglifyJS.minify(code, {
  mangle: true
});
if (result.error) {
  fs.writeFileSync("dist/ejs.js", code);
  console.error(result.error);
} else {
  fs.writeFileSync("dist/ejs.js", code);
  fs.writeFileSync("dist/ejs.min.js", result.code);
  console.log("Uncompressed size : " + Math.round(code.length / 102.4) / 10 + 'Ko');
  var count = (code.match(/^\s*[A-Za-z0-9\}\)\;]+/gm) || []).length;
  console.log("Lines of code     : " + count);
  console.log("Compressed size   : " + Math.round(result.code.length / 102.4) / 10 + 'Ko');

}