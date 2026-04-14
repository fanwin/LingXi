"use client";
// NOTE  MC80OmFIVnBZMlhvaklQb3RvVTZlbkl4Ymc9PTo1ODExNGZhYw==

import React, { useMemo, useState, useCallback } from "react";
import { SubAgentIndicator } from "@/app/components/SubAgentIndicator";
import { ToolCallBox } from "@/app/components/ToolCallBox";
import { MarkdownContent } from "@/app/components/MarkdownContent";
import { MultimodalPreview } from "@/app/components/MultimodalPreview";
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

/** Returns true for PDF blocks in additional_kwargs.attachments */
function isMultimodalBlock(
  block: unknown
): block is ContentBlock.Multimodal.Data {
  if (typeof block !== "object" || block === null || !("type" in block))
    return false;
  const b = block as { type: unknown; mimeType?: unknown };
  return (
    b.type === "file" &&
    typeof b.mimeType === "string" &&
    b.mimeType === "application/pdf"
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
  }) => {
    const isUser = message.type === "human";
    const isAi = message.type === "ai";
    const messageContent = extractStringFromMessageContent(message);
    const hasContent = messageContent && messageContent.trim() !== "";
    const hasToolCalls = toolCalls.length > 0;
    const isStreamingMessage = isAi && isStreaming === true;

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

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(messageContent);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    };

    return (
      <div
        className={cn("flex w-full max-w-full overflow-x-hidden", isUser && "flex-row-reverse")}
        style={{ contentVisibility: "auto", containIntrinsicSize: "200px" }}
      >
        <div className={cn("min-w-0 max-w-full group", isUser ? "max-w-[70%]" : "w-full")}>
          {isUser ? (
            /* ── Human message: images + PDFs + text ── */
            <div className="mt-4 flex flex-col items-end gap-2">
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
                <div className="relative">
                  <div
                    className="overflow-hidden break-words rounded-xl rounded-br-none border border-border px-3 py-2 text-sm font-normal leading-[150%] text-foreground"
                    style={{ backgroundColor: "var(--color-user-message-bg)" }}
                  >
                    <p className="m-0 whitespace-pre-wrap break-words text-sm leading-relaxed">
                      {messageContent}
                    </p>
                  </div>
                  {/* Copy button */}
                  <button
                    onClick={handleCopy}
                    className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent"
                    title="复制内容"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ── AI message ── */
            hasContent && (
              <div className="relative mt-4 flex items-start gap-2">
                <div className={cn("relative flex-1", isStreamingMessage && "opacity-80")}>
                  <div className="overflow-hidden break-words text-sm font-normal leading-[150%] text-primary">
                    <MarkdownContent
                      content={messageContent}
                      streaming={isStreamingMessage}
                    />
                  </div>
                </div>
                {/* Copy button for AI message */}
                {!isStreamingMessage && (
                  <button
                    onClick={handleCopy}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-accent mt-1"
                    title="复制内容"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  </button>
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
            <div className="mt-4 flex w-fit max-w-full flex-col gap-3">
              {subAgents.map((subAgent) => (
                <div key={subAgent.id} className="flex w-full flex-col gap-2.5 animate-slideInUp">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <SubAgentIndicator
                        subAgent={subAgent}
                        onClick={() => toggleSubAgent(subAgent.id)}
                        isExpanded={isSubAgentExpanded(subAgent.id)}
                      />
                    </div>
                  </div>
                  {isSubAgentExpanded(subAgent.id) && (
                    <div
                      className="w-full max-w-full overflow-hidden rounded-xl transition-all duration-300"
                      style={{
                        background: 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-hover) 100%)',
                        border: '1px solid var(--color-border-light)',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <div className="p-5">
                        <h4
                          className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                          style={{ color: 'var(--color-primary)' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 19V6M5 12l7-7 7 7"/>
                          </svg>
                          输入参数
                        </h4>
                        <div className="mb-5 pl-1">
                          <MarkdownContent content={extractSubAgentContent(subAgent.input)} />
                        </div>
                        {subAgent.output && (
                          <>
                            <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, var(--color-border), transparent)' }} className="my-4" />
                            <h4
                              className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                              style={{ color: 'var(--color-success)' }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 6L9 17l-5-5"/>
                              </svg>
                              执行结果
                            </h4>
                            <div className="pl-1">
                              <MarkdownContent content={extractSubAgentContent(subAgent.output)} />
                            </div>
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

