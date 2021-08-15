import {fileURLToPath, URL} from 'url'

// `URL` export is for types.
export {URL, fileURLToPath as urlToPath}

// Note: this is copy/pasted from `minurl.browser.js` because otherwise DOM/Node
// types mix up.
/**
 * @param {unknown} fileURLOrPath
 * @returns {fileURLOrPath is URL}
 */
export function isUrl(fileURLOrPath) {
  return (
    fileURLOrPath !== null &&
    typeof fileURLOrPath === 'object' &&
    // @ts-expect-error: indexable.
    fileURLOrPath.href &&
    // @ts-expect-error: indexable.
    fileURLOrPath.origin
  )
}
