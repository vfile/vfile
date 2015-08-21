'use strict';

/*
 * Dependencies.
 */

var assert = require('assert');
var VFile = require('./');

/*
 * Methods.
 */

var equal = assert.strictEqual;
var dequal = assert.deepEqual;
var nequal = assert.notStrictEqual;

/* eslint-env mocha */

describe('VFile(options?)', function () {
    it('should create a new `VFile`', function () {
        assert(new VFile() instanceof VFile);
    });

    it('should work without `new`', function () {
        /* eslint-disable new-cap */
        assert(VFile() instanceof VFile);
        /* eslint-enable new-cap */
    });

    it('should accept missing options', function () {
        var vfile = new VFile();

        equal(vfile.filename, '');
        equal(vfile.extension, '');
        equal(vfile.contents, '');
    });

    it('should accept a `string`', function () {
        var vfile = new VFile('Test');

        equal(vfile.filename, '');
        equal(vfile.extension, '');
        equal(vfile.contents, 'Test');
    });

    it('should accept an `Object`', function () {
        var vfile = new VFile({
            'filename': 'Untitled',
            'extension': 'markdown',
            'contents': 'Test'
        });

        equal(vfile.filename, 'Untitled');
        equal(vfile.extension, 'markdown');
        equal(vfile.contents, 'Test');
    });

    it('should accept a `VFile`', function () {
        var vfile = new VFile(new VFile({
            'filename': 'Untitled',
            'extension': 'markdown',
            'contents': 'Test'
        }));

        equal(vfile.filename, 'Untitled');
        equal(vfile.extension, 'markdown');
        equal(vfile.contents, 'Test');
    });

    describe('#toString()', function () {
        it('should return `""` without content', function () {
            equal(new VFile().toString(), '');
        });

        it('should return the internal value', function () {
            equal(new VFile('foo').toString(), 'foo');
        });
    });

    describe('#filePath()', function () {
        it('should return `""` without a filename', function () {
            equal(new VFile().filePath(), '');
        });

        it('should return the filename without extension', function () {
            equal(new VFile({
                'filename': 'Untitled',
                'extension': null
            }).filePath(), 'Untitled');
        });

        it('should return the filename with extension', function () {
            equal(new VFile({
                'filename': 'Untitled',
                'extension': 'markdown'
            }).filePath(), 'Untitled.markdown');
        });

        it('should return the full vfile path', function () {
            equal(new VFile({
                'directory': 'foo/bar',
                'filename': 'baz',
                'extension': 'qux'
            }).filePath(), 'foo/bar/baz.qux');
        });

        it('should not return an extra directory slash', function () {
            equal(new VFile({
                'directory': '~/',
                'filename': 'baz',
                'extension': 'qux'
            }).filePath(), '~/baz.qux');
        });

        it('should not return the current directory', function () {
            equal(new VFile({
                'directory': '.',
                'filename': 'baz',
                'extension': 'qux'
            }).filePath(), 'baz.qux');

            equal(new VFile({
                'directory': './',
                'filename': 'baz',
                'extension': 'qux'
            }).filePath(), 'baz.qux');
        });

        it('should return the parent directory', function () {
            equal(new VFile({
                'directory': '..',
                'filename': 'baz',
                'extension': 'qux'
            }).filePath(), '../baz.qux');

            equal(new VFile({
                'directory': '../',
                'filename': 'baz',
                'extension': 'qux'
            }).filePath(), '../baz.qux');
        });
    });

    describe('#move()', function () {
        it('should change an extension', function () {
            var vfile = new VFile({
              'directory': '~',
              'filename': 'example',
              'extension': 'markdown'
            });

            vfile.move({
                'extension': 'md'
            });

            equal(vfile.filePath(), '~/example.md');
        });

        it('should change a filename', function () {
            var vfile = new VFile({
              'directory': '~',
              'filename': 'example',
              'extension': 'markdown'
            });

            vfile.move({
                'filename': 'foo'
            });

            equal(vfile.filePath(), '~/foo.markdown');
        });

        it('should change a directory', function () {
            var vfile = new VFile({
              'directory': '~',
              'filename': 'example',
              'extension': 'markdown'
            });

            vfile.move({
                'directory': '/var/www'
            });

            equal(vfile.filePath(), '/var/www/example.markdown');
        });

        it('should ignore not-given values', function () {
            var vfile = new VFile();

            vfile.extension = null;

            vfile.move();

            equal(vfile.filePath(), '');
        });

        it('should add a filename', function () {
            var vfile = new VFile();

            vfile.move({
                'filename': 'example'
            });

            equal(vfile.filePath(), 'example');
        });

        it('should add a directory', function () {
            var vfile = new VFile();

            vfile.move({
                'directory': '~',
                'filename': 'example'
            });

            equal(vfile.filePath(), '~/example');
        });

        it('should add an extension', function () {
            var vfile = new VFile({
                'filename': 'README',
                'extension': ''
            });

            vfile.move({
                'extension': 'md'
            });

            equal(vfile.filePath(), 'README.md');
        });
    });

    describe('#hasFailed()', function () {
        it('should return `false` when without messages', function () {
            var vfile = new VFile();

            equal(vfile.hasFailed(), false);

            vfile.warn('Foo');

            equal(vfile.hasFailed(), false);
        });

        it('should return `true` when with fatal messages', function () {
            var vfile = new VFile();

            vfile.quiet = true;

            vfile.fail('Foo');

            equal(vfile.hasFailed(), true);
        });
    });

    describe('#message(reason, position?)', function () {
        it('should return an Error', function () {
            assert(new VFile().message('') instanceof Error);
        });

        it('should add properties', function () {
            var err = new VFile({
                'filename': 'untitled'
            }).message('test');

            equal(err.file, 'untitled');
            equal(err.reason, 'test');
            equal(err.line, null);
            equal(err.column, null);
            dequal(err.location, {
                'start': {
                    'line': null,
                    'column': null
                },
                'end': {
                    'line': null,
                    'column': null
                }
            });
        });

        it('should add properties on an unfilled vfile', function () {
            var err = new VFile().message('test');

            equal(err.file, '');
            equal(err.reason, 'test');
            equal(err.line, null);
            equal(err.column, null);
            dequal(err.location, {
                'start': {
                    'line': null,
                    'column': null
                },
                'end': {
                    'line': null,
                    'column': null
                }
            });
        });

        it('should create a pretty message', function () {
            equal(new VFile().message('test').message, 'test');
        });

        it('should have a pretty `toString()` message', function () {
            equal(new VFile().message('test').toString(), '1:1: test');
        });

        it('should include the filename in `toString()`', function () {
            equal(new VFile({
                'filename': 'untitled'
            }).message('test').toString(), 'untitled:1:1: test');
        });

        it('should accept an error', function () {
            var err = new Error('foo');
            var exception = new VFile().message(err);

            equal(exception.stack, err.stack);
            equal(exception.message, err.message);
        });

        it('should accept a node', function () {
            var err = new VFile().message('test', {
                'position': {
                    'start': {
                        'line': 2,
                        'column': 1
                    },
                    'end': {
                        'line': 2,
                        'column': 5
                    }
                }
            });

            dequal(err.location, {
                'start': {
                    'line': 2,
                    'column': 1
                },
                'end': {
                    'line': 2,
                    'column': 5
                }
            });

            equal(err.toString(), '2:1-2:5: test');
        });

        it('should accept a location', function () {
            var err = new VFile().message('test', {
                'start': {
                    'line': 2,
                    'column': 1
                },
                'end': {
                    'line': 2,
                    'column': 5
                }
            });

            dequal(err.location, {
                'start': {
                    'line': 2,
                    'column': 1
                },
                'end': {
                    'line': 2,
                    'column': 5
                }
            });

            equal(err.toString(), '2:1-2:5: test');
        });

        it('should accept a position', function () {
            var err = new VFile().message('test', {
                'line': 2,
                'column': 5
            });

            dequal(err.location, {
                'start': {
                    'line': 2,
                    'column': 5
                },
                'end': {
                    'line': null,
                    'column': null
                }
            });

            equal(err.toString(), '2:5: test');
        });
    });

    describe('#fail(reason, position?)', function () {
        it('should add a fatal error to `messages`', function () {
            var vfile = new VFile();
            var message;

            assert.throws(function () {
                vfile.fail('Foo', {
                    'line': 1,
                    'column': 3
                });
            }, /1:3: Foo/);

            equal(vfile.messages.length, 1);

            message = vfile.messages[0];

            equal(message.file, '');
            equal(message.reason, 'Foo');
            equal(message.line, 1);
            equal(message.column, 3);
            equal(message.name, '1:3');
            equal(message.fatal, true);
        });

        it('should not throw when `quiet: true`', function () {
            var vfile = new VFile();

            vfile.quiet = true;

            vfile.fail('Foo', {
                'line': 1,
                'column': 3
            });
        });
    });

    describe('#warn(reason, position?)', function () {
        it('should add a non-fatal error to `messages`', function () {
            var vfile = new VFile();
            var message;

            vfile.warn('Bar', {
                'line': 9,
                'column': 2
            });

            equal(vfile.messages.length, 1);

            message = vfile.messages[0];

            equal(message.file, '');
            equal(message.reason, 'Bar');
            equal(message.line, 9);
            equal(message.column, 2);
            equal(message.name, '9:2');
            equal(message.fatal, false);
        });
    });

    describe('#namespace(key)', function () {
        it('should create a unique space', function () {
            var vfile = new VFile();

            equal(vfile.namespace('foo'), vfile.namespace('foo'));
            nequal(vfile.namespace('foo'), vfile.namespace('bar'));
        });
    });

    describe('#history', function () {
        it('should be set on creation', function () {
            dequal(new VFile().history, []);

            dequal(new VFile({
                'filename': 'example',
                'extension': 'js',
                'directory': '.'
            }).history, [
                'example.js'
            ]);
        });

        it('should update', function () {
            var file = new VFile({
                'filename': 'example',
                'extension': 'md'
            });

            dequal(file.history, [
                'example.md'
            ]);

            file.move({
                'extension': 'js'
            });

            dequal(file.history, [
                'example.md',
                'example.js'
            ]);

            file.move({
                'directory': '~'
            });

            dequal(file.history, [
                'example.md',
                'example.js',
                '~/example.js'
            ]);
        });

        it('should update ignore when nothing changed', function () {
            var file = new VFile({});

            file.move();

            dequal(file.history, []);

            file.move({
                'filename': 'example',
                'extension': 'md'
            });

            file.move({
                'directory': '.'
            });

            dequal(file.history, ['example.md']);
        });
    });
});
