"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _token = require("./token");

var _colmetadataTokenParser = _interopRequireDefault(require("./colmetadata-token-parser"));

var _doneTokenParser = require("./done-token-parser");

var _envChangeTokenParser = _interopRequireDefault(require("./env-change-token-parser"));

var _infoerrorTokenParser = require("./infoerror-token-parser");

var _fedauthInfoParser = _interopRequireDefault(require("./fedauth-info-parser"));

var _featureExtAckParser = _interopRequireDefault(require("./feature-ext-ack-parser"));

var _loginackTokenParser = _interopRequireDefault(require("./loginack-token-parser"));

var _orderTokenParser = _interopRequireDefault(require("./order-token-parser"));

var _returnstatusTokenParser = _interopRequireDefault(require("./returnstatus-token-parser"));

var _returnvalueTokenParser = _interopRequireDefault(require("./returnvalue-token-parser"));

var _rowTokenParser = _interopRequireDefault(require("./row-token-parser"));

var _nbcrowTokenParser = _interopRequireDefault(require("./nbcrow-token-parser"));

var _sspiTokenParser = _interopRequireDefault(require("./sspi-token-parser"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const tokenParsers = {
  [_token.TYPE.DONE]: _doneTokenParser.doneParser,
  [_token.TYPE.DONEINPROC]: _doneTokenParser.doneInProcParser,
  [_token.TYPE.DONEPROC]: _doneTokenParser.doneProcParser,
  [_token.TYPE.ENVCHANGE]: _envChangeTokenParser.default,
  [_token.TYPE.ERROR]: _infoerrorTokenParser.errorParser,
  [_token.TYPE.FEDAUTHINFO]: _fedauthInfoParser.default,
  [_token.TYPE.FEATUREEXTACK]: _featureExtAckParser.default,
  [_token.TYPE.INFO]: _infoerrorTokenParser.infoParser,
  [_token.TYPE.LOGINACK]: _loginackTokenParser.default,
  [_token.TYPE.ORDER]: _orderTokenParser.default,
  [_token.TYPE.RETURNSTATUS]: _returnstatusTokenParser.default,
  [_token.TYPE.RETURNVALUE]: _returnvalueTokenParser.default,
  [_token.TYPE.SSPI]: _sspiTokenParser.default
};

class StreamBuffer {
  constructor(iterable) {
    this.iterator = void 0;
    this.buffer = void 0;
    this.position = void 0;
    this.iterator = (iterable[Symbol.asyncIterator] || iterable[Symbol.iterator]).call(iterable);
    this.buffer = Buffer.alloc(0);
    this.position = 0;
  }

  async waitForChunk() {
    const result = await this.iterator.next();

    if (result.done) {
      return -1;
    }

    if (this.position === this.buffer.length) {
      this.buffer = result.value;
    } else {
      this.buffer = Buffer.concat([this.buffer.slice(this.position), result.value]);
    }

    this.position = 0;
  }

}

class Parser {
  static async *parseTokens(iterable, debug, options, colMetadata = []) {
    let token;

    const onDoneParsing = t => {
      token = t;
    };

    const streamBuffer = new StreamBuffer(iterable);
    const parser = new Parser(streamBuffer, debug, options);
    parser.colMetadata = colMetadata;

    while (true) {
      try {
        const rc = await streamBuffer.waitForChunk();

        if (rc === -1 && streamBuffer.position === streamBuffer.buffer.length) {
          return;
        }
      } catch (err) {
        if (streamBuffer.position === streamBuffer.buffer.length) {
          return;
        }

        throw err;
      }

      if (parser.suspended) {
        // Unsuspend and continue from where ever we left off.
        parser.suspended = false;
        const next = parser.next;
        next(); // Check if a new token was parsed after unsuspension.

        if (!parser.suspended && token) {
          if (token instanceof _token.ColMetadataToken) {
            parser.colMetadata = token.columns;
          }

          yield token;
        }
      }

      while (!parser.suspended && parser.position + 1 <= parser.buffer.length) {
        const type = parser.buffer.readUInt8(parser.position);
        parser.position += 1;

        if (type === _token.TYPE.COLMETADATA) {
          const token = await (0, _colmetadataTokenParser.default)(parser);
          parser.colMetadata = token.columns;
          yield token;
        } else if (type === _token.TYPE.ROW) {
          yield (0, _rowTokenParser.default)(parser);
        } else if (type === _token.TYPE.NBCROW) {
          yield (0, _nbcrowTokenParser.default)(parser);
        } else if (tokenParsers[type]) {
          tokenParsers[type](parser, parser.options, onDoneParsing); // Check if a new token was parsed after unsuspension.

          if (!parser.suspended && token) {
            if (token instanceof _token.ColMetadataToken) {
              parser.colMetadata = token.columns;
            }

            yield token;
          }
        } else {
          throw new Error('Unknown type: ' + type);
        }
      }
    }
  }

  constructor(streamBuffer, debug, options) {
    this.debug = void 0;
    this.colMetadata = void 0;
    this.options = void 0;
    this.suspended = void 0;
    this.next = void 0;
    this.streamBuffer = void 0;
    this.debug = debug;
    this.colMetadata = [];
    this.options = options;
    this.streamBuffer = streamBuffer;
    this.suspended = false;
    this.next = undefined;
  }

  get buffer() {
    return this.streamBuffer.buffer;
  }

  get position() {
    return this.streamBuffer.position;
  }

  set position(value) {
    this.streamBuffer.position = value;
  }

  suspend(next) {
    this.suspended = true;
    this.next = next;
  }

  awaitData(length, callback) {
    if (this.position + length <= this.buffer.length) {
      callback();
    } else {
      this.suspend(() => {
        this.awaitData(length, callback);
      });
    }
  }

  readInt8(callback) {
    this.awaitData(1, () => {
      const data = this.buffer.readInt8(this.position);
      this.position += 1;
      callback(data);
    });
  }

  readUInt8(callback) {
    this.awaitData(1, () => {
      const data = this.buffer.readUInt8(this.position);
      this.position += 1;
      callback(data);
    });
  }

  readInt16LE(callback) {
    this.awaitData(2, () => {
      const data = this.buffer.readInt16LE(this.position);
      this.position += 2;
      callback(data);
    });
  }

  readInt16BE(callback) {
    this.awaitData(2, () => {
      const data = this.buffer.readInt16BE(this.position);
      this.position += 2;
      callback(data);
    });
  }

  readUInt16LE(callback) {
    this.awaitData(2, () => {
      const data = this.buffer.readUInt16LE(this.position);
      this.position += 2;
      callback(data);
    });
  }

  readUInt16BE(callback) {
    this.awaitData(2, () => {
      const data = this.buffer.readUInt16BE(this.position);
      this.position += 2;
      callback(data);
    });
  }

  readInt32LE(callback) {
    this.awaitData(4, () => {
      const data = this.buffer.readInt32LE(this.position);
      this.position += 4;
      callback(data);
    });
  }

  readInt32BE(callback) {
    this.awaitData(4, () => {
      const data = this.buffer.readInt32BE(this.position);
      this.position += 4;
      callback(data);
    });
  }

  readUInt32LE(callback) {
    this.awaitData(4, () => {
      const data = this.buffer.readUInt32LE(this.position);
      this.position += 4;
      callback(data);
    });
  }

  readUInt32BE(callback) {
    this.awaitData(4, () => {
      const data = this.buffer.readUInt32BE(this.position);
      this.position += 4;
      callback(data);
    });
  }

  readBigInt64LE(callback) {
    this.awaitData(8, () => {
      const data = this.buffer.readBigInt64LE(this.position);
      this.position += 8;
      callback(data);
    });
  }

  readInt64LE(callback) {
    this.awaitData(8, () => {
      const data = Math.pow(2, 32) * this.buffer.readInt32LE(this.position + 4) + ((this.buffer[this.position + 4] & 0x80) === 0x80 ? 1 : -1) * this.buffer.readUInt32LE(this.position);
      this.position += 8;
      callback(data);
    });
  }

  readInt64BE(callback) {
    this.awaitData(8, () => {
      const data = Math.pow(2, 32) * this.buffer.readInt32BE(this.position) + ((this.buffer[this.position] & 0x80) === 0x80 ? 1 : -1) * this.buffer.readUInt32BE(this.position + 4);
      this.position += 8;
      callback(data);
    });
  }

  readBigUInt64LE(callback) {
    this.awaitData(8, () => {
      const data = this.buffer.readBigUInt64LE(this.position);
      this.position += 8;
      callback(data);
    });
  }

  readUInt64LE(callback) {
    this.awaitData(8, () => {
      const data = Math.pow(2, 32) * this.buffer.readUInt32LE(this.position + 4) + this.buffer.readUInt32LE(this.position);
      this.position += 8;
      callback(data);
    });
  }

  readUInt64BE(callback) {
    this.awaitData(8, () => {
      const data = Math.pow(2, 32) * this.buffer.readUInt32BE(this.position) + this.buffer.readUInt32BE(this.position + 4);
      this.position += 8;
      callback(data);
    });
  }

  readFloatLE(callback) {
    this.awaitData(4, () => {
      const data = this.buffer.readFloatLE(this.position);
      this.position += 4;
      callback(data);
    });
  }

  readFloatBE(callback) {
    this.awaitData(4, () => {
      const data = this.buffer.readFloatBE(this.position);
      this.position += 4;
      callback(data);
    });
  }

  readDoubleLE(callback) {
    this.awaitData(8, () => {
      const data = this.buffer.readDoubleLE(this.position);
      this.position += 8;
      callback(data);
    });
  }

  readDoubleBE(callback) {
    this.awaitData(8, () => {
      const data = this.buffer.readDoubleBE(this.position);
      this.position += 8;
      callback(data);
    });
  }

  readUInt24LE(callback) {
    this.awaitData(3, () => {
      const low = this.buffer.readUInt16LE(this.position);
      const high = this.buffer.readUInt8(this.position + 2);
      this.position += 3;
      callback(low | high << 16);
    });
  }

  readUInt40LE(callback) {
    this.awaitData(5, () => {
      const low = this.buffer.readUInt32LE(this.position);
      const high = this.buffer.readUInt8(this.position + 4);
      this.position += 5;
      callback(0x100000000 * high + low);
    });
  }

  readUNumeric64LE(callback) {
    this.awaitData(8, () => {
      const low = this.buffer.readUInt32LE(this.position);
      const high = this.buffer.readUInt32LE(this.position + 4);
      this.position += 8;
      callback(0x100000000 * high + low);
    });
  }

  readUNumeric96LE(callback) {
    this.awaitData(12, () => {
      const dword1 = this.buffer.readUInt32LE(this.position);
      const dword2 = this.buffer.readUInt32LE(this.position + 4);
      const dword3 = this.buffer.readUInt32LE(this.position + 8);
      this.position += 12;
      callback(dword1 + 0x100000000 * dword2 + 0x100000000 * 0x100000000 * dword3);
    });
  }

  readUNumeric128LE(callback) {
    this.awaitData(16, () => {
      const dword1 = this.buffer.readUInt32LE(this.position);
      const dword2 = this.buffer.readUInt32LE(this.position + 4);
      const dword3 = this.buffer.readUInt32LE(this.position + 8);
      const dword4 = this.buffer.readUInt32LE(this.position + 12);
      this.position += 16;
      callback(dword1 + 0x100000000 * dword2 + 0x100000000 * 0x100000000 * dword3 + 0x100000000 * 0x100000000 * 0x100000000 * dword4);
    });
  } // Variable length data


  readBuffer(length, callback) {
    this.awaitData(length, () => {
      const data = this.buffer.slice(this.position, this.position + length);
      this.position += length;
      callback(data);
    });
  } // Read a Unicode String (BVARCHAR)


  readBVarChar(callback) {
    this.readUInt8(length => {
      this.readBuffer(length * 2, data => {
        callback(data.toString('ucs2'));
      });
    });
  } // Read a Unicode String (USVARCHAR)


  readUsVarChar(callback) {
    this.readUInt16LE(length => {
      this.readBuffer(length * 2, data => {
        callback(data.toString('ucs2'));
      });
    });
  } // Read binary data (BVARBYTE)


  readBVarByte(callback) {
    this.readUInt8(length => {
      this.readBuffer(length, callback);
    });
  } // Read binary data (USVARBYTE)


  readUsVarByte(callback) {
    this.readUInt16LE(length => {
      this.readBuffer(length, callback);
    });
  }

}

var _default = Parser;
exports.default = _default;
module.exports = Parser;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJ0b2tlblBhcnNlcnMiLCJUWVBFIiwiRE9ORSIsImRvbmVQYXJzZXIiLCJET05FSU5QUk9DIiwiZG9uZUluUHJvY1BhcnNlciIsIkRPTkVQUk9DIiwiZG9uZVByb2NQYXJzZXIiLCJFTlZDSEFOR0UiLCJlbnZDaGFuZ2VQYXJzZXIiLCJFUlJPUiIsImVycm9yUGFyc2VyIiwiRkVEQVVUSElORk8iLCJmZWRBdXRoSW5mb1BhcnNlciIsIkZFQVRVUkVFWFRBQ0siLCJmZWF0dXJlRXh0QWNrUGFyc2VyIiwiSU5GTyIsImluZm9QYXJzZXIiLCJMT0dJTkFDSyIsImxvZ2luQWNrUGFyc2VyIiwiT1JERVIiLCJvcmRlclBhcnNlciIsIlJFVFVSTlNUQVRVUyIsInJldHVyblN0YXR1c1BhcnNlciIsIlJFVFVSTlZBTFVFIiwicmV0dXJuVmFsdWVQYXJzZXIiLCJTU1BJIiwic3NwaVBhcnNlciIsIlN0cmVhbUJ1ZmZlciIsImNvbnN0cnVjdG9yIiwiaXRlcmFibGUiLCJpdGVyYXRvciIsImJ1ZmZlciIsInBvc2l0aW9uIiwiU3ltYm9sIiwiYXN5bmNJdGVyYXRvciIsImNhbGwiLCJCdWZmZXIiLCJhbGxvYyIsIndhaXRGb3JDaHVuayIsInJlc3VsdCIsIm5leHQiLCJkb25lIiwibGVuZ3RoIiwidmFsdWUiLCJjb25jYXQiLCJzbGljZSIsIlBhcnNlciIsInBhcnNlVG9rZW5zIiwiZGVidWciLCJvcHRpb25zIiwiY29sTWV0YWRhdGEiLCJ0b2tlbiIsIm9uRG9uZVBhcnNpbmciLCJ0Iiwic3RyZWFtQnVmZmVyIiwicGFyc2VyIiwicmMiLCJlcnIiLCJzdXNwZW5kZWQiLCJDb2xNZXRhZGF0YVRva2VuIiwiY29sdW1ucyIsInR5cGUiLCJyZWFkVUludDgiLCJDT0xNRVRBREFUQSIsIlJPVyIsIk5CQ1JPVyIsIkVycm9yIiwidW5kZWZpbmVkIiwic3VzcGVuZCIsImF3YWl0RGF0YSIsImNhbGxiYWNrIiwicmVhZEludDgiLCJkYXRhIiwicmVhZEludDE2TEUiLCJyZWFkSW50MTZCRSIsInJlYWRVSW50MTZMRSIsInJlYWRVSW50MTZCRSIsInJlYWRJbnQzMkxFIiwicmVhZEludDMyQkUiLCJyZWFkVUludDMyTEUiLCJyZWFkVUludDMyQkUiLCJyZWFkQmlnSW50NjRMRSIsInJlYWRJbnQ2NExFIiwiTWF0aCIsInBvdyIsInJlYWRJbnQ2NEJFIiwicmVhZEJpZ1VJbnQ2NExFIiwicmVhZFVJbnQ2NExFIiwicmVhZFVJbnQ2NEJFIiwicmVhZEZsb2F0TEUiLCJyZWFkRmxvYXRCRSIsInJlYWREb3VibGVMRSIsInJlYWREb3VibGVCRSIsInJlYWRVSW50MjRMRSIsImxvdyIsImhpZ2giLCJyZWFkVUludDQwTEUiLCJyZWFkVU51bWVyaWM2NExFIiwicmVhZFVOdW1lcmljOTZMRSIsImR3b3JkMSIsImR3b3JkMiIsImR3b3JkMyIsInJlYWRVTnVtZXJpYzEyOExFIiwiZHdvcmQ0IiwicmVhZEJ1ZmZlciIsInJlYWRCVmFyQ2hhciIsInRvU3RyaW5nIiwicmVhZFVzVmFyQ2hhciIsInJlYWRCVmFyQnl0ZSIsInJlYWRVc1ZhckJ5dGUiLCJtb2R1bGUiLCJleHBvcnRzIl0sInNvdXJjZXMiOlsiLi4vLi4vc3JjL3Rva2VuL3N0cmVhbS1wYXJzZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IERlYnVnIGZyb20gJy4uL2RlYnVnJztcbmltcG9ydCB7IEludGVybmFsQ29ubmVjdGlvbk9wdGlvbnMgfSBmcm9tICcuLi9jb25uZWN0aW9uJztcblxuaW1wb3J0IHsgVFlQRSwgVG9rZW4sIENvbE1ldGFkYXRhVG9rZW4gfSBmcm9tICcuL3Rva2VuJztcblxuaW1wb3J0IGNvbE1ldGFkYXRhUGFyc2VyLCB7IENvbHVtbk1ldGFkYXRhIH0gZnJvbSAnLi9jb2xtZXRhZGF0YS10b2tlbi1wYXJzZXInO1xuaW1wb3J0IHsgZG9uZVBhcnNlciwgZG9uZUluUHJvY1BhcnNlciwgZG9uZVByb2NQYXJzZXIgfSBmcm9tICcuL2RvbmUtdG9rZW4tcGFyc2VyJztcbmltcG9ydCBlbnZDaGFuZ2VQYXJzZXIgZnJvbSAnLi9lbnYtY2hhbmdlLXRva2VuLXBhcnNlcic7XG5pbXBvcnQgeyBlcnJvclBhcnNlciwgaW5mb1BhcnNlciB9IGZyb20gJy4vaW5mb2Vycm9yLXRva2VuLXBhcnNlcic7XG5pbXBvcnQgZmVkQXV0aEluZm9QYXJzZXIgZnJvbSAnLi9mZWRhdXRoLWluZm8tcGFyc2VyJztcbmltcG9ydCBmZWF0dXJlRXh0QWNrUGFyc2VyIGZyb20gJy4vZmVhdHVyZS1leHQtYWNrLXBhcnNlcic7XG5pbXBvcnQgbG9naW5BY2tQYXJzZXIgZnJvbSAnLi9sb2dpbmFjay10b2tlbi1wYXJzZXInO1xuaW1wb3J0IG9yZGVyUGFyc2VyIGZyb20gJy4vb3JkZXItdG9rZW4tcGFyc2VyJztcbmltcG9ydCByZXR1cm5TdGF0dXNQYXJzZXIgZnJvbSAnLi9yZXR1cm5zdGF0dXMtdG9rZW4tcGFyc2VyJztcbmltcG9ydCByZXR1cm5WYWx1ZVBhcnNlciBmcm9tICcuL3JldHVybnZhbHVlLXRva2VuLXBhcnNlcic7XG5pbXBvcnQgcm93UGFyc2VyIGZyb20gJy4vcm93LXRva2VuLXBhcnNlcic7XG5pbXBvcnQgbmJjUm93UGFyc2VyIGZyb20gJy4vbmJjcm93LXRva2VuLXBhcnNlcic7XG5pbXBvcnQgc3NwaVBhcnNlciBmcm9tICcuL3NzcGktdG9rZW4tcGFyc2VyJztcblxuY29uc3QgdG9rZW5QYXJzZXJzID0ge1xuICBbVFlQRS5ET05FXTogZG9uZVBhcnNlcixcbiAgW1RZUEUuRE9ORUlOUFJPQ106IGRvbmVJblByb2NQYXJzZXIsXG4gIFtUWVBFLkRPTkVQUk9DXTogZG9uZVByb2NQYXJzZXIsXG4gIFtUWVBFLkVOVkNIQU5HRV06IGVudkNoYW5nZVBhcnNlcixcbiAgW1RZUEUuRVJST1JdOiBlcnJvclBhcnNlcixcbiAgW1RZUEUuRkVEQVVUSElORk9dOiBmZWRBdXRoSW5mb1BhcnNlcixcbiAgW1RZUEUuRkVBVFVSRUVYVEFDS106IGZlYXR1cmVFeHRBY2tQYXJzZXIsXG4gIFtUWVBFLklORk9dOiBpbmZvUGFyc2VyLFxuICBbVFlQRS5MT0dJTkFDS106IGxvZ2luQWNrUGFyc2VyLFxuICBbVFlQRS5PUkRFUl06IG9yZGVyUGFyc2VyLFxuICBbVFlQRS5SRVRVUk5TVEFUVVNdOiByZXR1cm5TdGF0dXNQYXJzZXIsXG4gIFtUWVBFLlJFVFVSTlZBTFVFXTogcmV0dXJuVmFsdWVQYXJzZXIsXG4gIFtUWVBFLlNTUEldOiBzc3BpUGFyc2VyXG59O1xuXG5leHBvcnQgdHlwZSBQYXJzZXJPcHRpb25zID0gUGljazxJbnRlcm5hbENvbm5lY3Rpb25PcHRpb25zLCAndXNlVVRDJyB8ICdsb3dlckNhc2VHdWlkcycgfCAndGRzVmVyc2lvbicgfCAndXNlQ29sdW1uTmFtZXMnIHwgJ2NvbHVtbk5hbWVSZXBsYWNlcicgfCAnY2FtZWxDYXNlQ29sdW1ucyc+O1xuXG5jbGFzcyBTdHJlYW1CdWZmZXIge1xuICBpdGVyYXRvcjogQXN5bmNJdGVyYXRvcjxCdWZmZXIsIGFueSwgdW5kZWZpbmVkPiB8IEl0ZXJhdG9yPEJ1ZmZlciwgYW55LCB1bmRlZmluZWQ+O1xuICBidWZmZXI6IEJ1ZmZlcjtcbiAgcG9zaXRpb246IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihpdGVyYWJsZTogQXN5bmNJdGVyYWJsZTxCdWZmZXI+IHwgSXRlcmFibGU8QnVmZmVyPikge1xuICAgIHRoaXMuaXRlcmF0b3IgPSAoKGl0ZXJhYmxlIGFzIEFzeW5jSXRlcmFibGU8QnVmZmVyPilbU3ltYm9sLmFzeW5jSXRlcmF0b3JdIHx8IChpdGVyYWJsZSBhcyBJdGVyYWJsZTxCdWZmZXI+KVtTeW1ib2wuaXRlcmF0b3JdKS5jYWxsKGl0ZXJhYmxlKTtcblxuICAgIHRoaXMuYnVmZmVyID0gQnVmZmVyLmFsbG9jKDApO1xuICAgIHRoaXMucG9zaXRpb24gPSAwO1xuICB9XG5cbiAgYXN5bmMgd2FpdEZvckNodW5rKCkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuaXRlcmF0b3IubmV4dCgpO1xuICAgIGlmIChyZXN1bHQuZG9uZSkge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnBvc2l0aW9uID09PSB0aGlzLmJ1ZmZlci5sZW5ndGgpIHtcbiAgICAgIHRoaXMuYnVmZmVyID0gcmVzdWx0LnZhbHVlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmJ1ZmZlciA9IEJ1ZmZlci5jb25jYXQoW3RoaXMuYnVmZmVyLnNsaWNlKHRoaXMucG9zaXRpb24pLCByZXN1bHQudmFsdWVdKTtcbiAgICB9XG4gICAgdGhpcy5wb3NpdGlvbiA9IDA7XG4gIH1cbn1cblxuY2xhc3MgUGFyc2VyIHtcbiAgZGVidWc6IERlYnVnO1xuICBjb2xNZXRhZGF0YTogQ29sdW1uTWV0YWRhdGFbXTtcbiAgb3B0aW9uczogUGFyc2VyT3B0aW9ucztcblxuICBzdXNwZW5kZWQ6IGJvb2xlYW47XG4gIG5leHQ6ICgoKSA9PiB2b2lkKSB8IHVuZGVmaW5lZDtcbiAgc3RyZWFtQnVmZmVyOiBTdHJlYW1CdWZmZXI7XG5cbiAgc3RhdGljIGFzeW5jICpwYXJzZVRva2VucyhpdGVyYWJsZTogQXN5bmNJdGVyYWJsZTxCdWZmZXI+IHwgSXRlcmFibGU8QnVmZmVyPiwgZGVidWc6IERlYnVnLCBvcHRpb25zOiBQYXJzZXJPcHRpb25zLCBjb2xNZXRhZGF0YTogQ29sdW1uTWV0YWRhdGFbXSA9IFtdKSB7XG4gICAgbGV0IHRva2VuOiBUb2tlbiB8IHVuZGVmaW5lZDtcbiAgICBjb25zdCBvbkRvbmVQYXJzaW5nID0gKHQ6IFRva2VuIHwgdW5kZWZpbmVkKSA9PiB7IHRva2VuID0gdDsgfTtcblxuICAgIGNvbnN0IHN0cmVhbUJ1ZmZlciA9IG5ldyBTdHJlYW1CdWZmZXIoaXRlcmFibGUpO1xuXG4gICAgY29uc3QgcGFyc2VyID0gbmV3IFBhcnNlcihzdHJlYW1CdWZmZXIsIGRlYnVnLCBvcHRpb25zKTtcbiAgICBwYXJzZXIuY29sTWV0YWRhdGEgPSBjb2xNZXRhZGF0YTtcblxuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByYyA9IGF3YWl0IHN0cmVhbUJ1ZmZlci53YWl0Rm9yQ2h1bmsoKTtcbiAgICAgICAgaWYgKHJjID09PSAtMSAmJiBzdHJlYW1CdWZmZXIucG9zaXRpb24gPT09IHN0cmVhbUJ1ZmZlci5idWZmZXIubGVuZ3RoKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnI6IHVua25vd24pIHtcbiAgICAgICAgaWYgKHN0cmVhbUJ1ZmZlci5wb3NpdGlvbiA9PT0gc3RyZWFtQnVmZmVyLmJ1ZmZlci5sZW5ndGgpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9XG5cbiAgICAgIGlmIChwYXJzZXIuc3VzcGVuZGVkKSB7XG4gICAgICAgIC8vIFVuc3VzcGVuZCBhbmQgY29udGludWUgZnJvbSB3aGVyZSBldmVyIHdlIGxlZnQgb2ZmLlxuICAgICAgICBwYXJzZXIuc3VzcGVuZGVkID0gZmFsc2U7XG4gICAgICAgIGNvbnN0IG5leHQgPSBwYXJzZXIubmV4dCE7XG5cbiAgICAgICAgbmV4dCgpO1xuXG4gICAgICAgIC8vIENoZWNrIGlmIGEgbmV3IHRva2VuIHdhcyBwYXJzZWQgYWZ0ZXIgdW5zdXNwZW5zaW9uLlxuICAgICAgICBpZiAoIXBhcnNlci5zdXNwZW5kZWQgJiYgdG9rZW4pIHtcbiAgICAgICAgICBpZiAodG9rZW4gaW5zdGFuY2VvZiBDb2xNZXRhZGF0YVRva2VuKSB7XG4gICAgICAgICAgICBwYXJzZXIuY29sTWV0YWRhdGEgPSB0b2tlbi5jb2x1bW5zO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHlpZWxkIHRva2VuO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHdoaWxlICghcGFyc2VyLnN1c3BlbmRlZCAmJiBwYXJzZXIucG9zaXRpb24gKyAxIDw9IHBhcnNlci5idWZmZXIubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IHR5cGUgPSBwYXJzZXIuYnVmZmVyLnJlYWRVSW50OChwYXJzZXIucG9zaXRpb24pO1xuXG4gICAgICAgIHBhcnNlci5wb3NpdGlvbiArPSAxO1xuXG4gICAgICAgIGlmICh0eXBlID09PSBUWVBFLkNPTE1FVEFEQVRBKSB7XG4gICAgICAgICAgY29uc3QgdG9rZW4gPSBhd2FpdCBjb2xNZXRhZGF0YVBhcnNlcihwYXJzZXIpO1xuICAgICAgICAgIHBhcnNlci5jb2xNZXRhZGF0YSA9IHRva2VuLmNvbHVtbnM7XG4gICAgICAgICAgeWllbGQgdG9rZW47XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gVFlQRS5ST1cpIHtcbiAgICAgICAgICB5aWVsZCByb3dQYXJzZXIocGFyc2VyKTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlID09PSBUWVBFLk5CQ1JPVykge1xuICAgICAgICAgIHlpZWxkIG5iY1Jvd1BhcnNlcihwYXJzZXIpO1xuICAgICAgICB9IGVsc2UgaWYgKHRva2VuUGFyc2Vyc1t0eXBlXSkge1xuICAgICAgICAgIHRva2VuUGFyc2Vyc1t0eXBlXShwYXJzZXIsIHBhcnNlci5vcHRpb25zLCBvbkRvbmVQYXJzaW5nKTtcblxuICAgICAgICAgIC8vIENoZWNrIGlmIGEgbmV3IHRva2VuIHdhcyBwYXJzZWQgYWZ0ZXIgdW5zdXNwZW5zaW9uLlxuICAgICAgICAgIGlmICghcGFyc2VyLnN1c3BlbmRlZCAmJiB0b2tlbikge1xuICAgICAgICAgICAgaWYgKHRva2VuIGluc3RhbmNlb2YgQ29sTWV0YWRhdGFUb2tlbikge1xuICAgICAgICAgICAgICBwYXJzZXIuY29sTWV0YWRhdGEgPSB0b2tlbi5jb2x1bW5zO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgeWllbGQgdG9rZW47XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biB0eXBlOiAnICsgdHlwZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb25zdHJ1Y3RvcihzdHJlYW1CdWZmZXI6IFN0cmVhbUJ1ZmZlciwgZGVidWc6IERlYnVnLCBvcHRpb25zOiBQYXJzZXJPcHRpb25zKSB7XG4gICAgdGhpcy5kZWJ1ZyA9IGRlYnVnO1xuICAgIHRoaXMuY29sTWV0YWRhdGEgPSBbXTtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXG4gICAgdGhpcy5zdHJlYW1CdWZmZXIgPSBzdHJlYW1CdWZmZXI7XG4gICAgdGhpcy5zdXNwZW5kZWQgPSBmYWxzZTtcbiAgICB0aGlzLm5leHQgPSB1bmRlZmluZWQ7XG4gIH1cblxuICBnZXQgYnVmZmVyKCkge1xuICAgIHJldHVybiB0aGlzLnN0cmVhbUJ1ZmZlci5idWZmZXI7XG4gIH1cblxuICBnZXQgcG9zaXRpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RyZWFtQnVmZmVyLnBvc2l0aW9uO1xuICB9XG5cbiAgc2V0IHBvc2l0aW9uKHZhbHVlKSB7XG4gICAgdGhpcy5zdHJlYW1CdWZmZXIucG9zaXRpb24gPSB2YWx1ZTtcbiAgfVxuXG4gIHN1c3BlbmQobmV4dDogKCkgPT4gdm9pZCkge1xuICAgIHRoaXMuc3VzcGVuZGVkID0gdHJ1ZTtcbiAgICB0aGlzLm5leHQgPSBuZXh0O1xuICB9XG5cbiAgYXdhaXREYXRhKGxlbmd0aDogbnVtYmVyLCBjYWxsYmFjazogKCkgPT4gdm9pZCkge1xuICAgIGlmICh0aGlzLnBvc2l0aW9uICsgbGVuZ3RoIDw9IHRoaXMuYnVmZmVyLmxlbmd0aCkge1xuICAgICAgY2FsbGJhY2soKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zdXNwZW5kKCgpID0+IHtcbiAgICAgICAgdGhpcy5hd2FpdERhdGEobGVuZ3RoLCBjYWxsYmFjayk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICByZWFkSW50OChjYWxsYmFjazogKGRhdGE6IG51bWJlcikgPT4gdm9pZCkge1xuICAgIHRoaXMuYXdhaXREYXRhKDEsICgpID0+IHtcbiAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLmJ1ZmZlci5yZWFkSW50OCh0aGlzLnBvc2l0aW9uKTtcbiAgICAgIHRoaXMucG9zaXRpb24gKz0gMTtcbiAgICAgIGNhbGxiYWNrKGRhdGEpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVhZFVJbnQ4KGNhbGxiYWNrOiAoZGF0YTogbnVtYmVyKSA9PiB2b2lkKSB7XG4gICAgdGhpcy5hd2FpdERhdGEoMSwgKCkgPT4ge1xuICAgICAgY29uc3QgZGF0YSA9IHRoaXMuYnVmZmVyLnJlYWRVSW50OCh0aGlzLnBvc2l0aW9uKTtcbiAgICAgIHRoaXMucG9zaXRpb24gKz0gMTtcbiAgICAgIGNhbGxiYWNrKGRhdGEpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVhZEludDE2TEUoY2FsbGJhY2s6IChkYXRhOiBudW1iZXIpID0+IHZvaWQpIHtcbiAgICB0aGlzLmF3YWl0RGF0YSgyLCAoKSA9PiB7XG4gICAgICBjb25zdCBkYXRhID0gdGhpcy5idWZmZXIucmVhZEludDE2TEUodGhpcy5wb3NpdGlvbik7XG4gICAgICB0aGlzLnBvc2l0aW9uICs9IDI7XG4gICAgICBjYWxsYmFjayhkYXRhKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlYWRJbnQxNkJFKGNhbGxiYWNrOiAoZGF0YTogbnVtYmVyKSA9PiB2b2lkKSB7XG4gICAgdGhpcy5hd2FpdERhdGEoMiwgKCkgPT4ge1xuICAgICAgY29uc3QgZGF0YSA9IHRoaXMuYnVmZmVyLnJlYWRJbnQxNkJFKHRoaXMucG9zaXRpb24pO1xuICAgICAgdGhpcy5wb3NpdGlvbiArPSAyO1xuICAgICAgY2FsbGJhY2soZGF0YSk7XG4gICAgfSk7XG4gIH1cblxuICByZWFkVUludDE2TEUoY2FsbGJhY2s6IChkYXRhOiBudW1iZXIpID0+IHZvaWQpIHtcbiAgICB0aGlzLmF3YWl0RGF0YSgyLCAoKSA9PiB7XG4gICAgICBjb25zdCBkYXRhID0gdGhpcy5idWZmZXIucmVhZFVJbnQxNkxFKHRoaXMucG9zaXRpb24pO1xuICAgICAgdGhpcy5wb3NpdGlvbiArPSAyO1xuICAgICAgY2FsbGJhY2soZGF0YSk7XG4gICAgfSk7XG4gIH1cblxuICByZWFkVUludDE2QkUoY2FsbGJhY2s6IChkYXRhOiBudW1iZXIpID0+IHZvaWQpIHtcbiAgICB0aGlzLmF3YWl0RGF0YSgyLCAoKSA9PiB7XG4gICAgICBjb25zdCBkYXRhID0gdGhpcy5idWZmZXIucmVhZFVJbnQxNkJFKHRoaXMucG9zaXRpb24pO1xuICAgICAgdGhpcy5wb3NpdGlvbiArPSAyO1xuICAgICAgY2FsbGJhY2soZGF0YSk7XG4gICAgfSk7XG4gIH1cblxuICByZWFkSW50MzJMRShjYWxsYmFjazogKGRhdGE6IG51bWJlcikgPT4gdm9pZCkge1xuICAgIHRoaXMuYXdhaXREYXRhKDQsICgpID0+IHtcbiAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLmJ1ZmZlci5yZWFkSW50MzJMRSh0aGlzLnBvc2l0aW9uKTtcbiAgICAgIHRoaXMucG9zaXRpb24gKz0gNDtcbiAgICAgIGNhbGxiYWNrKGRhdGEpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVhZEludDMyQkUoY2FsbGJhY2s6IChkYXRhOiBudW1iZXIpID0+IHZvaWQpIHtcbiAgICB0aGlzLmF3YWl0RGF0YSg0LCAoKSA9PiB7XG4gICAgICBjb25zdCBkYXRhID0gdGhpcy5idWZmZXIucmVhZEludDMyQkUodGhpcy5wb3NpdGlvbik7XG4gICAgICB0aGlzLnBvc2l0aW9uICs9IDQ7XG4gICAgICBjYWxsYmFjayhkYXRhKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlYWRVSW50MzJMRShjYWxsYmFjazogKGRhdGE6IG51bWJlcikgPT4gdm9pZCkge1xuICAgIHRoaXMuYXdhaXREYXRhKDQsICgpID0+IHtcbiAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLmJ1ZmZlci5yZWFkVUludDMyTEUodGhpcy5wb3NpdGlvbik7XG4gICAgICB0aGlzLnBvc2l0aW9uICs9IDQ7XG4gICAgICBjYWxsYmFjayhkYXRhKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlYWRVSW50MzJCRShjYWxsYmFjazogKGRhdGE6IG51bWJlcikgPT4gdm9pZCkge1xuICAgIHRoaXMuYXdhaXREYXRhKDQsICgpID0+IHtcbiAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLmJ1ZmZlci5yZWFkVUludDMyQkUodGhpcy5wb3NpdGlvbik7XG4gICAgICB0aGlzLnBvc2l0aW9uICs9IDQ7XG4gICAgICBjYWxsYmFjayhkYXRhKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlYWRCaWdJbnQ2NExFKGNhbGxiYWNrOiAoZGF0YTogYmlnaW50KSA9PiB2b2lkKSB7XG4gICAgdGhpcy5hd2FpdERhdGEoOCwgKCkgPT4ge1xuICAgICAgY29uc3QgZGF0YSA9IHRoaXMuYnVmZmVyLnJlYWRCaWdJbnQ2NExFKHRoaXMucG9zaXRpb24pO1xuICAgICAgdGhpcy5wb3NpdGlvbiArPSA4O1xuICAgICAgY2FsbGJhY2soZGF0YSk7XG4gICAgfSk7XG4gIH1cblxuICByZWFkSW50NjRMRShjYWxsYmFjazogKGRhdGE6IG51bWJlcikgPT4gdm9pZCkge1xuICAgIHRoaXMuYXdhaXREYXRhKDgsICgpID0+IHtcbiAgICAgIGNvbnN0IGRhdGEgPSBNYXRoLnBvdygyLCAzMikgKiB0aGlzLmJ1ZmZlci5yZWFkSW50MzJMRSh0aGlzLnBvc2l0aW9uICsgNCkgKyAoKHRoaXMuYnVmZmVyW3RoaXMucG9zaXRpb24gKyA0XSAmIDB4ODApID09PSAweDgwID8gMSA6IC0xKSAqIHRoaXMuYnVmZmVyLnJlYWRVSW50MzJMRSh0aGlzLnBvc2l0aW9uKTtcbiAgICAgIHRoaXMucG9zaXRpb24gKz0gODtcbiAgICAgIGNhbGxiYWNrKGRhdGEpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVhZEludDY0QkUoY2FsbGJhY2s6IChkYXRhOiBudW1iZXIpID0+IHZvaWQpIHtcbiAgICB0aGlzLmF3YWl0RGF0YSg4LCAoKSA9PiB7XG4gICAgICBjb25zdCBkYXRhID0gTWF0aC5wb3coMiwgMzIpICogdGhpcy5idWZmZXIucmVhZEludDMyQkUodGhpcy5wb3NpdGlvbikgKyAoKHRoaXMuYnVmZmVyW3RoaXMucG9zaXRpb25dICYgMHg4MCkgPT09IDB4ODAgPyAxIDogLTEpICogdGhpcy5idWZmZXIucmVhZFVJbnQzMkJFKHRoaXMucG9zaXRpb24gKyA0KTtcbiAgICAgIHRoaXMucG9zaXRpb24gKz0gODtcbiAgICAgIGNhbGxiYWNrKGRhdGEpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVhZEJpZ1VJbnQ2NExFKGNhbGxiYWNrOiAoZGF0YTogYmlnaW50KSA9PiB2b2lkKSB7XG4gICAgdGhpcy5hd2FpdERhdGEoOCwgKCkgPT4ge1xuICAgICAgY29uc3QgZGF0YSA9IHRoaXMuYnVmZmVyLnJlYWRCaWdVSW50NjRMRSh0aGlzLnBvc2l0aW9uKTtcbiAgICAgIHRoaXMucG9zaXRpb24gKz0gODtcbiAgICAgIGNhbGxiYWNrKGRhdGEpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVhZFVJbnQ2NExFKGNhbGxiYWNrOiAoZGF0YTogbnVtYmVyKSA9PiB2b2lkKSB7XG4gICAgdGhpcy5hd2FpdERhdGEoOCwgKCkgPT4ge1xuICAgICAgY29uc3QgZGF0YSA9IE1hdGgucG93KDIsIDMyKSAqIHRoaXMuYnVmZmVyLnJlYWRVSW50MzJMRSh0aGlzLnBvc2l0aW9uICsgNCkgKyB0aGlzLmJ1ZmZlci5yZWFkVUludDMyTEUodGhpcy5wb3NpdGlvbik7XG4gICAgICB0aGlzLnBvc2l0aW9uICs9IDg7XG4gICAgICBjYWxsYmFjayhkYXRhKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlYWRVSW50NjRCRShjYWxsYmFjazogKGRhdGE6IG51bWJlcikgPT4gdm9pZCkge1xuICAgIHRoaXMuYXdhaXREYXRhKDgsICgpID0+IHtcbiAgICAgIGNvbnN0IGRhdGEgPSBNYXRoLnBvdygyLCAzMikgKiB0aGlzLmJ1ZmZlci5yZWFkVUludDMyQkUodGhpcy5wb3NpdGlvbikgKyB0aGlzLmJ1ZmZlci5yZWFkVUludDMyQkUodGhpcy5wb3NpdGlvbiArIDQpO1xuICAgICAgdGhpcy5wb3NpdGlvbiArPSA4O1xuICAgICAgY2FsbGJhY2soZGF0YSk7XG4gICAgfSk7XG4gIH1cblxuICByZWFkRmxvYXRMRShjYWxsYmFjazogKGRhdGE6IG51bWJlcikgPT4gdm9pZCkge1xuICAgIHRoaXMuYXdhaXREYXRhKDQsICgpID0+IHtcbiAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLmJ1ZmZlci5yZWFkRmxvYXRMRSh0aGlzLnBvc2l0aW9uKTtcbiAgICAgIHRoaXMucG9zaXRpb24gKz0gNDtcbiAgICAgIGNhbGxiYWNrKGRhdGEpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVhZEZsb2F0QkUoY2FsbGJhY2s6IChkYXRhOiBudW1iZXIpID0+IHZvaWQpIHtcbiAgICB0aGlzLmF3YWl0RGF0YSg0LCAoKSA9PiB7XG4gICAgICBjb25zdCBkYXRhID0gdGhpcy5idWZmZXIucmVhZEZsb2F0QkUodGhpcy5wb3NpdGlvbik7XG4gICAgICB0aGlzLnBvc2l0aW9uICs9IDQ7XG4gICAgICBjYWxsYmFjayhkYXRhKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlYWREb3VibGVMRShjYWxsYmFjazogKGRhdGE6IG51bWJlcikgPT4gdm9pZCkge1xuICAgIHRoaXMuYXdhaXREYXRhKDgsICgpID0+IHtcbiAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLmJ1ZmZlci5yZWFkRG91YmxlTEUodGhpcy5wb3NpdGlvbik7XG4gICAgICB0aGlzLnBvc2l0aW9uICs9IDg7XG4gICAgICBjYWxsYmFjayhkYXRhKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlYWREb3VibGVCRShjYWxsYmFjazogKGRhdGE6IG51bWJlcikgPT4gdm9pZCkge1xuICAgIHRoaXMuYXdhaXREYXRhKDgsICgpID0+IHtcbiAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLmJ1ZmZlci5yZWFkRG91YmxlQkUodGhpcy5wb3NpdGlvbik7XG4gICAgICB0aGlzLnBvc2l0aW9uICs9IDg7XG4gICAgICBjYWxsYmFjayhkYXRhKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlYWRVSW50MjRMRShjYWxsYmFjazogKGRhdGE6IG51bWJlcikgPT4gdm9pZCkge1xuICAgIHRoaXMuYXdhaXREYXRhKDMsICgpID0+IHtcbiAgICAgIGNvbnN0IGxvdyA9IHRoaXMuYnVmZmVyLnJlYWRVSW50MTZMRSh0aGlzLnBvc2l0aW9uKTtcbiAgICAgIGNvbnN0IGhpZ2ggPSB0aGlzLmJ1ZmZlci5yZWFkVUludDgodGhpcy5wb3NpdGlvbiArIDIpO1xuXG4gICAgICB0aGlzLnBvc2l0aW9uICs9IDM7XG5cbiAgICAgIGNhbGxiYWNrKGxvdyB8IChoaWdoIDw8IDE2KSk7XG4gICAgfSk7XG4gIH1cblxuICByZWFkVUludDQwTEUoY2FsbGJhY2s6IChkYXRhOiBudW1iZXIpID0+IHZvaWQpIHtcbiAgICB0aGlzLmF3YWl0RGF0YSg1LCAoKSA9PiB7XG4gICAgICBjb25zdCBsb3cgPSB0aGlzLmJ1ZmZlci5yZWFkVUludDMyTEUodGhpcy5wb3NpdGlvbik7XG4gICAgICBjb25zdCBoaWdoID0gdGhpcy5idWZmZXIucmVhZFVJbnQ4KHRoaXMucG9zaXRpb24gKyA0KTtcblxuICAgICAgdGhpcy5wb3NpdGlvbiArPSA1O1xuXG4gICAgICBjYWxsYmFjaygoMHgxMDAwMDAwMDAgKiBoaWdoKSArIGxvdyk7XG4gICAgfSk7XG4gIH1cblxuICByZWFkVU51bWVyaWM2NExFKGNhbGxiYWNrOiAoZGF0YTogbnVtYmVyKSA9PiB2b2lkKSB7XG4gICAgdGhpcy5hd2FpdERhdGEoOCwgKCkgPT4ge1xuICAgICAgY29uc3QgbG93ID0gdGhpcy5idWZmZXIucmVhZFVJbnQzMkxFKHRoaXMucG9zaXRpb24pO1xuICAgICAgY29uc3QgaGlnaCA9IHRoaXMuYnVmZmVyLnJlYWRVSW50MzJMRSh0aGlzLnBvc2l0aW9uICsgNCk7XG5cbiAgICAgIHRoaXMucG9zaXRpb24gKz0gODtcblxuICAgICAgY2FsbGJhY2soKDB4MTAwMDAwMDAwICogaGlnaCkgKyBsb3cpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVhZFVOdW1lcmljOTZMRShjYWxsYmFjazogKGRhdGE6IG51bWJlcikgPT4gdm9pZCkge1xuICAgIHRoaXMuYXdhaXREYXRhKDEyLCAoKSA9PiB7XG4gICAgICBjb25zdCBkd29yZDEgPSB0aGlzLmJ1ZmZlci5yZWFkVUludDMyTEUodGhpcy5wb3NpdGlvbik7XG4gICAgICBjb25zdCBkd29yZDIgPSB0aGlzLmJ1ZmZlci5yZWFkVUludDMyTEUodGhpcy5wb3NpdGlvbiArIDQpO1xuICAgICAgY29uc3QgZHdvcmQzID0gdGhpcy5idWZmZXIucmVhZFVJbnQzMkxFKHRoaXMucG9zaXRpb24gKyA4KTtcblxuICAgICAgdGhpcy5wb3NpdGlvbiArPSAxMjtcblxuICAgICAgY2FsbGJhY2soZHdvcmQxICsgKDB4MTAwMDAwMDAwICogZHdvcmQyKSArICgweDEwMDAwMDAwMCAqIDB4MTAwMDAwMDAwICogZHdvcmQzKSk7XG4gICAgfSk7XG4gIH1cblxuICByZWFkVU51bWVyaWMxMjhMRShjYWxsYmFjazogKGRhdGE6IG51bWJlcikgPT4gdm9pZCkge1xuICAgIHRoaXMuYXdhaXREYXRhKDE2LCAoKSA9PiB7XG4gICAgICBjb25zdCBkd29yZDEgPSB0aGlzLmJ1ZmZlci5yZWFkVUludDMyTEUodGhpcy5wb3NpdGlvbik7XG4gICAgICBjb25zdCBkd29yZDIgPSB0aGlzLmJ1ZmZlci5yZWFkVUludDMyTEUodGhpcy5wb3NpdGlvbiArIDQpO1xuICAgICAgY29uc3QgZHdvcmQzID0gdGhpcy5idWZmZXIucmVhZFVJbnQzMkxFKHRoaXMucG9zaXRpb24gKyA4KTtcbiAgICAgIGNvbnN0IGR3b3JkNCA9IHRoaXMuYnVmZmVyLnJlYWRVSW50MzJMRSh0aGlzLnBvc2l0aW9uICsgMTIpO1xuXG4gICAgICB0aGlzLnBvc2l0aW9uICs9IDE2O1xuXG4gICAgICBjYWxsYmFjayhkd29yZDEgKyAoMHgxMDAwMDAwMDAgKiBkd29yZDIpICsgKDB4MTAwMDAwMDAwICogMHgxMDAwMDAwMDAgKiBkd29yZDMpICsgKDB4MTAwMDAwMDAwICogMHgxMDAwMDAwMDAgKiAweDEwMDAwMDAwMCAqIGR3b3JkNCkpO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gVmFyaWFibGUgbGVuZ3RoIGRhdGFcblxuICByZWFkQnVmZmVyKGxlbmd0aDogbnVtYmVyLCBjYWxsYmFjazogKGRhdGE6IEJ1ZmZlcikgPT4gdm9pZCkge1xuICAgIHRoaXMuYXdhaXREYXRhKGxlbmd0aCwgKCkgPT4ge1xuICAgICAgY29uc3QgZGF0YSA9IHRoaXMuYnVmZmVyLnNsaWNlKHRoaXMucG9zaXRpb24sIHRoaXMucG9zaXRpb24gKyBsZW5ndGgpO1xuICAgICAgdGhpcy5wb3NpdGlvbiArPSBsZW5ndGg7XG4gICAgICBjYWxsYmFjayhkYXRhKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIFJlYWQgYSBVbmljb2RlIFN0cmluZyAoQlZBUkNIQVIpXG4gIHJlYWRCVmFyQ2hhcihjYWxsYmFjazogKGRhdGE6IHN0cmluZykgPT4gdm9pZCkge1xuICAgIHRoaXMucmVhZFVJbnQ4KChsZW5ndGgpID0+IHtcbiAgICAgIHRoaXMucmVhZEJ1ZmZlcihsZW5ndGggKiAyLCAoZGF0YSkgPT4ge1xuICAgICAgICBjYWxsYmFjayhkYXRhLnRvU3RyaW5nKCd1Y3MyJykpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvLyBSZWFkIGEgVW5pY29kZSBTdHJpbmcgKFVTVkFSQ0hBUilcbiAgcmVhZFVzVmFyQ2hhcihjYWxsYmFjazogKGRhdGE6IHN0cmluZykgPT4gdm9pZCkge1xuICAgIHRoaXMucmVhZFVJbnQxNkxFKChsZW5ndGgpID0+IHtcbiAgICAgIHRoaXMucmVhZEJ1ZmZlcihsZW5ndGggKiAyLCAoZGF0YSkgPT4ge1xuICAgICAgICBjYWxsYmFjayhkYXRhLnRvU3RyaW5nKCd1Y3MyJykpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvLyBSZWFkIGJpbmFyeSBkYXRhIChCVkFSQllURSlcbiAgcmVhZEJWYXJCeXRlKGNhbGxiYWNrOiAoZGF0YTogQnVmZmVyKSA9PiB2b2lkKSB7XG4gICAgdGhpcy5yZWFkVUludDgoKGxlbmd0aCkgPT4ge1xuICAgICAgdGhpcy5yZWFkQnVmZmVyKGxlbmd0aCwgY2FsbGJhY2spO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gUmVhZCBiaW5hcnkgZGF0YSAoVVNWQVJCWVRFKVxuICByZWFkVXNWYXJCeXRlKGNhbGxiYWNrOiAoZGF0YTogQnVmZmVyKSA9PiB2b2lkKSB7XG4gICAgdGhpcy5yZWFkVUludDE2TEUoKGxlbmd0aCkgPT4ge1xuICAgICAgdGhpcy5yZWFkQnVmZmVyKGxlbmd0aCwgY2FsbGJhY2spO1xuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFBhcnNlcjtcbm1vZHVsZS5leHBvcnRzID0gUGFyc2VyO1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBR0E7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7QUFFQSxNQUFNQSxZQUFZLEdBQUc7RUFDbkIsQ0FBQ0MsWUFBS0MsSUFBTixHQUFhQywyQkFETTtFQUVuQixDQUFDRixZQUFLRyxVQUFOLEdBQW1CQyxpQ0FGQTtFQUduQixDQUFDSixZQUFLSyxRQUFOLEdBQWlCQywrQkFIRTtFQUluQixDQUFDTixZQUFLTyxTQUFOLEdBQWtCQyw2QkFKQztFQUtuQixDQUFDUixZQUFLUyxLQUFOLEdBQWNDLGlDQUxLO0VBTW5CLENBQUNWLFlBQUtXLFdBQU4sR0FBb0JDLDBCQU5EO0VBT25CLENBQUNaLFlBQUthLGFBQU4sR0FBc0JDLDRCQVBIO0VBUW5CLENBQUNkLFlBQUtlLElBQU4sR0FBYUMsZ0NBUk07RUFTbkIsQ0FBQ2hCLFlBQUtpQixRQUFOLEdBQWlCQyw0QkFURTtFQVVuQixDQUFDbEIsWUFBS21CLEtBQU4sR0FBY0MseUJBVks7RUFXbkIsQ0FBQ3BCLFlBQUtxQixZQUFOLEdBQXFCQyxnQ0FYRjtFQVluQixDQUFDdEIsWUFBS3VCLFdBQU4sR0FBb0JDLCtCQVpEO0VBYW5CLENBQUN4QixZQUFLeUIsSUFBTixHQUFhQztBQWJNLENBQXJCOztBQWtCQSxNQUFNQyxZQUFOLENBQW1CO0VBS2pCQyxXQUFXLENBQUNDLFFBQUQsRUFBcUQ7SUFBQSxLQUpoRUMsUUFJZ0U7SUFBQSxLQUhoRUMsTUFHZ0U7SUFBQSxLQUZoRUMsUUFFZ0U7SUFDOUQsS0FBS0YsUUFBTCxHQUFnQixDQUFFRCxRQUFELENBQW9DSSxNQUFNLENBQUNDLGFBQTNDLEtBQThETCxRQUFELENBQStCSSxNQUFNLENBQUNILFFBQXRDLENBQTlELEVBQStHSyxJQUEvRyxDQUFvSE4sUUFBcEgsQ0FBaEI7SUFFQSxLQUFLRSxNQUFMLEdBQWNLLE1BQU0sQ0FBQ0MsS0FBUCxDQUFhLENBQWIsQ0FBZDtJQUNBLEtBQUtMLFFBQUwsR0FBZ0IsQ0FBaEI7RUFDRDs7RUFFaUIsTUFBWk0sWUFBWSxHQUFHO0lBQ25CLE1BQU1DLE1BQU0sR0FBRyxNQUFNLEtBQUtULFFBQUwsQ0FBY1UsSUFBZCxFQUFyQjs7SUFDQSxJQUFJRCxNQUFNLENBQUNFLElBQVgsRUFBaUI7TUFDZixPQUFPLENBQUMsQ0FBUjtJQUNEOztJQUVELElBQUksS0FBS1QsUUFBTCxLQUFrQixLQUFLRCxNQUFMLENBQVlXLE1BQWxDLEVBQTBDO01BQ3hDLEtBQUtYLE1BQUwsR0FBY1EsTUFBTSxDQUFDSSxLQUFyQjtJQUNELENBRkQsTUFFTztNQUNMLEtBQUtaLE1BQUwsR0FBY0ssTUFBTSxDQUFDUSxNQUFQLENBQWMsQ0FBQyxLQUFLYixNQUFMLENBQVljLEtBQVosQ0FBa0IsS0FBS2IsUUFBdkIsQ0FBRCxFQUFtQ08sTUFBTSxDQUFDSSxLQUExQyxDQUFkLENBQWQ7SUFDRDs7SUFDRCxLQUFLWCxRQUFMLEdBQWdCLENBQWhCO0VBQ0Q7O0FBeEJnQjs7QUEyQm5CLE1BQU1jLE1BQU4sQ0FBYTtFQVNjLGNBQVhDLFdBQVcsQ0FBQ2xCLFFBQUQsRUFBcURtQixLQUFyRCxFQUFtRUMsT0FBbkUsRUFBMkZDLFdBQTZCLEdBQUcsRUFBM0gsRUFBK0g7SUFDdEosSUFBSUMsS0FBSjs7SUFDQSxNQUFNQyxhQUFhLEdBQUlDLENBQUQsSUFBMEI7TUFBRUYsS0FBSyxHQUFHRSxDQUFSO0lBQVksQ0FBOUQ7O0lBRUEsTUFBTUMsWUFBWSxHQUFHLElBQUkzQixZQUFKLENBQWlCRSxRQUFqQixDQUFyQjtJQUVBLE1BQU0wQixNQUFNLEdBQUcsSUFBSVQsTUFBSixDQUFXUSxZQUFYLEVBQXlCTixLQUF6QixFQUFnQ0MsT0FBaEMsQ0FBZjtJQUNBTSxNQUFNLENBQUNMLFdBQVAsR0FBcUJBLFdBQXJCOztJQUVBLE9BQU8sSUFBUCxFQUFhO01BQ1gsSUFBSTtRQUNGLE1BQU1NLEVBQUUsR0FBRyxNQUFNRixZQUFZLENBQUNoQixZQUFiLEVBQWpCOztRQUNBLElBQUlrQixFQUFFLEtBQUssQ0FBQyxDQUFSLElBQWFGLFlBQVksQ0FBQ3RCLFFBQWIsS0FBMEJzQixZQUFZLENBQUN2QixNQUFiLENBQW9CVyxNQUEvRCxFQUF1RTtVQUNyRTtRQUNEO01BQ0YsQ0FMRCxDQUtFLE9BQU9lLEdBQVAsRUFBcUI7UUFDckIsSUFBSUgsWUFBWSxDQUFDdEIsUUFBYixLQUEwQnNCLFlBQVksQ0FBQ3ZCLE1BQWIsQ0FBb0JXLE1BQWxELEVBQTBEO1VBQ3hEO1FBQ0Q7O1FBRUQsTUFBTWUsR0FBTjtNQUNEOztNQUVELElBQUlGLE1BQU0sQ0FBQ0csU0FBWCxFQUFzQjtRQUNwQjtRQUNBSCxNQUFNLENBQUNHLFNBQVAsR0FBbUIsS0FBbkI7UUFDQSxNQUFNbEIsSUFBSSxHQUFHZSxNQUFNLENBQUNmLElBQXBCO1FBRUFBLElBQUksR0FMZ0IsQ0FPcEI7O1FBQ0EsSUFBSSxDQUFDZSxNQUFNLENBQUNHLFNBQVIsSUFBcUJQLEtBQXpCLEVBQWdDO1VBQzlCLElBQUlBLEtBQUssWUFBWVEsdUJBQXJCLEVBQXVDO1lBQ3JDSixNQUFNLENBQUNMLFdBQVAsR0FBcUJDLEtBQUssQ0FBQ1MsT0FBM0I7VUFDRDs7VUFFRCxNQUFNVCxLQUFOO1FBQ0Q7TUFDRjs7TUFFRCxPQUFPLENBQUNJLE1BQU0sQ0FBQ0csU0FBUixJQUFxQkgsTUFBTSxDQUFDdkIsUUFBUCxHQUFrQixDQUFsQixJQUF1QnVCLE1BQU0sQ0FBQ3hCLE1BQVAsQ0FBY1csTUFBakUsRUFBeUU7UUFDdkUsTUFBTW1CLElBQUksR0FBR04sTUFBTSxDQUFDeEIsTUFBUCxDQUFjK0IsU0FBZCxDQUF3QlAsTUFBTSxDQUFDdkIsUUFBL0IsQ0FBYjtRQUVBdUIsTUFBTSxDQUFDdkIsUUFBUCxJQUFtQixDQUFuQjs7UUFFQSxJQUFJNkIsSUFBSSxLQUFLN0QsWUFBSytELFdBQWxCLEVBQStCO1VBQzdCLE1BQU1aLEtBQUssR0FBRyxNQUFNLHFDQUFrQkksTUFBbEIsQ0FBcEI7VUFDQUEsTUFBTSxDQUFDTCxXQUFQLEdBQXFCQyxLQUFLLENBQUNTLE9BQTNCO1VBQ0EsTUFBTVQsS0FBTjtRQUNELENBSkQsTUFJTyxJQUFJVSxJQUFJLEtBQUs3RCxZQUFLZ0UsR0FBbEIsRUFBdUI7VUFDNUIsTUFBTSw2QkFBVVQsTUFBVixDQUFOO1FBQ0QsQ0FGTSxNQUVBLElBQUlNLElBQUksS0FBSzdELFlBQUtpRSxNQUFsQixFQUEwQjtVQUMvQixNQUFNLGdDQUFhVixNQUFiLENBQU47UUFDRCxDQUZNLE1BRUEsSUFBSXhELFlBQVksQ0FBQzhELElBQUQsQ0FBaEIsRUFBd0I7VUFDN0I5RCxZQUFZLENBQUM4RCxJQUFELENBQVosQ0FBbUJOLE1BQW5CLEVBQTJCQSxNQUFNLENBQUNOLE9BQWxDLEVBQTJDRyxhQUEzQyxFQUQ2QixDQUc3Qjs7VUFDQSxJQUFJLENBQUNHLE1BQU0sQ0FBQ0csU0FBUixJQUFxQlAsS0FBekIsRUFBZ0M7WUFDOUIsSUFBSUEsS0FBSyxZQUFZUSx1QkFBckIsRUFBdUM7Y0FDckNKLE1BQU0sQ0FBQ0wsV0FBUCxHQUFxQkMsS0FBSyxDQUFDUyxPQUEzQjtZQUNEOztZQUNELE1BQU1ULEtBQU47VUFDRDtRQUNGLENBVk0sTUFVQTtVQUNMLE1BQU0sSUFBSWUsS0FBSixDQUFVLG1CQUFtQkwsSUFBN0IsQ0FBTjtRQUNEO01BQ0Y7SUFDRjtFQUNGOztFQUVEakMsV0FBVyxDQUFDMEIsWUFBRCxFQUE2Qk4sS0FBN0IsRUFBMkNDLE9BQTNDLEVBQW1FO0lBQUEsS0E5RTlFRCxLQThFOEU7SUFBQSxLQTdFOUVFLFdBNkU4RTtJQUFBLEtBNUU5RUQsT0E0RThFO0lBQUEsS0ExRTlFUyxTQTBFOEU7SUFBQSxLQXpFOUVsQixJQXlFOEU7SUFBQSxLQXhFOUVjLFlBd0U4RTtJQUM1RSxLQUFLTixLQUFMLEdBQWFBLEtBQWI7SUFDQSxLQUFLRSxXQUFMLEdBQW1CLEVBQW5CO0lBQ0EsS0FBS0QsT0FBTCxHQUFlQSxPQUFmO0lBRUEsS0FBS0ssWUFBTCxHQUFvQkEsWUFBcEI7SUFDQSxLQUFLSSxTQUFMLEdBQWlCLEtBQWpCO0lBQ0EsS0FBS2xCLElBQUwsR0FBWTJCLFNBQVo7RUFDRDs7RUFFUyxJQUFOcEMsTUFBTSxHQUFHO0lBQ1gsT0FBTyxLQUFLdUIsWUFBTCxDQUFrQnZCLE1BQXpCO0VBQ0Q7O0VBRVcsSUFBUkMsUUFBUSxHQUFHO0lBQ2IsT0FBTyxLQUFLc0IsWUFBTCxDQUFrQnRCLFFBQXpCO0VBQ0Q7O0VBRVcsSUFBUkEsUUFBUSxDQUFDVyxLQUFELEVBQVE7SUFDbEIsS0FBS1csWUFBTCxDQUFrQnRCLFFBQWxCLEdBQTZCVyxLQUE3QjtFQUNEOztFQUVEeUIsT0FBTyxDQUFDNUIsSUFBRCxFQUFtQjtJQUN4QixLQUFLa0IsU0FBTCxHQUFpQixJQUFqQjtJQUNBLEtBQUtsQixJQUFMLEdBQVlBLElBQVo7RUFDRDs7RUFFRDZCLFNBQVMsQ0FBQzNCLE1BQUQsRUFBaUI0QixRQUFqQixFQUF1QztJQUM5QyxJQUFJLEtBQUt0QyxRQUFMLEdBQWdCVSxNQUFoQixJQUEwQixLQUFLWCxNQUFMLENBQVlXLE1BQTFDLEVBQWtEO01BQ2hENEIsUUFBUTtJQUNULENBRkQsTUFFTztNQUNMLEtBQUtGLE9BQUwsQ0FBYSxNQUFNO1FBQ2pCLEtBQUtDLFNBQUwsQ0FBZTNCLE1BQWYsRUFBdUI0QixRQUF2QjtNQUNELENBRkQ7SUFHRDtFQUNGOztFQUVEQyxRQUFRLENBQUNELFFBQUQsRUFBbUM7SUFDekMsS0FBS0QsU0FBTCxDQUFlLENBQWYsRUFBa0IsTUFBTTtNQUN0QixNQUFNRyxJQUFJLEdBQUcsS0FBS3pDLE1BQUwsQ0FBWXdDLFFBQVosQ0FBcUIsS0FBS3ZDLFFBQTFCLENBQWI7TUFDQSxLQUFLQSxRQUFMLElBQWlCLENBQWpCO01BQ0FzQyxRQUFRLENBQUNFLElBQUQsQ0FBUjtJQUNELENBSkQ7RUFLRDs7RUFFRFYsU0FBUyxDQUFDUSxRQUFELEVBQW1DO0lBQzFDLEtBQUtELFNBQUwsQ0FBZSxDQUFmLEVBQWtCLE1BQU07TUFDdEIsTUFBTUcsSUFBSSxHQUFHLEtBQUt6QyxNQUFMLENBQVkrQixTQUFaLENBQXNCLEtBQUs5QixRQUEzQixDQUFiO01BQ0EsS0FBS0EsUUFBTCxJQUFpQixDQUFqQjtNQUNBc0MsUUFBUSxDQUFDRSxJQUFELENBQVI7SUFDRCxDQUpEO0VBS0Q7O0VBRURDLFdBQVcsQ0FBQ0gsUUFBRCxFQUFtQztJQUM1QyxLQUFLRCxTQUFMLENBQWUsQ0FBZixFQUFrQixNQUFNO01BQ3RCLE1BQU1HLElBQUksR0FBRyxLQUFLekMsTUFBTCxDQUFZMEMsV0FBWixDQUF3QixLQUFLekMsUUFBN0IsQ0FBYjtNQUNBLEtBQUtBLFFBQUwsSUFBaUIsQ0FBakI7TUFDQXNDLFFBQVEsQ0FBQ0UsSUFBRCxDQUFSO0lBQ0QsQ0FKRDtFQUtEOztFQUVERSxXQUFXLENBQUNKLFFBQUQsRUFBbUM7SUFDNUMsS0FBS0QsU0FBTCxDQUFlLENBQWYsRUFBa0IsTUFBTTtNQUN0QixNQUFNRyxJQUFJLEdBQUcsS0FBS3pDLE1BQUwsQ0FBWTJDLFdBQVosQ0FBd0IsS0FBSzFDLFFBQTdCLENBQWI7TUFDQSxLQUFLQSxRQUFMLElBQWlCLENBQWpCO01BQ0FzQyxRQUFRLENBQUNFLElBQUQsQ0FBUjtJQUNELENBSkQ7RUFLRDs7RUFFREcsWUFBWSxDQUFDTCxRQUFELEVBQW1DO0lBQzdDLEtBQUtELFNBQUwsQ0FBZSxDQUFmLEVBQWtCLE1BQU07TUFDdEIsTUFBTUcsSUFBSSxHQUFHLEtBQUt6QyxNQUFMLENBQVk0QyxZQUFaLENBQXlCLEtBQUszQyxRQUE5QixDQUFiO01BQ0EsS0FBS0EsUUFBTCxJQUFpQixDQUFqQjtNQUNBc0MsUUFBUSxDQUFDRSxJQUFELENBQVI7SUFDRCxDQUpEO0VBS0Q7O0VBRURJLFlBQVksQ0FBQ04sUUFBRCxFQUFtQztJQUM3QyxLQUFLRCxTQUFMLENBQWUsQ0FBZixFQUFrQixNQUFNO01BQ3RCLE1BQU1HLElBQUksR0FBRyxLQUFLekMsTUFBTCxDQUFZNkMsWUFBWixDQUF5QixLQUFLNUMsUUFBOUIsQ0FBYjtNQUNBLEtBQUtBLFFBQUwsSUFBaUIsQ0FBakI7TUFDQXNDLFFBQVEsQ0FBQ0UsSUFBRCxDQUFSO0lBQ0QsQ0FKRDtFQUtEOztFQUVESyxXQUFXLENBQUNQLFFBQUQsRUFBbUM7SUFDNUMsS0FBS0QsU0FBTCxDQUFlLENBQWYsRUFBa0IsTUFBTTtNQUN0QixNQUFNRyxJQUFJLEdBQUcsS0FBS3pDLE1BQUwsQ0FBWThDLFdBQVosQ0FBd0IsS0FBSzdDLFFBQTdCLENBQWI7TUFDQSxLQUFLQSxRQUFMLElBQWlCLENBQWpCO01BQ0FzQyxRQUFRLENBQUNFLElBQUQsQ0FBUjtJQUNELENBSkQ7RUFLRDs7RUFFRE0sV0FBVyxDQUFDUixRQUFELEVBQW1DO0lBQzVDLEtBQUtELFNBQUwsQ0FBZSxDQUFmLEVBQWtCLE1BQU07TUFDdEIsTUFBTUcsSUFBSSxHQUFHLEtBQUt6QyxNQUFMLENBQVkrQyxXQUFaLENBQXdCLEtBQUs5QyxRQUE3QixDQUFiO01BQ0EsS0FBS0EsUUFBTCxJQUFpQixDQUFqQjtNQUNBc0MsUUFBUSxDQUFDRSxJQUFELENBQVI7SUFDRCxDQUpEO0VBS0Q7O0VBRURPLFlBQVksQ0FBQ1QsUUFBRCxFQUFtQztJQUM3QyxLQUFLRCxTQUFMLENBQWUsQ0FBZixFQUFrQixNQUFNO01BQ3RCLE1BQU1HLElBQUksR0FBRyxLQUFLekMsTUFBTCxDQUFZZ0QsWUFBWixDQUF5QixLQUFLL0MsUUFBOUIsQ0FBYjtNQUNBLEtBQUtBLFFBQUwsSUFBaUIsQ0FBakI7TUFDQXNDLFFBQVEsQ0FBQ0UsSUFBRCxDQUFSO0lBQ0QsQ0FKRDtFQUtEOztFQUVEUSxZQUFZLENBQUNWLFFBQUQsRUFBbUM7SUFDN0MsS0FBS0QsU0FBTCxDQUFlLENBQWYsRUFBa0IsTUFBTTtNQUN0QixNQUFNRyxJQUFJLEdBQUcsS0FBS3pDLE1BQUwsQ0FBWWlELFlBQVosQ0FBeUIsS0FBS2hELFFBQTlCLENBQWI7TUFDQSxLQUFLQSxRQUFMLElBQWlCLENBQWpCO01BQ0FzQyxRQUFRLENBQUNFLElBQUQsQ0FBUjtJQUNELENBSkQ7RUFLRDs7RUFFRFMsY0FBYyxDQUFDWCxRQUFELEVBQW1DO0lBQy9DLEtBQUtELFNBQUwsQ0FBZSxDQUFmLEVBQWtCLE1BQU07TUFDdEIsTUFBTUcsSUFBSSxHQUFHLEtBQUt6QyxNQUFMLENBQVlrRCxjQUFaLENBQTJCLEtBQUtqRCxRQUFoQyxDQUFiO01BQ0EsS0FBS0EsUUFBTCxJQUFpQixDQUFqQjtNQUNBc0MsUUFBUSxDQUFDRSxJQUFELENBQVI7SUFDRCxDQUpEO0VBS0Q7O0VBRURVLFdBQVcsQ0FBQ1osUUFBRCxFQUFtQztJQUM1QyxLQUFLRCxTQUFMLENBQWUsQ0FBZixFQUFrQixNQUFNO01BQ3RCLE1BQU1HLElBQUksR0FBR1csSUFBSSxDQUFDQyxHQUFMLENBQVMsQ0FBVCxFQUFZLEVBQVosSUFBa0IsS0FBS3JELE1BQUwsQ0FBWThDLFdBQVosQ0FBd0IsS0FBSzdDLFFBQUwsR0FBZ0IsQ0FBeEMsQ0FBbEIsR0FBK0QsQ0FBQyxDQUFDLEtBQUtELE1BQUwsQ0FBWSxLQUFLQyxRQUFMLEdBQWdCLENBQTVCLElBQWlDLElBQWxDLE1BQTRDLElBQTVDLEdBQW1ELENBQW5ELEdBQXVELENBQUMsQ0FBekQsSUFBOEQsS0FBS0QsTUFBTCxDQUFZZ0QsWUFBWixDQUF5QixLQUFLL0MsUUFBOUIsQ0FBMUk7TUFDQSxLQUFLQSxRQUFMLElBQWlCLENBQWpCO01BQ0FzQyxRQUFRLENBQUNFLElBQUQsQ0FBUjtJQUNELENBSkQ7RUFLRDs7RUFFRGEsV0FBVyxDQUFDZixRQUFELEVBQW1DO0lBQzVDLEtBQUtELFNBQUwsQ0FBZSxDQUFmLEVBQWtCLE1BQU07TUFDdEIsTUFBTUcsSUFBSSxHQUFHVyxJQUFJLENBQUNDLEdBQUwsQ0FBUyxDQUFULEVBQVksRUFBWixJQUFrQixLQUFLckQsTUFBTCxDQUFZK0MsV0FBWixDQUF3QixLQUFLOUMsUUFBN0IsQ0FBbEIsR0FBMkQsQ0FBQyxDQUFDLEtBQUtELE1BQUwsQ0FBWSxLQUFLQyxRQUFqQixJQUE2QixJQUE5QixNQUF3QyxJQUF4QyxHQUErQyxDQUEvQyxHQUFtRCxDQUFDLENBQXJELElBQTBELEtBQUtELE1BQUwsQ0FBWWlELFlBQVosQ0FBeUIsS0FBS2hELFFBQUwsR0FBZ0IsQ0FBekMsQ0FBbEk7TUFDQSxLQUFLQSxRQUFMLElBQWlCLENBQWpCO01BQ0FzQyxRQUFRLENBQUNFLElBQUQsQ0FBUjtJQUNELENBSkQ7RUFLRDs7RUFFRGMsZUFBZSxDQUFDaEIsUUFBRCxFQUFtQztJQUNoRCxLQUFLRCxTQUFMLENBQWUsQ0FBZixFQUFrQixNQUFNO01BQ3RCLE1BQU1HLElBQUksR0FBRyxLQUFLekMsTUFBTCxDQUFZdUQsZUFBWixDQUE0QixLQUFLdEQsUUFBakMsQ0FBYjtNQUNBLEtBQUtBLFFBQUwsSUFBaUIsQ0FBakI7TUFDQXNDLFFBQVEsQ0FBQ0UsSUFBRCxDQUFSO0lBQ0QsQ0FKRDtFQUtEOztFQUVEZSxZQUFZLENBQUNqQixRQUFELEVBQW1DO0lBQzdDLEtBQUtELFNBQUwsQ0FBZSxDQUFmLEVBQWtCLE1BQU07TUFDdEIsTUFBTUcsSUFBSSxHQUFHVyxJQUFJLENBQUNDLEdBQUwsQ0FBUyxDQUFULEVBQVksRUFBWixJQUFrQixLQUFLckQsTUFBTCxDQUFZZ0QsWUFBWixDQUF5QixLQUFLL0MsUUFBTCxHQUFnQixDQUF6QyxDQUFsQixHQUFnRSxLQUFLRCxNQUFMLENBQVlnRCxZQUFaLENBQXlCLEtBQUsvQyxRQUE5QixDQUE3RTtNQUNBLEtBQUtBLFFBQUwsSUFBaUIsQ0FBakI7TUFDQXNDLFFBQVEsQ0FBQ0UsSUFBRCxDQUFSO0lBQ0QsQ0FKRDtFQUtEOztFQUVEZ0IsWUFBWSxDQUFDbEIsUUFBRCxFQUFtQztJQUM3QyxLQUFLRCxTQUFMLENBQWUsQ0FBZixFQUFrQixNQUFNO01BQ3RCLE1BQU1HLElBQUksR0FBR1csSUFBSSxDQUFDQyxHQUFMLENBQVMsQ0FBVCxFQUFZLEVBQVosSUFBa0IsS0FBS3JELE1BQUwsQ0FBWWlELFlBQVosQ0FBeUIsS0FBS2hELFFBQTlCLENBQWxCLEdBQTRELEtBQUtELE1BQUwsQ0FBWWlELFlBQVosQ0FBeUIsS0FBS2hELFFBQUwsR0FBZ0IsQ0FBekMsQ0FBekU7TUFDQSxLQUFLQSxRQUFMLElBQWlCLENBQWpCO01BQ0FzQyxRQUFRLENBQUNFLElBQUQsQ0FBUjtJQUNELENBSkQ7RUFLRDs7RUFFRGlCLFdBQVcsQ0FBQ25CLFFBQUQsRUFBbUM7SUFDNUMsS0FBS0QsU0FBTCxDQUFlLENBQWYsRUFBa0IsTUFBTTtNQUN0QixNQUFNRyxJQUFJLEdBQUcsS0FBS3pDLE1BQUwsQ0FBWTBELFdBQVosQ0FBd0IsS0FBS3pELFFBQTdCLENBQWI7TUFDQSxLQUFLQSxRQUFMLElBQWlCLENBQWpCO01BQ0FzQyxRQUFRLENBQUNFLElBQUQsQ0FBUjtJQUNELENBSkQ7RUFLRDs7RUFFRGtCLFdBQVcsQ0FBQ3BCLFFBQUQsRUFBbUM7SUFDNUMsS0FBS0QsU0FBTCxDQUFlLENBQWYsRUFBa0IsTUFBTTtNQUN0QixNQUFNRyxJQUFJLEdBQUcsS0FBS3pDLE1BQUwsQ0FBWTJELFdBQVosQ0FBd0IsS0FBSzFELFFBQTdCLENBQWI7TUFDQSxLQUFLQSxRQUFMLElBQWlCLENBQWpCO01BQ0FzQyxRQUFRLENBQUNFLElBQUQsQ0FBUjtJQUNELENBSkQ7RUFLRDs7RUFFRG1CLFlBQVksQ0FBQ3JCLFFBQUQsRUFBbUM7SUFDN0MsS0FBS0QsU0FBTCxDQUFlLENBQWYsRUFBa0IsTUFBTTtNQUN0QixNQUFNRyxJQUFJLEdBQUcsS0FBS3pDLE1BQUwsQ0FBWTRELFlBQVosQ0FBeUIsS0FBSzNELFFBQTlCLENBQWI7TUFDQSxLQUFLQSxRQUFMLElBQWlCLENBQWpCO01BQ0FzQyxRQUFRLENBQUNFLElBQUQsQ0FBUjtJQUNELENBSkQ7RUFLRDs7RUFFRG9CLFlBQVksQ0FBQ3RCLFFBQUQsRUFBbUM7SUFDN0MsS0FBS0QsU0FBTCxDQUFlLENBQWYsRUFBa0IsTUFBTTtNQUN0QixNQUFNRyxJQUFJLEdBQUcsS0FBS3pDLE1BQUwsQ0FBWTZELFlBQVosQ0FBeUIsS0FBSzVELFFBQTlCLENBQWI7TUFDQSxLQUFLQSxRQUFMLElBQWlCLENBQWpCO01BQ0FzQyxRQUFRLENBQUNFLElBQUQsQ0FBUjtJQUNELENBSkQ7RUFLRDs7RUFFRHFCLFlBQVksQ0FBQ3ZCLFFBQUQsRUFBbUM7SUFDN0MsS0FBS0QsU0FBTCxDQUFlLENBQWYsRUFBa0IsTUFBTTtNQUN0QixNQUFNeUIsR0FBRyxHQUFHLEtBQUsvRCxNQUFMLENBQVk0QyxZQUFaLENBQXlCLEtBQUszQyxRQUE5QixDQUFaO01BQ0EsTUFBTStELElBQUksR0FBRyxLQUFLaEUsTUFBTCxDQUFZK0IsU0FBWixDQUFzQixLQUFLOUIsUUFBTCxHQUFnQixDQUF0QyxDQUFiO01BRUEsS0FBS0EsUUFBTCxJQUFpQixDQUFqQjtNQUVBc0MsUUFBUSxDQUFDd0IsR0FBRyxHQUFJQyxJQUFJLElBQUksRUFBaEIsQ0FBUjtJQUNELENBUEQ7RUFRRDs7RUFFREMsWUFBWSxDQUFDMUIsUUFBRCxFQUFtQztJQUM3QyxLQUFLRCxTQUFMLENBQWUsQ0FBZixFQUFrQixNQUFNO01BQ3RCLE1BQU15QixHQUFHLEdBQUcsS0FBSy9ELE1BQUwsQ0FBWWdELFlBQVosQ0FBeUIsS0FBSy9DLFFBQTlCLENBQVo7TUFDQSxNQUFNK0QsSUFBSSxHQUFHLEtBQUtoRSxNQUFMLENBQVkrQixTQUFaLENBQXNCLEtBQUs5QixRQUFMLEdBQWdCLENBQXRDLENBQWI7TUFFQSxLQUFLQSxRQUFMLElBQWlCLENBQWpCO01BRUFzQyxRQUFRLENBQUUsY0FBY3lCLElBQWYsR0FBdUJELEdBQXhCLENBQVI7SUFDRCxDQVBEO0VBUUQ7O0VBRURHLGdCQUFnQixDQUFDM0IsUUFBRCxFQUFtQztJQUNqRCxLQUFLRCxTQUFMLENBQWUsQ0FBZixFQUFrQixNQUFNO01BQ3RCLE1BQU15QixHQUFHLEdBQUcsS0FBSy9ELE1BQUwsQ0FBWWdELFlBQVosQ0FBeUIsS0FBSy9DLFFBQTlCLENBQVo7TUFDQSxNQUFNK0QsSUFBSSxHQUFHLEtBQUtoRSxNQUFMLENBQVlnRCxZQUFaLENBQXlCLEtBQUsvQyxRQUFMLEdBQWdCLENBQXpDLENBQWI7TUFFQSxLQUFLQSxRQUFMLElBQWlCLENBQWpCO01BRUFzQyxRQUFRLENBQUUsY0FBY3lCLElBQWYsR0FBdUJELEdBQXhCLENBQVI7SUFDRCxDQVBEO0VBUUQ7O0VBRURJLGdCQUFnQixDQUFDNUIsUUFBRCxFQUFtQztJQUNqRCxLQUFLRCxTQUFMLENBQWUsRUFBZixFQUFtQixNQUFNO01BQ3ZCLE1BQU04QixNQUFNLEdBQUcsS0FBS3BFLE1BQUwsQ0FBWWdELFlBQVosQ0FBeUIsS0FBSy9DLFFBQTlCLENBQWY7TUFDQSxNQUFNb0UsTUFBTSxHQUFHLEtBQUtyRSxNQUFMLENBQVlnRCxZQUFaLENBQXlCLEtBQUsvQyxRQUFMLEdBQWdCLENBQXpDLENBQWY7TUFDQSxNQUFNcUUsTUFBTSxHQUFHLEtBQUt0RSxNQUFMLENBQVlnRCxZQUFaLENBQXlCLEtBQUsvQyxRQUFMLEdBQWdCLENBQXpDLENBQWY7TUFFQSxLQUFLQSxRQUFMLElBQWlCLEVBQWpCO01BRUFzQyxRQUFRLENBQUM2QixNQUFNLEdBQUksY0FBY0MsTUFBeEIsR0FBbUMsY0FBYyxXQUFkLEdBQTRCQyxNQUFoRSxDQUFSO0lBQ0QsQ0FSRDtFQVNEOztFQUVEQyxpQkFBaUIsQ0FBQ2hDLFFBQUQsRUFBbUM7SUFDbEQsS0FBS0QsU0FBTCxDQUFlLEVBQWYsRUFBbUIsTUFBTTtNQUN2QixNQUFNOEIsTUFBTSxHQUFHLEtBQUtwRSxNQUFMLENBQVlnRCxZQUFaLENBQXlCLEtBQUsvQyxRQUE5QixDQUFmO01BQ0EsTUFBTW9FLE1BQU0sR0FBRyxLQUFLckUsTUFBTCxDQUFZZ0QsWUFBWixDQUF5QixLQUFLL0MsUUFBTCxHQUFnQixDQUF6QyxDQUFmO01BQ0EsTUFBTXFFLE1BQU0sR0FBRyxLQUFLdEUsTUFBTCxDQUFZZ0QsWUFBWixDQUF5QixLQUFLL0MsUUFBTCxHQUFnQixDQUF6QyxDQUFmO01BQ0EsTUFBTXVFLE1BQU0sR0FBRyxLQUFLeEUsTUFBTCxDQUFZZ0QsWUFBWixDQUF5QixLQUFLL0MsUUFBTCxHQUFnQixFQUF6QyxDQUFmO01BRUEsS0FBS0EsUUFBTCxJQUFpQixFQUFqQjtNQUVBc0MsUUFBUSxDQUFDNkIsTUFBTSxHQUFJLGNBQWNDLE1BQXhCLEdBQW1DLGNBQWMsV0FBZCxHQUE0QkMsTUFBL0QsR0FBMEUsY0FBYyxXQUFkLEdBQTRCLFdBQTVCLEdBQTBDRSxNQUFySCxDQUFSO0lBQ0QsQ0FURDtFQVVELENBNVVVLENBOFVYOzs7RUFFQUMsVUFBVSxDQUFDOUQsTUFBRCxFQUFpQjRCLFFBQWpCLEVBQW1EO0lBQzNELEtBQUtELFNBQUwsQ0FBZTNCLE1BQWYsRUFBdUIsTUFBTTtNQUMzQixNQUFNOEIsSUFBSSxHQUFHLEtBQUt6QyxNQUFMLENBQVljLEtBQVosQ0FBa0IsS0FBS2IsUUFBdkIsRUFBaUMsS0FBS0EsUUFBTCxHQUFnQlUsTUFBakQsQ0FBYjtNQUNBLEtBQUtWLFFBQUwsSUFBaUJVLE1BQWpCO01BQ0E0QixRQUFRLENBQUNFLElBQUQsQ0FBUjtJQUNELENBSkQ7RUFLRCxDQXRWVSxDQXdWWDs7O0VBQ0FpQyxZQUFZLENBQUNuQyxRQUFELEVBQW1DO0lBQzdDLEtBQUtSLFNBQUwsQ0FBZ0JwQixNQUFELElBQVk7TUFDekIsS0FBSzhELFVBQUwsQ0FBZ0I5RCxNQUFNLEdBQUcsQ0FBekIsRUFBNkI4QixJQUFELElBQVU7UUFDcENGLFFBQVEsQ0FBQ0UsSUFBSSxDQUFDa0MsUUFBTCxDQUFjLE1BQWQsQ0FBRCxDQUFSO01BQ0QsQ0FGRDtJQUdELENBSkQ7RUFLRCxDQS9WVSxDQWlXWDs7O0VBQ0FDLGFBQWEsQ0FBQ3JDLFFBQUQsRUFBbUM7SUFDOUMsS0FBS0ssWUFBTCxDQUFtQmpDLE1BQUQsSUFBWTtNQUM1QixLQUFLOEQsVUFBTCxDQUFnQjlELE1BQU0sR0FBRyxDQUF6QixFQUE2QjhCLElBQUQsSUFBVTtRQUNwQ0YsUUFBUSxDQUFDRSxJQUFJLENBQUNrQyxRQUFMLENBQWMsTUFBZCxDQUFELENBQVI7TUFDRCxDQUZEO0lBR0QsQ0FKRDtFQUtELENBeFdVLENBMFdYOzs7RUFDQUUsWUFBWSxDQUFDdEMsUUFBRCxFQUFtQztJQUM3QyxLQUFLUixTQUFMLENBQWdCcEIsTUFBRCxJQUFZO01BQ3pCLEtBQUs4RCxVQUFMLENBQWdCOUQsTUFBaEIsRUFBd0I0QixRQUF4QjtJQUNELENBRkQ7RUFHRCxDQS9XVSxDQWlYWDs7O0VBQ0F1QyxhQUFhLENBQUN2QyxRQUFELEVBQW1DO0lBQzlDLEtBQUtLLFlBQUwsQ0FBbUJqQyxNQUFELElBQVk7TUFDNUIsS0FBSzhELFVBQUwsQ0FBZ0I5RCxNQUFoQixFQUF3QjRCLFFBQXhCO0lBQ0QsQ0FGRDtFQUdEOztBQXRYVTs7ZUF5WEV4QixNOztBQUNmZ0UsTUFBTSxDQUFDQyxPQUFQLEdBQWlCakUsTUFBakIifQ==