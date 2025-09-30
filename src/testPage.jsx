export default function TestPage() {
   return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
         <header className="bg-blue-500 text-white p-4 flex justify-between">
            <h1 className="font-bold">Hello Tailwind</h1>
            <button className="bg-white text-blue-500 px-3 py-1 rounded">Click</button>
         </header>

         <main className="flex-1 flex items-center justify-center">
            <div className="bg-white shadow p-6 rounded-lg">
               <p className="text-lg">If this looks styled → Tailwind is fine!</p>
            </div>
         </main>
      </div>
   );
}
