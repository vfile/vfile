/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module vfile
 * @fileoverview Test suite for `vfile`.
 */

'use strict';

/* Dependencies. */
var test = require('tape');
var VFile = require('./');

/* Tests. */
test('VFile(options?)', function (t) {
  t.ok(new VFile() instanceof VFile, 'should create a new `VFile`');

  /* eslint-disable babel/new-cap */
  t.ok(VFile() instanceof VFile, 'should work without `new`');
  /* eslint-enable babel/new-cap */

  t.test('should accept missing options', function (st) {
    var vfile = new VFile();

    st.equal(vfile.filename, '');
    st.equal(vfile.extension, '');
    st.equal(vfile.contents, '');

    st.end();
  });

  t.test('should accept a `string`', function (st) {
    var vfile = new VFile('Test');

    st.equal(vfile.filename, '');
    st.equal(vfile.extension, '');
    st.equal(vfile.contents, 'Test');

    st.end();
  });

  t.test('should accept an `Object`', function (st) {
    var vfile = new VFile({
      filename: 'Untitled',
      extension: 'markdown',
      contents: 'Test'
    });

    st.equal(vfile.filename, 'Untitled');
    st.equal(vfile.extension, 'markdown');
    st.equal(vfile.contents, 'Test');

    st.end();
  });

  t.test('should accept a `VFile`', function (st) {
    var vfile = new VFile(new VFile({
      filename: 'Untitled',
      extension: 'markdown',
      contents: 'Test'
    }));

    st.equal(vfile.filename, 'Untitled');
    st.equal(vfile.extension, 'markdown');
    st.equal(vfile.contents, 'Test');

    st.end();
  });

  t.test('#toString()', function (st) {
    st.equal(
      new VFile().toString(),
      '',
      'should return `""` without content'
    );

    st.equal(
      new VFile('foo').toString(),
      'foo',
      'should return the internal value'
    );

    st.end();
  });

  t.test('#filePath()', function (st) {
    st.equal(
      new VFile().filePath(),
      '',
      'should return `""` without a filename'
    );

    st.equal(
      new VFile({
        filename: 'Untitled',
        extension: null
      }).filePath(),
      'Untitled',
      'should return the filename without extension'
    );

    st.equal(
      new VFile({
        filename: 'Untitled',
        extension: 'markdown'
      }).filePath(),
      'Untitled.markdown',
      'should return the filename with extension'
    );

    st.equal(
      new VFile({
        directory: 'foo/bar',
        filename: 'baz',
        extension: 'qux'
      }).filePath(),
      'foo/bar/baz.qux',
      'should return the full vfile path'
    );

    st.equal(
      new VFile({
        directory: '~/',
        filename: 'baz',
        extension: 'qux'
      }).filePath(),
      '~/baz.qux',
      'should not return an extra directory slash'
    );

    st.equal(
      new VFile({
        directory: '.',
        filename: 'baz',
        extension: 'qux'
      }).filePath(),
      'baz.qux',
      'should not return the current directory (#1)'
    );

    st.equal(
      new VFile({
        directory: './',
        filename: 'baz',
        extension: 'qux'
      }).filePath(),
      'baz.qux',
      'should not return the current directory (#2)'
    );

    st.equal(
      new VFile({
        directory: '..',
        filename: 'baz',
        extension: 'qux'
      }).filePath(),
      '../baz.qux',
      'should return the parent directory (#1)'
    );

    st.equal(
      new VFile({
        directory: '../',
        filename: 'baz',
        extension: 'qux'
      }).filePath(),
      '../baz.qux',
      'should return the parent directory (#2)'
    );

    st.end();
  });

  test('#basename()', function (st) {
    st.equal(
      new VFile().basename(),
      '',
      'should return `""` without a filename'
    );

    st.equal(
      new VFile({
        directory: '~',
        filename: 'Untitled',
        extension: null
      }).basename(),
      'Untitled',
      'should return the basename without extension'
    );

    st.equal(
      new VFile({
        directory: '~',
        filename: 'Untitled',
        extension: 'markdown'
      }).basename(),
      'Untitled.markdown',
      'should return the basename with extension'
    );

    st.equal(
      new VFile({
        directory: 'foo/bar',
        filename: 'baz',
        extension: 'qux'
      }).basename(),
      'baz.qux',
      'should return only the basename without path'
    );

    st.equal(
      new VFile({
        directory: 'foo/bar',
        filename: null,
        extension: 'remarkrc'
      }).basename(),
      '.remarkrc',
      'should return only the extension without a filename'
    );

    st.end();
  });

  test('#move()', function (st) {
    var vfile;

    vfile = new VFile({
      directory: '~',
      filename: 'example',
      extension: 'markdown'
    });

    vfile.move({
      extension: 'md'
    });

    st.equal(
      vfile.filePath(),
      '~/example.md',
      'should change an extension'
    );

    vfile = new VFile({
      directory: '~',
      filename: 'example',
      extension: 'markdown'
    });

    vfile.move({filename: 'foo'});

    st.equal(
      vfile.filePath(),
      '~/foo.markdown',
      'should change a filename'
    );

    vfile = new VFile({
      directory: '~',
      filename: 'example',
      extension: 'markdown'
    });

    vfile.move({directory: '/var/www'});

    st.equal(
      vfile.filePath(),
      '/var/www/example.markdown',
      'should change a directory'
    );

    vfile = new VFile();

    vfile.extension = null;

    vfile.move();

    st.equal(
      vfile.filePath(),
      '',
      'should ignore not-given values'
    );

    vfile = new VFile();

    vfile.move({filename: 'example'});

    st.equal(
      vfile.filePath(),
      'example',
      'should add a filename'
    );

    vfile = new VFile();

    vfile.move({
      directory: '~',
      filename: 'example'
    });

    st.equal(
      vfile.filePath(),
      '~/example',
      'should add a directory'
    );

    vfile = new VFile({
      filename: 'README',
      extension: ''
    });

    vfile.move({extension: 'md'});

    st.equal(
      vfile.filePath(),
      'README.md',
      'should add an extension'
    );

    st.end();
  });

  t.test('#hasFailed()', function (st) {
    var vfile;

    vfile = new VFile();

    t.equal(vfile.hasFailed(), false);

    vfile.warn('Foo');

    st.equal(
      vfile.hasFailed(),
      false,
      'should return `false` when without messages'
    );

    vfile = new VFile();

    vfile.quiet = true;

    vfile.fail('Foo');

    st.equal(
      vfile.hasFailed(),
      true,
      'should return `true` when with fatal messages'
    );

    st.end();
  });

  t.test('#message(reason, position?, ruleId?)', function (st) {
    var err;
    var exception;

    st.ok(
      new VFile().message('') instanceof Error,
      'should return an Error'
    );

    err = new VFile({filename: 'untitled'}).message('test');

    st.equal(err.file, 'untitled');
    st.equal(err.reason, 'test');
    st.equal(err.line, null);
    st.equal(err.column, null);
    st.deepEqual(err.location, {
      start: {line: null, column: null},
      end: {line: null, column: null}
    });

    err = new VFile().message('test');

    st.equal(err.file, '');
    st.equal(err.reason, 'test');
    st.equal(err.line, null);
    st.equal(err.column, null);
    st.deepEqual(err.location, {
      start: {line: null, column: null},
      end: {line: null, column: null}
    });

    st.equal(
      new VFile().message('test').message,
      'test',
      'should create a pretty message'
    );

    st.equal(
      new VFile().message('test').toString(),
      '1:1: test',
      'should have a pretty `toString()` message'
    );

    st.equal(
      new VFile({filename: 'untitled'}).message('test').toString(),
      'untitled:1:1: test',
      'should include the filename in `toString()`'
    );

    err = new Error('foo');
    exception = new VFile().message(err);

    st.equal(
      exception.stack,
      err.stack,
      'should accept an error (#1)'
    );

    st.equal(
      exception.message,
      err.message,
      'should accept an error (#2)'
    );

    err = new VFile().message('test', {
      position: {
        start: {line: 2, column: 1},
        end: {line: 2, column: 5}
      }
    });

    st.deepEqual(
      err.location, {
        start: {line: 2, column: 1},
        end: {line: 2, column: 5}
      },
      'should accept a node (#1)'
    );

    st.equal(
      err.toString(),
      '2:1-2:5: test',
      'should accept a node (#2)'
    );

    err = new VFile().message('test', {
      start: {line: 2, column: 1},
      end: {line: 2, column: 5}
    });

    st.deepEqual(
      err.location, {
        start: {line: 2, column: 1},
        end: {line: 2, column: 5}
      },
      'should accept a location (#1)'
    );

    st.equal(
      err.toString(),
      '2:1-2:5: test',
      'should accept a location (#2)'
    );

    err = new VFile().message('test', {line: 2, column: 5});

    st.deepEqual(
      err.location,
      {
        start: {line: 2, column: 5},
        end: {line: null, column: null}
      },
      'should accept a position (#1)'
    );

    st.equal(
      err.toString(),
      '2:5: test',
      'should accept a position'
    );

    st.equal(
      new VFile().message('test', {line: 2, column: 5}, 'charlie').ruleId,
      'charlie',
      'should accept a `ruleId`'
    );

    st.end();
  });

  t.test('#fail(reason, position?)', function (st) {
    st.test('should add a fatal error to `messages`', function (sst) {
      var vfile = new VFile();
      var message;

      sst.throws(function () {
        vfile.fail('Foo', {line: 1, column: 3});
      }, /1:3: Foo/);

      sst.equal(vfile.messages.length, 1);

      message = vfile.messages[0];

      sst.equal(message.file, '');
      sst.equal(message.reason, 'Foo');
      sst.equal(message.line, 1);
      sst.equal(message.column, 3);
      sst.equal(message.name, '1:3');
      sst.equal(message.fatal, true);

      sst.end();
    });

    st.doesNotThrow(
      function () {
        var vfile = new VFile();

        vfile.quiet = true;

        vfile.fail('Foo', {line: 1, column: 3});
      },
      'should not throw when `quiet: true`'
    );

    st.end();
  });

  t.test('#warn(reason, position?)', function (st) {
    var vfile = new VFile();
    var message;

    vfile.warn('Bar', {line: 9, column: 2});

    st.equal(
      vfile.messages.length,
      1,
      'should add a non-fatal error to `messages`'
    );

    message = vfile.messages[0];

    st.equal(message.file, '');
    st.equal(message.reason, 'Bar');
    st.equal(message.line, 9);
    st.equal(message.column, 2);
    st.equal(message.name, '9:2');
    st.equal(message.fatal, false);

    st.end();
  });

  t.test('#namespace(key)', function (st) {
    var vfile = new VFile();

    st.equal(
      vfile.namespace('foo'),
      vfile.namespace('foo'),
      'should create a unique space'
    );

    st.notEqual(vfile.namespace('foo'), vfile.namespace('bar'));

    st.end();
  });

  t.test('#history', function (st) {
    st.deepEqual(
      new VFile().history,
      [],
      'should be set on creation (#1)'
    );

    st.deepEqual(
      new VFile({
        filename: 'example',
        extension: 'js',
        directory: '.'
      }).history,
      ['example.js'],
      'should be set on creation (#2)'
    );

    st.test('should update', function (sst) {
      var file = new VFile({
        filename: 'example',
        extension: 'md'
      });

      sst.deepEqual(file.history, ['example.md']);

      file.move({extension: 'js'});

      sst.deepEqual(file.history, [
        'example.md',
        'example.js'
      ]);

      file.move({directory: '~'});

      sst.deepEqual(file.history, [
        'example.md',
        'example.js',
        '~/example.js'
      ]);

      sst.end();
    });

    st.test('should update ignore when nothing changed', function (sst) {
      var file = new VFile({});

      file.move();

      sst.deepEqual(file.history, []);

      file.move({filename: 'example', extension: 'md'});

      file.move({directory: '.'});

      sst.deepEqual(file.history, ['example.md']);

      sst.end();
    });

    st.end();
  });

  t.end();
});
