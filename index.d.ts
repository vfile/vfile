// eslint-disable-next-line @typescript-eslint/ban-ts-comment, @typescript-eslint/prefer-ts-expect-error
// @ts-ignore It’s important to preserve this ignore statement. This makes sure
// it works both with and without node types.
import {Buffer} from 'buffer'

/**
 * This is the same as `Buffer` if node types are included, `never` otherwise.
 */
type MaybeBuffer = any extends Buffer ? never : Buffer

/**
 * Contents of the file.
 * Can either be text, or a Buffer like structure.
 * This does not directly use type `Buffer`, because it can also be used in a
 * browser context.
 * Instead this leverages `Uint8Array` which is the base type for `Buffer`,
 * and a native JavaScript construct.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export type VFileValue = string | MaybeBuffer

/**
 * This map registers the type of the `data` key of a `VFile`.
 *
 * This type can be augmented to register custom `data` types.
 *
 * @example
 * declare module 'vfile' {
 *   interface VFileDataRegistry {
 *     // `file.data.name` is typed as `string`
 *     name: string
 *   }
 * }
 */
// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
export interface VFileDataMap {}

/**
 * Place to store custom information.
 *
 * Known attributes can be added to @see {@link VFileDataMap}
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export type VFileData = Record<string, unknown> & Partial<VFileDataMap>

export type {
  BufferEncoding,
  VFileOptions,
  VFileCompatible,
  VFileReporterSettings,
  VFileReporter
} from './lib/index.js'

export {VFile} from './lib/index.js'
