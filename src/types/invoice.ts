export interface InvoiceItem {
  id: string;
  itemName: string;
  quantity: string;
  rate: string;
  amount: string;
}

export interface InvoiceData {
  items: InvoiceItem[];
  invoiceNumber?: string;
  date?: string;
  customerName?: string;
  subtotal?: number;
  tax?: number;
  total?: number;
}

export type Step = 'upload' | 'edit' | 'preview' | 'download';
