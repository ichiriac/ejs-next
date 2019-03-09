/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
var output = require('./output');
// remove from proxy scope
var unscopables = {
  locals: true,
  Math: true,
  Date: true,
  global: true,
  window: true,
  Function: true
};
for(var k in global || window) {
  unscopables[k] = true;
}
/**
 * Basic proxy handler (for native instructions)
 */
var proxyHandler =  {
  get: function(ctx, prop) {
    if (prop === Symbol.unscopables) return unscopables;
    if (ctx[prop] === undefined) {
      ctx[prop] = new Proxy({}, proxyHandler);
    }
    return ctx[prop];
  },
  set: function(ctx, prop, value) {
    ctx[prop] = value;
  },
  has: function (ctx, prop) {
    return !unscopables.hasOwnProperty(prop);
  }
};

/**
 * Creates a new context instance
 */
context = function(obj, engine) {
  if (obj instanceof Proxy) {
    // bypass (already instanciated)
    return obj;
  }
  var ctx = Object.assign(new output(engine), obj);
  if (!engine.options.strict && typeof Proxy === 'function') {
    for(var i in ctx) {
      if (typeof ctx[i] === 'function') {
        ctx[i] = ctx[i].bind(ctx);
      }
    }
    return new Proxy(ctx, proxyHandler);
  }
  return ctx;
};

module.exports = context;