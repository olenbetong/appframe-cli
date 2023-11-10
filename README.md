# Appframe CLI

Note that this project changed its scope completely in version 3, and none of the functionality in previous versions
are available anymore.

## Installation

To add to the current project run this command

```
pnpm install --save-dev @olenbetong/appframe-cli
```

## Commands

### vite deploy

In a SynergiWeb project with Vite, run this command after building to deploy the application:

```
npx af vite deploy
```

### generate-data-object

To generate data object or procedure definitions for data API resources, run this command:

```
npx af generate-data-object -r <resource-name>
```

### prepare-bundle

For projects that should be uploaded to AF Bundles, run this command to pack the project and upload it:

```
npx af prepare-bundle
```

This command assumes the bundle has the same name as the name property in package.json.

### publish-bundle

When a bundle has been uploaded, run this command to deploy it from dev.obet.no to test.obet.no. It will
only be downloaded on the production server, not applied.

```
npx af publish-bundle
```

### publish-to-prod

This command publishes the article on dev.obet.no and deploys it to test.obet.no. It is not applied
only the productions server, only downloaded.

The article ID and hostname is read from the appframe property in package.json.

```
npx af publish-to-prod
```
