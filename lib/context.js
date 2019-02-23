/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
var output = require('./output');

var context = function(initial, engine) {
  this._state = [];
  this._engine = engine;
  if (initial) {
    this.push(initial);
  }
  this._output = new output(this);
};

/**
 * Injects a list of variables
 */
context.prototype.push = function(vars) {
  this._state.push(vars);
  for(var k in vars) {
    if (!this.hasOwnProperty(k)) {
      Object.defineProperty(
        this, k, {
          configurable: true,
          enumerable: true,
          get: this.get.bind(this, k),
          set: this.set.bind(this, k)
        }
      );
    }
  }
  return this;
};

/**
 * Removes the state
 */
context.prototype.pop = function() {
  this._state.pop();
  return this;
};

/**
 * Executes an include
 */
context.prototype.include = function(filename, vars) {
  if (typeof vars === 'function') {
    this.ob_start();
    vars();
    vars = {
      contents: this.ob_get_clean()
    };
  }
  this.push(vars);
  this.ob_start();
  this.engine.renderFile(filename, this);
  this.pop();
  return this.ob_get_clean();
};

/**
 * expose output functions
 */
for(var k in output.prototype) {
  (function(property) {
    context.prototype[property] = function() {
      return this._output[property].apply(this._output, arguments);
    };
  })(k);
}

/**
 * Sets a value
 */
context.prototype.set = function(key, value) {
  this._state[this._state.length - 1][key] = value;
  return this;
};

/**
 * Gets a value
 */
context.prototype.get = function(key) {
  if (key[0] !== '_' && context.prototype.hasOwnProperty(key)) {
    return this[key].bind(this);
  }
  for(var i = this._state.length - 1; i > -1 ; i--) {
    if (this._state[i].hasOwnProperty(key)) {
      return this._state[i][key];
    }
  }
  return null;
};

/**
 * Basic proxy handler (for native instructions)
 */
var proxyHandler =  {
  get: function(ctx, prop) {
    return ctx.get(prop);
  },
  set: function(ctx, prop, value) {
    return ctx.set(prop, value);
  },
  has: function (ctx, prop) {
    return prop[0] !== '_';
  }
};

/**
 * Creates a new context instance
 */
context.create = function(obj, engine) {
  if (obj instanceof Proxy || obj instanceof context) {
    // bypass (already instanciated)
    return obj;
  }
  if (typeof Proxy === 'function') {
    return new Proxy(new context(obj, engine), proxyHandler);
  }
  return new context(obj, engine);
};

module.exports = context;