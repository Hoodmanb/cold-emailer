import React from 'react'
import { Route, Routes } from 'react-router-dom'

// IMPORTING PAGES
import HomePage from './Pages/HomePage'
import SignUp from './Pages/SignUp'
import LogIn from './Pages/LogIn'

// IMPORTING COMPONENTS
import Navbar from './components/ui/Components/Navbar'

const App = () => {
  return (
    <>
      <Navbar />
      
      <Routes>
        <Route path="/" element={<HomePage/>} />
        <Route path="/signup" element={<SignUp/>} />
        <Route path="/login" element={<LogIn/>} />
      </Routes>
    </>
  )
}

export default App