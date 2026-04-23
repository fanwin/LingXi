import asyncio

from langchain.agents import create_agent
from langchain_mcp_adapters.client import MultiServerMCPClient

from core.llms import deepseek_model
client = MultiServerMCPClient(
        {
            "weather": {
                "transport": "http",  # HTTP-based remote server
                # Ensure you start your weather server on port 8000
                "url": "http://localhost:8000/mcp",
            },
            # "research": {
            #     "transport": "http",  # HTTP-based remote server
            #     # Ensure you start your news server on port 8001
            #     "url": "https://mcp.tavily.com/mcp/?tavilyApiKey=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",
            # },
        }
    )
tools = asyncio.run(client.get_tools())
agent = create_agent(
    model=deepseek_model,
    tools=tools,
)
