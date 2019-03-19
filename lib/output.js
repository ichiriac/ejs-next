/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
var path = require('path');

var output = function(engine, filename) {
  this._buffer = '';
  this._parts = [];
  this._filename = filename;
  if (engine) {
    this._engine = engine;
  } else {
    var ejs = require('./ejs');
    this._engine = new ejs();
  }
};

/**
 * Creates a new context
 */
output.prototype.push = function(data) {
  var result = new output(this._engine, this._filename);
  Object.assign(result, data);
  for(var k in this) {
    if (k[0] !== '_' && this.hasOwnProperty(k) && typeof data[k] === undefined) {
      result[k] = this[k];
    }
  }
  return result;
};

/**
 * Echo function
 */
output.prototype.echo = function(data) {
  if (typeof data.then === 'function') {
    if (this._buffer.length > 0) {
      this._parts.push(this._buffer);
    }
    this._parts.push(data);
    this._buffer = '';
  } else  {
    this._buffer += data;
  }
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
  if (typeof data.then === 'function') {
    return this.echo(
      Promise.resolve(data).then(function(text) {
        if (text === null) return null;
        return text.replace(/[&<>'"]/g, function(c) {
          return escape[c];
        });
      })
    );
  }
  if (typeof data === 'string') {
    this.echo(
      data.replace(/[&<>'"]/g, function(c) {
        return escape[c];
      })
    );
  } else {
    this.echo(
      (new String(data)).replace(/[&<>'"]/g, function(c) {
        return escape[c];
      })
    );
  }
};

/**
 * Executes an include
 */
output.prototype.include = function(filename, vars) {
  if (filename[0] !== '/') {
    filename = path.relative(
      this._engine.options.root,
      this._engine.resolveInclude(filename, this._filename, false)
    );
  }
  return this._engine.renderFile(filename, this.push(vars));
};

/**
 * Registers a block
 */
output.prototype.block = function(name, fn) {
  if (!this.blocks) {
    this.blocks = {};
  }
  if (!this.blocks[name]) {
    this.blocks[name] = [];
  }
  if (fn && typeof fn === 'function') {
    var result = fn({});
    this.blocks[name].push(result);
    return result;
  }
  return this.blocks[name];
};

/**
 * Resolves the current output
 */
output.prototype.resolveOutput = function() {
  if (this._parts.length === 0) {
    return Promise.resolve(this._buffer);
  }
  if (this._buffer.length > 0) {
    this._parts.push(this._buffer);
    this._buffer = '';
  }
  return Promise.all(this._parts).then(function(p) {
    this._buffer = p.join("");
    this._parts = [];
    return this._buffer;
  }.bind(this));
};


module.exports = output;