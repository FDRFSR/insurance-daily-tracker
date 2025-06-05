import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h18M3 12h18M3 21h18"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Benvenuto nella tua Dashboard
              </h3>
              <p className="text-sm text-gray-600">
                Qui puoi trovare una panoramica delle tue attività
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-md font-semibold text-gray-900 mb-2">
              Attività Recenti
            </h4>
            <p className="text-sm text-gray-600">
              Nessuna attività recente da mostrare
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-md font-semibold text-gray-900 mb-2">
              Prossimi Appuntamenti
            </h4>
            <p className="text-sm text-gray-600">
              Nessun appuntamento in programma
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h18M3 12h18M3 21h18"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Attività Suggerite
              </h3>
              <p className="text-sm text-gray-600">
                Basato sulle tue attività recenti
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-md font-semibold text-gray-900 mb-2">
              Completa il Profilo
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Aggiungi informazioni mancanti al tuo profilo per ottenere il massimo
              da questa piattaforma.
            </p>
            <Button variant="primary" size="sm">
              Completa Ora
            </Button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-md font-semibold text-gray-900 mb-2">
              Esplora Funzionalità
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Scopri tutte le funzionalità disponibili per te.
            </p>
            <Button variant="outline" size="sm">
              Scopri di Più
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
