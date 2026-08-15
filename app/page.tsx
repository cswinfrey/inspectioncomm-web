import Image from 'next/image';

export default function Home() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="text-center px-4 max-w-2xl">
        <div className="mb-8 flex justify-center">
          <Image
            src="/company_logo.jpg"
            alt="InspectionComm Logo"
            width={120}
            height={120}
            className="drop-shadow-lg"
          />
        </div>

        <h1 className="text-5xl font-bold text-white mb-4">
          Inspection<span className="text-blue-500">Comm</span>
        </h1>
        <p className="text-2xl text-blue-400 font-semibold mb-4">
          Pre-Purchase Car Inspections
        </p>
        <p className="text-lg text-gray-300 mb-8">
          Professional, detailed inspections for the Atlanta metropolitan area
        </p>
        <p className="text-gray-400 mb-12 leading-relaxed">
          Get comprehensive vehicle inspections with detailed photo documentation and instant reports. 
          We're here to help you make informed decisions before your next car purchase.
        </p>
        
        <form className="flex gap-2 justify-center flex-wrap">
          <input
            type="email"
            placeholder="Enter your email"
            className="px-4 py-3 rounded bg-white text-slate-900 placeholder-gray-500 focus:outline-none min-w-64"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 whitespace-nowrap"
          >
            Notify Me
          </button>
        </form>

        <p className="text-gray-500 text-sm mt-8">
          Serving Atlanta, Marietta, Sandy Springs, Roswell, and surrounding areas
        </p>
      </div>
    </main>
  );
}