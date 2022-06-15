/**
 * @typedef {import('unist').Node} Node
 * @typedef {import('unist').Position} Position
 * @typedef {import('unist').Point} Point
 * @typedef {Record<string, unknown> & {type: string, position?: Position|undefined}} NodeLike
 * @typedef {import('./minurl.shared.js').URL} URL
 * @typedef {import('../index.js').Data} Data
 * @typedef {import('../index.js').Value} Value
 *
 */

import {Buffer} from 'buffer'
import buffer from 'is-buffer'
import {VFileMessage} from 'vfile-message'
import {path} from './minpath.js'
import {proc} from './minproc.js'
import {urlToPath, isUrl} from './minurl.js'

export type BufferEncoding =
  | 'ascii'
  | 'utf8'
  | 'utf-8'
  | 'utf16le'
  | 'ucs2'
  | 'ucs-2'
  | 'base64'
  | 'base64url'
  | 'latin1'
  | 'binary'
  | 'hex'

export interface DataMap {}

export type Data = Record<string, unknown> & Partial<DataMap>

export type MaybeBuffer = any extends Buffer ? never : Buffer

export type Value = string | MaybeBuffer

export type Options = Record<string, unknown> & VFileCoreOptions

export type ReporterSettings = Record<string, unknown>

export type Reporter = <T = ReporterSettings>(
  files: VFile[],
  options: T
) => string

export type Compatible = Value | Options | VFile | URL

export interface VFileCoreOptions {
  value?: Value[]
  cwd?: string[]
  history?: string[][]
  path?: Array<string | URL>
  basename?: string[]
  stem?: string[]
  extname?: string[]
  dirname?: string[]
  data?: Data[]
}

export interface Map {
  version: number
  sources: string[]
  names: string[]
  sourceRoot?: string
  sourcesContent?: string[]
  mappings: string
  file: string
}

// Order of setting (least specific to most), we need this because otherwise
// `{stem: 'a', path: '~/b.js'}` would throw, as a path is needed before a
// stem can be set.
const order = ['history', 'path', 'basename', 'stem', 'extname', 'dirname']

export class VFile {
  /**
   * Create a new virtual file.
   *
   * If `options` is `string` or `Buffer`, it’s treated as `{value: options}`.
   * If `options` is a `URL`, it’s treated as `{path: options}`.
   * If `options` is a `VFile`, shallow copies its data over to the new file.
   * All fields in `options` are set on the newly created `VFile`.
   *
   * Path related fields are set in the following order (least specific to
   * most specific): `history`, `path`, `basename`, `stem`, `extname`,
   * `dirname`.
   *
   * It’s not possible to set either `dirname` or `extname` without setting
   * either `history`, `path`, `basename`, or `stem` as well.
   *
   * @param {Compatible} [value]
   */
  public data: Data
  public messages: VFileMessage[]
  public history: string[] = []
  public cwd: string
  // @ts-expect-error
  public value: Value
  // @ts-expect-error
  public stored: boolean
  public result: unknown
  public map: Map | undefined

  constructor(value: Compatible) {
    /** @type {Options} */
    let options: Options

    if (!value) {
      options = {}
    } else if (typeof value === 'string' || buffer(value)) {
      // @ts-expect-error
      options = {value}
    } else if (isUrl(value)) {
      // @ts-expect-error
      options = {path: value}
    } else {
      // @ts-expect-error
      options = value
    }

    /**
     * Place to store custom information (default: `{}`).
     * It’s OK to store custom data directly on the file but moving it to
     * `data` is recommended.
     * @type {Data}
     */
    this.data = {}

    /**
     * List of messages associated with the file.
     * @type {Array<VFileMessage>}
     */
    this.messages = []

    /**
     * List of filepaths the file moved between.
     * The first is the original path and the last is the current path.
     * @type {Array<string>}
     */
    this.history = []

    /**
     * Base of `path` (default: `process.cwd()` or `'/'` in browsers).
     * @type {string}
     */
    this.cwd = proc.cwd()

    // Set path related properties in the correct order.
    let index = -1

    while (++index < order.length) {
      const prop = order[index]

      // Note: we specifically use `in` instead of `hasOwnProperty` to accept
      // `vfile`s too.
      if (prop in options && options[prop] !== undefined) {
        // @ts-expect-error: TS is confused by the different types for `history`.
        this[prop] = prop === 'history' ? [...options[prop]] : options[prop]
      }
    }

    /** @type {string} */
    let prop

    // Set non-path related properties.
    for (prop in options) {
      // @ts-expect-error: fine to set other things.
      if (!order.includes(prop)) this[prop] = options[prop]
    }
  }

  /**
   * Get the full path (example: `'~/index.min.js'`).
   * @returns {string}
   */
  get path() {
    return this.history[this.history.length - 1]
  }

  /**
   * Set the full path (example: `'~/index.min.js'`).
   * Cannot be nullified.
   * You can set a file URL (a `URL` object with a `file:` protocol) which will
   * be turned into a path with `url.fileURLToPath`.
   * @param {string|URL} path
   */
  set path(path) {
    if (isUrl(path)) {
      path = urlToPath(path)
    }

    assertNonEmpty(path, 'path')

    if (this.path !== path) {
      this.history.push(path)
    }
  }

  /**
   * Get the parent path (example: `'~'`).
   */
  get dirname() {
    return typeof this.path === 'string' ? path.dirname(this.path) : undefined
  }

  /**
   * Set the parent path (example: `'~'`).
   * Cannot be set if there’s no `path` yet.
   */
  set dirname(dirname) {
    assertPath(this.basename, 'dirname')
    // @ts-expect-error
    this.path = path.join(dirname || '', this.basename)
  }

  /**
   * Get the basename (including extname) (example: `'index.min.js'`).
   */
  get basename() {
    return typeof this.path === 'string' ? path.basename(this.path) : undefined
  }

  /**
   * Set basename (including extname) (`'index.min.js'`).
   * Cannot contain path separators (`'/'` on unix, macOS, and browsers, `'\'`
   * on windows).
   * Cannot be nullified (use `file.path = file.dirname` instead).
   */
  set basename(basename) {
    assertNonEmpty(basename, 'basename')
    assertPart(basename, 'basename')
    // @ts-expect-error
    this.path = path.join(this.dirname || '', basename)
  }

  /**
   * Get the extname (including dot) (example: `'.js'`).
   */
  get extname() {
    return typeof this.path === 'string' ? path.extname(this.path) : undefined
  }

  /**
   * Set the extname (including dot) (example: `'.js'`).
   * Cannot contain path separators (`'/'` on unix, macOS, and browsers, `'\'`
   * on windows).
   * Cannot be set if there’s no `path` yet.
   */
  set extname(extname) {
    assertPart(extname, 'extname')
    assertPath(this.dirname, 'extname')

    if (extname) {
      if (extname.charCodeAt(0) !== 46 /* `.` */) {
        throw new Error('`extname` must start with `.`')
      }

      if (extname.includes('.', 1)) {
        throw new Error('`extname` cannot contain multiple dots')
      }
    }

    // @ts-expect-error
    this.path = path.join(this.dirname, this.stem + (extname || ''))
  }

  /**
   * Get the stem (basename w/o extname) (example: `'index.min'`).
   */
  get stem() {
    return typeof this.path === 'string'
      ? path.basename(this.path, this.extname)
      : undefined
  }

  /**
   * Set the stem (basename w/o extname) (example: `'index.min'`).
   * Cannot contain path separators (`'/'` on unix, macOS, and browsers, `'\'`
   * on windows).
   * Cannot be nullified (use `file.path = file.dirname` instead).
   */
  set stem(stem) {
    assertNonEmpty(stem, 'stem')
    assertPart(stem, 'stem')
    this.path = path.join(this.dirname || '', stem + (this.extname || ''))
  }

  /**
   * Serialize the file.
   *
   * @param {BufferEncoding} [encoding='utf8']
   *   When `value` is a `Buffer`, `encoding` is a character encoding to
   *   understand it as (default: `'utf8'`).
   * @returns {string}
   *   Serialized file.
   */
  // @ts-expect-error
  toString(encoding) {
    return (this.value || '').toString(encoding)
  }

  /**
   * Constructs a new `VFileMessage`, where `fatal` is set to `false`, and
   * associates it with the file by adding it to `vfile.messages` and setting
   * `message.file` to the current filepath.
   *
   * @param {string|Error} reason
   *   Human readable reason for the message, uses the stack and message of the error if given.
   * @param {Node|NodeLike|Position|Point} [place]
   *   Place where the message occurred in the file.
   * @param {string} [origin]
   *   Computer readable reason for the message
   * @returns {VFileMessage}
   *   Message.
   */
  // @ts-expect-error
  message(reason, place, origin) {
    const message = new VFileMessage(reason, place, origin)

    if (this.path) {
      message.name = this.path + ':' + message.name
      message.file = this.path
    }

    message.fatal = false

    this.messages.push(message)

    return message
  }

  /**
   * Like `VFile#message()`, but associates an informational message where
   * `fatal` is set to `null`.
   *
   * @param {string|Error} reason
   *   Human readable reason for the message, uses the stack and message of the error if given.
   * @param {Node|NodeLike|Position|Point} [place]
   *   Place where the message occurred in the file.
   * @param {string} [origin]
   *   Computer readable reason for the message
   * @returns {VFileMessage}
   *   Message.
   */
  // @ts-expect-error
  info(reason, place, origin) {
    const message = this.message(reason, place, origin)

    message.fatal = null

    return message
  }

  /**
   * Like `VFile#message()`, but associates a fatal message where `fatal` is
   * set to `true`, and then immediately throws it.
   *
   * > 👉 **Note**: a fatal error means that a file is no longer processable.
   *
   * @param {string|Error} reason
   *   Human readable reason for the message, uses the stack and message of the error if given.
   * @param {Node|NodeLike|Position|Point} [place]
   *   Place where the message occurred in the file.
   * @param {string} [origin]
   *   Computer readable reason for the message
   * @returns {never}
   *   Message.
   */
  // @ts-expect-error
  fail(reason, place, origin) {
    const message = this.message(reason, place, origin)

    message.fatal = true

    throw message
  }
}

/**
 * Assert that `part` is not a path (as in, does not contain `path.sep`).
 *
 * @param {string|undefined} part
 * @param {string} name
 * @returns {void}
 */
// @ts-expect-error
function assertPart(part, name) {
  if (part && part.includes(path.sep)) {
    throw new Error(
      '`' + name + '` cannot be a path: did not expect `' + path.sep + '`'
    )
  }
}

/**
 * Assert that `part` is not empty.
 *
 * @param {string|undefined} part
 * @param {string} name
 * @returns {asserts part is string}
 */
// @ts-expect-error
function assertNonEmpty(part, name) {
  if (!part) {
    throw new Error('`' + name + '` cannot be empty')
  }
}

/**
 * Assert `path` exists.
 *
 * @param {string|undefined} path
 * @param {string} name
 * @returns {asserts path is string}
 */
// @ts-expect-error
function assertPath(path, name) {
  if (!path) {
    throw new Error('Setting `' + name + '` requires `path` to be set too')
  }
}
