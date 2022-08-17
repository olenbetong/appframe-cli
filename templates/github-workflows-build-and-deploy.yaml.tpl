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
          node-version: '18.x'
          registry-url: 'https://registry.npmjs.org'
      - run: npm install
      - run: npm run build
        env:
          APPFRAME_LOGIN: ${{ secrets.APPFRAME_LOGIN }}
          APPFRAME_PWD: ${{ secrets.APPFRAME_PWD }}
      - run: npx af vite deploy
        env:
          APPFRAME_LOGIN: ${{ secrets.APPFRAME_LOGIN }}
          APPFRAME_PWD: ${{ secrets.APPFRAME_PWD }}
      - run: npx af vite publish
        env:
          APPFRAME_LOGIN: ${{ secrets.APPFRAME_LOGIN }}
          APPFRAME_PWD: ${{ secrets.APPFRAME_PWD }}