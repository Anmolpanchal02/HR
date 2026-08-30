"use client";

import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from "react";

import { uploadDocument } from "@/lib/api/documents.api";
import { ApiError } from "@/lib/api/client";
import type { DocumentDetail } from "@/types/document";

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt"];
const MAX_SIZE_MB = 10;

interface DocumentUploadProps {
  onUploaded: (document: DocumentDetail) => void;
}

export function DocumentUpload({ onUploaded }: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return "Only PDF, DOCX, and TXT files are allowed";
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File must be under ${MAX_SIZE_MB} MB`;
    }
    return null;
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setSuccess(null);
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setUploading(true);
      setProgress(0);
      try {
        const response = await uploadDocument(file, setProgress);
        onUploaded(response.data.document);
        setSuccess(`${file.name} uploaded successfully`);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [onUploaded, validateFile],
  );

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void handleFile(file);
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? "border-primary bg-background" : "border-border-strong bg-surface"
        }`}
      >
        <p className="text-sm text-foreground">Drag & drop a document here</p>
        <p className="mt-1 text-xs text-muted-foreground">PDF, DOCX, or TXT — max {MAX_SIZE_MB} MB</p>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Choose File"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={onInputChange}
        />
      </div>

      {uploading && (
        <div className="space-y-1">
          <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{progress}% uploaded</p>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-success">{success}</p>}
    </div>
  );
}
