import re
import fitz  # PyMuPDF for robust PDF text extraction
from docx import Document
from transformers import pipeline

class LegalAnalyzerEngine:
    def __init__(self):
        print("Initializing LegalBERT Pipeline...")
        # Using a dedicated open-source legal NER model from HuggingFace
        self.ner_pipeline = pipeline(
            "ner", 
            model="nlpaueb/legal-bert-base-uncased", 
            aggregation_strategy="simple"
        )

    def extract_text(self, file_path: str) -> str:
        """Extracts raw text cleanly from PDF or DOCX files."""
        ext = file_path.split('.')[-1].lower()
        text = ""
        
        if ext == 'pdf':
            with fitz.open(file_path) as doc:
                for page in doc:
                    text += page.get_text("text") + "\n"
        elif ext == 'docx':
            doc = Document(file_path)
            text = "\n".join([para.text for para in doc.paragraphs])
            
        # Clean up excessive white spaces and weird formatting artifacts
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    def find_complete_paragraph(self, text: str, keyword_pattern: str) -> str:
        """
        Finds the keyword match and expands the capture to grab the complete sentence 
        or multi-sentence clause block instead of a small string slice.
        """
        # Find all occurrences of the pattern
        matches = list(re.finditer(keyword_pattern, text, re.IGNORECASE))
        if not matches:
            return "No matching clause discovered in the contract text."
            
        # Take the most relevant match context (typically the first major block)
        best_match = matches[0]
        start_pos = best_match.start()
        
        # Look backwards to find the start of the sentence/paragraph (capital letter or boundary)
        lookback = text[max(0, start_pos - 300):start_pos]
        start_idx = max(0, start_pos - 300)
        sentence_starts = [m.end() for m in re.finditer(r'(?:^|[.!?]\s+)', lookback)]
        if sentence_starts:
            start_idx = max(0, start_pos - 300) + sentence_starts[-1]
            
        # Look forwards to find a clean terminal sentence boundary
        lookforward = text[start_pos:min(len(text), start_pos + 600)]
        end_idx = min(len(text), start_pos + 600)
        sentence_ends = [m.start() for m in re.finditer(r'[.!?](?:\s+|$)', lookforward)]
        if sentence_ends:
            # Grab up to 2 sentences past the keyword to ensure full paragraph coverage
            target_sentences = sentence_ends[:min(2, len(sentence_ends))]
            end_idx = start_pos + target_sentences[-1] + 1
            
        clause_excerpt = text[start_idx:end_idx].strip()
        return clause_excerpt if len(clause_excerpt) > 10 else "Clause context truncated or unreadable."

    def get_executive_summary(self, text: str, top_n: int = 3) -> str:
        """Scores and extracts the most legally binding/critical sentences."""
        # Break text into sentences safely
        sentences = re.split(r'(?<=[.!?])\s+', text)
        valid_sentences = [s.strip() for s in sentences if len(s) > 40]
        
        # High-weight legal trigger words
        keywords = ['shall', 'agree', 'liability', 'terminate', 'payment', 'confidential', 'warrant', 'breach', 'indemnify', 'law', 'jurisdiction', 'penalty']
        
        scored_sentences = []
        for sentence in valid_sentences:
            # Score sentence based on how many legal triggers it contains
            score = sum(1 for kw in keywords if kw in sentence.lower())
            if score > 0:
                scored_sentences.append((score, sentence))
                
        # Sort by highest score first
        scored_sentences.sort(key=lambda x: x[0], reverse=True)
        
        # Grab the top N sentences and format them as bullet points
        top_sentences = [f"• {s[1]}" for s in scored_sentences[:top_n]]
        
        if not top_sentences:
            return "Could not generate summary."
            
        return "\n\n".join(top_sentences)

    def process_and_index(self, file_path: str, file_id: str) -> dict:
        """Runs the upgraded legal compliance pipeline."""
        raw_text = self.extract_text(file_path)
        
        if not raw_text:
            return {
                "extracted_data": {
                    "parties": "Failed to read text.",
                    "termination": "N/A",
                    "risks": "N/A",
                    "summary": "N/A"
                }
            }

        # 1. Smarter Entity Recognition (Expanded to catch more variations)
        header_context = raw_text[:3000]
        party_patterns = [
            r'between\s+(.*?)\s+and\s+(.*?)(?:,|\.|\n|\()',
            r'(?:between|among)\s+([^,.\n]+?)\s+(?:and|&)\s+([^,.\n]+?)(?:\s+collectively|,)',
            r'("Company")\s+and\s+([^,.\n]+?)\s+\("Client"\)'
        ]
        
        parties_found = []
        for pattern in party_patterns:
            match = re.search(pattern, header_context, re.IGNORECASE)
            if match:
                parties_found.extend([g.strip() for g in match.groups() if g])
                
        if parties_found:
            parties_display = " | ".join(set([p for p in parties_found if len(p) < 50]))
        else:
            ner_results = self.ner_pipeline(header_context[:1000])
            org_entities = list(set([ent['word'].replace('##', '') for ent in ner_results if ent['entity_group'] in ['ORG', 'PER']]))
            parties_display = ", ".join(org_entities) if org_entities else "No explicitly defined entities found in the header framework."

        # 2. Optimized Clause Patterns
        termination_clause = self.find_complete_paragraph(raw_text, r'(?:terminate|termination|notice\s+period|expires\s+on)')
        liability_clause = self.find_complete_paragraph(raw_text, r'(?:limitation\s+of\s+liability|indemnity|hold\s+harmless|liquidated\s+damages)')

        # 3. Generate the Executive Summary
        executive_summary = self.get_executive_summary(raw_text)

        return {
            "extracted_data": {
                "parties": parties_display,
                "termination": termination_clause,
                "risks": liability_clause,
                "summary": executive_summary,
                "raw_text": raw_text  # <-- We are now sending the full text to the frontend!
            }
        }