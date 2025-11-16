# Hooks

Hooks in EJS-Next provide a powerful mechanism for intercepting and transforming template output at various stages of the rendering process. They enable advanced patterns like layouts, output transformation, and content post-processing.

## What Are Hooks?

A hook is a function that intercepts the output of a template before it's finalized. When a layout is applied to a template, EJS-Next uses hooks internally to:
1. Capture the current template's output
2. Pass it to the layout template
3. Replace the output with the layout's rendered result

## Output Hook System

### How Layout Hooks Work

When you call `layout()` in a template, EJS-Next sets an output hook that:

1. **Captures Content**: The current template's output is captured
2. **Passes to Layout**: The captured content is passed as `contents` to the layout
3. **Replaces Output**: The original output is replaced with the layout's rendered result

**Internal Flow:**
```javascript
// Simplified internal implementation
output.hook = function(contents) {
  return renderLayout(layoutFile, { 
    ...context, 
    contents: contents 
  });
};
```

### Basic Hook Pattern

While hooks are primarily used internally by the `layout()` method, understanding them helps with advanced use cases.

**Example: Simple Layout Hook**

```ejs
<!-- page.ejs -->
<%_ layout('main.ejs') _%>
<h1>Page Content</h1>
<p>This content will be wrapped by the layout.</p>
```

The `layout()` call sets up a hook that:
1. Captures: `<h1>Page Content</h1><p>This content...</p>`
2. Passes to layout as `contents` variable
3. Returns the layout's rendered output

## Advanced Hook Patterns

### Custom Output Processing

You can extend the EJS instance to add custom output processing:

**app.js:**
```javascript
const ejs = require('ejs-next');

class CustomEJS extends ejs {
  output() {
    const out = super.output();
    const originalHook = out.hook;
    
    // Add custom processing
    out.hook = function(contents) {
      // Post-process the content
      contents = contents.replace(/\s+/g, ' ').trim();
      
      // Call original hook if exists
      if (originalHook) {
        return originalHook(contents);
      }
      return contents;
    };
    
    return out;
  }
}

// Use custom EJS
const renderer = new CustomEJS({ root: './views' });
renderer.renderFile('page.ejs', data)
  .then(html => console.log(html));
```

### Chaining Output Transformations

**Example: Multiple Processing Stages**

```javascript
class ProcessingEJS extends ejs {
  output() {
    const out = super.output();
    
    out.hook = function(contents) {
      // Stage 1: Minify whitespace
      contents = contents.replace(/\s+/g, ' ');
      
      // Stage 2: Add performance hints
      const size = contents.length;
      if (size > 100000) {
        console.warn(`Large output: ${size} bytes`);
      }
      
      // Stage 3: Apply layout if needed
      if (originalLayoutHook) {
        contents = originalLayoutHook(contents);
      }
      
      return contents;
    };
    
    return out;
  }
}
```

## Practical Use Cases

### 1. Output Minification

Automatically minify HTML output:

```javascript
const ejs = require('ejs-next');
const htmlMinifier = require('html-minifier');

class MinifyingEJS extends ejs {
  output() {
    const out = super.output();
    const originalToString = out.toString.bind(out);
    
    out.toString = function() {
      let html = originalToString();
      
      try {
        html = htmlMinifier.minify(html, {
          collapseWhitespace: true,
          removeComments: true,
          minifyCSS: true,
          minifyJS: true
        });
      } catch (err) {
        console.error('Minification failed:', err);
      }
      
      return html;
    };
    
    return out;
  }
}

// Use minifying renderer
const renderer = new MinifyingEJS({ 
  root: './views',
  cache: true 
});
```

### 2. Content Security Policy (CSP) Nonce Injection

Inject nonce values for CSP:

```javascript
class CSPEJSRenderer extends ejs {
  constructor(opts) {
    super(opts);
    this.cspNonce = this.generateNonce();
  }
  
  generateNonce() {
    return require('crypto').randomBytes(16).toString('base64');
  }
  
  prepareContext(data) {
    data = super.prepareContext(data);
    data.nonce = this.cspNonce;
    return data;
  }
  
  output() {
    const out = super.output();
    const nonce = this.cspNonce;
    const originalHook = out.hook;
    
    out.hook = function(contents) {
      // Add nonce to inline scripts and styles
      contents = contents.replace(
        /<script(?![^>]*\snonce=)/g,
        `<script nonce="${nonce}"`
      );
      contents = contents.replace(
        /<style(?![^>]*\snonce=)/g,
        `<style nonce="${nonce}"`
      );
      
      if (originalHook) {
        return originalHook(contents);
      }
      return contents;
    };
    
    return out;
  }
}

// Usage with Express
app.use((req, res, next) => {
  const renderer = new CSPEJSRenderer({ root: './views' });
  res.renderSecure = function(view, data) {
    renderer.renderFile(view, data)
      .then(html => {
        res.setHeader(
          'Content-Security-Policy',
          `script-src 'nonce-${renderer.cspNonce}'`
        );
        res.send(html);
      });
  };
  next();
});
```

### 3. Analytics and Performance Tracking

Track rendering performance:

```javascript
class AnalyticsEJS extends ejs {
  renderFile(filename, data) {
    const startTime = Date.now();
    
    return super.renderFile(filename, data)
      .then(html => {
        const duration = Date.now() - startTime;
        const size = html.length;
        
        // Log metrics
        this.logMetrics({
          template: filename,
          duration: duration,
          size: size,
          timestamp: new Date()
        });
        
        return html;
      });
  }
  
  logMetrics(metrics) {
    // Send to analytics service
    console.log('Template Metrics:', metrics);
  }
}
```

### 4. Automatic Asset Versioning

Add version hashes to asset URLs:

```javascript
class AssetVersioningEJS extends ejs {
  constructor(opts) {
    super(opts);
    this.assetVersions = this.loadAssetVersions();
  }
  
  loadAssetVersions() {
    // Load from manifest file
    return {
      '/css/main.css': '/css/main.abc123.css',
      '/js/app.js': '/js/app.def456.js'
    };
  }
  
  output() {
    const out = super.output();
    const versions = this.assetVersions;
    const originalHook = out.hook;
    
    out.hook = function(contents) {
      // Replace asset URLs with versioned ones
      for (const [original, versioned] of Object.entries(versions)) {
        contents = contents.replace(
          new RegExp(original, 'g'),
          versioned
        );
      }
      
      if (originalHook) {
        return originalHook(contents);
      }
      return contents;
    };
    
    return out;
  }
}
```

### 5. Development Debug Information

Add debug info in development mode:

```javascript
class DebugEJS extends ejs {
  constructor(opts) {
    super(opts);
    this.debugMode = opts.debug || false;
  }
  
  renderFile(filename, data) {
    if (!this.debugMode) {
      return super.renderFile(filename, data);
    }
    
    const startTime = Date.now();
    
    return super.renderFile(filename, data)
      .then(html => {
        const duration = Date.now() - startTime;
        
        // Add debug info as HTML comment
        const debugInfo = `
<!--
  Template: ${filename}
  Rendered: ${new Date().toISOString()}
  Duration: ${duration}ms
  Size: ${html.length} bytes
  Data keys: ${Object.keys(data).join(', ')}
-->`;
        
        return debugInfo + html;
      });
  }
}

// Usage
const renderer = new DebugEJS({
  root: './views',
  debug: process.env.NODE_ENV === 'development'
});
```

## Hook Lifecycle

### Rendering Lifecycle with Hooks

1. **Template Compilation**: Template is parsed and compiled
2. **Execution Start**: Template function begins executing
3. **Output Creation**: Output buffer is created with potential hooks
4. **Content Generation**: Template generates content
5. **Hook Execution**: If a hook exists (e.g., from `layout()`), it's called with the content
6. **Final Output**: Processed content is returned

### Diagram

```
┌─────────────────────┐
│   Compile Template  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Execute Template   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Generate Content   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Hook Exists?      │
└──────────┬──────────┘
           │
      ┌────┴────┐
      │         │
     Yes        No
      │         │
      ▼         ▼
┌──────────┐  ┌──────────┐
│ Apply    │  │ Return   │
│ Hook     │  │ Content  │
└────┬─────┘  └─────┬────┘
     │              │
     └──────┬───────┘
            ▼
    ┌───────────────┐
    │ Final Output  │
    └───────────────┘
```

## Best Practices

### 1. Preserve Original Hook

Always preserve and call the original hook if it exists:

```javascript
output() {
  const out = super.output();
  const originalHook = out.hook;
  
  out.hook = function(contents) {
    // Your processing
    contents = processContents(contents);
    
    // Call original hook
    if (originalHook) {
      return originalHook(contents);
    }
    return contents;
  };
  
  return out;
}
```

### 2. Error Handling

Add error handling to hooks:

```javascript
out.hook = function(contents) {
  try {
    contents = complexProcessing(contents);
  } catch (err) {
    console.error('Hook processing error:', err);
    // Return original content on error
  }
  
  if (originalHook) {
    return originalHook(contents);
  }
  return contents;
};
```

### 3. Performance Considerations

Be mindful of performance in hooks:

```javascript
out.hook = function(contents) {
  // Avoid expensive operations on large content
  if (contents.length > 1000000) {
    console.warn('Large content, skipping processing');
    return originalHook ? originalHook(contents) : contents;
  }
  
  // Process normally
  contents = process(contents);
  return originalHook ? originalHook(contents) : contents;
};
```

### 4. Conditional Processing

Only apply hooks when necessary:

```javascript
class ConditionalEJS extends ejs {
  constructor(opts) {
    super(opts);
    this.enableProcessing = opts.process || false;
  }
  
  output() {
    const out = super.output();
    
    if (!this.enableProcessing) {
      return out;
    }
    
    // Apply hook only when enabled
    const originalHook = out.hook;
    out.hook = function(contents) {
      contents = process(contents);
      return originalHook ? originalHook(contents) : contents;
    };
    
    return out;
  }
}
```

## Testing Hooks

### Example Test

```javascript
const ejs = require('ejs-next');

describe('Custom Hook', () => {
  it('should process output correctly', async () => {
    class TestEJS extends ejs {
      output() {
        const out = super.output();
        out.hook = function(contents) {
          return contents.toUpperCase();
        };
        return out;
      }
    }
    
    const renderer = new TestEJS();
    const result = await renderer.render('hello <%= name %>', { name: 'world' });
    
    expect(result).toBe('HELLO WORLD');
  });
});
```

## Limitations and Considerations

1. **Async Processing**: Hooks must handle async operations properly if the original hook returns a promise
2. **Performance**: Heavy processing in hooks can impact rendering performance
3. **Order**: Hook execution order matters when multiple hooks are chained
4. **Context**: Hooks don't have direct access to template context (use closure or instance properties)

## Next Steps

- Learn about [Layouts](./layouts.md) which use hooks internally
- Explore [Methods](./methods.md) for other template features
- Check [API Reference](../api-reference.md) for output object details
- Review [Syntax](../syntax.md) for template syntax
