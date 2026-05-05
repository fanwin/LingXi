"use client";
// NOTE  MC80OmFIVnBZMlhvaklQb3RvVTZlbkl4Ymc9PTo1ODExNGZhYw==

import React, { useMemo, useState, useCallback } from "react";
import { SubAgentIndicator } from "@/app/components/SubAgentIndicator";
import { ToolCallBox } from "@/app/components/ToolCallBox";
import { MarkdownContent } from "@/app/components/MarkdownContent";
import { MultimodalPreview } from "@/app/components/MultimodalPreview";
import { TestCaseExportBar } from "@/app/components/TestCaseExportBar";
import type {
  SubAgent,
  ToolCall,
  ActionRequest,
  ReviewConfig,
} from "@/app/types/types";
import { Message } from "@langchain/langgraph-sdk";
import { ContentBlock } from "@langchain/core/messages";
import {
  extractSubAgentContent,
  extractStringFromMessageContent,
} from "@/app/utils/utils";
import { cn } from "@/lib/utils";
import { Copy, Pencil, Check, RefreshCw } from "lucide-react";

/** image_url block as sent to OpenAI-compatible APIs (e.g. Doubao) */
interface ImageUrlBlock {
  type: "image_url";
  image_url: { url: string };
}

/** Returns true for image_url blocks stored in message.content */
function isImageUrlBlock(block: unknown): block is ImageUrlBlock {
  if (typeof block !== "object" || block === null || !("type" in block))
    return false;
  const b = block as { type: unknown; image_url?: unknown };
  return (
    b.type === "image_url" &&
    typeof b.image_url === "object" &&
    b.image_url !== null &&
    "url" in (b.image_url as object) &&
    typeof (b.image_url as { url: unknown }).url === "string"
  );
}

/** Returns true for document blocks (PDF or Word) in additional_kwargs.attachments */
function isMultimodalBlock(
  block: unknown
): block is ContentBlock.Multimodal.Data {
  if (typeof block !== "object" || block === null || !("type" in block))
    return false;
  const b = block as { type: unknown; mimeType?: unknown };
  return (
    b.type === "file" &&
    typeof b.mimeType === "string" &&
    (
      b.mimeType === "application/pdf" ||
      b.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      b.mimeType === "application/msword"
    )
  );
}
// FIXME  MS80OmFIVnBZMlhvaklQb3RvVTZlbkl4Ymc9PTo1ODExNGZhYw==

interface ChatMessageProps {
  message: Message;
  toolCalls: ToolCall[];
  isLoading?: boolean;
  isStreaming?: boolean;
  actionRequestsMap?: Map<string, ActionRequest>;
  reviewConfigsMap?: Map<string, ReviewConfig>;
  ui?: any[];
  stream?: any;
  onResumeInterrupt?: (value: any) => void;
  graphId?: string;
  onEdit?: (content: string) => void;
  onRegenerate?: () => void;
}

function areToolCallsEqual(prevToolCalls: ToolCall[], nextToolCalls: ToolCall[]) {
  if (prevToolCalls === nextToolCalls) return true;
  if (prevToolCalls.length !== nextToolCalls.length) return false;

  return prevToolCalls.every((toolCall, index) => {
    const nextToolCall = nextToolCalls[index];
    return (
      toolCall.id === nextToolCall.id &&
      toolCall.name === nextToolCall.name &&
      toolCall.status === nextToolCall.status &&
      toolCall.result === nextToolCall.result &&
      toolCall.args === nextToolCall.args
    );
  });
}
// NOTE  Mi80OmFIVnBZMlhvaklQb3RvVTZlbkl4Ymc9PTo1ODExNGZhYw==

function areUiEntriesEqual(prevUi?: any[], nextUi?: any[]) {
  if (prevUi === nextUi) return true;
  if (!prevUi || !nextUi) return prevUi === nextUi;
  if (prevUi.length !== nextUi.length) return false;

  return prevUi.every((entry, index) => entry === nextUi[index]);
}

export const ChatMessage = React.memo<ChatMessageProps>(
  ({
    message,
    toolCalls,
    isLoading,
    isStreaming,
    actionRequestsMap,
    reviewConfigsMap,
    ui,
    stream,
    onResumeInterrupt,
    graphId,
    onEdit,
    onRegenerate,
  }) => {
    const isUser = message.type === "human";
    const isAi = message.type === "ai";
    const messageContent = extractStringFromMessageContent(message);
    const hasContent = messageContent && messageContent.trim() !== "";
    const hasToolCalls = toolCalls.length > 0;
    const isStreamingMessage = isAi && isStreaming === true;

    const [copied, setCopied] = useState(false);

    const subAgents = useMemo(
      () =>
        toolCalls
          .filter(
            (tc: ToolCall) =>
              tc.name === "task" &&
              tc.args["subagent_type"] &&
              tc.args["subagent_type"] !== "" &&
              tc.args["subagent_type"] !== null
          )
          .map((tc: ToolCall) => ({
            id: tc.id,
            name: tc.name,
            subAgentName: (tc.args as Record<string, unknown>)["subagent_type"] as string,
            input: tc.args,
            output: tc.result ? { result: tc.result } : undefined,
            status: tc.status,
          } as SubAgent)),
      [toolCalls]
    );

    const [expandedSubAgents, setExpandedSubAgents] = useState<Record<string, boolean>>({});
    const isSubAgentExpanded = useCallback(
      (id: string) => expandedSubAgents[id] ?? true,
      [expandedSubAgents]
    );
    const toggleSubAgent = useCallback((id: string) => {
      setExpandedSubAgents((prev) => ({
        ...prev,
        [id]: prev[id] === undefined ? false : !prev[id],
      }));
    }, []);

    // Images: image_url blocks in message.content (sent directly to LLM)
    const imageUrlBlocks = Array.isArray(message.content)
      ? (message.content as unknown[]).filter(isImageUrlBlock)
      : [];

    // PDFs: in additional_kwargs.attachments (backend parses them)
    const rawAttachments = (message.additional_kwargs as Record<string, unknown>)?.attachments;
    const pdfBlocks = Array.isArray(rawAttachments)
      ? (rawAttachments as unknown[]).reduce<ContentBlock.Multimodal.Data[]>(
          (acc, b) => { if (isMultimodalBlock(b)) acc.push(b); return acc; },
          []
        )
      : [];

    const hasAttachments = imageUrlBlocks.length > 0 || pdfBlocks.length > 0;

    // 检测是否存在已完成的 Excel 导出工具调用
    const exportToolCall = useMemo(
      () =>
        toolCalls.find(
          (tc: ToolCall) =>
            tc.name === "export_testcases_to_excel" &&
            tc.status === "completed" &&
            typeof tc.result === "string" &&
            tc.result.trim() !== ""
        ),
      [toolCalls]
    );

    return (
      <div
        className={cn("flex w-full max-w-full overflow-x-hidden", isUser && "flex-row-reverse")}
        style={{ contentVisibility: "auto", containIntrinsicSize: "200px" }}
      >
        <div className={cn("min-w-0 max-w-full", isUser ? "max-w-[70%]" : "w-full")}>
          {isUser ? (
            /* ── Human message: images + PDFs + text ── */
            <div className="group mt-4 flex flex-col items-end gap-2">
              {hasAttachments && (
                <div className="flex flex-wrap justify-end gap-2">
                  {/* Images: rendered from data URL directly */}
                  {imageUrlBlocks.map((block, idx) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={`img-${idx}`}
                      src={block.image_url.url}
                      alt={`uploaded image ${idx + 1}`}
                      className="h-16 w-16 rounded-md object-cover"
                    />
                  ))}
                  {/* PDFs: rendered via MultimodalPreview */}
                  {pdfBlocks.map((block, idx) => (
                    <MultimodalPreview key={`pdf-${idx}`} block={block} size="md" />
                  ))}
                </div>
              )}
              {hasContent && (
                <div
                  className="overflow-hidden break-words rounded-xl rounded-br-none border border-border px-3 py-2 text-sm font-normal leading-[150%] text-foreground"
                  style={{ backgroundColor: "var(--color-user-message-bg)" }}
                >
                  <p className="m-0 whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {messageContent}
                  </p>
                </div>
              )}
              {(hasContent || hasAttachments) && (
                <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => {
                      if (messageContent) {
                        navigator.clipboard.writeText(messageContent);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1000);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-1 text-xs transition-colors",
                      copied
                        ? "text-success"
                        : "text-muted-foreground hover:text-primary"
                    )}
                    title={copied ? "已复制" : "复制"}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copied ? "已复制" : "复制"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (messageContent && onEdit) {
                        onEdit(messageContent);
                      }
                    }}
                    className="text-muted-foreground hover:text-primary flex items-center gap-1 text-xs"
                    title="编辑"
                  >
                    <Pencil size={12} />
                    <span>编辑</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ── AI message ── */
            hasContent && (
              <div className="group relative">
                <div className="mt-4 overflow-hidden break-words text-sm font-normal leading-[150%] text-primary">
                  <MarkdownContent
                    content={messageContent}
                    streaming={isStreamingMessage}
                  />
                  {/* 测试用例导出下载栏：工具完成后才展示 */}
                  {exportToolCall && (
                    <TestCaseExportBar rawResult={exportToolCall.result} />
                  )}
                </div>
                {!isStreamingMessage && (
                  <div className="mt-1 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => {
                        if (messageContent) {
                          navigator.clipboard.writeText(messageContent);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1000);
                        }
                      }}
                      className={cn(
                        "flex items-center gap-1 text-xs transition-colors",
                        copied
                          ? "text-success"
                          : "text-muted-foreground hover:text-primary"
                      )}
                      title={copied ? "已复制" : "复制"}
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copied ? "已复制" : "复制"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRegenerate?.()}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                      title="重新生成"
                    >
                      <RefreshCw size={12} />
                      <span>重新生成</span>
                    </button>
                  </div>
                )}
              </div>
            )
          )}
          {hasToolCalls && (
            <div className="mt-4 flex w-full flex-col">
              {toolCalls.map((toolCall: ToolCall) => {
                if (toolCall.name === "task") return null;
                const toolCallGenUiComponent =
                  ui && ui.length > 0
                    ? ui.find((u) => u.metadata?.tool_call_id === toolCall.id)
                    : undefined;
                const actionRequest = actionRequestsMap?.get(toolCall.name);
                const reviewConfig = reviewConfigsMap?.get(toolCall.name);
                return (
                  <ToolCallBox
                    key={toolCall.id}
                    toolCall={toolCall}
                    uiComponent={toolCallGenUiComponent}
                    stream={stream}
                    graphId={graphId}
                    actionRequest={actionRequest}
                    reviewConfig={reviewConfig}
                    onResume={onResumeInterrupt}
                    isLoading={isLoading}
                  />
                );
              })}
            </div>
          )}
          {!isUser && subAgents.length > 0 && (
            <div className="flex w-fit max-w-full flex-col gap-4">
              {subAgents.map((subAgent) => (
                <div key={subAgent.id} className="flex w-full flex-col gap-2">
                  <div className="flex items-end gap-2">
                    <div className="w-[calc(100%-100px)]">
                      <SubAgentIndicator
                        subAgent={subAgent}
                        onClick={() => toggleSubAgent(subAgent.id)}
                        isExpanded={isSubAgentExpanded(subAgent.id)}
                      />
                    </div>
                  </div>
                  {isSubAgentExpanded(subAgent.id) && (
                    <div className="w-full max-w-full">
                      <div className="bg-surface border-border-light rounded-md border p-4">
                        <h4 className="text-primary/70 mb-2 text-xs font-semibold uppercase tracking-wider">
                          输入
                        </h4>
                        <div className="mb-4">
                          <MarkdownContent content={extractSubAgentContent(subAgent.input)} />
                        </div>
                        {subAgent.output && (
                          <>
                            <h4 className="text-primary/70 mb-2 text-xs font-semibold uppercase tracking-wider">
                              输出
                            </h4>
                            <MarkdownContent content={extractSubAgentContent(subAgent.output)} />
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    const isSameMessage = prevProps.message === nextProps.message;
    const isSameToolCalls = areToolCallsEqual(
      prevProps.toolCalls,
      nextProps.toolCalls
    );
    const isSameUi = areUiEntriesEqual(prevProps.ui, nextProps.ui);
    const isSameInterruptMaps =
      prevProps.actionRequestsMap === nextProps.actionRequestsMap &&
      prevProps.reviewConfigsMap === nextProps.reviewConfigsMap;

    const isSameLastMessageState =
      prevProps.stream === nextProps.stream &&
      prevProps.onResumeInterrupt === nextProps.onResumeInterrupt &&
      prevProps.graphId === nextProps.graphId &&
      prevProps.isLoading === nextProps.isLoading &&
      prevProps.isStreaming === nextProps.isStreaming;

    return (
      isSameMessage &&
      isSameToolCalls &&
      isSameUi &&
      isSameInterruptMaps &&
      isSameLastMessageState
    );
  }
);
// TODO  My80OmFIVnBZMlhvaklQb3RvVTZlbkl4Ymc9PTo1ODExNGZhYw==

ChatMessage.displayName = "ChatMessage";

