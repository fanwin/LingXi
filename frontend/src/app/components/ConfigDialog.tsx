"use client";
// eslint-disable  MC80OmFIVnBZMlhvaklQb3RvVTZhM0ZFYlE9PTozN2VhYmNiNA==

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { StandaloneConfig } from "@/lib/config";
// TODO  MS80OmFIVnBZMlhvaklQb3RvVTZhM0ZFYlE9PTozN2VhYmNiNA==

interface ConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: StandaloneConfig) => void;
  initialConfig?: StandaloneConfig;
}
// FIXME  Mi80OmFIVnBZMlhvaklQb3RvVTZhM0ZFYlE9PTozN2VhYmNiNA==

export function ConfigDialog({
  open,
  onOpenChange,
  onSave,
  initialConfig,
}: ConfigDialogProps) {
  const [deploymentUrl, setDeploymentUrl] = useState(
    initialConfig?.deploymentUrl || ""
  );
  const [assistantId, setAssistantId] = useState(
    initialConfig?.assistantId || ""
  );
  const [langsmithApiKey, setLangsmithApiKey] = useState(
    initialConfig?.langsmithApiKey || ""
  );

  useEffect(() => {
    if (open && initialConfig) {
      setDeploymentUrl(initialConfig.deploymentUrl);
      setAssistantId(initialConfig.assistantId);
      setLangsmithApiKey(initialConfig.langsmithApiKey || "");
    }
  }, [open, initialConfig]);

  const handleSave = () => {
    if (!deploymentUrl || !assistantId) {
      alert("请填写所有必填字段");
      return;
    }

    onSave({
      deploymentUrl,
      assistantId,
      langsmithApiKey: langsmithApiKey || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        className="sm:max-w-[480px] p-0 overflow-hidden"
        style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        {/* 头部区域 */}
        <div className="px-6 pt-5 pb-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: 'var(--color-primary)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v6m0 6v6M23 12h-6M7 12H1"/>
                </svg>
              </div>
              系统配置
            </DialogTitle>
            <DialogDescription
              className="mt-2 text-sm leading-relaxed"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              配置您的智能体部署信息，所有数据将安全存储在本地浏览器中
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* 表单区域 */}
        <div className="px-6 pb-5 space-y-4">
          {/* 部署URL */}
          <div className="space-y-2">
            <Label
              htmlFor="deploymentUrl"
              className="text-sm font-medium"
              style={{ color: 'var(--color-text-primary)' }}
            >
              部署地址
            </Label>
            <Input
              id="deploymentUrl"
              placeholder="https://your-deployment.example.com"
              value={deploymentUrl}
              onChange={(e) => setDeploymentUrl(e.target.value)}
              className="h-11 rounded-xl px-4 transition-all duration-200 focus:ring-2 focus:ring-offset-1"
              style={{
                background: 'var(--color-surface-hover)',
                borderColor: 'var(--color-border)',
                borderRadius: 'var(--radius-lg)'
              }}
            />
          </div>

          {/* 助手ID */}
          <div className="space-y-2">
            <Label
              htmlFor="assistantId"
              className="text-sm font-medium"
              style={{ color: 'var(--color-text-primary)' }}
            >
              助手标识符
            </Label>
            <Input
              id="assistantId"
              placeholder="请输入助手 ID 或 Graph 名称"
              value={assistantId}
              onChange={(e) => setAssistantId(e.target.value)}
              className="h-11 rounded-xl px-4 font-mono text-sm transition-all duration-200 focus:ring-2 focus:ring-offset-1"
              style={{
                background: 'var(--color-surface-hover)',
                borderColor: 'var(--color-border)',
                borderRadius: 'var(--radius-lg)'
              }}
            />
          </div>

          {/* 提示信息 */}
          <div
            className="flex items-start gap-3 rounded-lg p-3"
            style={{ background: 'var(--color-surface-hover)', border: '1px solid var(--color-border-light)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              请确保输入正确的部署地址和助手ID，配置错误将导致无法连接到服务端
            </p>
          </div>
        </div>

        {/* 底部按钮区 */}
        <DialogFooter
          className="px-6 pb-5 pt-3"
          style={{ borderTop: '1px solid var(--color-border-light)' }}
        >
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-lg px-4 font-medium"
            style={{ borderColor: 'var(--color-border)' }}
          >
            取消
          </Button>
          <Button
            onClick={handleSave}
            className="gap-2 rounded-lg px-5 font-medium"
            style={{ background: 'var(--color-primary)', color: 'white' }}
          >
            保存配置
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
// FIXME  My80OmFIVnBZMlhvaklQb3RvVTZhM0ZFYlE9PTozN2VhYmNiNA==
