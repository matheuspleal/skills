import { describe, expect, it } from 'vitest'

import { Invoice } from '../src/modules/billing/domain/invoice'
import { Money } from '../src/modules/billing/domain/value-objects/money'

describe('Invoice', () => {
  it('sums its lines into a total', () => {
    const invoice = Invoice.create('inv-1', [Money.create(1000), Money.create(250)])

    expect(invoice.total().toCents()).toBe(1250)
  })

  it('refuses to be created without lines', () => {
    expect(() => Invoice.create('inv-2', [])).toThrow('at least one line')
  })

  it('refuses to be issued twice', () => {
    const invoice = Invoice.create('inv-3', [Money.create(500)])
    invoice.issue()

    expect(() => invoice.issue()).toThrow('cannot issue an invoice in status issued')
  })
})
