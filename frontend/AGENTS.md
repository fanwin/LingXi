# Deep Agents UI — 项目指南

> 本文件面向 AI 编程助手。如果你对人类用户可见的说明感兴趣，请查看 `README.md`（如果存在）。

---

## 项目概览

`deep-agents-ui` 是一个基于 **Next.js** 的独立聊天前端，用于与 LangGraph 部署的智能体（Agent）进行交互。它是一个单页客户端应用，主要功能包括：

- 与 LangGraph 助手（Assistant）进行多轮对话
- 线程（Thread）历史管理（左侧可调整宽度的边栏）
- 文件上传：支持图片（JPEG/PNG/GIF/WEBP）、PDF、Word 文档（.doc/.docx）
- RAG（检索增强生成）开关
- 任务（Todo）追踪与文件状态查看
- 工具调用（Tool Call）可视化与人类审批中断（Human-in-the-loop Interrupt）
- 子智能体（Sub-agent）调用展示
- 测试用例导出（Excel）下载栏

UI 语言为**简体中文**。

---

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Next.js 16 (App Router) |
| 运行时 / 语言 | React 19 + TypeScript 5.9 |
| 样式 | Tailwind CSS 3.4 + Sass + PostCSS |
| UI 组件 | shadcn/ui（基于 Radix UI）|
| AI SDK | `@langchain/langgraph-sdk` + `@langchain/core` |
| 数据获取 | `swr`（用于线程列表分页）|
| URL 状态 | `nuqs` |
| 提示 | `sonner`（Toast）、`lucide-react`（图标）|
| 包管理器 | Yarn 1.22.22 |
| Node 版本 | 20（见 `.nvmrc`）|

---

## 项目结构

```
src/
├── app/
│   ├── layout.tsx              # 根布局：Inter 字体、nuqs 适配器、Toaster
│   ├── page.tsx                # 首页：配置检查、ClientProvider、ChatProvider 组装
│   ├── globals.css             # 全局样式、CSS 变量、Tailwind 指令
│   ├── components/             # 页面级组件（非通用）
│   │   ├── ChatInterface.tsx   # 聊天主界面（消息列表 + 输入框 + 任务/文件面板）
│   │   ├── ChatMessage.tsx     # 单条消息渲染（人类/AI、工具调用、子智能体、附件）
│   │   ├── ThreadList.tsx      # 左侧线程列表
│   │   ├── ConfigDialog.tsx    # 部署配置弹窗
│   │   ├── ToolCallBox.tsx     # 单个工具调用展示卡片
│   │   ├── SubAgentIndicator.tsx
│   │   ├── MarkdownContent.tsx
│   │   ├── MultimodalPreview.tsx
│   │   ├── TasksFilesSidebar.tsx
│   │   ├── TestCaseExportBar.tsx
│   │   └── ...
│   ├── hooks/
│   │   ├── useChat.ts          # 核心聊天流逻辑（useStream 包装）
│   │   ├── useThreads.ts       # SWR 无限分页获取线程列表
│   │   └── useFileUpload.ts    # 文件上传、拖拽、粘贴逻辑
│   ├── types/
│   │   ├── types.ts            # 项目内部类型（ToolCall、SubAgent、TodoItem 等）
│   │   └── inbox.ts            # LangGraph 中断/线程状态扩展类型
│   └── utils/
│       ├── utils.ts            # 字符串处理、消息内容提取、模型内部数据剥离
│       └── multimodal.ts       # 文件转 ContentBlock、Base64 转换
├── components/ui/              # shadcn/ui 基础组件
│   ├── button.tsx、dialog.tsx、input.tsx、scroll-area.tsx ...
├── lib/
│   ├── config.ts               # StandaloneConfig 类型与 localStorage 读写
│   └── utils.ts                # `cn()` 工具（clsx + tailwind-merge）
└── providers/
    ├── ClientProvider.tsx        # LangGraph SDK Client Context
    └── ChatProvider.tsx          # Chat 状态 Context（useChat hook 封装）
```

---

## 构建与开发命令

所有命令均通过 `package.json` scripts 定义，使用 **Yarn**：

```bash
# 安装依赖
yarn install

# 开发服务器（增加 Node 内存上限到 4GB）
yarn dev

# 生产构建
yarn build

# 启动生产服务器
yarn start

# 代码检查
yarn lint
yarn lint:fix

# 格式化
yarn format
yarn format:check
```

> 当前 `next.config.ts` 基本为空（注释掉了大部分内容），因此项目使用 Next.js 默认构建设置。

---

## 代码风格与规范

- **语言**：TypeScript，严格模式开启（`strict: true`）。
- **路径别名**：`@/` 映射到 `./src/*`。始终使用别名导入，避免相对路径（如 `../../components`）。
- **类名合并**：使用 `cn(...)`（来自 `@/lib/utils`）合并 Tailwind 类名。
- **组件风格**：函数组件，React.memo 用于性能敏感的消息/聊天组件。
- **Hook 规则**：所有使用 React state/effect/context 的文件必须以 `"use client"` 开头。
- **注释**：项目内存在大量编码注释标记（如 `// FIXME MC8yOmFIVn...`），**请勿删除或修改**这些标记，它们可能用于外部构建追踪。
- **Prettier**：
  - `singleAttributePerLine: true`
  - 使用 `prettier-plugin-tailwindcss` 自动排序 Tailwind 类名
- **ESLint**：
  - 忽略 `.next/`、`dist/`、`node_modules/`
  - `@typescript-eslint/no-explicit-any` 已关闭（允许 `any`）
  - 未使用变量规则：允许以下划线 `_` 开头的参数/变量

---

## 配置与运行时架构

### 连接后端

应用通过 LangGraph SDK Client 连接到用户配置的部署地址：

- `deploymentUrl`：LangGraph 部署 URL（或本地 `http://localhost:2024`）
- `assistantId`：可以是**已部署助手的 UUID**，也可以是**本地图的名称**（graph ID）
- `langsmithApiKey`：可选，用于认证

配置持久化在浏览器 `localStorage`，键名为 `deep-agent-config`。首次访问时若未配置，会弹出 `ConfigDialog`。

### 页面状态

- `threadId`（URL query `?threadId=`）：当前会话线程 ID，由 `nuqs` 管理。
- `sidebar`（URL query `?sidebar=`）：控制左侧线程列表是否显示，可折叠。
- `assistantId`（URL query `?assistantId=`）：当前助手 ID。

### 聊天数据流

1. `ClientProvider` 创建 `Client` 实例（单例 Context）。
2. `ChatProvider` 调用 `useChat` hook，后者内部使用 `@langchain/langgraph-sdk/react` 的 `useStream`。
3. `useStream` 通过 SSE 与 LangGraph 部署通信，管理消息流、中断（interrupt）、线程状态。
4. 状态包括：`messages`、`todos`、`files`、`email`、`ui`（自定义 UI 元素）。

### 文件上传流程

- 图片：通过 `image_url` 格式（Base64 Data URL）放入消息 `content` 数组，兼容 OpenAI/Doubao API。
- PDF / Word：作为 `file` 类型的 ContentBlock，放入 `additional_kwargs.attachments`，由后端解析。
- 支持点击上传、拖拽上传、粘贴上传三种方式。

---

## 测试策略

**当前项目没有自己的测试套件。** `package.json` 中没有 `test` 脚本，源码目录下也不存在 `*.test.*` 或 `*.spec.*` 文件。

若需要添加测试，建议：
- 单元测试：使用 Vitest 或 Jest 测试 `src/app/utils/` 中的纯函数。
- 组件测试：使用 `@testing-library/react` 测试通用 UI 组件（`components/ui/`）。
- 端到端测试：使用 Playwright 测试完整的配置 → 聊天流程。

---

## 部署说明

- 构建输出目录为 Next.js 默认的 `.next/`。
- 项目为纯前端应用，不依赖 Node.js 服务端 API（所有 API 调用通过浏览器直接发往用户配置的 `deploymentUrl`）。
- 因此可以部署到任何支持静态/SPA 托管的平台（Vercel、Netlify、Nginx 等），只需确保 `next build` 正常完成。
- 环境变量 `NEXT_PUBLIC_LANGSMITH_API_KEY` 可作为默认 API Key 注入，但用户仍可在配置弹窗中覆盖。

---

## 安全注意事项

- API Key 和配置存储在**浏览器 localStorage** 中，请注意 XSS 风险。
- 所有 LangGraph API 调用均从浏览器直接发出，确保部署 URL 支持 CORS。
- `no-explicit-any` 规则已关闭，类型边界较宽松，修改核心 hook 时请额外注意类型安全。
- 项目中没有身份验证或授权层，完全依赖 LangGraph 部署端的 API Key 鉴权。

---

## 常用修改场景提示

### 添加新的文件上传类型

1. 修改 `src/app/utils/multimodal.ts` 中的 `supportedFileTypes`。
2. 修改 `src/app/hooks/useFileUpload.ts` 中的 `SUPPORTED_FILE_TYPES`。
3. 修改 `src/app/components/ChatInterface.tsx` 中 `<input accept="...">` 的 `accept` 属性。
4. 在 `fileToContentBlock` 中为新类型返回合适的 `ContentBlock.Multimodal.Data`。

### 修改主题颜色

- 全局 CSS 变量在 `src/app/globals.css` 的 `:root` 中定义。
- Tailwind 扩展颜色/背景/边框在 `tailwind.config.mjs` 的 `theme.extend` 中定义，很多值映射到 CSS 变量（如 `var(--bg-primary)`）。
- 暗色模式通过 `prefers-color-scheme: dark` 自动切换。

### 调整线程列表分页

- 修改 `src/app/hooks/useThreads.ts` 中的 `DEFAULT_PAGE_SIZE`（当前为 20）。

### 修改消息中后端注入的隐藏标记

- 若后端改变了内部数据标记格式，同步更新 `src/app/utils/utils.ts` 中的 `MODEL_DATA_MARKER_START` / `MODEL_DATA_MARKER_END`。

---

## 相关文件速查

| 目的 | 文件 |
|---|---|
| 入口页面 | `src/app/page.tsx` |
| 全局样式 / CSS 变量 | `src/app/globals.css` |
| Tailwind 配置 | `tailwind.config.mjs` |
| PostCSS 配置 | `postcss.config.cjs` |
| TypeScript 配置 | `tsconfig.json` |
| ESLint 配置 | `eslint.config.js` |
| Prettier 配置 | `prettier.config.cjs` |
| 包依赖 | `package.json` |
| Node 版本 | `.nvmrc` |
| shadcn/ui 配置 | `components.json` |
