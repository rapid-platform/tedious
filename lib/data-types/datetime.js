"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _datetimen = _interopRequireDefault(require("./datetimen"));
var _core = require("@js-joda/core");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const EPOCH_DATE = _core.LocalDate.ofYearDay(1900, 1);
const NULL_LENGTH = Buffer.from([0x00]);
const DATA_LENGTH = Buffer.from([0x08]);
const DateTime = {
  id: 0x3D,
  type: 'DATETIME',
  name: 'DateTime',
  declaration: function () {
    return 'datetime';
  },
  generateTypeInfo() {
    return Buffer.from([_datetimen.default.id, 0x08]);
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
    const value = parameter.value; // Temporary solution. Remove 'any' later.

    let date;
    if (options.useUTC) {
      date = _core.LocalDate.of(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
    } else {
      date = _core.LocalDate.of(value.getFullYear(), value.getMonth() + 1, value.getDate());
    }
    let days = EPOCH_DATE.until(date, _core.ChronoUnit.DAYS);
    let milliseconds, threeHundredthsOfSecond;
    if (options.useUTC) {
      let seconds = value.getUTCHours() * 60 * 60;
      seconds += value.getUTCMinutes() * 60;
      seconds += value.getUTCSeconds();
      milliseconds = seconds * 1000 + value.getUTCMilliseconds();
    } else {
      let seconds = value.getHours() * 60 * 60;
      seconds += value.getMinutes() * 60;
      seconds += value.getSeconds();
      milliseconds = seconds * 1000 + value.getMilliseconds();
    }
    threeHundredthsOfSecond = milliseconds / (3 + 1 / 3);
    threeHundredthsOfSecond = Math.round(threeHundredthsOfSecond);

    // 25920000 equals one day
    if (threeHundredthsOfSecond === 25920000) {
      days += 1;
      threeHundredthsOfSecond = 0;
    }
    const buffer = Buffer.alloc(8);
    buffer.writeInt32LE(days, 0);
    buffer.writeUInt32LE(threeHundredthsOfSecond, 4);
    yield buffer;
  },
  // TODO: type 'any' needs to be revisited.
  validate: function (value, collation, options) {
    if (value == null) {
      return null;
    }
    if (!(value instanceof Date)) {
      value = new Date(Date.parse(value));
    }
    value = value;
    let year;
    if (options && options.useUTC) {
      year = value.getUTCFullYear();
    } else {
      year = value.getFullYear();
    }
    if (year < 1753 || year > 9999) {
      throw new TypeError('Out of range.');
    }
    if (isNaN(value)) {
      throw new TypeError('Invalid date.');
    }
    return value;
  }
};
var _default = DateTime;
exports.default = _default;
module.exports = DateTime;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfZGF0ZXRpbWVuIiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfY29yZSIsIm9iaiIsIl9fZXNNb2R1bGUiLCJkZWZhdWx0IiwiRVBPQ0hfREFURSIsIkxvY2FsRGF0ZSIsIm9mWWVhckRheSIsIk5VTExfTEVOR1RIIiwiQnVmZmVyIiwiZnJvbSIsIkRBVEFfTEVOR1RIIiwiRGF0ZVRpbWUiLCJpZCIsInR5cGUiLCJuYW1lIiwiZGVjbGFyYXRpb24iLCJnZW5lcmF0ZVR5cGVJbmZvIiwiRGF0ZVRpbWVOIiwiZ2VuZXJhdGVQYXJhbWV0ZXJMZW5ndGgiLCJwYXJhbWV0ZXIiLCJvcHRpb25zIiwidmFsdWUiLCJnZW5lcmF0ZVBhcmFtZXRlckRhdGEiLCJkYXRlIiwidXNlVVRDIiwib2YiLCJnZXRVVENGdWxsWWVhciIsImdldFVUQ01vbnRoIiwiZ2V0VVRDRGF0ZSIsImdldEZ1bGxZZWFyIiwiZ2V0TW9udGgiLCJnZXREYXRlIiwiZGF5cyIsInVudGlsIiwiQ2hyb25vVW5pdCIsIkRBWVMiLCJtaWxsaXNlY29uZHMiLCJ0aHJlZUh1bmRyZWR0aHNPZlNlY29uZCIsInNlY29uZHMiLCJnZXRVVENIb3VycyIsImdldFVUQ01pbnV0ZXMiLCJnZXRVVENTZWNvbmRzIiwiZ2V0VVRDTWlsbGlzZWNvbmRzIiwiZ2V0SG91cnMiLCJnZXRNaW51dGVzIiwiZ2V0U2Vjb25kcyIsImdldE1pbGxpc2Vjb25kcyIsIk1hdGgiLCJyb3VuZCIsImJ1ZmZlciIsImFsbG9jIiwid3JpdGVJbnQzMkxFIiwid3JpdGVVSW50MzJMRSIsInZhbGlkYXRlIiwiY29sbGF0aW9uIiwiRGF0ZSIsInBhcnNlIiwieWVhciIsIlR5cGVFcnJvciIsImlzTmFOIiwiX2RlZmF1bHQiLCJleHBvcnRzIiwibW9kdWxlIl0sInNvdXJjZXMiOlsiLi4vLi4vc3JjL2RhdGEtdHlwZXMvZGF0ZXRpbWUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdHlwZSBEYXRhVHlwZSB9IGZyb20gJy4uL2RhdGEtdHlwZSc7XG5pbXBvcnQgRGF0ZVRpbWVOIGZyb20gJy4vZGF0ZXRpbWVuJztcbmltcG9ydCB7IENocm9ub1VuaXQsIExvY2FsRGF0ZSB9IGZyb20gJ0Bqcy1qb2RhL2NvcmUnO1xuXG5jb25zdCBFUE9DSF9EQVRFID0gTG9jYWxEYXRlLm9mWWVhckRheSgxOTAwLCAxKTtcbmNvbnN0IE5VTExfTEVOR1RIID0gQnVmZmVyLmZyb20oWzB4MDBdKTtcbmNvbnN0IERBVEFfTEVOR1RIID0gQnVmZmVyLmZyb20oWzB4MDhdKTtcblxuY29uc3QgRGF0ZVRpbWU6IERhdGFUeXBlID0ge1xuICBpZDogMHgzRCxcbiAgdHlwZTogJ0RBVEVUSU1FJyxcbiAgbmFtZTogJ0RhdGVUaW1lJyxcblxuICBkZWNsYXJhdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICdkYXRldGltZSc7XG4gIH0sXG5cbiAgZ2VuZXJhdGVUeXBlSW5mbygpIHtcbiAgICByZXR1cm4gQnVmZmVyLmZyb20oW0RhdGVUaW1lTi5pZCwgMHgwOF0pO1xuICB9LFxuXG4gIGdlbmVyYXRlUGFyYW1ldGVyTGVuZ3RoKHBhcmFtZXRlciwgb3B0aW9ucykge1xuICAgIGlmIChwYXJhbWV0ZXIudmFsdWUgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIE5VTExfTEVOR1RIO1xuICAgIH1cblxuICAgIHJldHVybiBEQVRBX0xFTkdUSDtcbiAgfSxcblxuICBnZW5lcmF0ZVBhcmFtZXRlckRhdGE6IGZ1bmN0aW9uKihwYXJhbWV0ZXIsIG9wdGlvbnMpIHtcbiAgICBpZiAocGFyYW1ldGVyLnZhbHVlID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB2YWx1ZSA9IHBhcmFtZXRlci52YWx1ZSBhcyBhbnk7IC8vIFRlbXBvcmFyeSBzb2x1dGlvbi4gUmVtb3ZlICdhbnknIGxhdGVyLlxuXG4gICAgbGV0IGRhdGU6IExvY2FsRGF0ZTtcbiAgICBpZiAob3B0aW9ucy51c2VVVEMpIHtcbiAgICAgIGRhdGUgPSBMb2NhbERhdGUub2YodmFsdWUuZ2V0VVRDRnVsbFllYXIoKSwgdmFsdWUuZ2V0VVRDTW9udGgoKSArIDEsIHZhbHVlLmdldFVUQ0RhdGUoKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRhdGUgPSBMb2NhbERhdGUub2YodmFsdWUuZ2V0RnVsbFllYXIoKSwgdmFsdWUuZ2V0TW9udGgoKSArIDEsIHZhbHVlLmdldERhdGUoKSk7XG4gICAgfVxuXG4gICAgbGV0IGRheXMgPSBFUE9DSF9EQVRFLnVudGlsKGRhdGUsIENocm9ub1VuaXQuREFZUyk7XG5cbiAgICBsZXQgbWlsbGlzZWNvbmRzLCB0aHJlZUh1bmRyZWR0aHNPZlNlY29uZDtcbiAgICBpZiAob3B0aW9ucy51c2VVVEMpIHtcbiAgICAgIGxldCBzZWNvbmRzID0gdmFsdWUuZ2V0VVRDSG91cnMoKSAqIDYwICogNjA7XG4gICAgICBzZWNvbmRzICs9IHZhbHVlLmdldFVUQ01pbnV0ZXMoKSAqIDYwO1xuICAgICAgc2Vjb25kcyArPSB2YWx1ZS5nZXRVVENTZWNvbmRzKCk7XG4gICAgICBtaWxsaXNlY29uZHMgPSAoc2Vjb25kcyAqIDEwMDApICsgdmFsdWUuZ2V0VVRDTWlsbGlzZWNvbmRzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBzZWNvbmRzID0gdmFsdWUuZ2V0SG91cnMoKSAqIDYwICogNjA7XG4gICAgICBzZWNvbmRzICs9IHZhbHVlLmdldE1pbnV0ZXMoKSAqIDYwO1xuICAgICAgc2Vjb25kcyArPSB2YWx1ZS5nZXRTZWNvbmRzKCk7XG4gICAgICBtaWxsaXNlY29uZHMgPSAoc2Vjb25kcyAqIDEwMDApICsgdmFsdWUuZ2V0TWlsbGlzZWNvbmRzKCk7XG4gICAgfVxuXG4gICAgdGhyZWVIdW5kcmVkdGhzT2ZTZWNvbmQgPSBtaWxsaXNlY29uZHMgLyAoMyArICgxIC8gMykpO1xuICAgIHRocmVlSHVuZHJlZHRoc09mU2Vjb25kID0gTWF0aC5yb3VuZCh0aHJlZUh1bmRyZWR0aHNPZlNlY29uZCk7XG5cbiAgICAvLyAyNTkyMDAwMCBlcXVhbHMgb25lIGRheVxuICAgIGlmICh0aHJlZUh1bmRyZWR0aHNPZlNlY29uZCA9PT0gMjU5MjAwMDApIHtcbiAgICAgIGRheXMgKz0gMTtcbiAgICAgIHRocmVlSHVuZHJlZHRoc09mU2Vjb25kID0gMDtcbiAgICB9XG5cbiAgICBjb25zdCBidWZmZXIgPSBCdWZmZXIuYWxsb2MoOCk7XG4gICAgYnVmZmVyLndyaXRlSW50MzJMRShkYXlzLCAwKTtcbiAgICBidWZmZXIud3JpdGVVSW50MzJMRSh0aHJlZUh1bmRyZWR0aHNPZlNlY29uZCwgNCk7XG4gICAgeWllbGQgYnVmZmVyO1xuICB9LFxuXG4gIC8vIFRPRE86IHR5cGUgJ2FueScgbmVlZHMgdG8gYmUgcmV2aXNpdGVkLlxuICB2YWxpZGF0ZTogZnVuY3Rpb24odmFsdWU6IGFueSwgY29sbGF0aW9uLCBvcHRpb25zKTogbnVsbCB8IG51bWJlciB7XG4gICAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmICghKHZhbHVlIGluc3RhbmNlb2YgRGF0ZSkpIHtcbiAgICAgIHZhbHVlID0gbmV3IERhdGUoRGF0ZS5wYXJzZSh2YWx1ZSkpO1xuICAgIH1cblxuICAgIHZhbHVlID0gdmFsdWUgYXMgRGF0ZTtcblxuICAgIGxldCB5ZWFyO1xuICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMudXNlVVRDKSB7XG4gICAgICB5ZWFyID0gdmFsdWUuZ2V0VVRDRnVsbFllYXIoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgeWVhciA9IHZhbHVlLmdldEZ1bGxZZWFyKCk7XG4gICAgfVxuXG4gICAgaWYgKHllYXIgPCAxNzUzIHx8IHllYXIgPiA5OTk5KSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdPdXQgb2YgcmFuZ2UuJyk7XG4gICAgfVxuXG4gICAgaWYgKGlzTmFOKHZhbHVlKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBkYXRlLicpO1xuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgRGF0ZVRpbWU7XG5tb2R1bGUuZXhwb3J0cyA9IERhdGVUaW1lO1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSxJQUFBQSxVQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxLQUFBLEdBQUFELE9BQUE7QUFBc0QsU0FBQUQsdUJBQUFHLEdBQUEsV0FBQUEsR0FBQSxJQUFBQSxHQUFBLENBQUFDLFVBQUEsR0FBQUQsR0FBQSxLQUFBRSxPQUFBLEVBQUFGLEdBQUE7QUFFdEQsTUFBTUcsVUFBVSxHQUFHQyxlQUFTLENBQUNDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0FBQy9DLE1BQU1DLFdBQVcsR0FBR0MsTUFBTSxDQUFDQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN2QyxNQUFNQyxXQUFXLEdBQUdGLE1BQU0sQ0FBQ0MsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7QUFFdkMsTUFBTUUsUUFBa0IsR0FBRztFQUN6QkMsRUFBRSxFQUFFLElBQUk7RUFDUkMsSUFBSSxFQUFFLFVBQVU7RUFDaEJDLElBQUksRUFBRSxVQUFVO0VBRWhCQyxXQUFXLEVBQUUsU0FBQUEsQ0FBQSxFQUFXO0lBQ3RCLE9BQU8sVUFBVTtFQUNuQixDQUFDO0VBRURDLGdCQUFnQkEsQ0FBQSxFQUFHO0lBQ2pCLE9BQU9SLE1BQU0sQ0FBQ0MsSUFBSSxDQUFDLENBQUNRLGtCQUFTLENBQUNMLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztFQUMxQyxDQUFDO0VBRURNLHVCQUF1QkEsQ0FBQ0MsU0FBUyxFQUFFQyxPQUFPLEVBQUU7SUFDMUMsSUFBSUQsU0FBUyxDQUFDRSxLQUFLLElBQUksSUFBSSxFQUFFO01BQzNCLE9BQU9kLFdBQVc7SUFDcEI7SUFFQSxPQUFPRyxXQUFXO0VBQ3BCLENBQUM7RUFFRFkscUJBQXFCLEVBQUUsVUFBQUEsQ0FBVUgsU0FBUyxFQUFFQyxPQUFPLEVB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