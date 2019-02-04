"use strict";

var flatten = function flatten(list) {
  return list.reduce(function (a, b) {
    return a.concat(Array.isArray(b) ? flatten(b) : b);
  }, []);
};

function flattenBytes(arr) {
  for (var i in arr) {
    if (Array.isArray(arr[i])) {
      arr[i] = flattenBytes(arr[i]);
    }
  }
  return flatten(arr);
}

module.exports = flattenBytes;
