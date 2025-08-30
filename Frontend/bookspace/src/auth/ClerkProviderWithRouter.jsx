import { ClerkProvider } from "@clerk/clerk-react"
import {useNavigate} from 'react-router-dom'

export default  function ClerkProviderWithRouter({children}){
    const navigate = useNavigate();
    return(
        <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
        navigate={(to)=>navigate(to)}>
        {children}
        </ClerkProvider>
    )
}