# Changelog

## [2.0.2] - 2019-06-06

### 🏠 Internal

- Updated dependencies

## [2.0.0] - 2019-01-25

### Breaking changes

- Article styles no longer use the article ID as target. An identifier that can be used to recognize it in the article style later should be used instead

## [1.2.0] - 2019-01-18

### 🚀 Enhancements

- New exclude parameter for publish type article-script.

### 🐛 Bug Fix

- Article parameter was ignored by article-script type. Had to use targetArticleId

## [1.1.9] - 2018-12-19

### 🐛 Bug Fix

- PrimKey not supplied error when creating new records.

## [1.1.8] - 2018-12-18

### 🐛 Bug Fix

- Publishing that failed with server error reported as succeeded ([Issue #1])
- Server fails to deserialize JSON for some large requests ([Issue #1])

## [1.1.7] - 2018-12-17

### 🐛 Bug Fix

- No longer reports success on failed authentication

### 🏠 Internal

- Use [@olenbetong.no/appframe-client](https://www.npmjs.com/package/@olenbetong/appframe-client) to communicate with the Appframe website

### 📃 Documentation

- New CHANGELOG.md file

## [1.1.6] - 2018-11-16

- Moved repository to GitHub
- Updated dependencies

## [1.1.5] - 2018-11-15

- Improved error handling for invalid targets
- Updated dependencies

## [1.1.4] - 2018-11-09

- Minor fixes to README

## [1.1.3] - 2018-10-31

- Separate publish parameters in readme to clarify what they are used for

## [1.1.2] - 2018-10-30

- Added 'Changes' section to README

## [1.1.1] - 2018-10-29

- Install command will now prompt the user if parameters are missing

## [1.1.0] - 2018-10-29

- New publish target `component-site` - Publishes a component only available for 1 website
- New command `appframe install` - Adds a data source to the `components` application on a website. This is required to use the `component-site` publish target.

## [1.0.7] - 2018-10-29

- Fixed publish failing due to content length header

## [1.0.6] - 2018-10-29

- Several minor fixes

## [1.0.3] - 2018-10-26

- Improved error handling

## [1.0.1] - 2018-10-23

- Add support for production mode publish

[unreleased]: https://github.com/bjornarvh/appframe-cli/compare/v2.0.2...HEAD
[2.0.0]: https://github.com/bjornarvh/appframe-cli/compare/v2.0.0...v2.0.2
[2.0.0]: https://github.com/bjornarvh/appframe-cli/compare/v1.2.0...v2.0.0
[1.2.0]: https://github.com/bjornarvh/appframe-cli/compare/v1.1.9...v1.2.0
[1.1.9]: https://github.com/bjornarvh/appframe-cli/compare/v1.1.8...v1.1.9
[1.1.8]: https://github.com/bjornarvh/appframe-cli/compare/v1.1.7...v1.1.8
[1.1.7]: https://github.com/bjornarvh/appframe-cli/compare/v1.1.6...v1.1.7
[1.1.6]: https://github.com/bjornarvh/appframe-cli/compare/v1.1.5...v1.1.6
[1.1.5]: https://github.com/bjornarvh/appframe-cli/compare/v1.1.4...v1.1.5
[1.1.4]: https://github.com/bjornarvh/appframe-cli/compare/v1.1.3...v1.1.4
[1.1.3]: https://github.com/bjornarvh/appframe-cli/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/bjornarvh/appframe-cli/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/bjornarvh/appframe-cli/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/bjornarvh/appframe-cli/compare/v1.0.7...v1.1.0
[1.0.7]: https://github.com/bjornarvh/appframe-cli/compare/v1.0.6...v1.0.7
[1.0.6]: https://github.com/bjornarvh/appframe-cli/compare/v1.0.3...v1.0.6
[1.0.3]: https://github.com/bjornarvh/appframe-cli/compare/v1.0.1...v1.0.3
[1.0.1]: https://github.com/bjornarvh/appframe-cli/compare/v1.0.0...v1.0.1
[issue #1]: https://github.com/olenbetong/appframe-cli/issues/1
