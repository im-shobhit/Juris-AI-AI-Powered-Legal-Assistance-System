# ⚖️ JurisAI - Legal Audit Engine

An enterprise-grade, full-stack Minimum Viable Product (MVP) designed to automate legal contract review using deterministic NLP and local machine learning models. 

Built as a final-year engineering project to demonstrate the practical application of AI in the legal technology sector.

## ✨ Core Features
* **100% Local AI:** Utilizes HuggingFace's `nlpaueb/legal-bert-base-uncased` model for offline, secure Named Entity Recognition (NER).
* **Extractive Summarization:** Custom algorithms score sentences based on legal weight to automatically generate a "Top Critical Clauses" executive summary.
* **Smarter Paragraph Extraction:** Advanced regex boundaries capture full contextual paragraphs for Termination and Liability clauses, avoiding truncated data.
* **Interactive Split-View UI:** A modern React dashboard that allows users to toggle between data cards and the original document with critical clauses physically highlighted in the text.

## 🛠️ Tech Stack
* **Frontend:** React, Vite, Axios, HTML5/CSS3
* **Backend:** Python, FastAPI, Uvicorn
* **AI & Data Parsing:** HuggingFace Transformers, PyTorch, PyMuPDF (fitz), Python `re` (RegEx)

## 🚀 Quick Start Guide (Cold Start)

To run this application, you must start both the backend AI server and the frontend UI dashboard simultaneously.

### 1. Start the Backend (Terminal 1)
```
bash
cd backend
.\venv\Scripts\Activate.ps1
python main.py
```

### 2. Start the Frontend (Terminal 2)
```
Bash
cd frontend
npm run dev
```

### 3. Launch
Open your web browser and navigate to: http://localhost:5173/
