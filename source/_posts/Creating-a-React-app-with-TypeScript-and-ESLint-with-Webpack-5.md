---
title: Creating a React app with TypeScript and ESLint with Webpack 5
date: 2022-05-01 04:11:39
categories: English
tags:
- TypeScript
- Webpack
- React
---

This post will cover how to use [webpack 5](https://webpack.js.org/) to bundle a React and TypeScript app. Our setup will include type checking with TypeScript and linting with [ESLint](https://eslint.org/) in the Webpack process, which will help code quality. We will configure Webpack to give us a great development experience with hot reloading and an optimized production bundle.

 [![](https://www.carlrippon.com/static/9d15c1b7d155ac0ced0ca045c275950d/799d3/banner.png)](https://www.carlrippon.com/static/9d15c1b7d155ac0ced0ca045c275950d/14e05/banner.png) 

Creating a basic project
------------------------

We’ll start by creating the following folders in a root folder of our choice:

*   `build`: This is where all the artifacts from the build output will be.
*   `src`: This will hold our source code.

Note that a `node_modules` folder will also be created as we start to install the project’s dependencies.

In the root of the project, add the following `package.json` file:

```json
{
  "name": "my-app",
  "version": "0.0.1"
}
```

This file will automatically update with our project dependencies as we install them throughout this post.

Let’s add the following `index.html` file into the `src` folder:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>My app</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

This HTML file is a template that Webpack will use in the bundling process. We will eventually tell Webpack to inject the React app into the `root` `div` element and reference the bundled JavaScript and CSS.

Adding React and TypeScript
---------------------------

Add the following commands in a Terminal to install React, TypeScript, and the React types:

```shell
npm install react react-dom
```

```shell
npm install --save-dev typescript
```

```shell
npm install --save-dev @types/react @types/react-dom
```

TypeScript is configured with a file called `tsconfig.json`. Let’s create this file in the root of our project with the following content:

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react"
  },
  "include": ["src"]
}
```

We are only going to use TypeScript in our project for type checking. We are going to eventually use [Babel](https://babeljs.io/) to do the code transpilation. So, the compiler options in our `tsconfig.json` are focused on type checking, not code transpilation.

Here’s an explanation of the settings we have used:

*   `lib`: The standard typing to be included in the type checking process. In our case, we have chosen to use the types for the browser’s DOM and the latest version of ECMAScript.
*   `allowJs`: Whether to allow JavaScript files to be compiled.
*   `allowSyntheticDefaultImports`: This allows default imports from modules with no default export in the type checking process.
*   `skipLibCheck`: Whether to skip type checking of all the type declaration files (\*.d.ts).
*   `esModuleInterop`: This enables compatibility with Babel.
*   `strict`: This sets the level of type checking to very high. When this is `true`, the project is said to be running in strict mode.
*   `forceConsistentCasingInFileNames`: Ensures that the casing of referenced file names is consistent during the type checking process.
*   `moduleResolution`: How module dependencies get resolved, which is node for our project.
*   `resolveJsonModule`: This allows modules to be in `.json` files which are useful for configuration files.
*   `noEmit`: Whether to suppress TypeScript generating code during the compilation process. This is `true` in our project because Babel will be generating the JavaScript code.
*   `jsx`: Whether to support JSX in `.tsx` files.
*   `include`: These are the files and folders for TypeScript to check. In our project, we have specified all the files in the `src` folder.

Adding a root React component
-----------------------------

Let’s create a simple React component in an `index.tsx` file in the `src` folder. This will eventually be displayed in `index.html`.

```react
import React from "react";
import ReactDOM from "react-dom";

const App = () => (
  <h1>My React and TypeScript App!</h1>
);

ReactDOM.render(
  <React.StrictMode>  <App />  </React.StrictMode>,
  document.getElementById("root")
);
```

We have created the React app in [strict mode](https://reactjs.org/docs/strict-mode.html) and injected it into a `div` element that has an `id` of `"root"`.

Adding Babel
------------

Our project is going to use [Babel](https://babeljs.io/) to convert our React and TypeScript code to JavaScript. Let’s install Babel with the necessary plugins:

```shell
npm install --save-dev @babel/core @babel/preset-env @babel/preset-react @babel/preset-typescript @babel/plugin-transform-runtime @babel/runtime
```

Here’s an explanation of the packages we have just installed:

*   `@babel/core`: As the name suggests, this is the core Babel library.
*   `@babel/preset-env`: This is a collection of plugins that allow us to use the latest JavaScript features but still target browsers that don’t support them.
*   `@babel/preset-react`: This is a collection of plugins that enable Babel to transform React code into JavaScript.
*   `@babel/preset-typescript`: This is a plugin that enables Babel to transform TypeScript code into JavaScript.
*   `@babel/plugin-transform-runtime` and `@babel/runtime`: These are plugins that allow us to use the `async` and `await` JavaScript features.

Configuring Babel
-----------------

Babel is configured in a file called `.babelrc`. Let’s create this file in the root of our project with the following content:

```json
{
  "presets": [
    "@babel/preset-env",
    "@babel/preset-react",
    "@babel/preset-typescript"
  ],
  "plugins": [
    [
      "@babel/plugin-transform-runtime",
      {
        "regenerator": true
      }
    ]
  ]
}
```

This configuration tells Babel to use the plugins we have installed.

Adding linting
--------------

We are going to use [**ESLint**](https://eslint.org/) in our project. ESLint can help us find problematic coding patterns or code that doesn’t adhere to specific style guidelines.

So, let’s install ESLint along with the plugins we are going to need:

```shell
npm install --save-dev eslint eslint-plugin-react eslint-plugin-react-hooks @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

Below is an explanation of the packages that we just installed:

*   `eslint`: This is the core ESLint library.
*   `eslint-plugin-react`: This contains some standard linting rules for React code.
*   `eslint-plugin-react-hooks`: This includes some linting rules for React hooks code.
*   `@typescript-eslint/parser`: This allows TypeScript code to be linted.
*   `@typescript-eslint/eslint-plugin`: This contains some standard linting rules for TypeScript code.

ESLint can be configured in a `.eslintrc.json` file in the project root.

Let’s create the configuration file containing the following:

```json
{
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2018,
    "sourceType": "module"
  },
  "plugins": [
    "@typescript-eslint",
    "react-hooks"
  ],
  "extends": [
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "react/prop-types": "off"
  },
  "settings": {
    "react": {
      "pragma": "React",
      "version": "detect"
    }
  }
}
```

We have configured ESLint to use the TypeScript parser, and the standard React and TypeScript rules as a base set of rules. We’ve explicitly added the two React hooks rules and suppressed the `react/prop-types` rule because prop types aren’t relevant in React with TypeScript projects. We have also told ESLint to detect the version of React we are using.

Adding Webpack
--------------

Webpack is a popular tool that we can use to create performant bundles containing our app’s JavaScript code. It can reference these bundles in our `index.html`.

Let’s install the core Webpack library as well as its command-line interface:

```shell
npm install --save-dev webpack webpack-cli
```

TypeScript types are included in the `webpack` package, so we don’t need to install them separately.

Webpack has a [web server](https://webpack.js.org/configuration/dev-server/) that we will use during development. Let’s install this:

```shell
npm install --save-dev webpack-dev-server @types/webpack-dev-server
```

TypeScript types aren’t included in the `webpack-dev-server` package, which is why we installed the `@types/webpack-dev-server` package.

We need a Webpack plugin, `babel-loader`, to allow Babel to transpile the React and TypeScript code into JavaScript. Let’s install this:

```shell
npm install --save-dev babel-loader
```

We also need a Webpack plugin, `html-webpack-plugin`, which will generate the HTML. Let’s install this:

```shell
npm install --save-dev html-webpack-plugin
```

Configuring development
-----------------------

The Webpack configuration file is JavaScript-based as standard. However, we can use TypeScript if we install a package called `ts-node`. Let’s install this:

```shell
npm install --save-dev ts-node
```

We are going to add two configuration files for Webpack - one for development and one for production.

Let’s add a development configuration file first. Name the file `webpack.dev.config.ts` and create it in the project’s root directory with the following content:

```javascript
import path from "path";
import { Configuration, HotModuleReplacementPlugin } from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";

const config: Configuration = {
  mode: "development",
  output: {
    publicPath: "/",
  },
  entry: "./src/index.tsx",
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/i,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env",
              "@babel/preset-react",
              "@babel/preset-typescript",
            ],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "src/index.html",
    }),
    new HotModuleReplacementPlugin(),
  ],
  devtool: "inline-source-map",
  devServer: {
    static: path.join(__dirname, "build"),
    historyApiFallback: true,
    port: 4000,
    open: true,
    hot: true
  },
};

export default config;
```

Here are the critical bits in this configuration file:

*   The `mode` field tells Webpack whether the app needs to be bundled for production or development. We are configuring Webpack for development, so we have set this to `"development"`. Webpack will automatically set `process.env.NODE_ENV` to `"development"` which means we get the React development tools included in the bundle.
*   The `output.public` field tells Webpack what the root path is in the app. This is important for deep linking in the dev server to work properly.
*   The `entry` field tells Webpack where to start looking for modules to bundle. In our project, this is `index.tsx`.
*   The `module` field tells Webpack how different modules will be treated. Our project is telling Webpack to use the `babel-loader` plugin to process files with `.js`, `.ts`, and `.tsx` extensions.
*   The `resolve.extensions` field tells Webpack what file types to look for in which order during module resolution. We need to tell it to look for TypeScript files as well as JavaScript files.
*   The `HtmlWebpackPlugin` creates the HTML file. We have told this to use our `index.html` in the `src` folder as the template.
*   The `HotModuleReplacementPlugin` and `devServer.hot` allow modules to be updated while an application is running, without a full reload.
*   The `devtool` field tells Webpack to use full inline source maps. This allows us to debug the original code before transpilation.
*   The `devServer` field configures the Webpack development server. We tell Webpack that the root of the webserver is the `build` folder, and to serve files on port `4000`. `historyApiFallback` is necessary for deep links to work in multi-page apps. We are also telling Webpack to open the browser after the server has been started.

Adding an npm script to run the app in dev mode
-----------------------------------------------

We will leverage npm scripts to start our app in development mode. Let’s add a `scripts` section to `package.json` with the following script:

```json
 ...,
  "scripts": {
    "start": "webpack serve --config webpack.dev.config.ts",
  },
  ...
```

The script starts the Webpack development server. We have used the `config` option to reference the development configuration file we have just created.

Let’s run the following command in a terminal to start the app in development mode:

After a few seconds, the Webpack development server will start, and our app will be opened in our default browser:

 [![](https://www.carlrippon.com/static/787ce99d13383cf77df478edace19235/2342d/start.png)](https://www.carlrippon.com/static/787ce99d13383cf77df478edace19235/2342d/start.png) 

Notice that Webpack hasn’t bundled any files in the build folder. This is because the files are in memory in the Webpack dev server.

Let’s change the content of the `h1` element inside the `App` component. Notice how the browser automatically refreshes to show the updated app when the file is saved:

![](https://www.carlrippon.com/601d4d9f6b8478338e988c783a7abcd0/live-reload.gif)

Nice! 😊

Adding type checking into the webpack process
---------------------------------------------

The Webpack process won’t do any type checking at the moment. We can use a package called [`fork-ts-checker-webpack-plugin`](https://github.com/TypeStrong/fork-ts-checker-webpack-plugin) to enable the Webpack process to type check the code. This means that Webpack will inform us of any type errors. Let’s install this package:

```shell
npm install --save-dev fork-ts-checker-webpack-plugin @types/fork-ts-checker-webpack-plugin
```

Let’s add this to `webpack.dev.config.ts`:

```javascript
...
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';

const config: Configuration = {
  ...,
  plugins: [
    ...,
    new ForkTsCheckerWebpackPlugin({
      async: false
    }),
  ],
};
```

We have used the `async` flag to tell Webpack to wait for the type checking process to finish before it emits any code.

We’ll need to stop and restart the app for this additional configuration to take effect.

Let’s make a change to the heading that is rendered in `index.tsx`. Let’s reference a variable called `today` in the heading:

```react
...
const App = () => <h1>My React and TypeScript App!! {today}</h1>;
...
```

Of course, this is an error because we haven’t declared and initialized `today` anywhere. Webpack will raise this type error in the terminal:

 [![](https://www.carlrippon.com/static/cc0a6363f9131706c307094e4ab4d2d5/799d3/type-error.png)](https://www.carlrippon.com/static/cc0a6363f9131706c307094e4ab4d2d5/36e7e/type-error.png) 

Let’s resolve this now by changing the rendered header to reference something that is valid:

```react
const App = () => (
  <h1> My React and TypeScript App!!{" "}  {new Date().toLocaleDateString()}  </h1>
);
```

The type errors will vanish, and the running app will have been updated to include today’s date:

 [![](https://www.carlrippon.com/static/a86eab147728a9f211edae8b36fcf60c/799d3/type-error-fix.png)](https://www.carlrippon.com/static/a86eab147728a9f211edae8b36fcf60c/03058/type-error-fix.png) 

Adding linting into the webpack process
---------------------------------------

The Webpack process won’t do any linting at the moment. We can use a package called [`ESLintPlugin`](https://github.com/webpack-contrib/eslint-webpack-plugin) to enable the Webpack process to lint the code with ESLint. This means that Webpack will inform us of any linting errors. Let’s install this package:

```shell
npm install --save-dev eslint-webpack-plugin
```

Let’s add this to `webpack.dev.config.ts`:

```javascript
...
import ESLintPlugin from "eslint-webpack-plugin";

const config: Configuration = {
  ...,
  plugins: [
    ...,
    new ESLintPlugin({
      extensions: ["js", "jsx", "ts", "tsx"],
    }),
  ],
};
```

We have used the `extensions` setting to tell the plugin to lint TypeScript files as well as JavaScript files.

We’ll need to stop and restart the app for this additional configuration to take effect.

In `index.tsx`, add an unused variable:

```javascript
const unused = "something";
```

Webpack will inform us of the linting warning:

 [![](https://www.carlrippon.com/static/d9ccf930ba2aaab321927afaa6d4eb4a/799d3/lint-error.png)](https://www.carlrippon.com/static/d9ccf930ba2aaab321927afaa6d4eb4a/da2b8/lint-error.png) 

If we remove this unused line, the warning will disappear.

That completes our development configuration.

Configuring production
----------------------

The Webpack configuration for production is a little different - we want files to be bundled in the file system optimized for production without any dev stuff.

Let’s create a file in the project root called `webpack.prod.config.ts` with the following content:

```javascript
import path from "path";
import { Configuration } from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import ESLintPlugin from "eslint-webpack-plugin";
import { CleanWebpackPlugin } from "clean-webpack-plugin";

const config: Configuration = {
  mode: "production",
  entry: "./src/index.tsx",
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "[name].[contenthash].js",
    publicPath: "",
  },
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/i,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env",
              "@babel/preset-react",
              "@babel/preset-typescript",
            ],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "src/index.html",
    }),
    new ForkTsCheckerWebpackPlugin({
      async: false,
    }),
    new ESLintPlugin({
      extensions: ["js", "jsx", "ts", "tsx"],
    }),
    new CleanWebpackPlugin(),
  ],
};

export default config;
```

This is similar to the development configuration with the following differences:

*   We’ve specified the `mode` to be production. Webpack will automatically set `process.env.NODE_ENV` to `"production"` which means we won’t get the React development tools included in the bundle.
*   The `output` field tells Webpack where to bundle our code. In our project, this is the `build` folder. We have used the `[name]` token to allow Webpack to name the files if our app is code split. We have used the `[contenthash]` token so that the bundle file name changes when its content changes, which will bust the browser cache.
*   The [`CleanWebpackPlugin`](https://github.com/johnagan/clean-webpack-plugin) plugin will clear out the build folder at the start of the bundling process.

We will need to install `CleanWebpackPlugin` using the following command:

```shell
npm install --save-dev clean-webpack-plugin
```

Adding an npm script to build the app for production
----------------------------------------------------

Let’s add an npm script to build the app for production:

```javascript
 ...,
  "scripts": {
    ...,
    "build": "webpack --config webpack.prod.config.ts",
  },
  ...
```

The script starts the Webpack bundling process. We have used the `config` option to reference the production configuration file we have just created.

Let’s run the following command in a terminal to start the app in development mode:

After a few seconds, the Webpack will place the bundled files in the `build` folder.

If we look at the JavaScript file, we will see it is minified. Webpack uses its [TerserWebpackPlugin](https://webpack.js.org/plugins/terser-webpack-plugin/) out of the box in production mode to minify code. The JavaScript bundle contains all the code from our app as well as the code from the `react` and `react-dom` packages.

If we look at the html file, we will see all the spaces have been removed. If we look closely, we will see a script element referencing our JavaScript file which the [HtmlWebpackPlugin](https://webpack.js.org/plugins/html-webpack-plugin/#root) did for us.

 [![](https://www.carlrippon.com/static/d4c033763f1c20c41f6cc87dada37ddb/799d3/prod-files.png)](https://www.carlrippon.com/static/d4c033763f1c20c41f6cc87dada37ddb/af0ed/prod-files.png) 

Nice! 😊

That’s it! Our project is now set up ready for us efficiently develop our React and TypeScript app. The `build` command allows us to integrate it into our CI/CD process easily.

This code is available in GitHub at [https://github.com/carlrip/react-typescript-eslint-webpack](https://github.com/carlrip/react-typescript-eslint-webpack)
