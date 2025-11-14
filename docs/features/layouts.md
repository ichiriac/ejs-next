# Layouts

Layouts provide a powerful way to create template inheritance in EJS-Next. A layout wraps your page content with a common structure, reducing duplication and improving maintainability.

## How Layouts Work

When you call `layout()` in a template, EJS-Next:
1. Captures all output from the current template
2. Passes it to the layout template as a `contents` variable
3. Renders the layout template with the captured content

This allows you to define a common page structure once and reuse it across multiple pages.

## Basic Usage

### Page Template

**views/page.ejs:**
```ejs
<%_ layout('main.ejs') _%>
<h1>Welcome to My Page</h1>
<p>This is the page content.</p>
```

### Layout Template

**views/main.ejs:**
```ejs
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <header>
    <nav><!-- Navigation --></nav>
  </header>
  
  <main>
    <%- contents %>
  </main>
  
  <footer>
    <p>&copy; 2025 My Website</p>
  </footer>
</body>
</html>
```

### Output

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <header>
    <nav><!-- Navigation --></nav>
  </header>
  
  <main>
    <h1>Welcome to My Page</h1>
    <p>This is the page content.</p>
  </main>
  
  <footer>
    <p>&copy; 2025 My Website</p>
  </footer>
</body>
</html>
```

## Passing Data to Layouts

You can pass additional data to your layout template:

### Page Template with Data

**views/about.ejs:**
```ejs
<%_ layout('main.ejs', { pageTitle: 'About Us', bodyClass: 'about-page' }) _%>
<h1>About Our Company</h1>
<p>We are a team of passionate developers.</p>
```

### Layout Using Data

**views/main.ejs:**
```ejs
<!DOCTYPE html>
<html>
<head>
  <title><%= pageTitle || 'Default Title' %></title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body class="<%= bodyClass || '' %>">
  <main>
    <%- contents %>
  </main>
</body>
</html>
```

## Advanced Patterns

### Dynamic Layout Selection

Choose different layouts based on conditions:

**views/page.ejs:**
```ejs
<% 
const layoutFile = user.isAdmin ? 'admin-layout.ejs' : 'user-layout.ejs';
layout(layoutFile, { user: user });
_%>
<h1>Dashboard</h1>
<p>Welcome, <%= user.name %>!</p>
```

### Nested Layouts

Create layout hierarchies by having layouts use other layouts:

**views/blog-post.ejs:**
```ejs
<%_ layout('blog-layout.ejs') _%>
<article>
  <h2><%= post.title %></h2>
  <p><%= post.content %></p>
</article>
```

**views/blog-layout.ejs:**
```ejs
<%_ layout('main.ejs', { section: 'blog' }) _%>
<div class="blog-container">
  <aside>
    <h3>Recent Posts</h3>
    <!-- Sidebar content -->
  </aside>
  <div class="blog-content">
    <%- contents %>
  </div>
</div>
```

**views/main.ejs:**
```ejs
<!DOCTYPE html>
<html>
<head>
  <title>My Blog</title>
</head>
<body>
  <header><!-- Header --></header>
  <main class="<%= section || '' %>">
    <%- contents %>
  </main>
  <footer><!-- Footer --></footer>
</body>
</html>
```

### Conditional Layout Usage

Apply layouts only when needed:

```ejs
<% if (!isPartialRender) { %>
  <%_ layout('main.ejs') _%>
<% } %>

<div class="content">
  <!-- Content that can be rendered standalone or within a layout -->
</div>
```

## Combining Layouts with Blocks

Layouts work seamlessly with blocks for maximum flexibility:

**views/page.ejs:**
```ejs
<%_ layout('main.ejs') _%>

<% block('title', 'About Us') %>
<% block('meta', '<meta name="description" content="About our company">') %>

<% block('scripts', function() {@ %>
  <script src="/js/page-specific.js"></script>
<% @}) %>

<h1>Page Content</h1>
<p>Main content goes here.</p>
```

**views/main.ejs:**
```ejs
<!DOCTYPE html>
<html>
<head>
  <title><%= block('title') || 'Default Title' %></title>
  <%- block('meta') %>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <main>
    <%- contents %>
  </main>
  
  <script src="/js/common.js"></script>
  <%- block('scripts') %>
</body>
</html>
```

## Express.js Integration

Using layouts with Express:

**app.js:**
```javascript
const express = require('express');
const ejs = require('ejs-next');
const path = require('path');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', ejs.__express);
app.set('view engine', 'ejs');

app.get('/about', (req, res) => {
  res.render('about', {
    pageTitle: 'About Us',
    description: 'Learn more about our company'
  });
});
```

**views/about.ejs:**
```ejs
<%_ layout('layouts/main') _%>
<h1>About Us</h1>
<p><%= description %></p>
```

## Complete Example

### Directory Structure
```
views/
├── layouts/
│   ├── main.ejs
│   └── minimal.ejs
├── partials/
│   ├── header.ejs
│   └── footer.ejs
├── home.ejs
└── about.ejs
```

### Main Layout

**views/layouts/main.ejs:**
```ejs
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= title || 'My Website' %></title>
  <%- block('styles') %>
  <link rel="stylesheet" href="/css/main.css">
</head>
<body>
  <%- include('../partials/header.ejs', { title: title }) %>
  
  <main class="container">
    <%- contents %>
  </main>
  
  <%- include('../partials/footer.ejs') %>
  
  <script src="/js/main.js"></script>
  <%- block('scripts') %>
</body>
</html>
```

### Home Page

**views/home.ejs:**
```ejs
<%_ layout('layouts/main.ejs', { title: 'Home Page' }) _%>

<% block('styles', '<link rel="stylesheet" href="/css/home.css">') %>

<div class="hero">
  <h1>Welcome to Our Website</h1>
  <p>Discover amazing content and features.</p>
</div>

<section class="features">
  <% ['Feature 1', 'Feature 2', 'Feature 3'].forEach(feature => { %>
    <div class="feature-card">
      <h3><%= feature %></h3>
      <p>Description of <%= feature.toLowerCase() %>.</p>
    </div>
  <% }); %>
</section>

<% block('scripts', function() {@ %>
  <script src="/js/home.js"></script>
  <script>
    console.log('Home page loaded');
  </script>
<% @}) %>
```

## Best Practices

### 1. Use Consistent Layout Names
Keep layout files in a dedicated directory:
```
views/
└── layouts/
    ├── main.ejs
    ├── admin.ejs
    └── minimal.ejs
```

### 2. Whitespace Control
Use `<%_` and `_%>` to prevent extra whitespace:
```ejs
<%_ layout('main.ejs') _%>
```

### 3. Default Values
Provide defaults in layouts for optional data:
```ejs
<title><%= title || 'Default Title' %></title>
<body class="<%= bodyClass || '' %>">
```

### 4. Organize Common Elements
Use includes for repeated elements within layouts:
```ejs
<%- include('partials/meta-tags.ejs') %>
<%- include('partials/header.ejs') %>
```

### 5. Document Layout Requirements
Add comments to clarify what data layouts expect:
```ejs
<%# 
  Layout: main.ejs
  Required: title (String)
  Optional: bodyClass (String), description (String)
%>
```

## Troubleshooting

### Layout Not Applied
Ensure the layout call is at the beginning of your template:
```ejs
<%_ layout('main.ejs') _%>
<!-- Rest of content -->
```

### Path Resolution Issues
Use relative paths from your views directory:
```ejs
<%_ layout('layouts/main.ejs') _%>
```

Or configure the root option:
```javascript
ejs.renderFile('page.ejs', data, {
  root: path.join(__dirname, 'views')
});
```

### Contents Not Rendering
Make sure your layout includes the `contents` variable:
```ejs
<main>
  <%- contents %>
</main>
```

## Next Steps

- Learn about [Blocks](./blocks.md) for section-based content organization
- Explore [Methods](./methods.md) for other template functions
- Check [Syntax](../syntax.md) for template syntax details
- Review [API Reference](../api-reference.md) for configuration options
