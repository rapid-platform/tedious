"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _intn = _interopRequireDefault(require("./intn"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const DATA_LENGTH = Buffer.from([0x01]);
const NULL_LENGTH = Buffer.from([0x00]);
const TinyInt = {
  id: 0x30,
  type: 'INT1',
  name: 'TinyInt',
  declaration: function () {
    return 'tinyint';
  },
  generateTypeInfo() {
    return Buffer.from([_intn.default.id, 0x01]);
  },
  generateParameterLength(parameter, options) {
    if (parameter.value == null) {
      return NULL_LENGTH;
    }
    return DATA_LENGTH;
  },
  *generateParameterData(parameter, options) {
    if (parameter.value == null) {
      return;
    }
    const buffer = Buffer.alloc(1);
    buffer.writeUInt8(Number(parameter.value), 0);
    yield buffer;
  },
  validate: function (value) {
    if (value == null) {
      return null;
    }
    if (typeof value !== 'number') {
      value = Number(value);
    }
    if (isNaN(value)) {
      throw new TypeError('Invalid number.');
    }
    if (value < 0 || value > 255) {
      throw new TypeError('Value must be between 0 and 255, inclusive.');
    }
    return value | 0;
  }
};
var _default = TinyInt;
exports.default = _default;
module.exports = TinyInt;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfaW50biIsIl9pbnRlcm9wUmVxdWlyZURlZmF1bHQiLCJyZXF1aXJlIiwib2JqIiwiX19lc01vZHVsZSIsImRlZmF1bHQiLCJEQVRBX0xFTkdUSCIsIkJ1ZmZlciIsImZyb20iLCJOVUxMX0xFTkdUSCIsIlRpbnlJbnQiLCJpZCIsInR5cGUiLCJuYW1lIiwiZGVjbGFyYXRpb24iLCJnZW5lcmF0ZVR5cGVJbmZvIiwiSW50TiIsImdlbmVyYXRlUGFyYW1ldGVyTGVuZ3RoIiwicGFyYW1ldGVyIiwib3B0aW9ucyIsInZhbHVlIiwiZ2VuZXJhdGVQYXJhbWV0ZXJEYXRhIiwiYnVmZmVyIiwiYWxsb2MiLCJ3cml0ZVVJbnQ4IiwiTnVtYmVyIiwidmFsaWRhdGUiLCJpc05hTiIsIlR5cGVFcnJvciIsIl9kZWZhdWx0IiwiZXhwb3J0cyIsIm1vZHVsZSJdLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9kYXRhLXR5cGVzL3RpbnlpbnQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdHlwZSBEYXRhVHlwZSB9IGZyb20gJy4uL2RhdGEtdHlwZSc7XG5pbXBvcnQgSW50TiBmcm9tICcuL2ludG4nO1xuXG5jb25zdCBEQVRBX0xFTkdUSCA9IEJ1ZmZlci5mcm9tKFsweDAxXSk7XG5jb25zdCBOVUxMX0xFTkdUSCA9IEJ1ZmZlci5mcm9tKFsweDAwXSk7XG5cbmNvbnN0IFRpbnlJbnQ6IERhdGFUeXBlID0ge1xuICBpZDogMHgzMCxcbiAgdHlwZTogJ0lOVDEnLFxuICBuYW1lOiAnVGlueUludCcsXG5cbiAgZGVjbGFyYXRpb246IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAndGlueWludCc7XG4gIH0sXG5cbiAgZ2VuZXJhdGVUeXBlSW5mbygpIHtcbiAgICByZXR1cm4gQnVmZmVyLmZyb20oW0ludE4uaWQsIDB4MDFdKTtcbiAgfSxcblxuICBnZW5lcmF0ZVBhcmFtZXRlckxlbmd0aChwYXJhbWV0ZXIsIG9wdGlvbnMpIHtcbiAgICBpZiAocGFyYW1ldGVyLnZhbHVlID09IG51bGwpIHtcbiAgICAgIHJldHVybiBOVUxMX0xFTkdUSDtcbiAgICB9XG5cbiAgICByZXR1cm4gREFUQV9MRU5HVEg7XG4gIH0sXG5cbiAgKiBnZW5lcmF0ZVBhcmFtZXRlckRhdGEocGFyYW1ldGVyLCBvcHRpb25zKSB7XG4gICAgaWYgKHBhcmFtZXRlci52YWx1ZSA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgYnVmZmVyID0gQnVmZmVyLmFsbG9jKDEpO1xuICAgIGJ1ZmZlci53cml0ZVVJbnQ4KE51bWJlcihwYXJhbWV0ZXIudmFsdWUpLCAwKTtcbiAgICB5aWVsZCBidWZmZXI7XG4gIH0sXG5cbiAgdmFsaWRhdGU6IGZ1bmN0aW9uKHZhbHVlKTogbnVtYmVyIHwgbnVsbCB7XG4gICAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdudW1iZXInKSB7XG4gICAgICB2YWx1ZSA9IE51bWJlcih2YWx1ZSk7XG4gICAgfVxuXG4gICAgaWYgKGlzTmFOKHZhbHVlKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBudW1iZXIuJyk7XG4gICAgfVxuXG4gICAgaWYgKHZhbHVlIDwgMCB8fCB2YWx1ZSA+IDI1NSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVmFsdWUgbXVzdCBiZSBiZXR3ZWVuIDAgYW5kIDI1NSwgaW5jbHVzaXZlLicpO1xuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZSB8IDA7XG4gIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IFRpbnlJbnQ7XG5tb2R1bGUuZXhwb3J0cyA9IFRpbnlJbnQ7XG4iXSwibWFwcGluZ3MiOiI7Ozs7OztBQUNBLElBQUFBLEtBQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUEwQixTQUFBRCx1QkFBQUUsR0FBQSxXQUFBQSxHQUFBLElBQUFBLEdBQUEsQ0FBQUMsVUFBQSxHQUFBRCxHQUFBLEtBQUFFLE9BQUEsRUFBQUYsR0FBQTtBQUUxQixNQUFNRyxXQUFXLEdBQUdDLE1BQU0sQ0FBQ0MsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDdkMsTUFBTUMsV0FBVyxHQUFHRixNQUFNLENBQUNDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBRXZDLE1BQU1FLE9BQWlCLEdBQUc7RUFDeEJDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLElBQUksRUFBRSxNQUFNO0VBQ1pDLElBQUksRUFBRSxTQUFTO0VBRWZDLFdBQVcsRUFBRSxTQUFBQSxDQUFBLEVBQVc7SUFDdEIsT0FBTyxTQUFTO0VBQ2xCLENBQUM7RUFFREMsZ0JBQWdCQSxDQUFBLEVBQUc7SUFDakIsT0FBT1IsTUFBTSxDQUFDQyxJQUFJLENBQUMsQ0FBQ1EsYUFBSSxDQUFDTCxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7RUFDckMsQ0FBQztFQUVETSx1QkFBdUJBLENBQUNDLFNBQVMsRUFBRUMsT0FBTyxFQUFFO0lBQzFDLElBQUlELFNBQVMsQ0FBQ0UsS0FBSyxJQUFJLElBQUksRUFBRTtNQUMzQixPQUFPWCxXQUFXO0lBQ3BCO0lBRUEsT0FBT0gsV0FBVztFQUNwQixDQUFDO0VBRUQsQ0FBRWUscUJBQXFCQSxDQUFDSCxTQUFTLEVBQUVDLE9BQU8sRUFBRTtJQUMxQyxJQUFJRCxTQUFTLENBQUNFLEtBQUssSUFBSSxJQUFJLEVBQUU7TUFDM0I7SUFDRjtJQUVBLE1BQU1FLE1BQU0sR0FBR2YsTUFBTSxDQUFDZ0IsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUM5QkQsTUFBTSxDQUFDRSxVQUFVLENBQUNDLE1BQU0sQ0FBQ1AsU0FBUyxDQUFDRSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDN0MsTUFBTUUsTUFBTTtFQUNkLENBQUM7RUFFREksUUFBUSxFQUFFLFNBQUFBLENBQVNOLEtBQUssRUFBaUI7SUFDdkMsSUFBSUEsS0FBSyxJQUFJLElBQUksRUFBRTtNQUNqQixPQUFPLElBQUk7SUFDYjtJQUVBLElBQUksT0FBT0EsS0FBSyxLQUFLLFFBQVEsRUFBRTtNQUM3QkEsS0FBSyxHQUFHSyxNQUFNLENBQUNMLEtBQUssQ0FBQztJQUN2QjtJQUVBLElBQUlPLEtBQUssQ0FBQ1AsS0FBSyxDQUFDLEVBQUU7TUFDaEIsTUFBTSxJQUFJUSxTQUFTLENBQUMsaUJBQWlCLENBQUM7SUFDeEM7SUFFQSxJQUFJUixLQUFLLEdBQUcsQ0FBQyxJQUFJQSxLQUFLLEdBQUcsR0FBRyxFQUFFO01BQzVCLE1BQU0sSUFBSVEsU0FBUyxDQUFDLDZDQUE2QyxDQUFDO0lBQ3BFO0lBRUEsT0FBT1IsS0FBSyxHQUFHLENBQUM7RUFDbEI7QUFDRixDQUFDO0FBQUMsSUFBQVMsUUFBQSxHQUVhbkIsT0FBTztBQUFBb0IsT0FBQSxDQUFBekIsT0FBQSxHQUFBd0IsUUFBQTtBQUN0QkUsTUFBTSxDQUFDRCxPQUFPLEdBQUdwQixPQUFPIn0=