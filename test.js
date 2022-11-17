/**
 * @typedef {import('unist').Position} Position
 * @typedef {import('unist').Point} Point
 * @typedef {import('vfile-message').VFileMessage} VFileMessage
 */

import assert from 'node:assert/strict'
import {URL, fileURLToPath} from 'node:url'
import path from 'node:path'
import process from 'node:process'
import {Buffer} from 'node:buffer'
import test from 'node:test'
import {path as p} from './lib/minpath.browser.js'
import {VFile} from './index.js'

/* eslint-disable no-undef */
/** @type {Error} */
let exception
/** @type {Error} */
let changedMessage
/** @type {Error} */
let multilineException

try {
  // @ts-expect-error
  variable = 1
} catch (error_) {
  const error = /** @type {Error} */ (error_)
  error.stack = cleanStack(error.stack, 3)
  exception = error
}

try {
  // @ts-expect-error
  variable = 1
} catch (error_) {
  const error = /** @type {Error} */ (error_)
  error.message = 'foo'
  error.stack = cleanStack(error.stack, 3)
  changedMessage = error
}

try {
  // @ts-expect-error
  variable = 1
} catch (error_) {
  const error = /** @type {Error} */ (error_)
  error.message = 'foo\nbar\nbaz'
  error.stack = cleanStack(error.stack, 5)
  multilineException = error
}
/* eslint-enable no-undef */

test('new VFile(options?)', async (t) => {
  assert.ok(new VFile() instanceof VFile, 'should work with new')

  await t.test('should accept missing options', () => {
    const file = new VFile()

    assert.deepEqual(file.history, [])
    assert.deepEqual(file.data, {})
    assert.deepEqual(file.messages, [])
    assert.equal(file.value, undefined)
    assert.equal(file.path, undefined)
    assert.equal(file.dirname, undefined)
    assert.equal(file.basename, undefined)
    assert.equal(file.stem, undefined)
    assert.equal(file.extname, undefined)
  })

  await t.test('should accept a string', () => {
    const file = new VFile('alpha')

    assert.equal(file.value, 'alpha')
  })

  await t.test('should accept a vfile', () => {
    const left = new VFile()
    const right = new VFile(left)

    assert.deepEqual(left, right)
    assert.equal(left.path, right.path)
  })

  await t.test('should accept a vfile w/ path', () => {
    const left = new VFile({path: path.join('path', 'to', 'file.js')})
    const right = new VFile(left)

    assert.deepEqual(left, right)
    assert.equal(left.path, right.path)
  })

  await t.test('should accept an file URL', () => {
    const url = new URL(import.meta.url)
    const file = new VFile(url)
    assert.deepEqual(file.path, fileURLToPath(url))
  })

  await t.test('should accept an object (1)', () => {
    const fp = path.join('~', 'example.md')
    const file = new VFile({path: fp})

    assert.deepEqual(file.history, [fp])
    assert.equal(file.value, undefined)
    assert.equal(file.path, fp)
    assert.equal(file.dirname, '~')
    assert.equal(file.basename, 'example.md')
    assert.equal(file.stem, 'example')
    assert.equal(file.extname, '.md')
  })

  await t.test('should accept a object (2)', () => {
    const file = new VFile({basename: 'example.md'})

    assert.deepEqual(file.history, ['example.md'])
    assert.equal(file.value, undefined)
    assert.equal(file.path, 'example.md')
    assert.equal(file.dirname, '.')
    assert.equal(file.basename, 'example.md')
    assert.equal(file.stem, 'example')
    assert.equal(file.extname, '.md')
  })

  await t.test('should accept a object (2)', () => {
    const file = new VFile({stem: 'example', extname: '.md', dirname: '~'})

    assert.deepEqual(file.history, [
      'example',
      'example.md',
      path.join('~', 'example.md')
    ])
    assert.equal(file.value, undefined)
    assert.equal(file.path, path.join('~', 'example.md'))
    assert.equal(file.dirname, '~')
    assert.equal(file.basename, 'example.md')
    assert.equal(file.stem, 'example')
    assert.equal(file.extname, '.md')
  })

  await t.test('should set custom props', () => {
    const testing = [1, 2, 3]
    const file = new VFile({custom: true, testing})

    // @ts-expect-error It’s recommended to use `data` for custom fields, but it works in the runtime.
    assert.equal(file.custom, true)
    // @ts-expect-error It’s recommended to use `data` for custom fields, but it works in the runtime.
    assert.equal(file.testing, testing)
  })

  await t.test('#toString()', () => {
    assert.equal(
      new VFile().toString(),
      '',
      'should return `""` without content'
    )

    assert.equal(
      new VFile('foo').toString(),
      'foo',
      'string: should return the internal value'
    )

    assert.equal(
      new VFile(Buffer.from('bar')).toString(),
      'bar',
      'buffer: should return the internal value'
    )

    assert.equal(
      new VFile(Buffer.from('bar')).toString('hex'),
      '626172',
      'buffer encoding: should return the internal value'
    )
  })

  await t.test('.cwd', () => {
    assert.equal(
      new VFile().cwd,
      process.cwd(),
      'should start at `process.cwd()`'
    )

    assert.equal(new VFile({cwd: '/'}).cwd, '/', 'should be settable')
  })

  await t.test('.path', () => {
    const fp = path.join('~', 'example.md')
    const ofp = path.join('~', 'example', 'example.txt')
    let file = new VFile()

    assert.equal(file.path, undefined, 'should start `undefined`')

    file.path = fp

    assert.equal(file.path, fp, 'should set `path`s')

    file.path = ofp

    assert.equal(file.path, ofp, 'should change `path`s')

    assert.deepEqual(file.history, [fp, ofp], 'should record changes')

    file.path = ofp

    assert.deepEqual(
      file.history,
      [fp, ofp],
      'should not record setting the same path'
    )

    assert.throws(
      () => {
        // @ts-expect-error: runtime.
        file.path = undefined
      },
      /Error: `path` cannot be empty/,
      'should not remove `path`'
    )

    file = new VFile()
    // @ts-ignore: TS doesn’t understand seem to understand setters with a
    // different argument than the return type of the getter.
    // So my editor shows a warning.
    // However: actually building the project *does* not.
    // Hence this is an ignore instead of an expect error.
    file.path = new URL(import.meta.url)

    assert.deepEqual(
      file.path,
      fileURLToPath(import.meta.url),
      'should support setting a URL'
    )

    assert.throws(
      () => {
        const u = new URL('https://example.com')
        file = new VFile(u)
      },
      /The URL must be of scheme file/,
      'should not allow setting non-`file:` urls'
    )

    if (process.platform !== 'win32') {
      // Windows allows this just fine:
      // <https://github.com/nodejs/node/blob/fcf8ba4/lib/internal/url.js#L1369>
      assert.throws(
        () => {
          const u = new URL('file:')
          u.hostname = 'a.com'
          file = new VFile(u)
        },
        /File URL host must be/,
        'should not allow setting `file:` urls w/ a host'
      )
    }

    assert.throws(
      () => {
        const u = new URL('file:')
        u.pathname = 'a/b%2fc'
        file = new VFile(u)
      },
      /File URL path must not include encoded/,
      'should not allow setting `file:` urls w/ a slash in pathname'
    )
  })

  await t.test('.basename', () => {
    let file = new VFile()

    assert.equal(file.basename, undefined, 'should start `undefined`')

    file.basename = 'example.md'

    assert.equal(file.basename, 'example.md', 'should set `basename`')

    file.basename = 'readme.txt'

    assert.equal(file.basename, 'readme.txt', 'should change `basename`')

    assert.deepEqual(
      file.history,
      ['example.md', 'readme.txt'],
      'should record changes'
    )

    file = new VFile({path: path.join('~', 'alpha', 'bravo.md')})

    assert.throws(
      () => {
        file.basename = undefined
      },
      /Error: `basename` cannot be empty/,
      'should throw when removing `basename`'
    )

    assert.throws(
      () => {
        file.basename = path.join('charlie', 'delta.js')
      },
      new RegExp(
        'Error: `basename` cannot be a path: did not expect `\\' +
          path.sep +
          '`'
      ),
      'should throw when setting a path'
    )
  })

  await t.test('.dirname', () => {
    const fp = path.join('~', 'alpha', 'bravo')
    const file = new VFile()

    assert.equal(file.dirname, undefined, 'should start undefined')

    assert.throws(
      () => {
        file.dirname = fp
      },
      /Error: Setting `dirname` requires `path` to be set too/,
      'should throw when setting without path'
    )

    file.path = fp
    file.dirname = path.join('~', 'charlie')

    assert.equal(file.dirname, path.join('~', 'charlie'), 'should change paths')

    assert.deepEqual(
      file.history,
      [fp, path.join('~', 'charlie', 'bravo')],
      'should record changes'
    )

    file.dirname = undefined
    assert.equal(file.dirname, '.', 'should support removing `dirname` (1)')
    assert.equal(file.path, 'bravo', 'should support removing `dirname` (2)')
  })

  await t.test('.extname', () => {
    const fp = path.join('~', 'alpha', 'bravo')
    const file = new VFile()

    assert.equal(file.extname, undefined, 'should start `undefined`')

    assert.throws(
      () => {
        file.extname = '.git'
      },
      /Error: Setting `extname` requires `path` to be set too/,
      'should throw when setting without `path`'
    )

    file.path = fp
    assert.equal(file.extname, '', 'should return empty without extension')

    file.extname = '.md'
    assert.equal(file.extname, '.md', 'should set extensions')

    assert.deepEqual(file.history, [fp, fp + '.md'], 'should record changes')

    assert.throws(
      () => {
        file.extname = 'txt'
      },
      /Error: `extname` must start with `.`/,
      'should throw without initial `.`'
    )

    assert.throws(
      () => {
        file.extname = '..md'
      },
      /Error: `extname` cannot contain multiple dots/,
      'should throw with mutiple `.`s'
    )

    file.extname = undefined
    assert.equal(file.extname, '', 'should support removing `extname` (1)')
    assert.equal(file.path, fp, 'should support removing `extname` (2)')
  })

  await t.test('.stem', () => {
    const file = new VFile()

    assert.equal(file.stem, undefined, 'should start `undefined`')

    file.stem = 'bravo'

    assert.equal(file.stem, 'bravo', 'should set')

    file.stem = 'charlie'

    assert.equal(file.stem, 'charlie', 'should change')

    assert.throws(
      () => {
        file.stem = undefined
      },
      /Error: `stem` cannot be empty/,
      'should throw when removing `stem`'
    )

    assert.throws(
      () => {
        file.stem = path.join('charlie', 'delta.js')
      },
      new RegExp(
        'Error: `stem` cannot be a path: did not expect `\\' + path.sep + '`'
      ),
      'should throw when setting a path'
    )
  })

  await t.test('#message(reason[, position][, origin])', () => {
    const fp = path.join('~', 'example.md')

    assert.ok(
      new VFile().message('') instanceof Error,
      'should return an Error'
    )

    const file = new VFile({path: fp})
    let message = file.message('Foo')

    assert.equal(file.messages.length, 1)
    assert.equal(file.messages[0], message)

    assert.equal(message.name, fp + ':1:1')
    assert.equal(message.file, fp)
    assert.equal(message.reason, 'Foo')
    assert.equal(message.ruleId, null)
    assert.equal(message.source, null)
    assert.equal(message.stack, '')
    assert.equal(message.fatal, false)
    assert.equal(message.line, null)
    assert.equal(message.column, null)
    assert.deepEqual(message.position, {
      start: {line: null, column: null},
      end: {line: null, column: null}
    })

    assert.equal(
      String(message),
      fp + ':1:1: Foo',
      'should have a pretty `toString()` message'
    )

    message = new VFile().message(exception)

    assert.equal(
      message.message,
      'variable is not defined',
      'should accept an error (1)'
    )

    assert.equal(
      String(message.stack || '').split('\n')[0],
      'ReferenceError: variable is not defined',
      'should accept an error (2)'
    )

    message = new VFile().message(changedMessage)

    assert.equal(message.message, 'foo', 'should accept a changed error (1)')

    assert.equal(
      String(message.stack || '').split('\n')[0],
      'ReferenceError: foo',
      'should accept a changed error (2)'
    )

    message = new VFile().message(multilineException)

    assert.equal(
      message.message,
      'foo\nbar\nbaz',
      'should accept a multiline error (1)'
    )

    assert.equal(
      String(message.stack || '')
        .split('\n')
        .slice(0, 3)
        .join('\n'),
      'ReferenceError: foo\nbar\nbaz',
      'should accept a multiline error (2)'
    )

    const literalNode = {
      type: 'x',
      value: 'x',
      position: {
        start: {line: 2, column: 3},
        end: {line: 2, column: 5}
      }
    }

    message = new VFile().message('test', literalNode)

    assert.deepEqual(
      message.position,
      literalNode.position,
      'should accept a node (1)'
    )
    assert.equal(String(message), '2:3-2:5: test', 'should accept a node (2)')

    assert.equal(
      String(
        new VFile().message(
          'test',
          /** @type {import('mdast').Root} */ ({
            type: 'root',
            children: [],
            position: {
              start: {line: 1, column: 1},
              end: {line: 2, column: 1}
            }
          })
        )
      ),
      '1:1-2:1: test',
      'should accept a node (3)'
    )

    const position = literalNode.position
    message = new VFile().message('test', position)

    assert.deepEqual(message.position, position, 'should accept a position (1)')
    assert.equal(
      String(message),
      '2:3-2:5: test',
      'should accept a position (2)'
    )

    const point = position.start
    message = new VFile().message('test', point)

    assert.deepEqual(
      message.position,
      {start: point, end: {line: null, column: null}},
      'should accept a position (1)'
    )

    assert.equal(String(message), '2:3: test', 'should accept a position')

    assert.equal(
      // @ts-expect-error runtime allow omitting `place`.
      new VFile().message('test', 'charlie').ruleId,
      'charlie',
      'should accept a `ruleId` as `origin`'
    )

    // @ts-expect-error runtime allow omitting `place`.
    message = new VFile().message('test', 'delta:echo')

    assert.deepEqual(
      [message.source, message.ruleId],
      ['delta', 'echo'],
      'should accept a `source` and `ruleId` in `origin`'
    )
  })

  await t.test('#fail(reason[, position][, origin])', () => {
    const fp = path.join('~', 'example.md')
    const file = new VFile({path: fp})

    assert.throws(
      () => {
        file.fail('Foo', {line: 1, column: 3}, 'baz:qux')
      },
      /1:3: Foo/,
      'should throw the message'
    )

    assert.equal(file.messages.length, 1)

    const message = file.messages[0]

    assert.equal(message.name, fp + ':1:3')
    assert.equal(message.file, fp)
    assert.equal(message.reason, 'Foo')
    assert.equal(message.source, 'baz')
    assert.equal(message.ruleId, 'qux')
    assert.equal(message.stack, '')
    assert.equal(message.fatal, true)
    assert.equal(message.line, 1)
    assert.equal(message.column, 3)
    assert.deepEqual(message.position, {
      start: {line: 1, column: 3},
      end: {line: null, column: null}
    })
  })

  await t.test('#info(reason[, position][, origin])', () => {
    const fp = path.join('~', 'example.md')
    const file = new VFile({path: fp})

    const message = file.info('Bar', {line: 1, column: 3}, 'baz:qux')

    assert.equal(file.messages.length, 1)

    assert.equal(message.name, fp + ':1:3')
    assert.equal(message.file, fp)
    assert.equal(message.reason, 'Bar')
    assert.equal(message.source, 'baz')
    assert.equal(message.ruleId, 'qux')
    assert.equal(message.fatal, null)
    assert.equal(message.line, 1)
    assert.equal(message.column, 3)
    assert.deepEqual(message.position, {
      start: {line: 1, column: 3},
      end: {line: null, column: null}
    })
  })
})

// Mostly from `path-browserify` with some extra tests to reach coverage, and
// some cleaning.
// <https://github.com/browserify/path-browserify/tree/master/test>
test('p (POSIX path for browsers)', async (t) => {
  const typeErrorTests = [true, false, 7, null, {}, undefined, [], Number.NaN]

  await t.test('basename', () => {
    let index = -1
    while (++index < typeErrorTests.length) {
      const test = typeErrorTests[index]

      assert.throws(
        () => {
          // @ts-expect-error runtime.
          p.basename(test)
        },
        TypeError,
        'should fail on `' + test + '`'
      )

      // `undefined` is a valid value as the second argument to basename.
      if (test !== undefined) {
        assert.throws(
          () => {
            // @ts-expect-error runtime.
            p.basename('x', test)
          },
          TypeError,
          'should fail on `' + test + '` as `ext`'
        )
      }
    }

    assert.strictEqual(p.basename('.js', '.js'), '')
    assert.strictEqual(p.basename(''), '')
    assert.strictEqual(p.basename('/dir/basename.ext'), 'basename.ext')
    assert.strictEqual(p.basename('/basename.ext'), 'basename.ext')
    assert.strictEqual(p.basename('basename.ext'), 'basename.ext')
    assert.strictEqual(p.basename('basename.ext/'), 'basename.ext')
    assert.strictEqual(p.basename('basename.ext//'), 'basename.ext')
    assert.strictEqual(p.basename('aaa/bbb', '/bbb'), 'bbb')
    assert.strictEqual(p.basename('aaa/bbb', 'a/bbb'), 'bbb')
    assert.strictEqual(p.basename('aaa/bbb', 'bbb'), 'bbb')
    assert.strictEqual(p.basename('aaa/bbb//', 'bbb'), 'bbb')
    assert.strictEqual(p.basename('aaa/bbb', 'bb'), 'b')
    assert.strictEqual(p.basename('aaa/bbb', 'b'), 'bb')
    assert.strictEqual(p.basename('/aaa/bbb', '/bbb'), 'bbb')
    assert.strictEqual(p.basename('/aaa/bbb', 'a/bbb'), 'bbb')
    assert.strictEqual(p.basename('/aaa/bbb', 'bbb'), 'bbb')
    assert.strictEqual(p.basename('/aaa/bbb//', 'bbb'), 'bbb')
    assert.strictEqual(p.basename('/aaa/bbb', 'bb'), 'b')
    assert.strictEqual(p.basename('/aaa/bbb', 'b'), 'bb')
    assert.strictEqual(p.basename('/aaa/bbb'), 'bbb')
    assert.strictEqual(p.basename('/aaa/'), 'aaa')
    assert.strictEqual(p.basename('/aaa/b'), 'b')
    assert.strictEqual(p.basename('/a/b'), 'b')
    assert.strictEqual(p.basename('//a'), 'a')

    // Backslashes are normal characters.
    assert.strictEqual(p.basename('\\dir\\basename.ext'), '\\dir\\basename.ext')
    assert.strictEqual(p.basename('\\basename.ext'), '\\basename.ext')
    assert.strictEqual(p.basename('basename.ext'), 'basename.ext')
    assert.strictEqual(p.basename('basename.ext\\'), 'basename.ext\\')
    assert.strictEqual(p.basename('basename.ext\\\\'), 'basename.ext\\\\')
    assert.strictEqual(p.basename('foo'), 'foo')

    assert.strictEqual(
      p.basename('/a/b/Icon\r'),
      'Icon\r',
      'should support control characters in filenames'
    )

    // Extra tests for `vfile` to reach coverage.
    assert.strictEqual(p.basename('a.b', 'a'), 'a.b')
  })

  await t.test('dirname', () => {
    let index = -1

    while (++index < typeErrorTests.length) {
      const test = typeErrorTests[index]
      assert.throws(
        () => {
          // @ts-expect-error runtime.
          p.dirname(test)
        },
        TypeError,
        'should fail on `' + test + '`'
      )
    }

    assert.strictEqual(p.dirname('/a/b/'), '/a')
    assert.strictEqual(p.dirname('/a/b'), '/a')
    assert.strictEqual(p.dirname('/a'), '/')
    assert.strictEqual(p.dirname(''), '.')
    assert.strictEqual(p.dirname('/'), '/')
    assert.strictEqual(p.dirname('////'), '/')
    assert.strictEqual(p.dirname('//a'), '//')
    assert.strictEqual(p.dirname('foo'), '.')
  })

  await t.test('extname', () => {
    let index = -1

    while (++index < typeErrorTests.length) {
      const test = typeErrorTests[index]
      assert.throws(
        () => {
          // @ts-expect-error runtime.
          p.extname(test)
        },
        TypeError,
        'should fail on `' + test + '`'
      )
    }

    const pairs = [
      [path.basename(import.meta.url), '.js'],
      ['', ''],
      ['/path/to/file', ''],
      ['/path/to/file.ext', '.ext'],
      ['/path.to/file.ext', '.ext'],
      ['/path.to/file', ''],
      ['/path.to/.file', ''],
      ['/path.to/.file.ext', '.ext'],
      ['/path/to/f.ext', '.ext'],
      ['/path/to/..ext', '.ext'],
      ['/path/to/..', ''],
      ['file', ''],
      ['file.ext', '.ext'],
      ['.file', ''],
      ['.file.ext', '.ext'],
      ['/file', ''],
      ['/file.ext', '.ext'],
      ['/.file', ''],
      ['/.file.ext', '.ext'],
      ['.path/file.ext', '.ext'],
      ['file.ext.ext', '.ext'],
      ['file.', '.'],
      ['.', ''],
      ['./', ''],
      ['.file.ext', '.ext'],
      ['.file', ''],
      ['.file.', '.'],
      ['.file..', '.'],
      ['..', ''],
      ['../', ''],
      ['..file.ext', '.ext'],
      ['..file', '.file'],
      ['..file.', '.'],
      ['..file..', '.'],
      ['...', '.'],
      ['...ext', '.ext'],
      ['....', '.'],
      ['file.ext/', '.ext'],
      ['file.ext//', '.ext'],
      ['file/', ''],
      ['file//', ''],
      ['file./', '.'],
      ['file.//', '.']
    ]

    index = -1

    while (++index < pairs.length) {
      const pair = pairs[index]
      assert.strictEqual(pair[1], p.extname(pair[0]))
    }

    // On *nix, backslash is a valid name component like any other character.
    assert.strictEqual(p.extname('.\\'), '')
    assert.strictEqual(p.extname('..\\'), '.\\')
    assert.strictEqual(p.extname('file.ext\\'), '.ext\\')
    assert.strictEqual(p.extname('file.ext\\\\'), '.ext\\\\')
    assert.strictEqual(p.extname('file\\'), '')
    assert.strictEqual(p.extname('file\\\\'), '')
    assert.strictEqual(p.extname('file.\\'), '.\\')
    assert.strictEqual(p.extname('file.\\\\'), '.\\\\')
  })

  await t.test('join', () => {
    let index = -1

    while (++index < typeErrorTests.length) {
      const test = typeErrorTests[index]
      assert.throws(
        () => {
          // @ts-expect-error runtime.
          p.join(test)
        },
        TypeError,
        'should fail on `' + test + '`'
      )
    }

    /** @type {Array<[Array<string>, string]>} */
    const pairs = [
      [['.', 'x/b', '..', '/b/c.js'], 'x/b/c.js'],
      [[], '.'],
      [['/.', 'x/b', '..', '/b/c.js'], '/x/b/c.js'],
      [['/foo', '../../../bar'], '/bar'],
      [['foo', '../../../bar'], '../../bar'],
      [['foo/', '../../../bar'], '../../bar'],
      [['foo/x', '../../../bar'], '../bar'],
      [['foo/x', './bar'], 'foo/x/bar'],
      [['foo/x/', './bar'], 'foo/x/bar'],
      [['foo/x/', '.', 'bar'], 'foo/x/bar'],
      [['./'], './'],
      [['.', './'], './'],
      [['.', '.', '.'], '.'],
      [['.', './', '.'], '.'],
      [['.', '/./', '.'], '.'],
      [['.', '/////./', '.'], '.'],
      [['.'], '.'],
      [['', '.'], '.'],
      [['', 'foo'], 'foo'],
      [['foo', '/bar'], 'foo/bar'],
      [['', '/foo'], '/foo'],
      [['', '', '/foo'], '/foo'],
      [['', '', 'foo'], 'foo'],
      [['foo', ''], 'foo'],
      [['foo/', ''], 'foo/'],
      [['foo', '', '/bar'], 'foo/bar'],
      [['./', '..', '/foo'], '../foo'],
      [['./', '..', '..', '/foo'], '../../foo'],
      [['.', '..', '..', '/foo'], '../../foo'],
      [['', '..', '..', '/foo'], '../../foo'],
      [['/'], '/'],
      [['/', '.'], '/'],
      [['/', '..'], '/'],
      [['/', '..', '..'], '/'],
      [[''], '.'],
      [['', ''], '.'],
      [[' /foo'], ' /foo'],
      [[' ', 'foo'], ' /foo'],
      [[' ', '.'], ' '],
      [[' ', '/'], ' /'],
      [[' ', ''], ' '],
      [['/', 'foo'], '/foo'],
      [['/', '/foo'], '/foo'],
      [['/', '//foo'], '/foo'],
      [['/', '', '/foo'], '/foo'],
      [['', '/', 'foo'], '/foo'],
      [['', '/', '/foo'], '/foo']
    ]

    index = -1

    while (++index < pairs.length) {
      const pair = pairs[index]
      assert.strictEqual(p.join.apply(null, pair[0]), pair[1])
    }

    // Join will internally ignore all the zero-length strings and it will return
    // '.' if the joined string is a zero-length string.
    assert.strictEqual(p.join(''), '.')
    assert.strictEqual(p.join('', ''), '.')

    // Extra tests for `vfile` to reach coverage.
    assert.strictEqual(p.join('a', '..'), '.')
  })
})

/**
 * @param {string|undefined} stack
 * @param {number} max
 * @returns {string}
 */
function cleanStack(stack, max) {
  return String(stack || '')
    .replace(new RegExp('\\(.+\\' + path.sep, 'g'), '(')
    .replace(/\d+:\d+/g, '1:1')
    .split('\n')
    .slice(0, max)
    .join('\n')
}
