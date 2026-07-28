import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// HashRouter (not BrowserRouter) so deep links (e.g. #/meeting) work on static
// hosts like GitHub Pages that have no server-side rewrite for client routing.
ReactDOM.createRoot(document.getElementById('root')).render(
  <HashRouter>
    <App />
  </HashRouter>
)
