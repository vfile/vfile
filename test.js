'use strict'

var path = require('path')
var test = require('tape')
var vfile = require('.')

var sep = path.sep
var join = path.join

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

test('vfile([options])', function(t) {
  t.ok(vfile() instanceof vfile, 'should work with new')

  t.ok(vfile() instanceof vfile, 'should work without `new`')

  t.test('should accept missing options', function(st) {
    var file = vfile()

    st.deepEqual(file.history, [])
    st.deepEqual(file.data, {})
    st.deepEqual(file.messages, [])
    st.equal(file.contents, undefined)
    st.equal(file.path, undefined)
    st.equal(file.dirname, undefined)
    st.equal(file.basename, undefined)
    st.equal(file.stem, undefined)
    st.equal(file.extname, undefined)

    st.end()
  })

  t.test('should accept a string', function(st) {
    var file = vfile('alpha')

    st.equal(file.contents, 'alpha')

    st.end()
  })

  t.test('should accept a vfile', function(st) {
    var left = vfile()
    var right = vfile(left)

    st.equal(left, right)

    st.end()
  })

  t.test('should accept an object (1)', function(st) {
    var fp = join('~', 'example.md')
    var file = vfile({path: fp})

    st.deepEqual(file.history, [fp])
    st.equal(file.contents, undefined)
    st.equal(file.path, fp)
    st.equal(file.dirname, '~')
    st.equal(file.basename, 'example.md')
    st.equal(file.stem, 'example')
    st.equal(file.extname, '.md')

    st.end()
  })

  t.test('should accept a object (2)', function(st) {
    var file = vfile({basename: 'example.md'})

    st.deepEqual(file.history, ['example.md'])
    st.equal(file.contents, undefined)
    st.equal(file.path, 'example.md')
    st.equal(file.dirname, '.')
    st.equal(file.basename, 'example.md')
    st.equal(file.stem, 'example')
    st.equal(file.extname, '.md')

    st.end()
  })

  t.test('should accept a object (2)', function(st) {
    var file = vfile({stem: 'example', extname: '.md', dirname: '~'})

    st.deepEqual(file.history, [
      'example',
      'example.md',
      join('~', 'example.md')
    ])
    st.equal(file.contents, undefined)
    st.equal(file.path, join('~', 'example.md'))
    st.equal(file.dirname, '~')
    st.equal(file.basename, 'example.md')
    st.equal(file.stem, 'example')
    st.equal(file.extname, '.md')

    st.end()
  })

  t.test('should set custom props', function(st) {
    var testing = [1, 2, 3]
    var file = vfile({custom: true, testing: testing})

    st.equal(file.custom, true)
    st.equal(file.testing, testing)

    st.end()
  })

  t.test('#toString()', function(st) {
    st.equal(vfile().toString(), '', 'should return `""` without content')

    st.equal(
      vfile('foo').toString(),
      'foo',
      'string: should return the internal value'
    )

    st.equal(
      vfile(Buffer.from('bar')).toString(),
      'bar',
      'buffer: should return the internal value'
    )

    st.equal(
      vfile(Buffer.from('bar')).toString('hex'),
      '626172',
      'buffer encoding: should return the internal value'
    )

    st.end()
  })

  t.test('.cwd', function(st) {
    st.equal(vfile().cwd, process.cwd(), 'should start at `process.cwd()`')

    st.equal(vfile({cwd: '/'}).cwd, '/', 'should be settable')

    st.end()
  })

  t.test('.path', function(st) {
    var fp = join('~', 'example.md')
    var ofp = join('~', 'example', 'example.txt')
    var file = vfile()

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
      function() {
        file.path = null
      },
      /Error: `path` cannot be empty/,
      'should not remove `path`'
    )

    st.end()
  })

  t.test('.basename', function(st) {
    var file = vfile()

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

    file = vfile({path: join('~', 'alpha', 'bravo.md')})

    st.throws(
      function() {
        file.basename = null
      },
      /Error: `basename` cannot be empty/,
      'should throw when removing `basename`'
    )

    st.throws(
      function() {
        file.basename = join('charlie', 'delta.js')
      },
      new RegExp(
        'Error: `basename` cannot be a path: did not expect `\\' + sep + '`'
      ),
      'should throw when setting a path'
    )

    st.end()
  })

  t.test('.dirname', function(st) {
    var fp = join('~', 'alpha', 'bravo')
    var file = vfile()

    st.equal(file.dirname, undefined, 'should start undefined')

    st.throws(
      function() {
        file.dirname = fp
      },
      /Error: Setting `dirname` requires `path` to be set too/,
      'should throw when setting without path'
    )

    file.path = fp
    file.dirname = join('~', 'charlie')

    st.equal(file.dirname, join('~', 'charlie'), 'should change paths')

    st.deepEqual(
      file.history,
      [fp, join('~', 'charlie', 'bravo')],
      'should record changes'
    )

    file.dirname = null
    st.equal(file.dirname, '.', 'should support removing `dirname` (1)')
    st.equal(file.path, 'bravo', 'should support removing `dirname` (2)')

    st.end()
  })

  t.test('.extname', function(st) {
    var fp = join('~', 'alpha', 'bravo')
    var file = vfile()

    st.equal(file.extname, undefined, 'should start `undefined`')

    st.throws(
      function() {
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
      function() {
        file.extname = 'txt'
      },
      /Error: `extname` must start with `.`/,
      'should throw without initial `.`'
    )

    st.throws(
      function() {
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

  t.test('.stem', function(st) {
    var file = vfile()

    st.equal(file.stem, undefined, 'should start `undefined`')

    file.stem = 'bravo'

    st.equal(file.stem, 'bravo', 'should set')

    file.stem = 'charlie'

    st.equal(file.stem, 'charlie', 'should change')

    st.throws(
      function() {
        file.stem = null
      },
      /Error: `stem` cannot be empty/,
      'should throw when removing `stem`'
    )

    st.throws(
      function() {
        file.stem = join('charlie', 'delta.js')
      },
      new RegExp(
        'Error: `stem` cannot be a path: did not expect `\\' + sep + '`'
      ),
      'should throw when setting a path'
    )

    st.end()
  })

  t.test('#message(reason[, position][, origin])', function(st) {
    var fp = join('~', 'example.md')
    var file
    var message
    var pos

    st.ok(vfile().message('') instanceof Error, 'should return an Error')

    file = vfile({path: fp})
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
    st.deepEqual(message.location, {
      start: {line: null, column: null},
      end: {line: null, column: null}
    })

    st.equal(
      String(message),
      fp + ':1:1: Foo',
      'should have a pretty `toString()` message'
    )

    message = vfile().message(exception)

    st.equal(
      message.message,
      'variable is not defined',
      'should accept an error (1)'
    )

    st.equal(
      message.stack
        .split('\n')
        .slice(0, 2)
        .join('\n'),
      [
        'ReferenceError: variable is not defined',
        '    at Object.<anonymous> (test.js:1:1)'
      ].join('\n'),
      'should accept an error (2)'
    )

    message = vfile().message(changedMessage)

    st.equal(message.message, 'foo', 'should accept a changed error (1)')

    st.equal(
      message.stack
        .split('\n')
        .slice(0, 2)
        .join('\n'),
      ['ReferenceError: foo', '    at Object.<anonymous> (test.js:1:1)'].join(
        '\n'
      ),
      'should accept a changed error (2)'
    )

    message = vfile().message(multilineException)

    st.equal(
      message.message,
      'foo\nbar\nbaz',
      'should accept a multiline error (1)'
    )

    st.equal(
      message.stack
        .split('\n')
        .slice(0, 4)
        .join('\n'),
      [
        'ReferenceError: foo',
        'bar',
        'baz',
        '    at Object.<anonymous> (test.js:1:1)'
      ].join('\n'),
      'should accept a multiline error (2)'
    )

    pos = {
      position: {
        start: {line: 2, column: 3},
        end: {line: 2, column: 5}
      }
    }

    message = vfile().message('test', pos)

    st.deepEqual(message.location, pos.position, 'should accept a node (1)')
    st.equal(String(message), '2:3-2:5: test', 'should accept a node (2)')

    pos = pos.position
    message = vfile().message('test', pos)

    st.deepEqual(message.location, pos, 'should accept a location (1)')
    st.equal(String(message), '2:3-2:5: test', 'should accept a location (2)')

    pos = pos.start
    message = vfile().message('test', pos)

    st.deepEqual(
      message.location,
      {
        start: pos,
        end: {line: null, column: null}
      },
      'should accept a position (1)'
    )

    st.equal(String(message), '2:3: test', 'should accept a position')

    st.equal(
      vfile().message('test', 'charlie').ruleId,
      'charlie',
      'should accept a `ruleId` as `origin`'
    )

    message = vfile().message('test', 'delta:echo')

    st.deepEqual(
      [message.source, message.ruleId],
      ['delta', 'echo'],
      'should accept a `source` and `ruleId` in `origin`'
    )

    st.end()
  })

  t.test('#fail(reason[, position][, origin])', function(st) {
    var fp = join('~', 'example.md')
    var file = vfile({path: fp})
    var message

    st.throws(
      function() {
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
    st.deepEqual(message.location, {
      start: {line: 1, column: 3},
      end: {line: null, column: null}
    })

    st.end()
  })

  t.test('#info(reason[, position][, origin])', function(st) {
    var fp = join('~', 'example.md')
    var file = vfile({path: fp})
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
    st.deepEqual(message.location, {
      start: {line: 1, column: 3},
      end: {line: null, column: null}
    })

    st.end()
  })

  t.end()
})

function cleanStack(stack, max) {
  return stack
    .replace(new RegExp('\\(.+\\' + sep, 'g'), '(')
    .replace(/\d+:\d+/g, '1:1')
    .split('\n')
    .slice(0, max)
    .join('\n')
}
