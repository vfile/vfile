import buffer from 'is-buffer'
import {path} from './minpath.js'
import {proc} from './minproc.js'
import {VFileMessage} from 'vfile-message'

// Order of setting (least specific to most), we need this because otherwise
// `{stem: 'a', path: '~/b.js'}` would throw, as a path is needed before a
// stem can be set.
var order = ['history', 'path', 'basename', 'stem', 'extname', 'dirname']

export class VFile {
  // Construct a new file.
  constructor(options) {
    var index = -1
    var prop

    if (!options) {
      options = {}
    } else if (typeof options === 'string' || buffer(options)) {
      options = {value: options}
    }

    this.data = {}
    this.messages = []
    this.history = []
    this.cwd = proc.cwd()

    // Set path related properties in the correct order.
    while (++index < order.length) {
      prop = order[index]

      // Note: we specifically use `in` instead of `hasOwnProperty` to accept
      // `vfile`s too.
      if (prop in options && options[prop] !== undefined) {
        this[prop] = prop === 'history' ? options[prop].concat() : options[prop]
      }
    }

    // Set non-path related properties.
    for (prop in options) {
      if (!order.includes(prop)) {
        this[prop] = options[prop]
      }
    }
  }

  // Access full path (`~/index.min.js`).
  get path() {
    return this.history[this.history.length - 1]
  }

  set path(path) {
    assertNonEmpty(path, 'path')

    if (this.path !== path) {
      this.history.push(path)
    }
  }

  // Access parent path (`~`).
  get dirname() {
    return typeof this.path === 'string' ? path.dirname(this.path) : undefined
  }

  set dirname(dirname) {
    assertPath(this.path, 'dirname')
    this.path = path.join(dirname || '', this.basename)
  }

  // Access basename (`index.min.js`).
  get basename() {
    return typeof this.path === 'string' ? path.basename(this.path) : undefined
  }

  set basename(basename) {
    assertNonEmpty(basename, 'basename')
    assertPart(basename, 'basename')
    this.path = path.join(this.dirname || '', basename)
  }

  // Access extname (`.js`).
  get extname() {
    return typeof this.path === 'string' ? path.extname(this.path) : undefined
  }

  set extname(extname) {
    assertPart(extname, 'extname')
    assertPath(this.path, 'extname')

    if (extname) {
      if (extname.charCodeAt(0) !== 46 /* `.` */) {
        throw new Error('`extname` must start with `.`')
      }

      if (extname.includes('.', 1)) {
        throw new Error('`extname` cannot contain multiple dots')
      }
    }

    this.path = path.join(this.dirname, this.stem + (extname || ''))
  }

  // Access stem (`index.min`).
  get stem() {
    return typeof this.path === 'string'
      ? path.basename(this.path, this.extname)
      : undefined
  }

  set stem(stem) {
    assertNonEmpty(stem, 'stem')
    assertPart(stem, 'stem')
    this.path = path.join(this.dirname || '', stem + (this.extname || ''))
  }

  // Get the value of the file.
  toString(encoding) {
    return (this.value || '').toString(encoding)
  }

  // Create a message with `reason` at `position`.
  // When an error is passed in as `reason`, copies the stack.
  message(reason, position, origin) {
    var message = new VFileMessage(reason, position, origin)

    if (this.path) {
      message.name = this.path + ':' + message.name
      message.file = this.path
    }

    message.fatal = false

    this.messages.push(message)

    return message
  }

  // Info: creates a VFileMessage, associates it with the file, and marks the
  // fatality as `null`.
  info() {
    var message = this.message(...arguments)

    message.fatal = null

    return message
  }

  // Fail: creates a VFileMessage, associates it with the file, and throws it.
  fail() {
    var message = this.message(...arguments)

    message.fatal = true

    throw message
  }
}

// Assert that `part` is not a path (i.e., does not contain `path.sep`).
function assertPart(part, name) {
  if (part && part.includes(path.sep)) {
    throw new Error(
      '`' + name + '` cannot be a path: did not expect `' + path.sep + '`'
    )
  }
}

// Assert that `part` is not empty.
function assertNonEmpty(part, name) {
  if (!part) {
    throw new Error('`' + name + '` cannot be empty')
  }
}

// Assert `path` exists.
function assertPath(path, name) {
  if (!path) {
    throw new Error('Setting `' + name + '` requires `path` to be set too')
  }
}
