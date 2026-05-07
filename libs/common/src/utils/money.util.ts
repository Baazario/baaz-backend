/** All monetary values are stored as paise (integer bigint). Never use floats. */
export class Money {
  static fromRupees(rupees: number): bigint {
    return BigInt(Math.round(rupees * 100));
  }

  static toRupees(paise: bigint): number {
    return Number(paise) / 100;
  }

  static add(a: bigint, b: bigint): bigint {
    return a + b;
  }

  static subtract(a: bigint, b: bigint): bigint {
    if (b > a) throw new Error('Subtraction would result in negative money');
    return a - b;
  }

  static multiply(paise: bigint, factor: number): bigint {
    return BigInt(Math.round(Number(paise) * factor));
  }

  static format(paise: bigint, currency = 'INR'): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(
      Number(paise) / 100,
    );
  }
}
