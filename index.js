const cpu = new (require('./cpu/cpu').CPU)(
  registers = {
    'a': 0x00,
    'b': 0x00,
    'c': 0x00,
    'd': 0x00,
    'e': 0x00,
    'f': 0x00,
    'g': 0x00,
    'h': 0x00,
    'i': 0x00,
    'j': 0x00,
    'k': 0x00,
    'l': 0x00
  },
  counter = 0,
  bus = new Array(0xffff)
);

console.log(cpu);