import { useState } from 'react'
import Sidebar from './components/Sidebar'
import MainContent from './components/MainContent'
import './App.css'

function App() {
  const [selectedDatabase, setSelectedDatabase] = useState('bm32')
  const [apiUrl] = useState('http://127.0.0.1:8000')

  return (
    <div className="app-container">
      <Sidebar 
        selectedDatabase={selectedDatabase}
        onSelectDatabase={setSelectedDatabase}
        apiUrl={apiUrl}
      />
      <MainContent 
        database={selectedDatabase}
        apiUrl={apiUrl}
      />
    </div>
  )
}

export default App
