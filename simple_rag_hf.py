import warnings
warnings.filterwarnings('ignore')

from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings, HuggingFacePipeline
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from transformers import pipeline, AutoModelForSeq2SeqLM, AutoTokenizer

documents = [
    Document(page_content="The secret password to the spaceship is 'Starlight'."),
    Document(page_content="The spaceship was built in 2042 on Mars."),
    Document(page_content="Captain Zara is the commander of the spaceship.")
]

def main():
    print("1. Loading Embeddings Model (all-MiniLM-L6-v2)...")
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    print("2. Building Vector Database (FAISS)...")
    vectorstore = FAISS.from_documents(documents, embeddings)
    retriever = vectorstore.as_retriever(search_kwargs={"k": 2})

    print("3. Loading Local LLM (Qwen2.5-0.5B-Instruct)...")
    model_id = "Qwen/Qwen2.5-0.5B-Instruct"
    from transformers import AutoModelForCausalLM
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
        
    model = AutoModelForCausalLM.from_pretrained(model_id)
    
    pipe = pipeline(
        "text-generation",
        model=model,
        tokenizer=tokenizer,
        max_new_tokens=100
    )
    llm = HuggingFacePipeline(pipeline=pipe)

    print("4. Creating the RAG Chain...")
    template = """Use the following context to answer the question. 
    Context: {context}
    Question: {question}
    Answer:"""
    prompt = PromptTemplate.from_template(template)

    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    print("\n--- RAG is Ready! ---")
    while True:
        question = input("\nAsk a question (or type 'quit' to exit): ")
        if question.lower() in ['quit', 'exit', 'q']:
            break
            
        if not question.strip():
            continue
            
        print("Thinking... (this might take a few seconds on CPU)")
        response = rag_chain.invoke(question)
        print(f"\nAnswer: {response.strip()}")

if __name__ == "__main__":
    main()
