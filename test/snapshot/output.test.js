/**
 * Copyright (C) 2019 Ioan CHIRIAC (MIT)
 * @authors https://github.com/ichiriac/ejs2/graphs/contributors
 * @url https://ejs.js.org
 */
"use strict";

const ejs = require('../../lib/ejs');

describe('Output', () => {
  it('Sanitize', (done, reject) => {
    ejs.render(`Hello <%= name %>`, { name: '<&">' }).then(function(output) {
      expect(output).toMatchSnapshot();
      done();
    }).catch(reject);
  });  
});