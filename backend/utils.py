import os
import tempfile
from PyPDF2 import PdfReader

def read_document(file_bytes, filename=None):
    """
    Reads uploaded document (txt or pdf) and returns text. Handles errors and logs issues.
    file_bytes: bytes of the uploaded file
    filename: optional, original filename to help detect type
    """
    import logging
    text = ""
    try:
        # Guess file type from filename or magic bytes
        ext = os.path.splitext(filename)[1].lower() if filename else None
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext or "") as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        if ext == ".txt" or (not ext and file_bytes[:4].isascii()):
            try:
                text = file_bytes.decode("utf-8")
            except Exception as e:
                logging.error(f"Failed to decode txt: {e}")
        elif ext == ".pdf":
            try:
                with open(tmp_path, "rb") as f:
                    reader = PdfReader(f)
                    for page in reader.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
            except Exception as e:
                logging.error(f"Failed to read PDF: {e}")
        else:
            logging.warning(f"Unsupported file type: {ext}")
        os.remove(tmp_path)
    except Exception as e:
        logging.error(f"Error reading document: {e}")
    return text.strip()
