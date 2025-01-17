"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TransientErrorLookup = void 0;
// This simple piece of code is factored out into a separate class to make it
// easy to stub it out in tests. It's hard, if not impossible, to cause a
// transient error on demand in tests.
class TransientErrorLookup {
  isTransientError(error) {
    // This list of transient errors comes from Microsoft implementation of SqlClient:
    //  - https://github.com/dotnet/corefx/blob/master/src/System.Data.SqlClient/src/System/Data/SqlClient/SqlInternalConnectionTds.cs#L115
    const transientErrors = [4060, 10928, 10929, 40197, 40501, 40613];
    return transientErrors.indexOf(error) !== -1;
  }
}
exports.TransientErrorLookup = TransientErrorLookup;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUcmFuc2llbnRFcnJvckxvb2t1cCIsImlzVHJhbnNpZW50RXJyb3IiLCJlcnJvciIsInRyYW5zaWVudEVycm9ycyIsImluZGV4T2YiLCJleHBvcnRzIl0sInNvdXJjZXMiOlsiLi4vc3JjL3RyYW5zaWVudC1lcnJvci1sb29rdXAudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gVGhpcyBzaW1wbGUgcGllY2Ugb2YgY29kZSBpcyBmYWN0b3JlZCBvdXQgaW50byBhIHNlcGFyYXRlIGNsYXNzIHRvIG1ha2UgaXRcbi8vIGVhc3kgdG8gc3R1YiBpdCBvdXQgaW4gdGVzdHMuIEl0J3MgaGFyZCwgaWYgbm90IGltcG9zc2libGUsIHRvIGNhdXNlIGFcbi8vIHRyYW5zaWVudCBlcnJvciBvbiBkZW1hbmQgaW4gdGVzdHMuXG5leHBvcnQgY2xhc3MgVHJhbnNpZW50RXJyb3JMb29rdXAge1xuICBpc1RyYW5zaWVudEVycm9yKGVycm9yOiBudW1iZXIpIHtcbiAgICAvLyBUaGlzIGxpc3Qgb2YgdHJhbnNpZW50IGVycm9ycyBjb21lcyBmcm9tIE1pY3Jvc29mdCBpbXBsZW1lbnRhdGlvbiBvZiBTcWxDbGllbnQ6XG4gICAgLy8gIC0gaHR0cHM6Ly9naXRodWIuY29tL2RvdG5ldC9jb3JlZngvYmxvYi9tYXN0ZXIvc3JjL1N5c3RlbS5EYXRhLlNxbENsaWVudC9zcmMvU3lzdGVtL0RhdGEvU3FsQ2xpZW50L1NxbEludGVybmFsQ29ubmVjdGlvblRkcy5jcyNMMTE1XG4gICAgY29uc3QgdHJhbnNpZW50RXJyb3JzID0gWzQwNjAsIDEwOTI4LCAxMDkyOSwgNDAxOTcsIDQwNTAxLCA0MDYxM107XG4gICAgcmV0dXJuIHRyYW5zaWVudEVycm9ycy5pbmRleE9mKGVycm9yKSAhPT0gLTE7XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ08sTUFBTUEsb0JBQW9CLENBQUM7RUFDaENDLGdCQUFnQkEsQ0FBQ0MsS0FBYSxFQUFFO0lBQzlCO0lBQ0E7SUFDQSxNQUFNQyxlQUFlLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQztJQUNqRSxPQUFPQSxlQUFlLENBQUNDLE9BQU8sQ0FBQ0YsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0VBQzlDO0FBQ0Y7QUFBQ0csT0FBQSxDQUFBTCxvQkFBQSxHQUFBQSxvQkFBQSJ9