// 模拟 native 处理数据

;(function() {
  window.NativeSimulate = window.NativeSimulate || {}

  function processMessage(message) {
    console.log('Native got a message: ', message)

    return 'Native Say: Yes'
  }

  window.NativeSimulate.postMessage = function(message, callbackId) {
    // Process the message, return result
    var res = processMessage(message)

    WebViewJavascriptBridge._handleMessageFromNative(
      JSON.stringify({
        handlerName: 'message',
        responseData: {
          msg: res
        },
        responseId: callbackId
      })
    )
  }
})()
