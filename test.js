import path from 'path'
import test from 'tape'
import {path as p} from './lib/minpath.browser.js'
import {VFile} from './index.js'

/* eslint-disable no-undef */
var exception
var changedMessage
var multilineException

try {
  variable = 1
} catch (error) {
  error.stack = cleanStack(error.stack, 3)
  exception = error
}

try {
  variable = 1
} catch (error) {
  error.message = 'foo'
  error.stack = cleanStack(error.stack, 3)
  changedMessage = error
}

try {
  variable = 1
} catch (error) {
  error.message = 'foo\nbar\nbaz'
  error.stack = cleanStack(error.stack, 5)
  multilineException = error
}
/* eslint-enable no-undef */

test('new VFile(options?)', function (t) {
  t.ok(new VFile() instanceof VFile, 'should work with new')

  t.test('should accept missing options', function (st) {
    var file = new VFile()

    st.deepEqual(file.history, [])
    st.deepEqual(file.data, {})
    st.deepEqual(file.messages, [])
    st.equal(file.value, undefined)
    st.equal(file.path, undefined)
    st.equal(file.dirname, undefined)
    st.equal(file.basename, undefined)
    st.equal(file.stem, undefined)
    st.equal(file.extname, undefined)

    st.end()
  })

  t.test('should accept a string', function (st) {
    var file = new VFile('alpha')

    st.equal(file.value, 'alpha')

    st.end()
  })

  t.test('should accept a vfile', function (st) {
    var left = new VFile()
    var right = new VFile(left)

    st.deepEqual(left, right)
    st.equal(left.path, right.path)

    st.end()
  })

  t.test('should accept a vfile w/ path', function (st) {
    var left = new VFile({path: path.join('path', 'to', 'file.js')})
    var right = new VFile(left)

    st.deepEqual(left, right)
    st.equal(left.path, right.path)

    st.end()
  })

  t.test('should accept an object (1)', function (st) {
    var fp = path.join('~', 'example.md')
    var file = new VFile({path: fp})

    st.deepEqual(file.history, [fp])
    st.equal(file.value, undefined)
    st.equal(file.path, fp)
    st.equal(file.dirname, '~')
    st.equal(file.basename, 'example.md')
    st.equal(file.stem, 'example')
    st.equal(file.extname, '.md')

    st.end()
  })

  t.test('should accept a object (2)', function (st) {
    var file = new VFile({basename: 'example.md'})

    st.deepEqual(file.history, ['example.md'])
    st.equal(file.value, undefined)
    st.equal(file.path, 'example.md')
    st.equal(file.dirname, '.')
    st.equal(file.basename, 'example.md')
    st.equal(file.stem, 'example')
    st.equal(file.extname, '.md')

    st.end()
  })

  t.test('should accept a object (2)', function (st) {
    var file = new VFile({stem: 'example', extname: '.md', dirname: '~'})

    st.deepEqual(file.history, [
      'example',
      'example.md',
      path.join('~', 'example.md')
    ])
    st.equal(file.value, undefined)
    st.equal(file.path, path.join('~', 'example.md'))
    st.equal(file.dirname, '~')
    st.equal(file.basename, 'example.md')
    st.equal(file.stem, 'example')
    st.equal(file.extname, '.md')

    st.end()
  })

  t.test('should set custom props', function (st) {
    var testing = [1, 2, 3]
    var file = new VFile({custom: true, testing})

    st.equal(file.custom, true)
    st.equal(file.testing, testing)

    st.end()
  })

  t.test('#toString()', function (st) {
    st.equal(new VFile().toString(), '', 'should return `""` without content')

    st.equal(
      new VFile('foo').toString(),
      'foo',
      'string: should return the internal value'
    )

    st.equal(
      new VFile(Buffer.from('bar')).toString(),
      'bar',
      'buffer: should return the internal value'
    )

    st.equal(
      new VFile(Buffer.from('bar')).toString('hex'),
      '626172',
      'buffer encoding: should return the internal value'
    )

    st.end()
  })

  t.test('.cwd', function (st) {
    st.equal(new VFile().cwd, process.cwd(), 'should start at `process.cwd()`')

    st.equal(new VFile({cwd: '/'}).cwd, '/', 'should be settable')

    st.end()
  })

  t.test('.path', function (st) {
    var fp = path.join('~', 'example.md')
    var ofp = path.join('~', 'example', 'example.txt')
    var file = new VFile()

    st.equal(file.path, undefined, 'should start `undefined`')

    file.path = fp

    st.equal(file.path, fp, 'should set `path`s')

    file.path = ofp

    st.equal(file.path, ofp, 'should change `path`s')

    st.deepEqual(file.history, [fp, ofp], 'should record changes')

    file.path = ofp

    st.deepEqual(
      file.history,
      [fp, ofp],
      'should not record setting the same path'
    )

    st.throws(
      function () {
        file.path = null
      },
      /Error: `path` cannot be empty/,
      'should not remove `path`'
    )

    st.end()
  })

  t.test('.basename', function (st) {
    var file = new VFile()

    st.equal(file.basename, undefined, 'should start `undefined`')

    file.basename = 'example.md'

    st.equal(file.basename, 'example.md', 'should set `basename`')

    file.basename = 'readme.txt'

    st.equal(file.basename, 'readme.txt', 'should change `basename`')

    st.deepEqual(
      file.history,
      ['example.md', 'readme.txt'],
      'should record changes'
    )

    file = new VFile({path: path.join('~', 'alpha', 'bravo.md')})

    st.throws(
      function () {
        file.basename = null
      },
      /Error: `basename` cannot be empty/,
      'should throw when removing `basename`'
    )

    st.throws(
      function () {
        file.basename = path.join('charlie', 'delta.js')
      },
      new RegExp(
        'Error: `basename` cannot be a path: did not expect `\\' +
          path.sep +
          '`'
      ),
      'should throw when setting a path'
    )

    st.end()
  })

  t.test('.dirname', function (st) {
    var fp = path.join('~', 'alpha', 'bravo')
    var file = new VFile()

    st.equal(file.dirname, undefined, 'should start undefined')

    st.throws(
      function () {
        file.dirname = fp
      },
      /Error: Setting `dirname` requires `path` to be set too/,
      'should throw when setting without path'
    )

    file.path = fp
    file.dirname = path.join('~', 'charlie')

    st.equal(file.dirname, path.join('~', 'charlie'), 'should change paths')

    st.deepEqual(
      file.history,
      [fp, path.join('~', 'charlie', 'bravo')],
      'should record changes'
    )

    file.dirname = null
    st.equal(file.dirname, '.', 'should support removing `dirname` (1)')
    st.equal(file.path, 'bravo', 'should support removing `dirname` (2)')

    st.end()
  })

  t.test('.extname', function (st) {
    var fp = path.join('~', 'alpha', 'bravo')
    var file = new VFile()

    st.equal(file.extname, undefined, 'should start `undefined`')

    st.throws(
      function () {
        file.extname = '.git'
      },
      /Error: Setting `extname` requires `path` to be set too/,
      'should throw when setting without `path`'
    )

    file.path = fp
    st.equal(file.extname, '', 'should return empty without extension')

    file.extname = '.md'
    st.equal(file.extname, '.md', 'should set extensions')

    st.deepEqual(file.history, [fp, fp + '.md'], 'should record changes')

    st.throws(
      function () {
        file.extname = 'txt'
      },
      /Error: `extname` must start with `.`/,
      'should throw without initial `.`'
    )

    st.throws(
      function () {
        file.extname = '..md'
      },
      /Error: `extname` cannot contain multiple dots/,
      'should throw with mutiple `.`s'
    )

    file.extname = null
    st.equal(file.extname, '', 'should support removing `extname` (1)')
    st.equal(file.path, fp, 'should support removing `extname` (2)')

    st.end()
  })

  t.test('.stem', function (st) {
    var file = new VFile()

    st.equal(file.stem, undefined, 'should start `undefined`')

    file.stem = 'bravo'

    st.equal(file.stem, 'bravo', 'should set')

    file.stem = 'charlie'

    st.equal(file.stem, 'charlie', 'should change')

    st.throws(
      function () {
        file.stem = null
      },
      /Error: `stem` cannot be empty/,
      'should throw when removing `stem`'
    )

    st.throws(
      function () {
        file.stem = path.join('charlie', 'delta.js')
      },
      new RegExp(
        'Error: `stem` cannot be a path: did not expect `\\' + path.sep + '`'
      ),
      'should throw when setting a path'
    )

    st.end()
  })

  t.test('#message(reason[, position][, origin])', function (st) {
    var fp = path.join('~', 'example.md')
    var file
    var message
    var pos

    st.ok(new VFile().message('') instanceof Error, 'should return an Error')

    file = new VFile({path: fp})
    message = file.message('Foo')

    st.equal(file.messages.length, 1)
    st.equal(file.messages[0], message)

    st.equal(message.name, fp + ':1:1')
    st.equal(message.file, fp)
    st.equal(message.reason, 'Foo')
    st.equal(message.ruleId, null)
    st.equal(message.source, null)
    st.equal(message.stack, '')
    st.equal(message.fatal, false)
    st.equal(message.line, null)
    st.equal(message.column, null)
    st.deepEqual(message.position, {
      start: {line: null, column: null},
      end: {line: null, column: null}
    })

    st.equal(
      String(message),
      fp + ':1:1: Foo',
      'should have a pretty `toString()` message'
    )

    message = new VFile().message(exception)

    st.equal(
      message.message,
      'variable is not defined',
      'should accept an error (1)'
    )

    st.equal(
      message.stack.split('\n')[0],
      'ReferenceError: variable is not defined',
      'should accept an error (2)'
    )

    message = new VFile().message(changedMessage)

    st.equal(message.message, 'foo', 'should accept a changed error (1)')

    st.equal(
      message.stack.split('\n')[0],
      'ReferenceError: foo',
      'should accept a changed error (2)'
    )

    message = new VFile().message(multilineException)

    st.equal(
      message.message,
      'foo\nbar\nbaz',
      'should accept a multiline error (1)'
    )

    st.equal(
      message.stack.split('\n').slice(0, 3).join('\n'),
      'ReferenceError: foo\nbar\nbaz',
      'should accept a multiline error (2)'
    )

    pos = {
      position: {
        start: {line: 2, column: 3},
        end: {line: 2, column: 5}
      }
    }

    message = new VFile().message('test', pos)

    st.deepEqual(message.position, pos.position, 'should accept a node (1)')
    st.equal(String(message), '2:3-2:5: test', 'should accept a node (2)')

    pos = pos.position
    message = new VFile().message('test', pos)

    st.deepEqual(message.position, pos, 'should accept a position (1)')
    st.equal(String(message), '2:3-2:5: test', 'should accept a position (2)')

    pos = pos.start
    message = new VFile().message('test', pos)

    st.deepEqual(
      message.position,
      {
        start: pos,
        end: {line: null, column: null}
      },
      'should accept a position (1)'
    )

    st.equal(String(message), '2:3: test', 'should accept a position')

    st.equal(
      new VFile().message('test', 'charlie').ruleId,
      'charlie',
      'should accept a `ruleId` as `origin`'
    )

    message = new VFile().message('test', 'delta:echo')

    st.deepEqual(
      [message.source, message.ruleId],
      ['delta', 'echo'],
      'should accept a `source` and `ruleId` in `origin`'
    )

    st.end()
  })

  t.test('#fail(reason[, position][, origin])', function (st) {
    var fp = path.join('~', 'example.md')
    var file = new VFile({path: fp})
    var message

    st.throws(
      function () {
        file.fail('Foo', {line: 1, column: 3}, 'baz:qux')
      },
      /1:3: Foo/,
      'should throw the message'
    )

    st.equal(file.messages.length, 1)

    message = file.messages[0]

    st.equal(message.name, fp + ':1:3')
    st.equal(message.file, fp)
    st.equal(message.reason, 'Foo')
    st.equal(message.source, 'baz')
    st.equal(message.ruleId, 'qux')
    st.equal(message.stack, '')
    st.equal(message.fatal, true)
    st.equal(message.line, 1)
    st.equal(message.column, 3)
    st.deepEqual(message.position, {
      start: {line: 1, column: 3},
      end: {line: null, column: null}
    })

    st.end()
  })

  t.test('#info(reason[, position][, origin])', function (st) {
    var fp = path.join('~', 'example.md')
    var file = new VFile({path: fp})
    var message

    file.info('Bar', {line: 1, column: 3}, 'baz:qux')

    st.equal(file.messages.length, 1)

    message = file.messages[0]

    st.equal(message.name, fp + ':1:3')
    st.equal(message.file, fp)
    st.equal(message.reason, 'Bar')
    st.equal(message.source, 'baz')
    st.equal(message.ruleId, 'qux')
    st.equal(message.fatal, null)
    st.equal(message.line, 1)
    st.equal(message.column, 3)
    st.deepEqual(message.position, {
      start: {line: 1, column: 3},
      end: {line: null, column: null}
    })

    st.end()
  })

  t.end()
})

// Mostly from `path-browserify` with some extra tests to reach coverage, and
// some cleaning.
// <https://github.com/browserify/path-browserify/tree/master/test>
test('p (POSIX path for browsers)', function (t) {
  var typeErrorTests = [true, false, 7, null, {}, undefined, [], Number.NaN]

  t.test('basename', function (t) {
    typeErrorTests.forEach(function (test) {
      t.throws(
        function () {
          p.basename(test)
        },
        TypeError,
        'should fail on `' + test + '`'
      )

      // `undefined` is a valid value as the second argument to basename.
      if (test !== undefined) {
        t.throws(
          function () {
            p.basename('x', test)
          },
          TypeError,
          'should fail on `' + test + '` as `ext`'
        )
      }
    })

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

  t.test('dirname', function (t) {
    typeErrorTests.forEach(function (test) {
      t.throws(
        function () {
          p.dirname(test)
        },
        TypeError,
        'should fail on `' + test + '`'
      )
    })

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

  t.test('extname', function (t) {
    typeErrorTests.forEach(function (test) {
      t.throws(
        function () {
          p.extname(test)
        },
        TypeError,
        'should fail on `' + test + '`'
      )
    })
    ;[
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
    ].forEach(function (pair) {
      t.strictEqual(pair[1], p.extname(pair[0]))
    })

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

  t.test('join', function (t) {
    typeErrorTests.forEach(function (test) {
      t.throws(
        function () {
          p.join(test)
        },
        TypeError,
        'should fail on `' + test + '`'
      )
    })
    ;[
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
    ].forEach(function (pair) {
      t.strictEqual(p.join.apply(null, pair[0]), pair[1])
    })

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

function cleanStack(stack, max) {
  return stack
    .replace(new RegExp('\\(.+\\' + path.sep, 'g'), '(')
    .replace(/\d+:\d+/g, '1:1')
    .split('\n')
    .slice(0, max)
    .join('\n')
}
