"use client";
// TODO  MC80OmFIVnBZMlhvaklQb3RvVTZUR000T0E9PTpkYjQwM2MyMA==

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useQueryState } from "nuqs";
import { getConfig, saveConfig, StandaloneConfig } from "@/lib/config";
import { ConfigDialog } from "@/app/components/ConfigDialog";
import { Button } from "@/components/ui/button";
import { Assistant } from "@langchain/langgraph-sdk";
import { ClientProvider, useClient } from "@/providers/ClientProvider";
import { Settings, MessagesSquare, SquarePen } from "lucide-react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ThreadList } from "@/app/components/ThreadList";
import { ChatProvider } from "@/providers/ChatProvider";
import { ChatInterface } from "@/app/components/ChatInterface";

interface HomePageInnerProps {
  config: StandaloneConfig;
  configDialogOpen: boolean;
  setConfigDialogOpen: (open: boolean) => void;
  handleSaveConfig: (config: StandaloneConfig) => void;
}
// FIXME  MS80OmFIVnBZMlhvaklQb3RvVTZUR000T0E9PTpkYjQwM2MyMA==

function HomePageInner({
  config,
  configDialogOpen,
  setConfigDialogOpen,
  handleSaveConfig,
}: HomePageInnerProps) {
  const client = useClient();
  const [threadId, setThreadId] = useQueryState("threadId");
  const [sidebar, setSidebar] = useQueryState("sidebar");

  const [mutateThreads, setMutateThreads] = useState<(() => void) | null>(null);
  const [interruptCount, setInterruptCount] = useState(0);
  const [assistant, setAssistant] = useState<Assistant | null>(null);

  const fetchAssistant = useCallback(async () => {
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        config.assistantId
      );

    if (isUUID) {
      // We should try to fetch the assistant directly with this UUID
      try {
        const data = await client.assistants.get(config.assistantId);
        setAssistant(data);
      } catch (error) {
        console.error("Failed to fetch assistant:", error);
        setAssistant({
          assistant_id: config.assistantId,
          graph_id: config.assistantId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          config: {},
          metadata: {},
          version: 1,
          name: "Assistant",
          context: {},
        });
      }
    } else {
      try {
        // We should try to list out the assistants for this graph, and then use the default one.
        // TODO: Paginate this search, but 100 should be enough for graph name
        const assistants = await client.assistants.search({
          graphId: config.assistantId,
          limit: 100,
        });
        const defaultAssistant = assistants.find(
          (assistant) => assistant.metadata?.["created_by"] === "system"
        );
        if (defaultAssistant === undefined) {
          throw new Error("No default assistant found");
        }
        setAssistant(defaultAssistant);
      } catch (error) {
        console.error(
          "Failed to find default assistant from graph_id: try setting the assistant_id directly:",
          error
        );
        setAssistant({
          assistant_id: config.assistantId,
          graph_id: config.assistantId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          config: {},
          metadata: {},
          version: 1,
          name: config.assistantId,
          context: {},
        });
      }
    }
  }, [client, config.assistantId]);

  useEffect(() => {
    fetchAssistant();
  }, [fetchAssistant]);

  return (
    <>
      <ConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        onSave={handleSaveConfig}
        initialConfig={config}
      />
      <div className="flex h-screen flex-col overflow-hidden" style={{ background: 'var(--color-background)' }}>
        {/* 现代化渐变头部 */}
        <header
          className="relative flex h-16 items-center justify-between px-6"
          style={{
            background: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div className="flex items-center gap-5">
            {/* Logo区域 - 简洁专业 */}
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{
                  background: 'var(--color-primary)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 8V4H8"/>
                  <rect x="8" y="8" width="8" height="10" rx="2"/>
                  <path d="M14 12h4v4"/>
                  <circle cx="18" cy="16" r="2"/>
                  <path d="M10 12H6v4"/>
                  <circle cx="6" cy="16" r="2"/>
                </svg>
              </div>
              <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                AI 智能平台
              </h1>
            </div>

            {!sidebar && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebar("1")}
                className="group relative gap-2.5 rounded-xl px-4 py-2.5 font-medium transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                style={{
                  background: 'var(--color-surface-hover)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <MessagesSquare className="h-4 w-4 transition-transform group-hover:scale-110" style={{ color: 'var(--color-primary)' }} />
                对话列表
                {interruptCount > 0 && (
                  <span
                    className="ml-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold text-white animate-pulse"
                    style={{ background: 'var(--color-primary-gradient)', boxShadow: 'var(--shadow-glow)' }}
                  >
                    {interruptCount}
                  </span>
                )}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* 助手信息卡片 */}
            <div
              className="hidden sm:flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm"
              style={{
                background: 'var(--color-surface-hover)',
                border: '1px solid var(--color-border-light)'
              }}
            >
              <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>助手:</span>
              <span className="max-w-[180px] truncate font-mono text-xs" style={{ color: 'var(--color-text-primary)' }}>
                {config.assistantId.slice(0, 20)}{config.assistantId.length > 20 ? '...' : ''}
              </span>
            </div>

            {/* 设置按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfigDialogOpen(true)}
              className="rounded-xl px-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <Settings className="mr-2 h-4 w-4" />
              设置
            </Button>

            {/* 新建对话按钮 - 主要操作按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setThreadId(null)}
              disabled={!threadId}
              className="rounded-lg px-4 font-medium transition-all duration-200 disabled:opacity-40"
              style={{
                background: !threadId ? 'var(--color-surface-hover)' : 'var(--color-primary)',
                borderColor: 'transparent',
                color: !threadId ? 'var(--color-text-tertiary)' : 'white',
              }}
            >
              <SquarePen className="mr-2 h-4 w-4" />
              新建对话
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup
            direction="horizontal"
            autoSaveId="standalone-chat"
          >
            {sidebar && (
              <>
                <ResizablePanel
                  id="thread-history"
                  order={1}
                  defaultSize={25}
                  minSize={20}
                  className="relative min-w-[380px]"
                >
                  <ThreadList
                    onThreadSelect={async (id) => {
                      await setThreadId(id);
                    }}
                    onMutateReady={(fn) => setMutateThreads(() => fn)}
                    onClose={() => setSidebar(null)}
                    onInterruptCountChange={setInterruptCount}
                  />
                </ResizablePanel>
                <ResizableHandle />
              </>
            )}

            <ResizablePanel
              id="chat"
              className="relative flex flex-col"
              order={2}
            >
              <ChatProvider
                activeAssistant={assistant}
                onHistoryRevalidate={() => mutateThreads?.()}
              >
                <ChatInterface assistant={assistant} />
              </ChatProvider>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </>
  );
}
// FIXME  Mi80OmFIVnBZMlhvaklQb3RvVTZUR000T0E9PTpkYjQwM2MyMA==

function HomePageContent() {
  const [config, setConfig] = useState<StandaloneConfig | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [assistantId, setAssistantId] = useQueryState("assistantId");

  // On mount, check for saved config, otherwise show config dialog
  useEffect(() => {
    const savedConfig = getConfig();
    if (savedConfig) {
      setConfig(savedConfig);
      if (!assistantId) {
        setAssistantId(savedConfig.assistantId);
      }
    } else {
      setConfigDialogOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If config changes, update the assistantId
  useEffect(() => {
    if (config && !assistantId) {
      setAssistantId(config.assistantId);
    }
  }, [config, assistantId, setAssistantId]);

  const handleSaveConfig = useCallback((newConfig: StandaloneConfig) => {
    saveConfig(newConfig);
    setConfig(newConfig);
  }, []);

  const langsmithApiKey =
    config?.langsmithApiKey || process.env.NEXT_PUBLIC_LANGSMITH_API_KEY || "";

  if (!config) {
    return (
      <>
        <ConfigDialog
          open={configDialogOpen}
          onOpenChange={setConfigDialogOpen}
          onSave={handleSaveConfig}
        />
        <div className="flex h-screen items-center justify-center" style={{ background: 'var(--color-background)' }}>
          <div className="text-center animate-fadeIn">
            {/* Logo */}
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl" style={{
              background: 'var(--color-primary)',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8V4H8"/>
                <rect x="8" y="8" width="8" height="10" rx="2"/>
                <path d="M14 12h4v4"/><circle cx="18" cy="16" r="2"/>
                <path d="M10 12H6v4"/><circle cx="6" cy="16" r="2"/>
              </svg>
            </div>

            <h1 className="mb-3 text-2xl font-semibold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
              欢迎使用深度智能体
            </h1>
            <p className="mx-auto max-w-sm text-base leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              请配置您的部署以开始使用
            </p>
            <Button
              onClick={() => setConfigDialogOpen(true)}
              className="mt-6 gap-2 rounded-lg px-6 py-2.5 text-base font-medium"
              style={{ background: 'var(--color-primary)', color: 'white' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
              </svg>
              开始配置
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <ClientProvider
      deploymentUrl={config.deploymentUrl}
      apiKey={langsmithApiKey}
    >
      <HomePageInner
        config={config}
        configDialogOpen={configDialogOpen}
        setConfigDialogOpen={setConfigDialogOpen}
        handleSaveConfig={handleSaveConfig}
      />
    </ClientProvider>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center" style={{ background: 'var(--color-background)' }}>
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-xl" style={{
              background: 'conic-gradient(from 0deg, transparent 0%, var(--color-primary) 100%)',
              WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 4px))',
              mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 4px))'
            }} />
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>加载中...</p>
          </div>
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
// TODO  My80OmFIVnBZMlhvaklQb3RvVTZUR000T0E9PTpkYjQwM2MyMA==
