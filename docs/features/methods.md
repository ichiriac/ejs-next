# Methods

EJS-Next provides several built-in methods that can be used within templates to enhance functionality and enable template composition.

## Built-in Template Methods

### `include(filename, data)`

Includes and renders another template file, optionally passing data to it.

**Syntax:**
```ejs
<%- include('path/to/template.ejs', { key: 'value' }) %>
```

**Parameters:**
- `filename` (String): Path to the template file (relative to current file or root)
- `data` (Object, optional): Data to pass to the included template

**Returns:** Rendered HTML string

**Example:**

**views/page.ejs:**
```ejs
<!DOCTYPE html>
<html>
<head>
  <title>My Page</title>
</head>
<body>
  <%- include('partials/header.ejs', { title: 'Welcome' }) %>
  
  <main>
    <h1>Page Content</h1>
  </main>
  
  <%- include('partials/footer.ejs') %>
</body>
</html>
```

**views/partials/header.ejs:**
```ejs
<header>
  <nav>
    <h1><%= title %></h1>
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/about">About</a></li>
    </ul>
  </nav>
</header>
```

**views/partials/footer.ejs:**
```ejs
<footer>
  <p>&copy; 2025 My Website. All rights reserved.</p>
</footer>
```

---

### `layout(filename, data)`

Wraps the current template's output with a layout template.

**Syntax:**
```ejs
<%_ layout('path/to/layout.ejs', { key: 'value' }) _%>
```

**Parameters:**
- `filename` (String): Path to the layout template
- `data` (Object, optional): Additional data to pass to the layout

**Returns:** `null` (output is handled via hook)

**Example:**

**views/page.ejs:**
```ejs
<%_ layout('layouts/main.ejs', { 
  pageTitle: 'About Us',
  bodyClass: 'about-page'
}) _%>

<h1>About Our Company</h1>
<p>We are a team of passionate developers.</p>
```

**views/layouts/main.ejs:**
```ejs
<!DOCTYPE html>
<html>
<head>
  <title><%= pageTitle || 'Default Title' %></title>
</head>
<body class="<%= bodyClass || '' %>">
  <main>
    <%- contents %>
  </main>
</body>
</html>
```

---

### `block(name, value)`

Registers or retrieves a named content block.

**Syntax:**
```ejs
<!-- Set a block -->
<% block('blockName', 'content') %>

<!-- Get a block -->
<%- block('blockName') %>
```

**Parameters:**
- `name` (String): Name of the block
- `value` (String|Function, optional): Content to add to the block

**Returns:**
- When setting: Block object
- When getting: Block content as string

**Example:**

**views/page.ejs:**
```ejs
<%_ layout('main.ejs') _%>

<% block('title', 'My Page Title') %>
<% block('scripts', '<script src="/js/page.js"></script>') %>

<h1>Page Content</h1>
```

**views/main.ejs:**
```ejs
<!DOCTYPE html>
<html>
<head>
  <title><%= block('title') || 'Default' %></title>
</head>
<body>
  <%- contents %>
  <%- block('scripts') %>
</body>
</html>
```

---

## Advanced Include Patterns

### Passing Functions as Data

You can pass functions to includes for dynamic content:

```ejs
<%- include('card.ejs', {
  title: 'My Card',
  renderBody: function() {@ %>
    <p>This is dynamic content!</p>
    <ul>
      <% items.forEach(item => { %>
        <li><%= item %></li>
      <% }); %>
    </ul>
  <% @}
}) %>
```

**card.ejs:**
```ejs
<div class="card">
  <h3><%= title %></h3>
  <div class="card-body">
    <%- renderBody() %>
  </div>
</div>
```

### Passing String Content

Pass simple string content directly:

```ejs
<%- include('wrapper.ejs', 'Simple text content') %>
```

Or as the `contents` property:

```ejs
<%- include('wrapper.ejs', { contents: 'Text content' }) %>
```

**wrapper.ejs:**
```ejs
<div class="wrapper">
  <%- contents %>
</div>
```

### Nested Includes

Includes can include other templates:

**views/page.ejs:**
```ejs
<%- include('sections/hero.ejs') %>
<%- include('sections/features.ejs') %>
<%- include('sections/testimonials.ejs') %>
```

**views/sections/hero.ejs:**
```ejs
<section class="hero">
  <%- include('../components/heading.ejs', { 
    text: 'Welcome',
    level: 1 
  }) %>
</section>
```

### Conditional Includes

Include templates based on conditions:

```ejs
<% if (user.isLoggedIn) { %>
  <%- include('partials/user-menu.ejs', { user: user }) %>
<% } else { %>
  <%- include('partials/login-button.ejs') %>
<% } %>
```

### Loop with Includes

Use includes within loops for repeated content:

```ejs
<div class="product-grid">
  <% products.forEach(product => { %>
    <%- include('components/product-card.ejs', { product: product }) %>
  <% }); %>
</div>
```

---

## Custom Registered Functions

Use `ejs.registerFunction()` to create global helper functions available in all templates.

### Registering Functions

**app.js:**
```javascript
const ejs = require('ejs-next');

// Register helper functions
ejs.registerFunction('uppercase', function(ctx, str) {
  return String(str).toUpperCase();
});

ejs.registerFunction('formatDate', function(ctx, date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

ejs.registerFunction('truncate', function(ctx, str, length = 100) {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
});
```

### Using Custom Functions in Templates

```ejs
<h1><%= uppercase(title) %></h1>

<p class="date">Posted on <%= formatDate(post.createdAt) %></p>

<p class="excerpt">
  <%= truncate(post.content, 150) %>
</p>
```

### Common Helper Functions

#### String Manipulation

```javascript
ejs.registerFunction('slugify', function(ctx, str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
});

ejs.registerFunction('capitalize', function(ctx, str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
});
```

**Usage:**
```ejs
<a href="/posts/<%= slugify(post.title) %>">
  <%= capitalize(post.title) %>
</a>
```

#### Number Formatting

```javascript
ejs.registerFunction('formatCurrency', function(ctx, amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
});

ejs.registerFunction('formatNumber', function(ctx, num) {
  return Number(num).toLocaleString();
});
```

**Usage:**
```ejs
<p class="price"><%= formatCurrency(product.price) %></p>
<p class="views"><%= formatNumber(post.views) %> views</p>
```

#### Date/Time Helpers

```javascript
ejs.registerFunction('timeAgo', function(ctx, date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
    }
  }
  
  return 'just now';
});
```

**Usage:**
```ejs
<time><%= timeAgo(comment.createdAt) %></time>
```

#### Array Helpers

```javascript
ejs.registerFunction('join', function(ctx, arr, separator = ', ', property = null) {
  if (property) {
    return arr.map(item => item[property]).join(separator);
  }
  return arr.join(separator);
});

ejs.registerFunction('first', function(ctx, arr, n = 1) {
  return n === 1 ? arr[0] : arr.slice(0, n);
});

ejs.registerFunction('last', function(ctx, arr, n = 1) {
  return n === 1 ? arr[arr.length - 1] : arr.slice(-n);
});
```

**Usage:**
```ejs
<p>Tags: <%= join(post.tags, ', ') %></p>
<p>Authors: <%= join(post.authors, ', ', 'name') %></p>
```

#### Conditional Helpers

```javascript
ejs.registerFunction('ifEqual', function(ctx, a, b, truthyResult, falsyResult = '') {
  return a === b ? truthyResult : falsyResult;
});

ejs.registerFunction('ifIn', function(ctx, needle, haystack, truthyResult, falsyResult = '') {
  return haystack.includes(needle) ? truthyResult : falsyResult;
});
```

**Usage:**
```ejs
<li class="<%= ifEqual(page, 'home', 'active') %>">Home</li>
<li class="<%= ifIn('admin', user.roles, 'show', 'hide') %>">Admin</li>
```

---

## Complete Example: Component System

### Register Helper Functions

**app.js:**
```javascript
const ejs = require('ejs-next');

// Icon helper
ejs.registerFunction('icon', function(ctx, name, size = 24) {
  return `<svg class="icon icon-${name}" width="${size}" height="${size}">
    <use xlink:href="/icons.svg#${name}"></use>
  </svg>`;
});

// Button helper
ejs.registerFunction('button', function(ctx, text, type = 'primary', href = null) {
  const tag = href ? 'a' : 'button';
  const hrefAttr = href ? ` href="${href}"` : '';
  return `<${tag} class="btn btn-${type}"${hrefAttr}>${text}</${tag}>`;
});
```

### Use in Templates

**views/page.ejs:**
```ejs
<%_ layout('main.ejs') _%>

<div class="actions">
  <%- button('Save', 'primary') %>
  <%- button('Cancel', 'secondary', '/cancel') %>
</div>

<ul class="menu">
  <li>
    <%- icon('home', 20) %> Home
  </li>
  <li>
    <%- icon('user', 20) %> Profile
  </li>
</ul>
```

---

## Best Practices

### 1. Context Parameter
Always accept context as the first parameter in custom functions:
```javascript
ejs.registerFunction('myHelper', function(ctx, arg1, arg2) {
  // ctx contains the template context
  // Access template variables if needed
});
```

### 2. Error Handling
Add error handling to custom functions:
```javascript
ejs.registerFunction('safeFormat', function(ctx, value) {
  try {
    return someComplexFormatting(value);
  } catch (err) {
    console.error('Formatting error:', err);
    return value; // Return original value on error
  }
});
```

### 3. Pure Functions
Keep helper functions pure (no side effects):
```javascript
// Good
ejs.registerFunction('format', function(ctx, str) {
  return str.trim().toLowerCase();
});

// Avoid
ejs.registerFunction('logAndFormat', function(ctx, str) {
  console.log(str); // Side effect
  return str.toLowerCase();
});
```

### 4. Reusable Includes
Create a library of reusable components:
```
views/
└── components/
    ├── button.ejs
    ├── card.ejs
    ├── modal.ejs
    └── form-field.ejs
```

### 5. Document Helper Functions
Add JSDoc comments to helper functions:
```javascript
/**
 * Formats a date string in a human-readable format
 * @param {Object} ctx - Template context
 * @param {String|Date} date - Date to format
 * @param {String} locale - Locale code (default: 'en-US')
 * @returns {String} Formatted date string
 */
ejs.registerFunction('formatDate', function(ctx, date, locale = 'en-US') {
  return new Date(date).toLocaleDateString(locale);
});
```

---

## Method Chaining and Composition

### Composing Includes

```ejs
<%- include('layouts/card.ejs', {
  header: include('components/card-header.ejs', { title: 'My Card' }),
  body: include('components/card-body.ejs', { content: content }),
  footer: include('components/card-footer.ejs', { actions: actions })
}) %>
```

### Combining Methods

```ejs
<%_ layout('main.ejs', { title: block('pageTitle') || 'Default' }) _%>

<% block('pageTitle', 'Custom Page Title') %>

<%- include('hero.ejs', {
  title: block('heroTitle') || 'Welcome'
}) %>
```

---

## Next Steps

- Learn about [Layouts](./layouts.md) for template inheritance
- Explore [Blocks](./blocks.md) for content sections
- Check [Hooks](./hooks.md) for advanced output control
- Review [API Reference](../api-reference.md) for method details
- See [Syntax](../syntax.md) for output capture with `{@ @}`
