import { useState, useCallback } from "react";
import type { DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentUploadProps {
  onUploadSuccess: () => void;
}

const DocumentUpload = ({ onUploadSuccess }: DocumentUploadProps) => {
  const [dragOver, setDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files) as File[];
    if (files.length > 0) handleFileUpload(files[0]);
  }, []);

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const backendResponse = await fetch("http://localhost:8000/upload/", {
        method: "POST",
        body: formData,
      });

      if (!backendResponse.ok) {
        throw new Error(`Backend error: ${backendResponse.statusText}`);
      }

      await backendResponse.json();
      toast({
        title: "Upload Successful",
        description: `${file.name} processed.`,
      });
      onUploadSuccess();
    } catch (err: any) {
      console.error("Upload failed:", err);
      toast({
        title: "Error",
        description: err.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  return (
    <Card className="mb-8">
      <CardContent className="p-12">
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
            dragOver
              ? "border-primary bg-primary/10"
              : "border-border bg-muted/30"
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
        >
          <Upload className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">
            Drag and drop your document
          </h3>
          <p className="text-muted-foreground mb-6">
            or click to browse your files
          </p>
          <Button variant="upload" asChild disabled={isUploading}>
            <label className="cursor-pointer">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileInput}
              />
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Choose File"
              )}
            </label>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentUpload;
