from deepagents.middleware._utils import append_to_system_message
from langchain.agents.middleware import AgentMiddleware, ModelRequest

from app.agents.testcase.tools import rag_mcp_tools, get_tool_name, RAG_SYSTEM_PROMPT_APPENDIX, \
    format_rag_tools_description


class RAGMiddleware(AgentMiddleware):
    """根据 enable_rag 动态控制 RAG 工具和系统提示词。"""

    def __init__(self) -> None:
        super().__init__()
        self._rag_tools = None
        self._rag_tool_names_set = None

    @property
    def tools(self):
        if self._rag_tools is None:
            self._rag_tools = rag_mcp_tools()
        return self._rag_tools

    def _get_rag_tool_names(self):
        if self._rag_tool_names_set is None:
            self._rag_tool_names_set = {tool.name for tool in self.tools}
        return self._rag_tool_names_set

    def _is_rag_tool(self, tool):
        return get_tool_name(tool) in self._get_rag_tool_names()

    def _inject_rag_prompt(self, request: ModelRequest) -> ModelRequest:
        rag_appendix = RAG_SYSTEM_PROMPT_APPENDIX.format(
            rag_tools_description=format_rag_tools_description()
        )
        new_system_message = append_to_system_message(request.system_message, rag_appendix)
        return request.override(system_message=new_system_message)

    def _filter_rag_tools(self, request: ModelRequest) -> ModelRequest:
        filtered = [tool for tool in request.tools if not self._is_rag_tool(tool)]
        return request.override(tools=filtered)

    def _is_rag_enabled(self, request: ModelRequest) -> bool:
        context = getattr(request.runtime, "context", None) if request.runtime else None
        return getattr(context, "enable_rag", False) if context else False

    def wrap_model_call(self, request, handler):
        if self._is_rag_enabled(request):
            return handler(self._inject_rag_prompt(request))
        return handler(self._filter_rag_tools(request))

    async def awrap_model_call(self, request, handler):
        if self._is_rag_enabled(request):
            return await handler(self._inject_rag_prompt(request))
        return await handler(self._filter_rag_tools(request))
