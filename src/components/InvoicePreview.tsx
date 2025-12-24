import { forwardRef, useState } from "react";
import { Pencil, Plus, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InvoiceItem } from "@/types/invoice";

interface InvoicePreviewProps {
  items: InvoiceItem[];
  invoiceNumber: string;
  date: string;
  customerName: string;
  deliveryDate: string;
  onUpdateItem?: (id: string, field: keyof InvoiceItem, value: string) => void;
  onDeleteItem?: (id: string) => void;
  onAddItem?: () => void;
  onUpdateCustomerName?: (name: string) => void;
  onUpdateOrderDate?: (date: string) => void;
  onUpdateDeliveryDate?: (date: string) => void;
  editable?: boolean;
}

export const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(
  (
    {
      items,
      invoiceNumber,
      date,
      customerName,
      deliveryDate,
      onUpdateItem,
      onDeleteItem,
      onAddItem,
      onUpdateCustomerName,
      onUpdateOrderDate,
      onUpdateDeliveryDate,
      editable = false,
    },
    ref
  ) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Partial<InvoiceItem>>({});
    const [editingField, setEditingField] = useState<string | null>(null);
    const [tempValue, setTempValue] = useState("");

    const calculateTotal = () => {
      return items.reduce((sum, item) => {
        const amount = parseFloat(item.amount.replace(/[₹,INR\s]/g, "")) || 0;
        return sum + amount;
      }, 0);
    };

    const total = calculateTotal();

    const startEditing = (item: InvoiceItem) => {
      setEditingId(item.id);
      setEditValues({
        itemName: item.itemName,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
      });
    };

    const saveEditing = () => {
      if (editingId && onUpdateItem) {
        Object.entries(editValues).forEach(([field, value]) => {
          if (value !== undefined) {
            onUpdateItem(editingId, field as keyof InvoiceItem, value);
          }
        });
      }
      setEditingId(null);
      setEditValues({});
    };

    const cancelEditing = () => {
      setEditingId(null);
      setEditValues({});
    };

    const startFieldEdit = (field: string, value: string) => {
      setEditingField(field);
      setTempValue(value);
    };

    const saveFieldEdit = () => {
      if (editingField === "customerName" && onUpdateCustomerName) {
        onUpdateCustomerName(tempValue);
      } else if (editingField === "orderDate" && onUpdateOrderDate) {
        onUpdateOrderDate(tempValue);
      } else if (editingField === "deliveryDate" && onUpdateDeliveryDate) {
        onUpdateDeliveryDate(tempValue);
      }
      setEditingField(null);
      setTempValue("");
    };

    const cancelFieldEdit = () => {
      setEditingField(null);
      setTempValue("");
    };

    const formatDate = (dateStr: string) => {
      if (!dateStr) return "DD/MM/YYYY";
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
        .replace(/\//g, "/");
    };

    return (
      <div className="animate-scale-in">
        <div
  ref={ref}
  className="bg-white rounded-lg shadow-elevated overflow-hidden max-w-2xl mx-auto"
          id="invoice-content"
          style={{ backgroundColor: "#ffffff", color: "#1a1a2e" }}
        >
          {/* Header */}
         <div
  className="p-3 text-center"
  style={{
    backgroundColor: "#F97316",
    color: "#ffffff",
    printColorAdjust: "exact",
    WebkitPrintColorAdjust: "exact",
  }}
>
  <div
    className="inline-block px-6 py-2 rounded-lg"
    style={{
      backgroundColor: "#ffffff",
      border: "3px solid #1a1a2e",
      printColorAdjust: "exact",
      WebkitPrintColorAdjust: "exact",
    }}
  >
    <h2 
      className="text-lg font-bold" 
      style={{ 
        color: "#1a1a2e",
        display: "block",
        visibility: "visible",
      }}
    >
      Company Logo
    </h2>
  </div>
</div>

          {/* Customer + Dates */}
          <div
  className="px-3 py-2 flex justify-between items-start text-sm"
            style={{ borderBottom: "1px solid #e5e7eb" }}
          >
            {/* CUSTOMER NAME */}
            <div className="flex items-center gap-2">
              <span className="font-semibold" style={{ color: "#1a1a2e" }}>
                Customer Name:
              </span>

              {editingField === "customerName" ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="h-7 w-32 text-sm"
                  />

                 <Button
  onClick={saveFieldEdit}
  variant="ghost"
  className="h-6 w-6 p-1 hover:bg-gray-100"
>
  <Check className="w-3 h-3 text-green-600" />
</Button>

<Button
  onClick={cancelFieldEdit}
  variant="ghost"
  className="h-6 w-6 p-1 hover:bg-gray-100"
>
  <X className="w-3 h-3 text-red-600" />
</Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span style={{ color: "#374151" }}>{customerName}</span>

                  {editable && (
                    <Button
  onClick={() => startFieldEdit("customerName", customerName)}
  variant="ghost"
  className="h-6 w-6 p-1 hover:bg-gray-100 print:hidden"
>
  <Pencil className="w-3 h-3 text-gray-600" />
</Button>
                  )}
                </div>
              )}
            </div>

            {/* ORDER DATE */}
            <div className="flex items-center gap-2">
              <span className="font-semibold" style={{ color: "#1a1a2e" }}>
                Order Date:
              </span>

              {editingField === "orderDate" ? (
                <div className="flex items-center gap-1">
                  <Input
                    type="date"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="h-7 text-sm"
                  />

                 <Button variant="ghost" className="h-6 w-6 p-1 hover:bg-gray-100" onClick={saveFieldEdit}>
  <Check className="w-3 h-3 text-green-600" />
</Button>

<Button variant="ghost" className="h-6 w-6 p-1 hover:bg-gray-100" onClick={cancelFieldEdit}>
  <X className="w-3 h-3 text-red-600" />
</Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span style={{ color: "#374151" }}>{formatDate(date)}</span>

                  {editable && (
                    <Button
  onClick={() => startFieldEdit("orderDate", date)}
  variant="ghost"
  className="h-6 w-6 p-1 hover:bg-gray-100 print:hidden"
>
  <Pencil className="w-3 h-3 text-gray-600" />
</Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ITEMS TABLE */}
          <div className="p-3">
            <div
              className="overflow-hidden"
              style={{ border: "2px solid #1a1a2e" }}
            >
              {/* Header */}
              <div
                className="grid grid-cols-12 gap-0 text-sm font-semibold"
                style={{
                  backgroundColor: "#ffffff",
                  borderBottom: "2px solid #1a1a2e",
                }}
              >
                <div
                  className="col-span-1 p-2 text-center"
                  style={{ color: "#1a1a2e", borderRight: "1px solid #1a1a2e" }}
                >
                  Sl.No
                </div>

                <div
                  className="col-span-4 p-2"
                  style={{ color: "#1a1a2e", borderRight: "1px solid #1a1a2e" }}
                >
                  Components
                </div>

                <div
                  className="col-span-1 p-2 text-center"
                  style={{ color: "#1a1a2e", borderRight: "1px solid #1a1a2e" }}
                >
                  Unit
                </div>

                <div
                  className="col-span-1 p-2 text-center"
                  style={{ color: "#1a1a2e", borderRight: "1px solid #1a1a2e" }}
                >
                  Nos
                </div>

                <div
                  className="col-span-2 p-2 text-center"
                  style={{ color: "#1a1a2e", borderRight: "1px solid #1a1a2e" }}
                >
                  Rate
                </div>

                <div className="col-span-3 p-2 text-center" style={{ color: "#1a1a2e" }}>
                  Total
                </div>
              </div>

              {/* BODY */}
              <div>
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-0 items-center text-sm"
                    style={{
                      borderBottom:
                        index < items.length - 1
                          ? "1px solid #d1d5db"
                          : "none",
                    }}
                  >
                    {editingId === item.id ? (
                      <>
                        <div
                          className="col-span-1 p-2 text-center"
                          style={{
                            borderRight: "1px solid #d1d5db",
                          }}
                        >
                          {index + 1}
                        </div>

                        <div
                          className="col-span-4 p-2"
                          style={{ borderRight: "1px solid #d1d5db" }}
                        >
                          <Input
                            value={editValues.itemName || ""}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                itemName: e.target.value,
                              })
                            }
                            className="h-8 text-sm"
                          />
                        </div>

                        <div
                          className="col-span-1 p-2 text-center"
                          style={{
                            borderRight: "1px solid #d1d5db",
                          }}
                        >
                          Sq. mt
                        </div>

                        <div
                          className="col-span-1 p-2"
                          style={{ borderRight: "1px solid #d1d5db" }}
                        >
                          <Input
                            value={editValues.quantity || ""}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                quantity: e.target.value,
                              })
                            }
                            className="h-8 text-sm text-center"
                          />
                        </div>

                        <div
                          className="col-span-2 p-2"
                          style={{ borderRight: "1px solid #d1d5db" }}
                        >
                          <Input
                            value={editValues.rate || ""}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                rate: e.target.value,
                              })
                            }
                            className="h-8 text-sm text-center"
                          />
                        </div>

                       <div className="col-span-3 p-1 flex items-center gap-1">
  <Input
    value={editValues.amount || ""}
    onChange={(e) =>
      setEditValues({
        ...editValues,
        amount: e.target.value,
      })
    }
    className="h-8 text-sm text-center flex-1"
  />

  <div className="flex flex-col gap-0.5">
    <Button variant="ghost" className="h-4 w-5 p-0 hover:bg-gray-100" onClick={saveEditing}>
      <Check className="w-3 h-3 text-green-600" />
    </Button>

    <Button variant="ghost" className="h-4 w-5 p-0 hover:bg-gray-100" onClick={cancelEditing}>
      <X className="w-3 h-3 text-red-600" />
    </Button>
  </div>
</div>
                      </>
                    ) : (
                      <>
                        <div
                          className="col-span-1 p-2 text-center"
                          style={{ borderRight: "1px solid #d1d5db" }}
                        >
                          {index + 1}
                        </div>

                        <div
                          className="col-span-4 p-2"
                          style={{ borderRight: "1px solid #d1d5db" }}
                        >
                          {item.itemName || "—"}
                        </div>

                        <div
                          className="col-span-1 p-2 text-center"
                          style={{ borderRight: "1px solid #d1d5db" }}
                        >
                          Sq. mt
                        </div>

                        <div
                          className="col-span-1 p-2 text-center"
                          style={{ borderRight: "1px solid #d1d5db" }}
                        >
                          {item.quantity || "—"}
                        </div>

                        <div
                          className="col-span-2 p-2 text-center"
                          style={{ borderRight: "1px solid #d1d5db" }}
                        >
                          {item.rate || "—"}
                        </div>

                        <div className="col-span-3 p-2 text-center font-semibold flex items-center justify-between">
                          <span className="flex-1 text-center">{item.amount || "—"}</span>

                          {editable && (
                            <div className="flex gap-1 print:hidden">
                              <Button
  onClick={() => startEditing(item)}
  variant="ghost"
  className="h-6 w-6 p-2 hover:bg-gray-100"
>
  <Pencil className="w-3 h-3 text-gray-600" />
</Button>

<Button
  onClick={() => onDeleteItem?.(item.id)}
  variant="ghost"
  className="h-6 w-6 p-1 hover:bg-gray-100"
>
  <Trash2 className="w-3 h-3 text-red-600" />
</Button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* GRAND TOTAL */}
              {items.length > 0 && (
                <div
                  className="grid grid-cols-12 text-sm font-bold"
                  style={{
                    borderTop: "2px solid #1a1a2e",
                    backgroundColor: "#f9fafb",
                  }}
                >
                  <div
                    className="col-span-10 p-2"
                    style={{ color: "#1a1a2e" }}
                  >
                    Grand Total
                  </div>
                  <div
                    className="col-span-2 p-2 text-center"
                    style={{ color: "#1a1a2e" }}
                  >
                    INR {total.toLocaleString("en-IN")}
                  </div>
                </div>
              )}
            </div>

            {/* ADD ITEM */}
            {editable && (
              <Button
  onClick={onAddItem}
  variant="outline"
  className="w-full mt-3 h-9 border-dashed border-2 border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 print:hidden">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            )}

            {/* EMPTY STATE */}
            {items.length === 0 && (
              <div className="text-center py-8" style={{ color: "#9ca3af" }}>
                No items to display
              </div>
            )}

            {/* DELIVERY DATE */}
            <div className="mt-4 pt-3">
              <div
                className="flex items-center gap-2"
                style={{ color: "#1a1a2e" }}
              >
                <span className="font-semibold">Delivery Date:</span>

                {editingField === "deliveryDate" ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="date"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      className="h-7 text-sm"
                    />

                    <Button
  onClick={saveFieldEdit}
  variant="ghost"
  className="h-6 w-6 p-1 hover:bg-gray-100"
>
  <Check className="w-3 h-3 text-green-600" />
</Button>

<Button
  onClick={cancelFieldEdit}
  variant="ghost"
  className="h-6 w-6 p-1 hover:bg-gray-100"
>
  <X className="w-3 h-3 text-red-600" />
</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span>{formatDate(deliveryDate)}</span>

                   {editable && (
  <Button
    onClick={() =>
      startFieldEdit("deliveryDate", deliveryDate)
    }
    variant="ghost"
    className="h-6 w-6 p-1 hover:bg-gray-100 print:hidden"
  >
    <Pencil className="w-3 h-3 text-gray-600" />
  </Button>
)}</div>
                )}
              </div>
            </div>

            {/* SIGNATURES */}
            <div className="mt-4 flex justify-between">
              <div>
                <p className="font-semibold" style={{ color: "#1a1a2e" }}>
                  Prepared by:
                </p>
                <div
                  className="mt-6 w-32"
                  style={{ borderBottom: "1px solid #1a1a2e" }}
                ></div>
              </div>

              <div>
                <p className="font-semibold" style={{ color: "#1a1a2e" }}>
                  Checked by:
                </p>
                <div
                  className="mt-8 w-32"
                  style={{ borderBottom: "1px solid #1a1a2e" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

InvoicePreview.displayName = "InvoicePreview";
