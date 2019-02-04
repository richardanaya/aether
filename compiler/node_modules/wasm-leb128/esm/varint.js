import { LEB128_s } from './signed'

export function varint7 (value) {
  if (value < -64 || value > 63) {
    throw new Error(`${value} is not in [-64, 63]`)
  } else {
    return LEB128_s(value)
  }
}

export function varint32 (value) {
  if (value < -2147483648 || value > 2147483647) {
    throw new Error(`${value} is not in [-2147483648, 2147483647]`)
  } else {
    return LEB128_s(value)
  }
}

export function varint64 (value) {
  if (value < -9223372036854775808 || value > 9223372036854775807) {
    throw new Error(`${value} is not in [-9223372036854775808, 9223372036854775807]`)
  } else {
    return LEB128_s(value)
  }
}