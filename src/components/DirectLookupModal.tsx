import React, { useState } from 'react';
import { Search, X, RefreshCw, BookOpen, AlertCircle, Cloud } from 'lucide-react';
import { TesisData } from '../types';
import { getTesisFromCloud, saveTesisToCloud } from '../utils/cloudSync';

interface DirectLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTesis: (tesis: TesisData) => void;
}

export const DirectLookupModal: React.FC<DirectLookupModalProps> = ({
  isOpen,
  onClose,
  onSelectTesis
}) => {
  const [registroInput, setRegistroInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close with Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = registroInput.trim();
    if (!clean) return;

    setIsLoading(true);
    setError(null);

    try {
      // 1. Try Firestore Cloud first (0ms)
      const cloudTesis = await getTesisFromCloud(clean);
      if (cloudTesis) {
        onSelectTesis(cloudTesis);
        onClose();
        return;
      }

      // 2. Fallback to SCJN API
      const resp = await fetch(`/api/scjn/tesis/${encodeURIComponent(clean)}`);
      if (!resp.ok) {
        throw new Error(`No se encontró ninguna tesis con el Registro Digital "${clean}". Verifica el número.`);
      }
      const data = await resp.json();
      saveTesisToCloud(data).catch(() => {});
      onSelectTesis(data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al consultar la tesis en el repositorio de la SCJN.');
    } finally {
      setIsLoading(false);
    }
  };

  const sampleRegistros = ['2025001', '2024880', '2023500', '2026110', '2025990'];

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-5 sm:p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 p-2 rounded-xl flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <Search className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Búsqueda Directa por Registro
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer min-h-[36px]"
            title="Cerrar ventana (Escape)"
          >
            <X className="w-4 h-4 text-slate-700" />
            <span>Cerrar</span>
          </button>
        </div>

        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          Ingresa el número de <strong>Registro Digital / IUS</strong> de la tesis o jurisprudencia para abrirla directamente desde el repositorio de la SCJN.
        </p>

        <form onSubmit={handleLookup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Registro Digital (IUS):
            </label>
            <input
              type="text"
              value={registroInput}
              onChange={(e) => setRegistroInput(e.target.value.replace(/\D/g, ''))}
              placeholder="Ej: 2025001"
              autoFocus
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Click Samples */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-1.5 font-medium uppercase tracking-wider">
              Ejemplos frecuentes:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {sampleRegistros.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRegistroInput(s)}
                  className="px-2.5 py-1 text-xs font-mono font-bold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg border border-slate-200 hover:border-blue-200 transition-colors cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !registroInput.trim()}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Consultar Tesis</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
