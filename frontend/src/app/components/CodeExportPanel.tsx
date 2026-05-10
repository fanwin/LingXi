"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Code,
  Download,
  Copy,
  Check,
  FileCode,
  FolderArchive,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import JSZip from "jszip";

// ── 类型定义 ───────────────────────────────────────────

interface CodeFileMeta {
  filename: string;
  language: string;
  size_bytes: number;
}

interface CodeFileWithContent extends CodeFileMeta {
  /** 解压后的文件内容（懒加载） */
  content?: string;
  /** 是否正在加载中 */
  loading?: boolean;
}

interface ParsedResult {
  file_path: string;
  base64_data: string;
  filename: string;
  file_count: number;
  file_list: CodeFileMeta[];
}

export interface CodeExportPanelProps {
  rawResult: string;
  onRemove?: () => void;
}

// ── 语言颜色映射 ─────────────────────────────────────

const LANGUAGE_COLORS: Record<string, string> = {
  python: "text-blue-400",
  typescript: "text-blue-500",
  javascript: "text-yellow-400",
  java: "text-red-400",
  go: "text-cyan-400",
  rust: "text-orange-500",
  c: "text-gray-300",
  cpp: "text-blue-300",
  csharp: "text-purple-400",
  ruby: "text-red-300",
  php: "text-indigo-400",
  swift: "text-orange-400",
  kotlin: "text-purple-300",
  scala: "text-red-500",
  sql: "text-green-400",
  bash: "text-green-300",
  yaml: "text-pink-300",
  json: "text-yellow-300",
  html: "text-orange-500",
  css: "text-blue-300",
  vue: "text-emerald-400",
  markdown: "text-white",
  dockerfile: "text-cyan-300",
  text: "text-gray-400",
};

function getLanguageColor(lang: string): string {
  return LANGUAGE_COLORS[lang.toLowerCase()] || "text-gray-400";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * 从 base64 字符串解码为 Uint8Array。
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

// ── 单个代码文件项（可展开预览） ─────────────────────

function CodeFileItem({
  file,
  onFetchContent,
}: {
  file: CodeFileWithContent;
  onFetchContent: (filename: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleExpand = useCallback(() => {
    const next = !expanded;
    setExpanded(next);
    // 首次展开且无内容时，触发懒加载解压
    if (next && file.content === undefined && !file.loading) {
      onFetchContent(file.filename);
    }
  }, [expanded, file.content, file.loading, file.filename, onFetchContent]);

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (file.content) {
        navigator.clipboard.writeText(file.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    },
    [file]
  );

  return (
    <div
      className={cn(
        "group rounded-lg border border-border/50 transition-all duration-200",
        expanded ? "bg-accent/30" : "bg-transparent hover:bg-accent/20"
      )}
    >
      {/* 文件头部 */}
      <button
        type="button"
        onClick={handleExpand}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
            expanded && "rotate-90"
          )}
        />
        <FileCode
          className={cn("h-4 w-4 shrink-0", getLanguageColor(file.language))}
        />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {file.filename}
        </span>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {formatFileSize(file.size_bytes)}
        </span>
        <span
          className={cn(
            "shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-mono uppercase",
            getLanguageColor(file.language)
          )}
        >
          {file.language}
        </span>
      </button>

      {/* 展开内容：代码预览区 */}
      {expanded && (
        <div className="animate-message-in border-t border-border/30">
          {/* 操作栏 */}
          <div className="flex items-center justify-end gap-1 px-3 py-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={handleCopy}
              disabled={!file.content}
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-500" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  复制
                </>
              )}
            </Button>
          </div>

          {/* 内容区域：加载中 / 代码预览 / 空状态 */}
          {file.loading ? (
            <div className="flex items-center justify-center gap-2 py-8">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">正在读取文件...</span>
            </div>
          ) : file.content ? (
            <pre className="max-h-[420px] overflow-auto rounded-b-lg bg-[#1e1e2e] p-4 text-xs leading-relaxed text-gray-300 scrollbar-thin scrollbar-thumb-border">
              <code>{file.content}</code>
            </pre>
          ) : (
            <div className="py-6 text-center text-xs text-muted-foreground">
              文件内容不可读（可能是二进制文件）
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── 主组件 ────────────────────────────────────────────

export function CodeExportPanel({ rawResult, onRemove }: CodeExportPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 解析工具结果
  const parsed = useMemo((): ParsedResult | null => {
    try {
      return JSON.parse(rawResult);
    } catch {
      return null;
    }
  }, [rawResult]);

  // 无效数据不渲染
  if (!parsed || !parsed.base64_data) return null;

  const { filename, base64_data, file_list, file_count } = parsed;

  // ── 前端 ZIP 解压：为每个文件懒加载内容 ─────────
  const [filesWithContent, setFilesWithContent] = useState<CodeFileWithContent[]>(
    () => (file_list ?? []).map((f) => ({ ...f }))
  );
  const [zipCache, setZipCache] = useState<JSZip | null>(null);

  // 首次挂载时异步加载 ZIP（不阻塞渲染）
  useEffect(() => {
    let cancelled = false;
    async function loadZip() {
      try {
        const bytes = base64ToUint8Array(base64_data);
        const zip = await JSZip.loadAsync(bytes);
        if (!cancelled) setZipCache(zip);
      } catch (e) {
        console.warn("[CodeExportPanel] ZIP 预加载失败:", e);
      }
    }
    loadZip();
    return () => { cancelled = true; };
  }, [base64_data]);

  // 按文件名懒加载单个文件内容
  const handleFetchContent = useCallback(
    async (targetFilename: string) => {
      if (!zipCache) return;

      // 标记加载中
      setFilesWithContent((prev) =>
        prev.map((f) =>
          f.filename === targetFilename ? { ...f, loading: true } : f
        )
      );

      try {
        const file = zipCache.file(targetFilename);
        if (!file) throw new Error("ZIP 中未找到该文件");

        const content = await file.async("string");
        setFilesWithContent((prev) =>
          prev.map((f) =>
            f.filename === targetFilename ? { ...f, content, loading: false } : f
          )
        );
      } catch (e) {
        console.error(`[CodeExportPanel] 读取 ${targetFilename} 失败:`, e);
        setFilesWithContent((prev) =>
          prev.map((f) =>
            f.filename === targetFilename ? { ...f, loading: false, content: "" } : f
          )
        );
      }
    },
    [zipCache]
  );

  // 下载处理
  const handleDownload = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    setError(null);

    try {
      const bytes = base64ToUint8Array(base64_data);
      const blob = new Blob([bytes], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "generated_code.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err) {
      console.error("[CodeExportPanel] 下载失败:", err);
      setError(err instanceof Error ? err.message : String(err));
      setTimeout(() => setError(null), 5000);
    } finally {
      setDownloading(false);
    }
  }, [downloading, base64_data, filename]);

  const totalFiles = file_count ?? filesWithContent.length ?? 0;

  return (
    <div
      className={cn(
        "group mt-3 overflow-hidden rounded-xl border transition-all duration-300",
        "border-[#2F6868]/20 bg-gradient-to-r from-[#2F6868]/[0.06] via-[#1a9a8a]/[0.03] to-transparent",
        isExpanded ? "shadow-sm hover:border-[#2F6868]/35" : "hover:border-[#2F6868]/25"
      )}
    >
      {/* 标题栏 */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setIsExpanded((v) => !v);
        }}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left select-none"
      >
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[#2F6868] transition-transform duration-200",
            !isExpanded && "-rotate-90"
          )}
        />
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#2F6868]/15 to-[#0dd9b6]/10 text-[#2F6868] transition-all group-hover:from-[#2F6868]/25 group-hover:to-[#0dd9b6]/15">
          <FolderArchive size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            代码已打包
            <span className="ml-2 font-normal text-muted-foreground">
              ({totalFiles} 个文件)
            </span>
          </p>
          <p className="mt-0.5 truncate text-xs font-mono text-muted-foreground">
            {filename}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              aria-label="移除面板"
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
            </Button>
          )}

          {error ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 h-7 text-xs text-destructive"
              onClick={(e) => { e.stopPropagation(); setError(null); }}
            >
              重试
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              disabled={downloading}
              className={cn(
                "gap-1.5 h-7 text-xs font-medium transition-all duration-300",
                downloaded
                  ? "!text-emerald-600"
                  : "bg-gradient-to-r from-[#2F6868] to-[#1a9a8a] text-white border-0 shadow-sm hover:shadow-md hover:brightness-110 active:scale-[0.97]"
              )}
              onClick={(e) => { e.stopPropagation(); handleDownload(); }}
            >
              {downloaded ? (
                <><Check className="h-3.5 w-3.5" /> 已下载</>
              ) : downloading ? (
                "下载中..."
              ) : (
                <><Download className="h-3.5 w-3.5" /> 下载 ZIP</>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* 展开区域：文件列表 */}
      {isExpanded && (
        <div className="animate-message-in border-t border-border/40 px-3 pb-3 pt-2">
          {/* 文件列表摘要 */}
          <div className="mb-2 flex items-center gap-2 px-1 text-xs text-muted-foreground">
            <Code className="h-3.5 w-3.5" />
            <span>文件列表</span>
            <span className="ml-auto tabular-nums">共 {totalFiles} 个</span>
          </div>

          {/* 文件列表（可滚动） */}
          <div className="flex flex-col gap-1.5 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border">
            {filesWithContent.map((file, idx) => (
              <CodeFileItem
                key={`${file.filename}-${idx}`}
                file={file}
                onFetchContent={handleFetchContent}
              />
            ))}
          </div>

          {error && (
            <p className="mt-2 text-center text-xs text-destructive">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default CodeExportPanel;
