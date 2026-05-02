import { useState, useRef, useEffect } from "react";
import { InvoiceForm } from "./components/invoice-form";
import { InvoicePreview } from "./components/invoice-preview";
import { ReceiptForm, ReceiptFormData } from "./components/receipt-form";
import { ReceiptPreview } from "./components/receipt-preview";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Download, Share2, FileText, RefreshCw, Printer, FileCheck, ArrowLeft, CloudUpload } from "lucide-react";
import { toJpeg } from "html-to-image";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface FormData {
  company: {
    logo: string;
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  client: {
    name: string;
    address: string;
    contact: string;
  };
  invoice: {
    number: string;
    date: string;
    terms: string;
    dueDate: string;
    subject: string;
  };
  items: InvoiceItem[];
  payment: {
    discount: number;
    advance: number;
    payNow: number;
    tax: number;
  };
  notes: string;
  terms: string;
  billType?: string;
  paid?: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateInvoiceNumber(): string {
  const current = parseInt(localStorage.getItem("invoice_counter") ?? "0", 10);
  const next = current + 1;
  localStorage.setItem("invoice_counter", String(next));
  return `INV-${String(next).padStart(6, "0")}`;
}

function generateReceiptNumber(): string {
  const current = parseInt(localStorage.getItem("receipt_counter") ?? "0", 10);
  const next = current + 1;
  localStorage.setItem("receipt_counter", String(next));
  return `REC-${String(next).padStart(6, "0")}`;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function dueDateStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
}

function defaultFormData(): FormData {
  return {
    company: {
      logo: "",
      name: "Exoft Technologies",
      address: "Kakkanchery, Malappuram\nKerala 673634\nIndia",
      phone: "+91 1234567890",
      email: "exofttechnology@gmail.com",
    },
    client: {
      name: "",
      address: "",
      contact: "",
    },
    invoice: {
      number: generateInvoiceNumber(),
      date: todayStr(),
      terms: "Net 30",
      dueDate: dueDateStr(),
      subject: "",
    },
    items: [
      {
        id: crypto.randomUUID(),
        description: "",
        quantity: 1,
        rate: 0,
        amount: 0,
      },
    ],
    payment: {
      discount: 0,
      advance: 0,
      payNow: 0,
      tax: 0,
    },
    notes: `Advance payment of ₹15,000 received before development.\nDevelopment phase is completed.\nClient must pay ₹25,000 now.\nRemaining ₹20,000 will be paid after app deployment.\nFinal source code and deployment credentials will be provided after full payment.`,
    terms: `Balance payment must be cleared within the agreed time after receiving this invoice.\nFinal source code, application build, and deployment credentials will be provided only after full payment.\nAny additional features or changes outside the agreed scope may require extra charges.\nApp cost includes UI/UX design, frontend, backend development, and Play Store deployment.\nServer hosting, domain, and cloud service charges are not included and will be billed separately.\nMaintenance or support after delivery may require additional charges depending on the request.`,
    billType: "invoice",
    paid: false,
  };
}

function defaultReceiptData(): ReceiptFormData {
  return {
    company: {
      logo: "",
      name: "Exoft Technologies",
      address: "Kakkanchery, Malappuram\nKerala 673634\nIndia",
      phone: "+91 1234567890",
      email: "exofttechnology@gmail.com",
      gstNumber: ""
    },
    customer: {
      name: "",
      companyName: "",
      contact: "",
    },
    receipt: {
      number: generateReceiptNumber(),
      date: todayStr(),
      invoiceNumber: "",
    },
    services: [
      {
        id: crypto.randomUUID(),
        name: "",
        description: "",
        quantity: 1,
        rate: 0,
        amount: 0,
      },
    ],
    paymentSummary: {
      subtotal: 0,
      taxPercentage: 0,
      discount: 0,
    },
    paymentInfo: {
      method: "Bank Transfer",
      transactionId: "",
      date: todayStr(),
      status: "PAID",
    },
  };
}

function loadDraft(): FormData | null {
  try {
    const raw = localStorage.getItem("invoice_draft");
    if (!raw) return null;
    return JSON.parse(raw) as FormData;
  } catch {
    return null;
  }
}

function saveDraft(data: FormData): void {
  try {
    localStorage.setItem("invoice_draft", JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

function loadReceiptDraft(): ReceiptFormData | null {
  try {
    const raw = localStorage.getItem("receipt_draft");
    if (!raw) return null;
    return JSON.parse(raw) as ReceiptFormData;
  } catch {
    return null;
  }
}

function saveReceiptDraft(data: ReceiptFormData): void {
  try {
    localStorage.setItem("receipt_draft", JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

type AppMode = 'landing' | 'invoice' | 'receipt';

function App() {
  const [mode, setMode] = useState<AppMode>('landing');
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState<FormData>(() => loadDraft() ?? defaultFormData());
  const [receiptData, setReceiptData] = useState<ReceiptFormData>(() => loadReceiptDraft() ?? defaultReceiptData());

  // Auto-save drafts
  useEffect(() => {
    saveDraft(formData);
  }, [formData]);

  useEffect(() => {
    saveReceiptDraft(receiptData);
  }, [receiptData]);

  // ── Calculations ─────────────────────────────────────────────────────────────

  const calculateInvoiceTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.amount, 0);
    const discountAmount = (subtotal * formData.payment.discount) / 100;
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = (afterDiscount * formData.payment.tax) / 100;
    const total = afterDiscount + taxAmount;
    const balanceDue = total - formData.payment.advance;
    const payNow = formData.payment.payNow;
    const balanceAfterDeployment = total - formData.payment.advance - payNow;

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total,
      balanceDue: balanceDue > 0 ? balanceDue : 0,
      payNow,
      balanceAfterDeployment: balanceAfterDeployment > 0 ? balanceAfterDeployment : 0,
    };
  };

  const calculateReceiptTotals = () => {
    const subtotal = receiptData.services.reduce((sum, item) => sum + item.amount, 0);
    const discountAmount = receiptData.paymentSummary.discount;
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = (afterDiscount * receiptData.paymentSummary.taxPercentage) / 100;
    const totalPaid = afterDiscount + taxAmount;

    return {
      subtotal,
      taxAmount,
      totalPaid: totalPaid > 0 ? totalPaid : 0,
    };
  };

  const calculations = calculateInvoiceTotals();
  const receiptCalculations = calculateReceiptTotals();

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleNew = () => {
    if (mode === 'invoice') {
      if (!window.confirm("Start a new invoice? Your current draft will be cleared.")) return;
      localStorage.removeItem("invoice_draft");
      setFormData(defaultFormData());
      toast.success("New invoice started!");
    } else if (mode === 'receipt') {
      if (!window.confirm("Start a new receipt? Your current draft will be cleared.")) return;
      localStorage.removeItem("receipt_draft");
      setReceiptData(defaultReceiptData());
      toast.success("New receipt started!");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;

    try {
      toast.loading("Generating PDF...", { id: "pdf-download" });

      // Ensure all images are loaded before capturing
      const images = invoiceRef.current.getElementsByTagName("img");
      const imagePromises = Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
      });

      await Promise.all(imagePromises);

      const dataUrl = await toJpeg(invoiceRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });

      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load captured image"));
        img.src = dataUrl;
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();
      const ratio = pdfWidth / img.naturalWidth;
      const scaledHeight = img.naturalHeight * ratio;

      let heightLeft = scaledHeight;
      let position = 0;

      pdf.addImage(dataUrl, "JPEG", 0, position, pdfWidth, scaledHeight);
      heightLeft -= pdfPageHeight;

      while (heightLeft > 0) {
        position = heightLeft - scaledHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, "JPEG", 0, position, pdfWidth, scaledHeight);
        heightLeft -= pdfPageHeight;
      }

      const fileName = mode === 'invoice' 
        ? (formData.invoice.number || "invoice").replace(/[/\\?%*:|"<>]/g, "-")
        : (receiptData.receipt.number || "receipt").replace(/[/\\?%*:|"<>]/g, "-");
      
      pdf.save(`${fileName}.pdf`);

      toast.success("PDF downloaded successfully!", { id: "pdf-download" });
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast.error(`Failed to generate PDF: ${error.message || "Unknown error"}`, { id: "pdf-download" });
    }
  };

  const handleUploadPDF = async () => {
    if (!invoiceRef.current) return;

    try {
      toast.loading("Uploading PDF to Google Drive...", { id: "pdf-upload" });

      // Ensure all images are loaded before capturing
      const images = invoiceRef.current.getElementsByTagName("img");
      const imagePromises = Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
      });

      await Promise.all(imagePromises);

      const dataUrl = await toJpeg(invoiceRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });

      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load captured image"));
        img.src = dataUrl;
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();
      const ratio = pdfWidth / img.naturalWidth;
      const scaledHeight = img.naturalHeight * ratio;

      let heightLeft = scaledHeight;
      let position = 0;

      pdf.addImage(dataUrl, "JPEG", 0, position, pdfWidth, scaledHeight);
      heightLeft -= pdfPageHeight;

      while (heightLeft > 0) {
        position = heightLeft - scaledHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, "JPEG", 0, position, pdfWidth, scaledHeight);
        heightLeft -= pdfPageHeight;
      }

      // Generate the raw PDF Blob
      const pdfBlob = pdf.output("blob");

      // Send to our Vercel API function
      const response = await fetch("/api/upload", {
        method: "POST",
        body: pdfBlob,
        headers: {
          "Content-Type": "application/pdf"
        }
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to upload to Google Drive");
      }

      toast.success("PDF uploaded successfully to Google Drive!", { id: "pdf-upload" });
    } catch (error: any) {
      console.error("Error uploading PDF:", error);
      toast.error(`Failed to upload: ${error.message || "Unknown error"}`, { id: "pdf-upload" });
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        const title = mode === 'invoice' ? `Invoice ${formData.invoice.number}` : `Receipt ${receiptData.receipt.number}`;
        const text = mode === 'invoice' ? `Invoice from ${formData.company.name}` : `Payment Receipt from ${receiptData.company.name}`;
        
        await navigator.share({
          title,
          text,
          url: window.location.href,
        });
        toast.success("Shared successfully!");
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
      toast.error("Failed to share");
    }
  };

  // ── Scaling logic for mobile preview ──────────────────────────────────────────
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth - 32; // padding
        const targetWidth = 794; // 210mm at 96dpi
        if (containerWidth < targetWidth) {
          setScale(containerWidth / targetWidth);
        } else {
          setScale(1);
        }
      }
    };

    if (mode !== 'landing') {
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [mode]);

  // ── Render ────────────────────────────────────────────────────────────────────

  if (mode === 'landing') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200 py-6 shadow-sm">
          <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-center gap-3">
            <div className="p-2 bg-black rounded-lg text-white">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Document Generator</h1>
              <p className="text-sm text-gray-600">Create professional invoices and receipts instantly</p>
            </div>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card 
              className="p-10 cursor-pointer hover:shadow-xl hover:border-blue-600 transition-all border-2 border-transparent bg-white group"
              onClick={() => setMode('invoice')}
            >
              <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileText className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-gray-900">Invoice Generator</h2>
              <p className="text-gray-600 leading-relaxed">
                Create a detailed invoice for your services or products. Includes tax calculations, discount, and balance due tracking.
              </p>
              <div className="mt-6 font-semibold text-blue-600 flex items-center">
                Create Invoice <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
              </div>
            </Card>

            <Card 
              className="p-10 cursor-pointer hover:shadow-xl hover:border-green-600 transition-all border-2 border-transparent bg-white group"
              onClick={() => setMode('receipt')}
            >
              <div className="h-16 w-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-gray-900">Payment Receipt</h2>
              <p className="text-gray-600 leading-relaxed">
                Generate a professional payment receipt for received funds. Perfect for confirming payments to your clients.
              </p>
              <div className="mt-6 font-semibold text-green-600 flex items-center">
                Create Receipt <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
              </div>
            </Card>
          </div>
        </main>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #invoice-print-area,
          #invoice-print-area * { visibility: visible !important; }
          #invoice-print-area {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            z-index: 9999 !important;
            background: #fff !important;
            transform: none !important;
            margin: 0 !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <Toaster />

      <header className="no-print bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setMode('landing')} className="mr-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="p-2 bg-black rounded-lg text-white">
                {mode === 'invoice' ? <FileText className="w-6 h-6 md:w-8 md:h-8" /> : <FileCheck className="w-6 h-6 md:w-8 md:h-8" />}
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold">
                  {mode === 'invoice' ? 'Invoice Generator' : 'Receipt Generator'}
                </h1>
                <p className="text-[10px] md:text-sm text-gray-600">
                  {mode === 'invoice' ? 'Create professional invoices instantly' : 'Create payment receipts instantly'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
              <Button onClick={handleNew} variant="outline" size="sm" className="flex-1 md:flex-none">
                <RefreshCw className="w-4 h-4 mr-1 md:mr-2" />
                New
              </Button>
              <Button onClick={handlePrint} variant="outline" size="sm" className="flex-1 md:flex-none">
                <Printer className="w-4 h-4 mr-1 md:mr-2" />
                Print
              </Button>
              <Button onClick={handleUploadPDF} variant="outline" size="sm" className="flex-1 md:flex-none">
                <CloudUpload className="w-4 h-4 mr-1 md:mr-2" />
                Upload
              </Button>
              <Button onClick={handleDownloadPDF} variant="default" size="sm" className="flex-1 md:flex-none">
                <Download className="w-4 h-4 mr-1 md:mr-2" />
                Download
              </Button>
              <Button onClick={handleShare} variant="outline" size="sm" className="flex-1 md:flex-none">
                <Share2 className="w-4 h-4 mr-1 md:mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Section - Form */}
          <div className="no-print space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">
                {mode === 'invoice' ? 'Invoice Details' : 'Receipt Details'}
              </h2>
              <p className="text-sm text-gray-600">
                Fill in the information to generate your {mode === 'invoice' ? 'invoice' : 'receipt'}
              </p>
            </div>
            {mode === 'invoice' ? (
              <InvoiceForm formData={formData} onFormChange={setFormData} />
            ) : (
              <ReceiptForm formData={receiptData} onFormChange={setReceiptData} />
            )}
          </div>

          {/* Right Section - Preview */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="no-print mb-4">
              <h2 className="text-xl font-semibold mb-2">Live Preview</h2>
              <p className="text-sm text-gray-600">
                Live preview of your {mode === 'invoice' ? 'invoice' : 'receipt'}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
              <div 
                ref={containerRef}
                className="overflow-x-hidden overflow-y-auto max-h-[calc(100vh-200px)] bg-gray-100 p-4 md:p-8"
              >
                <div className="flex justify-center w-full">
                  <div 
                    id="invoice-print-area" 
                    className="origin-top transition-transform duration-200 shadow-2xl" 
                    style={{
                      transform: scale < 1 ? `scale(${scale})` : 'none',
                      marginBottom: scale < 1 ? `-${(1 - scale) * 1123}px` : '0',
                    }}
                  >
                    {mode === 'invoice' ? (
                      <InvoicePreview ref={invoiceRef} formData={formData} calculations={calculations} />
                    ) : (
                      <ReceiptPreview ref={invoiceRef} formData={receiptData} calculations={receiptCalculations} />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Amount Summary Card */}
            {mode === 'invoice' && (
              <div className="no-print mt-6 bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <h3 className="font-semibold mb-4">Amount Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>₹{calculations.subtotal.toFixed(2)}</span>
                  </div>
                  {formData.payment.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount ({formData.payment.discount}%):</span>
                      <span className="text-red-600">-₹{calculations.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {formData.payment.tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax ({formData.payment.tax}%):</span>
                      <span>+₹{calculations.taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {formData.payment.advance > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Advance Paid:</span>
                      <span className="text-red-600">-₹{formData.payment.advance.toFixed(2)}</span>
                    </div>
                  )}
                  {formData.payment.payNow > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pay Now:</span>
                      <span className="text-red-600">-₹{formData.payment.payNow.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-semibold text-base text-gray-800">
                      <span>Total:</span>
                      <span>₹{calculations.total.toFixed(2)}</span>
                    </div>
                  </div>
                  {formData.payment.advance > 0 || formData.payment.payNow > 0 ? (
                    <div className="space-y-2 mt-2">
                      <div className="bg-black text-white p-3 rounded-md">
                        <div className="flex justify-between font-bold text-lg">
                          <span>Due Now:</span>
                          <span>₹{calculations.payNow.toFixed(2)}</span>
                        </div>
                      </div>
                      {calculations.balanceAfterDeployment > 0 && (
                        <div className="bg-amber-100 text-amber-900 p-3 rounded-md border border-amber-200">
                          <div className="flex justify-between font-semibold text-sm">
                            <span>After Deployment:</span>
                            <span>₹{calculations.balanceAfterDeployment.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-black text-white p-3 rounded-md mt-3">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Balance Due:</span>
                        <span>₹{calculations.balanceDue.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {mode === 'receipt' && (
              <div className="no-print mt-6 bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <h3 className="font-semibold mb-4">Payment Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>₹{receiptCalculations.subtotal.toFixed(2)}</span>
                  </div>
                  {receiptData.paymentSummary.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount Amount:</span>
                      <span className="text-red-600">-₹{receiptData.paymentSummary.discount.toFixed(2)}</span>
                    </div>
                  )}
                  {receiptData.paymentSummary.taxPercentage > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax ({receiptData.paymentSummary.taxPercentage}%):</span>
                      <span>+₹{receiptCalculations.taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 mt-2">
                    <div className="bg-black text-white p-3 rounded-md mt-3">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total Paid:</span>
                        <span>₹{receiptCalculations.totalPaid.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="no-print bg-white border-t border-gray-200 mt-12">
        <div className="max-w-[1800px] mx-auto px-6 py-6 text-center text-sm text-gray-600">
          <p>Professional Document Generator • Create, Download, and Share {mode === 'invoice' ? 'Invoices' : 'Receipts'}</p>
        </div>
      </footer>
    </div>
  );
}

export default App;