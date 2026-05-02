import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Plus, Trash2, Upload } from "lucide-react";

export interface ReceiptServiceItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface ReceiptFormData {
  company: {
    logo: string;
    name: string;
    address: string;
    phone: string;
    email: string;
    gstNumber: string;
  };
  customer: {
    name: string;
    companyName: string;
    contact: string;
  };
  receipt: {
    number: string;
    date: string;
    invoiceNumber: string;
  };
  services: ReceiptServiceItem[];
  paymentSummary: {
    subtotal: number;
    taxPercentage: number;
    discount: number;
  };
  paymentInfo: {
    method: string;
    transactionId: string;
    date: string;
    status: string;
  };
}

interface ReceiptFormProps {
  formData: ReceiptFormData;
  onFormChange: (data: ReceiptFormData) => void;
}

export function ReceiptForm({ formData, onFormChange }: ReceiptFormProps) {
  const updateField = (section: keyof ReceiptFormData, field: string, value: any) => {
    if (section === 'services') return;
    onFormChange({
      ...formData,
      [section]: { ...(formData[section] as any), [field]: value },
    });
  };

  const addService = () => {
    onFormChange({
      ...formData,
      services: [
        ...formData.services,
        { id: Date.now().toString(), name: "", description: "", quantity: 1, rate: 0, amount: 0 }
      ]
    });
  };

  const removeService = (id: string) => {
    onFormChange({
      ...formData,
      services: formData.services.filter(s => s.id !== id)
    });
  };

  const updateService = (id: string, field: string, value: any) => {
    const updated = formData.services.map(s => {
      if (s.id === id) {
        const updatedService = { ...s, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updatedService.amount = updatedService.quantity * updatedService.rate;
        }
        return updatedService;
      }
      return s;
    });
    onFormChange({ ...formData, services: updated });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateField("company", "logo", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Company Details */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">🏢 Company Details</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="logo">Company Logo</Label>
            <div className="mt-2 flex items-center gap-3">
              <input type="file" id="logo" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById("logo")?.click()}>
                <Upload className="w-4 h-4 mr-2" /> Upload Logo
              </Button>
              {formData.company.logo && <img src={formData.company.logo} alt="Logo" className="h-10 w-10 object-contain" />}
            </div>
          </div>
          <div>
            <Label>Company Name</Label>
            <Input value={formData.company.name} onChange={(e) => updateField("company", "name", e.target.value)} />
          </div>
          <div>
            <Label>Address</Label>
            <Textarea value={formData.company.address} onChange={(e) => updateField("company", "address", e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Phone</Label>
              <Input value={formData.company.phone} onChange={(e) => updateField("company", "phone", e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={formData.company.email} onChange={(e) => updateField("company", "email", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>GST Number (Optional)</Label>
            <Input value={formData.company.gstNumber} onChange={(e) => updateField("company", "gstNumber", e.target.value)} />
          </div>
        </div>
      </Card>

      {/* Customer Details */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">👤 Customer Details</h2>
        <div className="space-y-4">
          <div>
            <Label>Customer Name</Label>
            <Input value={formData.customer.name} onChange={(e) => updateField("customer", "name", e.target.value)} />
          </div>
          <div>
            <Label>Company Name (Optional)</Label>
            <Input value={formData.customer.companyName} onChange={(e) => updateField("customer", "companyName", e.target.value)} />
          </div>
          <div>
            <Label>Contact Number / Email</Label>
            <Input value={formData.customer.contact} onChange={(e) => updateField("customer", "contact", e.target.value)} />
          </div>
        </div>
      </Card>

      {/* Receipt Info */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">🔢 Receipt Info</h2>
        <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="mt-4">
            <Label>Receipt Number (Unique)</Label>
            <Input value={formData.receipt.number} onChange={(e) => updateField("receipt", "number", e.target.value)} />
          </div>
          <div>
            <Label>Receipt Date</Label>
            <Input type="date" value={formData.receipt.date} onChange={(e) => updateField("receipt", "date", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>Invoice Number (Optional Reference)</Label>
            <Input value={formData.receipt.invoiceNumber} onChange={(e) => updateField("receipt", "invoiceNumber", e.target.value)} />
          </div>
        </div>
      </Card>

      {/* Services Details */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">🛠️ Service Details</h2>
          <Button onClick={addService} size="sm"><Plus className="w-4 h-4 mr-2" /> Add Service</Button>
        </div>
        <div className="space-y-4">
          {formData.services.map(s => (
            <Card key={s.id} className="p-4 bg-gray-50 space-y-3">
              <div className="flex gap-3 items-start">
                <div className="flex-1 space-y-3">
                  <div>
                    <Label>Service Name</Label>
                    <Input value={s.name} onChange={(e) => updateService(s.id, "name", e.target.value)} />
                  </div>
                  <div>
                    <Label>Description (Optional)</Label>
                    <Input value={s.description} onChange={(e) => updateService(s.id, "description", e.target.value)} />
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeService(s.id)} className="mt-6">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Quantity/Hours</Label>
                  <Input type="number" value={s.quantity === 0 ? "" : s.quantity} onChange={(e) => updateService(s.id, "quantity", parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <Label>Rate</Label>
                  <Input type="number" value={s.rate === 0 ? "" : s.rate} onChange={(e) => updateService(s.id, "rate", parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input disabled value={s.amount.toFixed(2)} className="bg-gray-100" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Payment Summary */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">💰 Payment Summary</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tax Percentage (e.g. 18)</Label>
              <Input type="number" value={formData.paymentSummary.taxPercentage === 0 ? "" : formData.paymentSummary.taxPercentage} onChange={(e) => updateField("paymentSummary", "taxPercentage", parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label>Discount Amount</Label>
              <Input type="number" value={formData.paymentSummary.discount === 0 ? "" : formData.paymentSummary.discount} onChange={(e) => updateField("paymentSummary", "discount", parseFloat(e.target.value) || 0)} />
            </div>
          </div>
        </div>
      </Card>

      {/* Payment Information */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">💳 Payment Information</h2>
        <div className="space-y-4">
          <div>
            <Label>Payment Method (UPI/Card/Bank/Cash)</Label>
            <Input value={formData.paymentInfo.method} onChange={(e) => updateField("paymentInfo", "method", e.target.value)} />
          </div>
          <div>
            <Label>Transaction ID / Reference ID</Label>
            <Input value={formData.paymentInfo.transactionId} onChange={(e) => updateField("paymentInfo", "transactionId", e.target.value)} />
          </div>
          <div>
            <Label>Payment Date</Label>
            <Input type="date" value={formData.paymentInfo.date} onChange={(e) => updateField("paymentInfo", "date", e.target.value)} />
          </div>
        </div>
      </Card>
    </div>
  );
}
