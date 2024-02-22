"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _bl = _interopRequireDefault(require("bl"));
var _stream = require("stream");
var _packet = require("./packet");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
class OutgoingMessageStream extends _stream.Duplex {
  constructor(debug, {
    packetSize
  }) {
    super({
      writableObjectMode: true
    });
    this.packetSize = packetSize;
    this.debug = debug;
    this.bl = new _bl.default();

    // When the writable side is ended, push `null`
    // to also end the readable side.
    this.on('finish', () => {
      this.push(null);
    });
  }
  _write(message, _encoding, callback) {
    const length = this.packetSize - _packet.HEADER_LENGTH;
    let packetNumber = 0;
    this.currentMessage = message;
    this.currentMessage.on('data', data => {
      if (message.ignore) {
        return;
      }
      this.bl.append(data);
      while (this.bl.length > length) {
        const data = this.bl.slice(0, length);
        this.bl.consume(length);

        // TODO: Get rid of creating `Packet` instances here.
        const packet = new _packet.Packet(message.type);
        packet.packetId(packetNumber += 1);
        packet.resetConnection(message.resetConnection);
        packet.addData(data);
        this.debug.packet('Sent', packet);
        this.debug.data(packet);
        if (this.push(packet.buffer) === false) {
          message.pause();
        }
      }
    });
    this.currentMessage.on('end', () => {
      const data = this.bl.slice();
      this.bl.consume(data.length);

      // TODO: Get rid of creating `Packet` instances here.
      const packet = new _packet.Packet(message.type);
      packet.packetId(packetNumber += 1);
      packet.resetConnection(message.resetConnection);
      packet.last(true);
      packet.ignore(message.ignore);
      packet.addData(data);
      this.debug.packet('Sent', packet);
      this.debug.data(packet);
      this.push(packet.buffer);
      this.currentMessage = undefined;
      callback();
    });
  }
  _read(_size) {
    // If we do have a message, resume it and get data flowing.
    // Otherwise, there is nothing to do.
    if (this.currentMessage) {
      this.currentMessage.resume();
    }
  }
}
var _default = OutgoingMessageStream;
exports.default = _default;
module.exports = OutgoingMessageStream;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYmwiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9zdHJlYW0iLCJfcGFja2V0Iiwib2JqIiwiX19lc01vZHVsZSIsImRlZmF1bHQiLCJPdXRnb2luZ01lc3NhZ2VTdHJlYW0iLCJEdXBsZXgiLCJjb25zdHJ1Y3RvciIsImRlYnVnIiwicGFja2V0U2l6ZSIsIndyaXRhYmxlT2JqZWN0TW9kZSIsImJsIiwiQnVmZmVyTGlzdCIsIm9uIiwicHVzaCIsIl93cml0ZSIsIm1lc3NhZ2UiLCJfZW5jb2RpbmciLCJjYWxsYmFjayIsImxlbmd0aCIsIkhFQURFUl9MRU5HVEgiLCJwYWNrZXROdW1iZXIiLCJjdXJyZW50TWVzc2FnZSIsImRhdGEiLCJpZ25vcmUiLCJhcHBlbmQiLCJzbGljZSIsImNvbnN1bWUiLCJwYWNrZXQiLCJQYWNrZXQiLCJ0eXBlIiwicGFja2V0SWQiLCJyZXNldENvbm5lY3Rpb24iLCJhZGREYXRhIiwiYnVmZmVyIiwicGF1c2UiLCJsYXN0IiwidW5kZWZpbmVkIiwiX3JlYWQiLCJfc2l6ZSIsInJlc3VtZSIsIl9kZWZhdWx0IiwiZXhwb3J0cyIsIm1vZHVsZSJdLCJzb3VyY2VzIjpbIi4uL3NyYy9vdXRnb2luZy1tZXNzYWdlLXN0cmVhbS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQnVmZmVyTGlzdCBmcm9tICdibCc7XG5pbXBvcnQgeyBEdXBsZXggfSBmcm9tICdzdHJlYW0nO1xuXG5pbXBvcnQgRGVidWcgZnJvbSAnLi9kZWJ1Zyc7XG5pbXBvcnQgTWVzc2FnZSBmcm9tICcuL21lc3NhZ2UnO1xuaW1wb3J0IHsgUGFja2V0LCBIRUFERVJfTEVOR1RIIH0gZnJvbSAnLi9wYWNrZXQnO1xuXG5jbGFzcyBPdXRnb2luZ01lc3NhZ2VTdHJlYW0gZXh0ZW5kcyBEdXBsZXgge1xuICBkZWNsYXJlIHBhY2tldFNpemU6IG51bWJlcjtcbiAgZGVjbGFyZSBkZWJ1ZzogRGVidWc7XG4gIGRlY2xhcmUgYmw6IGFueTtcblxuICBkZWNsYXJlIGN1cnJlbnRNZXNzYWdlOiBNZXNzYWdlIHwgdW5kZWZpbmVkO1xuXG4gIGNvbnN0cnVjdG9yKGRlYnVnOiBEZWJ1ZywgeyBwYWNrZXRTaXplIH06IHsgcGFja2V0U2l6ZTogbnVtYmVyIH0pIHtcbiAgICBzdXBlcih7IHdyaXRhYmxlT2JqZWN0TW9kZTogdHJ1ZSB9KTtcblxuICAgIHRoaXMucGFja2V0U2l6ZSA9IHBhY2tldFNpemU7XG4gICAgdGhpcy5kZWJ1ZyA9IGRlYnVnO1xuICAgIHRoaXMuYmwgPSBuZXcgQnVmZmVyTGlzdCgpO1xuXG4gICAgLy8gV2hlbiB0aGUgd3JpdGFibGUgc2lkZSBpcyBlbmRlZCwgcHVzaCBgbnVsbGBcbiAgICAvLyB0byBhbHNvIGVuZCB0aGUgcmVhZGFibGUgc2lkZS5cbiAgICB0aGlzLm9uKCdmaW5pc2gnLCAoKSA9PiB7XG4gICAgICB0aGlzLnB1c2gobnVsbCk7XG4gICAgfSk7XG4gIH1cblxuICBfd3JpdGUobWVzc2FnZTogTWVzc2FnZSwgX2VuY29kaW5nOiBzdHJpbmcsIGNhbGxiYWNrOiAoZXJyPzogRXJyb3IgfCBudWxsKSA9PiB2b2lkKSB7XG4gICAgY29uc3QgbGVuZ3RoID0gdGhpcy5wYWNrZXRTaXplIC0gSEVBREVSX0xFTkdUSDtcbiAgICBsZXQgcGFja2V0TnVtYmVyID0gMDtcblxuICAgIHRoaXMuY3VycmVudE1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgIHRoaXMuY3VycmVudE1lc3NhZ2Uub24oJ2RhdGEnLCAoZGF0YTogQnVmZmVyKSA9PiB7XG4gICAgICBpZiAobWVzc2FnZS5pZ25vcmUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmJsLmFwcGVuZChkYXRhKTtcblxuICAgICAgd2hpbGUgKHRoaXMuYmwubGVuZ3RoID4gbGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLmJsLnNsaWNlKDAsIGxlbmd0aCk7XG4gICAgICAgIHRoaXMuYmwuY29uc3VtZShsZW5ndGgpO1xuXG4gICAgICAgIC8vIFRPRE86IEdldCByaWQgb2YgY3JlYXRpbmcgYFBhY2tldGAgaW5zdGFuY2VzIGhlcmUuXG4gICAgICAgIGNvbnN0IHBhY2tldCA9IG5ldyBQYWNrZXQobWVzc2FnZS50eXBlKTtcbiAgICAgICAgcGFja2V0LnBhY2tldElkKHBhY2tldE51bWJlciArPSAxKTtcbiAgICAgICAgcGFja2V0LnJlc2V0Q29ubmVjdGlvbihtZXNzYWdlLnJlc2V0Q29ubmVjdGlvbik7XG4gICAgICAgIHBhY2tldC5hZGREYXRhKGRhdGEpO1xuXG4gICAgICAgIHRoaXMuZGVidWcucGFja2V0KCdTZW50JywgcGFja2V0KTtcbiAgICAgICAgdGhpcy5kZWJ1Zy5kYXRhKHBhY2tldCk7XG5cbiAgICAgICAgaWYgKHRoaXMucHVzaChwYWNrZXQuYnVmZmVyKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICBtZXNzYWdlLnBhdXNlKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuY3VycmVudE1lc3NhZ2Uub24oJ2VuZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLmJsLnNsaWNlKCk7XG4gICAgICB0aGlzLmJsLmNvbnN1bWUoZGF0YS5sZW5ndGgpO1xuXG4gICAgICAvLyBUT0RPOiBHZXQgcmlkIG9mIGNyZWF0aW5nIGBQYWNrZXRgIGluc3RhbmNlcyBoZXJlLlxuICAgICAgY29uc3QgcGFja2V0ID0gbmV3IFBhY2tldChtZXNzYWdlLnR5cGUpO1xuICAgICAgcGFja2V0LnBhY2tldElkKHBhY2tldE51bWJlciArPSAxKTtcbiAgICAgIHBhY2tldC5yZXNldENvbm5lY3Rpb24obWVzc2FnZS5yZXNldENvbm5lY3Rpb24pO1xuICAgICAgcGFja2V0Lmxhc3QodHJ1ZSk7XG4gICAgICBwYWNrZXQuaWdub3JlKG1lc3NhZ2UuaWdub3JlKTtcbiAgICAgIHBhY2tldC5hZGREYXRhKGRhdGEpO1xuXG4gICAgICB0aGlzLmRlYnVnLnBhY2tldCgnU2VudCcsIHBhY2tldCk7XG4gICAgICB0aGlzLmRlYnVnLmRhdGEocGFja2V0KTtcblxuICAgICAgdGhpcy5wdXNoKHBhY2tldC5idWZmZXIpO1xuXG4gICAgICB0aGlzLmN1cnJlbnRNZXNzYWdlID0gdW5kZWZpbmVkO1xuXG4gICAgICBjYWxsYmFjaygpO1xuICAgIH0pO1xuICB9XG5cbiAgX3JlYWQoX3NpemU6IG51bWJlcikge1xuICAgIC8vIElmIHdlIGRvIGhhdmUgYSBtZXNzYWdlLCByZXN1bWUgaXQgYW5kIGdldCBkYXRhIGZsb3dpbmcuXG4gICAgLy8gT3RoZXJ3aXNlLCB0aGVyZSBpcyBub3RoaW5nIHRvIGRvLlxuICAgIGlmICh0aGlzLmN1cnJlbnRNZXNzYWdlKSB7XG4gICAgICB0aGlzLmN1cnJlbnRNZXNzYWdlLnJlc3VtZSgpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBPdXRnb2luZ01lc3NhZ2VTdHJlYW07XG5tb2R1bGUuZXhwb3J0cyA9IE91dGdvaW5nTWVzc2FnZVN0cmVhbTtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsSUFBQUEsR0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUMsT0FBQSxHQUFBRCxPQUFBO0FBSUEsSUFBQUUsT0FBQSxHQUFBRixPQUFBO0FBQWlELFNBQUFELHVCQUFBSSxHQUFBLFdBQUFBLEdBQUEsSUFBQUEsR0FBQSxDQUFBQyxVQUFBLEdBQUFELEdBQUEsS0FBQUUsT0FBQSxFQUFBRixHQUFBO0FBRWpELE1BQU1HLHFCQUFxQixTQUFTQyxjQUFNLENBQUM7RUFPekNDLFdBQVdBLENBQUNDLEtBQVksRUFBRTtJQUFFQztFQUFtQyxDQUFDLEVBQUU7SUFDaEUsS0FBSyxDQUFDO01BQUVDLGtCQUFrQixFQUFFO0lBQUssQ0FBQyxDQUFDO0lBRW5DLElBQUksQ0FBQ0QsVUFBVSxHQUFHQSxVQUFVO0lBQzVCLElBQUksQ0FBQ0QsS0FBSyxHQUFHQSxLQUFLO0lBQ2xCLElBQUksQ0FBQ0csRUFBRSxHQUFHLElBQUlDLFdBQVUsQ0FBQyxD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