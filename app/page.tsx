import BootieWidget from "@/components/bootie-widget";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      <main className="flex flex-col items-center justify-center gap-8 p-8 max-w-2xl text-center">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
            <span className="text-5xl">🤖</span>
          </div>
          <div className="text-left">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Bootie AI
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Asistente Virtual Inteligente</p>
          </div>
        </div>

        <div className="space-y-4 text-gray-700 dark:text-gray-300">
          <p className="text-lg">
            ¡Hola! Soy <span className="font-semibold text-blue-600 dark:text-blue-400">Bootie</span>,
            tu asistente robótico personal.
          </p>
          <p>
            Puedo ayudarte respondiendo preguntas sobre la información que tengo en mi base de conocimientos.
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 text-left">
            <h2 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">
              📋 Instrucciones:
            </h2>
            <ol className="space-y-2 text-sm">
              <li>
                <span className="font-medium">1.</span> Haz clic en el botón flotante en la esquina inferior derecha 👉
              </li>
              <li>
                <span className="font-medium">2.</span> Escríbeme tu pregunta
              </li>
              <li>
                <span className="font-medium">3.</span> Espera mi respuesta ¡Bip bup! 🤖
              </li>
            </ol>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <span className="font-semibold">Nota:</span> Para que pueda responder con conocimiento específico,
              asegúrate de haber cargado documentos usando el script <code className="bg-blue-100 dark:bg-blue-950 px-2 py-1 rounded">npm run ingest</code>
            </p>
          </div>
        </div>
      </main>

      {/* Widget de Bootie */}
      <BootieWidget />
    </div>
  );
}
