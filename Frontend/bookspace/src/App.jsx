import { Route, Routes } from 'react-router-dom'
import './App.css'
import BookDetailsPage from './components/pages/books/BookDetailsPage.jsx'
import BooksListPage from './components/pages/books/BooksListPage.jsx'
import Dashboard from './components/pages/Dashboard.jsx'
import LandingPage from './components/pages/LandingPage.jsx'
import ProtectedRoute from './auth/ProtectedRoute.jsx'
import HeaderLayout from './components/layouts/HeaderLayout.jsx'

function App() {
  return (
    <Routes>
      <Route element={<HeaderLayout />}>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/books" element={<BooksListPage />} />
        <Route path="/books/:id" element={<BookDetailsPage />} />

        {/* Protected Route */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  )
}

export default App
