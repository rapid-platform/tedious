"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _writableTrackingBuffer = _interopRequireDefault(require("../tracking-buffer/writable-tracking-buffer"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const TVP_ROW_TOKEN = Buffer.from([0x01]);
const TVP_END_TOKEN = Buffer.from([0x00]);
const NULL_LENGTH = Buffer.from([0xFF, 0xFF]);
const TVP = {
  id: 0xF3,
  type: 'TVPTYPE',
  name: 'TVP',
  declaration: function (parameter) {
    const value = parameter.value; // Temporary solution. Remove 'any' later.
    return value.name + ' readonly';
  },
  generateTypeInfo(parameter) {
    const databaseName = '';
    const schema = parameter.value?.schema ?? '';
    const typeName = parameter.value?.name ?? '';
    const bufferLength = 1 + 1 + Buffer.byteLength(databaseName, 'ucs2') + 1 + Buffer.byteLength(schema, 'ucs2') + 1 + Buffer.byteLength(typeName, 'ucs2');
    const buffer = new _writableTrackingBuffer.default(bufferLength, 'ucs2');
    buffer.writeUInt8(this.id);
    buffer.writeBVarchar(databaseName);
    buffer.writeBVarchar(schema);
    buffer.writeBVarchar(typeName);
    return buffer.data;
  },
  generateParameterLength(parameter, options) {
    if (parameter.value == null) {
      return NULL_LENGTH;
    }
    const {
      columns
    } = parameter.value;
    const buffer = Buffer.alloc(2);
    buffer.writeUInt16LE(columns.length, 0);
    return buffer;
  },
  *generateParameterData(parameter, options) {
    if (parameter.value == null) {
      yield TVP_END_TOKEN;
      yield TVP_END_TOKEN;
      return;
    }
    const {
      columns,
      rows
    } = parameter.value;
    for (let i = 0, len = columns.length; i < len; i++) {
      const column = columns[i];
      const buff = Buffer.alloc(6);
      // UserType
      buff.writeUInt32LE(0x00000000, 0);

      // Flags
      buff.writeUInt16LE(0x0000, 4);
      yield buff;

      // TYPE_INFO
      yield column.type.generateTypeInfo(column);

      // ColName
      yield Buffer.from([0x00]);
    }
    yield TVP_END_TOKEN;
    for (let i = 0, length = rows.length; i < length; i++) {
      yield TVP_ROW_TOKEN;
      const row = rows[i];
      for (let k = 0, len2 = row.length; k < len2; k++) {
        const column = columns[k];
        const value = row[k];
        const param = {
          value: column.type.validate(value, parameter.collation),
          length: column.length,
          scale: column.scale,
          precision: column.precision
        };

        // TvpColumnData
        yield column.type.generateParameterLength(param, options);
        yield* column.type.generateParameterData(param, options);
      }
    }
    yield TVP_END_TOKEN;
  },
  validate: function (value) {
    if (value == null) {
      return null;
    }
    if (typeof value !== 'object') {
      throw new TypeError('Invalid table.');
    }
    if (!Array.isArray(value.columns)) {
      throw new TypeError('Invalid table.');
    }
    if (!Array.isArray(value.rows)) {
      throw new TypeError('Invalid table.');
    }
    return value;
  }
};
var _default = TVP;
exports.default = _default;
module.exports = TVP;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfd3JpdGFibGVUcmFja2luZ0J1ZmZlciIsIl9pbnRlcm9wUmVxdWlyZURlZmF1bHQiLCJyZXF1aXJlIiwib2JqIiwiX19lc01vZHVsZSIsImRlZmF1bHQiLCJUVlBfUk9XX1RPS0VOIiwiQnVmZmVyIiwiZnJvbSIsIlRWUF9FTkRfVE9LRU4iLCJOVUxMX0xFTkdUSCIsIlRWUCIsImlkIiwidHlwZSIsIm5hbWUiLCJkZWNsYXJhdGlvbiIsInBhcmFtZXRlciIsInZhbHVlIiwiZ2VuZXJhdGVUeXBlSW5mbyIsImRhdGFiYXNlTmFtZSIsInNjaGVtYSIsInR5cGVOYW1lIiwiYnVmZmVyTGVuZ3RoIiwiYnl0ZUxlbmd0aCIsImJ1ZmZlciIsIldyaXRhYmxlVHJhY2tpbmdCdWZmZXIiLCJ3cml0ZVVJbnQ4Iiwid3JpdGVCVmFyY2hhciIsImRhdGEiLCJnZW5lcmF0ZVBhcmFtZXRlckxlbmd0aCIsIm9wdGlvbnMiLCJjb2x1bW5zIiwiYWxsb2MiLCJ3cml0ZVVJbnQxNkxFIiwibGVuZ3RoIiwiZ2VuZXJhdGVQYXJhbWV0ZXJEYXRhIiwicm93cyIsImkiLCJsZW4iLCJjb2x1bW4iLCJidWZmIiwid3JpdGVVSW50MzJMRSIsInJvdyIsImsiLCJsZW4yIiwicGFyYW0iLCJ2YWxpZGF0ZSIsImNvbGxhdGlvbiIsInNjYWxlIiwicHJlY2lzaW9uIiwiVHlwZUVycm9yIiwiQXJyYXkiLCJpc0FycmF5IiwiX2RlZmF1bHQiLCJleHBvcnRzIiwibW9kdWxlIl0sInNvdXJjZXMiOlsiLi4vLi4vc3JjL2RhdGEtdHlwZXMvdHZwLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHR5cGUgRGF0YVR5cGUgfSBmcm9tICcuLi9kYXRhLXR5cGUnO1xuaW1wb3J0IFdyaXRhYmxlVHJhY2tpbmdCdWZmZXIgZnJvbSAnLi4vdHJhY2tpbmctYnVmZmVyL3dyaXRhYmxlLXRyYWNraW5nLWJ1ZmZlcic7XG5cbmNvbnN0IFRWUF9ST1dfVE9LRU4gPSBCdWZmZXIuZnJvbShbMHgwMV0pO1xuY29uc3QgVFZQX0VORF9UT0tFTiA9IEJ1ZmZlci5mcm9tKFsweDAwXSk7XG5cbmNvbnN0IE5VTExfTEVOR1RIID0gQnVmZmVyLmZyb20oWzB4RkYsIDB4RkZdKTtcblxuY29uc3QgVFZQOiBEYXRhVHlwZSA9IHtcbiAgaWQ6IDB4RjMsXG4gIHR5cGU6ICdUVlBUWVBFJyxcbiAgbmFtZTogJ1RWUCcsXG5cbiAgZGVjbGFyYXRpb246IGZ1bmN0aW9uKHBhcmFtZXRlcikge1xuICAgIGNvbnN0IHZhbHVlID0gcGFyYW1ldGVyLnZhbHVlIGFzIGFueTsgLy8gVGVtcG9yYXJ5IHNvbHV0aW9uLiBSZW1vdmUgJ2FueScgbGF0ZXIuXG4gICAgcmV0dXJuIHZhbHVlLm5hbWUgKyAnIHJlYWRvbmx5JztcbiAgfSxcblxuICBnZW5lcmF0ZVR5cGVJbmZvKHBhcmFtZXRlcikge1xuICAgIGNvbnN0IGRhdGFiYXNlTmFtZSA9ICcnO1xuICAgIGNvbnN0IHNjaGVtYSA9IHBhcmFtZXRlci52YWx1ZT8uc2NoZW1hID8/ICcnO1xuICAgIGNvbnN0IHR5cGVOYW1lID0gcGFyYW1ldGVyLnZhbHVlPy5uYW1lID8/ICcnO1xuXG4gICAgY29uc3QgYnVmZmVyTGVuZ3RoID0gMSArXG4gICAgICAxICsgQnVmZmVyLmJ5dGVMZW5ndGgoZGF0YWJhc2VOYW1lLCAndWNzMicpICtcbiAgICAgIDEgKyBCdWZmZXIuYnl0ZUxlbmd0aChzY2hlbWEsICd1Y3MyJykgK1xuICAgICAgMSArIEJ1ZmZlci5ieXRlTGVuZ3RoKHR5cGVOYW1lLCAndWNzMicpO1xuXG4gICAgY29uc3QgYnVmZmVyID0gbmV3IFdyaXRhYmxlVHJhY2tpbmdCdWZmZXIoYnVmZmVyTGVuZ3RoLCAndWNzMicpO1xuICAgIGJ1ZmZlci53cml0ZVVJbnQ4KHRoaXMuaWQpO1xuICAgIGJ1ZmZlci53cml0ZUJWYXJjaGFyKGRhdGFiYXNlTmFtZSk7XG4gICAgYnVmZmVyLndyaXRlQlZhcmNoYXIoc2NoZW1hKTtcbiAgICBidWZmZXIud3JpdGVCVmFyY2hhcih0eXBlTmFtZSk7XG5cbiAgICByZXR1cm4gYnVmZmVyLmRhdGE7XG4gIH0sXG5cbiAgZ2VuZXJhdGVQYXJhbWV0ZXJMZW5ndGgocGFyYW1ldGVyLCBvcHRpb25zKSB7XG4gICAgaWYgKHBhcmFtZXRlci52YWx1ZSA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gTlVMTF9MRU5HVEg7XG4gICAgfVxuXG4gICAgY29uc3QgeyBjb2x1bW5zIH0gPSBwYXJhbWV0ZXIudmFsdWU7XG4gICAgY29uc3QgYnVmZmVyID0gQnVmZmVyLmFsbG9jKDIpO1xuICAgIGJ1ZmZlci53cml0ZVVJbnQxNkxFKGNvbHVtbnMubGVuZ3RoLCAwKTtcbiAgICByZXR1cm4gYnVmZmVyO1xuICB9LFxuXG4gICpnZW5lcmF0ZVBhcmFtZXRlckRhdGEocGFyYW1ldGVyLCBvcHRpb25zKSB7XG4gICAgaWYgKHBhcmFtZXRlci52YWx1ZSA9PSBudWxsKSB7XG4gICAgICB5aWVsZCBUVlBfRU5EX1RPS0VOO1xuICAgICAgeWllbGQgVFZQX0VORF9UT0tFTjtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB7IGNvbHVtbnMsIHJvd3MgfSA9IHBhcmFtZXRlci52YWx1ZTtcblxuICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSBjb2x1bW5zLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBjb25zdCBjb2x1bW4gPSBjb2x1bW5zW2ldO1xuXG4gICAgICBjb25zdCBidWZmID0gQnVmZmVyLmFsbG9jKDYpO1xuICAgICAgLy8gVXNlclR5cGVcbiAgICAgIGJ1ZmYud3JpdGVVSW50MzJMRSgweDAwMDAwMDAwLCAwKTtcblxuICAgICAgLy8gRmxhZ3NcbiAgICAgIGJ1ZmYud3JpdGVVSW50MTZMRSgweDAwMDAsIDQpO1xuICAgICAgeWllbGQgYnVmZjtcblxuICAgICAgLy8gVFlQRV9JTkZPXG4gICAgICB5aWVsZCBjb2x1bW4udHlwZS5nZW5lcmF0ZVR5cGVJbmZvKGNvbHVtbik7XG5cbiAgICAgIC8vIENvbE5hbWVcbiAgICAgIHlpZWxkIEJ1ZmZlci5mcm9tKFsweDAwXSk7XG4gICAgfVxuXG4gICAgeWllbGQgVFZQX0VORF9UT0tFTjtcblxuICAgIGZvciAobGV0IGkgPSAwLCBsZW5ndGggPSByb3dzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICB5aWVsZCBUVlBfUk9XX1RPS0VOO1xuXG4gICAgICBjb25zdCByb3cgPSByb3dzW2ldO1xuICAgICAgZm9yIChsZXQgayA9IDAsIGxlbjIgPSByb3cubGVuZ3RoOyBrIDwgbGVuMjsgaysrKSB7XG4gICAgICAgIGNvbnN0IGNvbHVtbiA9IGNvbHVtbnNba107XG4gICAgICAgIGNvbnN0IHZhbHVlID0gcm93W2tdO1xuXG4gICAgICAgIGNvbnN0IHBhcmFtID0ge1xuICAgICAgICAgIHZhbHVlOiBjb2x1bW4udHlwZS52YWxpZGF0ZSh2YWx1ZSwgcGFyYW1ldGVyLmNvbGxhdGlvbiksXG4gICAgICAgICAgbGVuZ3RoOiBjb2x1bW4ubGVuZ3RoLFxuICAgICAgICAgIHNjYWxlOiBjb2x1bW4uc2NhbGUsXG4gICAgICAgICAgcHJlY2lzaW9uOiBjb2x1bW4ucHJlY2lzaW9uXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gVHZwQ29sdW1uRGF0YVxuICAgICAgICB5aWVsZCBjb2x1bW4udHlwZS5nZW5lcmF0ZVBhcmFtZXRlckxlbmd0aChwYXJhbSwgb3B0aW9ucyk7XG4gICAgICAgIHlpZWxkICogY29sdW1uLnR5cGUuZ2VuZXJhdGVQYXJhbWV0ZXJEYXRhKHBhcmFtLCBvcHRpb25zKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB5aWVsZCBUVlBfRU5EX1RPS0VOO1xuICB9LFxuXG4gIHZhbGlkYXRlOiBmdW5jdGlvbih2YWx1ZSk6IEJ1ZmZlciB8IG51bGwge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnb2JqZWN0Jykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCB0YWJsZS4nKTtcbiAgICB9XG5cbiAgICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUuY29sdW1ucykpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgdGFibGUuJyk7XG4gICAgfVxuXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHZhbHVlLnJvd3MpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIHRhYmxlLicpO1xuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgVFZQO1xubW9kdWxlLmV4cG9ydHMgPSBUVlA7XG4iXSwibWFwcGluZ3MiOiI7Ozs7OztBQUNBLElBQUFBLHVCQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFBaUYsU0FBQUQsdUJBQUFFLEdBQUEsV0FBQUEsR0FBQSxJQUFBQSxHQUFBLENBQUFDLFVBQUEsR0FBQUQsR0FBQSxLQUFBRSxPQUFBLEVBQUFGLEdBQUE7QUFFakYsTUFBTUcsYUFBYSxHQUFHQyxNQUFNLENBQUNDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3pDLE1BQU1DLGFBQWEsR0FBR0YsTUFBTSxDQUFDQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUV6QyxNQUFNRSxXQUFXLEdBQUdILE1BQU0sQ0FBQ0MsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBRTdDLE1BQU1HLEdBQWEsR0FBRztFQUNwQkMsRUFBRSxFQUFFLElBQUk7RUFDUkMsSUFBSSxFQUFFLFNBQVM7RUFDZkMsSUFBSSxFQUFFLEtBQUs7RUFFWEMsV0FBVyxFQUFFLFNBQUFBLENBQVNDLFNBQVMsRUFBRTtJQUMvQixNQUFNQyxLQUFLLEdBQUdELFNBQVMsQ0FBQ0MsS0FBWSxDQUFDLENBQUM7SUFDdEMsT0FBT0EsS0FBSyxDQUFDSCxJQUFJLEdBQUcsV0FBVztFQUNqQyxDQUFDO0VBRURJLGdCQUFnQkEsQ0FBQ0YsU0FBUyxFQUFF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