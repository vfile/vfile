import {VFileMessage} from 'vfile-message'
import {vfile} from './core.js'

export {vfile}

vfile.prototype.message = message
vfile.prototype.info = info
vfile.prototype.fail = fail

// Create a message with `reason` at `position`.
// When an error is passed in as `reason`, copies the stack.
function message(reason, position, origin) {
  var message = new VFileMessage(reason, position, origin)

  if (this.path) {
    message.name = this.path + ':' + message.name
    message.file = this.path
  }

  message.fatal = false

  this.messages.push(message)

  return message
}

// Fail: creates a VFileMessage, associates it with the file, and throws it.
function fail() {
  var message = this.message(...arguments)

  message.fatal = true

  throw message
}

// Info: creates a VFileMessage, associates it with the file, and marks the
// fatality as `null`.
function info() {
  var message = this.message(...arguments)

  message.fatal = null

  return message
}
