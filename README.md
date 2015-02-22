# grunt-tenon

> Accessibility testing tool

Grunt task interface to the [Tenon.io](http://tenon.io) automated accessibility testing service; [learn more about Tenon.io here](http://tenon.io/documentation/).

This plugin is currently in beta. Please file an issues as you come across. Contributors welcome.

## Getting Started
This plugin requires Grunt `~0.4.4`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-tenon --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-tenon');
```

## The "tenon" task

### Overview
In your project's Gruntfile, add a section named `tenon` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  tenon: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
});
```

### Properties

#### urls
Type: `Array`

Default value: `[]`

A list of publicly accessible URLs that can be fetched via the tenon API.

### Options

#### options.apiKey
Type: `String`

Default: `''`

Registered tenon API key.

#### options.contentPaths
Type: `Array`

Default: `[]`

A list of explicit content paths that are concatenated with the `httpBase` to form a publicly accessible URL for the tenon API to crawl.

#### options.force
Type: `Boolean`

Default: `false`

Set `force` to `true` to report JSHint errors but not fail the task.

#### options.httpBase
Type: `String`

Default: `''`

Base host for an internal list of URLs to crawl.

#### options.timeout
Type: `Number`

Default value: `3000`

The number in miliseconds of the request timeout to the tenon API.

#### options.urlService
Type: `String`

Default value: `''`

A custom service endpoint that must return JSON and has a `urls` property. This property is an `array` of object literals. An individual object literal has a property called, `path`, which is the path tto a page. The path can be fully qualified or relative to the `httpBase`.

```json
{
    urls: [
        {
            path: "/content/te-dev/usa/en/sprint-7/video-details"
        },
        {
            path: "/content/te-dev/usa/en/sprint-4/pnp/demo-browse"
        },
        {
            path: "/content/te-dev/usa/en/sprint-6/pgp/demo-pgp"
        }
    ]
}
```

### Usage Examples

#### Default Options
In this example, the default options are used to set the tenon API key and public URL is crawled by the service.

```js
grunt.initConfig({
    tenon: {
        options: {
            apiKey: "z3x55cx71z6045466X28cdacc87x544z"
        },
        local: {
            urls: [
                "http://www.myawesomewebsite.com"
            ]
        }
    }
});
```

#### Custom Options
In this example, custom options are used to overwrite the default options.

```js
grunt.initConfig({
    tenon: {
        options: {
            httpBase: "http://www2-qa.foo.com",
            apiKey: "z3x55cx71z6045466X28cdacc87x544z",
            timeout: 240000,
            urlService: "/content/te-dev/usa/en/admin/testaccessibility.json.html",
            apiOptions: {
                certainty: 80,
                level: "A",
                priority: 40
            },
            force: true
        },
        local: {
            urls: [
                "http://www.myawesomewebsite.com"
            ]
        },
        prod: {
            options: {
                urlService: "http://www2.foo.com/content/te-dev/usa/en/admin/testaccessibility.json.html",
                contentPaths: [
                    "/content/te-dev/usa/en/index.html"
                ]
            }
        }
    }
});
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
v0.0.1

v0.0.2
* Updated Gruntfile.js

v0.0.3
* Updated README.md

v0.0.4
* Updated for NPM

v.0.0.5
* Refactored node modules.
* Added tenon api options as task options
* Moved `urls` from options to dedicated property and made reverse compatible as options. This matches the usage examples now.
* Edited custom service description.
* Updated README.md
