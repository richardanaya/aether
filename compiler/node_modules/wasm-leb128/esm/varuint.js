import { LEB128_u } from './unsigned'

export function varuint1 (value) {
  if (value < 0 || value > 1) {
    throw new Error(`${value} is not in [0, 1]`)
  } else {
    return LEB128_u(value)
  }
}

export function varuint7 (value) {
  if (value < 0 || value > 127) {
    throw new Error(`${value} is not in [0, 127]`)
  } else {
    return LEB128_u(value)
  }
}

export function varuint32 (value) {
  if (value < 0 || value > 4294967295) {
    throw new Error(`${value} is not in [0, 4294967295]`)
  } else {
    return LEB128_u(value)
  }
}

export function varuint64 (value) {
  if (value < 0 || value > 18446744073709551615) {
    throw new Error(`${value} is not in [0, 18446744073709551615]`)
  } else {
    return LEB128_u(value)
  }
}