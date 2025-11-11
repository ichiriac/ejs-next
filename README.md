# ejs-next

[![Coverage Status](https://coveralls.io/repos/github/ichiriac/ejs-next/badge.svg?branch=master)](https://coveralls.io/github/ichiriac/ejs-next?branch=master)

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
      inner: function(name) => {@
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
var ejs = require("ejs-next");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejs.__express);
app.set("view engine", "ejs");
```

### IDE Integration with Syntax Highlighting

VSCode:Javascript EJS by _DigitalBrainstem_

## Related projects

There are a number of implementations of EJS:

- MDE's implementation, the v2 of the library: https://github.com/mde/ejs
- TJ's implementation, the v1 of the library: https://github.com/tj/ejs
- Jupiter Consulting's EJS: http://www.embeddedjs.com/
- EJS Embedded JavaScript Framework on Google Code: https://code.google.com/p/embeddedjavascript/
- Sam Stephenson's Ruby implementation: https://rubygems.org/gems/ejs
- Erubis, an ERB implementation which also runs JavaScript: http://www.kuwata-lab.com/erubis/users-guide.04.html#lang-javascript
- DigitalBrainstem EJS Language support: https://github.com/Digitalbrainstem/ejs-grammar

## License

MIT License - Copyright (c) 2022 Ioan CHIRIAC
