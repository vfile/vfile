// It’s important to preserve this ignore statement. This maeks sure it works
// both with and without node types.
// @ts-ignore
type InternalBuffer = Buffer

/**
 * This is the same as `Buffer` if node types are included, `never` otherwise.
 */
export type MaybeBuffer = any extends InternalBuffer ? never: InternalBuffer
