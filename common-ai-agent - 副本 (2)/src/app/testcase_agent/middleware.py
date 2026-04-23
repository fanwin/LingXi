"""
Agent 中间件模块 - before_model / after_model 钩子

提供大模型执行前后的拦截能力：
  - check_message_flow (before_model): 多模态内容检测与转换入口
  - log_response (after_model): 模型响应日志记录

处理策略（与前端"开启 RAG"按钮同步）：
  - 检测多模态内容（图片/PDF/文件）→ 自动转换为纯文本 → 继续传递给模型
  - RAG 开关由 RAGMiddleware 独立控制，与本中间件解耦

使用方式：
    from examples.middleware import check_message_flow, log_response
"""

from typing import Any

from langchain.agents.middleware import before_model, after_model
from langchain_core.messages import AIMessage, HumanMessage
from langgraph.runtime import Runtime

from src.app.testcase_agent.message_transformer import transform_multimodal_message


# ============================================================
# 附件元信息提取（轻量级，不读取数据体）
# ============================================================

def extract_attachment_metadata(content: list) -> list[dict]:
    """从多模态 content 中提取附件元信息（URL/文件名/MIME）。"""
    metadata: list[dict] = []
    for part in content:
        if not isinstance(part, dict) or "type" not in part:
            continue
        pt = part["type"]
        if pt == "image_url":
            img_url = part.get("image_url", {})
            url_val = img_url.get("url", "") if isinstance(img_url, dict) else ""
            if url_val:
                metadata.append({"type": "image", "url": url_val})
        elif pt == "file":
            metadata.append({
                "type": "file",
                "mimeType": part.get("source_media_type", "application/octet-stream"),
                "filename": part.get("filename", "attachment"),
            })
    return metadata


# ============================================================
# 核心中间件：before_model
# ============================================================

@before_model(can_jump_to=["end"])
def check_message_flow(state: dict, runtime: Runtime) -> dict[str, Any] | None:
    """
    大模型执行前的中间件 —— 多模态内容检测与转换。

    策略：
      检测最后一条 HumanMessage 是否含有多模态 content (list) 或 PDF URL/路径，
      如果是 → 自动调用 transform_multimodal_message() 转换为纯文本 → 继续传递
      如果否 → 直接传递给模型

    注意：RAG 开关由 RAGMiddleware 独立控制，与本中间件解耦。
    """
    print("=" * 60)
    print("[before_model] 大模型运作前的预处理...")
    print("=" * 60)
    print(f"消息总数: {len(state['messages'])}")

    # ---- 检测最新用户消息 ----
    if state["messages"]:
        last_msg = state["messages"][-1]
        print(f"用户输入: {str(last_msg.content)[:200]}...")

        if isinstance(last_msg, HumanMessage):
            content = last_msg.content

            is_multimodal = (
                isinstance(content, list)
                and any(
                    isinstance(p, dict) and p.get("type") in ("image_url", "file")
                    for p in content if isinstance(p, dict)
                )
            )

            # 检查纯文本中是否包含 PDF URL 或本地 PDF 路径
            has_pdf_url = False
            has_pdf_path = False
            if isinstance(content, str):
                from src.app.testcase_agent.message_transformer import extract_pdf_urls, extract_pdf_paths
                pdf_urls = extract_pdf_urls(content)
                pdf_paths = extract_pdf_paths(content)
                has_pdf_url = len(pdf_urls) > 0
                has_pdf_path = len(pdf_paths) > 0
                if has_pdf_url:
                    print(f"\n[检测到 PDF URL] {len(pdf_urls)} 个")
                if has_pdf_path:
                    print(f"\n[检测到本地 PDF 路径] {len(pdf_paths)} 个")

            if is_multimodal or has_pdf_url or has_pdf_path:
                _handle_multimodal_content(state, last_msg)
            else:
                print("\n[纯文本] 无需转换\n")

    return None


def _handle_multimodal_content(state: dict, last_msg: HumanMessage) -> None:
    """检测到多模态内容时，自动转换为纯文本。"""
    print("\n[检测到多模态] 开始 图片/PDF→文本 转换...")
    transformed = transform_multimodal_message(last_msg)
    state["messages"][-1] = transformed
    print("[转换完成] 已替换为纯文本\n")


# ============================================================
# 辅助中间件：after_model
# ============================================================

@after_model
def log_response(state: dict, runtime: Runtime) -> dict[str, Any] | None:
    """大模型执行后打印响应摘要。"""
    print("-" * 40)
    last_content = state["messages"][-1].content if state["messages"] else ""
    print(f"[after_model] 响应: {str(last_content)[:200]}...")
    print("-" * 40)
    return None
