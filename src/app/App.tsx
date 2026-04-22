import { useState, useRef, useEffect } from "react";
import { InvoiceForm } from "./components/invoice-form";
import { InvoicePreview } from "./components/invoice-preview";
import { Button } from "./components/ui/button";
import { Download, Share2, FileText, RefreshCw, Printer } from "lucide-react";
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
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateInvoiceNumber(): string {
  const current = parseInt(localStorage.getItem("invoice_counter") ?? "0", 10);
  const next = current + 1;
  localStorage.setItem("invoice_counter", String(next));
  return `INV-${String(next).padStart(6, "0")}`;
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
    notes: `Advance payment of ₹15,000 received before development.
Development phase is completed.
Client must pay ₹25,000 now.
Remaining ₹20,000 will be paid after app deployment.
Final source code and deployment credentials will be provided after full payment.`,
    terms: `Balance payment must be cleared within the agreed time after receiving this invoice.\nFinal source code, application build, and deployment credentials will be provided only after full payment.\nAny additional features or changes outside the agreed scope may require extra charges.\nApp cost includes UI/UX design, frontend, backend development, and Play Store deployment.\nServer hosting, domain, and cloud service charges are not included and will be billed separately.\nMaintenance or support after delivery may require additional charges depending on the request.`,
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

// ── Component ──────────────────────────────────────────────────────────────────

function App() {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<FormData>(() => loadDraft() ?? defaultFormData());

  // Auto-save draft on every formData change
  useEffect(() => {
    saveDraft(formData);
  }, [formData]);

  // ── Calculations ─────────────────────────────────────────────────────────────

  const calculateTotals = () => {
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

  const calculations = calculateTotals();

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleNewInvoice = () => {
    const confirmed = window.confirm(
      "Start a new invoice? Your current draft will be cleared."
    );
    if (!confirmed) return;

    localStorage.removeItem("invoice_draft");
    setFormData(defaultFormData());
    toast.success("New invoice started!");
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

      // Step 1: Capture invoice as JPEG using html-to-image
      // We use a lower pixelRatio if it fails, but start with 2 for quality
      const dataUrl = await toJpeg(invoiceRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });

      // Step 2: Get image dimensions
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load captured image"));
        img.src = dataUrl;
      });

      // Step 3: Build the PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();
      const ratio = pdfWidth / img.naturalWidth;
      const scaledHeight = img.naturalHeight * ratio;

      // Add image, handle multi-page
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

      // Step 4: Save as PDF
      const fileName = (formData.invoice.number || "invoice").replace(
        /[/\\?%*:|"<>]/g,
        "-"
      );
      pdf.save(`${fileName}.pdf`);

      toast.success("PDF downloaded successfully!", { id: "pdf-download" });
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast.error(`Failed to generate PDF: ${error.message || "Unknown error"}`, { id: "pdf-download" });
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Invoice ${formData.invoice.number}`,
          text: `Invoice from ${formData.company.name}`,
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

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print styles */}
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
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <Toaster />

      {/* Header */}
      <header className="no-print bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Invoice Generator</h1>
                <p className="text-sm text-gray-600">
                  Create professional invoices instantly
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleNewInvoice} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                New Invoice
              </Button>
              <Button onClick={handlePrint} variant="outline">
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button onClick={handleDownloadPDF} variant="default">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button onClick={handleShare} variant="outline">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Section - Form */}
          <div className="no-print space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Invoice Details</h2>
              <p className="text-sm text-gray-600">
                Fill in the information to generate your invoice
              </p>
            </div>
            <InvoiceForm formData={formData} onFormChange={setFormData} />
          </div>

          {/* Right Section - Preview */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="no-print mb-4">
              <h2 className="text-xl font-semibold mb-2">Invoice Preview</h2>
              <p className="text-sm text-gray-600">
                Live preview of your invoice
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
              <div className="overflow-auto max-h-[calc(100vh-200px)]">
                {/* Print area wraps only the preview */}
                <div id="invoice-print-area">
                  <InvoicePreview
                    ref={invoiceRef}
                    formData={formData}
                    calculations={calculations}
                  />
                </div>
              </div>
            </div>

            {/* Amount Summary Card */}
            <div className="no-print mt-6 bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h3 className="font-semibold mb-4">Amount Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>₹{calculations.subtotal.toFixed(2)}</span>
                </div>
                {formData.payment.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Discount ({formData.payment.discount}%):
                    </span>
                    <span className="text-red-600">
                      -₹{calculations.discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                {formData.payment.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Tax ({formData.payment.tax}%):
                    </span>
                    <span>+₹{calculations.taxAmount.toFixed(2)}</span>
                  </div>
                )}
                {formData.payment.advance > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Advance Paid:</span>
                    <span className="text-red-600">
                      -₹{formData.payment.advance.toFixed(2)}
                    </span>
                  </div>
                )}
                {formData.payment.payNow > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pay Now:</span>
                    <span className="text-red-600">
                      -₹{formData.payment.payNow.toFixed(2)}
                    </span>
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
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="no-print bg-white border-t border-gray-200 mt-12">
        <div className="max-w-[1800px] mx-auto px-6 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>
              Professional Invoice Generator • Create, Download, and Share
              Invoices
            </p>
          </div>
        </div>
      </footer>
      <Toaster />
    </div>
  );
}

export default App;