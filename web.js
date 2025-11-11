/**
 * Copyright (C) 2025 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs-next/graphs/contributors
 * @url https://ejs.js.org
 */
var fs = require("fs");
var extract = function (file) {
  var contents = fs.readFileSync(file).toString();
  contents = "// " + file + " at " + new Date().toString() + "\n" + contents;
  return contents
    .replace(/var\s[^=]+\s=\srequire\([^\)]+\);/g, "")
    .replace(/const\s[^=]+\s=\srequire\([^\)]+\);/g, "")
    .replace(/"use strict";/g, "")
    .replace(/module\.exports[^;]+;/g, "");
};

var full = [];
var runtime = [];
["lib/lexer.js", "lib/transpile.js", "lib/output.js", "lib/ejs.js"].forEach(
  function (file) {
    full.push(extract(file));
  }
);

["lib/output.js", "lib/ejs.js"].forEach(function (file) {
  runtime.push(extract(file));
});

var code = fs.readFileSync("lib/browser.js").toString();
full = code.replace(/\/\/ @body/g, full.join("").replace(/\$/gm, "$$$$"));
runtime = code.replace(/\/\/ @body/g, runtime.join("").replace(/\$/gm, "$$$$"));

// compressed version
var UglifyJS = require("uglify-es");
fs.writeFileSync("dist/ejs.js", full);
var full_min = UglifyJS.minify(full, {
  mangle: true,
});
var runtime_min = UglifyJS.minify(runtime, {
  mangle: true,
});

if (full_min.error) {
  console.error(full_min.error);
  var src = full
    .split("\n")
    .slice(full_min.error.line - 5, full_min.error.line + 5);
  src[4] = "> " + src[4];
  console.log(src.join("\n"));
} else {
  fs.writeFileSync("dist/ejs.runtime.js", runtime);
  fs.writeFileSync("dist/ejs.min.js", full_min.code);
  fs.writeFileSync("dist/ejs.runtime.min.js", runtime_min.code);
  /** STATISTICS **/
  var count = (full.match(/^\s*[A-Za-z0-9\}\)\;]+/gm) || []).length;
  console.log("Lines of code     : " + count);
  console.log(
    "Uncompressed size : " + Math.round(full.length / 102.4) / 10 + "Ko"
  );
  console.log(
    "Compressed size   : " +
      Math.round(full_min.code.length / 102.4) / 10 +
      "Ko"
  );
  console.log(
    "Runtime comp size : " +
      Math.round(runtime_min.code.length / 102.4) / 10 +
      "Ko"
  );
}
