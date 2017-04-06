Chunkhash Replace Webpack Plugin
================================
[![Total Downloads](https://img.shields.io/npm/dt/chunkhash-replace-webpack-plugin.svg)](https://npm-stat.com/charts.html?package=chunkhash-replace-webpack-plugin)

The latest release adds support for webpack users who prefer to extract styles out of their js bundle into a separate css file, using a tool like [ExtractTextPlugin](https://www.npmjs.com/package/extract-text-webpack-plugin).

**Tip**: Just use this plugin for your production/staging builds.

## Installation
```shell
$ npm install chunkhash-replace-webpack-plugin --save-dev
```

## Example

###Webpack.config.js

```javascript
const path = require('path');
const ChunkHashReplacePlugin = require('chunkhash-replace-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  entry: {
    app: ['./src/main.js'],
    vendor: ['jquery', 'lodash', 'react', 'react-dom']
  },
  output: {
    path: path.join(__dirname, 'dist/static'),
    filename: '[name].[chunkhash].js',
    publicPath: '/static/',
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader'
        })
      }
    ]
  },
  plugins: [
    new ChunkHashReplacePlugin({
      src: 'index.html',
      dest: 'dist/index.html',
    }),
    new ExtractTextPlugin('[name].[chunkhash].css')
  ]
};
```

## Output Example 1
### Input
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <link href="/static/app.css" rel="stylesheet">
</head>
<body>
  <script src="/static/vendor.js"></script>
  <script src="/static/app.js"></script>
</body>
</html>
```

###Output

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <link href="/static/app.bc9412b20a3d196ac0eb.css" rel="stylesheet">
</head>
<body>
  <script src="/static/vendor.8c670c84b126bbde6319.js"></script>
  <script src="/static/app.bc9412b20a3d196ac0eb.js"></script>
</body>
</html>
```

## Output Example 2
###Input

```javascript
var link1 = "/static/app.css";
```

###Output

```javascript
var link1 = "/static/app.bc9412b20a3d196ac0eb.css";
```

## Output Example 3
###Input

```html
<script type="text/javascript">
    var _stylesPath_ = {
        "/static/app.css": "/static/app.css"
    };
</script>
```

###Output
```html
<script type="text/javascript">
    var _stylesPath_ = {
        "/static/app.css": "/static/app.bc9412b20a3d196ac0eb.css"
    };
</script>
```

##Supported plugin options
### Option 1 (individual)
```
new ChunkHashReplacePlugin({
    src: 'templates/a.html',
    dest: 'build/templates/b.html'
})
```

### Option 2 (array)
```
new ChunkHashReplacePlugin({
    src: 'templates/a.html',
    dest: 'build/templates/b.html',
}, {
    src: 'templates/a1.html',
    dest: 'build/templates/b1.html',
}])
```

### Option 3 (directory)
```
new ChunkHashReplacePlugin({
    src: 'templates/',
    dest: 'build/templates/'
})
```