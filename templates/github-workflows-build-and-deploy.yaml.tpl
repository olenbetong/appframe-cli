name: Build, deploy and publish application to test
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
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - run: pnpm install
      - run: pnpm run build
        env:
          APPFRAME_LOGIN: ${{ secrets.APPFRAME_LOGIN }}
          APPFRAME_PWD: ${{ secrets.APPFRAME_PWD }}
      - run: pnpm exec af vite deploy
        env:
          APPFRAME_LOGIN: ${{ secrets.APPFRAME_LOGIN }}
          APPFRAME_PWD: ${{ secrets.APPFRAME_PWD }}
      - run: pnpm exec af vite publish
        env:
          APPFRAME_LOGIN: ${{ secrets.APPFRAME_LOGIN }}
          APPFRAME_PWD: ${{ secrets.APPFRAME_PWD }}