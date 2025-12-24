import { CheckCircle2, Download, RotateCcw, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DownloadCompleteProps {
  onDownload: () => void;
  onStartOver: () => void;
  isDownloading: boolean;
}

export const DownloadComplete = ({
  onDownload,
  onStartOver,
  isDownloading,
}: DownloadCompleteProps) => {
  return (
    <div className="animate-scale-in text-center py-6">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full gradient-primary flex items-center justify-center shadow-glow">
        <CheckCircle2 className="w-10 h-10 text-primary-foreground" />
      </div>

      <h2 className="text-2xl font-bold mb-2">Invoice Ready!</h2>
      <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
        Your invoice has been generated and is ready for download
      </p>

      <div className="flex flex-col gap-3 max-w-xs mx-auto">

        {/* MAIN DOWNLOAD BUTTON */}
        <Button
          onClick={onDownload}
          disabled={isDownloading}
          className="rounded-xl h-14 bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 text-lg"
        >
          {isDownloading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Download PDF
            </>
          )}
        </Button>

        {/* START OVER BUTTON */}
        <Button
          onClick={onStartOver}
          className="rounded-xl h-14 border text-foreground hover:bg-accent flex items-center justify-center gap-2 text-lg"
        >
          <RotateCcw className="w-5 h-5" />
          Create New Invoice
        </Button>

      </div>
    </div>
  );
};
