from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid

# Import our custom AI engine
from services.analyzer_service import LegalAnalyzerEngine

app = FastAPI()

# Allow React to talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---> THIS IS THE LINE THAT WAS MISSING! <---
# We must initialize the AI engine before we can use it.
analyzer = LegalAnalyzerEngine()

UPLOAD_DIR = "./uploaded_docs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/api/upload_and_analyze")
async def upload_file(file: UploadFile = File(...)):
    # Verify file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.pdf', '.docx']:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported.")
        
    # Save the file locally
    file_id = str(uuid.uuid4())
    saved_filename = f"{file_id}{ext}"
    file_path = os.path.join(UPLOAD_DIR, saved_filename)
    
    with open(file_path, "wb") as f:
        f.write(await file.read())
        
    # Process using our deterministic NLP engine
    try:
        result = analyzer.process_and_index(file_path, file_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")

# Keep the server running
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)