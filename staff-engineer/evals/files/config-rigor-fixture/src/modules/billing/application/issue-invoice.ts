import { Invoice } from '../domain/invoice'

export interface InvoiceRepository {
  findById(id: string): Promise<Invoice | null>
  save(invoice: Invoice): Promise<void>
}

export class IssueInvoice {
  constructor(private readonly invoices: InvoiceRepository) {}

  async execute(invoiceId: string): Promise<void> {
    const invoice = await this.invoices.findById(invoiceId)

    if (invoice === null) {
      throw new Error(`invoice ${invoiceId} not found`)
    }

    invoice.issue()
    await this.invoices.save(invoice)
  }
}
