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
export interface VFileDataRegistry {}

// eslint-disable-next-line @typescript-eslint/naming-convention
export type VFileData = Record<string, unknown> & Partial<VFileDataRegistry>

export type {
  BufferEncoding,
  VFileValue,
  VFileOptions,
  VFileCompatible,
  VFileReporterSettings,
  VFileReporter
} from './lib/index.js'

export {VFile} from './lib/index.js'
