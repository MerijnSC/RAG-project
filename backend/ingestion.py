# from utils2 import embed#, sentence_chunk
from test_embed import sentence_chunk
from pdf_process import PDFparser
import pickle
import filetype
import os
import logging


class Pipeline:
    def __init__(self,
                 embedding_context_length: int = 512,
                 embedding_context_stride: int = 256,
                 embedding_model: str = "Qwen/Qwen3-0.6B",
                 chunk_batch_size: int = 12,
                 log_level: int = logging.INFO):
        
        self.embedding_context_length = embedding_context_length
        self.embedding_context_stride = embedding_context_stride
        self.embedding_model = embedding_model
        self.chunk_batch_size = chunk_batch_size

        self.pdf_parser = PDFparser()

        # --- Logging setup ---
        logging.basicConfig(
            level=log_level,
            format="%(asctime)s [%(levelname)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        self.logger = logging.getLogger(__name__)

    def _save_to_markdown(self, content: str, folder_path: str) -> str:
        """Save content into a Markdown file inside the provided folder."""
        md_path = os.path.join(folder_path, "text.md")
        try:
            with open(md_path, "w", encoding="utf-8") as f:
                f.write(content)
        except OSError as e:
            raise Exception(f"Failed to write Markdown file: {e}")
        return md_path

    def process_document(self, document_path: str, storage_path: str = "storage", overwrite: bool = False) -> str:
        """Process a document and save its content as Markdown & embeddings."""
        document_path = os.path.normpath(document_path)  # cross-platform safety
        doc_name = os.path.splitext(os.path.basename(document_path))[0]
        folder_path = os.path.join(storage_path, doc_name)

        # --- Immediately create folder ---
        os.makedirs(folder_path, exist_ok=True)

        md_path = os.path.join(folder_path, "text.md")
        pkl_path = os.path.join(folder_path, "data.pkl")

        # --- Resume check ---
        if not overwrite and os.path.exists(md_path) and os.path.exists(pkl_path):
            self.logger.info(f"Skipping '{document_path}' (already processed)")
            return folder_path

        kind = filetype.guess(document_path)
        if not kind:
            raise Exception(f"Unsupported file type for: {document_path}")

        # --- Extract content ---
        match kind.mime:
            case "application/pdf":
                try:
                    self.logger.info(f"Parsing PDF: {document_path}")
                    content = self.pdf_parser.process(document_path)
                except Exception as e:
                    raise Exception(f"PDF parsing failed: {e}")
                self._save_to_markdown(content, folder_path)

            case "text/plain":
                try:
                    self.logger.info(f"Reading TXT/MD: {document_path}")
                    with open(document_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                except OSError as e:
                    raise Exception(f"Failed to read text file: {e}")
                self._save_to_markdown(content, folder_path)

            case _:
                raise Exception(f"Can't process these types of files yet: {kind.mime}")

        # --- Embeddings ---
        try:
            self.logger.info(f"Embedding content (batch_size={self.chunk_batch_size})")
            # token_embeddings, token_spans = embed(
            #     content,
            #     self.embedding_context_length,
            #     self.embedding_context_stride,
            #     self.chunk_batch_size,
            #     self.embedding_model
            # )
            # sentence_embeddings, sentence_spans = sentence_chunk(content, token_embeddings, token_spans)
            sentence_embeddings, sentence_spans = sentence_chunk(content)

        except Exception as e:
            raise Exception(f"Embedding failed: {e}")

        data = {
            "embeddings": sentence_embeddings,
            "spans": sentence_spans
        }


        # data = {
        #     "embeddings": token_embeddings,
        #     "spans": token_spans
        # }

        # --- Save embeddings ---
        try:
            with open(pkl_path, "wb") as f:
                pickle.dump(data, f)
        except OSError as e:
            raise Exception(f"Failed to save pickle file: {e}")

        self.logger.info(f"Processed '{document_path}' → {folder_path}")
        return folder_path


# Example usage
if __name__ == "__main__":
    model_name = 'intfloat/multilingual-e5-large-instruct'
    # model_name = 'Qwen/Qwen3-0.6B'
    pipeline = Pipeline(embedding_context_length=5, embedding_context_stride=5, chunk_batch_size=12, embedding_model=model_name, log_level=logging.DEBUG)
    # pipeline.process_document("docs/docling_paper.pdf")
    pipeline.process_document("docs/911Report.pdf")
