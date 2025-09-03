import React from 'react'
import { useUser} from '@clerk/clerk-react'
import DashboardHeading from '../sections/DashboardHeading';
import QuickAccessCards from '../sections/QuickAccessCards';
import RecentActivity from '../sections/RecentActivity';

const Dashboard = () => {
  const {isSignedIn, user} = useUser();

  if(!isSignedIn) return <div>Please Sign in First.</div>

  return (
    <div>
    <DashboardHeading name = {user.firstName} imgUrl = {user.imageUrl}/>
    <QuickAccessCards/>
    <RecentActivity/>
    </div>
  )
}

export default Dashboard