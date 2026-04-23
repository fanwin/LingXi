import { ContentBlock } from "@langchain/core/messages";
import { toast } from "sonner";
// NOTE  MC80OmFIVnBZMlhvaklQb3RvVTZlVTFwYlE9PTo5NDYyN2YzZg==

// Returns a Promise of a typed multimodal block for images, PDFs, or Word documents
export async function fileToContentBlock(
  file: File,
): Promise<ContentBlock.Multimodal.Data> {
  const supportedImageTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  // 支持的文档类型：PDF + Word
  const supportedFileTypes = [
    ...supportedImageTypes,
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/msword", // .doc
  ];

  if (!supportedFileTypes.includes(file.type)) {
    toast.error(
      `Unsupported file type: ${file.type}. Supported types are: ${supportedFileTypes.join(", ")}`,
    );
    return Promise.reject(new Error(`Unsupported file type: ${file.type}`));
  }

  const data = await fileToBase64(file);

  if (supportedImageTypes.includes(file.type)) {
    return {
      type: "image",
      mimeType: file.type,
      data,
      metadata: { name: file.name },
    };
  }

  // PDF
  if (file.type === "application/pdf") {
    return {
      type: "file",
      mimeType: "application/pdf",
      data,
      metadata: { filename: file.name },
    };
  }

  // Word (.docx / .doc)
  return {
    type: "file",
    mimeType: file.type, // application/...wordprocessingml.document 或 application/msword
    data,
    metadata: { filename: file.name },
  };
}
// TODO  MS80OmFIVnBZMlhvaklQb3RvVTZlVTFwYlE9PTo5NDYyN2YzZg==

// Helper to convert File to base64 string
export async function fileToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove the data:...;base64, prefix
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
// @ts-expect-error  Mi80OmFIVnBZMlhvaklQb3RvVTZlVTFwYlE9PTo5NDYyN2YzZg==

// Type guard for Base64ContentBlock
export function isBase64ContentBlock(
  block: unknown,
): block is ContentBlock.Multimodal.Data {
  if (typeof block !== "object" || block === null || !("type" in block))
    return false;
  // file type (legacy) — PDF or Word documents
  if (
    (block as { type: unknown }).type === "file" &&
    "mimeType" in block &&
    typeof (block as { mimeType?: unknown }).mimeType === "string" &&
    ((block as { mimeType: string }).mimeType.startsWith("image/") ||
      (block as { mimeType: string }).mimeType === "application/pdf" ||
      (block as { mimeType: string }).mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      (block as { mimeType: string }).mimeType === "application/msword")
  ) {
    return true;
  }
  // image type (new)
  if (
    (block as { type: unknown }).type === "image" &&
    "mimeType" in block &&
    typeof (block as { mimeType?: unknown }).mimeType === "string" &&
    (block as { mimeType: string }).mimeType.startsWith("image/")
  ) {
    return true;
  }
  return false;
}
// FIXME  My80OmFIVnBZMlhvaklQb3RvVTZlVTFwYlE9PTo5NDYyN2YzZg==
