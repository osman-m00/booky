import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/clerk-react'
import { NavLink } from 'react-router-dom'

const Navbar = () => {
  return (
    <header className="flex justify-between items-center p-4 bg-gray-100 shadow">
      <nav className="flex gap-4">
        <NavLink to="/" className="hover:underline">Home</NavLink>
        <NavLink to="/books" className="hover:underline">Books</NavLink>
        <NavLink to="/groups" className="hover:underline">Groups</NavLink>
        <NavLink to="/dashboard" className="hover:underline">Dashboard</NavLink>
      </nav>

      {/* Clerk handles auth-aware rendering */}
      <div>
        <SignedIn>
          <UserButton/>
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal" />
        </SignedOut>
      </div>
    </header>
  )
}

export default Navbar
