name: Build, deploy and publish application to test
on:
  release:
    types: [created]
  workflow_dispatch:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      # Setup .npmrc file to publish to npm
      - uses: actions/setup-node@v2
        with:
          node-version: '14.x'
          registry-url: 'https://registry.npmjs.org'
      - run: npm install
      - run: npm run build
      - run: npm run deploy
        env:
          APPFRAME_LOGIN: ${{ secrets.APPFRAME_LOGIN }}
          APPFRAME_PWD: ${{ secrets.APPFRAME_PWD }}
      - run: af cra publish
        env:
          APPFRAME_LOGIN: ${{ secrets.APPFRAME_LOGIN }}
          APPFRAME_PWD: ${{ secrets.APPFRAME_PWD }}