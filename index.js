/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module vfile
 * @fileoverview Virtual file format to attach additional
 *   information related to processed input.  Similar to
 *   `wearefractal/vinyl`.
 */

'use strict';

/* Dependencies. */
var stringify = require('unist-util-stringify-position');

/* Expose. */
module.exports = VFile;

/* Get path separator. */
var SEPARATOR = '/';

try {
  /* eslint-disable no-useless-concat */
  SEPARATOR = require('pa' + 'th').sep;
} catch (err) { /* empty */ }

var proto;

/* Methods. */
proto = VFile.prototype;

proto.basename = basename;
proto.move = move;
proto.toString = toString;
proto.message = message;
proto.warn = warn;
proto.fail = fail;
proto.hasFailed = hasFailed;
proto.namespace = namespace;

/* Message properties. */
proto = VFileMessage.prototype;

proto.file = proto.name = proto.reason = proto.message = proto.stack = '';
proto.fatal = proto.column = proto.line = null;

/**
 * Construct a new file.
 *
 * @constructor
 * @param {Object|VFile|string} [options] - File, contents, or config.
 */
function VFile(options) {
  if (!(this instanceof VFile)) {
    return new VFile(options);
  }

  /* Given file. */
  if (
    options &&
    typeof options === 'object' &&
    'filePath' in options &&
    'messages' in options
  ) {
    return options;
  }

  if (!options) {
    options = {};
  } else if (typeof options === 'string') {
    options = {contents: options};
  }

  this.contents = options.contents || '';
  this.history = [];
  this.messages = [];
  this.filePath = filePathFactory(this);

  this.move(options);
}

/**
 * Construct a new file message.
 *
 * Note: We cannot invoke `Error` on the created context,
 * as that adds readonly `line` and `column` attributes on
 * Safari 9, thus throwing and failing the data.
 *
 * @constructor
 * @param {string} reason - Reason for messaging.
 */
function VFileMessage(reason) {
  this.message = reason;
}

/* Inherit from `Error#`. */
function VFileMessagePrototype() {}
VFileMessagePrototype.prototype = Error.prototype;
VFileMessage.prototype = new VFileMessagePrototype();

/**
 * ESLint's formatter API expects `filePath` to be a
 * string.
 *
 * @private
 * @param {VFile} file - Virtual file.
 * @return {Function} - `filePath` getter.
 */
function filePathFactory(file) {
  filePath.toString = filePath;

  return filePath;

  /**
   * Get the filename, with extension and directory, if applicable.
   */
  function filePath() {
    var directory = file.directory;
    var separator;

    if (file.filename || file.extension) {
      separator = directory.charAt(directory.length - 1);

      if (separator === '/' || separator === '\\') {
        directory = directory.slice(0, -1);
      }

      if (directory === '.') {
        directory = '';
      }

      return (directory ? directory + SEPARATOR : '') +
        file.filename +
        (file.extension ? '.' + file.extension : '');
    }

    return '';
  }
}

/**
 * Get the filename with extension.
 *
 * @return {string} - name of file with extension.
 */
function basename() {
  var self = this;
  var extension = self.extension;

  if (self.filename || extension) {
    return self.filename + (extension ? '.' + extension : '');
  }

  return '';
}

/**
 * Get the value of the file.
 *
 * @return {string} - Contents.
 */
function toString() {
  return this.contents;
}

/**
 * Move a file by passing a new file-path parts.
 *
 * @param {Object?} [options] - Configuration.
 * @return {VFile} - Context object.
 */
function move(options) {
  var parts = options || {};
  var self = this;
  var before = self.filePath();
  var after;

  self.directory = parts.directory || self.directory || '';
  self.filename = parts.filename || self.filename || '';
  self.extension = parts.extension || self.extension || '';

  after = self.filePath();

  if (after && before !== after) {
    self.history.push(after);
  }

  return self;
}

/**
 * Create a message with `reason` at `position`.
 * When an error is passed in as `reason`, copies the
 * stack.  This does not add a message to `messages`.
 *
 * @param {string|Error} reason - Reason for message.
 * @param {Node|Location|Position} [position] - Place of message.
 * @param {string} [ruleId] - Category of message.
 * @return {VFileMessage} - Message.
 */
function message(reason, position, ruleId) {
  var filePath = this.filePath();
  var range;
  var err;
  var location = {
    start: {line: null, column: null},
    end: {line: null, column: null}
  };

  /* Node / location / position. */
  range = stringify(position) || '1:1';

  if (position && position.position) {
    position = position.position;
  }

  if (position) {
    if (position.start) {
      location = position;
      position = position.start;
    } else {
      location.start = position;
      location.end.line = null;
      location.end.column = null;
    }
  }

  err = new VFileMessage(reason.message || reason);

  err.name = (filePath ? filePath + ':' : '') + range;
  err.file = filePath;
  err.reason = reason.message || reason;
  err.line = position ? position.line : null;
  err.column = position ? position.column : null;
  err.location = location;
  err.ruleId = ruleId || null;

  if (reason.stack) {
    err.stack = reason.stack;
  }

  return err;
}

/**
 * Warn. Creates a non-fatal message (see `VFile#message()`),
 * and adds it to the file's `messages` list.
 *
 * @see VFile#message
 */
function warn() {
  var err = this.message.apply(this, arguments);

  err.fatal = false;

  this.messages.push(err);

  return err;
}

/**
 * Fail. Creates a fatal message (see `VFile#message()`),
 * sets `fatal: true`, adds it to the file's
 * `messages` list.
 *
 * If `quiet` is not `true`, throws the error.
 *
 * @throws {VFileMessage} - When not `quiet: true`.
 * @param {string|Error} reason - Reason for failure.
 * @param {Node|Location|Position} [position] - Place
 *   of failure in file.
 * @return {VFileMessage} - Unless thrown, of course.
 */
function fail(reason, position) {
  var err = this.message(reason, position);

  err.fatal = true;

  this.messages.push(err);

  if (!this.quiet) {
    throw err;
  }

  return err;
}

/**
 * Check if a fatal message occurred making the file no
 * longer processable.
 *
 * @return {boolean} - `true` if at least one of file's
 *   `messages` has a `fatal` property set to `true`
 */
function hasFailed() {
  var messages = this.messages;
  var length = messages.length;
  var index = -1;

  while (++index < length) {
    if (messages[index].fatal) {
      return true;
    }
  }

  return false;
}

/**
 * Access metadata.
 *
 * @param {string} key - Namespace key.
 * @return {Object} - Private space.
 */
function namespace(key) {
  var self = this;
  var space = self.data;

  if (!space) {
    space = self.data = {};
  }

  if (!space[key]) {
    space[key] = {};
  }

  return space[key];
}
