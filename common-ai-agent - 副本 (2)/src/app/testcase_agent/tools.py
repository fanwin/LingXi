"""测试用例Agent的工具定义。

此模块包含所有可用的工具定义，包括：
- 基础工具：导出测试用例到Excel
- RAG工具：通过MCP客户端获取的检索增强工具
"""

import asyncio
from functools import lru_cache
from typing import Union

from langchain.tools import tool
from langchain_core.tools import BaseTool
from langchain_mcp_adapters.client import MultiServerMCPClient

from app.testcase_agent.excel_exporter import export_test_cases_to_excel
from app.processors.pdf import extract_pdf_text_from_file

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
        导出成功的文件绝对路径
    """
    return export_test_cases_to_excel(test_cases, output_path, sheet_name)


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
    return [export_testcases_to_excel, extract_pdf_text_from_file] + rag_mcp_tools()


def get_base_tools() -> list:
    """获取基础工具列表（不包含RAG工具）。
    
    Returns:
        基础工具列表
    """
    return [export_testcases_to_excel, extract_pdf_text_from_file]
