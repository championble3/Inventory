import './Sidebar.css'

function Sidebar({ selectedDatabase, onSelectDatabase }) {
  const databases = ['BM32']

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Bazy Danych</h2>
      </div>
      
      <nav className="database-list">
        {databases.map((db) => (
          <button
            key={db}
            className={`database-tab ${selectedDatabase === db ? 'active' : ''}`}
            onClick={() => onSelectDatabase(db)}
          >
            <span className="db-name">{db}</span>
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
