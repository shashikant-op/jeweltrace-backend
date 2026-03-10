import { useState, useEffect } from "react";
import { Search, Plus, IndianRupee, Loader2, X, Trash2, Printer, Download, Save, ArrowLeft, MessageSquare } from "lucide-react";
import { formatCurrency, formatDate } from "@/data/dummy-data";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  useInvoices, useCustomers, useProducts, createInvoice, 
  getCustomerName, fetchInvoiceById, useStore, useMetalRates, calculateProductPrice 
} from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { QRCodeSVG } from "qrcode.react";

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api`;

export default function BillingPage() {
  const [search, setSearch] = useState("");
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isInvoiceDetailsOpen, setIsInvoiceDetailsOpen] = useState(false);
  const [showUPICode, setShowUPICode] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: invoices = [], isLoading: loadingInvoices } = useInvoices();
  const { data: customers = [], isLoading: loadingCustomers } = useCustomers();
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: store } = useStore();
  const { data: metalRatesData } = useMetalRates();
  const rates = metalRatesData?.rates;

  // New Invoice Form State
  const [invoiceForm, setInvoiceForm] = useState({
    customer_id: "",
    customer_name: "",
    customer_phone: "",
    invoice_date: new Date().toISOString().split('T')[0],
    payment_method: "cash",
    payment_status: "paid",
    notes: "",
    include_gst: true,
    gst_rate: 3,
    items: [] as any[]
  });

  const resetInvoiceForm = () => {
    setInvoiceForm({
      customer_id: "",
      customer_name: "",
      customer_phone: "",
      invoice_date: new Date().toISOString().split('T')[0],
      payment_method: "cash",
      payment_status: "paid",
      notes: "",
      include_gst: true,
      gst_rate: 3,
      items: []
    });
  };

  const handlePhoneChange = async (phone: string) => {
    setInvoiceForm(prev => ({ ...prev, customer_phone: phone }));
    
    // Auto-lookup if phone looks valid (e.g., 10 digits for India)
    // We can be flexible, maybe start lookup after 5+ digits
    if (phone.length >= 10) {
      try {
        const { lookupCustomerByPhone } = await import("@/lib/api");
        const customer = await lookupCustomerByPhone(phone);
        if (customer) {
          setInvoiceForm(prev => ({ 
            ...prev, 
            customer_id: customer.id, 
            customer_name: customer.name 
          }));
          toast({ title: "Customer Found", description: `Welcome back, ${customer.name}!` });
        } else {
          // Reset ID but keep name if it was set
          setInvoiceForm(prev => ({ ...prev, customer_id: "" }));
        }
      } catch (error) {
        console.error("Lookup error:", error);
      }
    }
  };

  const addItemToInvoice = (product: any) => {
    const karatStr = String(product.karat || '').toLowerCase();
    const karatNum = parseInt(karatStr.replace(/[^0-9]/g, '')) || 0;
    let perGm = 0;
    if (product.metal_type === 'gold') {
      if (karatNum >= 24) perGm = Number(rates?.gold_24k_per_gm) || 0;
      else if (karatNum >= 22) perGm = Number(rates?.gold_22k_per_gm) || 0;
      else if (karatNum >= 18) perGm = Number(rates?.gold_18k_per_gm) || 0;
    } else if (product.metal_type === 'silver') {
      perGm = Number(rates?.silver_per_gm) || 0;
    } else if (product.metal_type === 'platinum') {
      perGm = Number(rates?.platinum_per_gm) || 0;
    }

    const metalPrice = (Number(product.net_weight) || 0) * perGm;
    const makingCharges = Number(product.making_charges) || 0;
    const unitPrice = metalPrice + makingCharges;

    const existingItemIndex = invoiceForm.items.findIndex(item => item.product_id === product.id);
    if (existingItemIndex > -1) {
      const newItems = [...invoiceForm.items];
      newItems[existingItemIndex].quantity += 1;
      const item = newItems[existingItemIndex];
      item.total_price = item.quantity * (item.metal_price + item.making_charges) * (1 - (item.discount_percent / 100));
      setInvoiceForm({ ...invoiceForm, items: newItems });
    } else {
      setInvoiceForm({
        ...invoiceForm,
        items: [...invoiceForm.items, {
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          metal_price: metalPrice,
          making_charges: makingCharges,
          unit_price: unitPrice,
          discount_percent: 0,
          total_price: unitPrice,
          metal_type: product.metal_type,
          karat: product.karat,
          weight: product.net_weight
        }]
      });
    }
  };

  const removeItemFromInvoice = (index: number) => {
    const newItems = [...invoiceForm.items];
    newItems.splice(index, 1);
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    const newItems = [...invoiceForm.items];
    const item = newItems[index];
    item.quantity = quantity;
    item.total_price = quantity * (item.metal_price + item.making_charges) * (1 - (item.discount_percent / 100));
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  const updateItemPrice = (index: number, field: 'metal_price' | 'making_charges', value: number) => {
    const newItems = [...invoiceForm.items];
    const item = newItems[index];
    item[field] = value;
    item.unit_price = item.metal_price + item.making_charges;
    item.total_price = item.quantity * item.unit_price * (1 - (item.discount_percent / 100));
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  const calculateSubtotal = () => {
    return invoiceForm.items.reduce((sum, item) => sum + ((item.metal_price + item.making_charges) * item.quantity), 0);
  };

  const calculateDiscount = () => {
    return invoiceForm.items.reduce((sum, item) => sum + (item.unit_price * item.quantity * (item.discount_percent / 100)), 0);
  };

  const calculateTax = (subtotal: number, discount: number) => {
    if (!invoiceForm.include_gst) return 0;
    return (subtotal - discount) * (invoiceForm.gst_rate / 100);
  };

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (invoiceForm.items.length === 0) {
      toast({ title: "Error", description: "Please add at least one item to the invoice.", variant: "destructive" });
      return;
    }

    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const tax_amount = calculateTax(subtotal, discount);
    const total_amount = subtotal - discount + tax_amount;

    try {
      const payload = {
        ...invoiceForm,
        subtotal,
        discount,
        tax_amount,
        total_amount
      };

      const result = await createInvoice(payload);
      
      // The backend returns the final calculated items with metal_price and making_charges
      // If result.items is not returned, we use the local items
      const finalItems = result.items || invoiceForm.items;

      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      const phone = invoiceForm.customer_phone;
      const invoiceNo = result.invoice_number;
      const customerName = invoiceForm.customer_name;
      const total = formatCurrency(total_amount);
      const storeName = store?.name || "our store";
      
      // Construct a full invoice object for sharing
      const newInvoiceObj = {
        ...invoiceForm,
        items: finalItems,
        id: result.invoice_id,
        invoice_number: result.invoice_number,
        subtotal,
        discount,
        tax_amount,
        total_amount,
        customer: {
          name: customerName,
          phone: phone,
        }
      };

      setIsNewInvoiceOpen(false);
      resetInvoiceForm();

      // Offer to send WhatsApp
      toast({ 
        title: "Invoice Created", 
        description: "The invoice has been successfully generated.",
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => sendWhatsAppMessage(newInvoiceObj)}
          >
            Send WhatsApp
          </Button>
        )
      });
    } catch (error: any) {
      const msg = error?.message || "";
      if (msg.includes('402') || msg.toLowerCase().includes('upgrade')) {
        toast({ title: "Upgrade Required", description: "You need an active plan to generate more invoices. Go to Settings → Subscription.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    }
  };

  const viewInvoiceDetails = async (id: string) => {
    try {
      const invoice = await fetchInvoiceById(id);
      setSelectedInvoice(invoice);
      setIsInvoiceDetailsOpen(true);
      setShowUPICode(false);
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to load invoice details.", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (
      selectedInvoice &&
      selectedInvoice.payment_method === 'upi' &&
      selectedInvoice.payment_status !== 'paid' &&
      store?.upi_id
    ) {
      setShowUPICode(true);
    }
  }, [selectedInvoice, store?.upi_id]);

  const handleApprovePayment = async (invoiceId: string) => {
    setIsVerifyingPayment(true);
    try {
      // Assuming we have an endpoint to update payment status
      await fetch(`${API_BASE_URL}/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: 'paid' }),
      });
      
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setSelectedInvoice((prev: any) => ({ ...prev, payment_status: 'paid' }));
      setShowUPICode(false);
      
      toast({
        title: "Payment Approved",
        description: "Invoice status has been updated to PAID.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update payment status.",
        variant: "destructive"
      });
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  const getUPILink = (invoice: any) => {
    if (!store?.upi_id) return "";
    const name = encodeURIComponent(store.name || "JewelTrack Suite");
    const amount = invoice.total_amount || 0;
    const ref = encodeURIComponent(invoice.invoice_number || "INV");
    return `upi://pay?pa=${store.upi_id}&pn=${name}&am=${amount}&tr=${ref}&tn=Payment%20for%20Invoice%20${ref}&cu=INR`;
  };

  const getUPILinkForCurrentTotal = (total: number) => {
    if (!store?.upi_id) return "";
    const name = encodeURIComponent(store.name || "JewelTrack Suite");
    const ref = encodeURIComponent(`NEW_${new Date().toISOString()}`);
    return `upi://pay?pa=${store.upi_id}&pn=${name}&am=${total}&tr=${ref}&tn=Payment%20for%20Invoice&cu=INR`;
  };
 const HEADER_IMAGE = "data:image/jpeg;base64,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";
  const generateInvoicePDF = (invoice: any, store: any) => {
    const doc = new jsPDF();
    const margin = 20;
    const goldColor: [number, number, number] = [184, 134, 11];
    const darkColor: [number, number, number] = [20, 20, 20];
    const lightGold: [number, number, number] = [252, 250, 242];

    const formatPDFCurrency = (amt: number, includeSymbol = false) => {
      const formatted = new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2
      }).format(amt);
      return includeSymbol ? "INR " + formatted : formatted;
    };

    doc.setFillColor(lightGold[0], lightGold[1], lightGold[2]);
    doc.rect(0, 0, 210, 297, 'F');

    // --- REPLACED SECTION: IMAGE HEADER ---
    
    try {
    // This will now work 100% of the time because the data is local
    doc.addImage(HEADER_IMAGE, 'JPEG', 0, 0, 210, 45, undefined, 'FAST');
  } catch (e) {
    doc.setFillColor(20, 20, 20);
    doc.rect(0, 0, 210, 45, 'F');
  }
    // --------------------------------------

    doc.setFont("times", "bolditalic");
    doc.setFontSize(32);
    doc.setTextColor(255, 255, 255);
    doc.text("JewelTrack", margin, 30);
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
    doc.text("PREMIER JEWELRY MANAGEMENT", margin, 38);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text((store?.name || "Boutique").toUpperCase(), 190, 25, { align: 'right' });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.text(doc.splitTextToSize(store?.address || "", 60), 190, 31, { align: 'right' });
    doc.setFont("times", "bold");
    doc.setFontSize(22);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text("INVOICE", margin, 65);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`REF: ${invoice.invoice_number || "N/A"}`, margin, 72);
    doc.text(`DATE: ${formatDate(invoice.invoice_date).toUpperCase()}`, margin, 77);
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.1);
    doc.line(margin, 85, 190, 85);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
    doc.text("BILLED TO", margin, 95);
    doc.text("PAYMENT METHOD", 190, 95, { align: 'right' });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text(invoice.customer?.name || "Walk-in Customer", margin, 102);
    doc.text((invoice.payment_method || "N/A").toUpperCase(), 190, 102, { align: 'right' });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(invoice.customer?.phone || "", margin, 107);
    doc.text(`Status: ${(invoice.payment_status || "Pending").toUpperCase()}`, 190, 107, { align: 'right' });

    const tableData = (invoice.items || []).map((item: any) => {
      const metalP = item.metal_price || 0;
      const makingC = item.making_charges || 0;
      const unitP = metalP + makingC;
      
      return [
        { content: item.product_name || "Product", styles: { fontStyle: 'bold' } },
        `${item.metal_type || "N/A"} ${item.karat || ""} (${item.weight || 0}g)\nMetal: ${formatPDFCurrency(metalP)} | Making: ${formatPDFCurrency(makingC)}`,
        item.quantity || 0,
        formatPDFCurrency(unitP),
        { content: formatPDFCurrency(item.total_price || 0), styles: { halign: 'right', fontStyle: 'bold' } }
      ];
    });

    autoTable(doc, {
      startY: 120,
      head: [['DESCRIPTION', 'SPECIFICATIONS', 'QTY', 'UNIT PRICE', 'TOTAL']],
      body: tableData,
      theme: 'plain',
      headStyles: { fillColor: [255, 255, 255], textColor: goldColor, fontSize: 8, fontStyle: 'bold', cellPadding: 4 },
      bodyStyles: { fontSize: 9, cellPadding: 6, textColor: [60, 60, 60] },
      margin: { left: margin, right: margin }
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 180;
    const totalsX = 140;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120);
    doc.text(`SUBTOTAL`, totalsX, finalY + 15);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text(formatPDFCurrency(invoice.subtotal || 0), 190, finalY + 15, { align: 'right' });
    if ((invoice.discount || 0) > 0) {
      doc.setTextColor(120);
      doc.text(`DISCOUNT`, totalsX, finalY + 22);
      doc.setTextColor(220, 38, 38);
      doc.text(`- ${formatPDFCurrency(invoice.discount)}`, 190, finalY + 22, { align: 'right' });
    }
    let yOffset = (invoice.discount || 0) > 0 ? 22 : 15;
    if ((invoice.tax_amount || 0) > 0) {
      yOffset += 7;
      doc.setTextColor(120);
      doc.text(`TAX (GST)`, totalsX, finalY + yOffset);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text(formatPDFCurrency(invoice.tax_amount), 190, finalY + yOffset, { align: 'right' });
    }
    yOffset += 10;
    doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
    doc.setLineWidth(0.5);
    doc.line(totalsX, finalY + yOffset - 5, 190, finalY + yOffset - 5);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text(`TOTAL`, totalsX, finalY + yOffset + 3);
    doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
    doc.text(formatPDFCurrency(invoice.total_amount || 0, true), 190, finalY + yOffset + 3, { align: 'right' });
    doc.setFont("times", "italic");
    doc.setFontSize(10);
    doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
    doc.text("A legacy of trust and elegance.", 105, 275, { align: 'center' });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(180);
    doc.text("JEWELTRACK SUITE | PREMIER EDITION", 105, 285, { align: 'center' });

    return doc;
  };

  const printInvoice = (invoice: any) => {
    try {
      const doc = generateInvoicePDF(invoice, store);
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      
      // Creating a hidden iframe for silent-ish print
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);
      
      iframe.onload = () => {
        // Give the PDF content time to render inside the iframe
        setTimeout(() => {
          if (iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          }
          
          // Cleanup after printing
          setTimeout(() => {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(url);
          }, 1000);
        }, 1000); // 1s delay for PDF engine to wake up
      };
    } catch (error: any) {
      console.error("Print error:", error);
      toast({ title: "Error", description: "Failed to open print dialog.", variant: "destructive" });
    }
  };

  const downloadPDF = (invoice: any) => {
    try {
      const doc = generateInvoicePDF(invoice, store);
      doc.save(`${invoice.invoice_number || "invoice"}.pdf`);
      toast({ title: "Success", description: "Minimalist Luxury Invoice downloaded!" });
    } catch (error: any) {
      console.error("PDF download error:", error);
      toast({ title: "Error", description: "Failed to generate Luxury PDF.", variant: "destructive" });
    }
  };

  const sendWhatsAppMessage = async (invoice: any) => {
    const phone = invoice.customer?.phone || "";
    const invoiceNo = invoice.invoice_number;
    const customerName = invoice.customer?.name || "Customer";
    const total = formatCurrency(invoice.total_amount);
    const storeName = store?.name || "our store";
    const msg = `Hello ${customerName}, thank you for shopping at ${storeName}! Your invoice ${invoiceNo} for ${total} has been generated.`;

    try {
      const doc = generateInvoicePDF(invoice, store);
      const blob = doc.output('blob');
      const file = new File([blob], `${invoiceNo}.pdf`, { type: 'application/pdf' });

      // Try to use Web Share API (Supported on Mobile and some Desktop browsers)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Invoice ${invoiceNo}`,
          text: msg,
        });
        toast({ title: "Shared Successfully" });
        return;
      }
    } catch (err) {
      console.error("Share error:", err);
    }

    // Fallback to WhatsApp link if Share API is not available or fails
    if (!phone) {
      toast({ title: "Error", description: "Customer phone number not found.", variant: "destructive" });
      return;
    }
    const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg + " (Please attach the downloaded PDF invoice)")}`;
    window.open(whatsappUrl, '_blank');
    toast({ title: "WhatsApp Opened", description: "Please attach the downloaded PDF to the chat." });
  };

  if (loadingInvoices || loadingCustomers || loadingProducts) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalBilled = invoices.reduce((s: number, i: any) => s + i.total_amount, 0);
  const totalCollected = invoices.filter((i: any) => i.payment_status === 'paid').reduce((s: number, i: any) => s + i.total_amount, 0);
  const totalPending = totalBilled - totalCollected;

  const filtered = invoices.filter((i: any) =>
    i.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    getCustomerName(customers, i.customer_id).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Billing</h1>
          <p className="text-sm text-muted-foreground">{invoices.length} invoices</p>
        </div>
        <Button size="sm" className="bg-primary text-primary-foreground hover:bg-gold-dark" onClick={() => { resetInvoiceForm(); setIsNewInvoiceOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />New Invoice
        </Button>
      </div>

      {/* Summary Bar */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <IndianRupee className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Billed</p>
            <p className="font-bold font-display text-lg">{formatCurrency(totalBilled)}</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
            <IndianRupee className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Collected</p>
            <p className="font-bold font-display text-lg">{formatCurrency(totalCollected)}</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
            <IndianRupee className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="font-bold font-display text-lg">{formatCurrency(totalPending)}</p>
          </div>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-center">Items</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((inv: any) => (
              <TableRow key={inv.id} className="cursor-pointer hover:bg-muted/50" onClick={() => viewInvoiceDetails(inv.id)}>
                <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                <TableCell>{getCustomerName(customers, inv.customer_id)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(inv.invoice_date)}</TableCell>
                <TableCell className="text-center">{inv.items?.length || 0}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(inv.total_amount)}</TableCell>
                <TableCell className="capitalize text-sm">{inv.payment_method}</TableCell>
                <TableCell><StatusBadge status={inv.payment_status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* New Invoice Dialog */}
      <Dialog open={isNewInvoiceOpen} onOpenChange={setIsNewInvoiceOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>Generate a new billing invoice for a customer.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvoiceSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer_phone">Customer Mobile No</Label>
                <Input 
                  id="customer_phone" 
                  type="tel" 
                  placeholder="Enter mobile number" 
                  value={invoiceForm.customer_phone} 
                  onChange={e => handlePhoneChange(e.target.value)} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_name">Customer Name</Label>
                <Input 
                  id="customer_name" 
                  placeholder="Enter customer name" 
                  value={invoiceForm.customer_name} 
                  onChange={e => setInvoiceForm({...invoiceForm, customer_name: e.target.value})} 
                  required 
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invoice_date">Invoice Date</Label>
                <Input id="invoice_date" type="date" value={invoiceForm.invoice_date} onChange={e => setInvoiceForm({...invoiceForm, invoice_date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_method">Payment Method</Label>
                <Select value={invoiceForm.payment_method} onValueChange={(v) => setInvoiceForm({...invoiceForm, payment_method: v})}>
                  <SelectTrigger id="payment_method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="upi">UPI / Online</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="include_gst" className="text-base font-semibold">Include GST</Label>
                  <p className="text-sm text-muted-foreground">Add GST to the total amount</p>
                </div>
                <Switch 
                  id="include_gst" 
                  checked={invoiceForm.include_gst} 
                  onCheckedChange={(v) => setInvoiceForm({...invoiceForm, include_gst: v})} 
                />
              </div>
              {invoiceForm.include_gst && (
                <div className="space-y-2">
                  <Label htmlFor="gst_rate">GST Rate (%)</Label>
                  <Input 
                    id="gst_rate" 
                    type="number" 
                    step="0.1" 
                    value={invoiceForm.gst_rate} 
                    onChange={e => setInvoiceForm({...invoiceForm, gst_rate: parseFloat(e.target.value) || 0})} 
                  />
                </div>
              )}
            </div>

            {/* Item Selection */}
            <div className="space-y-3">
              <Label>Add Products</Label>
              <div className="flex gap-2">
                <Select onValueChange={(v) => {
                  const product = products.find((p: any) => p.id === v);
                  if (product) addItemToInvoice(product);
                }}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Search products to add..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.filter((p: any) => p.quantity > 0).map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.name} - {p.sku} ({p.quantity} in stock)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Selected Items Table */}
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center w-24">Qty</TableHead>
                    <TableHead className="text-right w-32">Metal Price</TableHead>
                    <TableHead className="text-right w-32">Making Cost</TableHead>
                    <TableHead className="text-right w-24">Disc %</TableHead>
                    <TableHead className="text-right w-32">Total</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceForm.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="font-medium">{item.product_name}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          {item.metal_type} · {item.karat} · {item.weight}g
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          min="1" 
                          value={item.quantity} 
                          onChange={e => updateItemQuantity(index, parseInt(e.target.value) || 0)} 
                          className="h-8 text-center"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input 
                          type="number" 
                          value={item.metal_price} 
                          onChange={e => updateItemPrice(index, 'metal_price', parseFloat(e.target.value) || 0)} 
                          className="h-8 text-right font-mono text-xs"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input 
                          type="number" 
                          value={item.making_charges} 
                          onChange={e => updateItemPrice(index, 'making_charges', parseFloat(e.target.value) || 0)} 
                          className="h-8 text-right font-mono text-xs"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input 
                          type="number" 
                          min="0" 
                          max="100" 
                          value={item.discount_percent} 
                          onChange={e => {
                            const newItems = [...invoiceForm.items];
                            newItems[index].discount_percent = parseFloat(e.target.value) || 0;
                            newItems[index].total_price = newItems[index].quantity * (newItems[index].metal_price + newItems[index].making_charges) * (1 - (newItems[index].discount_percent / 100));
                            setInvoiceForm({ ...invoiceForm, items: newItems });
                          }} 
                          className="h-8 w-16 ml-auto text-right text-xs"
                        />
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">{formatCurrency(item.total_price)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeItemFromInvoice(index)} className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {invoiceForm.items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No products added yet. Use the search above to add items.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>{new Intl.NumberFormat('en-IN').format(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between text-sm text-destructive">
                  <span>Discount:</span>
                  <span>-{new Intl.NumberFormat('en-IN').format(calculateDiscount())}</span>
                </div>
                {invoiceForm.include_gst && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">GST ({invoiceForm.gst_rate}%):</span>
                    <span>{new Intl.NumberFormat('en-IN').format(calculateTax(calculateSubtotal(), calculateDiscount()))}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-primary">{formatCurrency(calculateSubtotal() - calculateDiscount() + calculateTax(calculateSubtotal(), calculateDiscount()))}</span>
                </div>
              </div>
            </div>

            {invoiceForm.payment_method === 'upi' && store?.upi_id && (calculateSubtotal() - calculateDiscount() + calculateTax(calculateSubtotal(), calculateDiscount())) > 0 && (
              <div className="mt-4 border rounded-xl p-4 bg-primary/5 flex flex-col items-center gap-3 text-center">
                <div className="bg-white p-3 rounded-xl shadow-sm border">
                  <QRCodeSVG 
                    value={getUPILinkForCurrentTotal(calculateSubtotal() - calculateDiscount() + calculateTax(calculateSubtotal(), calculateDiscount()))}
                    size={160}
                    includeMargin={true}
                    level="H"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold">Scan to Pay: {formatCurrency(calculateSubtotal() - calculateDiscount() + calculateTax(calculateSubtotal(), calculateDiscount()))}</p>
                  <p className="text-[10px] text-muted-foreground">ID: {store.upi_id}</p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsNewInvoiceOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={invoiceForm.items.length === 0}>
                <Save className="mr-2 h-4 w-4" /> Generate Invoice
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invoice Details Dialog */}
      <Dialog open={isInvoiceDetailsOpen} onOpenChange={setIsInvoiceDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedInvoice && (
            <div className="space-y-6">
              <div className="flex justify-between items-start border-b pb-6">
                <div>
                  <h2 className="text-2xl font-bold font-display text-primary">JewelTrack Suite</h2>
                  <h3 className="text-lg font-semibold text-foreground">{store?.name || "Premium Jewelry Store"}</h3>
                  <p className="text-sm text-muted-foreground">{store?.address || "Premium Jewelry Management"}</p>
                  {(store?.phone || store?.gst_number) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {store?.phone && <span>Phone: {store.phone}</span>}
                      {store?.phone && store?.gst_number && <span className="mx-1">|</span>}
                      {store?.gst_number && <span>GST: {store.gst_number}</span>}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <h3 className="text-xl font-bold uppercase">Invoice</h3>
                  <p className="font-medium">{selectedInvoice.invoice_number}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(selectedInvoice.invoice_date)}</p>
                </div>
              </div>

              {/* QR Code Section */}
              {selectedInvoice.payment_method === 'upi' && selectedInvoice.payment_status !== 'paid' && (
                <div className="border rounded-xl p-6 bg-primary/5 flex flex-col items-center gap-4 text-center">
                  {!showUPICode ? (
                    <>
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Printer className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">UPI Payment Required</p>
                        <p className="text-sm text-muted-foreground">Generate QR code to receive payment</p>
                      </div>
                      <Button 
                        onClick={() => {
                          if (!store?.upi_id) {
                            toast({
                              title: "UPI ID Missing",
                              description: "Please add your UPI ID in Settings to use this feature.",
                              variant: "destructive"
                            });
                          } else {
                            setShowUPICode(true);
                          }
                        }}
                      >
                        Generate Payment QR
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="bg-white p-4 rounded-xl shadow-md border-2 border-primary/20">
                        <QRCodeSVG 
                          value={getUPILink(selectedInvoice)} 
                          size={180}
                          includeMargin={true}
                          level="H"
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold">Scan to Pay: {formatCurrency(selectedInvoice.total_amount)}</p>
                        <p className="text-[10px] text-muted-foreground">ID: {store?.upi_id}</p>
                      </div>
                      <div className="flex gap-2 w-full max-w-[300px]">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setShowUPICode(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprovePayment(selectedInvoice.id)}
                          disabled={isVerifyingPayment}
                        >
                          {isVerifyingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Approve"}
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground italic">Wait for payment confirmation on your UPI app before approving.</p>
                    </>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Billed To</h4>
                  <p className="font-bold">{selectedInvoice.customer?.name}</p>
                  <p className="text-sm">{selectedInvoice.customer?.phone}</p>
                  <p className="text-sm text-muted-foreground">{selectedInvoice.customer?.address}</p>
                </div>
                <div className="text-right">
                  <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Payment Info</h4>
                  <p className="text-sm"><span className="text-muted-foreground">Method:</span> <span className="capitalize">{selectedInvoice.payment_method}</span></p>
                  <p className="text-sm"><span className="text-muted-foreground">Status:</span> <StatusBadge status={selectedInvoice.payment_status} /></p>
                </div>
              </div>

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Description</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedInvoice.items?.map((item: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <div className="font-medium">{item.product_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.metal_type} · {item.karat} · {item.weight}g
                            <div className="mt-0.5 text-[10px] text-primary/70">
                              Metal: {new Intl.NumberFormat('en-IN').format(item.metal_price || 0)} | Making: {new Intl.NumberFormat('en-IN').format(item.making_charges || 0)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{new Intl.NumberFormat('en-IN').format(item.unit_price)}</TableCell>
                        <TableCell className="text-right font-bold text-primary">{formatCurrency(item.total_price)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>{new Intl.NumberFormat('en-IN').format(selectedInvoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount:</span>
                    <span>-{new Intl.NumberFormat('en-IN').format(selectedInvoice.discount)}</span>
                  </div>
                  {selectedInvoice.tax_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">GST:</span>
                      <span>{new Intl.NumberFormat('en-IN').format(selectedInvoice.tax_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 font-bold text-lg">
                    <span>Grand Total:</span>
                    <span className="text-primary">{formatCurrency(selectedInvoice.total_amount)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 flex justify-between gap-4 no-print">
                <Button variant="outline" className="flex-1" onClick={() => printInvoice(selectedInvoice)}>
                  <Printer className="mr-2 h-4 w-4" /> Print Invoice
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => downloadPDF(selectedInvoice)}>
                  <Download className="mr-2 h-4 w-4" /> Download PDF
                </Button>
                <Button variant="outline" className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200" onClick={() => sendWhatsAppMessage(selectedInvoice)}>
                  <MessageSquare className="mr-2 h-4 w-4" /> WhatsApp
                </Button>
                <Button className="flex-1" onClick={() => setIsInvoiceDetailsOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
