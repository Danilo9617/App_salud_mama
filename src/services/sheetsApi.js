const STORAGE_KEY = 'salud_familia_records_v1';
const CONFIG_KEY = 'salud_familia_config_v1';
const ACTIVE_USER_KEY = 'salud_familia_active_user_v1';

const DEFAULT_CONFIG = {
  scriptUrl: 'https://script.google.com/macros/s/AKfycbzs8EaVBxVAvrNMWpHUu6cRJDKA1dyN4BC7T5p7t0RIB8630AklaivKC5dWQQwkbn3a-w/exec',
  whatsapp: '573013179537',
  targetSys: 139,
  targetDia: 89,
  highSys: 160,
  highDia: 100
};

export function getActiveUser() {
  return localStorage.getItem(ACTIVE_USER_KEY) || 'Mamá';
}

export function setActiveUser(user) {
  localStorage.setItem(ACTIVE_USER_KEY, user);
}

export function getConfig() {
  const saved = localStorage.getItem(CONFIG_KEY);
  if (!saved) return DEFAULT_CONFIG;
  try {
    const parsed = JSON.parse(saved);
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      scriptUrl: parsed.scriptUrl || DEFAULT_CONFIG.scriptUrl,
      whatsapp: parsed.whatsapp || DEFAULT_CONFIG.whatsapp
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function getLocalRecords() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function syncFromSheets(scriptUrl) {
  if (!scriptUrl || !scriptUrl.startsWith('http')) return getLocalRecords();
  try {
    const res = await fetch(scriptUrl);
    const data = await res.json();
    if (data.status === 'ok' && Array.isArray(data.records)) {
      const normalized = data.records.map((r) => ({
        id: r.ID,
        usuario: r.Usuario || 'Mamá',
        fecha: r.Fecha,
        hora: r.Hora,
        jornada: r.Jornada,
        animo: r.Animo,
        sistolica: Number(r.Sistolica),
        diastolica: Number(r.Diastolica),
        pulso: r.Pulso ? Number(r.Pulso) : null,
        glucosa: r.Glucosa ? Number(r.Glucosa) : null,
        condicionGlucosa: r.Condicion_Glucosa || '',
        estadoAlerta: r.Estado_Alerta || 'Controlada'
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      return normalized;
    }
  } catch (e) {
    console.warn('Sin conexión a Sheets, usando caché local:', e);
  }
  return getLocalRecords();
}

export async function saveRecord(record, scriptUrl) {
  const current = getLocalRecords();
  const updated = [...current, record];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  if (scriptUrl && scriptUrl.startsWith('http')) {
    try {
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(record)
      });
    } catch (err) {
      console.error('Error enviando a Google Sheets:', err);
    }
  }
  return updated;
}

export async function deleteRecord(id, scriptUrl) {
  const current = getLocalRecords();
  const updated = current.filter((r) => String(r.id) !== String(id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  if (scriptUrl && scriptUrl.startsWith('http')) {
    try {
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'delete', id })
      });
    } catch (err) {
      console.error('Error borrando en Google Sheets:', err);
    }
  }
  return updated;
}