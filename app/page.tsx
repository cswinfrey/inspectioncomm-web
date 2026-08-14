export default function Home() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-4">
          Inspection<span className="text-blue-500">Comm</span>
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Professional inspection forms and photo management
        </p>
        <p className="text-lg text-gray-400 mb-12">
          Coming Soon
        </p>
        <form className="flex gap-2 justify-center">
          <input
            type="email"
            placeholder="Enter your email"
            className="px-4 py-3 rounded bg-white text-slate-900 placeholder-gray-500 focus:outline-none"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700"
          >
            Notify Me
          </button>
        </form>
      </div>
    </main>
  );
}