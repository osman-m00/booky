import React from 'react'

const RecentActivity = () => {
 const recentActivity = [
  { id: 1, text: "You reviewed ‘The Hobbit’ ★★★★☆" },
  { id: 2, text: "You joined the Fantasy Lovers group" },
];

  return (
    <div className="flex justify-center m-10">
  <section className="w-full max-w-2xl bg-white shadow-lg rounded-lg p-6">
    <h2 className="mb-4 font-bold text-2xl text-left">Recent Activity</h2>
    <ul className="space-y-3">
      {recentActivity.map((act) => (
        <li
          key={act.id}
          className="bg-gray-50 shadow rounded-lg p-4"
        >
          {act.text}
        </li>
      ))}
    </ul>
  </section>
</div>

  )
}

export default RecentActivity