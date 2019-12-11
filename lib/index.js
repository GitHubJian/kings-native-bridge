;(function() {
  if (window.WebViewJavascriptBridge) {
    return
  }

  // set default message handler
  function init(messageHandler) {
    if (WebViewJavascriptBridge._messageHandler) {
      throw Error('WebViewJavascriptBridge.init called twice')
    }

    WebViewJavascriptBridge._messageHandler = messageHandler
    var receivedMessages = receiveMessageQueue
    receiveMessageQueue = null

    for (var i = 0; i < receivedMessages.length; i++) {
      _dispatchMessageFromNative(receivedMessages[i])
    }
  }
  /**
   * send
   * @param {} data
   * @param {Function} responseCallback
   */
  function send(data, responseCallback) {
    _doSend('send', data, responseCallback)
  }
  /**
   * register handler
   * @param {String} handlerName
   * @param {Function} handler
   */
  function registerHandler(handlerName, handler) {
    messageHandlers[handlerName] = handler
  }
  /**
   * call handler at h5 end
   *
   * @param {String} handlerName
   * @param {*} data
   * @param {Function} responseCallback
   */
  function callHandler(handlerName, data, responseCallback) {
    _doSend(handlerName, data, responseCallback)
  }
  /**
   * exec handler by handlerName
   * window[NAMESPACE][handlerName]
   *
   * @param {*} handlerName
   * @param {*} message
   * @param {*} responseCallback
   */
  function _doSend(handlerName, message, responseCallback) {
    var callbackId
    if (typeof responseCallback === 'string') {
      callbackId = responseCallback
    } else if (responseCallback) {
      callbackId = 'cb_' + uniqueId++ + '_' + new Date().getTime()
      responseCallbacks[callbackId] = responseCallback
    } else {
      callbackId = ''
    }

    try {
      var fn = eval('window.JSInvoker.' + handlerName)
    } catch (error) {
      console.log(error)
    }

    if (typeof fn === 'function') {
      var responseData = fn.call(this, JSON.stringify(message), callbackId)
      if (responseData) {
        console.log('response message: ' + responseData)
        responseCallback = responseCallbacks[callbackId]
        if (!responseCallback) {
          return
        }
        responseCallback(responseData)
        delete responseCallbacks[callbackId]
      }
    }
  }
  // dispatch message
  function _dispatchMessageFromNative(messageJSON) {
    setTimeout(function() {
      var message = JSON.parse(messageJSON)
      var responseCallback

      if (message.responseId) {
        responseCallback = responseCallbacks[message.responseId]
        if (!responseCallback) {
          return
        }
        responseCallback(message.responseData)
        delete responseCallbacks[message.responseId]
      } else {
        if (message.callbackId) {
          var callbackResponseId = message.callbackId
          responseCallback = function(responseData) {
            _doSend('response', responseData, callbackResponseId)
          }
        }

        var handler = WebViewJavascriptBridge._messageHandler
        if (message.handlerName) {
          handler = messageHandlers[message.handlerName]
        }

        try {
          handler(message.data, responseCallback)
        } catch (error) {
          if (typeof console != 'undefined') {
            console.log(
              'WebViewJavascriptBridge: WARNING: javascript handler threw.',
              message,
              error
            )
          }
        }
      }
    }, 0)
  }
  /**
   * native to h5
   * @param {*} messageJSON
   */
  function _handleMessageFromNative(messageJSON) {
    if (receiveMessageQueue) {
      receiveMessageQueue.push(messageJSON)
    }
    _dispatchMessageFromNative(messageJSON)
  }

  var receiveMessageQueue = []

  var messageHandlers = {}

  var responseCallbacks = {}

  var uniqueId = 1

  window.WebViewJavascriptBridge = {
    init: init,
    send: send,
    registerHandler: registerHandler,
    callHandler: callHandler,
    _handleMessageFromNative: _handleMessageFromNative,
    _messageHandler: null
  }

  window.JSInvoker = window.JSInvoker || {}

  var readyEvent = document.createEvent('Events')
  readyEvent.initEvent('WebViewJavascriptBridgeReady')
  readyEvent.bridge = window.WebViewJavascriptBridge
  document.dispatchEvent(readyEvent)
})()
