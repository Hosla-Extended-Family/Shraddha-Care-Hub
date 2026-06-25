import { useState } from "react";
import imageCompression from "browser-image-compression";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UseImageUploadOptions {
  bucket: string;
  folder?: string;
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  acceptedTypes?: string[];
}

export function useImageUpload({
  bucket,
  folder = "",
  maxSizeMB = 1,
  maxWidthOrHeight = 800,
  acceptedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"],
}: UseImageUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const compressImage = async (file: File): Promise<File> => {
    // Skip compression for GIFs to preserve animation
    if (file.type === "image/gif") {
      return file;
    }

    const options = {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker: true,
      fileType: file.type as "image/jpeg" | "image/png" | "image/webp",
    };

    try {
      setProgress(10);
      const compressedFile = await imageCompression(file, options);
      setProgress(30);
      
      console.log(
        `Compressed: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB`
      );
      
      return compressedFile;
    } catch (error) {
      console.warn("Compression failed, using original:", error);
      return file;
    }
  };

  const upload = async (file: File): Promise<string | null> => {
    // Validate file type
    if (!acceptedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: `Please upload one of: ${acceptedTypes.map(t => t.split('/')[1]).join(', ')}`,
        variant: "destructive",
      });
      return null;
    }

    // Validate original file size (allow up to 10MB before compression)
    const maxOriginalSize = 10 * 1024 * 1024;
    if (file.size > maxOriginalSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return null;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      // Compress image before upload
      const compressedFile = await compressImage(file);
      setProgress(40);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      setProgress(50);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, compressedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setProgress(90);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setProgress(100);
      
      toast({
        title: "Upload successful",
        description: `Image optimized and uploaded (${(compressedFile.size / 1024).toFixed(0)}KB)`,
      });

      return publicUrl;
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteImage = async (url: string): Promise<boolean> => {
    try {
      // Extract file path from URL
      const urlParts = url.split(`/storage/v1/object/public/${bucket}/`);
      if (urlParts.length !== 2) return false;
      
      const filePath = urlParts[1];
      
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error("Delete error:", error);
      return false;
    }
  };

  return {
    upload,
    deleteImage,
    isUploading,
    progress,
  };
}
