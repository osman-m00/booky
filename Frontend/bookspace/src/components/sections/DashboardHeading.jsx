import React from 'react'

const DashboardHeading = ({name, imgUrl}) => {
  return (
    <section>
        <div className='flex flex-row justify-center gap-6 mt-6'>
            <h1 className='text-6xl'>Welcome back, {name}</h1>
            <div  className='w-16 h-16 '><img src={imgUrl} alt="profilePic" className='rounded-full'/></div>
        </div>
    </section>
  )
}

export default DashboardHeading