import { useState, useEffect, useRef, useMemo } from 'react';
import { PlusCircle, BarChart3, Check, RotateCcw } from 'lucide-react';
import RegisterForm from './components/RegisterForm';
import SummaryView from './components/SummaryView';
import AlertModal from './components/AlertModal';
import {
  getConfig,
  getActiveUser,
  setActiveUser,
  getLocalRecords,
  syncFromSheets,
  saveRecord,
  deleteRecord
} from './services/sheetsApi';

export default function App() {
  const [tab, setTab] = useState('register');
  const [activeUser, setUserState] = useState(() => getActiveUser());
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

  const handleSelectUser = (user) => {
    setUserState(user);
    setActiveUser(user);
  };

  // Filtra solo los registros de la persona seleccionada (Mamá o Papá)
  const userRecords = useMemo(
    () => records.filter((r) => (r.usuario || 'Mamá') === activeUser),
    [records, activeUser]
  );

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
    const recordWithUser = { ...payload, usuario: activeUser };
    const updated = await saveRecord(recordWithUser, config.scriptUrl);
    setRecords(updated);
    showToast(
      `¡Guardado para ${activeUser}! (${payload.sistolica}/${payload.diastolica})`,
      payload.id
    );
    if (evaluation.alert) {
      setAlertModal({ record: recordWithUser, evaluation });
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
        <header className="mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-extrabold text-teal-900 tracking-tight">
              Mi Salud
            </h1>
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-teal-100 text-teal-900">
              Perfil: {activeUser}
            </span>
          </div>

          {/* Selector grande Mamá / Papá */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-stone-200/80 rounded-2xl">
            {['Mamá', 'Papá'].map((person) => {
              const isSelected = activeUser === person;
              return (
                <button
                  key={person}
                  type="button"
                  onClick={() => handleSelectUser(person)}
                  className={`py-2.5 rounded-xl font-extrabold text-lg transition flex items-center justify-center gap-2 ${
                    isSelected
                      ? person === 'Mamá'
                        ? 'bg-teal-700 text-white shadow-sm'
                        : 'bg-sky-800 text-white shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <span>{person === 'Mamá' ? '👩' : '👨'}</span>
                  <span>{person}</span>
                </button>
              );
            })}
          </div>
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
          <RegisterForm
            config={config}
            records={userRecords}
            onSave={handleSaveRecord}
          />
        )}
        {tab === 'summary' && (
          <SummaryView
            records={userRecords}
            config={config}
            activeUser={activeUser}
          />
        )}
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
            Resumen {activeUser}
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