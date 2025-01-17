"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _events = require("events");
var util = _interopRequireWildcard(require("util"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
class Debug extends _events.EventEmitter {
  /*
    @options    Which debug details should be sent.
                data    - dump of packet data
                payload - details of decoded payload
  */
  constructor({
    data = false,
    payload = false,
    packet = false,
    token = false
  } = {}) {
    super();
    this.options = {
      data,
      payload,
      packet,
      token
    };
    this.indent = '  ';
  }
  packet(direction, packet) {
    if (this.haveListeners() && this.options.packet) {
      this.log('');
      this.log(direction);
      this.log(packet.headerToString(this.indent));
    }
  }
  data(packet) {
    if (this.haveListeners() && this.options.data) {
      this.log(packet.dataToString(this.indent));
    }
  }
  payload(generatePayloadText) {
    if (this.haveListeners() && this.options.payload) {
      this.log(generatePayloadText());
    }
  }
  token(token) {
    if (this.haveListeners() && this.options.token) {
      this.log(util.inspect(token, {
        showHidden: false,
        depth: 5,
        colors: true
      }));
    }
  }
  haveListeners() {
    return this.listeners('debug').length > 0;
  }
  log(text) {
    this.emit('debug', text);
  }
}
var _default = Debug;
exports.default = _default;
module.exports = Debug;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfZXZlbnRzIiwicmVxdWlyZSIsInV0aWwiLCJfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZCIsIl9nZXRSZXF1aXJlV2lsZGNhcmRDYWNoZSIsIm5vZGVJbnRlcm9wIiwiV2Vha01hcCIsImNhY2hlQmFiZWxJbnRlcm9wIiwiY2FjaGVOb2RlSW50ZXJvcCIsIm9iaiIsIl9fZXNNb2R1bGUiLCJkZWZhdWx0IiwiY2FjaGUiLCJoYXMiLCJnZXQiLCJuZXdPYmoiLCJoYXNQcm9wZXJ0eURlc2NyaXB0b3IiLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsImdldE93blByb3BlcnR5RGVzY3JpcHRvciIsImtleSIsInByb3RvdHlwZSIsImhhc093blByb3BlcnR5IiwiY2FsbCIsImRlc2MiLCJzZXQiLCJEZWJ1ZyIsIkV2ZW50RW1pdHRlciIsImNvbnN0cnVjdG9yIiwiZGF0YSIsInBheWxvYWQiLCJwYWNrZXQiLCJ0b2tlbiIsIm9wdGlvbnMiLCJpbmRlbnQiLCJkaXJlY3Rpb24iLCJoYXZlTGlzdGVuZXJzIiwibG9nIiwiaGVhZGVyVG9TdHJpbmciLCJkYXRhVG9TdHJpbmciLCJnZW5lcmF0ZVBheWxvYWRUZXh0IiwiaW5zcGVjdCIsInNob3dIaWRkZW4iLCJkZXB0aCIsImNvbG9ycyIsImxpc3RlbmVycyIsImxlbmd0aCIsInRleHQiLCJlbWl0IiwiX2RlZmF1bHQiLCJleHBvcnRzIiwibW9kdWxlIl0sInNvdXJjZXMiOlsiLi4vc3JjL2RlYnVnLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEV2ZW50RW1pdHRlciB9IGZyb20gJ2V2ZW50cyc7XG5pbXBvcnQgKiBhcyB1dGlsIGZyb20gJ3V0aWwnO1xuaW1wb3J0IHsgUGFja2V0IH0gZnJvbSAnLi9wYWNrZXQnO1xuXG5jbGFzcyBEZWJ1ZyBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIGRlY2xhcmUgb3B0aW9uczoge1xuICAgIGRhdGE6IGJvb2xlYW47XG4gICAgcGF5bG9hZDogYm9vbGVhbjtcbiAgICBwYWNrZXQ6IGJvb2xlYW47XG4gICAgdG9rZW46IGJvb2xlYW47XG4gIH07XG5cbiAgZGVjbGFyZSBpbmRlbnQ6IHN0cmluZztcblxuICAvKlxuICAgIEBvcHRpb25zICAgIFdoaWNoIGRlYnVnIGRldGFpbHMgc2hvdWxkIGJlIHNlbnQuXG4gICAgICAgICAgICAgICAgZGF0YSAgICAtIGR1bXAgb2YgcGFja2V0IGRhdGFcbiAgICAgICAgICAgICAgICBwYXlsb2FkIC0gZGV0YWlscyBvZiBkZWNvZGVkIHBheWxvYWRcbiAgKi9cbiAgY29uc3RydWN0b3IoeyBkYXRhID0gZmFsc2UsIHBheWxvYWQgPSBmYWxzZSwgcGFja2V0ID0gZmFsc2UsIHRva2VuID0gZmFsc2UgfSA9IHt9KSB7XG4gICAgc3VwZXIoKTtcblxuICAgIHRoaXMub3B0aW9ucyA9IHsgZGF0YSwgcGF5bG9hZCwgcGFja2V0LCB0b2tlbiB9O1xuICAgIHRoaXMuaW5kZW50ID0gJyAgJztcbiAgfVxuXG4gIHBhY2tldChkaXJlY3Rpb246ICdSZWNlaXZlZCcgfCAnU2VudCcsIHBhY2tldDogUGFja2V0KSB7XG4gICAgaWYgKHRoaXMuaGF2ZUxpc3RlbmVycygpICYmIHRoaXMub3B0aW9ucy5wYWNrZXQpIHtcbiAgICAgIHRoaXMubG9nKCcnKTtcbiAgICAgIHRoaXMubG9nKGRpcmVjdGlvbik7XG4gICAgICB0aGlzLmxvZyhwYWNrZXQuaGVhZGVyVG9TdHJpbmcodGhpcy5pbmRlbnQpKTtcbiAgICB9XG4gIH1cblxuICBkYXRhKHBhY2tldDogUGFja2V0KSB7XG4gICAgaWYgKHRoaXMuaGF2ZUxpc3RlbmVycygpICYmIHRoaXMub3B0aW9ucy5kYXRhKSB7XG4gICAgICB0aGlzLmxvZyhwYWNrZXQuZGF0YVRvU3RyaW5nKHRoaXMuaW5kZW50KSk7XG4gICAgfVxuICB9XG5cbiAgcGF5bG9hZChnZW5lcmF0ZVBheWxvYWRUZXh0OiAoKSA9PiBzdHJpbmcpIHtcbiAgICBpZiAodGhpcy5oYXZlTGlzdGVuZXJzKCkgJiYgdGhpcy5vcHRpb25zLnBheWxvYWQpIHtcbiAgICAgIHRoaXMubG9nKGdlbmVyYXRlUGF5bG9hZFRleHQoKSk7XG4gICAgfVxuICB9XG5cbiAgdG9rZW4odG9rZW46IGFueSkge1xuICAgIGlmICh0aGlzLmhhdmVMaXN0ZW5lcnMoKSAmJiB0aGlzLm9wdGlvbnMudG9rZW4pIHtcbiAgICAgIHRoaXMubG9nKHV0aWwuaW5zcGVjdCh0b2tlbiwgeyBzaG93SGlkZGVuOiBmYWxzZSwgZGVwdGg6IDUsIGNvbG9yczogdHJ1ZSB9KSk7XG4gICAgfVxuICB9XG5cbiAgaGF2ZUxpc3RlbmVycygpIHtcbiAgICByZXR1cm4gdGhpcy5saXN0ZW5lcnMoJ2RlYnVnJykubGVuZ3RoID4gMDtcbiAgfVxuXG4gIGxvZyh0ZXh0OiBzdHJpbmcpIHtcbiAgICB0aGlzLmVtaXQoJ2RlYnVnJywgdGV4dCk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgRGVidWc7XG5tb2R1bGUuZXhwb3J0cyA9IERlYnVnO1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxJQUFBQSxPQUFBLEdBQUFDLE9BQUE7QUFDQSxJQUFBQyxJQUFBLEdBQUFDLHVCQUFBLENBQUFGLE9BQUE7QUFBNkIsU0FBQUcseUJBQUFDLFdBQUEsZUFBQUMsT0FBQSxrQ0FBQUMsaUJBQUEsT0FBQUQsT0FBQSxRQUFBRSxnQkFBQSxPQUFBRixPQUFBLFlBQUFGLHdCQUFBLFlBQUFBLENBQUFDLFdBQUEsV0FBQUEsV0FBQSxHQUFBRyxnQkFBQSxHQUFBRCxpQkFBQSxLQUFBRixXQUFBO0FBQUEsU0FBQUYsd0JBQUFNLEdBQUEsRUFBQUosV0FBQSxTQUFBQSxXQUFBLElBQUFJLEdBQUEsSUFBQUEsR0FBQSxDQUFBQyxVQUFBLFdBQUFELEdBQUEsUUFBQUEsR0FBQSxvQkFBQUEsR0FBQSx3QkFBQUEsR0FBQSw0QkFBQUUsT0FBQSxFQUFBRixHQUFBLFVBQUFHLEtBQUEsR0FBQVIsd0JBQUEsQ0FBQUMsV0FBQSxPQUFBTyxLQUFBLElBQUFBLEtBQUEsQ0FBQUMsR0FBQSxDQUFBSixH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