import { Plus, Trash2, Package, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InvoiceItem } from "@/types/invoice";
import { cn } from "@/lib/utils";

interface ItemsEditorProps {
  items: InvoiceItem[];
  onUpdateItem: (id: string, field: keyof InvoiceItem, value: string) => void;
  onDeleteItem: (id: string) => void;
  onAddItem: () => void;
  isExtracting?: boolean;
  onExtract?: () => void;
  hasImage?: boolean;
}

export const ItemsEditor = ({
  items,
  onUpdateItem,
  onDeleteItem,
  onAddItem,
  isExtracting,
  onExtract,
  hasImage,
}: ItemsEditorProps) => {
  return (
    <div className="animate-slide-up space-y-6">

      {/* Extraction Section */}
      {hasImage && items.length === 0 && (
        <div className="glass rounded-2xl p-6 shadow-card border border-border/50 text-center">
          {isExtracting ? (
            <div className="py-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center shadow-glow animate-pulse">
                <Sparkles className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Extracting Information...</h3>
              <p className="text-muted-foreground text-sm">
                Analyzing your document for items and quantities
              </p>
            </div>
          ) : (
            <div className="py-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-accent-foreground" />
              </div>

              <h3 className="text-lg font-semibold mb-2">Ready to Extract</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Extract item details from your uploaded image
              </p>

              {/* FIXED BUTTON */}
              <Button
                onClick={onExtract}
                className="rounded-xl px-6 h-12 bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 justify-center"
              >
                <Sparkles className="w-5 h-5" />
                Extract Items
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Items List */}
      {items.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Extracted Items</h3>
            <span className="text-sm text-muted-foreground px-3 py-1 bg-accent rounded-full">
              {items.length} items
            </span>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                className={cn(
                  "glass rounded-2xl p-4 shadow-card border border-border/50 transition-all duration-300 hover:shadow-elevated hover:border-primary/20",
                  "animate-fade-in"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-3">

                  {/* Index Badge */}
                  <div className="w-10 h-10 rounded-xl gradient-secondary flex items-center justify-center flex-shrink-0 text-primary-foreground font-bold text-sm">
                    {index + 1}
                  </div>

                  <div className="flex-1 space-y-3">
                    {/* Item Name */}
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">
                        Item Name
                      </label>
                      <Input
                        value={item.itemName}
                        onChange={(e) => onUpdateItem(item.id, "itemName", e.target.value)}
                        placeholder="Enter item name"
                        className="h-11 glass border-border/50 focus:border-primary/50"
                      />
                    </div>

                    {/* Qty, Rate, Amount */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">
                          Qty
                        </label>
                        <Input
                          value={item.quantity}
                          onChange={(e) => onUpdateItem(item.id, "quantity", e.target.value)}
                          placeholder="0"
                          className="h-11 glass border-border/50 focus:border-primary/50"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">
                          Rate
                        </label>
                        <Input
                          value={item.rate}
                          onChange={(e) => onUpdateItem(item.id, "rate", e.target.value)}
                          placeholder="₹0"
                          className="h-11 glass border-border/50 focus:border-primary/50"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">
                          Amount
                        </label>
                        <Input
                          value={item.amount}
                          onChange={(e) => onUpdateItem(item.id, "amount", e.target.value)}
                          placeholder="₹0"
                          className="h-11 glass border-border/50 focus:border-primary/50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* DELETE BUTTON — FIXED */}
                  <Button
                    onClick={() => onDeleteItem(item.id)}
                    className="h-10 w-10 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* ADD ITEM BUTTON — FIXED */}
          <Button
            onClick={onAddItem}
            className="w-full h-12 border-dashed border-2 rounded-xl hover:border-primary/50 hover:bg-accent/50 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Item
          </Button>
        </>
      )}

      {/* Empty State */}
      {!hasImage && items.length === 0 && (
        <div className="text-center py-12 glass rounded-2xl border border-border/50">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">No items yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Upload an image to extract items
          </p>
        </div>
      )}
    </div>
  );
};
