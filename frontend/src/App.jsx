import React from 'react'
import { Route, Routes } from 'react-router-dom'

// IMPORTING PAGES
import HomePage from './Pages/HomePage'
import SignIn from './Pages/SignIn'
import SignUp from './Pages/SignUp'
import Welcome from './Pages/Welcome'

// IMPORTING COMPONENTS
import Navbar from './components/Components/Navbar'

const App = () => {
  return (
    <>
      <Navbar />
      
      <Routes>
        <Route path="/" element={<HomePage/>} />
        <Route path="/signup" element={<SignUp/>} />
        <Route path="/signin" element={<SignIn/>} />
        <Route path="/home" element={<Welcome/>} />
      </Routes>
    </>
  )
}

export default App