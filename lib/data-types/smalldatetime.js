"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _datetimen = _interopRequireDefault(require("./datetimen"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const EPOCH_DATE = new Date(1900, 0, 1);
const UTC_EPOCH_DATE = new Date(Date.UTC(1900, 0, 1));
const DATA_LENGTH = Buffer.from([0x04]);
const NULL_LENGTH = Buffer.from([0x00]);
const SmallDateTime = {
  id: 0x3A,
  type: 'DATETIM4',
  name: 'SmallDateTime',
  declaration: function () {
    return 'smalldatetime';
  },
  generateTypeInfo() {
    return Buffer.from([_datetimen.default.id, 0x04]);
  },
  generateParameterLength(parameter, options) {
    if (parameter.value == null) {
      return NULL_LENGTH;
    }
    return DATA_LENGTH;
  },
  generateParameterData: function* (parameter, options) {
    if (parameter.value == null) {
      return;
    }
    const buffer = Buffer.alloc(4);
    let days, dstDiff, minutes;
    if (options.useUTC) {
      days = Math.floor((parameter.value.getTime() - UTC_EPOCH_DATE.getTime()) / (1000 * 60 * 60 * 24));
      minutes = parameter.value.getUTCHours() * 60 + parameter.value.getUTCMinutes();
    } else {
      dstDiff = -(parameter.value.getTimezoneOffset() - EPOCH_DATE.getTimezoneOffset()) * 60 * 1000;
      days = Math.floor((parameter.value.getTime() - EPOCH_DATE.getTime() + dstDiff) / (1000 * 60 * 60 * 24));
      minutes = parameter.value.getHours() * 60 + parameter.value.getMinutes();
    }
    buffer.writeUInt16LE(days, 0);
    buffer.writeUInt16LE(minutes, 2);
    yield buffer;
  },
  validate: function (value, collation, options) {
    if (value == null) {
      return null;
    }
    if (!(value instanceof Date)) {
      value = new Date(Date.parse(value));
    }
    value = value;
    let year, month, date;
    if (options && options.useUTC) {
      year = value.getUTCFullYear();
      month = value.getUTCMonth();
      date = value.getUTCDate();
    } else {
      year = value.getFullYear();
      month = value.getMonth();
      date = value.getDate();
    }
    if (year < 1900 || year > 2079) {
      throw new TypeError('Out of range.');
    }
    if (year === 2079) {
      // Month is 0-indexed, i.e. Jan = 0, Dec = 11
      if (month > 4 || month === 4 && date > 6) {
        throw new TypeError('Out of range.');
      }
    }
    if (isNaN(value)) {
      throw new TypeError('Invalid date.');
    }
    return value;
  }
};
var _default = SmallDateTime;
exports.default = _default;
module.exports = SmallDateTime;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfZGF0ZXRpbWVuIiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJvYmoiLCJfX2VzTW9kdWxlIiwiZGVmYXVsdCIsIkVQT0NIX0RBVEUiLCJEYXRlIiwiVVRDX0VQT0NIX0RBVEUiLCJVVEMiLCJEQVRBX0xFTkdUSCIsIkJ1ZmZlciIsImZyb20iLCJOVUxMX0xFTkdUSCIsIlNtYWxsRGF0ZVRpbWUiLCJpZCIsInR5cGUiLCJuYW1lIiwiZGVjbGFyYXRpb24iLCJnZW5lcmF0ZVR5cGVJbmZvIiwiRGF0ZVRpbWVOIiwiZ2VuZXJhdGVQYXJhbWV0ZXJMZW5ndGgiLCJwYXJhbWV0ZXIiLCJvcHRpb25zIiwidmFsdWUiLCJnZW5lcmF0ZVBhcmFtZXRlckRhdGEiLCJidWZmZXIiLCJhbGxvYyIsImRheXMiLCJkc3REaWZmIiwibWludXRlcyIsInVzZVVUQyIsIk1hdGgiLCJmbG9vciIsImdldFRpbWUiLCJnZXRVVENIb3VycyIsImdldFVUQ01pbnV0ZXMiLCJnZXRUaW1lem9uZU9mZnNldCIsImdldEhvdXJzIiwiZ2V0TWludXRlcyIsIndyaXRlVUludDE2TEUiLCJ2YWxpZGF0ZSIsImNvbGxhdGlvbiIsInBhcnNlIiwieWVhciIsIm1vbnRoIiwiZGF0ZSIsImdldFVUQ0Z1bGxZZWFyIiwiZ2V0VVRDTW9udGgiLCJnZXRVVENEYXRlIiwiZ2V0RnVsbFllYXIiLCJnZXRNb250aCIsImdldERhdGUiLCJUeXBlRXJyb3IiLCJpc05hTiIsIl9kZWZhdWx0IiwiZXhwb3J0cyIsIm1vZHVsZSJdLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9kYXRhLXR5cGVzL3NtYWxsZGF0ZXRpbWUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdHlwZSBEYXRhVHlwZSB9IGZyb20gJy4uL2RhdGEtdHlwZSc7XG5pbXBvcnQgRGF0ZVRpbWVOIGZyb20gJy4vZGF0ZXRpbWVuJztcblxuY29uc3QgRVBPQ0hfREFURSA9IG5ldyBEYXRlKDE5MDAsIDAsIDEpO1xuY29uc3QgVVRDX0VQT0NIX0RBVEUgPSBuZXcgRGF0ZShEYXRlLlVUQygxOTAwLCAwLCAxKSk7XG5cbmNvbnN0IERBVEFfTEVOR1RIID0gQnVmZmVyLmZyb20oWzB4MDRdKTtcbmNvbnN0IE5VTExfTEVOR1RIID0gQnVmZmVyLmZyb20oWzB4MDBdKTtcblxuY29uc3QgU21hbGxEYXRlVGltZTogRGF0YVR5cGUgPSB7XG4gIGlkOiAweDNBLFxuICB0eXBlOiAnREFURVRJTTQnLFxuICBuYW1lOiAnU21hbGxEYXRlVGltZScsXG5cbiAgZGVjbGFyYXRpb246IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAnc21hbGxkYXRldGltZSc7XG4gIH0sXG5cbiAgZ2VuZXJhdGVUeXBlSW5mbygpIHtcbiAgICByZXR1cm4gQnVmZmVyLmZyb20oW0RhdGVUaW1lTi5pZCwgMHgwNF0pO1xuICB9LFxuXG4gIGdlbmVyYXRlUGFyYW1ldGVyTGVuZ3RoKHBhcmFtZXRlciwgb3B0aW9ucykge1xuICAgIGlmIChwYXJhbWV0ZXIudmFsdWUgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIE5VTExfTEVOR1RIO1xuICAgIH1cblxuICAgIHJldHVybiBEQVRBX0xFTkdUSDtcbiAgfSxcblxuICBnZW5lcmF0ZVBhcmFtZXRlckRhdGE6IGZ1bmN0aW9uKihwYXJhbWV0ZXIsIG9wdGlvbnMpIHtcbiAgICBpZiAocGFyYW1ldGVyLnZhbHVlID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBidWZmZXIgPSBCdWZmZXIuYWxsb2MoNCk7XG5cbiAgICBsZXQgZGF5czogbnVtYmVyLCBkc3REaWZmOiBudW1iZXIsIG1pbnV0ZXM6IG51bWJlcjtcbiAgICBpZiAob3B0aW9ucy51c2VVVEMpIHtcbiAgICAgIGRheXMgPSBNYXRoLmZsb29yKChwYXJhbWV0ZXIudmFsdWUuZ2V0VGltZSgpIC0gVVRDX0VQT0NIX0RBVEUuZ2V0VGltZSgpKSAvICgxMDAwICogNjAgKiA2MCAqIDI0KSk7XG4gICAgICBtaW51dGVzID0gKHBhcmFtZXRlci52YWx1ZS5nZXRVVENIb3VycygpICogNjApICsgcGFyYW1ldGVyLnZhbHVlLmdldFVUQ01pbnV0ZXMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZHN0RGlmZiA9IC0ocGFyYW1ldGVyLnZhbHVlLmdldFRpbWV6b25lT2Zmc2V0KCkgLSBFUE9DSF9EQVRFLmdldFRpbWV6b25lT2Zmc2V0KCkpICogNjAgKiAxMDAwO1xuICAgICAgZGF5cyA9IE1hdGguZmxvb3IoKHBhcmFtZXRlci52YWx1ZS5nZXRUaW1lKCkgLSBFUE9DSF9EQVRFLmdldFRpbWUoKSArIGRzdERpZmYpIC8gKDEwMDAgKiA2MCAqIDYwICogMjQpKTtcbiAgICAgIG1pbnV0ZXMgPSAocGFyYW1ldGVyLnZhbHVlLmdldEhvdXJzKCkgKiA2MCkgKyBwYXJhbWV0ZXIudmFsdWUuZ2V0TWludXRlcygpO1xuICAgIH1cblxuICAgIGJ1ZmZlci53cml0ZVVJbnQxNkxFKGRheXMsIDApO1xuICAgIGJ1ZmZlci53cml0ZVVJbnQxNkxFKG1pbnV0ZXMsIDIpO1xuXG4gICAgeWllbGQgYnVmZmVyO1xuICB9LFxuXG4gIHZhbGlkYXRlOiBmdW5jdGlvbih2YWx1ZSwgY29sbGF0aW9uLCBvcHRpb25zKTogbnVsbCB8IERhdGUge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAoISh2YWx1ZSBpbnN0YW5jZW9mIERhdGUpKSB7XG4gICAgICB2YWx1ZSA9IG5ldyBEYXRlKERhdGUucGFyc2UodmFsdWUpKTtcbiAgICB9XG5cbiAgICB2YWx1ZSA9IHZhbHVlIGFzIERhdGU7XG5cbiAgICBsZXQgeWVhciwgbW9udGgsIGRhdGU7XG4gICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy51c2VVVEMpIHtcbiAgICAgIHllYXIgPSB2YWx1ZS5nZXRVVENGdWxsWWVhcigpO1xuICAgICAgbW9udGggPSB2YWx1ZS5nZXRVVENNb250aCgpO1xuICAgICAgZGF0ZSA9IHZhbHVlLmdldFVUQ0RhdGUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgeWVhciA9IHZhbHVlLmdldEZ1bGxZZWFyKCk7XG4gICAgICBtb250aCA9IHZhbHVlLmdldE1vbnRoKCk7XG4gICAgICBkYXRlID0gdmFsdWUuZ2V0RGF0ZSgpO1xuICAgIH1cblxuICAgIGlmICh5ZWFyIDwgMTkwMCB8fCB5ZWFyID4gMjA3OSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignT3V0IG9mIHJhbmdlLicpO1xuICAgIH1cblxuICAgIGlmICh5ZWFyID09PSAyMDc5KSB7XG4gICAgICAvLyBNb250aCBpcyAwLWluZGV4ZWQsIGkuZS4gSmFuID0gMCwgRGVjID0gMTFcbiAgICAgIGlmIChtb250aCA+IDQgfHwgKG1vbnRoID09PSA0ICYmIGRhdGUgPiA2KSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdPdXQgb2YgcmFuZ2UuJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGlzTmFOKHZhbHVlKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBkYXRlLicpO1xuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgU21hbGxEYXRlVGltZTtcbm1vZHVsZS5leHBvcnRzID0gU21hbGxEYXRlVGltZTtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQ0EsSUFBQUEsVUFBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQW9DLFNBQUFELHVCQUFBRSxHQUFBLFdBQUFBLEdBQUEsSUFBQUEsR0FBQSxDQUFBQyxVQUFBLEdBQUFELEdBQUEsS0FBQUUsT0FBQSxFQUFBRixHQUFBO0FBRXBDLE1BQU1HLFVBQVUsR0FBRyxJQUFJQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDdkMsTUFBTUMsY0FBYyxHQUFHLElBQUlELElBQUksQ0FBQ0EsSUFBSSxDQUFDRSxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENB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