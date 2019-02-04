export function LEB128_u (value, pad = 0) {
  let bytes = []
  let byte = 0x00

  do {
    byte = value & 0x7F
    value = value >> 0x07

    if (value != 0 || pad > 0) {
      byte = byte | 0x80
    }

    bytes.push(byte)
    pad--
  } while (value != 0 || pad > -1)

  return new Uint8ClampedArray(bytes)
}