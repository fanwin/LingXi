from langchain_pymupdf4llm import PyMuPDF4LLMLoader

file_path = "接口文档.pdf"
loader = PyMuPDF4LLMLoader(file_path, mode="page")
docs = loader.load()
print(docs)

from langchain_ollama import OllamaEmbeddings

# embeddings = OllamaEmbeddings(
#     base_url="http://104.233.187.228:11434",
#     model="qwen3-embedding:0.6b",
# )

from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings(
    model="text-embedding-v4",
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
    api_key="sk-你的密钥",
    dimensions=1024,
    check_embedding_ctx_length=False,  # 关键：禁用 tiktoken 分片，直接发送原始文本
    chunk_size=10,  # 阿里云限制单次最多 10 条
)

# s = embeddings.embed_documents([docs[i].page_content for i in range(len(docs))])
# 优化以下上述代码 docs的元素很多，需要批量处理

# print(s)




# Create a vector store with a sample text
from langchain_core.vectorstores import InMemoryVectorStore

# 确保所有 page_content 均为字符串，并过滤空值
texts = [str(d.page_content) for d in docs if d.page_content is not None and str(d.page_content).strip()]

# 内存级的向量数据库，将文档向量化存储
vectorstore = InMemoryVectorStore.from_texts(
    texts,
    embedding=embeddings,
)
# ---------------------以上是数据的向量化存储---------------------
# # Use the vectorstore as a retriever
# 创建一个检索器，从向量数据库中检索最相似的文档
retriever = vectorstore.as_retriever(k=3)
#
# # Retrieve the most similar text
retrieved_documents = retriever.invoke("请求信息包含哪些内容")
#
# # Show the retrieved document's content
print(retrieved_documents[0].page_content)