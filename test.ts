import {URL, fileURLToPath} from 'url'
import path from 'path'
import process from 'process'
import {Buffer} from 'buffer'
import test from 'tape'
import {path as p} from './lib/minpath.browser'
import {VFile} from '.'

/* eslint-disable no-undef */
let exception: Error
let changedMessage: Error
let multilineException: Error

try {
  // @ts-ignore
  variable = 1
} catch (error_) {
  const error = (error_) as Error
  error.stack = cleanStack(error.stack, 3)
  exception = error
}

try {
  // @ts-ignore
  variable = 1
} catch (error_) {
  const error = (error_) as Error
  error.message = 'foo'
  error.stack = cleanStack(error.stack, 3)
  changedMessage = error
}

try {
  // @ts-ignore
  variable = 1
} catch (error_) {
  const error = (error_) as Error
  error.message = 'foo\nbar\nbaz'
  error.stack = cleanStack(error.stack, 5)
  multilineException = error
}
/* eslint-enable no-undef */

test('new VFile(options?)', (t) => {
  t.ok(new VFile() instanceof VFile, 'should work with new')

  t.test('should accept missing options', (t) => {
    const file = new VFile()

    t.deepEqual(file.history, [])
    t.deepEqual(file.data, {})
    t.deepEqual(file.messages, [])
    t.equal(file.value, undefined)
    t.equal(file.path, undefined)
    t.equal(file.dirname, undefined)
    t.equal(file.basename, undefined)
    t.equal(file.stem, undefined)
    t.equal(file.extname, undefined)

    t.end()
  })

  t.test('should accept a string', (t) => {
    const file = new VFile('alpha')

    t.equal(file.value, 'alpha')

    t.end()
  })

  t.test('should accept a vfile', (t) => {
    const left = new VFile()
    const right = new VFile(left)

    t.deepEqual(left, right)
    t.equal(left.path, right.path)

    t.end()
  })

  t.test('should accept a vfile w/ path', (t) => {
    const left = new VFile({path: path.join('path', 'to', 'file.js')})
    const right = new VFile(left)

    t.deepEqual(left, right)
    t.equal(left.path, right.path)

    t.end()
  })

  t.test('should accept an file URL', (t) => {
    // @ts-ignore
    const url = new URL(import.meta.url)
    const file = new VFile(url)
    t.deepEqual(file.path, fileURLToPath(url))

    t.end()
  })

  t.test('should accept an object (1)', (t) => {
    const fp = path.join('~', 'example.md')
    const file = new VFile({path: fp})

    t.deepEqual(file.history, [fp])
    t.equal(file.value, undefined)
    t.equal(file.path, fp)
    t.equal(file.dirname, '~')
    t.equal(file.basename, 'example.md')
    t.equal(file.stem, 'example')
    t.equal(file.extname, '.md')

    t.end()
  })

  t.test('should accept a object (2)', (t) => {
    const file = new VFile({basename: 'example.md'})

    t.deepEqual(file.history, ['example.md'])
    t.equal(file.value, undefined)
    t.equal(file.path, 'example.md')
    t.equal(file.dirname, '.')
    t.equal(file.basename, 'example.md')
    t.equal(file.stem, 'example')
    t.equal(file.extname, '.md')

    t.end()
  })

  t.test('should accept a object (2)', (t) => {
    const file = new VFile({stem: 'example', extname: '.md', dirname: '~'})

    t.deepEqual(file.history, [
      'example',
      'example.md',
      path.join('~', 'example.md')
    ])
    t.equal(file.value, undefined)
    t.equal(file.path, path.join('~', 'example.md'))
    t.equal(file.dirname, '~')
    t.equal(file.basename, 'example.md')
    t.equal(file.stem, 'example')
    t.equal(file.extname, '.md')

    t.end()
  })

  t.test('should set custom props', (t) => {
    const testing = [1, 2, 3]
    const file = new VFile({custom: true, testing})

    // @ts-ignore It’s recommended to use `data` for custom fields, but it works in the runtime.
    t.equal(file.custom, true)
    // @ts-ignore It’s recommended to use `data` for custom fields, but it works in the runtime.
    t.equal(file.testing, testing)

    t.end()
  })

  t.test('#toString()', (t) => {
    t.equal(new VFile().toString(), '', 'should return `""` without content')

    t.equal(
      new VFile('foo').toString(),
      'foo',
      'string: should return the internal value'
    )

    t.equal(
      new VFile(Buffer.from('bar')).toString(),
      'bar',
      'buffer: should return the internal value'
    )

    t.equal(
      new VFile(Buffer.from('bar')).toString('hex'),
      '626172',
      'buffer encoding: should return the internal value'
    )

    t.end()
  })

  t.test('.cwd', (t) => {
    t.equal(new VFile().cwd, process.cwd(), 'should start at `process.cwd()`')

    t.equal(new VFile({cwd: '/'}).cwd, '/', 'should be settable')

    t.end()
  })

  t.test('.path', (t) => {
    const fp = path.join('~', 'example.md')
    const ofp = path.join('~', 'example', 'example.txt')
    let file = new VFile()

    t.equal(file.path, undefined, 'should start `undefined`')

    file.path = fp

    t.equal(file.path, fp, 'should set `path`s')

    file.path = ofp

    t.equal(file.path, ofp, 'should change `path`s')

    t.deepEqual(file.history, [fp, ofp], 'should record changes')

    file.path = ofp

    t.deepEqual(
      file.history,
      [fp, ofp],
      'should not record setting the same path'
    )

    t.throws(
      () => {
        // @ts-ignore: runtime.
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
    // @ts-ignore
    file.path = new URL(import.meta.url)

    t.deepEqual(
      file.path,
      // @ts-ignore
      fileURLToPath(import.meta.url),
      'should support setting a URL'
    )

    t.throws(
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
      t.throws(
        () => {
          const u = new URL('file:')
          u.hostname = 'a.com'
          file = new VFile(u)
        },
        /File URL host must be/,
        'should not allow setting `file:` urls w/ a host'
      )
    }

    t.throws(
      () => {
        const u = new URL('file:')
        u.pathname = 'a/b%2fc'
        file = new VFile(u)
      },
      /File URL path must not include encoded/,
      'should not allow setting `file:` urls w/ a slash in pathname'
    )

    t.end()
  })

  t.test('.basename', (t) => {
    let file = new VFile()

    t.equal(file.basename, undefined, 'should start `undefined`')

    file.basename = 'example.md'

    t.equal(file.basename, 'example.md', 'should set `basename`')

    file.basename = 'readme.txt'

    t.equal(file.basename, 'readme.txt', 'should change `basename`')

    t.deepEqual(
      file.history,
      ['example.md', 'readme.txt'],
      'should record changes'
    )

    file = new VFile({path: path.join('~', 'alpha', 'bravo.md')})

    t.throws(
      () => {
        file.basename = undefined
      },
      /Error: `basename` cannot be empty/,
      'should throw when removing `basename`'
    )

    t.throws(
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

    t.end()
  })

  t.test('.dirname', (t) => {
    const fp = path.join('~', 'alpha', 'bravo')
    const file = new VFile()

    t.equal(file.dirname, undefined, 'should start undefined')

    t.throws(
      () => {
        file.dirname = fp
      },
      /Error: Setting `dirname` requires `path` to be set too/,
      'should throw when setting without path'
    )

    file.path = fp
    file.dirname = path.join('~', 'charlie')

    t.equal(file.dirname, path.join('~', 'charlie'), 'should change paths')

    t.deepEqual(
      file.history,
      [fp, path.join('~', 'charlie', 'bravo')],
      'should record changes'
    )

    file.dirname = undefined
    t.equal(file.dirname, '.', 'should support removing `dirname` (1)')
    t.equal(file.path, 'bravo', 'should support removing `dirname` (2)')

    t.end()
  })

  t.test('.extname', (t) => {
    const fp = path.join('~', 'alpha', 'bravo')
    const file = new VFile()

    t.equal(file.extname, undefined, 'should start `undefined`')

    t.throws(
      () => {
        file.extname = '.git'
      },
      /Error: Setting `extname` requires `path` to be set too/,
      'should throw when setting without `path`'
    )

    file.path = fp
    t.equal(file.extname, '', 'should return empty without extension')

    file.extname = '.md'
    t.equal(file.extname, '.md', 'should set extensions')

    t.deepEqual(file.history, [fp, fp + '.md'], 'should record changes')

    t.throws(
      () => {
        file.extname = 'txt'
      },
      /Error: `extname` must start with `.`/,
      'should throw without initial `.`'
    )

    t.throws(
      () => {
        file.extname = '..md'
      },
      /Error: `extname` cannot contain multiple dots/,
      'should throw with mutiple `.`s'
    )

    file.extname = undefined
    t.equal(file.extname, '', 'should support removing `extname` (1)')
    t.equal(file.path, fp, 'should support removing `extname` (2)')

    t.end()
  })

  t.test('.stem', (t) => {
    const file = new VFile()

    t.equal(file.stem, undefined, 'should start `undefined`')

    file.stem = 'bravo'

    t.equal(file.stem, 'bravo', 'should set')

    file.stem = 'charlie'

    t.equal(file.stem, 'charlie', 'should change')

    t.throws(
      () => {
        file.stem = undefined
      },
      /Error: `stem` cannot be empty/,
      'should throw when removing `stem`'
    )

    t.throws(
      () => {
        file.stem = path.join('charlie', 'delta.js')
      },
      new RegExp(
        'Error: `stem` cannot be a path: did not expect `\\' + path.sep + '`'
      ),
      'should throw when setting a path'
    )

    t.end()
  })

  t.test('#message(reason[, position][, origin])', (t) => {
    const fp = path.join('~', 'example.md')

    t.ok(new VFile().message('') instanceof Error, 'should return an Error')

    const file = new VFile({path: fp})
    let message = file.message('Foo')

    t.equal(file.messages.length, 1)
    t.equal(file.messages[0], message)

    t.equal(message.name, fp + ':1:1')
    t.equal(message.file, fp)
    t.equal(message.reason, 'Foo')
    t.equal(message.ruleId, null)
    t.equal(message.source, null)
    t.equal(message.stack, '')
    t.equal(message.fatal, false)
    t.equal(message.line, null)
    t.equal(message.column, null)
    t.deepEqual(message.position, {
      start: {line: null, column: null},
      end: {line: null, column: null}
    })

    t.equal(
      String(message),
      fp + ':1:1: Foo',
      'should have a pretty `toString()` message'
    )

    message = new VFile().message(exception)

    t.equal(
      message.message,
      'variable is not defined',
      'should accept an error (1)'
    )

    t.equal(
      String(message.stack || '').split('\n')[0],
      'ReferenceError: variable is not defined',
      'should accept an error (2)'
    )

    message = new VFile().message(changedMessage)

    t.equal(message.message, 'foo', 'should accept a changed error (1)')

    t.equal(
      String(message.stack || '').split('\n')[0],
      'ReferenceError: foo',
      'should accept a changed error (2)'
    )

    message = new VFile().message(multilineException)

    t.equal(
      message.message,
      'foo\nbar\nbaz',
      'should accept a multiline error (1)'
    )

    t.equal(
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

    t.deepEqual(
      message.position,
      literalNode.position,
      'should accept a node (1)'
    )
    t.equal(String(message), '2:3-2:5: test', 'should accept a node (2)')

    t.equal(
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

    t.deepEqual(message.position, position, 'should accept a position (1)')
    t.equal(String(message), '2:3-2:5: test', 'should accept a position (2)')

    const point = position.start
    message = new VFile().message('test', point)

    t.deepEqual(
      message.position,
      {start: point, end: {line: null, column: null}},
      'should accept a position (1)'
    )

    t.equal(String(message), '2:3: test', 'should accept a position')

    t.equal(
      // @ts-ignore runtime allow omitting `place`.
      new VFile().message('test', 'charlie').ruleId,
      'charlie',
      'should accept a `ruleId` as `origin`'
    )

    // @ts-ignore runtime allow omitting `place`.
    message = new VFile().message('test', 'delta:echo')

    t.deepEqual(
      [message.source, message.ruleId],
      ['delta', 'echo'],
      'should accept a `source` and `ruleId` in `origin`'
    )

    t.end()
  })

  t.test('#fail(reason[, position][, origin])', (t) => {
    const fp = path.join('~', 'example.md')
    const file = new VFile({path: fp})

    t.throws(
      () => {
        file.fail('Foo', {line: 1, column: 3}, 'baz:qux')
      },
      /1:3: Foo/,
      'should throw the message'
    )

    t.equal(file.messages.length, 1)

    const message = file.messages[0]

    t.equal(message.name, fp + ':1:3')
    t.equal(message.file, fp)
    t.equal(message.reason, 'Foo')
    t.equal(message.source, 'baz')
    t.equal(message.ruleId, 'qux')
    t.equal(message.stack, '')
    t.equal(message.fatal, true)
    t.equal(message.line, 1)
    t.equal(message.column, 3)
    t.deepEqual(message.position, {
      start: {line: 1, column: 3},
      end: {line: null, column: null}
    })

    t.end()
  })

  t.test('#info(reason[, position][, origin])', (t) => {
    const fp = path.join('~', 'example.md')
    const file = new VFile({path: fp})

    const message = file.info('Bar', {line: 1, column: 3}, 'baz:qux')

    t.equal(file.messages.length, 1)

    t.equal(message.name, fp + ':1:3')
    t.equal(message.file, fp)
    t.equal(message.reason, 'Bar')
    t.equal(message.source, 'baz')
    t.equal(message.ruleId, 'qux')
    t.equal(message.fatal, null)
    t.equal(message.line, 1)
    t.equal(message.column, 3)
    t.deepEqual(message.position, {
      start: {line: 1, column: 3},
      end: {line: null, column: null}
    })

    t.end()
  })

  t.end()
})

// Mostly from `path-browserify` with some extra tests to reach coverage, and
// some cleaning.
// <https://github.com/browserify/path-browserify/tree/master/test>
test('p (POSIX path for browsers)', (t) => {
  const typeErrorTests = [true, false, 7, null, {}, undefined, [], Number.NaN]

  t.test('basename', (t) => {
    let index = -1
    while (++index < typeErrorTests.length) {
      const test = typeErrorTests[index]

      t.throws(
        () => {
          // @ts-ignore runtime.
          p.basename(test)
        },
        TypeError,
        'should fail on `' + test + '`'
      )

      // `undefined` is a valid value as the second argument to basename.
      if (test !== undefined) {
        t.throws(
          () => {
            // @ts-ignore runtime.
            p.basename('x', test)
          },
          TypeError,
          'should fail on `' + test + '` as `ext`'
        )
      }
    }

    t.strictEqual(p.basename('.js', '.js'), '')
    t.strictEqual(p.basename(''), '')
    t.strictEqual(p.basename('/dir/basename.ext'), 'basename.ext')
    t.strictEqual(p.basename('/basename.ext'), 'basename.ext')
    t.strictEqual(p.basename('basename.ext'), 'basename.ext')
    t.strictEqual(p.basename('basename.ext/'), 'basename.ext')
    t.strictEqual(p.basename('basename.ext//'), 'basename.ext')
    t.strictEqual(p.basename('aaa/bbb', '/bbb'), 'bbb')
    t.strictEqual(p.basename('aaa/bbb', 'a/bbb'), 'bbb')
    t.strictEqual(p.basename('aaa/bbb', 'bbb'), 'bbb')
    t.strictEqual(p.basename('aaa/bbb//', 'bbb'), 'bbb')
    t.strictEqual(p.basename('aaa/bbb', 'bb'), 'b')
    t.strictEqual(p.basename('aaa/bbb', 'b'), 'bb')
    t.strictEqual(p.basename('/aaa/bbb', '/bbb'), 'bbb')
    t.strictEqual(p.basename('/aaa/bbb', 'a/bbb'), 'bbb')
    t.strictEqual(p.basename('/aaa/bbb', 'bbb'), 'bbb')
    t.strictEqual(p.basename('/aaa/bbb//', 'bbb'), 'bbb')
    t.strictEqual(p.basename('/aaa/bbb', 'bb'), 'b')
    t.strictEqual(p.basename('/aaa/bbb', 'b'), 'bb')
    t.strictEqual(p.basename('/aaa/bbb'), 'bbb')
    t.strictEqual(p.basename('/aaa/'), 'aaa')
    t.strictEqual(p.basename('/aaa/b'), 'b')
    t.strictEqual(p.basename('/a/b'), 'b')
    t.strictEqual(p.basename('//a'), 'a')

    // Backslashes are normal characters.
    t.strictEqual(p.basename('\\dir\\basename.ext'), '\\dir\\basename.ext')
    t.strictEqual(p.basename('\\basename.ext'), '\\basename.ext')
    t.strictEqual(p.basename('basename.ext'), 'basename.ext')
    t.strictEqual(p.basename('basename.ext\\'), 'basename.ext\\')
    t.strictEqual(p.basename('basename.ext\\\\'), 'basename.ext\\\\')
    t.strictEqual(p.basename('foo'), 'foo')

    t.strictEqual(
      p.basename('/a/b/Icon\r'),
      'Icon\r',
      'should support control characters in filenames'
    )

    // Extra tests for `vfile` to reach coverage.
    t.strictEqual(p.basename('a.b', 'a'), 'a.b')

    t.end()
  })

  t.test('dirname', (t) => {
    let index = -1

    while (++index < typeErrorTests.length) {
      const test = typeErrorTests[index]
      t.throws(
        () => {
          // @ts-ignore runtime.
          p.dirname(test)
        },
        TypeError,
        'should fail on `' + test + '`'
      )
    }

    t.strictEqual(p.dirname('/a/b/'), '/a')
    t.strictEqual(p.dirname('/a/b'), '/a')
    t.strictEqual(p.dirname('/a'), '/')
    t.strictEqual(p.dirname(''), '.')
    t.strictEqual(p.dirname('/'), '/')
    t.strictEqual(p.dirname('////'), '/')
    t.strictEqual(p.dirname('//a'), '//')
    t.strictEqual(p.dirname('foo'), '.')
    t.end()
  })

  t.test('extname', (t) => {
    let index = -1

    while (++index < typeErrorTests.length) {
      const test = typeErrorTests[index]
      t.throws(
        () => {
          // @ts-ignore runtime.
          p.extname(test)
        },
        TypeError,
        'should fail on `' + test + '`'
      )
    }

    const pairs = [
      // @ts-ignore
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
      t.strictEqual(pair[1], p.extname(pair[0]))
    }

    // On *nix, backslash is a valid name component like any other character.
    t.strictEqual(p.extname('.\\'), '')
    t.strictEqual(p.extname('..\\'), '.\\')
    t.strictEqual(p.extname('file.ext\\'), '.ext\\')
    t.strictEqual(p.extname('file.ext\\\\'), '.ext\\\\')
    t.strictEqual(p.extname('file\\'), '')
    t.strictEqual(p.extname('file\\\\'), '')
    t.strictEqual(p.extname('file.\\'), '.\\')
    t.strictEqual(p.extname('file.\\\\'), '.\\\\')

    t.end()
  })

  t.test('join', (t) => {
    let index = -1

    while (++index < typeErrorTests.length) {
      const test = typeErrorTests[index]
      t.throws(
        () => {
          // @ts-ignore runtime.
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
      // @ts-ignore
      t.strictEqual(p.join.apply(null, pair[0]), pair[1])
    }

    // Join will internally ignore all the zero-length strings and it will return
    // '.' if the joined string is a zero-length string.
    t.strictEqual(p.join(''), '.')
    t.strictEqual(p.join('', ''), '.')

    // Extra tests for `vfile` to reach coverage.
    t.strictEqual(p.join('a', '..'), '.')

    t.end()
  })

  t.end()
})

function cleanStack(stack:string | undefined, max:number):string {
  return String(stack || '')
    .replace(new RegExp('\\(.+\\' + path.sep, 'g'), '(')
    .replace(/\d+:\d+/g, '1:1')
    .split('\n')
    .slice(0, max)
    .join('\n')
}
