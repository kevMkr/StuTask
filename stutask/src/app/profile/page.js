import Image from 'next/image'
import Link from 'next/link'
import logo from '../../../Logo.png'

export default function ProfilePage(){
  // Static demo profile. Replace with real user data when connected to auth.
  const user = {
    name: 'Kevin',
    email: 'kevin@example.com',
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="w-full py-4 border-b">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-3">
              <Image src={logo} alt="StuTask" width={120} height={36} />
            </Link>
          </div>
          <div className="text-sm text-gray-600">
            <Link href="/dashboard" className="hover:underline">Back</Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center gap-6">
          <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-bold">K</div>

          <div>
            <h1 className="text-2xl font-semibold">{user.name}</h1>
            <div className="text-sm text-gray-600">{user.email}</div>
            <div className="mt-4">
              <Link href="/profile/edit" className="inline-block bg-blue-600 text-white px-4 py-2 rounded">Edit profile</Link>
            </div>
          </div>
        </div>

        <section className="mt-8 bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3">About</h2>
          <p className="text-sm text-gray-600">This is a demo profile page. Connect authentication and user data to populate real information.</p>
        </section>
      </div>
    </main>
  )
}
