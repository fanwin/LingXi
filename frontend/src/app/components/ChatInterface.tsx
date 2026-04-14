"use client";
// @ts-expect-error  MC80OmFIVnBZMlhvaklQb3RvVTZXa3RPY2c9PToxZjlmNGZiOA==

import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
  FormEvent,
  Fragment,
} from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Square,
  ArrowUp,
  CheckCircle,
  Clock,
  Circle,
  FileIcon,
  Plus,
} from "lucide-react";
import { ChatMessage } from "@/app/components/ChatMessage";
import type {
  TodoItem,
  ToolCall,
  ActionRequest,
  ReviewConfig,
} from "@/app/types/types";
import { Assistant, Message } from "@langchain/langgraph-sdk";
import { extractStringFromMessageContent } from "@/app/utils/utils";
import { useChatContext } from "@/providers/ChatProvider";
import { cn } from "@/lib/utils";
import { useStickToBottom } from "use-stick-to-bottom";
import { FilesPopover } from "@/app/components/TasksFilesSidebar";
import { useFileUpload } from "@/app/hooks/useFileUpload";
import { ContentBlocksPreview } from "@/app/components/ContentBlocksPreview";
import { Label } from "@/components/ui/label";

interface ChatInterfaceProps {
  assistant: Assistant | null;
}
// @ts-expect-error  MS80OmFIVnBZMlhvaklQb3RvVTZXa3RPY2c9PToxZjlmNGZiOA==

const getStatusIcon = (status: TodoItem["status"], className?: string) => {
  switch (status) {
    case "completed":
      return (
        <CheckCircle
          size={16}
          className={cn("text-success/80", className)}
        />
      );
    case "in_progress":
      return (
        <Clock
          size={16}
          className={cn("text-warning/80", className)}
        />
      );
    default:
      return (
        <Circle
          size={16}
          className={cn("text-tertiary/70", className)}
        />
      );
  }
};
// FIXME  Mi80OmFIVnBZMlhvaklQb3RvVTZXa3RPY2c9PToxZjlmNGZiOA==

export const ChatInterface = React.memo<ChatInterfaceProps>(({ assistant }) => {
  const [metaOpen, setMetaOpen] = useState<"tasks" | "files" | null>(null);
  const tasksContainerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [input, setInput] = useState("");
  const [enableRag, setEnableRag] = useState(false);
  const { scrollRef, contentRef } = useStickToBottom();
  const {
    contentBlocks,
    setContentBlocks,
    handleFileUpload,
    dropRef,
    removeBlock,
    resetBlocks,
    dragOver,
    handlePaste,
  } = useFileUpload();

  const {
    stream,
    messages,
    todos,
    files,
    ui,
    setFiles,
    isLoading,
    isThreadLoading,
    interrupt,
    sendMessage,
    stopStream,
    resumeInterrupt,
  } = useChatContext();

  const submitDisabled = isLoading || !assistant;

  const handleSubmit = useCallback(
    (e?: FormEvent) => {
      if (e) {
        e.preventDefault();
      }
      const messageText = input.trim();
      if (
        (!messageText && contentBlocks.length === 0) ||
        isLoading ||
        submitDisabled
      )
        return;
      sendMessage(messageText, contentBlocks, { enable_rag: enableRag });
      setInput("");
      resetBlocks();
    },
    [input, contentBlocks, isLoading, sendMessage, submitDisabled, enableRag]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (submitDisabled) return;
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit, submitDisabled]
  );

  // TODO: can we make this part of the hook?
  const messageUiMap = useMemo(() => {
    const nextMap = new Map<string, any[]>();

    if (!ui) {
      return nextMap;
    }

    ui.forEach((item: any) => {
      const messageId = item.metadata?.message_id;
      if (!messageId) {
        return;
      }

      const existing = nextMap.get(messageId);
      if (existing) {
        existing.push(item);
      } else {
        nextMap.set(messageId, [item]);
      }
    });

    return nextMap;
  }, [ui]);

  const processedMessages = useMemo(() => {
    const messageMap = new Map<
      string,
      { message: Message; toolCalls: ToolCall[] }
    >();

    messages.forEach((message: Message) => {
      if (message.type === "ai") {
        const toolCallsInMessage: Array<{
          id?: string;
          function?: { name?: string; arguments?: unknown };
          name?: string;
          type?: string;
          args?: unknown;
          input?: unknown;
        }> = [];

        if (
          message.additional_kwargs?.tool_calls &&
          Array.isArray(message.additional_kwargs.tool_calls)
        ) {
          toolCallsInMessage.push(...message.additional_kwargs.tool_calls);
        } else if (message.tool_calls && Array.isArray(message.tool_calls)) {
          toolCallsInMessage.push(
            ...message.tool_calls.filter(
              (toolCall: { name?: string }) => toolCall.name !== ""
            )
          );
        } else if (Array.isArray(message.content)) {
          const toolUseBlocks = message.content.filter(
            (block: { type?: string }) => block.type === "tool_use"
          );
          toolCallsInMessage.push(...toolUseBlocks);
        }

        const toolCallsWithStatus = toolCallsInMessage.map(
          (toolCall: {
            id?: string;
            function?: { name?: string; arguments?: unknown };
            name?: string;
            type?: string;
            args?: unknown;
            input?: unknown;
          }) => {
            const name =
              toolCall.function?.name ||
              toolCall.name ||
              toolCall.type ||
              "unknown";
            const args =
              toolCall.function?.arguments ||
              toolCall.args ||
              toolCall.input ||
              {};
            return {
              id: toolCall.id || `tool-${Math.random()}`,
              name,
              args,
              status: interrupt ? "interrupted" : ("pending" as const),
            } as ToolCall;
          }
        );

        messageMap.set(message.id!, {
          message,
          toolCalls: toolCallsWithStatus,
        });
      } else if (message.type === "tool") {
        const toolCallId = message.tool_call_id;
        if (!toolCallId) {
          return;
        }

        for (const [, data] of messageMap.entries()) {
          const toolCallIndex = data.toolCalls.findIndex(
            (tc: ToolCall) => tc.id === toolCallId
          );
          if (toolCallIndex === -1) {
            continue;
          }

          data.toolCalls[toolCallIndex] = {
            ...data.toolCalls[toolCallIndex],
            status: "completed" as const,
            result: extractStringFromMessageContent(message),
          };
          break;
        }
      } else if (message.type === "human") {
        messageMap.set(message.id!, {
          message,
          toolCalls: [],
        });
      }
    });

    const processedArray = Array.from(messageMap.values());
    return processedArray.map((data, index) => {
      const prevMessage = index > 0 ? processedArray[index - 1].message : null;
      return {
        ...data,
        showAvatar: data.message.type !== prevMessage?.type,
      };
    });
  }, [messages, interrupt]);

  const groupedTodos = {
    in_progress: todos.filter((t) => t.status === "in_progress"),
    pending: todos.filter((t) => t.status === "pending"),
    completed: todos.filter((t) => t.status === "completed"),
  };

  const hasTasks = todos.length > 0;
  const hasFiles = Object.keys(files).length > 0;

  // Parse out any action requests or review configs from the interrupt
  const actionRequestsMap: Map<string, ActionRequest> | null = useMemo(() => {
    const actionRequests =
      interrupt?.value && (interrupt.value as any)["action_requests"];
    if (!actionRequests) return new Map<string, ActionRequest>();
    return new Map(actionRequests.map((ar: ActionRequest) => [ar.name, ar]));
  }, [interrupt]);

  const reviewConfigsMap: Map<string, ReviewConfig> | null = useMemo(() => {
    const reviewConfigs =
      interrupt?.value && (interrupt.value as any)["review_configs"];
    if (!reviewConfigs) return new Map<string, ReviewConfig>();
    return new Map(
      reviewConfigs.map((rc: ReviewConfig) => [rc.actionName, rc])
    );
  }, [interrupt]);

  const lastMessageId = processedMessages.at(-1)?.message.id;

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const frameId = window.requestAnimationFrame(() => {
      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior: isLoading ? "auto" : "smooth",
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [lastMessageId, processedMessages.length, isLoading, scrollRef]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* 消息列表区域 */}
      <div
        className="scrollbar-pretty flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
        ref={scrollRef}
      >
        <div
          className="mx-auto w-full max-w-[1024px] px-6 pb-8 pt-5"
          ref={contentRef}
        >
          {isThreadLoading ? (
            /* 加载状态 */
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4 animate-fadeIn">
              <div className="relative">
                <div className="h-14 w-14 rounded-2xl" style={{ background: 'var(--color-primary-gradient)', opacity: 0.15 }}></div>
                <div className="absolute inset-0 m-auto h-10 w-10 animate-spin rounded-xl" style={{
                  background: 'conic-gradient(from 0deg, transparent 0%, var(--color-primary) 100%)',
                  WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px))',
                  mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px))'
                }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>加载对话中...</p>
            </div>
          ) : (
            <>
              {processedMessages.map((data, index) => {
                const messageUi = messageUiMap.get(data.message.id ?? "");
                const isLastMessage = index === processedMessages.length - 1;
                return (
                  <div key={data.message.id} className="animate-fadeIn mb-2" style={{ animationFillMode: 'both' }}>
                    <ChatMessage
                      message={data.message}
                      toolCalls={data.toolCalls}
                      isLoading={isLoading}
                      isStreaming={isLastMessage && isLoading}
                      actionRequestsMap={
                        isLastMessage ? actionRequestsMap : undefined
                      }
                      reviewConfigsMap={
                        isLastMessage ? reviewConfigsMap : undefined
                      }
                      ui={messageUi}
                      stream={isLastMessage ? stream : undefined}
                      onResumeInterrupt={
                        isLastMessage ? resumeInterrupt : undefined
                      }
                      graphId={isLastMessage ? assistant?.graph_id : undefined}
                    />
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* 现代化输入区域 */}
      <div
        className="flex-shrink-0 px-4 pb-5 pt-2"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, var(--color-background) 30%)'
        }}
      >
        <div
          ref={dropRef}
          className={cn(
            "mx-auto w-full max-w-[1024px] overflow-hidden rounded-xl transition-all duration-200",
            dragOver ? "border-dashed border-2 shadow-md" : "",
          )}
          style={{
            background: 'var(--color-surface)',
            border: `1px solid ${dragOver ? 'var(--color-primary)' : 'var(--color-border)'}`,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {(hasTasks || hasFiles) && (
            <div
              className="flex max-h-72 flex-col overflow-y-auto empty:hidden"
              style={{
                borderBottom: '1px solid var(--color-border-light)',
                background: 'linear-gradient(135deg, var(--color-surface-hover) 0%, var(--color-surface) 100%)'
              }}
            >
              {!metaOpen && (
                <>
                  {(() => {
                    const activeTask = todos.find(
                      (t) => t.status === "in_progress"
                    );

                    const totalTasks = todos.length;
                    const remainingTasks =
                      totalTasks - groupedTodos.pending.length;
                    const isCompleted = totalTasks === remainingTasks;

                    const tasksTrigger = (() => {
                      if (!hasTasks) return null;
                      return (
                        <button
                          type="button"
                          onClick={() =>
                            setMetaOpen((prev) =>
                              prev === "tasks" ? null : "tasks"
                            )
                          }
                          className="grid w-full cursor-pointer grid-cols-[auto_auto_1fr] items-center gap-3 px-[18px] py-3 text-left"
                          aria-expanded={metaOpen === "tasks"}
                        >
                          {(() => {
                            if (isCompleted) {
                              return [
                                <CheckCircle
                                  key="icon"
                                  size={16}
                                  className="text-success/80"
                                />,
                                <span
                                  key="label"
                                  className="ml-[1px] min-w-0 truncate text-sm"
                                >
                                  所有任务已完成
                                </span>,
                              ];
                            }

                            if (activeTask != null) {
                              return [
                                <div key="icon">
                                  {getStatusIcon(activeTask.status)}
                                </div>,
                                <span
                                  key="label"
                                  className="ml-[1px] min-w-0 truncate text-sm"
                                >
                                  任务{" "}
                                  {totalTasks - groupedTodos.pending.length} / {" "}
                                  {totalTasks}
                                </span>,
                                <span
                                  key="content"
                                  className="min-w-0 gap-2 truncate text-sm text-muted-foreground"
                                >
                                  {activeTask.content}
                                </span>,
                              ];
                            }

                            return [
                              <Circle
                                key="icon"
                                size={16}
                                className="text-tertiary/70"
                              />,
                              <span
                                key="label"
                                className="ml-[1px] min-w-0 truncate text-sm"
                              >
                                任务 {totalTasks - groupedTodos.pending.length}{" "}
                                / {totalTasks}
                              </span>,
                            ];
                          })()}
                        </button>
                      );
                    })();

                    const filesTrigger = (() => {
                      if (!hasFiles) return null;
                      return (
                        <button
                          type="button"
                          onClick={() =>
                            setMetaOpen((prev) =>
                              prev === "files" ? null : "files"
                            )
                          }
                          className="flex flex-shrink-0 cursor-pointer items-center gap-2 px-[18px] py-3 text-left text-sm"
                          aria-expanded={metaOpen === "files"}
                        >
                          <FileIcon size={16} />
                          文件 (状态)
                          <span className="h-4 min-w-4 rounded-full bg-[#2F6868] px-0.5 text-center text-[10px] leading-[16px] text-white">
                            {Object.keys(files).length}
                          </span>
                        </button>
                      );
                    })();

                    return (
                      <div className="grid grid-cols-[1fr_auto_auto] items-center">
                        {tasksTrigger}
                        {filesTrigger}
                      </div>
                    );
                  })()}
                </>
              )}

              {metaOpen && (
                <>
                  <div className="sticky top-0 flex items-stretch bg-sidebar text-sm">
                    {hasTasks && (
                      <button
                        type="button"
                        className="py-3 pr-4 first:pl-[18px] aria-expanded:font-semibold"
                        onClick={() =>
                          setMetaOpen((prev) =>
                            prev === "tasks" ? null : "tasks"
                          )
                        }
                        aria-expanded={metaOpen === "tasks"}
                      >
                        任务
                      </button>
                    )}
                    {hasFiles && (
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 py-3 pr-4 first:pl-[18px] aria-expanded:font-semibold"
                        onClick={() =>
                          setMetaOpen((prev) =>
                            prev === "files" ? null : "files"
                          )
                        }
                        aria-expanded={metaOpen === "files"}
                      >
                        文件 (状态)
                        <span className="h-4 min-w-4 rounded-full bg-[#2F6868] px-0.5 text-center text-[10px] leading-[16px] text-white">
                          {Object.keys(files).length}
                        </span>
                      </button>
                    )}
                    <button
                      aria-label="Close"
                      className="flex-1"
                      onClick={() => setMetaOpen(null)}
                    />
                  </div>
                  <div
                    ref={tasksContainerRef}
                    className="px-[18px]"
                  >
                    {metaOpen === "tasks" &&
                      Object.entries(groupedTodos)
                        .filter(([_, todos]) => todos.length > 0)
                        .map(([status, todos]) => (
                          <div
                            key={status}
                            className="mb-4"
                          >
                            <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-tertiary">
                              {
                                {
                                  pending: "待处理",
                                  in_progress: "进行中",
                                  completed: "已完成",
                                }[status]
                              }
                            </h3>
                            <div className="grid grid-cols-[auto_1fr] gap-3 rounded-sm p-1 pl-0 text-sm">
                              {todos.map((todo, index) => (
                                <Fragment key={`${status}_${todo.id}_${index}`}>
                                  {getStatusIcon(todo.status, "mt-0.5")}
                                  <span className="break-words text-inherit">
                                    {todo.content}
                                  </span>
                                </Fragment>
                              ))}
                            </div>
                          </div>
                        ))}

                    {metaOpen === "files" && (
                      <div className="mb-6">
                        <FilesPopover
                          files={files}
                          setFiles={setFiles}
                          editDisabled={
                            isLoading === true || interrupt !== undefined
                          }
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col"
          >
            <ContentBlocksPreview
              blocks={contentBlocks}
              onRemove={removeBlock}
            />
            {/* 现代化输入框 */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={isLoading ? "AI 正在思考中..." : "输入您的消息... (Enter 发送, Shift+Enter 换行)"}
                className="field-sizing-content w-full resize-none border-0 bg-transparent px-[22px] pb-[15px] pt-[16px] text-sm leading-7 outline-none placeholder:text-muted-foreground"
                style={{ color: 'var(--color-text-primary)', minHeight: '52px', maxHeight: '200px' }}
                rows={1}
              />
            </div>

            {/* 底部工具栏 - 更精致的布局 */}
            <div
              className="flex items-center justify-between gap-3 px-4 py-3"
              style={{
                borderTop: '1px solid var(--color-border-light)',
                background: 'linear-gradient(180deg, transparent 0%, var(--color-surface-hover) 100%)',
                borderRadius: '0 0 1rem 1rem'
              }}
            >
              <div className="flex items-center gap-5">
                {/* 上传按钮 */}
                <Label
                  htmlFor="file-input"
                  className="group flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 group-hover:scale-110"
                    style={{
                      background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.08) 0%, rgba(6, 182, 212, 0.06) 100%)',
                      color: 'var(--color-primary)'
                    }}
                  >
                    <Plus size={18} strokeWidth={2} />
                  </div>
                  <span className="hidden sm:inline">上传文件</span>
                </Label>
                <input
                  id="file-input"
                  type="file"
                  onChange={handleFileUpload}
                  multiple
                  accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                  className="hidden"
                />

                {/* RAG 开关 */}
                <div className="flex items-center gap-2.5">
                  <Switch
                    id="rag-switch"
                    checked={enableRag}
                    onCheckedChange={setEnableRag}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor="rag-switch"
                    className="cursor-pointer text-sm font-medium transition-colors duration-200"
                    style={{ color: enableRag ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}
                  >
                    RAG 检索
                  </Label>
                </div>
              </div>

              {/* 发送按钮 */}
              <Button
                type={isLoading ? "button" : "submit"}
                variant={isLoading ? "destructive" : "default"}
                onClick={isLoading ? stopStream : handleSubmit}
                disabled={
                  !isLoading &&
                  (submitDisabled ||
                    (!input.trim() && contentBlocks.length === 0))
                }
                className="gap-2 rounded-lg px-5 font-medium transition-all duration-200 disabled:opacity-40"
                style={!isLoading ?
                  {
                    background: input.trim() || contentBlocks.length > 0
                      ? 'var(--color-primary)'
                      : 'var(--color-surface-hover)',
                    color: (input.trim() || contentBlocks.length > 0) ? 'white' : 'var(--color-text-tertiary)',
                    border: 'none'
                  } :
                  { background: '#dc2626' }
                }
              >
                {isLoading ? (
                  <>
                    <div className="relative h-4 w-4">
                      <div className="absolute inset-0 animate-ping opacity-75">
                        <Square size={14} fill="white" />
                      </div>
                      <Square size={14} fill="white" className="relative" />
                    </div>
                    <span>停止生成</span>
                  </>
                ) : (
                  <>
                    <ArrowUp size={18} className="transition-transform group-hover:-translate-y-0.5" />
                    <span>发送</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});

ChatInterface.displayName = "ChatInterface";
// @ts-expect-error  My80OmFIVnBZMlhvaklQb3RvVTZXa3RPY2c9PToxZjlmNGZiOA==
