import { Route, Routes } from 'react-router-dom'
import './App.css'
import NavBar from './components/navigation/Navbar.jsx'
import BookDetailsPage from './components/pages/books/BookDetailsPage.jsx'
import BooksListPage from './components/pages/books/BooksListPage.jsx'
import Dashboard from './components/pages/Dashboard.jsx'
import LandingPage from './components/pages/LandingPage.jsx'
import ProtectedRoute from './auth/ProtectedRoute.jsx';
function App() {

  return (
 <div>
  <NavBar/>
  <Routes>
      {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/books" element={<BooksListPage />} />
        <Route path="/books/:id" element={<BookDetailsPage />} />
          <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
  </Routes>
 </div>
  )
}

export default App
