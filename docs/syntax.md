# EJS-Next Syntax Guide

EJS-Next supports all standard EJS syntax with additional enhancements for improved functionality.

## Standard EJS Tags

### Output Tags

#### `<%= value %>` - Escaped Output
Outputs the value with HTML escaping (safe for user content):

```ejs
<p>Hello, <%= userName %>!</p>
<!-- If userName = "<script>alert('xss')</script>" -->
<!-- Output: <p>Hello, &lt;script&gt;alert('xss')&lt;/script&gt;!</p> -->
```

#### `<%- value %>` - Unescaped Output
Outputs raw HTML without escaping (use with caution):

```ejs
<div><%- htmlContent %></div>
<!-- If htmlContent = "<strong>Bold</strong>" -->
<!-- Output: <div><strong>Bold</strong></div> -->
```

### Control Flow Tags

#### `<% code %>` - Scriptlet
Execute JavaScript code without output:

```ejs
<% const title = 'My Page'; %>
<% const items = [1, 2, 3]; %>
<h1><%= title %></h1>
```

#### `<%# comment %>` - Comment
Add comments that won't appear in the output:

```ejs
<%# This is a comment and won't be rendered %>
<p>This will be rendered</p>
```

### Whitespace Control

#### `<%_ code %>` - Strip Leading Whitespace
Remove whitespace before the tag:

```ejs
    <%_ if (true) { _%>
Content
    <%_ } _%>
<!-- Output without leading spaces -->
```

#### `<% code _%>` - Strip Trailing Whitespace
Remove whitespace after the tag:

```ejs
<% if (true) { _%>
    Content here
<% } _%>
```

#### `<% code -%>` - Strip Newline After Tag
Remove newline character after the tag:

```ejs
<p><% for (let i = 0; i < 3; i++) { -%>
    <%= i %>
<% } -%></p>
```

## Enhanced Features

### Output Capture Syntax: `{@ ... @}`

EJS-Next introduces a powerful output capture mechanism using `{@` and `@}` delimiters. This allows you to capture template output within JavaScript functions.

#### Basic Syntax

```ejs
<% 
const inner = function() {@ 
  %>
  <strong>Captured content</strong>
  <%
@}
%>
<div><%- inner() %></div>
```

#### Practical Example with Include

```ejs
<%- include('wrapper.ejs', {
  content: function() {@ %>
    <h1>Dynamic Content</h1>
    <p>This content is captured and passed as a function.</p>
  <% @}
}) %>
```

**wrapper.ejs:**
```ejs
<div class="wrapper">
  <%- content() %>
</div>
```

#### Use Cases

**1. Creating Reusable Components:**

```ejs
<% 
const card = function(title) {@ %>
  <div class="card">
    <h2><%= title %></h2>
    <div class="card-body">
      Content goes here
    </div>
  </div>
<% @}
%>

<%- card('First Card') %>
<%- card('Second Card') %>
```

**2. Passing Complex Content:**

```ejs
<%- include('modal.ejs', {
  title: 'Confirmation',
  body: function() {@ %>
    <p>Are you sure you want to proceed?</p>
    <ul>
      <% items.forEach(item => { %>
        <li><%= item %></li>
      <% }); %>
    </ul>
  <% @},
  footer: function() {@ %>
    <button>Cancel</button>
    <button>Confirm</button>
  <% @}
}) %>
```

## Common Patterns

### Conditional Rendering

```ejs
<% if (user.isLoggedIn) { %>
  <p>Welcome back, <%= user.name %>!</p>
<% } else { %>
  <p>Please log in.</p>
<% } %>
```

### Loops and Iteration

```ejs
<ul>
  <% items.forEach(function(item, index) { %>
    <li data-index="<%= index %>">
      <%= item.name %>
    </li>
  <% }); %>
</ul>
```

### For Loops

```ejs
<% for (let i = 0; i < items.length; i++) { %>
  <div class="item-<%= i %>">
    <%= items[i] %>
  </div>
<% } %>
```

### Ternary Operators

```ejs
<p class="<%= isActive ? 'active' : 'inactive' %>">
  Status: <%= isActive ? 'Active' : 'Inactive' %>
</p>
```

### Object Property Access

```ejs
<div class="user-card">
  <h3><%= user.name %></h3>
  <p><%= user.email %></p>
  <% if (user.address) { %>
    <address>
      <%= user.address.street %><br>
      <%= user.address.city %>, <%= user.address.state %>
    </address>
  <% } %>
</div>
```

### Array Methods

```ejs
<% 
const activeUsers = users.filter(u => u.active);
const userNames = users.map(u => u.name);
%>

<p>Active users: <%= activeUsers.length %></p>
<p>Names: <%= userNames.join(', ') %></p>
```

## Special Variables

### `locals`
Access all variables passed to the template:

```ejs
<% if (typeof locals.optionalVar !== 'undefined') { %>
  <%= optionalVar %>
<% } %>
```

### `_includes`
Track the include stack (automatically managed):

```ejs
<% if (typeof _includes !== 'undefined') { %>
  <%# Current include depth: <%= _includes.length %> %>
<% } %>
```

## Best Practices

1. **Use Escaped Output by Default**: Always use `<%= %>` unless you specifically need raw HTML
2. **Validate User Input**: Never output user-provided content with `<%- %>` without sanitization
3. **Keep Logic Minimal**: Move complex logic to your application code, not templates
4. **Use Whitespace Control**: Use `<%_` and `_%>` to maintain clean output HTML
5. **Comment Complex Sections**: Use `<%# %>` to document complex template logic
6. **Leverage Output Capture**: Use `{@ @}` for advanced component patterns

## Delimiter Customization

You can customize the delimiter character (default is `%`):

```javascript
const ejs = require('ejs-next');

ejs.render('<? code ?>', data, {
  delimiter: '?'
});
```

With custom delimiter:
```ejs
<? if (condition) { ?>
  Content
<? } ?>
```

## Next Steps

- Learn about [Layouts](./features/layouts.md) for template inheritance
- Explore [Blocks](./features/blocks.md) for content sections
- Check [Methods](./features/methods.md) for built-in functions
- Review [API Reference](./api-reference.md) for complete documentation
