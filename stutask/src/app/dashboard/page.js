import Image from 'next/image'
import Link from 'next/link'
import logo from '../../../Logo.png'

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="w-full py-4 border-b">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src={logo} alt="StuTask" width={120} height={36} />
          </div>
          <div className="text-sm text-gray-600 flex items-center gap-6">
            <a href="#" className="hover:underline">Upgrade to Pro</a>
            <a href="#" className="hover:underline">Account</a>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Welcome, <span className="text-yellow-400">Kevin</span></h2>
          <div className="flex items-center gap-3">
            <button className="px-3 py-1 bg-gray-100 rounded-full">Student</button>
            <button className="px-3 py-1 bg-white border rounded-full">Employer</button>
          </div>
        </div>

        <section className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-6 bg-blue-500 text-white rounded-2xl">
                <div className="text-3xl font-bold">2</div>
                <div className="text-sm mt-1">Active projects</div>
              </div>

              <div className="p-6 bg-white border rounded-2xl">
                <div className="text-3xl font-bold">5</div>
                <div className="text-sm mt-1 text-gray-600">Pending approvals</div>
              </div>

              <div className="p-6 bg-white border rounded-2xl">
                <div className="text-3xl font-bold">12</div>
                <div className="text-sm mt-1 text-gray-600">Completed projects</div>
              </div>

              <div className="p-6 bg-white border rounded-2xl">
                <div className="text-3xl font-bold">Rp. 3,750,000</div>
                <div className="text-sm mt-1 text-gray-600">Gains</div>
              </div>
            </div>

            <div className="mt-6 p-6 bg-white border rounded-2xl h-48">
              <div className="text-sm text-gray-500">Most recent work</div>
            </div>
          </div>

          <aside>
            <h3 className="text-lg font-semibold mb-4">Recommended jobs</h3>
            <div className="bg-blue-500 p-4 rounded-3xl space-y-4">
              {[1,2,3,4].map((i)=> (
                <div key={i} className="bg-white rounded-xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">Recommended</div>
                    <div className="font-semibold">Person name</div>
                    <div className="text-xs text-gray-500">Project title • Role title</div>
                  </div>
                  <div className="text-sm text-gray-600">Start date<br/>Rp. 3,000,000</div>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}
