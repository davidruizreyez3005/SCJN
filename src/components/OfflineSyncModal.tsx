import React, { useState, useEffect } from 'react';
import { 
  Database, 
  X, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Zap, 
  HardDrive, 
  Trash2,
  FileDown,
  Cloud,
  CloudCheck,
  Sparkles,
  Server,
  UploadCloud
} from 'lucide-react';
import { saveAllTesisOffline, getOfflineTesisCount, clearOfflineStore } from '../utils/offlineDb';
import { uploadEntireDatabaseToFirestore, getFirestoreTesisCount } from '../utils/cloudSync';
import { safeFetchJson } from '../utils/apiHelper';

interface OfflineSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: (count: number) => void;
}

export const OfflineSyncModal: React.FC<OfflineSyncModalProps> = ({
  isOpen,
  onClose,
  onSyncComplete
}) => {
  const [offlineCount, setOfflineCount] = useState<number>(0);
  const [firestoreCount, setFirestoreCount] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [cloudProgress, setCloudProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      getOfflineTesisCount().then(setOfflineCount);
      getFirestoreTesisCount().then(setFirestoreCount);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownloadFullDatabase = async () => {
    setIsDownloading(true);
    setStatusMessage('Descargando base de datos completa de la SCJN...');
    setDownloadProgress(20);

    try {
      const resp = await safeFetchJson<{ tesis?: any[] }>('/api/scjn/all-database');
      if (!resp.ok || !resp.data) throw new Error(resp.error || 'Error al descargar acervo.');
      
      setDownloadProgress(60);
      setStatusMessage('Indexando criterios localmente para búsqueda instantánea (0ms)...');

      const records = resp.data.tesis || [];

      if (records.length > 0) {
        const saved = await saveAllTesisOffline(records);
        setOfflineCount(saved);
        setDownloadProgress(100);
        setStatusMessage(`¡Sincronización exitosa! ${saved} tesis e índices guardados en tu dispositivo.`);
        if (onSyncComplete) onSyncComplete(saved);
      }
    } catch (err: any) {
      setStatusMessage('Error durante la descarga. Intenta de nuevo.');
    } finally {
      setIsDownloading(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleUploadAllToFirestore = async () => {
    setIsCloudSyncing(true);
    setCloudProgress(10);
    setStatusMessage('Obteniendo toda la base de datos de jurisprudencia...');

    try {
      const resp = await safeFetchJson<{ tesis?: any[] }>('/api/scjn/all-database');
      if (!resp.ok || !resp.data) throw new Error(resp.error || 'Error al obtener la base de datos');
      const records = resp.data.tesis || [];

      setStatusMessage(`Cargando ${records.length} tesis en Google Cloud Firestore mediante lotes atómicos...`);
      setCloudProgress(30);

      const uploaded = await uploadEntireDatabaseToFirestore(records, (current, total) => {
        const pct = Math.round((current / total) * 100);
        setCloudProgress(pct);
        setStatusMessage(`Subiendo a Firestore: ${current} de ${total} tesis procesadas (${pct}%)...`);
      });

      const updatedCount = await getFirestoreTesisCount();
      setFirestoreCount(updatedCount || uploaded);
      setCloudProgress(100);
      setStatusMessage(`¡Base de datos Firestore actualizada con éxito! ${uploaded} criterios indexados en la nube.`);
    } catch (err: any) {
      setStatusMessage('Error al sincronizar con Firestore. Verifica la conexión.');
    } finally {
      setIsCloudSyncing(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleExportJsonFile = () => {
    window.location.href = '/api/scjn/export-all';
  };

  const handleClearLocalStore = async () => {
    if (window.confirm('¿Deseas vaciar la memoria local indexada?')) {
      await clearOfflineStore();
      setOfflineCount(0);
      setStatusMessage('Base de datos local vaciada.');
      setTimeout(() => setStatusMessage(null), 2500);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-50 px-4 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5">
                Base de Datos SCJN
                <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Online Firestore & Local
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Sincronización en la Nube (Firestore) y acelerador local 0ms
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer text-xs"
            title="Cerrar ventana (Esc)"
          >
            <X className="w-4 h-4" />
            <span>Cerrar</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          
          {/* Cloud & Local Status Box */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-xs mb-0.5">
                <Cloud className="w-3.5 h-3.5 text-indigo-600" />
                <span>Google Firestore</span>
              </div>
              <div className="text-[11px] text-indigo-700 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{firestoreCount > 0 ? `${firestoreCount.toLocaleString()} en Nube` : 'En línea'}</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs mb-0.5">
                  <HardDrive className="w-3.5 h-3.5 text-slate-600" />
                  <span>Memoria Local</span>
                </div>
                <div className="text-[11px] text-slate-600 font-semibold">
                  {offlineCount > 0 ? `${offlineCount.toLocaleString()} tesis` : 'Sin indexar'}
                </div>
              </div>
              {offlineCount > 0 && (
                <button
                  onClick={handleClearLocalStore}
                  className="p-1 text-slate-400 hover:text-red-600 rounded"
                  title="Vaciar memoria"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar for Cloud Upload */}
          {isCloudSyncing && (
            <div className="space-y-1.5 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
              <div className="flex justify-between text-xs font-semibold text-indigo-800">
                <span className="flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 animate-bounce text-indigo-600" />
                  Subiendo base de datos a Firestore...
                </span>
                <span>{cloudProgress}%</span>
              </div>
              <div className="w-full bg-indigo-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${cloudProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Progress Bar for Local Download */}
          {isDownloading && (
            <div className="space-y-1.5 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
              <div className="flex justify-between text-xs font-semibold text-blue-700">
                <span>Descargando e indexando en tu dispositivo...</span>
                <span>{downloadProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          )}

          {statusMessage && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-medium text-blue-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Cloud Action 1: Upload Entire Database to Firestore */}
          <div className="border border-indigo-200 bg-indigo-50/30 rounded-xl p-4">
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <Cloud className="w-4 h-4 text-indigo-600" />
              1. Cargar Toda la Base de Datos a Firestore
            </h3>
            <p className="text-xs text-slate-600 mb-3">
              Guarda y sincroniza masivamente todos los criterios, rubros y tokens de búsqueda en tu base de datos Google Cloud Firestore para búsquedas instantáneas desde cualquier lugar.
            </p>
            <button
              onClick={handleUploadAllToFirestore}
              disabled={isCloudSyncing}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isCloudSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Subiendo a Firestore ({cloudProgress}%)...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Subir Base de Datos Completa a Firestore</span>
                </>
              )}
            </button>
          </div>

          {/* Local Action 2: Download Database to Browser Store */}
          <div className="border border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              2. Modo Ultra-Rápido en tu Dispositivo (0ms Local)
            </h3>
            <p className="text-xs text-slate-600 mb-3">
              Descarga e indexa en la memoria interna de tu dispositivo todo el acervo temático para búsquedas instantáneas en 0 milisegundos sin latencia de red.
            </p>
            <button
              onClick={handleDownloadFullDatabase}
              disabled={isDownloading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isDownloading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Descargando...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{offlineCount > 0 ? 'Actualizar Memoria Local' : 'Descargar para Búsqueda 0ms'}</span>
                </>
              )}
            </button>
          </div>

          {/* Action 3: Export JSON File */}
          <div className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors">
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <FileDown className="w-4 h-4 text-slate-700" />
              3. Exportar Archivo Completo (.JSON)
            </h3>
            <p className="text-xs text-slate-600 mb-3">
              Descarga un archivo JSON estructurado con todos los rubros, textos, épocas, instancias y claves oficiales para respaldos.
            </p>
            <button
              onClick={handleExportJsonFile}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
            >
              <FileDown className="w-4 h-4 text-slate-600" />
              <span>Exportar Archivo JSON (.json)</span>
            </button>
          </div>

        </div>

        {/* Sticky Bottom Close Button */}
        <div className="bg-slate-50 px-4 sm:px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            Total en Acervo SCJN: <strong className="text-slate-700">311,838+</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Cerrar Ventana
          </button>
        </div>

      </div>
    </div>
  );
};
