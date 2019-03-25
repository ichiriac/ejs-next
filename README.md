# ejs-next
[![Coverage Status](https://coveralls.io/repos/github/ichiriac/ejs-next/badge.svg?branch=master)](https://coveralls.io/github/ichiriac/ejs-next?branch=master)
[![Build Status](https://travis-ci.org/ichiriac/ejs-next.svg?branch=master)](https://travis-ci.org/ichiriac/ejs-next)

EJS next generation

---

## Install 

```
npm install ejs-next
```

## Changes

- Using async actions with promises (on files actions)
- Improved performances on parser
- Introduce a new JS tags for capturing outputs
- Introduce new functions : `layout` & `block`

## Syntax

The syntax is the same as classic EJS, with the introduction of a little new content wrapper :

- `{@` : start to capture output
- `@}` : returns the captured output

### Usage :

```ejs
<html>
... <%- include('foo.ejs', {
      inner: (name) => {@
        %>
          Hello <%= name %>
        <%
      @}
    }) %>
</html>
--- and foo.ejs :
<%= inner('John Smith'); %>
```

## Layout

The layout will replace the output with the specified file, and put the current output into a contents variable.

```ejs
<%_ layout('main') _%>
Here is my page content
--- main.ejs :
<body>
  <%- contents %>
</body>
```

## Block

The block registers/concatenate the specified output in order to output it elsewhere. Note that by using promise actions the orders in which statements are called may not be preserved.

```ejs
<%_ block('js', '<script src="...">') _%>
Here is my page content
--- main.ejs :
<body>
  <%- js %>
</body>
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