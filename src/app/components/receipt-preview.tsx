import { forwardRef } from "react";
import { ReceiptFormData } from "./receipt-form";
import { format } from "date-fns";

interface ReceiptPreviewProps {
  formData: ReceiptFormData;
  calculations: {
    subtotal: number;
    taxAmount: number;
    totalPaid: number;
  };
}

export const ReceiptPreview = forwardRef<HTMLDivElement, ReceiptPreviewProps>(
  ({ formData, calculations }, ref) => {
    const formatCurrency = (amount: number) => {
      return amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    const formatDate = (dateString: string) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const numberToWords = (num: number): string => {
      if (num === 0) return "Zero";

      const ones = [
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
      ];
      const teens = [
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
      ];
      const tens = [
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
      ];
      const thousands = ["", "Thousand", "Million", "Billion"];

      const convertHundreds = (n: number): string => {
        if (n === 0) return "";
        if (n < 10) return ones[n];
        if (n < 20) return teens[n - 10];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
        return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convertHundreds(n % 100) : "");
      };

      const convert = (n: number): string => {
        if (n === 0) return "Zero";

        let word = "";
        let i = 0;

        while (n > 0) {
          const part = n % 1000;
          if (part !== 0) {
            word = convertHundreds(part) + (thousands[i] ? " " + thousands[i] : "") + (word ? " " + word : "");
          }
          n = Math.floor(n / 1000);
          i++;
        }

        return word.trim();
      };

      const integerPart = Math.floor(num);
      return convert(integerPart) + " Only";
    };

    return (
      <div
        ref={ref}
        data-invoice-root
        className="p-6 shadow-sm flex flex-col"
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          width: "210mm",
          minHeight: "297mm",
          margin: "0 auto",
          boxSizing: "border-box",
          backgroundColor: "#ffffff",
          color: "#000000",
          border: "1px solid #e5e7eb",
        }}
      >
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-4">
            {/* Company Logo - Top Left */}
            <div className="flex-1">
              {formData.company.logo && (
                <img
                  src={formData.company.logo}
                  alt="Company Logo"
                  className="h-12 object-contain"
                />
              )}
            </div>
            {/* RECEIPT - Top Right, smaller */}
            <div className="text-right">
              <h1 className="text-lg font-bold tracking-wide uppercase">
                PAYMENT RECEIPT
              </h1>
            </div>
          </div>

          {/* Receipt Number & Balance Due */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">
                # {formData.receipt.number || "REC-000001"}
              </p>
            </div>
            <div className="text-right">
              <div className="bg-gray-100 px-3 py-1.5">
                <p className="text-[10px] text-gray-600 mb-0.5">Amount Received</p>
                <p className="text-lg font-bold">₹{formatCurrency(calculations.totalPaid)}</p>
              </div>
            </div>
          </div>

          {/* Company and Receipt Details */}
          <div className="flex justify-between mb-4">
            <div className="w-1/2">
              <h3 className="font-bold text-sm mb-0.5">
                {formData.company.name || "Company Name"}
              </h3>
              <div className="text-xs text-gray-700 whitespace-pre-line">
                {formData.company.address || "Company Address"}
              </div>
              {formData.company.email && (
                <p className="text-xs text-gray-700 mt-0.5">
                  {formData.company.email}
                </p>
              )}
              {formData.company.phone && (
                <p className="text-xs text-gray-700 mt-0.5">
                  {formData.company.phone}
                </p>
              )}
              {formData.company.gstNumber && (
                <p className="text-xs text-gray-700 mt-0.5 font-medium">
                  GST: {formData.company.gstNumber}
                </p>
              )}
            </div>

            <div className="w-1/2 text-right text-xs">
              <div className="space-y-0.5">
                <div className="flex justify-end">
                  <span className="text-gray-600 mr-2">Receipt Date :</span>
                  <span>{formatDate(formData.receipt.date) || "DD/MM/YYYY"}</span>
                </div>
                {formData.receipt.invoiceNumber && (
                  <div className="flex justify-end">
                    <span className="text-gray-600 mr-2">Invoice Ref :</span>
                    <span>{formData.receipt.invoiceNumber}</span>
                  </div>
                )}
                {formData.paymentInfo.method && (
                  <div className="flex justify-end mt-2 pt-2 border-t border-gray-100">
                    <span className="text-gray-600 mr-2">Payment Method :</span>
                    <span>{formData.paymentInfo.method}</span>
                  </div>
                )}
                {formData.paymentInfo.transactionId && (
                  <div className="flex justify-end">
                    <span className="text-gray-600 mr-2">Transaction ID :</span>
                    <span>{formData.paymentInfo.transactionId}</span>
                  </div>
                )}
                {formData.paymentInfo.date && (
                  <div className="flex justify-end">
                    <span className="text-gray-600 mr-2">Payment Date :</span>
                    <span>{formatDate(formData.paymentInfo.date) || "DD/MM/YYYY"}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Received From */}
          <div className="mb-3">
            <p className="text-[10px] text-gray-600 mb-0.5">Received From</p>
            <p className="font-bold text-sm">
              {formData.customer.name || "Customer Name"}
            </p>
            {formData.customer.companyName && (
              <p className="text-xs text-gray-700 whitespace-pre-line mt-0.5">
                {formData.customer.companyName}
              </p>
            )}
            {formData.customer.contact && (
              <p className="text-xs text-gray-700 whitespace-pre-line mt-0.5">
                {formData.customer.contact}
              </p>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ backgroundColor: "#1f2937", color: "#ffffff" }}>
                <th className="text-left py-2 px-3 w-12" style={{ border: "1px solid #374151" }}>
                  #
                </th>
                <th className="text-left py-2 px-3" style={{ border: "1px solid #374151" }}>
                  Service Description
                </th>
                <th className="text-right py-2 px-3 w-20" style={{ border: "1px solid #374151" }}>
                  Qty
                </th>
                <th className="text-right py-2 px-3 w-28" style={{ border: "1px solid #374151" }}>
                  Rate
                </th>
                <th className="text-right py-2 px-3 w-28" style={{ border: "1px solid #374151" }}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {formData.services.map((item, index: number) => (
                <tr key={item.id} className="border-b border-gray-300">
                  <td className="py-2 px-3 border-l border-r border-gray-300">
                    {index + 1}
                  </td>
                  <td className="py-2 px-3 border-r border-gray-300">
                    <div>{item.name || "Service Details"}</div>
                    {item.description && (
                      <div className="text-[10px] text-gray-500 mt-0.5">{item.description}</div>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right border-r border-gray-300">
                    {item.quantity.toFixed(2)}
                  </td>
                  <td className="py-2 px-3 text-right border-r border-gray-300">
                    {formatCurrency(item.rate)}
                  </td>
                  <td className="py-2 px-3 text-right border-r border-gray-300">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
              {formData.services.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No services added
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Summary */}
          <div className="flex justify-end mt-4">
            <div className="w-80">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b border-gray-300">
                  <span className="text-gray-700">Sub Total</span>
                  <span>{formatCurrency(calculations.subtotal)}</span>
                </div>
                {formData.paymentSummary.discount > 0 && (
                  <div className="flex justify-between py-1 border-b border-gray-300">
                    <span className="text-gray-700">Discount</span>
                    <span>(-) {formatCurrency(formData.paymentSummary.discount)}</span>
                  </div>
                )}
                {formData.paymentSummary.taxPercentage > 0 && (
                  <div className="flex justify-between py-1 border-b border-gray-300">
                    <span className="text-gray-700">
                      Tax ({formData.paymentSummary.taxPercentage}%)
                    </span>
                    <span>{formatCurrency(calculations.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 font-bold px-2" style={{ backgroundColor: "#1f2937", color: "#ffffff" }}>
                  <span>Total Paid</span>
                  <span>₹{formatCurrency(calculations.totalPaid)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Total in Words */}
        <div className="mb-6 text-sm">
          <p>
            <span className="font-semibold">Total Paid In Words:</span>{" "}
            <span className="italic">
              Indian Rupee {numberToWords(calculations.totalPaid)}
            </span>
          </p>
        </div>

        {/* Authorized Signature */}
        <div className="mt-auto pt-6 border-t border-gray-300">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm font-semibold">Authorized Signature</p>
              <div className="mt-8 border-b border-gray-400 w-64"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ReceiptPreview.displayName = "ReceiptPreview";
