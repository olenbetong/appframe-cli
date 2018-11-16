# Appframe CLI
### Development tools for Appframe Web

## Installation

Install globally:

```
npm install -g @bjornarvh/appframe-cli
appframe help
```

or install as a development dependency, and use npx:

```
npm install --save-dev @bjornarvh/appframe-cli
npx appframe help
```

Appframe CLI also requires the following development applications to be installed on the domain you are publishing to:

* appdesigner
* appdesigner-datasource
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

## Install

The development articles do not contain any data source for site components, so to be able to publish to site components, you can run `appframe install <options>` to add the needed data source to the `components` article.

### Parameters

 * **hostname** - Hostname to install the components to
 * **domain** (optional) - If hostname isn't a valid domain, use this to specify which domain we should use to publish.
 * **user** - Appframe login to use to install
 * **password** - Password for the user

## Publish scripts and styles

Use `appframe publish` to publish one or more scripts to an Appframe website.

### Parameters

Most parameters can be passed either as a command line parameter, or in a configuration file. The exceptions are `config`, which can only be used as a command line parameter, and `targets`, which can only be used in a config file.

#### Authentication and target URL

Credentials and domain used to publish sources.

* **user**
Appframe username used to publish the script/style.
* **password**
Password for the Appframe-user
* **domain** (optional)
Domain used for authentication, and to publish the scripts/styles. Must have the articles specified in the "Installation" section. If left blank, the `hostname` parameter will be used

#### Publish target



* **article**
Article to publish to for types article-script and article-style. Will be ignored for other target types.
* **hostname**
Hostname for the website.
* **mode**
'test', 'production' or both. This parameter is not used for article-script and article-style
* **source**
Path to the file containing the source code to publish
* **target**
Name of the target we're publishing to. Will be used as path for components, or file name for site and article scripts/styles
* **type**
What kind of target we're publishing to. Available types are:
  * article-script
  * article-style
  * component-global
  * component-site (if the install command has been run for the target hostname)
  * site-script
  * site-style

Example command to publish a site script using command line parameters:

```
appframe publish --hostname mydomain.com --user myuser --password mypassword --source ./dist/bundle.min.js --target mylibrary.min.js --type site-script
```

#### Using a config file

If you need to publish multiple sources/targets or get parameters programmatically (e.g. get username/password from an ENV variable.), you can use a configuration file instead of CLI parameters.

* **config**
Path to a configuration file. We use node `require()` to get the configuration, so this may be a JSON file, or a javascript file that exports an object.
* **targets**
If you're using a configuration file, the `targets` parameter can be used to publish multiple sources. See the Targets section below for usage description


### Targets

A target to publish to can be described either as an array or an object. The parameter can contain a single target, or an array of targets.

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

### Example: Publishing with a configuration file

Given this configuration file called `appframe.config.js`

```js
const dotenv = require('dotenv');

dotenv.load();

const {
  APPFRAME_HOSTNAME: hostname,
  APPFRAME_LOGIN: user,
  APPFRAME_PWD: password
} = process.env;

const source = './test/testsource.js';
const target = 'jest-test-source.min.js';
const testArticle = 'publish-test';

module.exports = {
  mode: 'production',
  targets: [
    ['./test/testsource.js', testArticle, 'article-style'],
    ['./test/testsource.js', `${testArticle}/${target}`, 'article-script'],
    { source, target, type: 'component-site' },
    { source, target, type: 'component-global' },
    { source, target, type: 'site-script' }
  ],
  domain: 'appframe.example.com',
  hostname: 'AppframeWeb2016',
  password,
  source,
  target,
  type: 'site-style',
  user
};
```

you can publish using this command

```
appframe publish --config appframe.config.js
```

### Type notes

#### `article-style`

Since articles only contain a single stylesheet, the CLI will wrap the source in a comment containing the source file name. When publishing, we look for the wrapping comment and replace the block. If the comment is not found, it is appended to the existing stylesheet.

This means that if you rename the source file, the styles will be appended another time instead of replacing the old styles.

The target for an `article-style` should always be the article ID.

## Version

A version command is available to see which version of the Appframe CLI you are using.

```
appframe version
```

# Changes

### Version 1.1.6 - 2018-11-16

 * Moved repository to GitHub
 * Updated dependencies

### Version 1.1.5 - 2018-11-15

 * Improved error handling for invalid targets
 * Updated dependencies

### Version 1.1.4 - 2018-11-09

 * Minor fixes to README

### Version 1.1.3 - 2018-10-31

 * Separate publish parameters in readme to clarify what they are used for

### Version 1.1.2 - 2018-10-30

 * Added 'Changes' section to README

### Version 1.1.1 - 2018-10-29

 * Install command will now prompt the user if parameters are missing

### Version 1.1 - 2018-10-29

 * New publish target `component-site` - Publishes a component only available for 1 website
 * New command `appframe install` - Adds a data source to the `components` application on a website. This is required to use the `component-site` publish target.