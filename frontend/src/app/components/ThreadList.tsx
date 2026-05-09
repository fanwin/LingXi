"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import { format } from "date-fns";
import { Loader2, MessageSquare, MoreVertical, Pin, Pencil, Search } from "lucide-react";
import { useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ThreadItem } from "@/app/hooks/useThreads";
import { useThreads } from "@/app/hooks/useThreads";
import { useClient } from "@/providers/ClientProvider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type StatusFilter = "all" | "idle" | "busy" | "interrupted" | "error";
// NOTE  MC80OmFIVnBZMlhvaklQb3RvVTZZVUU1U1E9PTo2MjE4MTQyOQ==

const GROUP_LABELS = {
  pinned: "置顶",
  interrupted: "需要关注",
  today: "今天",
  yesterday: "昨天",
  week: "本周",
  older: "更早",
} as const;

const STATUS_COLORS: Record<ThreadItem["status"], string> = {
  idle: "bg-green-500",
  busy: "bg-blue-500",
  interrupted: "bg-orange-500",
  error: "bg-red-600",
};
// NOTE  MS80OmFIVnBZMlhvaklQb3RvVTZZVUU1U1E9PTo2MjE4MTQyOQ==

function getThreadColor(status: ThreadItem["status"]): string {
  return STATUS_COLORS[status] ?? "bg-gray-400";
}

function formatTime(date: Date, now = new Date()): string {
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return format(date, "HH:mm");
  if (days === 1) return "昨天";
  if (days < 7) return format(date, "EEEE");
  return format(date, "MM/dd");
}

function StatusFilterItem({
  status,
  label,
  badge,
}: {
  status: ThreadItem["status"];
  label: string;
  badge?: number;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn(
          "inline-block size-2 rounded-full",
          getThreadColor(status)
        )}
      />
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="ml-1 inline-flex items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-bold leading-none text-white">
          {badge}
        </span>
      )}
    </span>
  );
}
// FIXME  Mi80OmFIVnBZMlhvaklQb3RvVTZZVUU1U1E9PTo2MjE4MTQyOQ==

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <p className="text-sm text-red-600">加载对话列表失败</p>
      <p className="mt-1 text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-16 w-full"
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <MessageSquare className="mb-2 h-12 w-12 text-gray-300" />
      <p className="text-sm text-muted-foreground">暂无对话</p>
    </div>
  );
}
// eslint-disable  My80OmFIVnBZMlhvaklQb3RvVTZZVUU1U1E9PTo2MjE4MTQyOQ==

interface ThreadListProps {
  onThreadSelect: (id: string) => void;
  onMutateReady?: (mutate: () => void) => void;
  onClose?: () => void;
  onInterruptCountChange?: (count: number) => void;
}

export function ThreadList({
  onThreadSelect,
  onMutateReady,
  onClose,
  onInterruptCountChange,
}: ThreadListProps) {
  const [currentThreadId, setCurrentThreadId] = useQueryState("threadId");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameThreadId, setRenameThreadId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const client = useClient();

  const threads = useThreads({
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: 20,
  });

  const flattened = useMemo(() => {
    return threads.data?.flat() ?? [];
  }, [threads.data]);

  // 搜索过滤：对标题和描述进行关键字匹配
  const filteredThreads = useMemo(() => {
    if (!searchQuery.trim()) return flattened;
    const q = searchQuery.trim().toLowerCase();
    return flattened.filter((t) => {
      const title = (t.customTitle || t.title).toLowerCase();
      const desc = t.description.toLowerCase();
      return title.includes(q) || desc.includes(q);
    });
  }, [flattened, searchQuery]);

  const isLoadingMore =
    threads.size > 0 && threads.data?.[threads.size - 1] == null;
  const isEmpty = threads.data?.at(0)?.length === 0;
  const isReachingEnd = isEmpty || (threads.data?.at(-1)?.length ?? 0) < 20;

  // Group threads: pinned first, then by time and status
  const grouped = useMemo(() => {
    const now = new Date();
    const groups: Record<keyof typeof GROUP_LABELS, ThreadItem[]> = {
      pinned: [],
      interrupted: [],
      today: [],
      yesterday: [],
      week: [],
      older: [],
    };

    filteredThreads.forEach((thread) => {
      if (thread.pinned) {
        groups.pinned.push(thread);
        return;
      }

      if (thread.status === "interrupted") {
        groups.interrupted.push(thread);
        return;
      }

      const diff = now.getTime() - thread.updatedAt.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) {
        groups.today.push(thread);
      } else if (days === 1) {
        groups.yesterday.push(thread);
      } else if (days < 7) {
        groups.week.push(thread);
      } else {
        groups.older.push(thread);
      }
    });

    return groups;
  }, [filteredThreads]);

  const interruptedCount = useMemo(() => {
    return flattened.filter((t) => t.status === "interrupted").length;
  }, [flattened]);

  // Expose thread list revalidation to parent component
  // Use refs to create a stable callback that always calls the latest mutate function
  const onMutateReadyRef = useRef(onMutateReady);
  const mutateRef = useRef(threads.mutate);
  const mutateTimerRef = useRef<number | null>(null);

  useEffect(() => {
    onMutateReadyRef.current = onMutateReady;
  }, [onMutateReady]);

  useEffect(() => {
    mutateRef.current = threads.mutate;
  }, [threads.mutate]);

  useEffect(() => {
    return () => {
      if (mutateTimerRef.current !== null) {
        window.clearTimeout(mutateTimerRef.current);
      }
    };
  }, []);

  const mutateFn = useCallback(() => {
    if (typeof window === "undefined") {
      startTransition(() => {
        mutateRef.current();
      });
      return;
    }

    if (mutateTimerRef.current !== null) {
      window.clearTimeout(mutateTimerRef.current);
    }

    mutateTimerRef.current = window.setTimeout(() => {
      startTransition(() => {
        mutateRef.current();
      });
      mutateTimerRef.current = null;
    }, 80);
  }, []);

  useEffect(() => {
    onMutateReadyRef.current?.(mutateFn);
    // Only run once on mount to avoid infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTogglePin = useCallback(
    async (thread: ThreadItem) => {
      try {
        await client.threads.update(thread.id, {
          metadata: {
            pinned: !thread.pinned,
          },
        });
        mutateFn();
      } catch (error) {
        console.error("Failed to toggle pin:", error);
        alert("置顶操作失败，请重试。");
      }
    },
    [client]
  );

  const handleOpenRename = useCallback((thread: ThreadItem) => {
    setRenameThreadId(thread.id);
    setRenameValue(thread.customTitle || thread.title);
    setRenameDialogOpen(true);
  }, []);

  const handleRenameSubmit = useCallback(async () => {
    if (!renameThreadId || !renameValue.trim()) {
      setRenameDialogOpen(false);
      return;
    }

    try {
      await client.threads.update(renameThreadId, {
        metadata: {
          customTitle: renameValue.trim(),
        },
      });
      mutateFn();
    } catch (error) {
      console.error("Failed to rename thread:", error);
      alert("重命名失败，请重试。");
    } finally {
      setRenameDialogOpen(false);
      setRenameThreadId(null);
      setRenameValue("");
    }
  }, [client, renameThreadId, renameValue]);

  // Notify parent of interrupt count changes
  useEffect(() => {
    onInterruptCountChange?.(interruptedCount);
  }, [interruptedCount, onInterruptCountChange]);

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Header with title, filter, and search */}
      <div className="flex flex-shrink-0 flex-col gap-3 border-b border-border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">对话列表</h2>
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="w-fit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">所有状态</SelectItem>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>活跃</SelectLabel>
                  <SelectItem value="idle">
                    <StatusFilterItem
                      status="idle"
                      label="空闲"
                    />
                  </SelectItem>
                  <SelectItem value="busy">
                    <StatusFilterItem
                      status="busy"
                      label="忙碌"
                    />
                  </SelectItem>
                </SelectGroup>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>需要关注</SelectLabel>
                  <SelectItem value="interrupted">
                    <StatusFilterItem
                      status="interrupted"
                      label="已中断"
                      badge={interruptedCount}
                    />
                  </SelectItem>
                  <SelectItem value="error">
                    <StatusFilterItem
                      status="error"
                      label="错误"
                    />
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsSearchOpen((prev) => !prev);
                if (!isSearchOpen) {
                  setTimeout(() => searchInputRef.current?.focus(), 100);
                } else {
                  setSearchQuery("");
                }
              }}
              className={cn("h-8 w-8", isSearchOpen && "bg-accent text-accent-foreground")}
              aria-label={isSearchOpen ? "关闭搜索" : "搜索对话"}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {/* 搜索输入框 */}
        {isSearchOpen && (
          <div className="animate-message-in">
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索对话标题或内容..."
              className="h-9 text-sm"
            />
          </div>
        )}
      </div>

      <ScrollArea className="h-0 flex-1">
        {threads.error && <ErrorState message={threads.error.message} />}

        {!threads.error && !threads.data && threads.isLoading && (
          <LoadingState />
        )}

        {!threads.error && !threads.isLoading && isEmpty && <EmptyState />}

        {/* 搜索无结果 */}
        {!threads.error && !isEmpty && searchQuery.trim() && filteredThreads.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Search className="mb-2 h-10 w-10 text-gray-300" />
            <p className="text-sm text-muted-foreground">
              未找到包含「{searchQuery.trim()}」的对话
            </p>
          </div>
        )}

        {!threads.error && !isEmpty && filteredThreads.length > 0 && (
          <div className="box-border w-full max-w-full overflow-hidden">
            {(
              Object.keys(GROUP_LABELS) as Array<keyof typeof GROUP_LABELS>
            ).map((group) => {
              const groupThreads = grouped[group];
              if (groupThreads.length === 0) return null;

              return (
                <div
                  key={group}
                  className="mb-4"
                >
                  <h4 className="m-0 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {GROUP_LABELS[group]}
                  </h4>
                  <div className="flex flex-col gap-1">
                    {groupThreads.map((thread) => (
                      <div
                        key={thread.id}
                        className="group relative"
                      >
                        <button
                          type="button"
                          onClick={() => onThreadSelect(thread.id)}
                          className={cn(
                            "grid w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 pr-8 text-left transition-colors duration-200",
                            "hover:bg-accent",
                            currentThreadId === thread.id
                              ? "border border-primary bg-accent hover:bg-accent"
                              : "border border-transparent bg-transparent"
                          )}
                          aria-current={currentThreadId === thread.id}
                        >
                          <div className="min-w-0 flex-1">
                            {/* Title + Timestamp Row */}
                            <div className="flex items-center justify-between">
                              <h3 className="truncate text-sm font-semibold">
                                {thread.customTitle || thread.title}
                              </h3>
                              <span className="ml-2 flex-shrink-0 text-xs text-muted-foreground">
                                {formatTime(thread.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </button>

                        {/* More actions dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className={cn(
                                "absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-accent-foreground group-hover:opacity-100",
                                "data-[state=open]:opacity-100"
                              )}
                              onClick={(e) => e.stopPropagation()}
                              aria-label="更多操作"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" side="right">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenRename(thread);
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              重命名
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePin(thread);
                              }}
                            >
                              <Pin className="mr-2 h-4 w-4" />
                              {thread.pinned ? "取消置顶" : "置顶"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {!isReachingEnd && (
              <div className="flex justify-center py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => threads.setSize(threads.size + 1)}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      加载中...
                    </>
                  ) : (
                    "加载更多"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>重命名对话</DialogTitle>
            <DialogDescription>
              输入新的对话标题，方便您快速识别。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="thread-name">对话标题</Label>
              <Input
                id="thread-name"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="请输入对话标题"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRenameSubmit();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleRenameSubmit}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
