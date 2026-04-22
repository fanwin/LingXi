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

from agents.testcase.excel_exporter import export_test_cases_to_excel

# MCP服务器配置
MCP_SERVER_CONFIGS = {
    "rag-server": {
        # SSE 服务端点 URL
        "url": "http://localhost:8000/mcp",
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


# RAG 系统提示词扩展
RAG_SYSTEM_PROMPT_APPENDIX = """

---

## 附录：RAG工具使用指南

### 可用RAG工具列表

{rag_tools_description}

### RAG检索最佳实践

**关键词构建技巧**：
- 使用模块名称 + 操作类型组合：如 "登录功能测试要点"
- 使用业务对象 + 场景：如 "订单状态流转规则"
- 使用技术术语 + 测试维度：如 "API接口安全测试"

**多工具并行策略**：
当有多个RAG工具可用时，应对同一查询并行调用所有工具，综合各工具的检索结果。

**结果处理规范**：
1. 优先采用检索结果中置信度高的信息
2. 多个来源信息冲突时，标注差异并说明采用的依据
3. 检索结果不足以支撑分析时，明确标注信息缺口

### 示例：登录功能需求分析时的RAG检索

```
用户需求："帮我设计登录功能的测试用例"

正确的RAG检索过程：
1. 提取关键词：["登录", "Login", "认证", "Authentication"]
2. 构建检索查询："登录功能测试要点"、"认证模块业务规则"
3. 调用RAG工具：query_knowledge_base(query="登录功能测试要点")
4. 检索结果分析：
   - [RAG检索] 发现历史用例包含：验证码时效、密码强度、并发登录限制
   - [RAG检索] 发现业务规则：同一账号5分钟内最多3次错误尝试
5. 融入需求分析：将上述约束纳入测试矩阵
```

⚠️ **重要**：RAG检索是Phase 1.1的强制步骤，未完成检索前不得进入Phase 2。
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
    return [export_testcases_to_excel] + rag_mcp_tools()
