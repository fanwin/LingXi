"use client";
// NOTE  MC80OmFIVnBZMlhvaklQb3RvVTZXa3RPY2c9PToxZjlmNGZiOA==

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
// NOTE  MS80OmFIVnBZMlhvaklQb3RvVTZXa3RPY2c9PToxZjlmNGZiOA==

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
  const { scrollRef, contentRef, stopScroll, scrollToBottom } = useStickToBottom();
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

  const handleEditMessage = useCallback((content: string) => {
    setInput(content);
    textareaRef.current?.focus();
  }, []);

  const handleRegenerate = useCallback(
    (message: Message) => {
      if (isLoading) return;

      const metadata = stream.getMessagesMetadata?.(message);
      const parentCheckpoint = metadata?.firstSeenState?.parent_checkpoint;

      if (parentCheckpoint) {
        stream.submit(undefined, {
          checkpoint: parentCheckpoint,
          config: { ...(assistant?.config ?? {}), recursion_limit: 1000 },
        });
      }
    },
    [isLoading, stream, assistant]
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

  // ── 历史会话加载：骨架屏 + 防止逐轮刷新 ────────────────
  // 终极方案：
  //   批量加载期间 → 显示骨架屏，真实内容已渲染但 opacity:0 隐藏
  //   稳定后      → 先 scroll 到底部，再 fade-in 显示 → 用户直接看到底部内容
  const [isInitialRenderDone, setIsInitialRenderDone] = useState(false);
  const [showContent, setShowContent] = useState(true);

  const msgCount = processedMessages.length;
  const settleTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (msgCount === 0) {
      setIsInitialRenderDone(false);
      setShowContent(true); // 无消息时正常显示空状态
      return;
    }

    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);

    if (!isInitialRenderDone && msgCount > 0) {
      // 有消息涌入 → 隐藏真实内容，显示骨架屏
      setShowContent(false);

      settleTimerRef.current = setTimeout(() => {
        setIsInitialRenderDone(true);

        // 关键顺序：先跳到底部 → 再显示内容
        requestAnimationFrame(() => {
          scrollToBottom({ animation: "instant" });
          // 再等一帧确保 scroll 生效后才淡入
          requestAnimationFrame(() => {
            setShowContent(true);
          });
        });
      }, 150);

      return () => {
        if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      };
    }
  }, [msgCount, isInitialRenderDone, scrollToBottom]);

  // 同时冻结 useStickToBottom 在加载期间的自动滚动
  const prevLoadingRef = useRef(isThreadLoading);
  useEffect(() => {
    if (isThreadLoading) {
      stopScroll();
      setIsInitialRenderDone(false);
    }
    prevLoadingRef.current = isThreadLoading;
  }, [isThreadLoading, stopScroll]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
        ref={scrollRef}
      >
        <div
          className="mx-auto w-full max-w-[1024px] px-6 pb-6 pt-4"
          ref={contentRef}
        >
          {/* 历史消息批量加载中：骨架屏遮盖 */}
          {!isInitialRenderDone && msgCount > 0 ? (
            <div className="flex flex-col gap-6 py-8 animate-pulse">
              {Array.from({ length: Math.min(msgCount, 8) }).map((_, i) => (
                <div key={i} className={cn(
                  "flex gap-4",
                  i % 2 === 0 ? "justify-end" : "justify-start"
                )}>
                  <div className={cn(
                    "h-24 rounded-2xl bg-muted/60",
                    i % 2 === 0 ? "w-[70%]" : "w-full max-w-[85%]"
                  )} />
                </div>
              ))}
              <div className="text-center text-sm text-muted-foreground pt-4">
                正在加载对话内容...
              </div>
            </div>
          ) : isThreadLoading ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-muted-foreground">加载中...</p>
            </div>
          ) : null}
          {/* 真实消息列表：已渲染但加载期间隐藏（opacity:0），scrollToBottom 后再淡入显示 */}
          <div
            className={cn(
              "transition-opacity duration-200",
              !isInitialRenderDone || !showContent ? "opacity-0 pointer-events-none absolute" : "opacity-100 relative"
            )}
            aria-hidden={!showContent}
          >
              {processedMessages.map((data, index) => {
                const messageUi = messageUiMap.get(data.message.id ?? "");
                const isLastMessage = index === processedMessages.length - 1;
                return (
                  <ChatMessage
                    key={data.message.id}
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
                    onEdit={handleEditMessage}
                    onRegenerate={() => handleRegenerate(data.message)}
                  />
                );
              })}
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 bg-background">
        <div
          ref={dropRef}
          className={cn(
            "mx-4 mb-6 flex flex-shrink-0 flex-col overflow-hidden rounded-2xl glass gradient-border",
            "mx-auto w-[calc(100%-32px)] max-w-[1024px] transition-all duration-300 ease-in-out",
            dragOver && "border-primary border-2 border-dotted shadow-lg"
          )}
        >
          {(hasTasks || hasFiles) && (
            <div className="flex max-h-72 flex-col overflow-y-auto border-b border-border bg-sidebar empty:hidden">
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
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={isLoading ? "运行中..." : "输入您的消息..."}
              className="font-inherit field-sizing-content flex-1 resize-none border-0 bg-transparent px-[18px] pb-[13px] pt-[14px] text-sm leading-7 text-primary outline-none placeholder:text-tertiary"
              rows={1}
            />
            <div className="flex justify-between gap-2 p-3">
              <div className="flex items-center gap-4">
                <Label
                  htmlFor="file-input"
                  className="flex cursor-pointer items-center gap-2 text-muted-foreground hover:text-primary"
                >
                  <Plus className="size-5" />
                  <span className="text-sm">上传文件</span>
                </Label>
                <input
                  id="file-input"
                  type="file"
                  onChange={handleFileUpload}
                  multiple
                  accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,.doc,.docx"
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <Switch
                    id="rag-switch"
                    checked={enableRag}
                    onCheckedChange={setEnableRag}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor="rag-switch"
                    className="cursor-pointer text-sm text-muted-foreground hover:text-primary"
                  >
                    开启 RAG
                  </Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type={isLoading ? "button" : "submit"}
                  variant={isLoading ? "destructive" : "default"}
                  onClick={isLoading ? stopStream : handleSubmit}
                  disabled={
                    !isLoading &&
                    (submitDisabled ||
                      (!input.trim() && contentBlocks.length === 0))
                  }
                  className={cn(
                    "transition-all duration-300",
                    isLoading
                      ? "animate-pulse"
                      : "bg-gradient-to-r from-[#2F6868] to-[#1a9a8a] shadow-md hover:shadow-lg hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] border-0"
                  )}
                >
                  {isLoading ? (
                    <>
                      <Square size={14} />
                      <span>停止</span>
                    </>
                  ) : (
                    <>
                      <ArrowUp size={18} />
                      <span>发送</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});

ChatInterface.displayName = "ChatInterface";
// NOTE  My80OmFIVnBZMlhvaklQb3RvVTZXa3RPY2c9PToxZjlmNGZiOA==
