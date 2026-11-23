import { useState, useEffect, useRef } from 'react';
import { PlusCircle, BarChart3, Check, RotateCcw } from 'lucide-react';
import RegisterForm from './components/RegisterForm';
import SummaryView from './components/SummaryView';
import AlertModal from './components/AlertModal';
import {
  getConfig,
  getLocalRecords,
  syncFromSheets,
  saveRecord,
  deleteRecord
} from './services/sheetsApi';

export default function App() {
  const [tab, setTab] = useState('register');
  const [config] = useState(() => getConfig());
  const [records, setRecords] = useState(() => getLocalRecords());
  const [toast, setToast] = useState('');
  const [lastSavedId, setLastSavedId] = useState(null);
  const [alertModal, setAlertModal] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    if (config.scriptUrl) {
      syncFromSheets(config.scriptUrl).then(setRecords);
    }
  }, [config.scriptUrl]);

  const showToast = (msg, undoId = null) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    setLastSavedId(undoId);
    toastTimer.current = setTimeout(() => {
      setToast('');
      setLastSavedId(null);
    }, undoId ? 12000 : 3000);
  };

  const handleSaveRecord = async (payload, evaluation) => {
    const updated = await saveRecord(payload, config.scriptUrl);
    setRecords(updated);
    showToast(`¡Guardado! (${payload.sistolica}/${payload.diastolica})`, payload.id);
    if (evaluation.alert) {
      setAlertModal({ record: payload, evaluation });
    }
  };

  const handleUndoLast = async () => {
    if (!lastSavedId) return;
    const updated = await deleteRecord(lastSavedId, config.scriptUrl);
    setRecords(updated);
    setAlertModal(null);
    showToast('Toma borrada. Puedes volver a anotarla.');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 font-sans">
      <div className="max-w-md mx-auto px-4 pt-5">
        <header className="mb-4">
          <h1 className="text-2xl font-extrabold text-teal-900 tracking-tight">
            Mi Salud
          </h1>
        </header>

        {toast && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-700 text-white font-bold flex items-center justify-between gap-2 shadow-md">
            <span className="flex items-center gap-2 text-base">
              <Check className="w-5 h-5 shrink-0" />
              {toast}
            </span>
            {lastSavedId && (
              <button
                type="button"
                onClick={handleUndoLast}
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-bold flex items-center gap-1 shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
                Corregir
              </button>
            )}
          </div>
        )}

        {tab === 'register' && (
          <RegisterForm config={config} records={records} onSave={handleSaveRecord} />
        )}
        {tab === 'summary' && <SummaryView records={records} config={config} />}
      </div>

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-stone-200 px-4 py-2.5">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-3">
          <button
            onClick={() => setTab('register')}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-base ${
              tab === 'register'
                ? 'bg-teal-700 text-white'
                : 'bg-stone-100 text-stone-600'
            }`}
          >
            <PlusCircle className="w-5 h-5" />
            Registrar
          </button>
          <button
            onClick={() => setTab('summary')}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-base ${
              tab === 'summary'
                ? 'bg-teal-700 text-white'
                : 'bg-stone-100 text-stone-600'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Mi Resumen
          </button>
        </div>
      </nav>

      <AlertModal
        alertData={alertModal}
        config={config}
        onClose={() => setAlertModal(null)}
      />
    </div>
  );
}