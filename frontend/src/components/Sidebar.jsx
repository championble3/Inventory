import { useState, useEffect } from 'react'
import axios from 'axios'
import './Sidebar.css'

function Sidebar({ selectedDatabase, onSelectDatabase, apiUrl }) {
  const [databases, setDatabases] = useState([])
  const [loading, setLoading] = useState(true)

  // Mapowanie custom labels dla znanych table_name'ów
  const customLabels = {
    bm32: 'BM32',
    dnoformy: 'Dno Formy',
    lfc: 'LFC',
    ocmi: 'OCMI',
    pv24: 'PV24',
  }

  const formatLabel = (name) => {
    if (!name) return ''
    
    // Jeśli jest custom label, użyj go
    if (customLabels[name.toLowerCase()]) {
      return customLabels[name.toLowerCase()]
    }
    
    // W przeciwnym razie spróbuj rozdzielić underscores/hyphens
    return name
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map((word) =>
        word.toUpperCase() === word
          ? word
          : word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(' ')
  }

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/tables`)
        const tableNames = Array.isArray(response.data) ? response.data : []
        setDatabases(
          tableNames.map((name) => ({ id: name, label: formatLabel(name) }))
        )

        if (tableNames.length > 0 && !tableNames.includes(selectedDatabase)) {
          onSelectDatabase(tableNames[0])
        }
      } catch (error) {
        console.error('Błąd pobierania tabel:', error)
        setDatabases([{ id: 'bm32', label: 'BM32' }])
      } finally {
        setLoading(false)
      }
    }

    fetchTables()
  }, [apiUrl, onSelectDatabase, selectedDatabase])

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Bazy Danych</h2>
      </div>
      
      <nav className="database-list">
        {databases.map((db) => (
          <button
            key={db.id}
            className={`database-tab ${selectedDatabase === db.id ? 'active' : ''}`}
            onClick={() => onSelectDatabase(db.id)}
          >
            <span className="db-name">{db.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-info">
        <p className="api-status">
          <span className="status-dot"></span>
          API Połączony
        </p>
      </div>
    </aside>
  )
}

export default Sidebar
