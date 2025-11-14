# Blocks

Blocks provide a mechanism to register and output named content sections across your templates. They allow child templates to inject content into specific areas of parent layouts, enabling flexible and modular template composition.

## What Are Blocks?

Blocks are named content containers that can be:
- Defined in any template (pages, partials, layouts)
- Accumulated from multiple locations
- Retrieved and rendered where needed

This is particularly useful for:
- Adding page-specific JavaScript files
- Injecting custom CSS
- Building modular content sections
- Creating dynamic sidebars or widget areas

## Basic Usage

### Setting Block Content

**views/page.ejs:**
```ejs
<%_ layout('main.ejs') _%>

<% block('scripts', '<script src="/js/page.js"></script>') %>

<h1>My Page</h1>
<p>Page content here.</p>
```

### Retrieving Block Content

**views/main.ejs:**
```ejs
<!DOCTYPE html>
<html>
<head>
  <title>My Site</title>
</head>
<body>
  <%- contents %>
  
  <!-- Render the scripts block -->
  <%- block('scripts') %>
</body>
</html>
```

### Output

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Site</title>
</head>
<body>
  <h1>My Page</h1>
  <p>Page content here.</p>
  
  <script src="/js/page.js"></script>
</body>
</html>
```

## Setting Blocks

### String Content

Direct string assignment:

```ejs
<% block('meta', '<meta name="description" content="Page description">') %>
```

### Multiple Assignments

Blocks accumulate content from multiple calls:

```ejs
<% block('scripts', '<script src="/js/jquery.js"></script>') %>
<% block('scripts', '<script src="/js/app.js"></script>') %>
<% block('scripts', '<script src="/js/page.js"></script>') %>

<!-- Later in layout -->
<%- block('scripts') %>
<!-- Outputs all three script tags -->
```

### Function Content with Output Capture

Use the `{@ @}` syntax for complex content:

```ejs
<% block('sidebar', function() {@ %>
  <aside class="sidebar">
    <h3>Quick Links</h3>
    <ul>
      <% links.forEach(link => { %>
        <li><a href="<%= link.url %>"><%= link.text %></a></li>
      <% }); %>
    </ul>
  </aside>
<% @}) %>
```

## Retrieving Blocks

### Basic Retrieval

```ejs
<%- block('blockName') %>
```

### With Default Content

Provide fallback content if block is empty:

```ejs
<%- block('sidebar') || '<aside>No sidebar content</aside>' %>
```

### Conditional Rendering

Only render if block has content:

```ejs
<% if (block('scripts')) { %>
  <div class="scripts-container">
    <%- block('scripts') %>
  </div>
<% } %>
```

## Common Use Cases

### 1. Page-Specific JavaScript

**views/products.ejs:**
```ejs
<%_ layout('main.ejs') _%>

<% block('scripts', function() {@ %>
  <script src="/js/products.js"></script>
  <script>
    initProductGallery();
  </script>
<% @}) %>

<div class="products">
  <% products.forEach(product => { %>
    <div class="product"><%= product.name %></div>
  <% }); %>
</div>
```

**views/main.ejs:**
```ejs
<!DOCTYPE html>
<html>
<body>
  <%- contents %>
  <script src="/js/common.js"></script>
  <%- block('scripts') %>
</body>
</html>
```

### 2. Page-Specific Styles

**views/about.ejs:**
```ejs
<%_ layout('main.ejs') _%>

<% block('styles', '<link rel="stylesheet" href="/css/about.css">') %>
<% block('styles', '<style>.hero { background: blue; }</style>') %>

<div class="hero">About Us</div>
```

**views/main.ejs:**
```ejs
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="/css/main.css">
  <%- block('styles') %>
</head>
<body>
  <%- contents %>
</body>
</html>
```

### 3. Meta Tags

**views/blog-post.ejs:**
```ejs
<%_ layout('main.ejs') _%>

<% block('meta', '<meta name="description" content="' + post.excerpt + '">') %>
<% block('meta', '<meta property="og:title" content="' + post.title + '">') %>
<% block('meta', '<meta property="og:image" content="' + post.image + '">') %>

<article>
  <h1><%= post.title %></h1>
  <p><%= post.content %></p>
</article>
```

### 4. Breadcrumbs

**views/products/detail.ejs:**
```ejs
<%_ layout('layouts/shop.ejs') _%>

<% block('breadcrumbs', function() {@ %>
  <nav class="breadcrumbs">
    <a href="/">Home</a> &gt;
    <a href="/products">Products</a> &gt;
    <span><%= product.name %></span>
  </nav>
<% @}) %>

<div class="product-detail">
  <h1><%= product.name %></h1>
</div>
```

### 5. Sidebar Content

**views/dashboard.ejs:**
```ejs
<%_ layout('main.ejs') _%>

<% block('sidebar', function() {@ %>
  <aside>
    <h3>Quick Stats</h3>
    <ul>
      <li>Users: <%= stats.users %></li>
      <li>Posts: <%= stats.posts %></li>
    </ul>
  </aside>
<% @}) %>

<main>
  <h1>Dashboard</h1>
</main>
```

**views/main.ejs:**
```ejs
<div class="layout">
  <% if (block('sidebar')) { %>
    <div class="sidebar">
      <%- block('sidebar') %>
    </div>
  <% } %>
  <div class="content">
    <%- contents %>
  </div>
</div>
```

## Advanced Patterns

### Multiple Blocks from Partials

Partials can contribute to blocks:

**views/page.ejs:**
```ejs
<%_ layout('main.ejs') _%>
<%- include('widgets/calendar.ejs') %>
<%- include('widgets/weather.ejs') %>
<h1>Dashboard</h1>
```

**views/widgets/calendar.ejs:**
```ejs
<% block('scripts', '<script src="/js/calendar.js"></script>') %>
<% block('styles', '<link rel="stylesheet" href="/css/calendar.css">') %>
<div class="calendar-widget">
  <!-- Calendar content -->
</div>
```

**views/widgets/weather.ejs:**
```ejs
<% block('scripts', '<script src="/js/weather.js"></script>') %>
<% block('styles', '<link rel="stylesheet" href="/css/weather.css">') %>
<div class="weather-widget">
  <!-- Weather content -->
</div>
```

### Conditional Block Content

Add content to blocks based on conditions:

```ejs
<% if (user.isAdmin) { %>
  <% block('scripts', '<script src="/js/admin-tools.js"></script>') %>
<% } %>

<% if (analytics.enabled) { %>
  <% block('scripts', function() {@ %>
    <script>
      analytics.track('<%= page.name %>');
    </script>
  <% @}) %>
<% } %>
```

### Organizing Scripts by Type

```ejs
<% block('vendor-scripts', '<script src="/js/jquery.js"></script>') %>
<% block('vendor-scripts', '<script src="/js/bootstrap.js"></script>') %>

<% block('app-scripts', '<script src="/js/app.js"></script>') %>
<% block('page-scripts', '<script src="/js/page.js"></script>') %>

<!-- In layout -->
<%- block('vendor-scripts') %>
<%- block('app-scripts') %>
<%- block('page-scripts') %>
```

### Block-Based Component System

**views/page.ejs:**
```ejs
<%_ layout('main.ejs') _%>

<%- include('components/hero.ejs', { 
  title: 'Welcome',
  subtitle: 'To our site'
}) %>

<%- include('components/feature-grid.ejs', {
  features: features
}) %>
```

**views/components/hero.ejs:**
```ejs
<% block('styles', '<link rel="stylesheet" href="/css/hero.css">') %>
<% block('scripts', '<script src="/js/hero-animations.js"></script>') %>

<section class="hero">
  <h1><%= title %></h1>
  <p><%= subtitle %></p>
</section>
```

## Blocks vs. Includes

### Use Blocks When:
- Content needs to be injected into specific parent template areas
- Multiple templates contribute to the same section
- Order of content assembly matters across template hierarchy

### Use Includes When:
- You need immediate, inline content insertion
- Content is self-contained and doesn't need to affect parent templates
- You're building reusable components

### Example Comparison

**With Includes (Immediate):**
```ejs
<header>
  <%- include('navigation.ejs') %>
</header>
```

**With Blocks (Deferred):**
```ejs
<!-- In page -->
<% block('nav-items', '<li><a href="/page">Page</a></li>') %>

<!-- In layout -->
<header>
  <nav>
    <ul>
      <%- block('nav-items') %>
    </ul>
  </nav>
</header>
```

## Complete Example

### Directory Structure
```
views/
├── layouts/
│   └── main.ejs
├── pages/
│   ├── home.ejs
│   └── contact.ejs
└── components/
    ├── hero.ejs
    └── form.ejs
```

### Layout with Block Areas

**views/layouts/main.ejs:**
```ejs
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= title || 'My Website' %></title>
  
  <!-- Base styles -->
  <link rel="stylesheet" href="/css/main.css">
  
  <!-- Page-specific styles block -->
  <%- block('styles') %>
  
  <!-- Meta tags block -->
  <%- block('meta') %>
</head>
<body class="<%= bodyClass || '' %>">
  <!-- Page content -->
  <main>
    <%- contents %>
  </main>
  
  <!-- Base scripts -->
  <script src="/js/main.js"></script>
  
  <!-- Page-specific scripts block -->
  <%- block('scripts') %>
  
  <!-- Analytics block -->
  <%- block('analytics') %>
</body>
</html>
```

### Page Using Multiple Blocks

**views/pages/contact.ejs:**
```ejs
<%_ layout('layouts/main.ejs', { 
  title: 'Contact Us',
  bodyClass: 'contact-page'
}) _%>

<% block('meta', '<meta name="description" content="Get in touch with us">') %>
<% block('styles', '<link rel="stylesheet" href="/css/forms.css">') %>

<%- include('../components/hero.ejs', { 
  title: 'Contact Us',
  subtitle: 'We\'d love to hear from you'
}) %>

<section class="contact-form">
  <%- include('../components/form.ejs', { 
    action: '/submit-contact',
    fields: contactFields
  }) %>
</section>

<% block('scripts', function() {@ %>
  <script src="/js/form-validation.js"></script>
  <script>
    initContactForm({
      endpoint: '/api/contact',
      recaptcha: true
    });
  </script>
<% @}) %>

<% block('analytics', function() {@ %>
  <script>
    trackPageView('contact', { source: '<%= source || "direct" %>' });
  </script>
<% @}) %>
```

## Best Practices

### 1. Use Descriptive Block Names
```ejs
<!-- Good -->
<% block('page-specific-scripts', '...') %>
<% block('meta-tags', '...') %>
<% block('sidebar-widgets', '...') %>

<!-- Avoid -->
<% block('stuff', '...') %>
<% block('js', '...') %>
```

### 2. Document Block Requirements
```ejs
<%# 
  Available blocks:
  - styles: Page-specific stylesheets
  - scripts: Page-specific JavaScript
  - meta: SEO and social meta tags
  - sidebar: Sidebar content (optional)
%>
```

### 3. Provide Defaults in Layouts
```ejs
<%- block('footer') || '<footer>Default footer</footer>' %>
```

### 4. Group Related Content
```ejs
<% block('head-scripts', '...') %>
<% block('body-scripts', '...') %>
<% block('footer-scripts', '...') %>
```

### 5. Keep Blocks Focused
Each block should have a single, clear purpose.

## Troubleshooting

### Block Not Rendering
Ensure you're calling `block()` with the same name:
```ejs
<!-- Setting -->
<% block('scripts', '...') %>

<!-- Getting (must match exactly) -->
<%- block('scripts') %>
```

### Content Order Issues
Blocks render in the order they're called. To ensure proper order:
```ejs
<% block('scripts', '<script src="/js/first.js"></script>') %>
<% block('scripts', '<script src="/js/second.js"></script>') %>
<!-- Renders in order: first.js, then second.js -->
```

### Blocks in Async Contexts
Note that with promises/async operations, call order may not be preserved. Structure your code to avoid race conditions.

## Next Steps

- Learn about [Layouts](./layouts.md) for template inheritance
- Explore [Methods](./methods.md) for other template functions
- Check [Syntax](../syntax.md) for output capture syntax `{@ @}`
- Review [API Reference](../api-reference.md) for block API details
