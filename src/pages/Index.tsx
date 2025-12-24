import { useState, useRef, useCallback } from "react";
import { ArrowLeft, ArrowRight, FileText, User, Sparkles } from "lucide-react";
import { extractInvoiceItems, checkApiHealth } from "@/services/ocrService";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "@/components/StepIndicator";
import { ImageUpload } from "@/components/ImageUpload";
import { InvoicePreview } from "@/components/InvoicePreview";
import { DownloadComplete } from "@/components/DownloadComplete";
import { AdminModal } from "@/components/AdminModal";
import { Step, InvoiceItem } from "@/types/invoice";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const steps: { key: Step; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "preview", label: "Preview" },
];

const Index = () => {
  const [currentStep, setCurrentStep] = useState<Step>("upload");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState("Customer");
  const [orderDate, setOrderDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [deliveryDate, setDeliveryDate] = useState("");
  const invoiceRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleImageUpload = useCallback(
    (file: File, preview: string) => {
      setUploadedImage(preview);
      setUploadedFile(file);
      toast({
        title: "Image uploaded",
        description: "Ready to extract information",
      });
    },
    [toast]
  );

  const handleClearImage = useCallback(() => {
    setUploadedImage(null);
    setUploadedFile(null);
    setItems([]);
  }, []);

  const handleExtract = useCallback(async () => {
    if (!uploadedFile) {
      toast({
        title: "No image",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);

    try {
      // Check if backend is running
      const isHealthy = await checkApiHealth();
      if (!isHealthy) {
        toast({
          title: "Backend not available",
          description: "Please start the OCR backend server (python backend/app.py)",
          variant: "destructive",
        });
        setIsExtracting(false);
        return;
      }

      // Call OCR API
      const result = await extractInvoiceItems(uploadedFile);

      if (result.success && result.items.length > 0) {
        // Map extracted items to InvoiceItem format
        const extractedItems: InvoiceItem[] = result.items.map((item, index) => ({
          id: item.id || (index + 1).toString(),
          itemName: item.itemName || "",
          quantity: item.quantity || "",
          rate: item.rate ? `INR ${item.rate}` : "",
          amount: item.amount ? `INR ${item.amount}` : "",
        }));

        setItems(extractedItems);

        // Update customer info if extracted
        if (result.header.customerName) {
          setCustomerName(result.header.customerName);
        }
        if (result.header.date) {
          // Try to parse date to ISO format
          const parts = result.header.date.split('/');
          if (parts.length === 3) {
            const [day, month, year] = parts;
            const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            setOrderDate(isoDate);
          }
        }

        setCurrentStep("preview");
        toast({
          title: "Extraction complete",
          description: `Found ${extractedItems.length} items`,
        });
      } else if (result.success && result.items.length === 0) {
        toast({
          title: "No items found",
          description: "Could not extract any items from the image. Please try a clearer image.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Extraction failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Extraction error:", error);
      toast({
        title: "Extraction failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  }, [uploadedFile, toast]);

  const handleUpdateItem = useCallback(
    (id: string, field: keyof InvoiceItem, value: string) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
      );
    },
    []
  );

  const handleDeleteItem = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast({ title: "Item removed" });
    },
    [toast]
  );

  const handleAddItem = useCallback(() => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      itemName: "",
      quantity: "",
      rate: "",
      amount: "",
    };
    setItems((prev) => [...prev, newItem]);
  }, []);

  const handleDownloadPDF = useCallback(async () => {
    if (!invoiceRef.current) return;

    setIsDownloading(true);
    try {
      const editButtons = invoiceRef.current.querySelectorAll(".print\\:hidden");
      editButtons.forEach((btn) => ((btn as HTMLElement).style.display = "none"));

      const canvas = await html2canvas(
        invoiceRef.current,
        {
          useCORS: true,
          backgroundColor: "#ffffff",
          ...({ scale: 2 } as any),
        }
      );

      editButtons.forEach((btn) => ((btn as HTMLElement).style.display = ""));

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();

      while (heightLeft > 0) {
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position - heightLeft, imgWidth, imgHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      pdf.save(`invoice-${customerName}-${Date.now()}.pdf`);
      setCurrentStep("download");

      toast({
        title: "PDF Downloaded",
        description: "Your invoice has been saved",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Please try again",
        variant: "destructive",
      });
    }

    setIsDownloading(false);
  }, [customerName, toast]);

  const canProceed = () => {
    if (currentStep === "upload") return !!uploadedImage;
    if (currentStep === "preview") return items.length > 0;
    return false;
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-strong border-b border-border/50 max-w-md mx-auto">
        <div className="container py-2 px-4 flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              InvoiceAI
            </h1>
          </div>

          <Button
            onClick={() => setIsAdminModalOpen(true)}
            className="rounded-xl gap-2 border px-3 py-2 text-sm hover:bg-accent flex items-center"
          >
            <User className="w-4 h-4" />
            Admin
          </Button>
        </div>
      </header>

      {currentStep !== "download" && (
        <StepIndicator currentStep={currentStep} steps={steps} />
      )}

      <main className="w-full max-w-2xl mx-auto pb-32 pt-4 px-4 flex flex-col items-center gap-6">

        {currentStep === "upload" && (
          <div className="space-y-6">
            <ImageUpload
              onImageUpload={handleImageUpload}
              uploadedImage={uploadedImage}
              onClearImage={handleClearImage}
            />

            {uploadedImage && (
              <div className="glass rounded-2xl p-4 text-center shadow-card border border-border/50 max-w-md mx-auto">
                {isExtracting ? (
                  <div className="py-4">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center shadow-glow animate-pulse">
                      <Sparkles className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      Extracting Information...
                    </h3>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-accent flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <h3 className="text-base font-semibold mb-3">Ready to Extract</h3>

                    {/* FIXED BUTTON */}
                    <Button
                      onClick={handleExtract}
                      className="rounded-xl h-11 bg-primary text-primary-foreground hover:bg-primary/90 w-full flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Extract & Preview
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {currentStep === "preview" && (
          <InvoicePreview
            ref={invoiceRef}
            items={items}
            invoiceNumber={`INV-${Date.now().toString().slice(-6)}`}
            date={orderDate}
            customerName={customerName}
            deliveryDate={deliveryDate}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onAddItem={handleAddItem}
            onUpdateCustomerName={setCustomerName}
            onUpdateOrderDate={setOrderDate}
            onUpdateDeliveryDate={setDeliveryDate}
            editable={true}
          />
        )}

        {currentStep === "download" && (
          <>
            <div className="mb-6">
              <InvoicePreview
                ref={invoiceRef}
                items={items}
                invoiceNumber={`INV-${Date.now().toString().slice(-6)}`}
                date={orderDate}
                customerName={customerName}
                deliveryDate={deliveryDate}
                editable={false}
              />
            </div>

            <DownloadComplete
              onDownload={handleDownloadPDF}
              onStartOver={() => {
                setCurrentStep("upload");
                setUploadedImage(null);
                setItems([]);
              }}
              isDownloading={isDownloading}
            />
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      {currentStep !== "download" && (
        <div className="fixed bottom-0 left-0 right-0 glass-strong border-t border-border/50 p-4">
          <div className="container flex gap-3 max-w-lg mx-auto">
            {currentStep === "preview" && (
              <Button
                onClick={() => setCurrentStep("upload")}
                className="flex-1 rounded-xl h-14 border hover:bg-accent flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </Button>
            )}

            {currentStep === "preview" && (
              <Button
                onClick={handleDownloadPDF}
                disabled={!canProceed() || isDownloading}
                className="flex-1 rounded-xl h-14 bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                {isDownloading ? "Generating..." : "Download PDF"}
                <ArrowRight className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      )}

      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />
    </div>
  );
};

export default Index;
