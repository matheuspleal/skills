export class Money {
  private constructor(private readonly cents: number) {}

  static create(cents: number): Money {
    if (!Number.isInteger(cents)) {
      throw new Error('money is stored in whole cents')
    }
    return new Money(cents)
  }

  static zero(): Money {
    return new Money(0)
  }

  add(other: Money): Money {
    return new Money(this.cents + other.cents)
  }

  toCents(): number {
    return this.cents
  }
}
