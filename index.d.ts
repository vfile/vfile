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
  VFileValue,
  VFileOptions,
  VFileCompatible,
  VFileReporterSettings,
  VFileReporter
} from './lib/index.js'

export {VFile} from './lib/index.js'
