# ============================================================
#  Simple Agentic RAG — Ollama + Qwen2.5 (FREE, local)
#  Requirements: pip install ollama numpy
#  Setup: ollama pull qwen2.5:latest
#         ollama pull nomic-embed-text
# ============================================================

import ollama
import numpy as np

# ── 1. KNOWLEDGE BASE ────────────────────────────────────────
# Normally this comes from PDFs/docs. Here we keep it simple
# with a small list of text chunks.

DOCUMENTS = [
    "The Eiffel Tower is located in Paris, France. It was completed in 1889.",
    "Python is a popular programming language known for its simple syntax.",
    "The Great Wall of China is over 13,000 miles long.",
    "Ollama lets you run large language models locally on your computer.",
    "Mount Everest is the tallest mountain in the world at 8,849 meters.",
    "RAG stands for Retrieval-Augmented Generation, combining search with AI.",
    "Qwen2.5 is an open-source language model developed by Alibaba.",
    "The human brain contains about 86 billion neurons."
]


# ── 2. EMBEDDING + RETRIEVAL TOOL ────────────────────────────

def embed(text: str) -> np.ndarray:
    """Convert text into a vector using an embedding model."""
    response = ollama.embeddings(model="nomic-embed-text", prompt=text)
    return np.array(response["embedding"])


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


# Pre-compute embeddings for all documents (done once at startup)
print("Indexing knowledge base...")
DOC_EMBEDDINGS = [embed(doc) for doc in DOCUMENTS]
print(f"Indexed {len(DOCUMENTS)} documents.\n")


def retrieve_documents(query: str, top_k: int = 2) -> str:
    """
    RETRIEVAL TOOL
    Finds the most relevant documents for a query using embeddings.
    """
    query_vec = embed(query)
    scores = [cosine_similarity(query_vec, doc_vec) for doc_vec in DOC_EMBEDDINGS]

    # Get indices of top-k highest scores
    top_indices = np.argsort(scores)[::-1][:top_k]

    results = []
    for i in top_indices:
        results.append(f"- {DOCUMENTS[i]} (relevance: {scores[i]:.2f})")

    return "\n".join(results)


# ── 3. OTHER TOOLS ────────────────────────────────────────────

def calculator(expression: str) -> str:
    """Evaluate a basic math expression."""
    try:
        allowed = set("0123456789+-*/.() ")
        if not all(c in allowed for c in expression):
            return "Error: invalid characters"
        return str(round(eval(expression), 6))
    except Exception as e:
        return f"Math error: {e}"


# ── 4. TOOL REGISTRY ──────────────────────────────────────────

TOOL_FUNCTIONS = {
    "retrieve_documents": retrieve_documents,
    "calculator": calculator,
}

# ── 5. TOOL DEFINITIONS (Ollama format) ──────────────────────

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "retrieve_documents",
            "description": (
                "Search the knowledge base for relevant information. "
                "Use this whenever the user asks a factual question that "
                "might be answered by stored documents (e.g. about Paris, "
                "Python, mountains, RAG, Qwen, etc.)."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query, based on the user's question."
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "calculator",
            "description": "Evaluate a math expression. Use for arithmetic.",
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string",
                        "description": "A math expression e.g. '8849 / 3.281'"
                    }
                },
                "required": ["expression"]
            }
        }
    }
]

# ── 6. THE AGENTIC RAG CLASS ──────────────────────────────────

class AgenticRAG:
    """
    Agentic RAG = Agent + Retrieval tool.
    The agent DECIDES whether retrieval is needed, rather than
    always retrieving (which is plain RAG).

    Loop: PERCEIVE → THINK → ACT (retrieve/calculate if needed) → RESPOND
    """

    def __init__(self, model: str = "qwen2.5:latest"):
        self.model = model
        self.conversation_history = []
        self.system_prompt = (
            "You are a helpful assistant with access to a knowledge base "
            "and a calculator. Use 'retrieve_documents' when the question "
            "needs factual info that might be stored. Use 'calculator' for math. "
            "If you don't need a tool, answer directly. "
            "Always base factual answers on retrieved documents, not guesses."
        )

    # ── STEP 1: PERCEIVE ──────────────────────────────────────
    def perceive(self, user_message: str):
        print(f"\n[PERCEIVE] User said: {user_message}")
        self.conversation_history.append({"role": "user", "content": user_message})

    # ── STEP 2 & 3: THINK + ACT ───────────────────────────────
    def think_and_act(self) -> str:
        while True:
            print("[THINK]  Sending to Qwen2.5...")

            messages = [{"role": "system", "content": self.system_prompt}] \
                     + self.conversation_history

            response = ollama.chat(
                model=self.model,
                messages=messages,
                tools=TOOL_DEFINITIONS
            )

            message = response["message"]
            tool_calls = message.get("tool_calls") or []

            if tool_calls:
                self.conversation_history.append({
                    "role": "assistant",
                    "content": message.get("content", ""),
                    "tool_calls": tool_calls
                })

                for tool_call in tool_calls:
                    fn = tool_call["function"]
                    tool_name = fn["name"]
                    tool_input = fn.get("arguments", {})

                    print(f"[ACT]    Calling tool: {tool_name}({tool_input})")

                    tool_fn = TOOL_FUNCTIONS.get(tool_name)
                    if tool_fn:
                        arg = next(iter(tool_input.values()), "")
                        result = tool_fn(str(arg))
                    else:
                        result = f"Unknown tool: {tool_name}"

                    print(f"[ACT]    Tool result:\n{result}")

                    self.conversation_history.append({
                        "role": "tool",
                        "content": result
                    })
                # loop again so the AI can use the retrieved info

            else:
                final_text = message.get("content", "")
                self.conversation_history.append({"role": "assistant", "content": final_text})
                return final_text

    # ── STEP 4: RESPOND ───────────────────────────────────────
    def respond(self, answer: str):
        print(f"\n[RESPOND] Agent: {answer}\n")
        print("─" * 50)

    # ── FULL LOOP ─────────────────────────────────────────────
    def run(self, user_message: str) -> str:
        self.perceive(user_message)
        answer = self.think_and_act()
        self.respond(answer)
        return answer


# ── 7. MAIN — INTERACTIVE CHAT LOOP ──────────────────────────

def main():
    print("=" * 50)
    print("  Agentic RAG — Qwen2.5 via Ollama (FREE & local)")
    print("  Type 'quit' to exit")
    print("=" * 50)
    print("Try asking:")
    print("  • Where is the Eiffel Tower?")
    print("  • What is RAG?")
    print("  • How tall is Mount Everest in feet? (8849 / 0.3048)")
    print("  • What is 12 * 9?  (no retrieval needed)")
    print("  • Tell me a joke.  (no tool needed)")
    print()

    agent = AgenticRAG(model="qwen2.5:latest")

    while True:
        user_input = input("You: ").strip()
        if not user_input:
            continue
        if user_input.lower() in ("quit", "exit", "bye"):
            print("Agent: Goodbye!")
            break
        agent.run(user_input)


if __name__ == "__main__":
    main()