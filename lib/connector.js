"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.connectInParallel = connectInParallel;
exports.connectInSequence = connectInSequence;
exports.lookupAllAddresses = lookupAllAddresses;
var _net = _interopRequireDefault(require("net"));
var _nodeUrl = _interopRequireDefault(require("node:url"));
var _abortError = _interopRequireDefault(require("./errors/abort-error"));
var _esAggregateError = _interopRequireDefault(require("es-aggregate-error"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
async function connectInParallel(options, lookup, signal) {
  if (signal.aborted) {
    throw new _abortError.default();
  }
  const addresses = await lookupAllAddresses(options.host, lookup, signal);
  return await new Promise((resolve, reject) => {
    const sockets = new Array(addresses.length);
    const errors = [];
    function onError(err) {
      errors.push(err);
      this.removeListener('error', onError);
      this.removeListener('connect', onConnect);
      this.destroy();
      if (errors.length === addresses.length) {
        signal.removeEventListener('abort', onAbort);
        reject(new _esAggregateError.default(errors, 'Could not connect (parallel)'));
      }
    }
    function onConnect() {
      signal.removeEventListener('abort', onAbort);
      for (let j = 0; j < sockets.length; j++) {
        const socket = sockets[j];
        if (this === socket) {
          continue;
        }
        socket.removeListener('error', onError);
        socket.removeListener('connect', onConnect);
        socket.destroy();
      }
      resolve(this);
    }
    const onAbort = () => {
      for (let j = 0; j < sockets.length; j++) {
        const socket = sockets[j];
        socket.removeListener('error', onError);
        socket.removeListener('connect', onConnect);
        socket.destroy();
      }
      reject(new _abortError.default());
    };
    for (let i = 0, len = addresses.length; i < len; i++) {
      const socket = sockets[i] = _net.default.connect({
        ...options,
        host: addresses[i].address,
        family: addresses[i].family
      });
      socket.on('error', onError);
      socket.on('connect', onConnect);
    }
    signal.addEventListener('abort', onAbort, {
      once: true
    });
  });
}
async function connectInSequence(options, lookup, signal) {
  if (signal.aborted) {
    throw new _abortError.default();
  }
  const errors = [];
  const addresses = await lookupAllAddresses(options.host, lookup, signal);
  for (const address of addresses) {
    try {
      return await new Promise((resolve, reject) => {
        const socket = _net.default.connect({
          ...options,
          host: address.address,
          family: address.family
        });
        const onAbort = () => {
          socket.removeListener('error', onError);
          socket.removeListener('connect', onConnect);
          socket.destroy();
          reject(new _abortError.default());
        };
        const onError = err => {
          signal.removeEventListener('abort', onAbort);
          socket.removeListener('error', onError);
          socket.removeListener('connect', onConnect);
          socket.destroy();
          reject(err);
        };
        const onConnect = () => {
          signal.removeEventListener('abort', onAbort);
          socket.removeListener('error', onError);
          socket.removeListener('connect', onConnect);
          resolve(socket);
        };
        signal.addEventListener('abort', onAbort, {
          once: true
        });
        socket.on('error', onError);
        socket.on('connect', onConnect);
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw err;
      }
      errors.push(err);
      continue;
    }
  }
  throw new _esAggregateError.default(errors, 'Could not connect (sequence)');
}

/**
 * Look up all addresses for the given hostname.
 */
async function lookupAllAddresses(host, lookup, signal) {
  if (signal.aborted) {
    throw new _abortError.default();
  }
  if (_net.default.isIPv6(host)) {
    return [{
      address: host,
      family: 6
    }];
  } else if (_net.default.isIPv4(host)) {
    return [{
      address: host,
      family: 4
    }];
  } else {
    return await new Promise((resolve, reject) => {
      const onAbort = () => {
        reject(new _abortError.default());
      };
      signal.addEventListener('abort', onAbort);
      lookup(_nodeUrl.default.domainToASCII(host), {
        all: true
      }, (err, addresses) => {
        signal.removeEventListener('abort', onAbort);
        err ? reject(err) : resolve(addresses);
      });
    });
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfbmV0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfbm9kZVVybCIsIl9hYm9ydEVycm9yIiwiX2VzQWdncmVnYXRlRXJyb3IiLCJvYmoiLCJfX2VzTW9kdWxlIiwiZGVmYXVsdCIsImNvbm5lY3RJblBhcmFsbGVsIiwib3B0aW9ucyIsImxvb2t1cCIsInNpZ25hbCIsImFib3J0ZWQiLCJBYm9ydEVycm9yIiwiYWRkcmVzc2VzIiwibG9va3VwQWxsQWRkcmVzc2VzIiwiaG9zdCIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0Iiwic29ja2V0cyIsIkFycmF5IiwibGVuZ3RoIiwiZXJyb3JzIiwib25FcnJvciIsImVyciIsInB1c2giLCJyZW1vdmVMaXN0ZW5lciIsIm9uQ29ubmVjdCIsImRlc3Ryb3kiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwib25BYm9ydCIsIkFnZ3JlZ2F0ZUVycm9yIiwiaiIsInNvY2tldCIsImkiLCJsZW4iLCJuZXQiLCJjb25uZWN0IiwiYWRkcmVzcyIsImZhbWlseSIsIm9uIiwiYWRkRXZlbnRMaXN0ZW5lciIsIm9uY2UiLCJjb25uZWN0SW5TZXF1ZW5jZSIsIkVycm9yIiwibmFtZSIsImlzSVB2NiIsImlzSVB2NCIsInVybCIsImRvbWFpblRvQVNDSUkiLCJhbGwiXSwic291cmNlcyI6WyIuLi9zcmMvY29ubmVjdG9yLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBuZXQgZnJvbSAnbmV0JztcbmltcG9ydCBkbnMsIHsgdHlwZSBMb29rdXBBZGRyZXNzIH0gZnJvbSAnZG5zJztcblxuaW1wb3J0IHVybCBmcm9tICdub2RlOnVybCc7XG5pbXBvcnQgeyBBYm9ydFNpZ25hbCB9IGZyb20gJ25vZGUtYWJvcnQtY29udHJvbGxlcic7XG5pbXBvcnQgQWJvcnRFcnJvciBmcm9tICcuL2Vycm9ycy9hYm9ydC1lcnJvcic7XG5cbmltcG9ydCBBZ2dyZWdhdGVFcnJvciBmcm9tICdlcy1hZ2dyZWdhdGUtZXJyb3InO1xuXG50eXBlIExvb2t1cEZ1bmN0aW9uID0gKGhvc3RuYW1lOiBzdHJpbmcsIG9wdGlvbnM6IGRucy5Mb29rdXBBbGxPcHRpb25zLCBjYWxsYmFjazogKGVycjogTm9kZUpTLkVycm5vRXhjZXB0aW9uIHwgbnVsbCwgYWRkcmVzc2VzOiBkbnMuTG9va3VwQWRkcmVzc1tdKSA9PiB2b2lkKSA9PiB2b2lkO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29ubmVjdEluUGFyYWxsZWwob3B0aW9uczogeyBob3N0OiBzdHJpbmcsIHBvcnQ6IG51bWJlciwgbG9jYWxBZGRyZXNzPzogc3RyaW5nIHwgdW5kZWZpbmVkIH0sIGxvb2t1cDogTG9va3VwRnVuY3Rpb24sIHNpZ25hbDogQWJvcnRTaWduYWwpIHtcbiAgaWYgKHNpZ25hbC5hYm9ydGVkKSB7XG4gICAgdGhyb3cgbmV3IEFib3J0RXJyb3IoKTtcbiAgfVxuXG4gIGNvbnN0IGFkZHJlc3NlcyA9IGF3YWl0IGxvb2t1cEFsbEFkZHJlc3NlcyhvcHRpb25zLmhvc3QsIGxvb2t1cCwgc2lnbmFsKTtcblxuICByZXR1cm4gYXdhaXQgbmV3IFByb21pc2U8bmV0LlNvY2tldD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNvbnN0IHNvY2tldHMgPSBuZXcgQXJyYXkoYWRkcmVzc2VzLmxlbmd0aCk7XG5cbiAgICBjb25zdCBlcnJvcnM6IEVycm9yW10gPSBbXTtcblxuICAgIGZ1bmN0aW9uIG9uRXJyb3IodGhpczogbmV0LlNvY2tldCwgZXJyOiBFcnJvcikge1xuICAgICAgZXJyb3JzLnB1c2goZXJyKTtcblxuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcignZXJyb3InLCBvbkVycm9yKTtcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoJ2Nvbm5lY3QnLCBvbkNvbm5lY3QpO1xuXG4gICAgICB0aGlzLmRlc3Ryb3koKTtcblxuICAgICAgaWYgKGVycm9ycy5sZW5ndGggPT09IGFkZHJlc3Nlcy5sZW5ndGgpIHtcbiAgICAgICAgc2lnbmFsLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Fib3J0Jywgb25BYm9ydCk7XG5cbiAgICAgICAgcmVqZWN0KG5ldyBBZ2dyZWdhdGVFcnJvcihlcnJvcnMsICdDb3VsZCBub3QgY29ubmVjdCAocGFyYWxsZWwpJykpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9uQ29ubmVjdCh0aGlzOiBuZXQuU29ja2V0KSB7XG4gICAgICBzaWduYWwucmVtb3ZlRXZlbnRMaXN0ZW5lcignYWJvcnQnLCBvbkFib3J0KTtcblxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBzb2NrZXRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGNvbnN0IHNvY2tldCA9IHNvY2tldHNbal07XG5cbiAgICAgICAgaWYgKHRoaXMgPT09IHNvY2tldCkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgc29ja2V0LnJlbW92ZUxpc3RlbmVyKCdlcnJvcicsIG9uRXJyb3IpO1xuICAgICAgICBzb2NrZXQucmVtb3ZlTGlzdGVuZXIoJ2Nvbm5lY3QnLCBvbkNvbm5lY3QpO1xuICAgICAgICBzb2NrZXQuZGVzdHJveSgpO1xuICAgICAgfVxuXG4gICAgICByZXNvbHZlKHRoaXMpO1xuICAgIH1cblxuICAgIGNvbnN0IG9uQWJvcnQgPSAoKSA9PiB7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHNvY2tldHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgY29uc3Qgc29ja2V0ID0gc29ja2V0c1tqXTtcblxuICAgICAgICBzb2NrZXQucmVtb3ZlTGlzdGVuZXIoJ2Vycm9yJywgb25FcnJvcik7XG4gICAgICAgIHNvY2tldC5yZW1vdmVMaXN0ZW5lcignY29ubmVjdCcsIG9uQ29ubmVjdCk7XG5cbiAgICAgICAgc29ja2V0LmRlc3Ryb3koKTtcbiAgICAgIH1cblxuICAgICAgcmVqZWN0KG5ldyBBYm9ydEVycm9yKCkpO1xuICAgIH07XG5cbiAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gYWRkcmVzc2VzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBjb25zdCBzb2NrZXQgPSBzb2NrZXRzW2ldID0gbmV0LmNvbm5lY3Qoe1xuICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICBob3N0OiBhZGRyZXNzZXNbaV0uYWRkcmVzcyxcbiAgICAgICAgZmFtaWx5OiBhZGRyZXNzZXNbaV0uZmFtaWx5XG4gICAgICB9KTtcblxuICAgICAgc29ja2V0Lm9uKCdlcnJvcicsIG9uRXJyb3IpO1xuICAgICAgc29ja2V0Lm9uKCdjb25uZWN0Jywgb25Db25uZWN0KTtcbiAgICB9XG5cbiAgICBzaWduYWwuYWRkRXZlbnRMaXN0ZW5lcignYWJvcnQnLCBvbkFib3J0LCB7IG9uY2U6IHRydWUgfSk7XG4gIH0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29ubmVjdEluU2VxdWVuY2Uob3B0aW9uczogeyBob3N0OiBzdHJpbmcsIHBvcnQ6IG51bWJlciwgbG9jYWxBZGRyZXNzPzogc3RyaW5nIHwgdW5kZWZpbmVkIH0sIGxvb2t1cDogTG9va3VwRnVuY3Rpb24sIHNpZ25hbDogQWJvcnRTaWduYWwpIHtcbiAgaWYgKHNpZ25hbC5hYm9ydGVkKSB7XG4gICAgdGhyb3cgbmV3IEFib3J0RXJyb3IoKTtcbiAgfVxuXG4gIGNvbnN0IGVycm9yczogYW55W10gPSBbXTtcbiAgY29uc3QgYWRkcmVzc2VzID0gYXdhaXQgbG9va3VwQWxsQWRkcmVzc2VzKG9wdGlvbnMuaG9zdCwgbG9va3VwLCBzaWduYWwpO1xuXG4gIGZvciAoY29uc3QgYWRkcmVzcyBvZiBhZGRyZXNzZXMpIHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGF3YWl0IG5ldyBQcm9taXNlPG5ldC5Tb2NrZXQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc3Qgc29ja2V0ID0gbmV0LmNvbm5lY3Qoe1xuICAgICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgICAgaG9zdDogYWRkcmVzcy5hZGRyZXNzLFxuICAgICAgICAgIGZhbWlseTogYWRkcmVzcy5mYW1pbHlcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3Qgb25BYm9ydCA9ICgpID0+IHtcbiAgICAgICAgICBzb2NrZXQucmVtb3ZlTGlzdGVuZXIoJ2Vycm9yJywgb25FcnJvcik7XG4gICAgICAgICAgc29ja2V0LnJlbW92ZUxpc3RlbmVyKCdjb25uZWN0Jywgb25Db25uZWN0KTtcblxuICAgICAgICAgIHNvY2tldC5kZXN0cm95KCk7XG5cbiAgICAgICAgICByZWplY3QobmV3IEFib3J0RXJyb3IoKSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3Qgb25FcnJvciA9IChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgc2lnbmFsLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Fib3J0Jywgb25BYm9ydCk7XG5cbiAgICAgICAgICBzb2NrZXQucmVtb3ZlTGlzdGVuZXIoJ2Vycm9yJywgb25FcnJvcik7XG4gICAgICAgICAgc29ja2V0LnJlbW92ZUxpc3RlbmVyKCdjb25uZWN0Jywgb25Db25uZWN0KTtcblxuICAgICAgICAgIHNvY2tldC5kZXN0cm95KCk7XG5cbiAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBvbkNvbm5lY3QgPSAoKSA9PiB7XG4gICAgICAgICAgc2lnbmFsLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Fib3J0Jywgb25BYm9ydCk7XG5cbiAgICAgICAgICBzb2NrZXQucmVtb3ZlTGlzdGVuZXIoJ2Vycm9yJywgb25FcnJvcik7XG4gICAgICAgICAgc29ja2V0LnJlbW92ZUxpc3RlbmVyKCdjb25uZWN0Jywgb25Db25uZWN0KTtcblxuICAgICAgICAgIHJlc29sdmUoc29ja2V0KTtcbiAgICAgICAgfTtcblxuICAgICAgICBzaWduYWwuYWRkRXZlbnRMaXN0ZW5lcignYWJvcnQnLCBvbkFib3J0LCB7IG9uY2U6IHRydWUgfSk7XG5cbiAgICAgICAgc29ja2V0Lm9uKCdlcnJvcicsIG9uRXJyb3IpO1xuICAgICAgICBzb2NrZXQub24oJ2Nvbm5lY3QnLCBvbkNvbm5lY3QpO1xuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBpZiAoZXJyIGluc3RhbmNlb2YgRXJyb3IgJiYgZXJyLm5hbWUgPT09ICdBYm9ydEVycm9yJykge1xuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9XG5cbiAgICAgIGVycm9ycy5wdXNoKGVycik7XG5cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgfVxuXG4gIHRocm93IG5ldyBBZ2dyZWdhdGVFcnJvcihlcnJvcnMsICdDb3VsZCBub3QgY29ubmVjdCAoc2VxdWVuY2UpJyk7XG59XG5cbi8qKlxuICogTG9vayB1cCBhbGwgYWRkcmVzc2VzIGZvciB0aGUgZ2l2ZW4gaG9zdG5hbWUuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsb29rdXBBbGxBZGRyZXNzZXMoaG9zdDogc3RyaW5nLCBsb29rdXA6IExvb2t1cEZ1bmN0aW9uLCBzaWduYWw6IEFib3J0U2lnbmFsKTogUHJvbWlzZTxkbnMuTG9va3VwQWRkcmVzc1tdPiB7XG4gIGlmIChzaWduYWwuYWJvcnRlZCkge1xuICAgIHRocm93IG5ldyBBYm9ydEVycm9yKCk7XG4gIH1cblxuICBpZiAobmV0LmlzSVB2Nihob3N0KSkge1xuICAgIHJldHVybiBbeyBhZGRyZXNzOiBob3N0LCBmYW1pbHk6IDYgfV07XG4gIH0gZWxzZSBpZiAobmV0LmlzSVB2NChob3N0KSkge1xuICAgIHJldHVybiBbeyBhZGRyZXNzOiBob3N0LCBmYW1pbHk6IDQgfV07XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGF3YWl0IG5ldyBQcm9taXNlPExvb2t1cEFkZHJlc3NbXT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3Qgb25BYm9ydCA9ICgpID0+IHtcbiAgICAgICAgcmVqZWN0KG5ldyBBYm9ydEVycm9yKCkpO1xuICAgICAgfTtcblxuICAgICAgc2lnbmFsLmFkZEV2ZW50TGlzdGVuZXIoJ2Fib3J0Jywgb25BYm9ydCk7XG5cbiAgICAgIGxvb2t1cCh1cmwuZG9tYWluVG9BU0NJSShob3N0KSwgeyBhbGw6IHRydWUgfSwgKGVyciwgYWRkcmVzc2VzKSA9PiB7XG4gICAgICAgIHNpZ25hbC5yZW1vdmVFdmVudExpc3RlbmVyKCdhYm9ydCcsIG9uQWJvcnQpO1xuXG4gICAgICAgIGVyciA/IHJlamVjdChlcnIpIDogcmVzb2x2ZShhZGRyZXNzZXMpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQSxJQUFBQSxJQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFHQSxJQUFBQyxRQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFFQSxJQUFBRSxXQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7QUFFQSxJQUFBRyxpQkFBQSxHQUFBSixzQkFBQSxDQUFBQyxPQUFBO0FBQWdELFNBQUFELHVCQUFBSyxHQUFBLFdBQUFBLEdBQUEsSUFBQUEsR0FBQSxDQUFBQyxVQUFBLEdBQUFELEdBQUEsS0FBQUUsT0FBQSxFQUFBRixHQUFBO0FBSXpDLGVBQWVHLGlCQUFpQkEsQ0FBQ0MsT0FBMEUsRUFBRUMsTUFBc0IsRUFBRUMsTUFBbUIsRUFBRTtFQUMvSixJQUFJQSxNQUFNLENBQUNDLE9BQU8sRUFBRTtJQUNsQixNQUFNLElBQUlDLG1CQUFVLENBQUMsQ0FBQztFQUN4QjtFQUVBLE1BQU1DLFNBQVMsR0FBRyxNQUFNQyxrQkFBa0IsQ0FBQ04sT0FBTyxDQUFDTyxJQUFJLEVBQUVOLE1BQU0sRUFBRUMsTUFBTSxDQUFDO0VBRXhFLE9BQU8sTUFBTSxJQUFJTSxPQUFPLENBQWEsQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7SUFDeEQsTUFBTUMsT0FBTyxHQUFHLElBQUlDLEtBQUssQ0FBQ1AsU0FBUyxDQUFDUSxNQUFNLENBQUM7SUFFM0MsTUFBTUMsTUFBZSxHQUFHLEVBQUU7SUFFMUIsU0FBU0MsT0FBT0EsQ0FBbUJDLEdBQVUsRUFBRTtNQUM3Q0YsTUFBTSxDQUFDRyxJQUFJLENBQUNELEdBQUcsQ0FBQztNQUVoQixJQUFJLENBQUNFLGNBQWMsQ0FBQyxPQUFPLEVBQUVILE9BQU8sQ0FBQztNQUNyQyxJQUFJLENBQUNHLGNBQWMsQ0FBQyxTQUFTLEVBQUVDLFNBQVMsQ0FBQztNQUV6QyxJQUFJLENBQUNDLE9BQU8sQ0FBQyxDQUFDO01BRWQsSUFBSU4sTUFBTSxDQUFDRCxNQUFNLEtBQUtSLFNBQVMsQ0FBQ1EsTUFBTSxFQUFFO1FBQ3RDWCxNQUFNLENBQUNtQixtQkFBbUIsQ0FBQyxPQUFPLEVBQUVDLE9BQU8sQ0FBQztRQUU1Q1osTUFBTSxDQUFDLElBQUlhLHlCQUFjLENBQUNULE1BQU0sRUFBRSw4QkFBOEIsQ0FBQyxDQUFDO01BQ3BFO0lBQ0Y7SUFFQSxTQUFTSyxTQUFTQSxDQUFBLEVBQW1CO01BQ25DakIsTUFBTSxDQUFDbUIsbUJBQW1CLENBQUMsT0FBTyxFQUFFQyxPQUFPLENBQUM7TUFFNUMsS0FBSyxJQUFJRSxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUdiLE9BQU8sQ0FBQ0UsTUFBTSxFQUFFVyxDQUFDLEVBQUUsRUFBRTtRQUN2QyxNQUFNQyxNQUFNLEdBQUdkLE9BQU8sQ0FBQ2EsQ0FBQyxDQUFDO1FBRXpCLElBQUksSUFBSSxLQUFLQyxNQUFNLEVBQUU7VUFDbkI7UUFDRjtRQUVBQSxNQUFNLENBQUNQLGNBQWMsQ0FBQyxPQUFPLEVBQUVILE9BQU8sQ0FBQztRQUN2Q1UsTUFBTSxDQUFDUCxjQUFjLENBQUMsU0FBUyxFQUFFQyxTQUFTLENBQUM7UUFDM0NNLE1BQU0sQ0FBQ0wsT0FBTyxDQUFDLENBQUM7TUFDbEI7TUFFQVgsT0FBTyxDQUFDLElBQUksQ0FBQztJQUNmO0lBRUEsTUFBTWEsT0FBTyxHQUFHQSxDQUFBLEtBQU07TUFDcEIsS0FBSyxJQUFJRSxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUdiLE9BQU8sQ0FBQ0UsTUFBTSxFQUFFVyxDQUFDLEVBQUUsRUFBRTtRQUN2QyxNQUFNQyxNQUFNLEdBQUdkLE9BQU8sQ0FBQ2EsQ0FBQyxDQUFDO1FBRXpCQyxNQUFNLENBQUNQLGNBQWMsQ0FBQyxPQUFPLEVBQUVILE9BQU8sQ0FBQztRQUN2Q1UsTUFBTSxDQUFDUCxjQUFjLENBQUMsU0FBUyxFQUFFQyxTQUFTLENBQUM7UUFFM0NNLE1BQU0sQ0FBQ0wsT0FBTyxDQUFDLENBQUM7TUFDbEI7TUFFQVYsTUFBTSxDQUFDLElBQUlOLG1CQUFVLENBQUMsQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFFRCxLQUFLLElBQUlzQixDQUFDLEdBQUcsQ0FBQyxFQUFFQyxHQUFHLEdBQUd0QixTQUFTLENBQUNRLE1BQU0sRUFBRWEsQ0FBQyxHQUFHQyxHQUFHLEVBQUVELENBQUMsRUFBRSxFQUFFO01BQ3BELE1BQU1ELE1BQU0sR0FBR2QsT0FBTyxDQUFDZSxDQUFDLENBQUMsR0FBR0UsWUFBRyxDQUFDQyxPQUFPLENBQUM7UUFDdEMsR0FBRzdCLE9BQU87UUFDVk8sSUFBSSxFQUFFRixTQUFTLENBQUNxQixDQUFDLENBQUMsQ0FBQ0ksT0FBTztRQUMxQkMsTUFBTSxFQUFFMUIsU0FBUyxDQUFDcUIsQ0FBQyxDQUFDLENBQUNLO01BQ3ZCLENBQUMsQ0FBQztNQUVGTixNQUFNLENBQUNPLEVBQUUsQ0FBQyxPQUFPLEVBQUVqQixPQUFPLENBQUM7TUFDM0JVLE1BQU0sQ0FBQ08sRUFBRSxDQUFDLFNBQVMsRUFBRWIsU0FBUyxDQUFDO0lBQ2pDO0lBRUFqQixNQUFNLENBQUMrQixnQkFBZ0IsQ0FBQyxPQUFPLEVBQUVYLE9BQU8sRUFBRTtNQUFFWSxJQUFJLEVBQUU7SUFBSyxDQUFDLENBQUM7RUFDM0QsQ0FBQyxDQUFDO0FBQ0o7QUFFTyxlQUFlQyxpQkFBaUJBLENBQUNuQyxPQUEwRSxFQUFFQyxNQUFzQixFQUFFQyxNQUFtQixFQUFFO0VBQy9KLElBQUlBLE1BQU0sQ0FBQ0MsT0FBTyxFQUFFO0lBQ2xCLE1BQU0sSUFBSUMsbUJBQVUsQ0FBQyxDQUFDO0VBQ3hCO0VBRUEsTUFBTVUsTUFBYSxHQUFHLEVBQUU7RUFDeEIsTUFBTVQsU0FBUyxHQUFHLE1BQU1DLGtCQUFrQixDQUFDTixPQUFPLENBQUNPLElBQUksRUFBRU4sTUFBTSxFQUFFQyxNQUFNLENBQUM7RUFFeEUsS0FBSyxNQUFNNEIsT0FBTyxJQUFJekIsU0FBUyxFQUFFO0lBQy9CLElBQUk7TUFDRixPQUFPLE1BQU0sSUFBSUcsT0FBTyxDQUFhLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLO1FBQ3hELE1BQU1lLE1BQU0sR0FBR0csWUFBRyxDQUFDQyxPQUFPLENBQUM7VUFDekIsR0FBRzdCLE9BQU87VUFDVk8sSUFBSSxFQUFFdUIsT0FBTyxDQUFDQSxPQUFPO1VBQ3JCQyxNQUFNLEVBQUVELE9BQU8sQ0FBQ0M7UUFDbEIsQ0FBQyxDQUFDO1FBRUYsTUFBTVQsT0FBTyxHQUFHQSxDQUFBLEtBQU07VUFDcEJHLE1BQU0sQ0FBQ1AsY0FBYyxDQUFDLE9BQU8sRUFBRUgsT0FBTyxDQUFDO1VBQ3ZDVSxNQUFNLENBQUNQLGNBQWMsQ0FBQyxTQUFTLEVBQUVDLFNBQVMsQ0FBQztVQUUzQ00sTUFBTSxDQUFDTCxPQUFPLENBQUMsQ0FBQztVQUVoQlYsTUFBTSxDQUFDLElBQUlOLG1CQUFVLENBQUMsQ0FBQyxDQUFDO1FBQzFCLENBQUM7UUFFRCxNQUFNVyxPQUFPLEdBQUlDLEdBQVUsSUFBSztVQUM5QmQsTUFBTSxDQUFDbUIsbUJBQW1CLENBQUMsT0FBTyxFQUFFQyxPQUFPLENBQUM7VUFFNUNHLE1BQU0sQ0FBQ1AsY0FBYyxDQUFDLE9BQU8sRUFBRUgsT0FBTyxDQUFDO1VBQ3ZDVSxNQUFNLENBQUNQLGNBQWMsQ0FBQyxTQUFTLEVBQUVDLFNBQVMsQ0FBQztVQUUzQ00sTUFBTSxDQUFDTCxPQUFPLENBQUMsQ0FBQztVQUVoQlYsTUFBTSxDQUFDTSxHQUFHLENBQUM7UUFDYixDQUFDO1FBRUQsTUFBTUcsU0FBUyxHQUFHQSxDQUFBLEtBQU07VUFDdEJqQixNQUFNLENBQUNtQixtQkFBbUIsQ0FBQyxPQUFPLEVBQUVDLE9BQU8sQ0FBQztVQUU1Q0csTUFBTSxDQUFDUCxjQUFjLENBQUMsT0FBTyxFQUFFSCxPQUFPLENBQUM7VUFDdkNVLE1BQU0sQ0FBQ1AsY0FBYyxDQUFDLFNBQVMsRUFBRUMsU0FBUyxDQUFDO1VBRTNDVixPQUFPLENBQUNnQixNQUFNLENBQUM7UUFDakIsQ0FBQztRQUVEdkIsTUFBTSxDQUFDK0IsZ0JBQWdCLENBQUMsT0FBTyxFQUFFWCxPQUFPLEVBQUU7VUFBRVksSUFBSSxFQUFFO1FBQUssQ0FBQyxDQUFDO1FBRXpEVCxNQUFNLENBQUNPLEVBQUUsQ0FBQyxPQUFPLEVBQUVqQixPQUFPLENBQUM7UUFDM0JVLE1BQU0sQ0FBQ08sRUFBRSxDQUFDLFNBQVMsRUFBRWIsU0FBUyxDQUFDO01BQ2pDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxPQUFPSCxHQUFHLEVBQUU7TUFDWixJQUFJQSxHQUFHLFlBQVlvQixLQUFLLElBQUlwQixHQUFHLENBQUNxQixJQUFJLEtBQUssWUFBWSxFQUFFO1FBQ3JELE1BQU1yQixHQUFHO01BQ1g7TUFFQUYsTUFBTSxDQUFDRyxJQUFJLENBQUNELEdBQUcsQ0FBQztNQUVoQjtJQUNGO0VBQ0Y7RUFFQSxNQUFNLElBQUlPLHlCQUFjLENBQUNULE1BQU0sRUFBRSw4QkFBOEIsQ0FBQztBQUNsRTs7QUFFQTtBQUNBO0FBQ0E7QUFDTyxlQUFlUixrQkFBa0JBLENBQUNDLElBQVksRUFBRU4sTUFBc0IsRUFBRUMsTUFBbUIsRUFBZ0M7RUFDaEksSUFBSUEsTUFBTSxDQUFDQyxPQUFPLEVBQUU7SUFDbEIsTUFBTSxJQUFJQyxtQkFBVSxDQUFDLENBQUM7RUFDeEI7RUFFQSxJQUFJd0IsWUFBRyxDQUFDVSxNQUFNLENBQUMvQixJQUFJLENBQUMsRUFBRTtJQUNwQixPQUFPLENBQUM7TUFBRXVCLE9BQU8sRUFBRXZCLElBQUk7TUFBRXdCLE1BQU0sRUFBRTtJQUFFLENBQUMsQ0FBQztFQUN2QyxDQUFDLE1BQU0sSUFBSUgsWUFBRyxDQUFDVyxNQUFNLENBQUNoQyxJQUFJLENBQUMsRUFBRTtJQUMzQixPQUFPLENBQUM7TUFBRXVCLE9BQU8sRUFBRXZCLElBQUk7TUFBRXdCLE1BQU0sRUFBRTtJQUFFLENBQUMsQ0FBQztFQUN2QyxDQUFDLE1BQU07SUFDTCxPQUFPLE1BQU0sSUFBSXZCLE9BQU8sQ0FBa0IsQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7TUFDN0QsTUFBTVksT0FBTyxHQUFHQSxDQUFBLEtBQU07UUFDcEJaLE1BQU0sQ0FBQyxJQUFJTixtQkFBVSxDQUFDLENBQUMsQ0FBQztNQUMxQixDQUFDO01BRURGLE1BQU0sQ0FBQytCLGdCQUFnQixDQUFDLE9BQU8sRUFBRVgsT0FBTyxDQUFDO01BRXpDckIsTUFBTSxDQUFDdUMsZ0JBQUcsQ0FBQ0MsYUFBYSxDQUFDbEMsSUFBSSxDQUFDLEVBQUU7UUFBRW1DLEdBQUcsRUFBRTtNQUFLLENBQUMsRUFBRSxDQUFDMUIsR0FBRyxFQUFFWCxTQUFTLEtBQUs7UUFDakVILE1BQU0sQ0FBQ21CLG1CQUFtQixDQUFDLE9BQU8sRUFBRUMsT0FBTyxDQUFDO1FBRTVDTixHQUFHLEdBQUdOLE1BQU0sQ0FBQ00sR0FBRyxDQUFDLEdBQUdQLE9BQU8sQ0FBQ0osU0FBUyxDQUFDO01BQ3hDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKO0FBQ0YifQ==