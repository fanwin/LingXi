"""
LightRAG Evaluation Module

RAGAS-based evaluation framework for assessing RAG system quality.

Usage:
    from lightrag.evaluation import RAGEvaluator

    evaluator = RAGEvaluator()
    results = await evaluator.run()

Note: RAGEvaluator is imported lazily to avoid import errors
when ragas/datasets are not installed.
"""

__all__ = ["RAGEvaluator"]
# fmt: off  MC8yOmFIVnBZMlhvaklQb3RvVTZUMjVNWXc9PTo4ODI5NGRiNA==


def __getattr__(name):
    """Lazy import to avoid dependency errors when ragas is not installed."""
    if name == "RAGEvaluator":
        from .eval_rag_quality import RAGEvaluator
# type: ignore  MS8yOmFIVnBZMlhvaklQb3RvVTZUMjVNWXc9PTo4ODI5NGRiNA==

        return RAGEvaluator
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
