
const QuickAccessCards = () => {
    const quickLinks = [
  { title: "Browse Library", href: "/library", description: "Review your library" },
  { title: "Check Groups", href: "/groups", description: "Connect with members" },
  { title: "Messages", href: "/messages", description: "Check your messages" },
];

  return (
    <div className="mt-20">
        <section className="flex flex-row justify-center gap-8">
        {
            quickLinks.map((link)=>(
                <a key={link.title} href={link.href} className="bg-white shadow-md hover:shadow-lg rounded-xl p-6 transition w-60 h-30">
                    <h2 className="text-lg font-semibold mb-2 text-center">{link.title}</h2>
                    <p className="text-gray-600 text-center">{link.description}</p>
                </a>
            ))
        }
        </section>
    </div>
  )
}

export default QuickAccessCards