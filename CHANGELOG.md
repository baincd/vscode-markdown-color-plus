# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2021-06-17
### Added
- Strike through feature: strikethrough text and set opacity on strikethrough sections

## [1.3.2] - 2021-03-29
### Fixed
- Fix bug causing lines starting with a list symbol but not followed with a space to be detected as a list

## [1.3.1] - 2021-03-22
### Fixed
- Fix bug detecting lists with leading spaces

## [1.3.0] - 2021-03-21
### Changed
- Improved internal extension logic
### Added
- Add support for indented code blocks immediately following horizontal rules
- Add support for indented code blocks immediately following alternate style headers
- Add logic for indented code blocks following lists
### Fixed
- Fix bugs with highlighting headers using alternate header syntax
- Fix bug that highlighted invisible line breaks on headers
- Fix bug detecting starting code fence when preceded with tab
- Fix bug detecting ending code fence longer than starting code fence
- Fix bug detecting indented code blocks indented with spaces then a tab
- Fix bug that highlighted indented lines that immediately followed block quotes

## [1.2.3] - 2021-03-16
### Added
- Make delays between events and updating background colors configurable

## [1.2.2] - 2021-03-14
### Fixed
- Highlight Current Section Headers
	- Ignore fenced and indented code blocks properly when detecting headers
	- Detect headers with preceding spaces
	- Performance improvements
- Fenced Code Block Background
	- Fixes detecting the start of fenced code blocks with preceding spaces


## [1.2.1] - 2021-03-13
### Added
- Cleanup documentation

## [1.2.0] - 2021-03-13
### Added
- Highlight current section headers

## [1.1.0] - 2021-03-13
### Added
- Set background of invisible line breaks (2 trailing spaces)

## [1.0.0] - 2021-03-12
### Added
- Set background of fenced code blocked, indented code blocks, and inline code in Markdown files
