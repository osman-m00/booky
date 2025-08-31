import React from 'react'
import Navbar from '../navigation/Navbar'
import { Outlet } from 'react-router-dom'
const HeaderLayout = () => {
  return (
    <div>
        <Navbar/>
        <main>
        <Outlet/>
        </main>
    </div>
  )
}

export default HeaderLayout