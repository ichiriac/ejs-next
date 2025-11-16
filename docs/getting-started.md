# Getting Started with EJS-Next

EJS-Next is a next-generation templating engine for Node.js that builds upon the classic EJS syntax with enhanced features and improved performance.

## Installation

Install ejs-next using npm:

```bash
npm install ejs-next
```

## Basic Usage

### Simple Template Rendering

```javascript
const ejs = require('ejs-next');

// Render a simple template
ejs.render('Hello <%= name %>!', { name: 'World' })
  .then(html => console.log(html));
// Output: Hello World!
```

### Rendering from Files

```javascript
const ejs = require('ejs-next');

// Render from a file
ejs.renderFile('./views/page.ejs', { 
  name: 'John',
  items: ['Apple', 'Banana', 'Orange']
}, {
  root: './views',
  cache: false
})
.then(html => console.log(html))
.catch(err => console.error(err));
```

## ExpressJS Integration

EJS-Next provides seamless integration with Express.js through the `__express` method.

### Basic Setup

```javascript
const express = require('express');
const ejs = require('ejs-next');
const path = require('path');

const app = express();

// Configure EJS-Next as the view engine
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', ejs.__express);
app.set('view engine', 'ejs');

// Define routes
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Home Page',
    user: { name: 'John Doe' }
  });
});

app.get('/about', (req, res) => {
  res.render('about', {
    title: 'About Us',
    team: ['Alice', 'Bob', 'Charlie']
  });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

### Express Configuration Options

```javascript
const app = express();

// Enable view caching for production
if (app.get('env') === 'production') {
  app.enable('view cache');
}

app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', ejs.__express);
app.set('view engine', 'ejs');
```

### Creating Your First Template

Create a file `views/index.ejs`:

```ejs
<!DOCTYPE html>
<html>
<head>
  <title><%= title %></title>
</head>
<body>
  <h1>Welcome, <%= user.name %>!</h1>
  <p>This is your first EJS-Next template.</p>
</body>
</html>
```

### Complete Express Example

```javascript
const express = require('express');
const ejs = require('ejs-next');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', ejs.__express);
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => {
  res.render('index', {
    title: 'EJS-Next Demo',
    message: 'Hello from EJS-Next!'
  });
});

app.get('/users/:id', (req, res) => {
  const userId = req.params.id;
  res.render('user-profile', {
    title: 'User Profile',
    userId: userId,
    user: {
      id: userId,
      name: 'John Smith',
      email: 'john@example.com'
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
```

## Configuration Options

When rendering templates, you can pass configuration options:

```javascript
const options = {
  cache: true,        // Enable template caching
  strict: false,      // Strict error handling
  profile: false,     // Enable performance profiling
  root: './views',    // Root directory or array of directories
  delimiter: '%'      // Delimiter for tags (default: %)
};

ejs.renderFile('template.ejs', data, options)
  .then(html => console.log(html));
```

## Next Steps

- Learn about [EJS Syntax](./syntax.md) to understand all template features
- Explore [Layouts](./features/layouts.md) for template composition
- Discover [Blocks](./features/blocks.md) for modular content sections
- Review the [API Reference](./api-reference.md) for detailed method documentation
