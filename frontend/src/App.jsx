import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [auditData, setAuditData] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' or 'document'

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setError("Please select a file first.");

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setError(null);
    setAuditData(null);

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/upload_and_analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAuditData(response.data.extracted_data);
      setActiveTab('summary'); // Default to summary on load
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to connect to the AI Engine.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setAuditData(null);
    setError(null);
    document.getElementById('file-upload').value = '';
  };

  // This function takes the raw text and highlights our extracted clauses!
  const renderHighlightedDocument = () => {
    if (!auditData || !auditData.raw_text) return null;
    
    let highlightedText = auditData.raw_text;
    
    // Highlight Termination Clause in Yellow
    if (auditData.termination && auditData.termination.length > 20) {
      highlightedText = highlightedText.split(auditData.termination).join(
        `<mark style="background-color: #fef08a; padding: 2px 4px; border-radius: 4px; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.1);" title="Termination Clause">${auditData.termination}</mark>`
      );
    }
    
    // Highlight Liability Risks in Red
    if (auditData.risks && auditData.risks.length > 20) {
      highlightedText = highlightedText.split(auditData.risks).join(
        `<mark style="background-color: #fecaca; padding: 2px 4px; border-radius: 4px; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.1);" title="Liability Risk">${auditData.risks}</mark>`
      );
    }

    // Convert line breaks to HTML breaks
    highlightedText = highlightedText.replace(/\n/g, '<br/><br/>');

    return (
      <div 
        style={styles.documentViewer} 
        dangerouslySetInnerHTML={{ __html: highlightedText }} 
      />
    );
  };

  const styles = {
    container: { fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', maxWidth: '1000px', margin: '0 auto', padding: '40px 20px', color: '#333', minHeight: '100vh' },
    header: { textAlign: 'center', marginBottom: '40px' },
    title: { fontSize: '2.5rem', color: '#0f172a', marginBottom: '10px', fontWeight: '800' },
    uploadCard: { backgroundColor: '#ffffff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', textAlign: 'center', marginBottom: '30px', border: '1px solid #e2e8f0' },
    fileInput: { display: 'block', margin: '15px auto', fontSize: '1rem' },
    buttonPrimary: { backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', marginRight: '10px' },
    buttonSecondary: { backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '12px 28px', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' },
    errorBox: { backgroundColor: '#fef2f2', color: '#991b1b', padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' },
    grid: { display: 'grid', gridTemplateColumns: '1fr', gap: '25px', marginTop: '20px' },
    card: { backgroundColor: '#ffffff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', borderLeft: '6px solid', border: '1px solid #e2e8f0' },
    badge: { display: 'inline-block', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '15px', textTransform: 'uppercase' },
    documentViewer: { backgroundColor: '#ffffff', padding: '40px', borderRadius: '12px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', fontSize: '1.05rem', lineHeight: '1.8', color: '#1e293b', textAlign: 'justify', maxHeight: '600px', overflowY: 'auto' },
    tabContainer: { display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '30px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' },
    tabButton: { padding: '10px 20px', fontSize: '1.1rem', fontWeight: '600', cursor: 'pointer', border: 'none', backgroundColor: 'transparent', transition: 'all 0.2s' },
    activeTab: { color: '#2563eb', borderBottom: '3px solid #2563eb', paddingBottom: '8px' },
    inactiveTab: { color: '#64748b' }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>JurisAI Legal Audit</h1>
      </header>

      <div style={styles.uploadCard}>
        <form onSubmit={handleUpload}>
          <input type="file" id="file-upload" accept=".pdf, .docx" onChange={handleFileChange} style={styles.fileInput} />
          <button type="submit" disabled={loading} style={styles.buttonPrimary}>
            {loading ? 'Analyzing...' : 'Run Audit Engine'}
          </button>
          {(auditData || file) && (
            <button type="button" onClick={handleReset} style={styles.buttonSecondary}>Reset</button>
          )}
        </form>
      </div>

      {error && <div style={styles.errorBox}><strong>Error:</strong> {error}</div>}

      {auditData && (
        <div>
          {/* TAB NAVIGATION */}
          <div style={styles.tabContainer}>
            <button 
              style={{...styles.tabButton, ...(activeTab === 'summary' ? styles.activeTab : styles.inactiveTab)}}
              onClick={() => setActiveTab('summary')}
            >
              Executive Summary
            </button>
            <button 
              style={{...styles.tabButton, ...(activeTab === 'document' ? styles.activeTab : styles.inactiveTab)}}
              onClick={() => setActiveTab('document')}
            >
              Highlighted Document
            </button>
          </div>

          {/* TAB 1: SUMMARY CARDS */}
          {activeTab === 'summary' && (
            <div style={styles.grid}>
              <div style={{...styles.card, borderLeftColor: '#10b981'}}>
                <span style={{...styles.badge, backgroundColor: '#d1fae5', color: '#047857'}}>Top Clauses</span>
                <p style={{whiteSpace: 'pre-line'}}>{auditData.summary}</p>
              </div>
              <div style={{...styles.card, borderLeftColor: '#f59e0b'}}>
                <span style={{...styles.badge, backgroundColor: '#fef3c7', color: '#b45309'}}>Termination</span>
                <p>{auditData.termination}</p>
              </div>
            </div>
          )}

          {/* TAB 2: HIGHLIGHTED ORIGINAL DOCUMENT */}
          {activeTab === 'document' && (
            <div>
              <p style={{color: '#64748b', marginBottom: '10px'}}>
                <span style={{backgroundColor: '#fef08a', padding: '2px 6px', borderRadius: '4px', marginRight: '10px'}}>Yellow: Termination</span>
                <span style={{backgroundColor: '#fecaca', padding: '2px 6px', borderRadius: '4px'}}>Red: Liability Risks</span>
              </p>
              {renderHighlightedDocument()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;