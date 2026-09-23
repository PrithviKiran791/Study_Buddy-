import os
import numpy as np

# Safe import for PyMuPDF (fitz)
try:
    import fitz
except ImportError:
    fitz = None

# Optional imports for neural embeddings and FAISS
try:
    import faiss
    from sentence_transformers import SentenceTransformer
    NEURAL_RAG_AVAILABLE = True
except ImportError:
    faiss = None
    SentenceTransformer = None
    NEURAL_RAG_AVAILABLE = False

# Fallback TF-IDF vectorizer from scikit-learn
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    TFIDF_AVAILABLE = True
except ImportError:
    TfidfVectorizer = None
    cosine_similarity = None
    TFIDF_AVAILABLE = False

RAG_AVAILABLE = (fitz is not None) and (NEURAL_RAG_AVAILABLE or TFIDF_AVAILABLE)

_embedding_model = None


def get_embedding_model():
    global _embedding_model
    if _embedding_model is None and SentenceTransformer is not None:
        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedding_model


class PDFRagSystem:
    def __init__(self):
        self.chunks = []
        self.index = None
        self.vectorizer = None
        self.tfidf_matrix = None
        self.mode = None

    def process_pdf(self, file_bytes: bytes, chunk_size: int = 500, chunk_overlap: int = 100) -> bool:
        """Extracts text from PDF, splits into overlapping chunks, and builds an index."""
        if fitz is None:
            raise RuntimeError("PyMuPDF (fitz) is not installed. Run 'pip install pymupdf' to enable PDF processing.")

        doc = fitz.open(stream=file_bytes, filetype="pdf")
        if doc.is_encrypted:
            doc.authenticate("")

        full_text = ""
        for page in doc:
            page_text = page.get_text()
            if page_text:
                full_text += page_text + "\n"

        # Simple sliding-window token/word chunking
        words = full_text.split()
        if not words:
            return False

        self.chunks = []
        step = max(1, chunk_size - chunk_overlap)
        for i in range(0, len(words), step):
            chunk = " ".join(words[i:i + chunk_size])
            if chunk.strip():
                self.chunks.append(chunk)

        if not self.chunks:
            return False

        # Build search index
        if NEURAL_RAG_AVAILABLE and faiss is not None and SentenceTransformer is not None:
            model = get_embedding_model()
            embeddings = model.encode(self.chunks, show_progress_bar=False)
            embeddings = np.array(embeddings).astype("float32")
            dimension = embeddings.shape[1]
            self.index = faiss.IndexFlatL2(dimension)
            self.index.add(embeddings)
            self.mode = "neural"
        elif TFIDF_AVAILABLE and TfidfVectorizer is not None:
            self.vectorizer = TfidfVectorizer(stop_words="english", max_features=10000)
            self.tfidf_matrix = self.vectorizer.fit_transform(self.chunks)
            self.mode = "tfidf"
        else:
            self.mode = "simple"

        return True

    def retrieve_context(self, query: str, top_k: int = 3) -> str:
        """Fetches the top K most contextually relevant chunks for the query."""
        if not self.chunks:
            return ""

        retrieved_chunks = []

        if self.mode == "neural" and self.index is not None:
            model = get_embedding_model()
            if model is not None:
                query_embedding = model.encode([query]).astype("float32")
                distances, indices = self.index.search(query_embedding, top_k)
                for idx in indices[0]:
                    if idx < len(self.chunks):
                        retrieved_chunks.append(self.chunks[idx])

        elif self.mode == "tfidf" and self.vectorizer is not None and self.tfidf_matrix is not None:
            query_vec = self.vectorizer.transform([query])
            sims = cosine_similarity(query_vec, self.tfidf_matrix)[0]
            top_indices = np.argsort(sims)[::-1][:top_k]
            for idx in top_indices:
                if sims[idx] > 0 and idx < len(self.chunks):
                    retrieved_chunks.append(self.chunks[idx])

        if not retrieved_chunks:
            retrieved_chunks = self.chunks[:top_k]

        return "\n\n--- Context Block ---\n\n".join(retrieved_chunks)