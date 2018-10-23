# Appframe CLI
### Development tools for Appframe Web

## Installation

Install globally:

```
npm install -g @bjornarvh/appframe-cli
appframe help
```

or install as a development dependancy, and use npx:

```
npm install --save-dev @bjornarvh/appframe-cli
npx appframe help
```

Appframe CLI also requires the following development applications to be installed on the domain you are publishing to:

* appdesigner
* appdesigner-script
* appdesigner-css
* components
* components-editor
* sitesetup
* sitesetup-stylesheet
* sitesetup-script

Due to the way data objects work, changes in data objects in these articles may cause the CLI to be incompatible. Specifically this will happen if the index of the primkey column is changed.

## Help

You can use `appframe help [command]` to get some basic information about a command. `appframe help` without a command name will list available commands.

## Publish scripts and styles

Use `appframe publish` to publish one or more scripts to an Appframe website.

### Parameters

Most parameters can be passed either as a command line parameter, or in a configuration file. The exceptions are `config`, which can only be used as a command line parameter, and `targets`, which can only be used in a config file.

* **config**
  Path for the configuration file. Should export an object with parameters
* **article** (optional)
  Article to publish to for types article-script and article-style
* **hostname**
  Hostname for the website.
* **domain** (optional)
  Domain used for authentication, and to publish the scripts/styles. Must have the articles specified in the "Installation" section. If left blank, the `hostname` parameter will be used
* **user**
  Appframe username used to publish the script/style.
* **password**
  Password for the Appframe-user
* **mode**
  'test', 'production' or both. This parameter is not used for article-script and article-style
* **source**
  File containing the source code to publish
* **target**
  Name of the target we're publishing to.
* **type**
  What kind of target we're publishing to. Available types are:
	* article-script
	* article-style
	* component-global
	* site-script
	* site-style
* **targets** If you're using a configuration file, the `targets` parameter can be used to publish multiple sources. See the Targets section below for usage description

Example command to publish a site script using command line parameters:

```
appframe publish --hostname mydomain.com --user myuser --password mypassword --source ./dist/bundle.min.js --target mylibrary.min.js --type site-script
```

### Targets

A target to publish to can be described either an array or an object. The parameter can contain a single target, or an array of targets.

#### Array target

Array items:

1. source file
2. target name
3. target type
4. hostname (optional)

For example, to publish the file `./dist/bundle.min.js` to a site script called `mylibrary.min.js`:

```js
['./dist/bundle.min.js', 'mylibrary.min.js', 'site-script']
```

Note that for the `article-script` type, the target name have to be in the format `[article-name]/[script-name]`. For the `article-style` type, the target name should be the article name.

#### Object target

An object with keys matching the parameters above. Source, target and type parameters are required, while the other parameters will use the parameters specified at root level if they are not given.

Example to publish a source file named `./dist/bundle.min.js` to a global component named `modules/mycomponent.min.js`:

```js
{
  source: './dist/bundle.min.js',
  target: 'modules/mycomponent.min.js',
  type: 'component-global'
}
```

### Type notes

#### `article-style`

Since articles only contain a single stylesheet, the CLI will wrap the source in a comment containing the source file name. When publishing, we look for the wrapping comment and replace the block. If the comment is not found, it is appended to the existing stylesheet.

This that if you rename the source file, the styles will be appended another time instead of replacing the old styles.

The target for an `article-style` should always be the article ID.

## Version

A version command is available to see which version of the Appframe CLI you are using.

```
appframe version
```