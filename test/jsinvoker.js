/**
 * window.JSInvoker
 * @param {JSONString} msg 消息
 * @param {String} callbackId h5的返回函数id
 */
;(function() {
  if (window.JSInvoker.postMessage == void 0) {
    window.JSInvoker.postMessage = function(msg, callbackId) {
      window.NativeSimulate.postMessage(msg, callbackId)
    }
  }
})()
