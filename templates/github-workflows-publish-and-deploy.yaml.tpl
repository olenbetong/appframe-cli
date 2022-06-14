name: Publish application from dev to test
on:
  workflow_dispatch:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      # Setup .npmrc file to publish to npm
      - uses: actions/setup-node@v2
        with:
          node-version: '18.x'
          registry-url: 'https://registry.npmjs.org'
      - run: npm install -g @olenbetong/appframe-cli
        env:
          APPFRAME_LOGIN: ${{ secrets.APPFRAME_LOGIN }}
          APPFRAME_PWD: ${{ secrets.APPFRAME_PWD }}
      - run: npx af cra publish
        env:
          APPFRAME_LOGIN: ${{ secrets.APPFRAME_LOGIN }}
          APPFRAME_PWD: ${{ secrets.APPFRAME_PWD }}