import httpx
from fastmcp import FastMCP
from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

mcp = FastMCP("Demo 🚀")


class ConversationHistoryItem(BaseModel):
    """Conversation history item"""
    additionalProp1: Optional[Dict[str, Any]] = None


class QueryRequest(BaseModel):
    """RAG query request parameters"""
    query: str = Field(..., min_length=3, description="The search query to analyze (min 3 characters)")
    mode: str = Field(default="mix", description="Retrieval strategy: local, global, hybrid, naive, mix, bypass")
    only_need_context: Optional[bool] = Field(default=False, description="Only return context without LLM generation")
    only_need_prompt: Optional[bool] = Field(default=False, description="Only return prompt without LLM generation")
    response_type: Optional[str] = Field(default=None, description="Response type format")
    top_k: Optional[int] = Field(default=10, description="Number of top entities/relationships to retrieve")
    chunk_top_k: Optional[int] = Field(default=5, description="Number of text chunks to retrieve")
    max_entity_tokens: Optional[int] = Field(default=1000, description="Token limit for entity context")
    max_relation_tokens: Optional[int] = Field(default=2000, description="Token limit for relationship context")
    max_total_tokens: Optional[int] = Field(default=4000, description="Overall token budget for retrieval")
    hl_keywords: Optional[List[str]] = Field(default=None, description="High-level keywords for bypass mode")
    ll_keywords: Optional[List[str]] = Field(default=None, description="Low-level keywords for bypass mode")
    conversation_history: Optional[List[ConversationHistoryItem]] = Field(default=None, description="Previous conversation context")
    user_prompt: Optional[str] = Field(default=None, description="Custom user prompt for query")
    enable_rerank: Optional[bool] = Field(default=True, description="Enable result reranking")
    include_references: Optional[bool] = Field(default=True, description="Include source references in response")
    include_chunk_content: Optional[bool] = Field(default=False, description="Include full chunk content")
    stream: Optional[bool] = Field(default=False, description="Enable streaming response")


class Entity(BaseModel):
    """Knowledge graph entity"""
    entity_name: str
    entity_type: str
    description: str
    source_id: str
    file_path: str
    reference_id: str


class Relationship(BaseModel):
    """Relationship between entities"""
    src_id: str
    tgt_id: str
    description: str
    keywords: str
    weight: float
    source_id: str
    file_path: str
    reference_id: str


class Chunk(BaseModel):
    """Text chunk from documents"""
    content: str
    file_path: str
    chunk_id: str
    reference_id: str


class Reference(BaseModel):
    """Citation reference information"""
    reference_id: str
    file_path: str


class ProcessingInfo(BaseModel):
    """Query processing statistics"""
    total_entities_found: int
    total_relations_found: int
    entities_after_truncation: int
    relations_after_truncation: int
    final_chunks_count: int


class Keywords(BaseModel):
    """Extracted keywords from query"""
    high_level: List[str]
    low_level: List[str]


class Metadata(BaseModel):
    """Query metadata and processing information"""
    query_mode: str
    keywords: Keywords
    processing_info: ProcessingInfo


class QueryData(BaseModel):
    """Complete retrieval results"""
    entities: List[Entity]
    relationships: List[Relationship]
    chunks: List[Chunk]
    references: List[Reference]


class QueryDataResponse(BaseModel):
    """RAG query data response"""
    status: str
    message: str
    data: QueryData
    metadata: Metadata


RAG_API_BASE_URL = "http://localhost:9621"  # RAG系统API地址


@mcp.tool
def get_weather(city: str) -> str:
    """Get the weather in a city"""
    return f"Weather in {city} is sunny with a temperature of 25°C."


@mcp.tool
async def query_data(
    query: str,
    mode: str = "mix",
    only_need_context: bool = False,
    only_need_prompt: bool = False,
    response_type: Optional[str] = None,
    top_k: int = 10,
    chunk_top_k: int = 5,
    max_entity_tokens: int = 1000,
    max_relation_tokens: int = 2000,
    max_total_tokens: int = 4000,
    hl_keywords: Optional[List[str]] = None,
    ll_keywords: Optional[List[str]] = None,
    user_prompt: Optional[str] = None,
    enable_rerank: bool = True,
    include_references: bool = True,
    include_chunk_content: bool = False,
    stream: bool = False,
) -> str:
    """
    从RAG系统查询数据，支持高级数据检索和结构化分析。
    
    该工具提供原始检索结果，适用于：
    - 数据分析：检查RAG使用的信息
    - 系统集成：获取结构化数据进行自定义处理
    - 调试：了解检索行为和质量
    - 研究：分析知识图谱结构和关系
    
    查询模式说明：
    - local: 返回实体及其直接关系+相关文本块
    - global: 返回知识图谱中的关系模式
    - hybrid: 结合local和global检索策略
    - naive: 仅返回向量检索的文本块（无知识图谱）
    - mix: 整合知识图谱数据与向量检索的文本块
    - bypass: 返回空数据数组（用于直接LLM查询）
    
    Args:
        query: 搜索查询（至少3个字符）
        mode: 检索策略，可选值：local, global, hybrid, naive, mix, bypass
        only_need_context: 仅返回上下文，不进行LLM生成
        only_need_prompt: 仅返回提示词，不进行LLM生成
        response_type: 响应类型格式
        top_k: 要检索的顶级实体/关系数量
        chunk_top_k: 要检索的文本块数量
        max_entity_tokens: 实体上下文的token限制
        max_relation_tokens: 关系上下文的token限制
        max_total_tokens: 检索的总体token预算
        hl_keywords: 高级关键词（用于bypass模式）
        ll_keywords: 低级关键词（用于bypass模式）
        user_prompt: 自定义用户提示词
        enable_rerank: 启用结果重排序
        include_references: 在响应中包含源引用
        include_chunk_content: 包含完整文本块内容
        stream: 启用流式响应
    
    Returns:
        JSON格式的查询结果，包含实体、关系、文本块、引用和元数据
    """
    payload = {
        "query": query,
        "mode": mode,
        "only_need_context": only_need_context,
        "only_need_prompt": only_need_prompt,
        "top_k": top_k,
        "chunk_top_k": chunk_top_k,
        "max_entity_tokens": max_entity_tokens,
        "max_relation_tokens": max_relation_tokens,
        "max_total_tokens": max_total_tokens,
        "enable_rerank": enable_rerank,
        "include_references": include_references,
        "include_chunk_content": include_chunk_content,
        "stream": stream,
    }
    
    # 添加可选参数
    if response_type is not None:
        payload["response_type"] = response_type
    if hl_keywords is not None:
        payload["hl_keywords"] = hl_keywords
    if ll_keywords is not None:
        payload["ll_keywords"] = ll_keywords
    if user_prompt is not None:
        payload["user_prompt"] = user_prompt
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{RAG_API_BASE_URL}/query/data",
                json=payload,
                timeout=60.0
            )
            response.raise_for_status()
            result = response.json()
            return f"RAG查询成功！\n\n```json\n{__import__('json').dumps(result, ensure_ascii=False, indent=2)}\n```"
        except httpx.HTTPStatusError as e:
            return f"RAG查询失败: HTTP {e.response.status_code} - {e.response.text}"
        except httpx.ConnectError:
            return f"RAG查询失败: 无法连接到RAG服务 ({RAG_API_BASE_URL})，请检查服务是否运行"
        except Exception as e:
            return f"RAG查询失败: {str(e)}"

if __name__ == "__main__":
    # 端口默认是8000
    mcp.run(transport="http")