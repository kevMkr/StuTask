import Link from 'next/link';

export default function Page() {
  return (
    <main className="min-h-screen bg-white font-sans">
      <header className="w-full py-6">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-white shadow-sm rounded-full px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">S</div>
              <span className="font-semibold">StuTask</span>
            </div>
            <Link className="text-sm text-gray-600 hover:underline" href="/login">Login</Link>
          </div>
        </div>
      </header>


      <section className="max-w-6xl mx-auto px-6">
        <div className="bg-[#2f7ef6] text-white rounded-[36px] p-12 mt-6 flex items-center gap-8">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
              Find the perfect
              <br />
              <span className="text-yellow-300">student</span>
              <br />
              for your projects
            </h1>
            <p className="mt-6 max-w-md text-sm opacity-90">
              Here to connect both students and employers to reach a cost-effective industry
            </p>
          </div>

          <div className="w-56 h-56 bg-white rounded-full flex-shrink-0 shadow-lg relative">

            <svg viewBox="0 0 200 200" className="w-full h-full text-gray-200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
              <g fill="none" fillRule="evenodd">
                <circle cx="100" cy="60" r="34" fill="#f3f4f6" />
                <path d="M30 150c0-33 27-60 70-60s70 27 70 60H30z" fill="#f3f4f6" />
              </g>
            </svg>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 mt-10">
        <div className="bg-white rounded-t-xl -mt-6 p-8">
          <div className="md:flex md:items-start md:gap-8">
            <div className="md:w-1/3">
              <h2 className="text-2xl font-bold">Our services for you to try</h2>
              <p className="mt-3 text-sm text-gray-600">Quality is determined through our student selection system, making sure the highest quality</p>
            </div>

            <div className="mt-6 md:mt-0 md:flex-1 grid grid-cols-4 gap-4">
              <div className="h-28 bg-gray-200 rounded-md" />
              <div className="h-28 bg-gray-200 rounded-md" />
              <div className="h-28 bg-gray-200 rounded-md" />
              <div className="h-28 bg-gray-200 rounded-md" />
            </div>
          </div>
        </div>
      </section>

      <div className="mt-8 bg-[#2f7ef6] h-48" />
    </main>
  )
}
