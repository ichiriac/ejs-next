# File Overwrite and Multiple Paths

EJS-Next supports sophisticated path resolution with multiple root directories, enabling template overriding and fallback mechanisms. This feature is particularly useful for theming, multi-tenant applications, and modular architectures.

## Multiple Root Directories

### Basic Concept

When multiple root directories are configured, EJS-Next searches for templates in order and uses the first match found. This allows you to:
- Override default templates with custom versions
- Implement theme systems
- Support multi-tenant customization
- Create plugin/module architectures

### Configuration

**Single Root (Standard):**
```javascript
const ejs = require('ejs-next');

ejs.renderFile('template.ejs', data, {
  root: './views'
});
```

**Multiple Roots (Search in Order):**
```javascript
ejs.renderFile('template.ejs', data, {
  root: [
    './custom-views',      // Checked first
    './theme-views',       // Checked second
    './default-views'      // Fallback
  ]
});
```

## How Path Resolution Works

### Resolution Algorithm

1. **Relative Path Resolution**: If the template path is relative, it's resolved relative to the current file
2. **Root Search**: The resolved path is searched in each root directory in order
3. **First Match**: The first existing file is used
4. **Extension Addition**: If no extension is provided, `.ejs` is automatically added

### Example Flow

**Configuration:**
```javascript
root: [
  '/app/custom',
  '/app/themes/dark',
  '/app/themes/default'
]
```

**Searching for:** `header.ejs`

**Search order:**
1. `/app/custom/header.ejs` ← **Found! Use this**
2. `/app/themes/dark/header.ejs` ← (not checked, first match already found)
3. `/app/themes/default/header.ejs` ← (not checked)

## Use Cases

### 1. Theme System

Create a flexible theming system:

**Directory Structure:**
```
views/
├── themes/
│   ├── dark/
│   │   ├── layout.ejs
│   │   └── header.ejs
│   └── light/
│       ├── layout.ejs
│       └── header.ejs
└── default/
    ├── layout.ejs
    ├── header.ejs
    └── footer.ejs
```

**Implementation:**
```javascript
const express = require('express');
const ejs = require('ejs-next');
const path = require('path');

const app = express();

// Middleware to set theme
app.use((req, res, next) => {
  const theme = req.query.theme || req.session?.theme || 'light';
  res.locals.theme = theme;
  next();
});

// Configure view engine with theme support
app.engine('ejs', (filePath, options, callback) => {
  const theme = options.theme || 'light';
  
  const roots = [
    path.join(__dirname, 'views', 'themes', theme),
    path.join(__dirname, 'views', 'default')
  ];
  
  ejs.renderFile(filePath, options, { root: roots })
    .then(html => callback(null, html))
    .catch(err => callback(err));
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  res.render('home', {
    title: 'Home Page',
    theme: res.locals.theme
  });
});
```

**Usage:**
- Visit `/?theme=dark` → Uses dark theme templates
- Visit `/?theme=light` → Uses light theme templates
- Missing templates fall back to default

### 2. Multi-Tenant Application

Different templates per tenant:

**Directory Structure:**
```
views/
├── tenants/
│   ├── acme-corp/
│   │   ├── dashboard.ejs
│   │   └── branding.ejs
│   ├── tech-startup/
│   │   ├── dashboard.ejs
│   │   └── branding.ejs
└── shared/
    ├── dashboard.ejs
    ├── layout.ejs
    └── common/
        └── footer.ejs
```

**Implementation:**
```javascript
const express = require('express');
const ejs = require('ejs-next');
const path = require('path');

const app = express();

// Tenant identification middleware
app.use((req, res, next) => {
  // Get tenant from subdomain, header, or database
  const tenant = req.subdomains[0] || 'default';
  res.locals.tenant = tenant;
  next();
});

// Custom render function with tenant support
app.use((req, res, next) => {
  res.renderTenant = function(view, locals = {}) {
    const tenant = res.locals.tenant;
    
    const roots = [
      path.join(__dirname, 'views', 'tenants', tenant),
      path.join(__dirname, 'views', 'shared')
    ];
    
    ejs.renderFile(view, { ...locals, tenant }, { root: roots })
      .then(html => res.send(html))
      .catch(err => next(err));
  };
  next();
});

app.get('/dashboard', (req, res) => {
  res.renderTenant('dashboard.ejs', {
    title: 'Dashboard',
    data: fetchDashboardData(res.locals.tenant)
  });
});

app.listen(3000);
```

### 3. Plugin System

Override core templates with plugin templates:

**Directory Structure:**
```
views/
├── plugins/
│   ├── analytics/
│   │   └── partials/
│   │       └── tracking.ejs
│   ├── chat/
│   │   └── partials/
│   │       └── widget.ejs
└── core/
    ├── layout.ejs
    └── partials/
        ├── tracking.ejs
        └── widget.ejs
```

**Implementation:**
```javascript
const path = require('path');
const ejs = require('ejs-next');

class PluginRenderer {
  constructor(enabledPlugins = []) {
    this.enabledPlugins = enabledPlugins;
  }
  
  getRoots() {
    const roots = [];
    
    // Add plugin directories in reverse order (last plugin wins)
    for (const plugin of this.enabledPlugins.reverse()) {
      roots.push(path.join(__dirname, 'views', 'plugins', plugin));
    }
    
    // Add core directory as fallback
    roots.push(path.join(__dirname, 'views', 'core'));
    
    return roots;
  }
  
  render(template, data) {
    return ejs.renderFile(template, data, {
      root: this.getRoots(),
      cache: true
    });
  }
}

// Usage
const renderer = new PluginRenderer(['analytics', 'chat']);

app.get('/', (req, res) => {
  renderer.render('layout.ejs', { title: 'Home' })
    .then(html => res.send(html));
});
```

### 4. Development Override System

Override production templates during development:

**Directory Structure:**
```
views/
├── dev-overrides/    # Development customizations
│   └── dashboard.ejs
├── staging/          # Staging-specific templates
│   └── dashboard.ejs
└── production/       # Production templates
    ├── dashboard.ejs
    └── layout.ejs
```

**Implementation:**
```javascript
const express = require('express');
const ejs = require('ejs-next');
const path = require('path');

const app = express();

// Configure roots based on environment
function getViewRoots() {
  const baseDir = path.join(__dirname, 'views');
  const roots = [];
  
  switch (process.env.NODE_ENV) {
    case 'development':
      roots.push(path.join(baseDir, 'dev-overrides'));
      roots.push(path.join(baseDir, 'production'));
      break;
    case 'staging':
      roots.push(path.join(baseDir, 'staging'));
      roots.push(path.join(baseDir, 'production'));
      break;
    case 'production':
    default:
      roots.push(path.join(baseDir, 'production'));
      break;
  }
  
  return roots;
}

// Configure Express with environment-aware roots
app.engine('ejs', (filePath, options, callback) => {
  ejs.renderFile(filePath, options, { 
    root: getViewRoots(),
    cache: process.env.NODE_ENV === 'production'
  })
  .then(html => callback(null, html))
  .catch(err => callback(err));
});

app.set('view engine', 'ejs');
```

## Advanced Patterns

### Priority-Based Loading

Implement priority levels for template resolution:

```javascript
class PriorityRenderer {
  constructor() {
    this.templatePaths = new Map();
  }
  
  registerPath(name, path, priority = 0) {
    if (!this.templatePaths.has(name)) {
      this.templatePaths.set(name, []);
    }
    this.templatePaths.get(name).push({ path, priority });
  }
  
  getRoots(name = 'default') {
    const paths = this.templatePaths.get(name) || [];
    return paths
      .sort((a, b) => b.priority - a.priority)
      .map(item => item.path);
  }
  
  render(template, data, config = 'default') {
    return ejs.renderFile(template, data, {
      root: this.getRoots(config)
    });
  }
}

// Usage
const renderer = new PriorityRenderer();
renderer.registerPath('main', './views/custom', 100);
renderer.registerPath('main', './views/theme', 50);
renderer.registerPath('main', './views/default', 0);

renderer.render('page.ejs', data, 'main');
```

### Conditional Path Inclusion

Include paths based on runtime conditions:

```javascript
function getDynamicRoots(user, request) {
  const roots = [];
  
  // User-specific overrides
  if (user && user.customTemplates) {
    roots.push(`./views/users/${user.id}`);
  }
  
  // A/B testing variants
  if (request.abTest === 'variant-b') {
    roots.push('./views/ab-tests/variant-b');
  }
  
  // Feature flags
  if (user?.hasFeature('new-ui')) {
    roots.push('./views/new-ui');
  }
  
  // Language-specific templates
  roots.push(`./views/i18n/${request.language}`);
  
  // Default fallback
  roots.push('./views/default');
  
  return roots;
}

app.use((req, res, next) => {
  res.renderDynamic = function(view, locals) {
    const roots = getDynamicRoots(req.user, req);
    ejs.renderFile(view, locals, { root: roots })
      .then(html => res.send(html))
      .catch(err => next(err));
  };
  next();
});
```

## Path Resolution Methods

### `ejs.resolveInclude(filename, from, isDir, folders)`

Manually resolve a template path:

```javascript
const ejs = require('ejs-next');

const resolved = ejs.resolveInclude(
  'header.ejs',
  '/app/views/pages',
  true,
  [
    '/app/views/custom',
    '/app/views/default'
  ]
);

console.log(resolved); // First matching path
```

### `ejs.selectFirstPathMatch(filename, folders)`

Find the first existing file across multiple roots:

```javascript
const ejs = require('ejs-next');

const found = ejs.selectFirstPathMatch(
  '/app/views/pages/header.ejs',
  [
    '/app/views/custom',
    '/app/views/theme',
    '/app/views/default'
  ]
);

console.log(found); // First path where file exists
```

### `ejs.selectRoot(filename, folders)`

Determine which root a filename belongs to:

```javascript
const ejs = require('ejs-next');

const root = ejs.selectRoot(
  '/app/views/custom/header.ejs',
  [
    '/app/views/custom',
    '/app/views/default'
  ]
);

console.log(root); // '/app/views/custom'
```

## Best Practices

### 1. Order Matters

Place more specific paths before general ones:

```javascript
root: [
  './views/user-specific',     // Most specific
  './views/tenant',
  './views/theme',
  './views/default'            // Most general
]
```

### 2. Document Override Behavior

Add comments explaining the override hierarchy:

```javascript
/**
 * Template resolution order:
 * 1. User customizations (./views/users/{userId})
 * 2. Tenant branding (./views/tenants/{tenantId})
 * 3. Theme templates (./views/themes/{theme})
 * 4. Default templates (./views/default)
 */
const roots = [
  path.join(__dirname, 'views', 'users', userId),
  path.join(__dirname, 'views', 'tenants', tenantId),
  path.join(__dirname, 'views', 'themes', theme),
  path.join(__dirname, 'views', 'default')
];
```

### 3. Use Absolute Paths

Always use absolute paths for root directories:

```javascript
const path = require('path');

root: [
  path.join(__dirname, 'views', 'custom'),
  path.join(__dirname, 'views', 'default')
]
```

### 4. Cache Considerations

Be aware of caching with multiple roots:

```javascript
// Development: No cache, see overrides immediately
ejs.renderFile(template, data, {
  root: roots,
  cache: false
});

// Production: Cache enabled for performance
ejs.renderFile(template, data, {
  root: roots,
  cache: true
});
```

### 5. Fallback Safety

Always include a complete fallback directory:

```javascript
root: [
  './custom',    // May have partial templates
  './theme',     // May have partial templates
  './complete'   // Has ALL required templates
]
```

## Debugging Path Resolution

### Log Template Paths

```javascript
class DebugEJS extends ejs {
  resolveInclude(filename, from, isDir) {
    const resolved = super.resolveInclude(filename, from, isDir);
    console.log(`Resolved ${filename} -> ${resolved}`);
    return resolved;
  }
}

const renderer = new DebugEJS({
  root: ['./custom', './default']
});
```

### Verify Template Locations

```javascript
const fs = require('fs');

function verifyTemplates(roots, templates) {
  templates.forEach(template => {
    console.log(`\nLooking for: ${template}`);
    for (const root of roots) {
      const fullPath = path.join(root, template);
      const exists = fs.existsSync(fullPath);
      console.log(`  ${exists ? '✓' : '✗'} ${fullPath}`);
      if (exists) break;
    }
  });
}

verifyTemplates(
  ['./views/custom', './views/default'],
  ['layout.ejs', 'header.ejs', 'footer.ejs']
);
```

## Error Handling

### Template Not Found

```javascript
app.use((req, res, next) => {
  res.renderWithFallback = function(view, locals) {
    const roots = getDynamicRoots(req);
    
    ejs.renderFile(view, locals, { root: roots })
      .then(html => res.send(html))
      .catch(err => {
        if (err.code === 'ENOENT') {
          console.error(`Template not found in any root: ${view}`);
          console.error(`Searched in: ${roots.join(', ')}`);
          res.status(404).send('Template not found');
        } else {
          next(err);
        }
      });
  };
  next();
});
```

## Next Steps

- Learn about [Layouts](./features/layouts.md) for template inheritance
- Explore [Methods](./features/methods.md) including `include()`
- Check [API Reference](./api-reference.md) for path resolution APIs
- Review [Getting Started](./getting-started.md) for basic configuration
