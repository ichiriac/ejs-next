# EJS-Next Documentation

Welcome to the comprehensive documentation for EJS-Next, a next-generation templating engine for Node.js.

## Table of Contents

### Getting Started
- **[Getting Started Guide](./getting-started.md)** - Installation, basic usage, and ExpressJS integration

### Core Concepts
- **[EJS Syntax](./syntax.md)** - Complete guide to EJS template syntax including the new `{@ @}` output capture
- **[API Reference](./api-reference.md)** - Detailed documentation of all methods and configuration options
- **[File Overwrite](./file-overwrite.md)** - Multiple paths configuration and template resolution

### Features
- **[Layouts](./features/layouts.md)** - Template inheritance and layout system
- **[Blocks](./features/blocks.md)** - Named content sections and modular composition
- **[Methods](./features/methods.md)** - Built-in template methods and custom helper functions
- **[Hooks](./features/hooks.md)** - Output hooks and advanced rendering patterns

## Quick Links

### New to EJS-Next?
Start with the [Getting Started Guide](./getting-started.md) to learn installation and basic usage.

### Coming from Classic EJS?
Check out the [EJS Syntax](./syntax.md) guide to learn about new features like output capture `{@ @}`.

### Building with Express?
See the [Getting Started Guide - ExpressJS Integration](./getting-started.md#expressjs-integration) section.

### Want to Master Advanced Features?
Explore the [Features](#features) section for in-depth guides on layouts, blocks, methods, and hooks.

## What's New in EJS-Next?

- **Async/Await Support** - All rendering operations return promises
- **Output Capture** - New `{@ @}` syntax for capturing template output in functions
- **Improved Performance** - Optimized parser for faster template compilation
- **Layouts & Blocks** - Built-in template inheritance system
- **Multiple Root Paths** - Support for template overriding with multiple directories

## Documentation Structure

```
docs/
├── README.md                    # This file
├── getting-started.md           # Installation and setup
├── syntax.md                    # Template syntax guide
├── api-reference.md             # Complete API documentation
├── file-overwrite.md            # Multiple paths and overrides
└── features/
    ├── layouts.md               # Layout system
    ├── blocks.md                # Content blocks
    ├── methods.md               # Template methods
    └── hooks.md                 # Output hooks
```

## Examples by Use Case

### Basic Templating
- [Simple rendering](./getting-started.md#basic-usage)
- [Variable output](./syntax.md#output-tags)
- [Control flow](./syntax.md#control-flow-tags)

### Template Composition
- [Including partials](./features/methods.md#includefilename-data)
- [Using layouts](./features/layouts.md#basic-usage)
- [Working with blocks](./features/blocks.md#basic-usage)

### Advanced Patterns
- [Output capture for components](./syntax.md#output-capture-syntax---)
- [Custom helper functions](./features/methods.md#custom-registered-functions)
- [Theme systems](./file-overwrite.md#1-theme-system)
- [Multi-tenant applications](./file-overwrite.md#2-multi-tenant-application)

### Express.js Integration
- [Basic setup](./getting-started.md#expressjs-integration)
- [Complete example](./getting-started.md#complete-express-example)
- [Configuration options](./getting-started.md#express-configuration-options)

## Code Examples

All documentation includes working code examples that you can copy and adapt for your projects. Look for code blocks throughout the guides.

## Contributing

Found an error or want to improve the documentation? Contributions are welcome!

Visit the [GitHub repository](https://github.com/ichiriac/ejs-next) to:
- Report documentation issues
- Submit pull requests
- Ask questions

## Additional Resources

- [Main README](../README.md) - Project overview
- [GitHub Repository](https://github.com/ichiriac/ejs-next)
- [npm Package](https://www.npmjs.com/package/ejs-next)

## License

This documentation is part of the EJS-Next project and is licensed under the MIT License.

Copyright (c) 2025 Ioan CHIRIAC
