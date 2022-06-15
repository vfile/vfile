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
/// <reference types="node" />
import { Buffer } from 'buffer';
import { VFileMessage } from 'vfile-message';
export declare type BufferEncoding = 'ascii' | 'utf8' | 'utf-8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'base64' | 'base64url' | 'latin1' | 'binary' | 'hex';
export interface DataMap {
}
export declare type Data = Record<string, unknown> & Partial<DataMap>;
export declare type MaybeBuffer = any extends Buffer ? never : Buffer;
export declare type Value = string | MaybeBuffer;
export declare type Options = Record<string, unknown> & VFileCoreOptions;
export declare type ReporterSettings = Record<string, unknown>;
export declare type Reporter = <T = ReporterSettings>(files: VFile[], options: T) => string;
export declare type Compatible = Value | Options | VFile | URL;
export interface VFileCoreOptions {
    value?: Value[];
    cwd?: string[];
    history?: string[][];
    path?: Array<string | URL>;
    basename?: string[];
    stem?: string[];
    extname?: string[];
    dirname?: string[];
    data?: Data[];
}
export interface Map {
    version: number;
    sources: string[];
    names: string[];
    sourceRoot?: string;
    sourcesContent?: string[];
    mappings: string;
    file: string;
}
export declare class VFile {
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
    data: Data;
    messages: VFileMessage[];
    history: string[];
    cwd: string;
    value: Value;
    stored: boolean;
    result: unknown;
    map: Map | undefined;
    constructor(value: Compatible);
    /**
     * Get the full path (example: `'~/index.min.js'`).
     * @returns {string}
     */
    get path(): string;
    /**
     * Set the full path (example: `'~/index.min.js'`).
     * Cannot be nullified.
     * You can set a file URL (a `URL` object with a `file:` protocol) which will
     * be turned into a path with `url.fileURLToPath`.
     * @param {string|URL} path
     */
    set path(path: string);
    /**
     * Get the parent path (example: `'~'`).
     */
    get dirname(): string | undefined;
    /**
     * Set the parent path (example: `'~'`).
     * Cannot be set if there’s no `path` yet.
     */
    set dirname(dirname: string | undefined);
    /**
     * Get the basename (including extname) (example: `'index.min.js'`).
     */
    get basename(): string | undefined;
    /**
     * Set basename (including extname) (`'index.min.js'`).
     * Cannot contain path separators (`'/'` on unix, macOS, and browsers, `'\'`
     * on windows).
     * Cannot be nullified (use `file.path = file.dirname` instead).
     */
    set basename(basename: string | undefined);
    /**
     * Get the extname (including dot) (example: `'.js'`).
     */
    get extname(): string | undefined;
    /**
     * Set the extname (including dot) (example: `'.js'`).
     * Cannot contain path separators (`'/'` on unix, macOS, and browsers, `'\'`
     * on windows).
     * Cannot be set if there’s no `path` yet.
     */
    set extname(extname: string | undefined);
    /**
     * Get the stem (basename w/o extname) (example: `'index.min'`).
     */
    get stem(): string | undefined;
    /**
     * Set the stem (basename w/o extname) (example: `'index.min'`).
     * Cannot contain path separators (`'/'` on unix, macOS, and browsers, `'\'`
     * on windows).
     * Cannot be nullified (use `file.path = file.dirname` instead).
     */
    set stem(stem: string | undefined);
    /**
     * Serialize the file.
     *
     * @param {BufferEncoding} [encoding='utf8']
     *   When `value` is a `Buffer`, `encoding` is a character encoding to
     *   understand it as (default: `'utf8'`).
     * @returns {string}
     *   Serialized file.
     */
    toString(encoding: any): string;
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
    message(reason: any, place: any, origin: any): VFileMessage;
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
    info(reason: any, place: any, origin: any): VFileMessage;
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
    fail(reason: any, place: any, origin: any): void;
}
