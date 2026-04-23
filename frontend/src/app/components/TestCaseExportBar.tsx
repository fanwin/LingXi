"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Download, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TestCaseExportBarProps {
  /** 工具调用的 result 字段，JSON 字符串: { file_path, base64_data, filename } */
  rawResult: string;
}

/**
 * 测试用例导出下载栏。
 *
 * 当 AI 调用 export_testcases_to_excel 工具完成后展示，
 * 解析工具返回的 JSON（含 base64 文件内容），通过 Blob 触发浏览器原生下载。
 * 设计风格与项目主色调（#2F6868）保持一致，卡片式布局 + 状态动效。
 */
export function TestCaseExportBar({ rawResult }: TestCaseExportBarProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = useMemo(() => {
    try {
      return JSON.parse(rawResult);
    } catch {
      // 兼容旧格式：纯路径字符串
      if (rawResult.trim()) {
        return { file_path: rawResult, base64_data: "", filename: "" };
      }
      return null;
    }
  }, [rawResult]);

  const fileName = parsed?.filename
    || parsed?.file_path?.split(/[/\\]/).pop()
    || "测试用例.xlsx";

  const hasBase64 = !!parsed?.base64_data;
  const filePath = parsed?.file_path || "";

  const handleDownload = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    setError(null);

    try {
      let blob: Blob;

      if (hasBase64 && parsed.base64_data) {
        // 方式1：base64 → Blob（推荐，无需后端文件接口）
        const binaryStr = atob(parsed.base64_data);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        blob = new Blob([bytes], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
      } else if (filePath) {
        // 方式2：fetch 远程/本地文件路径（降级方案）
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        blob = await response.blob();
      } else {
        throw new Error("无可用的文件数据");
      }

      // 触发浏览器原生下载
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err) {
      console.error("[TestCaseExportBar] 下载失败:", err);
      setError(err instanceof Error ? err.message : String(err));
      setTimeout(() => setError(null), 5000);
    } finally {
      setDownloading(false);
    }
  }, [downloading, hasBase64, parsed, fileName, filePath]);

  // 数据异常时不渲染
  if (!parsed || (!hasBase64 && !filePath)) return null;

  return (
    <div
      className={cn(
        "group mt-4 flex items-center gap-4 rounded-xl border px-5 py-3.5",
        "border-[#2F6868]/25 bg-gradient-to-r from-[#2F6868]/[0.06] to-[#2F6868]/[0.02]",
        "shadow-sm transition-all duration-300 hover:border-[#2F6868]/50 hover:shadow-md"
      )}
    >
      {/* 左侧：图标 + 信息 */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#2F6868]/10 text-[#2F6868] transition-colors group-hover:bg-[#2F6868]/15">
          <FileSpreadsheet size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            测试用例已导出
          </p>
          <p className="mt-0.5 truncate text-xs font-mono text-muted-foreground">
            {fileName}
          </p>
        </div>
      </div>

      {/* 右侧：操作按钮 */}
      <div className="ml-auto shrink-0">
        {error ? (
          /* 错误状态 */
          <Button
            variant="outline"
            size="sm"
            onClick={() => setError(null)}
            className="gap-1.5 border-destructive bg-red-50 text-destructive"
          >
            <AlertCircle size={16} />
            <span>重试</span>
          </Button>
        ) : (
          /* 正常 / 下载中 / 已完成 */
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={downloading}
            className={cn(
              "gap-1.5 border-[#2F6868] bg-white font-medium text-[#2F6868]",
              "transition-all duration-200 hover:bg-[#2F6868] hover:text-white",
              "active:scale-[0.97] disabled:opacity-60",
              downloaded &&
                "border-green-600 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 hover:border-green-600"
            )}
          >
            {downloaded ? (
              <>
                <CheckCircle2 size={16} />
                <span>已下载</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>{downloading ? "下载中..." : "下载"}</span>
              </>
            )}
          </Button>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <p className="absolute -bottom-6 left-0 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
