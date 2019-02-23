/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
var context = function(initial) {
  this.state = [];
  if (initial) {
    this.push(initial);
  }
};

/**
 * Injects a list of variables
 */
context.prototype.push = function(vars) {
  this.state.push(vars);
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

context.prototype.pop = function() {
  this.state.pop();
  return this;
};

context.prototype.set = function(key, value) {
  this.state[this.state.length - 1][key] = value;
  return this;
};

context.prototype.get = function(key) {
  for(var i = this.state.length - 1; i > -1 ; i--) {
    if (this.state[i].hasOwnProperty(key)) {
      return this.state[i][key];
    }
  }
  return null;
};

/**
 * Creates a new context instance
 */
context.create = function(obj) {
  if (typeof Proxy === 'function') {
    return new Proxy(new context(obj), {
      get: function(ctx, prop) {
        return ctx.get(prop);
      },
      set: function(ctx, prop, value) {
        return ctx.set(prop, value);
      }
    });
  }
  return new context(obj);
};

module.exports = context;