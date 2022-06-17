import {isUrl} from './minurl.shared.js'

// See: <https://github.com/nodejs/node/blob/fcf8ba4/lib/internal/url.js>

export function urlToPath(path: string | URL): string {
  if (typeof path === 'string') {
    path = new URL(path)
  } else if (!isUrl(path)) {
    const error: NodeJS.ErrnoException = new TypeError(
      `The "path" argument must be of type string or an instance of URL. Received \`${path}\``
    )
    error.code = 'ERR_INVALID_ARG_TYPE'
    throw error
  }

  if (path.protocol !== 'file:') {
    const error: NodeJS.ErrnoException = new TypeError(
      'The URL must be of scheme file'
    )
    error.code = 'ERR_INVALID_URL_SCHEME'
    throw error
  }

  return getPathFromURLPosix(path)
}

function getPathFromURLPosix(url: URL) {
  if (url.hostname !== '') {
    const error: NodeJS.ErrnoException = new TypeError(
      'File URL host must be "localhost" or empty on darwin'
    )
    error.code = 'ERR_INVALID_FILE_URL_HOST'
    throw error
  }

  const pathname = url.pathname
  let index = -1

  while (++index < pathname.length) {
    if (
      pathname.charCodeAt(index) === 37 /* `%` */ &&
      pathname.charCodeAt(index + 1) === 50 /* `2` */
    ) {
      const third = pathname.charCodeAt(index + 2)
      if (third === 70 /* `F` */ || third === 102 /* `f` */) {
        const error: NodeJS.ErrnoException = new TypeError(
          'File URL path must not include encoded / characters'
        )
        error.code = 'ERR_INVALID_FILE_URL_PATH'
        throw error
      }
    }
  }

  return decodeURIComponent(pathname)
}

export {isUrl} from './minurl.shared.js'
