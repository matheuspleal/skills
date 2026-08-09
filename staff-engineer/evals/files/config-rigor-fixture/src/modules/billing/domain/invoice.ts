import { Money } from './value-objects/money'

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'void'

export class Invoice {
  private constructor(
    private readonly id: string,
    private readonly lines: ReadonlyArray<Money>,
    private status: InvoiceStatus
  ) {}

  static create(id: string, lines: ReadonlyArray<Money>): Invoice {
    if (lines.length === 0) {
      throw new Error('an invoice needs at least one line')
    }
    return new Invoice(id, lines, 'draft')
  }

  total(): Money {
    return this.lines.reduce((sum, line) => sum.add(line), Money.zero())
  }

  issue(): void {
    if (this.status !== 'draft') {
      throw new Error(`cannot issue an invoice in status ${this.status}`)
    }
    this.status = 'issued'
  }
}
