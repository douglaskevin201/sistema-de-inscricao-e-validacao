import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Formulario from './Formulario'
import Portaria from './Portaria'
import Admin from './Admin'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Formulario />} />
      <Route path="/portaria" element={<Portaria />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  </BrowserRouter>
)