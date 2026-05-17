import { useState } from 'react'
import axios from 'axios'
import './EditorPanel.css'

function EditorPanel({ record, apiUrl, onClose, onSave }) {
  const [formData, setFormData] = useState({
    nr_rys: record.nr_rys,
    full_name: record.full_name || '',
    material: record.material || '',
    date: record.date ? record.date.split('T')[0] : '',
  })
  const [filesPath, setFilesPath] = useState(record.pliki_url || '')
  const [uploading, setUploading] = useState(false)
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
    try {
      await axios.put(`${apiUrl}/api/bm32/${record.nr_rys}`, {
        full_name: formData.full_name || null,
        material: formData.material || null,
        pliki_url: filesPath || null,
      })
      setSuccess('Zmiany zapisane pomyślnie')
      setTimeout(() => {
        onSave()
      }, 1000)
    } catch (err) {
      setError('Błąd przy zapisywaniu: ' + err.message)
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
      await axios.post(`${apiUrl}/api/bm32/${record.nr_rys}/upload-pdf`, formDataToSend, {
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
    try {
      await axios.get(`${apiUrl}/api/bm32/${record.nr_rys}/open-pdf`)
    } catch (err) {
      setError('Błąd przy otwieraniu PDF: ' + err.message)
    }
  }

  const handleOpenFiles = async () => {
    try {
      await axios.get(`${apiUrl}/api/bm32/${record.nr_rys}/open-files`)
    } catch (err) {
      setError('Błąd przy otwieraniu folderu: ' + err.message)
    }
  }

  return (
    <div className="editor-overlay" onClick={onClose}>
      <div className="editor-panel" onClick={(e) => e.stopPropagation()}>
        <div className="editor-header">
          <h2>Edytuj rekord: {record.nr_rys}</h2>
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
                value={formData.nr_rys}
                disabled
                className="form-input disabled"
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
                    onChange={handlePdfUpload}
                    disabled={uploading}
                  />
                </label>
                <button
                  onClick={handleOpenPdf}
                  disabled={!record.pdf_url || uploading}
                  className="file-action-btn"
                >
                  🔓 Otwórz
                </button>
              </div>
              {record.pdf_url && <p className="file-path">✓ PDF przypisany</p>}
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
              <div className="file-buttons">
                <button
                  onClick={handleOpenFiles}
                  disabled={!filesPath || uploading}
                  className="file-action-btn"
                >
                  📁 Otwórz folder
                </button>
              </div>
              {filesPath && <p className="file-path">✓ Ścieżka podana</p>}
            </div>
          </div>
        </div>

        <div className="editor-footer">
          <button
            onClick={handleSave}
            disabled={uploading}
            className="save-btn"
          >
            💾 Zapisz zmiany
          </button>
          <button onClick={onClose} className="cancel-btn">
            Anuluj
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditorPanel
