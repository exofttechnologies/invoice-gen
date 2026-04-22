import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Plus, Trash2, Upload } from "lucide-react";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoiceFormProps {
  formData: any;
  onFormChange: (data: any) => void;
}

export function InvoiceForm({ formData, onFormChange }: InvoiceFormProps) {
  const updateField = (field: string, value: any) => {
    onFormChange({ ...formData, [field]: value });
  };

  const updateCompanyField = (field: string, value: any) => {
    onFormChange({
      ...formData,
      company: { ...formData.company, [field]: value },
    });
  };

  const updateClientField = (field: string, value: any) => {
    onFormChange({
      ...formData,
      client: { ...formData.client, [field]: value },
    });
  };

  const updateInvoiceField = (field: string, value: any) => {
    onFormChange({
      ...formData,
      invoice: { ...formData.invoice, [field]: value },
    });
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0,
    };
    onFormChange({
      ...formData,
      items: [...formData.items, newItem],
    });
  };

  const removeItem = (id: string) => {
    onFormChange({
      ...formData,
      items: formData.items.filter((item: InvoiceItem) => item.id !== id),
    });
  };

  const updateItem = (id: string, field: string, value: any) => {
    const updatedItems = formData.items.map((item: InvoiceItem) => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === "quantity" || field === "rate") {
          updatedItem.amount = updatedItem.quantity * updatedItem.rate;
        }
        return updatedItem;
      }
      return item;
    });
    onFormChange({ ...formData, items: updatedItems });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateCompanyField("logo", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Company Details */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Company Details</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="logo">Company Logo</Label>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="file"
                id="logo"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("logo")?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Logo
              </Button>
              {formData.company.logo && (
                <img
                  src={formData.company.logo}
                  alt="Logo"
                  className="h-10 w-10 object-contain"
                />
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={formData.company.name}
              onChange={(e) => updateCompanyField("name", e.target.value)}
              placeholder="Your Company Name"
            />
          </div>
          <div>
            <Label htmlFor="companyAddress">Address</Label>
            <Textarea
              id="companyAddress"
              value={formData.company.address}
              onChange={(e) => updateCompanyField("address", e.target.value)}
              placeholder="Street, City, State, ZIP, Country"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="companyPhone">Phone Number</Label>
            <Input
              id="companyPhone"
              value={formData.company.phone}
              onChange={(e) => updateCompanyField("phone", e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div>
            <Label htmlFor="companyEmail">Email</Label>
            <Input
              id="companyEmail"
              type="email"
              value={formData.company.email}
              onChange={(e) => updateCompanyField("email", e.target.value)}
              placeholder="company@example.com"
            />
          </div>
        </div>
      </Card>

      {/* Client Details */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Client Details</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="clientName">Client Company Name</Label>
            <Input
              id="clientName"
              value={formData.client.name}
              onChange={(e) => updateClientField("name", e.target.value)}
              placeholder="Client Company Name"
            />
          </div>
          <div>
            <Label htmlFor="clientAddress">Client Address</Label>
            <Textarea
              id="clientAddress"
              value={formData.client.address}
              onChange={(e) => updateClientField("address", e.target.value)}
              placeholder="Client Address"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="clientContact">Contact Details</Label>
            <Input
              id="clientContact"
              value={formData.client.contact}
              onChange={(e) => updateClientField("contact", e.target.value)}
              placeholder="Email or Phone"
            />
          </div>
        </div>
      </Card>

      {/* Invoice Details */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Invoice Details</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="invoiceNumber">Invoice Number</Label>
            <Input
              id="invoiceNumber"
              value={formData.invoice.number}
              onChange={(e) => updateInvoiceField("number", e.target.value)}
              placeholder="INV-000001"
            />
          </div>
          <div>
            <Label htmlFor="invoiceDate">Invoice Date</Label>
            <Input
              id="invoiceDate"
              type="date"
              value={formData.invoice.date}
              onChange={(e) => updateInvoiceField("date", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="invoiceTerms">Terms</Label>
            <Input
              id="invoiceTerms"
              value={formData.invoice.terms}
              onChange={(e) => updateInvoiceField("terms", e.target.value)}
              placeholder="Net 30, Custom, etc."
            />
          </div>
          <div>
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.invoice.dueDate}
              onChange={(e) => updateInvoiceField("dueDate", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Textarea
              id="subject"
              value={formData.invoice.subject}
              onChange={(e) => updateInvoiceField("subject", e.target.value)}
              placeholder="Brief description of the invoice"
              rows={2}
            />
          </div>
        </div>
      </Card>

      {/* Invoice Items */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Invoice Items</h2>
          <Button onClick={addItem} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
        <div className="space-y-4">
          {formData.items.map((item: InvoiceItem, index: number) => (
            <Card key={item.id} className="p-4 bg-gray-50">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <Label htmlFor={`desc-${item.id}`}>Description</Label>
                    <Textarea
                      id={`desc-${item.id}`}
                      value={item.description}
                      onChange={(e) =>
                        updateItem(item.id, "description", e.target.value)
                      }
                      placeholder="Item description"
                      rows={2}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    className="mt-6"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor={`qty-${item.id}`}>Quantity</Label>
                    <Input
                      id={`qty-${item.id}`}
                      type="number"
                      value={item.quantity === 0 ? "" : item.quantity}
                      onChange={(e) =>
                        updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)
                      }
                      step="0.01"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`rate-${item.id}`}>Rate</Label>
                    <Input
                      id={`rate-${item.id}`}
                      type="number"
                      value={item.rate === 0 ? "" : item.rate}
                      onChange={(e) =>
                        updateItem(item.id, "rate", parseFloat(e.target.value) || 0)
                      }
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <Input
                      value={item.amount.toFixed(2)}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {formData.items.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No items added. Click "Add Item" to get started.
            </div>
          )}
        </div>
      </Card>

      {/* Payment Summary */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Payment Summary</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="discount">Discount (%)</Label>
            <Input
              id="discount"
              type="number"
              value={formData.payment.discount === 0 ? "" : formData.payment.discount}
              onChange={(e) =>
                updateField("payment", {
                  ...formData.payment,
                  discount: parseFloat(e.target.value) || 0,
                })
              }
              step="0.01"
              placeholder="0"
            />
          </div>
          <div>
            <Label htmlFor="advance">Advance Payment</Label>
            <Input
              id="advance"
              type="number"
              value={formData.payment.advance === 0 ? "" : formData.payment.advance}
              onChange={(e) =>
                updateField("payment", {
                  ...formData.payment,
                  advance: parseFloat(e.target.value) || 0,
                })
              }
              step="0.01"
              placeholder="0.00"
            />
          </div>
          <div>
            <Label htmlFor="payNow">Pay Now Amount</Label>
            <Input
              id="payNow"
              type="number"
              value={formData.payment.payNow === 0 ? "" : formData.payment.payNow}
              onChange={(e) =>
                updateField("payment", {
                  ...formData.payment,
                  payNow: parseFloat(e.target.value) || 0,
                })
              }
              step="0.01"
              placeholder="0.00"
            />
          </div>
          <div>
            <Label htmlFor="tax">Tax (%)</Label>
            <Input
              id="tax"
              type="number"
              value={formData.payment.tax === 0 ? "" : formData.payment.tax}
              onChange={(e) =>
                updateField("payment", {
                  ...formData.payment,
                  tax: parseFloat(e.target.value) || 0,
                })
              }
              step="0.01"
              placeholder="0"
            />
          </div>
        </div>
      </Card>

      {/* Additional Sections */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Additional Information</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Thanks for your business."
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="terms">Terms & Conditions</Label>
            <Textarea
              id="terms"
              value={formData.terms}
              onChange={(e) => updateField("terms", e.target.value)}
              placeholder="Enter your terms and conditions (one per line)"
              rows={6}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
