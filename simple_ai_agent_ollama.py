# ============================================================
#  Simple Beginner AI Agent — Ollama + Qwen2.5 (FREE, local)
#  Requirements: pip install ollama
#  Setup: install Ollama from https://ollama.com
#         then run: ollama pull qwen2.5:latest
# ============================================================

# pyrefly: ignore [missing-import]
import ollama
import datetime
import json

# ── 1. TOOLS ────────────────────────────────────────────────

def calculator(expression: str) -> str:
    """Evaluate a basic math expression safely."""
    try:
        allowed = set("0123456789+-*/.() ")
        if not all(c in allowed for c in expression):
            return "Error: invalid characters"
        result = eval(expression)
        return str(round(result, 6))
    except Exception as e:
        return f"Math error: {e}"


def get_current_time(_: str = "") -> str:
    """Return the current date and time."""
    now = datetime.datetime.now()
    return now.strftime("%A, %B %d %Y — %I:%M %p")


def word_counter(text: str) -> str:
    """Count words, characters, and sentences in text."""
    words = len(text.split())
    chars = len(text)
    sentences = text.count(".") + text.count("!") + text.count("?")
    return f"{words} words, {chars} characters, {sentences} sentences"


# ── 2. TOOL REGISTRY ────────────────────────────────────────

TOOL_FUNCTIONS = {
    "calculator":      calculator,
    "get_current_time": get_current_time,
    "word_counter":    word_counter,
}

# ── 3. TOOL DEFINITIONS (Ollama format) ─────────────────────

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "calculator",
            "description": "Evaluate a math expression. Use for any arithmetic or numeric calculations.",
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string",
                        "description": "A valid math expression e.g. '42 * 17' or '(100 - 30) / 2'"
                    }
                },
                "required": ["expression"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_current_time",
            "description": "Get the current date and time.",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "word_counter",
            "description": "Count the number of words, characters, and sentences in a given text.",
            "parameters": {
                "type": "object",
                "properties": {
                    "text": {
                        "type": "string",
                        "description": "The text to analyze."
                    }
                },
                "required": ["text"]
            }
        }
    }
]

# ── 4. THE AGENT CLASS ───────────────────────────────────────

class SimpleAgent:
    """
    Beginner AI Agent using Ollama + Qwen2.5 (local, free).
    Loop: PERCEIVE → THINK → ACT → RESPOND
    """

    def __init__(self, model: str = "qwen2.5:latest"):
        self.model = model
        self.conversation_history = []
        self.system_prompt = (
            "You are a helpful AI assistant with access to tools. "
            "Use tools whenever they give a more accurate answer "
            "(e.g. for math, time, or text analysis). "
            "Be concise and friendly."
        )

    # ── STEP 1: PERCEIVE ──────────────────────────────────────
    def perceive(self, user_message: str):
        print(f"\n[PERCEIVE] User said: {user_message}")
        self.conversation_history.append({
            "role": "user",
            "content": user_message
        })

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

            # If the model wants to call a tool
            if tool_calls:
                print(f"[THINK]  Model wants to use a tool")
                self.conversation_history.append({
                    "role": "assistant",
                    "content": message.get("content", ""),
                    "tool_calls": tool_calls
                })

                # Execute each tool call
                for tool_call in tool_calls:
                    fn = tool_call["function"]
                    tool_name  = fn["name"]
                    tool_input = fn.get("arguments", {})

                    print(f"[ACT]    Calling tool: {tool_name}({tool_input})")

                    tool_fn = TOOL_FUNCTIONS.get(tool_name)
                    if tool_fn:
                        arg = next(iter(tool_input.values()), "")
                        result = tool_fn(str(arg))
                    else:
                        result = f"Unknown tool: {tool_name}"

                    print(f"[ACT]    Tool result: {result}")

                    # Feed result back into conversation
                    self.conversation_history.append({
                        "role": "tool",
                        "content": result
                    })
                # Loop again for the final answer

            # No tool call — final answer
            else:
                final_text = message.get("content", "")
                self.conversation_history.append({
                    "role": "assistant",
                    "content": final_text
                })
                return final_text

    # ── STEP 4: RESPOND ───────────────────────────────────────
    def respond(self, answer: str):
        print(f"\n[RESPOND] Agent: {answer}\n")
        print("─" * 50)

    # ── FULL AGENT LOOP ───────────────────────────────────────
    def run(self, user_message: str) -> str:
        self.perceive(user_message)
        answer = self.think_and_act()
        self.respond(answer)
        return answer


# ── 5. MAIN — INTERACTIVE CHAT LOOP ─────────────────────────

def main():
    print("=" * 50)
    print("  AI Agent — Qwen2.5 via Ollama (FREE & local)")
    print("  Type 'quit' to exit")
    print("=" * 50)
    print("Try asking:")
    print("  • What is 256 * 48?")
    print("  • What time is it?")
    print("  • Count the words in: The quick brown fox jumps.")
    print("  • What is the capital of India?")
    print()

    agent = SimpleAgent(model="qwen2.5:latest")

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