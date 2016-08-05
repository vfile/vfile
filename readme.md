# ![vfile][]

[![Build Status][build-badge]][build-status]
[![Coverage Status][coverage-badge]][coverage-status]

**VFile** is a virtual file format used by [**unified**][unified],
a text processing umbrella (it powers [**retext**][retext] for
natural language, [**remark**][remark] for markdown, and
[**rehype**][rehype] for HTML).  Each processors which parse, transform,
and compile text, and need a virtual representation of files and a
place to store [metadata][] and [messages][] about them.  Plus, they
work in the browser.  **VFile** provides these requirements.

> **VFile** is different from (the excellent :+1:) [**vinyl**][vinyl]
> in that it does not include file-system or node-only functionality.
> No streams or stats.  In addition, the focus on [metadata][] is
> useful when processing a file through a [middleware][] pipeline.

## Table of Contents

*   [Installation](#installation)
*   [Usage](#usage)
*   [List of Utilities](#list-of-utilities)
*   [API](#api)
    *   [VFile(\[options\])](#vfileoptions)
    *   [vfile.contents](#vfilecontents)
    *   [vfile.directory](#vfiledirectory)
    *   [vfile.filename](#vfilefilename)
    *   [vfile.extension](#vfileextension)
    *   [vfile.messages](#vfilemessages)
    *   [vfile.history](#vfilehistory)
    *   [VFile#toString()](#vfiletostring)
    *   [VFile#filePath()](#vfilefilepath)
    *   [VFile#basename()](#vfilebasename)
    *   [VFile#move(\[options\])](#vfilemoveoptions)
    *   [VFile#namespace(key)](#vfilenamespacekey)
    *   [VFile#hasFailed()](#vfilehasfailed)
    *   [VFile#message(reason\[, position\[, ruleId\]\])](#vfilemessagereason-position-ruleid)
    *   [VFile#warn(reason\[, position\[, ruleId\]\])](#vfilewarnreason-position-ruleid)
    *   [VFile#fail(reason\[, position\[, ruleId\]\])](#vfilefailreason-position-ruleid)
    *   [VFileMessage](#vfilemessage)
*   [License](#license)

## Installation

[npm][]:

```bash
npm install vfile
```

## Usage

```js
var vfile = require('vfile');

var file = vfile({
  directory: '~',
  filename: 'example',
  extension: 'txt',
  contents: 'Foo *bar* baz'
});

file.toString(); // 'Foo *bar* baz'
file.filePath(); // '~/example.txt'

file.move({extension: 'md'});
file.filePath(); // '~/example.md'

file.warn('Something went wrong', {line: 1, column: 3});
// { [~/example.md:1:3: Something went wrong]
//   name: '~/example.md:1:3',
//   file: '~/example.md',
//   reason: 'Something went wrong',
//   line: 1,
//   column: 3,
//   fatal: false }
```

## List of Utilities

The following list of projects includes tools for working with virtual
files.  See [**Unist**][unist] for projects working with nodes.

*   [`dustinspecker/convert-vinyl-to-vfile`](https://github.com/dustinspecker/convert-vinyl-to-vfile)
    — Convert from [Vinyl][] a VFile;
*   [`shinnn/is-vfile-message`](https://github.com/shinnn/is-vfile-message)
    — Check if a value is a `VFileMessage` object;
*   [`wooorm/to-vfile`](https://github.com/wooorm/to-vfile)
    — Create a virtual file from a file-path (and read it in);
*   [`wooorm/vfile-find-down`](https://github.com/wooorm/vfile-find-down)
    — Find files by searching the file system downwards;
*   [`wooorm/vfile-find-up`](https://github.com/wooorm/vfile-find-up)
    — Find files by searching the file system upwards;
*   [`wooorm/vfile-location`](https://github.com/wooorm/vfile-location)
    — Convert between line/column- and range-based locations;
*   [`shinnn/vfile-messages-to-vscode-diagnostics`](https://github.com/shinnn/vfile-messages-to-vscode-diagnostics)
    — Convert to VS Code diagnostics;
*   [`wooorm/vfile-reporter`](https://github.com/wooorm/vfile-reporter)
    — Stylish reporter for virtual files.
*   [`wooorm/vfile-sort`](https://github.com/wooorm/vfile-sort)
    — Sort virtual file messages by line/column;
*   [`sindresorhus/vfile-to-eslint`](https://github.com/sindresorhus/vfile-to-eslint)
    — Convert VFiles to ESLint formatter compatible output;
*   [`sindresorhus/vfile-reporter-pretty`](https://github.com/sindresorhus/vfile-reporter-pretty)
    — Pretty reporter for VFile;

## API

### `VFile([options])`

Create a new virtual file.  If `options` is `string`, treats it as
`{contents: options}`.  If `options` is a `VFile`, returns it.

###### Example

```js
var file = vfile({
  directory: '~',
  filename: 'example',
  extension: 'txt',
  contents: 'Foo *bar* baz'
});

var file = vfile('Qux quux');
```

###### `options`

*   `directory` (`string?`, optional) — Parent directory;
*   `filename` (`string?`, optional) — Name, without extension;
*   `extension` (`string?`, optional) — Extension, without initial dot;
*   `contents` (`string?`, optional) — Raw value.

###### Returns

New instance of `vfile`.

### `vfile.contents`

Raw value.

### `vfile.directory`

Path to parent directory.

### `vfile.filename`

`string` — Name of file.

### `vfile.extension`

`string` — Last extension, if any, of the file.

### `vfile.messages`

`Array.<VFileMessage>` — List messages associated with the file.

### `vfile.history`

`Array.<string>` — List of file-paths the file [`#move()`][move]d
between.

### `VFile#toString()`

Get contents of `vfile` (`string`).

### `VFile#filePath()`

Get the filename, with extension and directory, if applicable (`string`).

### `VFile#basename()`

Get the filename, with extension, if applicable (`string`).

### `VFile#move([options])`

Move a file by passing a new directory, filename, and extension.  When
these are not given, the current values are kept.  Returns self.

###### `options`

*   `directory` (`string`, optional) — Parent directory;
*   `filename` (`string?`, optional) — Name, without (final) extension;
*   `extension` (`string`, optional) — Extension, without initial dot.

### `VFile#namespace(key)`

Access a scope for metadata based on the unique key (`string`).
Returns an object.

### `VFile#hasFailed()`

Check if a fatal message occurred making the file no longer processable.
Returns `boolean`.

### `VFile#message(reason[, position[, ruleId]])`

Create a message with `reason` at `position`.  When an error is passed
in as `reason`, copies the stack.  **This does not add a message to
`messages`**.

*   `reason` (`string` or `Error`)
    — Reason for message, uses the stack and message of the error if given;
*   `position` (`Node`, `Location`, or `Position`, optional)
    — Place at which the message occurred in `vfile`.
*   `ruleId` (`string`, optional)
    — Category of warning.

###### Returns

[`VFileMessage`][message].

### `VFile#warn(reason[, position[, ruleId]])`

Associates a non-fatal message with the file.
Calls [`#message()`][messages] internally.

###### Returns

[`VFileMessage`][message].

### `VFile#fail(reason[, position[, ruleId]])`

Associates a fatal message with the file, then throws it.
Note: fatal errors mean a file is no longer processable.
Calls [`#message()`][messages] internally.

###### Throws

[`VFileMessage`][message].

### `VFileMessage`

File-related message describing something at certain point (extends
`Error`).

###### Properties

*   `name` (`string`)
    — Place in `vfile` of the message, preceded by its file-path when
    available, and joined by `':'`.  Used by the native
    [`Error#toString()`][to-string];
*   `file` (`string`) — File-path (when the message was triggered);
*   `reason` (`string`) — Reason for message;
*   `line` (`number?`) — Starting line of error;
*   `column` (`number?`) — Starting column of error;
*   `stack` (`string?`) — Stack of message;
*   `ruleId` (`string?`) — Category of message;
*   `source` (`string?`) — Namespace of warning;
*   `fatal` (`boolean?`) — If `true`, marks message as no longer
    processable.
*   `location` (`object`) — Full range information, when available.  Has
    `start` and `end` properties, both set to an object with `line` and
    `column`, set to `number?`.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://img.shields.io/travis/wooorm/vfile.svg

[build-status]: https://travis-ci.org/wooorm/vfile

[coverage-badge]: https://img.shields.io/codecov/c/github/wooorm/vfile.svg

[coverage-status]: https://codecov.io/github/wooorm/vfile

[npm]: https://docs.npmjs.com/cli/install

[license]: LICENSE

[author]: http://wooorm.com

[vfile]: https://cdn.rawgit.com/wooorm/vfile/master/logo.svg

[unified]: https://github.com/wooorm/unified

[retext]: https://github.com/wooorm/retext

[remark]: https://github.com/wooorm/remark

[rehype]: https://github.com/wooorm/rehype

[vinyl]: https://github.com/wearefractal/vinyl

[middleware]: https://github.com/wooorm/trough

[unist]: https://github.com/wooorm/unist#list-of-utilities

[to-string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/name

[metadata]: #vfilenamespacekey

[messages]: #vfilemessagereason-position-ruleid

[move]: #vfilemoveoptions

[message]: #vfilemessage
