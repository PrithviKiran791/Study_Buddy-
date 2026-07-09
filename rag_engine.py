import fitz  # PyMuPDF
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

# Load a lightweight, performant embedding model locally
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

class PDFRagSystem:
    def __init__(self):
        self.chunks = []
        self.index = None

    def process_pdf(self, file_bytes, chunk_size=500, chunk_overlap=100):
        """Extracts text from PDF, splits into overlapping chunks, and builds a FAISS vector index."""
        # Extract text
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        full_text = ""
        for page in doc:
            full_text += page.get_text() + "\n"

        # Simple sliding-window token/word chunking
        words = full_text.split()
        self.chunks = []
        
        for i in range(0, len(words), chunk_size - chunk_overlap):
            chunk = " ".join(words[i:i + chunk_size])
            if chunk.strip():
                self.chunks.append(chunk)

        if not self.chunks:
            return False

        # Generate Embeddings
        embeddings = embedding_model.encode(self.chunks, show_progress_bar=False)
        embeddings = np.array(embeddings).astype("float32")

        # Initialize and build FAISS Index
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(embeddings)
        return True

    def retrieve_context(self, query, top_k=3):
        """Embeds the query and fetches the top K most contextually relevant chunks."""
        if self.index is None or not self.chunks:
            return ""

        query_embedding = embedding_model.encode([query]).astype("float32")
        distances, indices = self.index.search(query_embedding, top_k)

        retrieved_chunks = []
        for idx in indices[0]:
            if idx < len(self.chunks):
                retrieved_chunks.append(self.chunks[idx])

        return "\n\n--- Context Block ---\n\n".join(retrieved_chunks)