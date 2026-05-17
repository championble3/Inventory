import './Sidebar.css'

function Sidebar({ selectedDatabase, onSelectDatabase }) {
  const databases = [
    { id: 'BM32', label: 'BM32' },
    { id: 'DnoFormy', label: 'DnoFormy' },
    { id: 'Formy', label: 'Formy' },
    { id: 'Arkusze', label: 'Arkusze' },
    { id: 'Plyty', label: 'Płyty' },
    { id: 'Sheet6', label: 'Sheet 6' },
    { id: 'Sheet7', label: 'Sheet 7' },
    { id: 'Sheet8', label: 'Sheet 8' },
    { id: 'Sheet9', label: 'Sheet 9' },
    { id: 'Sheet10', label: 'Sheet 10' },
  ]

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
