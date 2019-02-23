/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
var output = function(context) {
  this._parts = [];
  this._levels = [];
};

/**
 * Turn on output buffering
 */
output.prototype.ob_start = function() {
  this._levels.push(this._parts.length);
  return this;
};

/**
 * Clean (erase) the output buffer and turn off output buffering
 */
output.prototype.ob_end_clean = function() {
  if (this._levels.length > 0) {
    this._parts.splice(this._levels.pop());
  } else {
    throw new Error('Bad output level, use ob_start before');
  }
  return this;
};

/**
 * Flush (send) the output buffer and turn off output buffering
 */
output.prototype.ob_end_flush = function() {
  if (this._levels.length > 0) {
    this._levels.pop();
  } else {
    throw new Error('Bad output level, use ob_start before');
  }
};

/**
 * Clean (erase) the output buffer
 */
output.prototype.ob_clean = function() {
  if (this._levels.length > 0) {
    this._parts.splice(
      this._levels[this._levels.length - 1]
    );
  } else {
    throw new Error('Bad output level, use ob_start before');
  }
  return this;
};

/**
 * Return the contents of the output buffer
 */
output.prototype.ob_get_contents = function() {
  if (this._levels.length > 0) {
    return Promise.all(this._parts.slice(
      this._levels[this._levels.length - 1]
    )).then(function(p) {
      return p.join("");
    });
  } else {
    throw new Error('Bad output level, use ob_start before');
  }
};

/**
 * Get current buffer contents and delete current output buffer
 */
output.prototype.ob_get_clean = function() {
  var str = this.ob_get_contents();
  this.ob_end_clean();
  return str;
};

/**
 * Flush the output buffer, return it as a string and turn off output buffering
 */
output.prototype.ob_get_flush = function() {
  var str = this.ob_get_contents();
  this._levels.pop();
  return str;
};

/**
 * Return the nesting level of the output buffering mechanism
 */
output.prototype.ob_get_level = function() {
  return this._levels.length;
};

/**
 * Echo function
 */
output.prototype.echo = function(data) {
  this._parts.push(data);
  return this;
};

/**
 * list of results
 */
var escape = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&#34;',
  "'": '&#39;'
};

/**
 * Clean output function
 */
output.prototype.safeEcho = function(data) {
  return this.echo(
    Promise.resolve(data).then(function(text) {
      if (text === null) return null;
      return text.replace(/[&<>'"]/g, function(c) {
        return escape[c];
      });
    })
  );
};

/**
 * Renders the output
 */
output.prototype.toString = function() {
  return this._parts.join("");
};

/**
 * Resolves the current output
 */
output.prototype.resolveOutput = function() {
  return Promise.all(this._parts).then(function(p) {
    return p.join("");
  });
};


module.exports = output;