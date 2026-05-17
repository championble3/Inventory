import { useState, useEffect } from 'react'
import axios from 'axios'
import EditorPanel from './EditorPanel'
import './MainContent.css'

function MainContent({ database, apiUrl }) {
  const [records, setRecords] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchType, setSearchType] = useState('nr_rys')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)

  // Pobranie wszystkich rekordów
  useEffect(() => {
    fetchAllRecords()
  }, [database])

  const fetchAllRecords = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get(`${apiUrl}/api/bm32/`)
      setRecords(response.data)
    } catch (err) {
      setError('Błąd przy pobieraniu danych: ' + err.message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Wyszukiwanie rekordu
  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchTerm.trim()) {
      fetchAllRecords()
      return
    }

    setLoading(true)
    setError(null)
    try {
      let url = ''
      if (searchType === 'nr_rys') {
        url = `${apiUrl}/api/bm32/${encodeURIComponent(searchTerm)}`
      } else if (searchType === 'material') {
        url = `${apiUrl}/api/bm32/search/material/${encodeURIComponent(searchTerm)}`
      } else {
        url = `${apiUrl}/api/bm32/search/name/${encodeURIComponent(searchTerm)}`
      }

      const response = await axios.get(url)
      setRecords(Array.isArray(response.data) ? response.data : [response.data])
    } catch (err) {
      setError('Rekord nie znaleziony: ' + err.message)
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="main-content">
      <div className="content-header">
        <h1>Baza {database}</h1>
        <form className="search-form" onSubmit={handleSearch}>
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="search-select"
          >
            <option value="nr_rys">Nr rysunku</option>
            <option value="material">Materiał</option>
            <option value="full_name">Pełna nazwa</option>
          </select>
          <input
            type="text"
            placeholder={
              searchType === 'nr_rys'
                ? 'Szukaj po numerze rysunku...'
                : searchType === 'material'
                ? 'Szukaj po materiale...'
                : 'Szukaj po pełnej nazwie...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn">
            🔍 Szukaj
          </button>
          <button 
            type="button" 
            className="reset-btn"
            onClick={() => {
              setSearchTerm('')
              fetchAllRecords()
            }}
          >
            ↺ Wyczyść
          </button>
        </form>
      </div>

      {error && <div className="error-message">{error}</div>}
      {loading && <div className="loading">Ładowanie...</div>}

      <div className="records-container">
        {records.length === 0 ? (
          <p className="no-records">Brak rekordów</p>
        ) : (
          <table className="records-table">
            <thead>
              <tr>
                <th>Nr Rysunku</th>
                <th>Pełna Nazwa</th>
                <th>Materiał</th>
                <th>Data</th>
                <th>PDF</th>
                <th>Pliki</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.nr_rys}>
                  <td className="nr-rys">{record.nr_rys}</td>
                  <td>{record.full_name || '-'}</td>
                  <td>{record.material || '-'}</td>
                  <td>{record.date ? new Date(record.date).toLocaleDateString('pl-PL') : '-'}</td>
                  <td>
                    {record.pdf_url ? (
                      <button 
                        onClick={() => handleOpenPdf(record, apiUrl)}
                        className="link-btn"
                      >
                        📄 Otwórz
                      </button>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {record.pliki_url ? (
                      <button 
                        onClick={() => handleOpenFiles(record, apiUrl)}
                        className="link-btn"
                      >
                        📁 Otwórz
                      </button>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <button 
                      onClick={() => setSelectedRecord(record)}
                      className="edit-btn"
                    >
                      ✏️ Edytuj
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="records-info">
        <p>Łącznie rysunków: <strong>{records.length}</strong></p>
      </div>

      {selectedRecord && (
        <EditorPanel 
          record={selectedRecord}
          apiUrl={apiUrl}
          onClose={() => setSelectedRecord(null)}
          onSave={() => {
            setSelectedRecord(null)
            fetchAllRecords()
          }}
        />
      )}
    </main>
  )
}

// Funkcje do obsługi otwierania plików
async function handleOpenPdf(record, apiUrl) {
  try {
    await axios.get(`${apiUrl}/api/bm32/${record.nr_rys}/open-pdf`)
  } catch (err) {
    console.error('Błąd przy otwieraniu PDF:', err.message)
  }
}

async function handleOpenFiles(record, apiUrl) {
  try {
    await axios.get(`${apiUrl}/api/bm32/${record.nr_rys}/open-files`)
  } catch (err) {
    console.error('Błąd przy otwieraniu folderu:', err.message)
  }
}

export default MainContent
