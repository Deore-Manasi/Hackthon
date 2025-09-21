import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DocumentUpload from "./DocumentUpload";

interface DocumentUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentUploadModal({
  open,
  onOpenChange,
}: DocumentUploadModalProps) {
  const [step, setStep] = useState<"upload" | "query">("upload");
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const { toast } = useToast();

  const handleUploadSuccess = () => {
    setStep("query");
  };

  const handleQuery = async () => {
    if (!query.trim()) return;
    setIsQuerying(true);
    setAnswer("");

    try {
      const response = await fetch("http://localhost:8000/query/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      if (response.ok) {
        setAnswer(data.answer || "No answer found.");
      } else {
        setAnswer("❌ Query failed: " + data.error);
      }
    } catch (err: any) {
      setAnswer("❌ Query failed (server not reachable).");
    } finally {
      setIsQuerying(false);
    }
  };

  const handleStartOver = () => {
    setStep("upload");
    setQuery("");
    setAnswer("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl p-6">
        <DialogHeader>
          <DialogTitle>
            {step === "upload" ? "Upload Document" : "Ask About Your Document"}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {step === "upload" ? (
            <DocumentUpload onUploadSuccess={handleUploadSuccess} />
          ) : (
            <div>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Enter your query..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={isQuerying}
                />
                <Button onClick={handleQuery} disabled={isQuerying || !query}>
                  {isQuerying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Asking...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Ask
                    </>
                  )}
                </Button>
              </div>

              {answer && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm">
                    <span className="font-semibold">Answer:</span> {answer}
                  </p>
                </div>
              )}

              <Button
                variant="ghost"
                onClick={handleStartOver}
                className="mt-4 text-sm"
              >
                ← Upload Another Document
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
