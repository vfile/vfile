// To do: document everything here.

export interface VFileDataRegistry {}

export type VFileData = {[key: string]: unknown} & Partial<VFileDataRegistry>

export type {
  BufferEncoding,
  VFileValue,
  VFileOptions,
  VFileCompatible,
  VFileReporterSettings,
  VFileReporter
} from './lib/index.js'

export {VFile} from './lib/index.js'
