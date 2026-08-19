import React from 'react';
import { ShieldCheck, Scale, Sparkles, FolderArchive, Search, Hash, Database, Download, Zap } from 'lucide-react';

interface NavbarProps {
  totalCount: number | null;
  selectedCount: number;
  activeTab: 'search' | 'dossier' | 'direct' | 'citations';
  onSelectTab: (tab: 'search' | 'dossier' | 'direct' | 'citations') => void;
  onOpenOfflineSync?: () => void;
  offlineReady?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  totalCount,
  selectedCount,
  activeTab,
  onSelectTab,
  onOpenOfflineSync,
  offlineReady
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md select-none">
      {/* Top Mobile Status Header */}
      <div className="px-3.5 sm:px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-md shadow-blue-500/20">
            SC
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold tracking-tight text-white leading-none">
                SCJN Móvil
              </h1>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-mono font-bold px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Oficial
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-none flex items-center gap-1">
              <span>{totalCount ? `${totalCount.toLocaleString('es-MX')} Tesis` : '311,838+ Tesis'}</span>
              <span>•</span>
              <span className="text-slate-300">Semanario Judicial</span>
            </p>
          </div>
        </div>

        {/* Quick Top Right Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Download / Sync Database Button */}
          {onOpenOfflineSync && (
            <button
              onClick={onOpenOfflineSync}
              className={`px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 min-h-[36px] ${
                offlineReady 
                  ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/80' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="Descargar base de datos completa para acelerar búsquedas (Modo 0ms)"
            >
              {offlineReady ? (
                <>
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] font-bold text-emerald-300 hidden sm:inline">0ms</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[11px] font-bold text-slate-200 hidden sm:inline">Descargar</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => onSelectTab('direct')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 min-h-[36px] ${
              activeTab === 'direct' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Búsqueda rápida por Registro Digital (IUS)"
          >
            <Hash className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] font-mono font-bold">IUS</span>
          </button>

          <button
            onClick={() => onSelectTab('dossier')}
            className="relative p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1 min-h-[36px]"
            title="Ver expediente activo"
          >
            <FolderArchive className="w-4 h-4 text-blue-400" />
            {selectedCount > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 bg-blue-600 text-white font-black text-[10px] rounded-full flex items-center justify-center">
                {selectedCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
