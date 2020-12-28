class CPU {
  constructor(registers, counter, bus) {
    this.registers = registers;
    this.counter = counter;
    this.bus = bus;
  }

  step() {
    const instruction  = this.bus[this.counter];
  }

  pair(left, right) {
    return (
      ['af', 'bc', 'de', 'hl'].indexOf(left + right) === -1
        ? -1
        : (this.registers[left] << 4) + this.registers[right]
    );
  }

  /**
   * Sets a register to the specified value.
   * @param {string} id ID of the register
   * @param {number} value The new register value
   */
  set(id, value) {
    this.registers[id] = value % 256;
  }

  /**
   * Sets the upper nibble of the flags register `f` to the specified value. 
   * @param {boolean} f7 value for the `zero` flag
   * @param {boolean} f6 value for the `subtract` flag
   * @param {boolean} f5 value for the `carry` flag
   * @param {boolean} f4 value for the `half carry` flag
   */
  setFlags(f7, f6, f5, f4) {
    set('f', (
        f7 ? 8 : 0
      + f6 ? 4 : 0
      + f5 ? 2 : 0
      + f4 ? 1 : 0
    ) << 4);
  }

  /**
   * Writes the sum of the values of registers `write` and `target` to register `write`.
   * @param {string} target ID of the target register
   * @param {string} [write] ID of the register to write the result to. `a` by default.
   */
  add(target, write) {
    if (!write) {
      write = 'a';
    }
    const result = this.registers[target] + this.registers[write];
    this.setFlags(
      result === 0,
      false,
      result > 0xff,
      (this.registers[target] % 16) + (this.registers[write] % 16) > 0xf
    );
    set(write, result % 256);
  }

  /**
   * Writes the sum of the values of registers `pair` and `target` to register `pair`.
   * @param {string} target ID of the target register
   * @param {string} [pair] ID of the register pair to write to. `hl` by default.
   */
  addToPair(target, pair) {
    const lowerResult = (this.registers[target] + this.registers[pair[1]]);
    this.setFlags(
      lowerResult === 0,
      false,
      lowerResult > 0xffff,
      (this.registers[target] % 16) + (this.registers[pair[1]] % 16) > 0xf
    );
    this.set(pair[1], lowerResult % 256);

    const carryToUpper = (lowerResult % 256) >>> 8;
    const upperResult = this.registers[pair[0]] + carryToUpper;
    this.setFlags(
      upperResult === 0,
      false,
      upperResult > 0xffff,
      (carryToUpper % 16) + (this.registers[pair[0]] % 16) > 0xf
    );
    this.set(pair[0], upperResult % 256);
  }

  /**
   * Writes the sum of the values of registers `write` and `target` and the `carry` flag to register `write`.
   * @param {string} target ID of the target register
   * @param {string} [write] ID of the register to write the result to. `a` by default.
   */
  adc(target, write) {
    if (!write) {
      write = 'a';
    }
    const addResult = this.registers[target] + this.registers[write];
    const carry = result > 0xff;
    const result = addResult + (carry ? 2 : 0);
    // TODO Am I supposed to add the `carry` value from *before* or *after* the `add` operation?
    this.setFlags(
      result === 0,
      false,
      carry,
      (this.registers[target] % 16) + (this.registers[write] % 16) > 0xf
    );
    set(write, result % 256);
  }

  // TODO Check all of this sub stuff
  /**
   * Writes the difference between the values of registers `target` and `write` to register `write`.
   * @param {string} target ID of the target register
   * @param {string} [write] ID of the register to write the result to. `a` by default.
   */
  sub(target, write) {
    if (!write) {
      write = 'a';
    }
    const result = this.registers[target] - this.registers[write];
    this.setFlags(
      result === 0,
      true,
      result > 0xff,
      (this.registers[target] % 16) - (this.registers[write] % 16) > 0xf
    );
    set(write, result % 256);
  }

  /**
   * Writes the difference between the values of registers `target` and `write` and the `carry` flag to register `write`.
   * @param {string} target ID of the target register
   * @param {string} [write] ID of the register to write the result to. `a` by default.
   */
  sbc(target, write) {
    if (!write) {
      write = 'a';
    }
    const subResult = this.registers[target] - this.registers[write];
    const carry = result > 0xff;
    const result = subResult - (carry ? 2 : 0);
    // TODO Am I supposed to add the `carry` value from *before* or *after* the `sub` operation?
    this.setFlags(
      result === 0,
      true,
      carry,
      (this.registers[target] % 16) - (this.registers[write] % 16) > 0xf
    );
    set(write, result % 256);
  }

  /**
   * Writes the result of a bitwise `AND` operation on the values of registers `write` and `target` to register `write`.
   * @param {string} target ID of the target register
   * @param {string} [write] ID of the register to write the result to. `a` by default.
   */
  and(target, write) {
    if (!write) {
      write = 'a';
    }
    const result = this.registers[target] & this.registers[write];
    this.setFlags(
      result === 0,
      false,
      result > 0xff,
      ((this.registers[target] % 16) & (this.registers[write] % 16)) > 0xf
    );
    set(write, result % 256);
  }

  /**
   * Writes the result of a bitwise `OR` operation on the values of registers `write` and `target` to register `write`.
   * @param {string} target ID of the target register
   * @param {string} [write] ID of the register to write the result to. `a` by default.
   */
  or(target, write) {
    if (!write) {
      write = 'a';
    }
    const result = this.registers[target] | this.registers[write];
    this.setFlags(
      result === 0,
      false,
      result > 0xff,
      ((this.registers[target] % 16) | (this.registers[write] % 16)) > 0xf
    );
    set(write, result % 256);
  }

  /**
   * Writes the result of a bitwise `XOR` operation on the values of registers `write` and `target` to register `write`.
   * @param {string} target ID of the target register
   * @param {string} [write] ID of the register to write the result to. `a` by default.
   */
  xor(target, write) {
    if (!write) {
      write = 'a';
    }
    const result = this.registers[target] ^ this.registers[write];
    this.setFlags(
      result === 0,
      false,
      result > 0xff,
      ((this.registers[target] % 16) ^ (this.registers[write] % 16)) > 0xf
    );
    set(write, result % 256);
  }

  // TODO Check all of this sub stuff
  /**
   * Calculates the difference between the values of registers `target` and `other`.
   *  Only writes to the `flags` register.
   * @param {string} target ID of the target register
   * @param {string} [other] ID of the register to compare with. `a` by default.
   */
  cp(target, other) {
    if (!other) {
      other = 'a';
    }
    const result = this.registers[target] - this.registers[other];
    this.setFlags(
      result === 0,
      true,
      result > 0xff,
      (this.registers[target] % 16) - (this.registers[other] % 16) > 0xf
    );
  }

  /**
   * Increments the value in a specific register by 1.
   * @param {string} [target] ID of the target register. `a` by default.
   */
  inc(target) {
    if (!target) {
      target = 'a';
    }
    const result = this.registers[target] + 1;
    this.setFlags(
      result === 0,
      false,
      result > 0xff,
      ((this.registers[target] % 16) + 1) > 0xf
    );
    this.set(target, result % 256);
  }

  /**
   * Decrements the value in a specific register by 1.
   * @param {string} [target] ID of the target register. `a` by default.
   */
  dec(target) {
    if (!target) {
      target = 'a';
    }
    const result = this.registers[target] - 1;
    this.setFlags(
      result === 0,
      true,
      result > 0xff,
      ((this.registers[target] % 16) - 1) > 0xf
    );
    this.set(target, result % 256);
  }

  /**
   * Toggles the value of the `carry` flag.
   */
  ccf() {
    const flagsNibble = this.registers['f'] >>> 4;
    this.setFlags(
      (flagsNibble & (1 << 3)) > 0,
      (flagsNibble & (1 << 2)) > 0,
      (flagsNibble & (1 << 1)) === 0,
      (flagsNibble & (1 << 0)) > 0
    );
  }

  /**
   * Sets the value of the `carry` flag to `true`.
   */
  scf() {
    const flagsNibble = this.registers['f'] >>> 4;
    this.setFlags(
      (flagsNibble & (1 << 3)) > 0,
      (flagsNibble & (1 << 2)) > 0,
      true,
      (flagsNibble & (1 << 0)) > 0
    );
  }

  /**
   * Performs a right rotation through carry on the specified register.
   * @param {string} [target] ID of the register. `a` by default.
   */
  rr(target) {
    if (!target) {
      target = 'a';
    }
    const shiftOut = (this.registers[target] & (1 << 0)) === 0 ? 0 : 1;
    const carry = (this.registers['f'] & (1 << 1)) === 0 ? 0 : 1;
    const result = (this.registers[target] >>> 1) | (carry << 7);
    this.setFlags(
      (flagsNibble & (1 << 3)) > 0,
      (flagsNibble & (1 << 2)) > 0,
      shiftOut === 1,
      (flagsNibble & (1 << 0)) > 0
    );
    this.set(target, result % 256);
  }

  /**
   * Performs a left rotation through carry on the specified register.
   * @param {string} [target] ID of the register. `a` by default.
   */
  rl(target) {
    if (!target) {
      target = 'a';
    }
    const shiftOut = (this.registers[target] & (1 << 7)) === 0 ? 0 : 1;
    const carry = (this.registers['f'] & (1 << 1)) === 0 ? 0 : 1;
    const result = (this.registers[target] << 1) | (carry << 0);
    this.setFlags(
      (flagsNibble & (1 << 3)) > 0,
      (flagsNibble & (1 << 2)) > 0,
      shiftOut === 1,
      (flagsNibble & (1 << 0)) > 0
    );
    this.set(target, result % 256);
  }

  /**
   * Performs a right rotation on the specified register.
   * @param {string} [target] ID of the register. `a` by default.
   */
  rrc(target) {
    if (!target) {
      target = 'a';
    }
    const shiftOut = (this.registers[target] & (1 << 0)) === 0 ? 0 : 1;
    const result = (this.registers[target] >>> 1) | (shiftOut << 7);
    this.set(target, result % 256);
  }

  /**
   * Performs a left rotation on the specified register.
   * @param {string} [target] ID of the register. `a` by default.
   */
  rlc(target) {
    if (!target) {
      target = 'a';
    }
    const shiftOut = (this.registers[target] & (1 << 0)) === 0 ? 0 : 1;
    const result = (this.registers[target] << 1) | (shiftOut << 0);
    this.set(target, result % 256);
  }

  /**
   * Toggles every bit of the specified register.
   * @param {string} [target] ID of the register. `a` by default.
   */
  cpl(target) {
    if (!target) {
      target = 'a';
    }
    const result = ~this.registers[target];
    this.set(target, result % 256);
  }

  /**
   * Checks whether the bit at `position` in the specified register is set.
   * @param {string} [target] ID of the register. `a` by default.
   * @param {number} position Position of the bit to check (0-7)
   * @return {boolean} `true` if the bit is set, `false` otherwise
   */
  bit(target, position) {
    if (!target) {
      target = 'a';
    }
    return ((this.registers[target] >> position) % 2 !== 0);
  }

  /**
   * Sets the bit at `position` in the specified register to `0`.
   * @param {string} [target] ID of the register. `a` by default.
   * @param {number} position Position of the bit to set (0-7)
   */
  reset(target, position) {
    if (!target) {
      target = 'a';
    }
    const result = this.registers[target] & ~(1 << position);
    this.set(target, result);
  }

  /**
   * Sets the bit at `position` in the specified register to `1`.
   * @param {string} [target] ID of the register. `a` by default.
   * @param {number} position Position of the bit to set (0-7)
   */
  set(target, position) {
    if (!target) {
      target = 'a';
    }
    const result = this.registers[target] | (1 << position);
    this.set(target, result);
  }

  /**
   * Bit shifts the specified register right by 1.
   * @param {string} [target] ID of the register. `a` by default.
   */
  srl() {
    if (!target) {
      target = 'a';
    }
    const result = this.registers[target] >> 1;
    this.set(target, result);
  }

  /**
   * Performs a right rotation through carry on the `a` register.
   */
  rra() {
    this.rr('a');
  }

  /**
   * Performs a left rotation through carry on the `a` register.
   */
  rla() {
    this.rl('a');
  }

  /**
   * Performs a right rotation on the `a` register.
   */
  rrca() {
    this.rrc('a');
  }

  /**
   * Performs a left rotation on the `a` register.
   */
  rlca() {
    this.rlc('a');
  }

  /**
   * Performs an arithmetic right shift on the specified register.
   * @param {string} [target] ID of the register. `a` by default.
   */
  sra(target) {
    if (!target) {
      target = 'a';
    }
    const result = this.registers[target] >> 1;
    this.set(target, result);
  }

  /**
   * Performs a left shift on the specified register.
   * @param {string} [target] ID of the register. `a` by default.
   */
  sla(target) {
    if (!target) {
      target = 'a';
    }
    const result = this.registers[target] << 1;
    this.set(target, result);
  }

  /**
   * Swaps the upper and lower nibbles of the specified register.
   * @param {string} [target] ID of the register. `a` by default.
   */
  swap(target) {
    if (!target) {
      target = 'a';
    }
    const result = ((this.registers[target] % 16) << 4) + ((this.registers[target] - (this.registers[target] % 16)) >>> 4);
    this.set(target, result);
  }
}

module.exports = { CPU };