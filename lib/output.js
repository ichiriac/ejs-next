/**
 * Copyright (C) 2022 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
"use strict";

/**
 * Output handler
 */
var output = function () {
  this.hook = null;
  this.output = [];
  this.offset = -1;
  this.sanitize = [];
  this.isPromise = true;
};

/**
 * Sanitize the string
 */
var sanitizeRegex = /[&<>'\"]/g;
output.sanitize = function (str) {
  if (typeof str != "string") str = str.toString();
  return str.replace(sanitizeRegex, function (c) {
    if (c == "&") return "&amp;";
    if (c == "<") return "&lt;";
    if (c == ">") return "&gt;";
    if (c == '"') return "&#34;";
    if (c == "'") return "&#39;";
    return c;
  });
};

output.prototype.buffer = function (msg) {
  /**
   * Buffers current state
   */
  var hook = this.hook;
  var output = this.output;
  var offset = this.offset;
  var sanitize = this.sanitize;
  var isPromise = this.isPromise;

  /**
   * Re-initialize buffers
   */
  this.hook = null;
  this.output = [];
  this.offset = -1;
  this.sanitize = [];
  this.isPromise = true;

  /**
   * Flush contents
   */
  return function () {
    var result = this.toString();
    this.hook = hook;
    this.output = output;
    this.offset = offset;
    this.sanitize = sanitize;
    this.isPromise = isPromise;
    return result;
  }.bind(this);
};

/**
 * Outputs a string
 */
output.prototype.write = function (msg) {
  if (msg == null) return;
  var isString = typeof msg == "string";
  if (!isString && typeof msg.then != "function") {
    msg = msg.toString();
    isString = true;
  }
  if (isString) {
    if (this.isPromise) {
      this.output.push(msg);
      this.isPromise = false;
      this.offset++;
    } else {
      this.output[this.offset] += msg;
    }
  } else {
    this.isPromise = true;
    this.offset++;
    this.output.push(msg);
  }
};

/**
 * safe mode
 */
output.prototype.safe_write = function (msg) {
  if (msg == null) return;
  var isString = typeof msg == "string";
  if (!isString && typeof msg.then != "function") {
    msg = msg.toString();
    isString = true;
  }
  if (isString) {
    if (this.isPromise) {
      this.output.push(output.sanitize(msg));
      this.isPromise = false;
      this.offset++;
    } else {
      this.output[this.offset] += output.sanitize(msg);
    }
  } else {
    this.isPromise = true;
    this.offset++;
    this.sanitize.push(this.offset);
    this.output.push(msg);
  }
};

/**
 * Renders the output
 */
output.prototype.toString = function () {
  var result;
  if (this.offset == -1) {
    result = "";
  } else if (this.offset == 0) {
    result = this.output[0];
  } else {
    result = Promise.all(this.output).then(
      function (parts) {
        for (var i = 0, l = this.sanitize.length; i < l; i++) {
          var offset = this.sanitize[i];
          parts[offset] = output.sanitize(
            parts[offset] == null ? "" : parts[offset]
          );
        }
        return parts.join("");
      }.bind(this)
    );
  }
  if (this.hook) {
    if (result.then) {
      return result.then(
        function (result) {
          return this.hook(result);
        }.bind(this)
      );
    }
    result = this.hook(result);
  }
  return result;
};

module.exports = output;
