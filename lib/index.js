"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var _nodeFetch = _interopRequireDefault(require("node-fetch"));

var _ramda = require("ramda");

var _socket = _interopRequireDefault(require("socket.io-client"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _wrapNativeSuper(Class) { var _cache = typeof Map === "function" ? new Map() : undefined; _wrapNativeSuper = function _wrapNativeSuper(Class) { if (Class === null || !_isNativeFunction(Class)) return Class; if (typeof Class !== "function") { throw new TypeError("Super expression must either be null or a function"); } if (typeof _cache !== "undefined") { if (_cache.has(Class)) return _cache.get(Class); _cache.set(Class, Wrapper); } function Wrapper() { return _construct(Class, arguments, _getPrototypeOf(this).constructor); } Wrapper.prototype = Object.create(Class.prototype, { constructor: { value: Wrapper, enumerable: false, writable: true, configurable: true } }); return _setPrototypeOf(Wrapper, Class); }; return _wrapNativeSuper(Class); }

function _construct(Parent, args, Class) { if (_isNativeReflectConstruct()) { _construct = Reflect.construct; } else { _construct = function _construct(Parent, args, Class) { var a = [null]; a.push.apply(a, args); var Constructor = Function.bind.apply(Parent, a); var instance = new Constructor(); if (Class) _setPrototypeOf(instance, Class.prototype); return instance; }; } return _construct.apply(null, arguments); }

function _isNativeFunction(fn) { return Function.toString.call(fn).indexOf("[native code]") !== -1; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var EventEmitter = require('events');

var API_URL = 'https://api.ambientweather.net/';
var AW_API_URL = API_URL + 'v1/devices/';

module.exports = /*#__PURE__*/function (_EventEmitter) {
  _inherits(AmbientWeatherApi, _EventEmitter);

  var _super = _createSuper(AmbientWeatherApi);

  function AmbientWeatherApi(opts) {
    var _this;

    _classCallCheck(this, AmbientWeatherApi);

    var apiKey = opts.apiKey,
        applicationKey = opts.applicationKey;

    if (!apiKey) {
      throw new Error('You need an apiKey');
    }

    if (!applicationKey) {
      throw new Error('You need an applicationKey');
    }

    _this = _super.call(this);
    _this.apiKey = apiKey;
    _this.applicationKey = applicationKey;
    _this.requestQueue = [];
    _this.subscribedDevices = [];
    return _this;
  }

  _createClass(AmbientWeatherApi, [{
    key: "_apiRequest",
    value: function _apiRequest(url) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          (0, _nodeFetch["default"])(url).then(function (res) {
            if (res.ok) {
              return res;
            } else if (res.status == 429) {
              throw new RateLimitError("API Rate Limiting Error: %s %s", res.status, res.statusText);
            } else {
              throw new Error("HTTP Error Response: %s %s", res.status, res.statusText);
            }
          }).then(function (res) {
            return res.json();
          }).then(function (json) {
            _this2.requestQueue = (0, _ramda.filter)((0, _ramda.pipe)((0, _ramda.equals)(url), _ramda.not), _this2.requestQueue);
            resolve(json);
          })["catch"](function (err) {
            if (err instanceof RateLimitError) {
              // handle rate limiting by retrying 2 more times
              if (_this2.requestQueue.length < 3) {
                _this2.requestQueue.push(url);

                resolve(_this2._apiRequest(url).then(resolve));
              } else {
                _this2.requestQueue = (0, _ramda.filter)((0, _ramda.pipe)((0, _ramda.equals)(url), _ramda.not), _this2.requestQueue);
                reject(new RateLimitError("Hit rate limit after 3 retries."));
              }
            } else {
              reject(err);
            }
          });
        }, _this2.requestQueue.length * 1100);
      });
    }
  }, {
    key: "_getUrl",
    value: function _getUrl() {
      var macAddress = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      return AW_API_URL + macAddress + '?apiKey=' + this.apiKey + '&applicationKey=' + this.applicationKey;
    }
  }, {
    key: "userDevices",
    value: function userDevices() {
      return this._apiRequest(this._getUrl());
    }
  }, {
    key: "deviceData",
    value: function deviceData(macAddress, opts) {
      if (!macAddress) {
        throw new Error('You need a macAddress for deviceData');
      }

      var url = this._getUrl(macAddress);

      if (opts) {
        url += '&' + (0, _ramda.pipe)(_ramda.toPairs, (0, _ramda.map)((0, _ramda.join)('=')), (0, _ramda.join)('&'))(opts);
      }

      return this._apiRequest(url);
    }
  }, {
    key: "connect",
    value: function connect() {
      var _this3 = this;

      if (this.socket) {
        return;
      }

      this.socket = (0, _socket["default"])(API_URL + '?api=1&applicationKey=' + this.applicationKey, {
        transports: ['websocket']
      });
      ['error', 'connect'].forEach(function (key) {
        _this3.socket.on(key, function (data) {
          _this3.emit(key, data);
        });
      });
      this.socket.on('subscribed', function (data) {
        _this3.subscribedDevices = data.devices || [];

        _this3.emit('subscribed', data);
      });
      this.socket.on('data', function (data) {
        // find the device this data is for using the macAddress
        data.device = (0, _ramda.find)((0, _ramda.propEq)('macAddress', data.macAddress), _this3.subscribedDevices);

        _this3.emit('data', data);
      });
    }
  }, {
    key: "disconnect",
    value: function disconnect() {
      this.socket.disconnect();
      delete this.socket;
    }
  }, {
    key: "subscribe",
    value: function subscribe(apiKeyOrApiKeys) {
      var apiKeys = Array.isArray(apiKeyOrApiKeys) ? apiKeyOrApiKeys : [apiKeyOrApiKeys];
      this.socket.emit('subscribe', {
        apiKeys: apiKeys
      });
    }
  }, {
    key: "unsubscribe",
    value: function unsubscribe(apiKeyOrApiKeys) {
      var apiKeys = Array.isArray(apiKeyOrApiKeys) ? apiKeyOrApiKeys : [apiKeyOrApiKeys];
      this.socket.emit('unsubscribe', {
        apiKeys: apiKeys
      });
    }
  }]);

  return AmbientWeatherApi;
}(EventEmitter);

var RateLimitError = /*#__PURE__*/function (_Error) {
  _inherits(RateLimitError, _Error);

  var _super2 = _createSuper(RateLimitError);

  function RateLimitError() {
    var _this4;

    _classCallCheck(this, RateLimitError);

    for (var _len = arguments.length, params = new Array(_len), _key = 0; _key < _len; _key++) {
      params[_key] = arguments[_key];
    }

    _this4 = _super2.call.apply(_super2, [this].concat(params));

    if (Error.captureStackTrace) {
      Error.captureStackTrace(_assertThisInitialized(_this4), RateLimitError);
    }

    _this4.name = 'RateLimitError';
    return _this4;
  }

  return RateLimitError;
}( /*#__PURE__*/_wrapNativeSuper(Error));