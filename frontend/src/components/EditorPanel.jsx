import { useState } from 'react'
import axios from 'axios'
import './EditorPanel.css'

function EditorPanel({ record, database, apiUrl, onClose, onSave, isNew = false }) {
  const [formData, setFormData] = useState({
    nr_rys: isNew ? '' : record?.nr_rys || '',
    full_name: isNew ? '' : record?.full_name || '',
    material: isNew ? '' : record?.material || '',
    date: isNew ? '' : (record?.date ? record.date.split('T')[0] : ''),
  })
  const tableName = encodeURIComponent(database.toLowerCase())
  const [filesPath, setFilesPath] = useState(isNew ? '' : record?.pliki_url || '')
  const [pdfFile, setPdfFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    setError(null)
    setSuccess(null)
    
    if (!formData.nr_rys.trim()) {
      setError('Nr rysunku jest wymagany')
      return
    }

    try {
      if (isNew) {
        // Dodawanie nowego rekordu
        await axios.post(`${apiUrl}/api/${tableName}/`, {
          nr_rys: formData.nr_rys,
          full_name: formData.full_name || null,
          material: formData.material || null,
          pdf_url: null,
          pliki_url: filesPath || null,
        })
        
        // Jeśli użytkownik wybrał plik PDF, przesyłamy go
        if (pdfFile) {
          const formDataToSend = new FormData()
          formDataToSend.append('file', pdfFile)
          try {
            await axios.post(`${apiUrl}/api/${tableName}/${encodeURIComponent(formData.nr_rys)}/upload-pdf`, formDataToSend, {
              headers: { 'Content-Type': 'multipart/form-data' }
            })
          } catch (pdfErr) {
            console.error('Błąd przy przesyłaniu PDF:', pdfErr)
            // Nie przerywamy flow, rekord został dodany
          }
        }
        
        setSuccess('Rekord dodany pomyślnie')
      } else {
        // Edycja istniejącego rekordu
        await axios.put(`${apiUrl}/api/${tableName}/${encodeURIComponent(record.nr_rys)}`, {
          full_name: formData.full_name || null,
          material: formData.material || null,
          pliki_url: filesPath || null,
        })
        setSuccess('Zmiany zapisane pomyślnie')
      }
      
      setTimeout(() => {
        onSave()
      }, 1000)
    } catch (err) {
      setError('Błąd przy zapisywaniu: ' + (err.response?.data?.detail || err.message))
    }
  }

  const handleDelete = async () => {
    const ok = window.confirm(`Czy na pewno usunąć rekord ${record.nr_rys}?`)
    if (!ok) return

    setDeleting(true)
    setError(null)
    try {
      await axios.delete(`${apiUrl}/api/${tableName}/${encodeURIComponent(record.nr_rys)}`)
      setSuccess('Rekord usunięty')
      setTimeout(() => onSave(), 700)
    } catch (err) {
      setError('Błąd przy usuwaniu: ' + (err.response?.data?.detail || err.message))
    } finally {
      setDeleting(false)
    }
  }

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    setError(null)
    const formDataToSend = new FormData()
    formDataToSend.append('file', file)

    try {
      await axios.post(`${apiUrl}/api/${tableName}/${encodeURIComponent(record.nr_rys)}/upload-pdf`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setSuccess('PDF załadowany pomyślnie')
      setTimeout(() => onSave(), 1000)
    } catch (err) {
      setError('Błąd przy przesyłaniu PDF: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleOpenPdf = async () => {
    if (!record) return
    try {
      await axios.get(`${apiUrl}/api/${tableName}/${encodeURIComponent(record.nr_rys)}/open-pdf`)
    } catch (err) {
      setError('Błąd przy otwieraniu PDF: ' + err.message)
    }
  }

  const handleOpenFiles = async () => {
    if (!record) return
    try {
      await axios.get(`${apiUrl}/api/${tableName}/${encodeURIComponent(record.nr_rys)}/open-files`)
    } catch (err) {
      setError('Błąd przy otwieraniu folderu: ' + err.message)
    }
  }

  return (
    <div className="editor-overlay" onClick={onClose}>
      <div className="editor-panel" onClick={(e) => e.stopPropagation()}>
        <div className="editor-header">
          <h2>{isNew ? 'Dodaj nowy rekord' : `Edytuj rekord: ${record.nr_rys}`}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="editor-body">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-grid">
            <div className="form-group">
              <label>Nr Rysunku</label>
              <input
                type="text"
                name="nr_rys"
                value={formData.nr_rys}
                onChange={handleInputChange}
                disabled={!isNew}
                className={`form-input ${!isNew ? 'disabled' : ''}`}
              />
            </div>

            <div className="form-group">
              <label>Data</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="form-input"
                disabled
              />
            </div>

            <div className="form-group full-width">
              <label>Pełna Nazwa</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Wpisz nazwę..."
              />
            </div>

            <div className="form-group full-width">
              <label>Materiał</label>
              <input
                type="text"
                name="material"
                value={formData.material}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Wpisz materiał..."
              />
            </div>
          </div>

          <div className="separator"></div>

          <div className="file-section">
            <h3>📄 Zarządzanie plikami</h3>
            
            <div className="file-group">
              <label>Plik PDF</label>
              <div className="file-buttons">
                <label className="file-input-label">
                  📤 Przesyłaj PDF
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setPdfFile(e.target.files[0] || null)}
                    disabled={uploading}
                  />
                </label>
                {!isNew && (
                  <button
                    onClick={() => {
                      if (pdfFile) setPdfFile(null)
                      else if (record.pdf_url) handleOpenPdf()
                    }}
                    disabled={uploading || (!pdfFile && !record.pdf_url)}
                    className="file-action-btn"
                  >
                    {pdfFile ? '❌ Usuń wybór' : '🔓 Otwórz'}
                  </button>
                )}
              </div>
              {pdfFile && <p className="file-path">✓ {pdfFile.name} wybrany</p>}
              {!isNew && record.pdf_url && !pdfFile && <p className="file-path">✓ PDF przypisany</p>}
            </div>

            <div className="file-group">
              <label>Folder z plikami</label>
              <input
                type="text"
                value={filesPath}
                onChange={(e) => setFilesPath(e.target.value)}
                placeholder="Wpisz ścieżkę do folderu z plikami..."
                className="folder-input"
              />
              {!isNew && (
                <div className="file-buttons">
                  <button
                    onClick={handleOpenFiles}
                    disabled={!filesPath || uploading}
                    className="file-action-btn"
                  >
                    📁 Otwórz folder
                  </button>
                </div>
              )}
              {filesPath && <p className="file-path">✓ Ścieżka podana</p>}
            </div>
          </div>
        </div>

        <div className="editor-footer">
          <button
            onClick={handleSave}
            disabled={uploading || deleting}
            className="save-btn"
          >
            {isNew ? '➕ Dodaj rekord' : '💾 Zapisz zmiany'}
          </button>
          {!isNew && (
            <button
              onClick={handleDelete}
              disabled={uploading || deleting}
              className="delete-btn"
            >
              {deleting ? 'Usuwanie...' : '🗑️ Usuń rekord'}
            </button>
          )}
          <button onClick={onClose} className="cancel-btn">
            Anuluj
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditorPanel
