import { forwardRef } from "react";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoicePreviewProps {
  formData: any;
  calculations: {
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    total: number;
    balanceDue: number;
    payNow: number;
    balanceAfterDeployment: number;
  };
}

export const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(
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
        "",
        "One",
        "Two",
        "Three",
        "Four",
        "Five",
        "Six",
        "Seven",
        "Eight",
        "Nine",
      ];
      const teens = [
        "Ten",
        "Eleven",
        "Twelve",
        "Thirteen",
        "Fourteen",
        "Fifteen",
        "Sixteen",
        "Seventeen",
        "Eighteen",
        "Nineteen",
      ];
      const tens = [
        "",
        "",
        "Twenty",
        "Thirty",
        "Forty",
        "Fifty",
        "Sixty",
        "Seventy",
        "Eighty",
        "Ninety",
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

    const termsArray = formData.terms
      .split("\n")
      .filter((line: string) => line.trim() !== "");

    return (
      <div
        ref={ref}
        data-invoice-root
        className="p-6 shadow-sm"
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
            {/* TAX INVOICE - Top Right, smaller */}
            <div className="text-right">
              <h1 className="text-lg font-bold tracking-wide">INVOICE</h1>
            </div>
          </div>

          {/* Invoice Number & Balance Due */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">
                # {formData.invoice.number || "INV-000001"}
              </p>
            </div>
            <div className="text-right">
              <div className="bg-gray-100 px-3 py-1.5">
                <p className="text-[10px] text-gray-600 mb-0.5">Balance Due</p>
                <p className="text-lg font-bold">
                  ₹{formatCurrency(calculations.balanceDue)}
                </p>
              </div>
            </div>
          </div>

          {/* Company and Invoice Details */}
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
            </div>

            <div className="w-1/2 text-right text-xs">
              <div className="space-y-0.5">
                <div className="flex justify-end">
                  <span className="text-gray-600 mr-2">Invoice Date :</span>
                  <span>{formatDate(formData.invoice.date) || "DD/MM/YYYY"}</span>
                </div>
                <div className="flex justify-end">
                  <span className="text-gray-600 mr-2">Terms :</span>
                  <span>{formData.invoice.terms || "Custom"}</span>
                </div>
                <div className="flex justify-end">
                  <span className="text-gray-600 mr-2">Due Date :</span>
                  <span>{formatDate(formData.invoice.dueDate) || "DD/MM/YYYY"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-3">
            <p className="text-[10px] text-gray-600 mb-0.5">Bill To</p>
            <p className="font-bold text-sm">
              {formData.client.name || "Client Name"}
            </p>
            {formData.client.address && (
              <p className="text-xs text-gray-700 whitespace-pre-line">
                {formData.client.address}
              </p>
            )}
          </div>

          {/* Subject */}
          {formData.invoice.subject && (
            <div className="mb-3">
              <p className="text-[10px] text-gray-600 mb-0.5">Subject :</p>
              <p className="text-xs">{formData.invoice.subject}</p>
            </div>
          )}
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
                  Item & Description
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
              {formData.items.map((item: InvoiceItem, index: number) => (
                <tr key={item.id} className="border-b border-gray-300">
                  <td className="py-2 px-3 border-l border-r border-gray-300">
                    {index + 1}
                  </td>
                  <td className="py-2 px-3 border-r border-gray-300">
                    {item.description || "Item Description"}
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
              {formData.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No items added
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
                {formData.payment.discount > 0 && (
                  <div className="flex justify-between py-1 border-b border-gray-300">
                    <span className="text-gray-700">
                      Discount ({formData.payment.discount}%)
                    </span>
                    <span>(-) {formatCurrency(calculations.discountAmount)}</span>
                  </div>
                )}
                {formData.payment.tax > 0 && (
                  <div className="flex justify-between py-1 border-b border-gray-300">
                    <span className="text-gray-700">
                      Tax ({formData.payment.tax}%)
                    </span>
                    <span>{formatCurrency(calculations.taxAmount)}</span>
                  </div>
                )}
                {formData.payment.advance > 0 && (
                  <div className="flex justify-between py-1 border-b border-gray-300">
                    <span className="text-gray-700">Advance Paid</span>
                    <span>(-) {formatCurrency(formData.payment.advance)}</span>
                  </div>
                )}
                {formData.payment.payNow > 0 && (
                  <div className="flex justify-between py-1 border-b border-gray-300">
                    <span className="text-gray-700">Pay Now</span>
                    <span>(-) {formatCurrency(formData.payment.payNow)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 font-bold px-2" style={{ backgroundColor: "#f3f4f6" }}>
                  <span>Total</span>
                  <span>₹{formatCurrency(calculations.total)}</span>
                </div>
                {formData.payment.advance > 0 || formData.payment.payNow > 0 ? (
                  <>
                    <div className="flex justify-between py-2 font-bold px-2" style={{ backgroundColor: "#1f2937", color: "#ffffff" }}>
                      <span>Balance Due Now</span>
                      <span>₹{formatCurrency(calculations.payNow)}</span>
                    </div>
                    {calculations.balanceAfterDeployment > 0 && (
                      <div className="flex justify-between py-2 font-semibold px-2 text-sm" style={{ backgroundColor: "#fef3c7", color: "#92400e" }}>
                        <span>Balance After Deployment</span>
                        <span>₹{formatCurrency(calculations.balanceAfterDeployment)}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex justify-between py-2 font-bold px-2" style={{ backgroundColor: "#1f2937", color: "#ffffff" }}>
                    <span>Balance Due</span>
                    <span>₹{formatCurrency(calculations.balanceDue)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Total in Words */}
        <div className="mb-6 text-sm">
          <p>
            <span className="font-semibold">Total In Words:</span>{" "}
            <span className="italic">
              Indian Rupee {numberToWords(calculations.balanceDue)}
            </span>
          </p>
        </div>

        {/* Notes */}
        {formData.notes && (
          <div className="mb-6">
            <h3 className="font-bold text-sm mb-2">Notes</h3>
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {formData.notes}
            </p>
          </div>
        )}

        {/* Terms & Conditions */}
        {formData.terms && termsArray.length > 0 && (
          <div className="mb-6">
            <h3 className="font-bold text-sm mb-2">Terms & Conditions</h3>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
              {termsArray.map((term: string, index: number) => (
                <li key={index}>{term}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Authorized Signature */}
        <div className="mt-12 pt-6 border-t border-gray-300">
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

InvoicePreview.displayName = "InvoicePreview";