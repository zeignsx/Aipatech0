import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface InvoiceData {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: string;
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string;
  customer: {
    name: string;
    company: string;
    email: string;
    phone: string;
    address: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
  company: {
    name: string;
    email: string;
    phone: string;
    address: string;
    logo?: string;
  };
}

export class InvoiceService {
  private static instance: InvoiceService;
  
  static getInstance(): InvoiceService {
    if (!InvoiceService.instance) {
      InvoiceService.instance = new InvoiceService();
    }
    return InvoiceService.instance;
  }

  async exportToPDF(invoice: InvoiceData): Promise<void> {
    try {
      console.log('Generating beautiful PDF for invoice:', invoice.invoice_number);
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Define beautiful colors
      const primaryBlue = [31, 58, 95]; // #1e3a5f
      const accentBlue = [59, 130, 246]; // #3b82f6
      const lightBlue = [239, 246, 255]; // #eff6ff
      const gold = [212, 175, 55]; // #d4af37
      const green = [45, 106, 79]; // #2d6a4f
      const gray = [107, 114, 128]; // #6b7280

      // Add decorative gradient header
      doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.rect(0, 0, 210, 60, 'F');
      
      // Add accent bar
      doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
      doc.rect(0, 60, 210, 3, 'F');
      
      // Add gold accent
      doc.setFillColor(gold[0], gold[1], gold[2]);
      doc.rect(0, 63, 210, 1, 'F');
      
      // Company Logo/Name
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('AIPATECH', 20, 25);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('ENERGY LIMITED', 20, 33);
      
      // INVOICE title
      doc.setFontSize(32);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(gold[0], gold[1], gold[2]);
      doc.text('INVOICE', 190, 35, { align: 'right' });
      
      // Invoice number
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(255, 255, 255);
      doc.text(`#${invoice.invoice_number}`, 190, 48, { align: 'right' });
      
      // Company Info Box
      doc.setFillColor(lightBlue[0], lightBlue[1], lightBlue[2]);
      doc.rect(20, 75, 85, 35, 'F');
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('FROM', 25, 85);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(invoice.company.name, 25, 93);
      doc.text(invoice.company.address, 25, 99);
      doc.text(invoice.company.email, 25, 105);
      
      // Bill To Box
      doc.setFillColor(lightBlue[0], lightBlue[1], lightBlue[2]);
      doc.rect(115, 75, 75, 35, 'F');
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('BILL TO', 120, 85);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(invoice.customer.name, 120, 93);
      if (invoice.customer.company) doc.text(invoice.customer.company, 120, 99);
      doc.text(invoice.customer.email, 120, 105);
      
      // Invoice Details Box
      doc.setFillColor(lightBlue[0], lightBlue[1], lightBlue[2]);
      doc.rect(115, 115, 75, 30, 'F');
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('INVOICE DETAILS', 120, 125);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(`Issue Date: ${invoice.issue_date}`, 120, 133);
      doc.text(`Due Date: ${invoice.due_date || 'N/A'}`, 120, 139);
      
      // Status Badge
      const statusColors: Record<string, number[]> = {
        paid: [34, 197, 94],
        sent: [59, 130, 246],
        draft: [107, 114, 128],
        overdue: [239, 68, 68],
      };
      const statusColor = statusColors[invoice.status] || statusColors.draft;
      doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.roundedRect(20, 115, 40, 12, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text(invoice.status.toUpperCase(), 40, 123, { align: 'center' });
      
      // Items Table
      const tableColumn = ["Description", "Qty", "Unit Price", "Amount"];
      const tableBody = invoice.items.map(item => [
        item.description,
        item.quantity.toString(),
        `${invoice.currency} ${item.unit_price.toLocaleString()}`,
        `${invoice.currency} ${item.amount.toLocaleString()}`
      ]);
      
      autoTable(doc, {
        startY: 160,
        head: [tableColumn],
        body: tableBody,
        theme: 'grid',
        headStyles: {
          fillColor: primaryBlue,
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10,
          halign: 'center',
        },
        bodyStyles: {
          fontSize: 9,
          valign: 'middle',
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 40, halign: 'right' },
          3: { cellWidth: 40, halign: 'right' },
        },
        margin: { left: 20, right: 20 },
      });
      
      const finalY = (doc as any).lastAutoTable.finalY || 160;
      
      // Totals Section with styling
      let yOffset = finalY + 10;
      
      // Draw totals box
      doc.setFillColor(lightBlue[0], lightBlue[1], lightBlue[2]);
      doc.roundedRect(120, yOffset - 5, 70, 50, 3, 3, 'F');
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.text('Subtotal:', 130, yOffset + 5);
      doc.text(`${invoice.currency} ${invoice.subtotal.toLocaleString()}`, 180, yOffset + 5, { align: 'right' });
      
      doc.text(`Tax (${invoice.tax_rate}%):`, 130, yOffset + 15);
      doc.text(`${invoice.currency} ${invoice.tax_amount.toLocaleString()}`, 180, yOffset + 15, { align: 'right' });
      
      // Total with gold accent
      doc.setDrawColor(gold[0], gold[1], gold[2]);
      doc.setLineWidth(0.5);
      doc.line(130, yOffset + 25, 185, yOffset + 25);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.text('TOTAL:', 130, yOffset + 35);
      doc.setTextColor(green[0], green[1], green[2]);
      doc.setFontSize(14);
      doc.text(`${invoice.currency} ${invoice.total.toLocaleString()}`, 180, yOffset + 35, { align: 'right' });
      
      // Notes Section
      if (invoice.notes) {
        yOffset += 55;
        doc.setFillColor(lightBlue[0], lightBlue[1], lightBlue[2]);
        doc.roundedRect(20, yOffset, 170, 25, 3, 3, 'F');
        doc.setTextColor(gray[0], gray[1], gray[2]);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('NOTES', 25, yOffset + 8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        const splitNotes = doc.splitTextToSize(invoice.notes, 160);
        doc.text(splitNotes, 25, yOffset + 16);
        yOffset += 35;
      }
      
      // Footer with gradient
      doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.rect(0, 280, 210, 17, 'F');
      doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
      doc.rect(0, 297, 210, 3, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text('Thank you for your business!', 105, 288, { align: 'center' });
      doc.setFontSize(7);
      doc.text('AIPATECH Energy Limited - Excellence • Innovation • Integrity', 105, 294, { align: 'center' });
      
      // Save the PDF
      const fileName = `Invoice_${invoice.invoice_number}.pdf`;
      doc.save(fileName);
      console.log('PDF generated successfully');
      
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error('Failed to generate PDF: ' + (error as Error).message);
    }
  }

  async exportToExcel(invoices: InvoiceData[]): Promise<void> {
    try {
      const worksheetData = invoices.map(inv => ({
        'Invoice Number': inv.invoice_number,
        'Customer': inv.customer.name,
        'Company': inv.customer.company,
        'Email': inv.customer.email,
        'Phone': inv.customer.phone,
        'Issue Date': inv.issue_date,
        'Due Date': inv.due_date,
        'Status': inv.status,
        'Subtotal': inv.subtotal,
        'Tax Rate %': inv.tax_rate,
        'Tax Amount': inv.tax_amount,
        'Total': inv.total,
        'Currency': inv.currency,
        'Items': inv.items.map(i => `${i.description} (${i.quantity} x ${i.unit_price})`).join('; '),
        'Notes': inv.notes,
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');
      
      XLSX.writeFile(workbook, `Invoices_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
      console.log('Excel generated successfully');
      
    } catch (error) {
      console.error('Excel generation error:', error);
      throw new Error('Failed to generate Excel file');
    }
  }

  async exportToCSV(invoices: InvoiceData[]): Promise<void> {
    try {
      const headers = ['Invoice Number', 'Customer', 'Company', 'Issue Date', 'Due Date', 'Status', 'Total', 'Currency'];
      const rows = invoices.map(inv => [
        inv.invoice_number,
        inv.customer.name,
        inv.customer.company,
        inv.issue_date,
        inv.due_date,
        inv.status,
        inv.total,
        inv.currency,
      ]);
      
      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `Invoices_Export_${new Date().toISOString().split('T')[0]}.csv`);
      console.log('CSV generated successfully');
      
    } catch (error) {
      console.error('CSV generation error:', error);
      throw new Error('Failed to generate CSV file');
    }
  }
}

export const invoiceService = InvoiceService.getInstance();