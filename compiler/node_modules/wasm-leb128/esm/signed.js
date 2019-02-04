export function LEB128_s (value) {
  let bytes = []
  let byte = 0x00
  let size = Math.ceil(Math.log2(Math.abs(value)))
  let negative = value < 0
  let more = true

  while (more) {
    byte = value & 127
    value = value >> 7

    if (negative) {
      value = value | (- (1 << (size - 7)))
    }

    if (
      (value == 0 && ((byte & 0x40) == 0)) ||
      (value == -1 && ((byte & 0x40) == 0x40))
    ) {
      more = false
    } 
    
    else {
      byte = byte | 128
    }

    bytes.push(byte)
  }

  return new Uint8ClampedArray(bytes)
}