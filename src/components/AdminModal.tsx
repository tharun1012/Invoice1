import { useState } from "react";
import { X, Upload, LogIn, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UploadedFile {
  id: string;
  name: string;
  size: string;
}

export const AdminModal = ({ isOpen, onClose }: AdminModalProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      setIsLoggedIn(true);
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: (file.size / 1024).toFixed(1) + " KB",
    }));
    
    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDeleteFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername("");
    setPassword("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="glass w-full max-w-md rounded-2xl shadow-elevated border border-border/50 animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <h2 className="text-lg font-semibold text-foreground">
            {isLoggedIn ? "File Upload" : "Admin Login"}
          </h2>

          <Button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-accent"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isLoggedIn ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Username
                </label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="rounded-xl"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Upload Area */}
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  isDragging
                    ? "border-primary bg-primary/10"
                    : "border-border/50 hover:border-primary/50"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />

                <p className="text-sm text-foreground font-medium mb-1">
                  Drag & drop files here
                </p>
                <p className="text-xs text-muted-foreground mb-3">or</p>

                <label>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    accept=".pdf,.csv,.xlsx,.xls,.json"
                  />

                  <Button
                    type="button"
                    className="rounded-xl border px-3 py-1 text-sm hover:bg-accent"
                  >
                    Browse Files
                  </Button>
                </label>

                <p className="text-xs text-muted-foreground mt-2">
                  PDF, CSV, Excel, JSON supported
                </p>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-foreground">
                    Uploaded Files
                  </h3>

                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 bg-accent/30 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-primary" />

                          <div>
                            <p className="text-sm font-medium text-foreground truncate max-w-[180px]">
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">{file.size}</p>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleDeleteFile(file.id)}
                          className="h-8 w-8 p-1 hover:bg-accent"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Logout Button */}
              <Button
                onClick={handleLogout}
                className="w-full rounded-xl mt-4 border hover:bg-accent"
              >
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
