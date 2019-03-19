# ejs-next
[![Coverage Status](https://coveralls.io/repos/github/ichiriac/ejs-next/badge.svg?branch=master)](https://coveralls.io/github/ichiriac/ejs-next?branch=master)
[![Build Status](https://travis-ci.org/ichiriac/ejs-next.svg?branch=master)](https://travis-ci.org/ichiriac/ejs-next)

EJS next generation

---

## Install 

```
npm install ejs-next
```

## Express usage

```js
var ejs = require('ejs-next');
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs',  ejs.renderFile);
app.set('view engine', 'ejs');
```

## License

MIT License - Copyright (c) 2019 Ioan CHIRIAC