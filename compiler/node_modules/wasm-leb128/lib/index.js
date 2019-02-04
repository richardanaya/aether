'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function LEB128_s (value) {
  let bytes = [];
  let byte = 0x00;
  let size = Math.ceil(Math.log2(Math.abs(value)));
  let negative = value < 0;
  let more = true;

  while (more) {
    byte = value & 127;
    value = value >> 7;

    if (negative) {
      value = value | (- (1 << (size - 7)));
    }

    if (
      (value == 0 && ((byte & 0x40) == 0)) ||
      (value == -1 && ((byte & 0x40) == 0x40))
    ) {
      more = false;
    } 
    
    else {
      byte = byte | 128;
    }

    bytes.push(byte);
  }

  return new Uint8ClampedArray(bytes)
}

function varint7 (value) {
  if (value < -64 || value > 63) {
    throw new Error(`${value} is not in [-64, 63]`)
  } else {
    return LEB128_s(value)
  }
}

function varint32 (value) {
  if (value < -2147483648 || value > 2147483647) {
    throw new Error(`${value} is not in [-2147483648, 2147483647]`)
  } else {
    return LEB128_s(value)
  }
}

function varint64 (value) {
  if (value < -9223372036854775808 || value > 9223372036854775807) {
    throw new Error(`${value} is not in [-9223372036854775808, 9223372036854775807]`)
  } else {
    return LEB128_s(value)
  }
}

function LEB128_u (value, pad = 0) {
  let bytes = [];
  let byte = 0x00;

  do {
    byte = value & 0x7F;
    value = value >> 0x07;

    if (value != 0 || pad > 0) {
      byte = byte | 0x80;
    }

    bytes.push(byte);
    pad--;
  } while (value != 0 || pad > -1)

  return new Uint8ClampedArray(bytes)
}

function varuint1 (value) {
  if (value < 0 || value > 1) {
    throw new Error(`${value} is not in [0, 1]`)
  } else {
    return LEB128_u(value)
  }
}

function varuint7 (value) {
  if (value < 0 || value > 127) {
    throw new Error(`${value} is not in [0, 127]`)
  } else {
    return LEB128_u(value)
  }
}

function varuint32 (value) {
  if (value < 0 || value > 4294967295) {
    throw new Error(`${value} is not in [0, 4294967295]`)
  } else {
    return LEB128_u(value)
  }
}

function varuint64 (value) {
  if (value < 0 || value > 18446744073709551615) {
    throw new Error(`${value} is not in [0, 18446744073709551615]`)
  } else {
    return LEB128_u(value)
  }
}

exports.varint7 = varint7;
exports.varint32 = varint32;
exports.varint64 = varint64;
exports.varuint1 = varuint1;
exports.varuint7 = varuint7;
exports.varuint32 = varuint32;
exports.varuint64 = varuint64;
exports.LEB128_s = LEB128_s;
exports.LEB128_u = LEB128_u;
