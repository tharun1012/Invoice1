import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, Camera, Image as ImageIcon, X, Video, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  onImageUpload: (file: File, preview: string) => void;
  uploadedImage: string | null;
  onClearImage: () => void;
}

export const ImageUpload = ({
  onImageUpload,
  uploadedImage,
  onClearImage,
}: ImageUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          onImageUpload(file, e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [onImageUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  // Start camera - open UI first, then initialize stream
  const startCamera = () => {
    setCameraError(null);
    setIsCameraOpen(true);
  };

  // Initialize stream when camera UI opens
  useEffect(() => {
    if (!isCameraOpen) return;

    let mounted = true;

    const initStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (playErr) {
            console.error("Video play error:", playErr);
          }
        }
      } catch (err) {
        console.error("Camera access error:", err);
        if (!mounted) return;

        setIsCameraOpen(false);
        if (err instanceof Error) {
          if (err.name === "NotAllowedError") {
            setCameraError("Camera permission denied. Please allow camera access in your browser settings.");
          } else if (err.name === "NotFoundError") {
            setCameraError("No camera found on this device.");
          } else {
            setCameraError(`Camera error: ${err.message}`);
          }
        } else {
          setCameraError("Unable to access camera.");
        }
      }
    };

    initStream();

    return () => {
      mounted = false;
    };
  }, [isCameraOpen]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  }, []);

  // Capture photo from video stream
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
                type: "image/jpeg",
              });
              const preview = canvas.toDataURL("image/jpeg", 0.9);
              stopCamera();
              onImageUpload(file, preview);
            }
          },
          "image/jpeg",
          0.9
        );
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Camera UI - Mobile-friendly fullscreen overlay
  if (isCameraOpen) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        {/* Video container - takes full screen */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Close button - top right with safe area */}
          <Button
            onClick={stopCamera}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 rounded-full shadow-lg bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 w-12 h-12 sm:w-10 sm:h-10 p-0"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            <X className="w-6 h-6 sm:w-5 sm:h-5" />
          </Button>

          {/* Viewfinder overlay - visual guide */}
          <div className="absolute inset-4 sm:inset-8 border-2 border-white/30 rounded-2xl pointer-events-none">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
          </div>
        </div>

        {/* Bottom controls bar - with safe area for mobile */}
        <div
          className="bg-black/80 backdrop-blur-sm px-6 py-6 sm:py-4 flex flex-col items-center gap-3"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))' }}
        >
          <p className="text-white/80 text-sm text-center">
            Position document in frame
          </p>

          {/* Capture button - large and touch-friendly */}
          <Button
            onClick={capturePhoto}
            className="w-20 h-20 sm:w-16 sm:h-16 rounded-full bg-white hover:bg-gray-100 active:scale-95 shadow-lg flex items-center justify-center border-4 border-primary transition-transform touch-manipulation"
          >
            <Circle className="w-12 h-12 sm:w-10 sm:h-10 text-primary fill-primary" />
          </Button>
        </div>

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  // Camera error UI
  if (cameraError) {
    return (
      <div className="animate-scale-in w-full max-w-md mx-auto flex flex-col items-center">
        <div className="glass rounded-2xl border border-red-500/50 p-6 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <Camera className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-lg font-bold mb-2 text-red-500">Camera Error</h3>
          <p className="text-sm text-muted-foreground mb-4">{cameraError}</p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => {
                setCameraError(null);
                startCamera();
              }}
              className="rounded-xl"
            >
              Try Again
            </Button>
            <Button
              onClick={() => setCameraError(null)}
              variant="outline"
              className="rounded-xl"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If image already uploaded
  if (uploadedImage) {
    return (
      <div className="animate-scale-in w-full max-w-md mx-auto flex flex-col items-center">

        <div className="relative rounded-2xl overflow-hidden glass shadow-elevated border border-border/50">
          <img
            src={uploadedImage}
            alt="Uploaded document"
            className="w-full max-h-[50vh] object-contain bg-muted/30"
          />
          <Button
            onClick={onClearImage}
            className="absolute top-3 right-3 rounded-xl shadow-lg bg-red-600 text-white hover:bg-red-700 p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Image uploaded successfully
        </p>
      </div>
    );
  }

  // Upload UI
  return (
    <div className="animate-slide-up w-full max-w-md mx-auto flex flex-col items-center">

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative glass rounded-2xl border-2 border-dashed p-4 text-center transition-all duration-300 cursor-pointer group",
          isDragging
            ? "border-primary bg-accent/50 scale-[1.02]"
            : "border-border/70 hover:border-primary/50 hover:shadow-elevated"
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-accent/50 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl gradient-primary flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform duration-300">
            <Upload className="w-7 h-7 text-primary-foreground" />
          </div>

          <h3 className="text-lg font-bold mb-1.5">Upload Document</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
            Drag & drop your invoice or document image here
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">

            {/* Choose File Button */}
            <Button
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="rounded-xl bg-primary text-white hover:bg-primary/90 flex items-center gap-2 px-4 h-9"
            >
              <ImageIcon className="w-4 h-4" />
              Choose File
            </Button>

            {/* Camera Button */}
            <Button
              onClick={(e) => {
                e.stopPropagation();
                startCamera();
              }}
              className="rounded-xl border text-foreground hover:bg-accent flex items-center gap-2 px-4 h-9"
            >
              <Camera className="w-4 h-4" />
              Take Photo
            </Button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      <p className="text-center text-xs text-muted-foreground mt-4">
        Supports JPG, PNG, HEIC • Max 10MB
      </p>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};