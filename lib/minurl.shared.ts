/**
 * @typedef URL
 * @property {string} hash
 * @property {string} host
 * @property {string} hostname
 * @property {string} href
 * @property {string} origin
 * @property {string} password
 * @property {string} pathname
 * @property {string} port
 * @property {string} protocol
 * @property {string} search
 * @property {any} searchParams
 * @property {string} username
 * @property {() => string} toString
 * @property {() => string} toJSON
 */

// From: <https://github.com/nodejs/node/blob/fcf8ba4/lib/internal/url.js#L1501>
export function isUrl(fileURLOrPath: unknown): URL {
  return (fileURLOrPath !== null &&
    typeof fileURLOrPath === 'object' &&
    // @ts-ignore
    fileURLOrPath.href &&
    // @ts-ignore
    fileURLOrPath.origin) as URL
}
