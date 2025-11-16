# API Reference

Complete reference for all EJS-Next methods and configuration options.

## Static Methods

### `ejs.render(template, data, options)`

Renders a template string with the provided data.

**Parameters:**
- `template` (String): The EJS template string to render
- `data` (Object): Data object to pass to the template
- `options` (Object, optional): Configuration options

**Returns:** `Promise<String>` - Resolves with the rendered HTML

**Example:**
```javascript
const ejs = require('ejs-next');

ejs.render('Hello <%= name %>!', { name: 'World' })
  .then(html => console.log(html))
  .catch(err => console.error(err));
// Output: Hello World!
```

**With Options:**
```javascript
ejs.render(templateString, data, {
  cache: true,
  strict: false,
  delimiter: '%'
})
.then(html => console.log(html));
```

---

### `ejs.renderFile(filename, data, options)`

Renders a template file with the provided data.

**Parameters:**
- `filename` (String): Path to the EJS template file
- `data` (Object): Data object to pass to the template
- `options` (Object, optional): Configuration options

**Returns:** `Promise<String>` - Resolves with the rendered HTML

**Example:**
```javascript
const ejs = require('ejs-next');

ejs.renderFile('./views/page.ejs', {
  title: 'My Page',
  content: 'Hello World'
}, {
  root: './views',
  cache: false
})
.then(html => console.log(html))
.catch(err => console.error(err));
```

**Error Handling:**
```javascript
ejs.renderFile('./views/template.ejs', data, { strict: true })
  .then(html => {
    // Handle successful render
  })
  .catch(err => {
    console.error('Rendering failed:', err.message);
  });
```

---

### `ejs.compile(template, options)`

Compiles a template string into a reusable render function.

**Parameters:**
- `template` (String): The EJS template string to compile
- `options` (Object, optional): Configuration options

**Returns:** `Function(data) => Promise<String>` - A function that renders the template with data

**Example:**
```javascript
const ejs = require('ejs-next');

// Compile once
const compiled = ejs.compile('Hello <%= name %>!');

// Reuse multiple times
compiled({ name: 'Alice' }).then(html => console.log(html));
compiled({ name: 'Bob' }).then(html => console.log(html));
```

**With Caching:**
```javascript
const compiled = ejs.compile(templateString, { cache: true });

// Subsequent calls use cached version
compiled(data1).then(html => console.log(html));
compiled(data2).then(html => console.log(html));
```

---

### `ejs.__express(filename, data, callback)`

Express.js compatibility method for rendering templates.

**Parameters:**
- `filename` (String): Path to the template file
- `data` (Object): Template data including Express settings
- `callback` (Function): Callback function `(err, html) => {}`

**Example:**
```javascript
const express = require('express');
const ejs = require('ejs-next');

const app = express();

app.engine('ejs', ejs.__express);
app.set('view engine', 'ejs');
app.set('views', './views');

app.get('/', (req, res) => {
  res.render('index', { title: 'Home' });
});
```

---

### `ejs.registerFunction(name, callback)`

Registers a global helper function accessible in all templates.

**Parameters:**
- `name` (String): Name of the function
- `callback` (Function): Function to register. Receives `(context, ...args)`

**Returns:** `undefined`

**Example:**
```javascript
const ejs = require('ejs-next');

// Register a helper function
ejs.registerFunction('uppercase', function(ctx, str) {
  return String(str).toUpperCase();
});

// Use in template
ejs.render('<%= uppercase(name) %>', { name: 'hello' })
  .then(html => console.log(html));
// Output: HELLO
```

**Multiple Helper Functions:**
```javascript
// Date formatter
ejs.registerFunction('formatDate', function(ctx, date) {
  return new Date(date).toLocaleDateString();
});

// Number formatter
ejs.registerFunction('formatNumber', function(ctx, num) {
  return Number(num).toLocaleString();
});

// Array joiner with custom separator
ejs.registerFunction('join', function(ctx, arr, sep = ', ') {
  return arr.join(sep);
});
```

---

### `ejs.resolveInclude(filename, from, isDir, folders)`

Resolves the path to an included template file.

**Parameters:**
- `filename` (String): The filename to resolve
- `from` (String): The current file path
- `isDir` (Boolean): Whether `from` is a directory
- `folders` (Array): Array of root folders to search

**Returns:** `String` - Resolved file path

**Example:**
```javascript
const path = ejs.resolveInclude('header.ejs', '/views/pages', true);
console.log(path); // /views/pages/header.ejs
```

---

### `ejs.selectFirstPathMatch(filename, folders)`

Selects the first existing path from multiple root directories.

**Parameters:**
- `filename` (String): The filename to locate
- `folders` (Array): Array of root directories to search

**Returns:** `String` - First matching file path

**Example:**
```javascript
const found = ejs.selectFirstPathMatch('shared/header.ejs', [
  '/app/views',
  '/app/shared-views',
  '/app/fallback-views'
]);
// Returns first path where the file exists
```

---

## Instance Methods

### Constructor: `new ejs(options)`

Creates a new EJS instance with specific configuration.

**Parameters:**
- `options` (Object): Configuration options

**Example:**
```javascript
const ejs = require('ejs-next');

const renderer = new ejs({
  cache: true,
  strict: false,
  root: './views',
  delimiter: '%'
});

renderer.renderFile('template.ejs', data)
  .then(html => console.log(html));
```

---

### `instance.compile(buffer, filename)`

Compiles a template buffer for the instance.

**Parameters:**
- `buffer` (String): Template content
- `filename` (String, optional): Filename for error reporting

**Returns:** `Function` - Compiled render function

---

### `instance.render(template, data)`

Renders a template string using the instance configuration.

**Parameters:**
- `template` (String): Template string
- `data` (Object): Template data

**Returns:** `Promise<String>` - Rendered HTML

---

### `instance.renderFile(filename, data)`

Renders a template file using the instance configuration.

**Parameters:**
- `filename` (String): Path to template file
- `data` (Object): Template data

**Returns:** `Promise<String>` - Rendered HTML

---

### `instance.include(ctx, from, filename, args)`

Includes another template file.

**Parameters:**
- `ctx` (Object): Current template context
- `from` (String): Current file path
- `filename` (String): File to include
- `args` (Object|Function|String): Arguments to pass

**Returns:** `Promise<String>` - Rendered include content

**Example in Template:**
```ejs
<%- include('header.ejs', { title: 'My Page' }) %>
```

---

### `instance.layout(ctx, from, output, filename, args)`

Sets a layout template to wrap the current output.

**Parameters:**
- `ctx` (Object): Current template context
- `from` (String): Current file path
- `output` (Object): Output buffer
- `filename` (String): Layout template filename
- `args` (Object): Arguments to pass to layout

**Returns:** `null`

**Example in Template:**
```ejs
<%_ layout('main.ejs') _%>
Page content here
```

---

### `instance.block(ctx, name, value)`

Registers or retrieves a named content block.

**Parameters:**
- `ctx` (Object): Current template context
- `name` (String): Block name
- `value` (String|Function, optional): Content to add to the block

**Returns:** `String|Object` - Block content (when retrieving) or block object (when setting)

**Example in Template:**
```ejs
<% block('scripts', '<script src="app.js"></script>') %>
<!-- Later in layout -->
<%- block('scripts') %>
```

---

## Configuration Options

### Global Options

Set default options for all EJS operations:

```javascript
const ejs = require('ejs-next');

ejs.cache = true;           // Enable template caching
ejs.strict = false;         // Disable strict error handling
ejs.profile = false;        // Disable performance profiling
ejs.delimiter = '%';        // Set tag delimiter
ejs.root = '/';            // Set default root directory
ejs.dirname = 'views';     // Set default directory name
```

### Instance Options

Configure individual EJS instances:

```javascript
const options = {
  // Caching
  cache: false,              // Cache compiled templates (default: false)
  
  // Error Handling
  strict: false,             // Throw errors instead of rendering comments (default: false)
  
  // Performance
  profile: false,            // Log rendering performance (default: false)
  
  // Paths
  root: './views',          // Root directory or array of directories
  
  // Syntax
  delimiter: '%',           // Tag delimiter character (default: '%')
  localsName: 'locals'     // Name of the locals object (default: 'locals')
};
```

### Option Details

#### `cache` (Boolean)
- **Default:** `false`
- **Description:** When `true`, compiled templates are cached for reuse
- **Use Case:** Enable in production for better performance

```javascript
// Development
ejs.renderFile('template.ejs', data, { cache: false });

// Production
ejs.renderFile('template.ejs', data, { cache: true });
```

#### `strict` (Boolean)
- **Default:** `false`
- **Description:** Controls error handling behavior
- **When `false`:** Errors render as HTML comments
- **When `true`:** Errors throw exceptions

```javascript
// Lenient (shows errors in output)
ejs.renderFile('template.ejs', data, { strict: false });

// Strict (throws errors)
ejs.renderFile('template.ejs', data, { strict: true })
  .catch(err => console.error(err));
```

#### `profile` (Boolean)
- **Default:** `false`
- **Description:** Enables performance profiling and logging
- **Output:** Logs render time and output size

```javascript
ejs.renderFile('template.ejs', data, { profile: true });
// Console output: Rendering 2kB in 15ms for /views/template.ejs
```

#### `root` (String|Array)
- **Default:** `'/'`
- **Description:** Root directory or array of directories for template resolution
- **Use Case:** Multiple template locations with fallback

```javascript
// Single root
ejs.renderFile('template.ejs', data, { root: './views' });

// Multiple roots (searched in order)
ejs.renderFile('template.ejs', data, {
  root: [
    './app/views',
    './shared/views',
    './fallback/views'
  ]
});
```

#### `delimiter` (String)
- **Default:** `'%'`
- **Description:** Character used in template tags
- **Use Case:** Avoid conflicts with other template systems

```javascript
// Default delimiter
ejs.render('<%= value %>', data);

// Custom delimiter
ejs.render('<? value ?>', data, { delimiter: '?' });
```

## Cache Management

### `ejs.__cache`

Access the internal template cache:

```javascript
// View cached templates
console.log(Object.keys(ejs.__cache));

// Clear cache
ejs.__cache = {};

// Remove specific cached template
delete ejs.__cache['/path/to/template.ejs'];
```

### `ejs.__fn`

Access registered helper functions:

```javascript
// View all registered functions
console.log(Object.keys(ejs.__fn));

// Access a specific function
const helper = ejs.__fn['myHelper'];
```

## Error Handling

### Compilation Errors

```javascript
const ejs = require('ejs-next');

try {
  const compiled = ejs.compile('<% if (missing { %>');
} catch (err) {
  console.error('Syntax Error:', err.message);
  console.error('Line:', err.lineNumber);
}
```

### Runtime Errors

```javascript
ejs.renderFile('template.ejs', data, { strict: true })
  .then(html => {
    console.log('Success:', html);
  })
  .catch(err => {
    console.error('Runtime Error:', err.message);
    console.error('Stack:', err.stack);
  });
```

### Non-strict Mode

```javascript
// Errors rendered as HTML comments
ejs.renderFile('template.ejs', data, { strict: false })
  .then(html => {
    // html may contain: <!-- Error message here -->
    console.log(html);
  });
```

## Next Steps

- Learn about [Layouts](./features/layouts.md) for template inheritance
- Explore [Blocks](./features/blocks.md) for content sections
- Check [Methods](./features/methods.md) for built-in template functions
- Review [Syntax](./syntax.md) for template syntax details
