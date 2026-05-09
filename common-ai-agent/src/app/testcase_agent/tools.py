"""测试用例Agent的工具定义。

此模块包含所有可用的工具定义，包括：
- 基础工具：导出测试用例到Excel
- 代码工具：代码打包下载
- RAG工具：通过MCP客户端获取的检索增强工具
"""

import asyncio
import base64
import json
import os
import zipfile
from functools import lru_cache
from typing import Union

from langchain.tools import tool
from langchain_core.tools import BaseTool
from langchain_mcp_adapters.client import MultiServerMCPClient

from app.testcase_agent.excel_exporter import export_test_cases_to_excel
# from app.processors.pdf import extract_pdf_text_from_file

# MCP服务器配置
MCP_SERVER_CONFIGS = {
    "rag-server": {
        # SSE 服务端点 URL
        "url": "http://127.0.0.1:8001/mcp",
        # 传输协议：sse (Server-Sent Events)
        "transport": "http",
    }
}


@tool
def export_testcases_to_excel(test_cases: list, output_path: str, sheet_name: str = "测试用例") -> str:
    """
    将测试用例列表导出为 Excel 文件。

    当用户要求导出 Excel 格式、或需要将用例导入禅道/Tapd/TestRail 等工具时调用。

    Args:
        test_cases: 测试用例列表，每条用例为字典，包含以下字段：
            - id / 用例编号（必填）
            - title / 用例标题（必填）
            - module / 所属模块
            - type / 用例类型（功能测试/接口测试/安全测试/性能测试/兼容测试等）
            - priority / 优先级（P0/P1/P2/P3）
            - preconditions / 前置条件（字符串或字符串列表）
            - steps / 测试步骤（字典列表，每个字典包含 seq/action/target/data）
            - test_data / 测试数据（字符串或字典）
            - expected_results / 预期结果（字符串或字符串列表）
            - remarks / 备注
        output_path: 导出的 Excel 文件路径，建议放在工作目录下，如 "./exports/测试用例.xlsx"
        sheet_name: 工作表名称，默认为 "测试用例"

    Returns:
        JSON 字符串，包含文件绝对路径和 base64 编码的文件内容（供前端直接下载）。
        格式：{"file_path": "...", "base64_data": "...", "filename": "..."}
    """
    file_path = export_test_cases_to_excel(test_cases, output_path, sheet_name)

    # 读取文件并编码为 base64，使前端可直接通过 Blob 下载
    try:
        with open(file_path, "rb") as f:
            b64_data = base64.b64encode(f.read()).decode("ascii")
        filename = __import__("pathlib").Path(file_path).name or "测试用例.xlsx"
    except Exception as e:
        print(f"[export_testcases_to_excel] 读取文件失败: {e}")
        b64_data = ""
        filename = ""

    result = json.dumps({
        "file_path": file_path,
        "base64_data": b64_data,
        "filename": filename,
    }, ensure_ascii=False)
    return result


@tool
def export_code_to_zip(code_files: list, output_filename: str = "generated_code.zip") -> str:
    """
    将本次会话中生成的所有代码文件打包为 ZIP 下载。

    当对话中生成代码文件时自动调用此工具，将代码打包供用户下载。
    支持任意编程语言（.py/.js/.ts/.java/.go/.rs/.vue/.tsx 等）。

    Args:
        code_files: 代码文件列表，每项为字典，包含以下字段：
            - filename: 文件名，含扩展名（必填），如 "main.py"、"App.tsx"
            - content: 文件完整内容（必填）
            - language: 编程语言标识（可选），如 "python" / "typescript" / "javascript"
        output_filename: 输出的 ZIP 文件名，默认 "generated_code.zip"

    Returns:
        JSON 字符串，包含：
        {
            "file_path": "ZIP 文件绝对路径",
            "base64_data": "ZIP 的 base64 编码（前端可直接下载）",
            "filename": "ZIP 文件名",
            "file_list": [
                {"filename": "...", "language": "...", "size_bytes": ...}
            ]
        }
    """
    # 创建输出目录
    exports_dir = os.path.join(os.getcwd(), "exports")
    os.makedirs(exports_dir, exist_ok=True)

    zip_path = os.path.join(exports_dir, output_filename)

    file_list_meta = []

    try:
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for idx, cf in enumerate(code_files):
                fname = cf.get("filename", f"code_file_{idx + 1}")
                content = cf.get("content", "")
                language = cf.get("language", "")

                # 安全化文件名：防止路径穿越
                safe_name = os.path.basename(fname)
                if not safe_name:
                    safe_name = f"code_file_{idx + 1}.txt"

                # 写入 ZIP
                zf.writestr(safe_name, content)

                file_list_meta.append({
                    "filename": safe_name,
                    "language": language or _detect_language(safe_name),
                    "size_bytes": len(content.encode("utf-8")),
                })

        print(f"[export_code_to_zip] 已打包 {len(code_files)} 个文件 → {zip_path}")

    except Exception as e:
        print(f"[export_code_to_zoom] 打包失败: {e}")
        import traceback
        traceback.print_exc()
        raise

    # 读取并 base64 编码
    try:
        with open(zip_path, "rb") as f:
            b64_data = base64.b64encode(f.read()).decode("ascii")
    except Exception as e:
        print(f"[export_code_to_zip] 读取 ZIP 失败: {e}")
        b64_data = ""

    result = json.dumps({
        "file_path": zip_path,
        "base64_data": b64_data,
        "filename": output_filename,
        "file_count": len(file_list_meta),
        "file_list": file_list_meta,
    }, ensure_ascii=False)

    return result


def _detect_language(filename: str) -> str:
    """根据文件扩展名检测编程语言。"""
    ext_map = {
        ".py": "python",
        ".js": "javascript",
        ".jsx": "javascript",
        ".ts": "typescript",
        ".tsx": "typescript",
        ".java": "java",
        ".go": "go",
        ".rs": "rust",
        ".c": "c",
        ".cpp": "cpp",
        ".h": "c",
        ".hpp": "cpp",
        ".cs": "csharp",
        ".rb": "ruby",
        ".php": "php",
        ".swift": "swift",
        ".kt": "kotlin",
        ".scala": "scala",
        ".r": "r",
        ".sql": "sql",
        ".sh": "bash",
        ".bash": "bash",
        ".yaml": "yaml",
        ".yml": "yaml",
        ".json": "json",
        ".xml": "xml",
        ".html": "html",
        ".css": "css",
        ".scss": "scss",
        ".less": "less",
        ".md": "markdown",
        ".vue": "vue",
        ".svelte": "svelte",
        ".dockerfile": "dockerfile",
        ".toml": "toml",
        ".ini": "ini",
        ".cfg": "ini",
        ".txt": "text",
    }
    _, ext = os.path.splitext(filename.lower())
    return ext_map.get(ext, "text")


@lru_cache(maxsize=1)
def _cached_rag_tools() -> tuple[BaseTool, ...]:
    """缓存RAG工具列表，避免重复创建MCP客户端。
    
    Returns:
        RAG工具的元组（不可变，可缓存）
    """
    client = MultiServerMCPClient(MCP_SERVER_CONFIGS)
    tools = asyncio.run(client.get_tools())
    return tuple(tools)


def rag_mcp_tools() -> list[BaseTool]:
    """获取RAG MCP工具列表。
    
    通过MCP客户端从远程服务器获取RAG检索工具。
    结果会被缓存以避免重复创建连接。
    
    Returns:
        RAG工具列表
    """
    return list(_cached_rag_tools())


def get_rag_tool_names() -> set[str]:
    """获取RAG工具的名称集合，用于识别和过滤。"""
    return {tool.name for tool in rag_mcp_tools()}


def get_tool_name(tool: Union[BaseTool, dict]) -> str:
    """获取工具名称，支持 BaseTool 对象和字典格式。
    
    Args:
        tool: 工具对象（BaseTool 或 dict）
        
    Returns:
        工具名称字符串
    """
    if isinstance(tool, dict):
        return tool.get("name", "")
    return getattr(tool, "name", "")


# RAG 系统提示词扩展（已精简，详细规范请参见 rag-query Skill）
RAG_SYSTEM_PROMPT_APPENDIX = """

---
 
## 附录：可用 RAG 工具列表

{rag_tools_description}

> 详细的 RAG 检索策略、mode 选择规范、结果引用规范等，请严格遵循 `rag-query` Skill 执行。
"""


def format_rag_tools_description() -> str:
    """格式化RAG工具描述，用于系统提示词。
    
    Returns:
        RAG工具描述文本
    """
    tools = rag_mcp_tools()
    if not tools:
        return "（暂无RAG工具配置）"
    
    descriptions = []
    for tool in tools:
        desc = getattr(tool, 'description', '无描述')
        descriptions.append(f"- **{tool.name}**: {desc}")
    return "\n".join(descriptions)


def get_all_tools() -> list:
    """获取所有可用工具的完整列表。
    
    包括基础工具和RAG工具，用于在 create_agent 中注册。
    
    Returns:
        所有工具的列表
    """
    # return [export_testcases_to_excel, extract_pdf_text_from_file] + rag_mcp_tools()
    return [export_testcases_to_excel, export_code_to_zip] + rag_mcp_tools()


def get_base_tools() -> list:
    """获取基础工具列表（不包含RAG工具）。
    
    Returns:
        基础工具列表
    """
    return [export_testcases_to_excel, extract_pdf_text_from_file]
