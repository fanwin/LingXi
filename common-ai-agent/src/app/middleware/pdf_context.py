"""
PDF 上下文注入中间件 (PDFContextMiddleware)

从 messages 中最后一个用户消息的 additional_kwargs.attachments 中提取 PDF，
将 base64 数据保存到本地 workspace/uploads/ 目录，并在该 HumanMessage 中追加提示，
通知智能体调用 parse_pdf 工具解析文件获取上下文。
"""

from __future__ import annotations

import base64
import logging
from pathlib import Path
from typing import Any, Callable, Awaitable

from langchain.agents.middleware import AgentMiddleware, ModelRequest, ModelResponse
from langchain.agents.middleware.types import ResponseT
from langchain_core.messages import HumanMessage
from langgraph.typing import ContextT

logger = logging.getLogger(__name__)

# PDF 临时保存目录（相对于本文件 ../../workspace/uploads）
_UPLOAD_DIR = Path(__file__).resolve().parent.parent / "workspace" / "uploads"
_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
# pragma: no cover  MC80OmFIVnBZMlhvaklQb3RvVTZNalZEWWc9PTphZDc0NjJhMg==


def _decode_base64(data: str) -> bytes:
    """将 base64 字符串解码为 bytes。"""
    if "," in data:
        data = data.split(",", 1)[1]
    return base64.b64decode(data)

# fmt: off  MS80OmFIVnBZMlhvaklQb3RvVTZNalZEWWc9PTphZDc0NjJhMg==

class PDFContextMiddleware(AgentMiddleware):
    """PDF 文档上下文注入中间件（精简版）。

    核心逻辑：
    1. 扫描最后一条用户消息，提取 PDF 附件。
    2. 将 base64 PDF 数据解码并保存到 workspace/uploads/ 目录。
    3. 在该 HumanMessage 中追加提示文本，告知智能体调用 parse_pdf 工具解析此文件。
    4. 不再修改 system_message，也不预解析 PDF 内容。
    """

    async def awrap_model_call(
        self,
        request: ModelRequest[ContextT],
        handler: Callable[[ModelRequest[ContextT]], Awaitable[ModelResponse[ResponseT]]],
    ) -> Any:
        if not request.messages:
            return await handler(request)

        last_msg = request.messages[-1]
        if not isinstance(last_msg, HumanMessage):
            return await handler(request)

        pdf_info = self._extract_pdf_from_message(last_msg)
        if pdf_info is None:
            return await handler(request)

        pdf_bytes, filename = pdf_info
        safe_name = Path(filename).name
        file_path = _UPLOAD_DIR / safe_name

        try:
            file_path.write_bytes(pdf_bytes)
            logger.info("[PDFContextMiddleware] PDF 已保存到: %s", file_path)
        except Exception as e:
            logger.warning("[PDFContextMiddleware] PDF 保存失败: %s", e)
            return await handler(request)

        # 构建提示文本
        prompt_text = (
            f"\n\n[系统提示] 用户上传了 PDF 文件 '{safe_name}'，"
            f"保存在 '{file_path}'，请调用 extract_pdf_text_from_file 工具解析该文件获取上下文。"
        )

        # 构造新的 HumanMessage，追加提示
        original_content = last_msg.content
        if isinstance(original_content, str):
            new_content = original_content + prompt_text
        elif isinstance(original_content, list):
            new_content = list(original_content) + [{"type": "text", "text": prompt_text}]
        else:
            new_content = str(original_content) + prompt_text

        new_msg = HumanMessage(
            content=new_content,
            additional_kwargs=last_msg.additional_kwargs,
        )

        new_messages = list(request.messages[:-1]) + [new_msg]
        request = request.override(messages=new_messages)

        return await handler(request)

    def _extract_pdf_from_message(self, msg: HumanMessage) -> tuple[bytes, str] | None:
        attachments = msg.additional_kwargs.get("attachments", [])
        if not isinstance(attachments, list):
            return None

        for att in attachments:
            if not isinstance(att, dict):
                continue
            if att.get("mimeType", "").lower() != "application/pdf":
                continue

            data = att.get("data")
            if not data or not isinstance(data, str):
                continue
# type: ignore  My80OmFIVnBZMlhvaklQb3RvVTZNalZEWWc9PTphZDc0NjJhMg==

            try:
                pdf_bytes = _decode_base64(data)
                filename = att.get("metadata", {}).get("filename", "document.pdf")
                return pdf_bytes, filename
            except Exception as e:
                logger.warning("[PDFContextMiddleware] PDF 解码失败: %s", e)
                continue

        return None
