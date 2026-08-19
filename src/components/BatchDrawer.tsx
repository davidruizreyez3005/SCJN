import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Download, 
  FileText, 
  Archive, 
  Copy, 
  Check, 
  Layers, 
  FolderArchive,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { TesisData } from '../types';
import { generateBatchTesisPdf } from '../utils/pdfGenerator';
import { exportBatchAsZip } from '../utils/zipExporter';
import { generateCitations } from '../utils/citationHelper';

interface BatchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTesis: TesisData[];
  onRemoveItem: (id: string | number) => void;
  onClearAll: () => void;
  onOpenDetail: (tesis: TesisData) => void;
}

export const BatchDrawer: React.FC<BatchDrawerProps> = ({
  isOpen,
  onClose,
  selectedTesis,
  onRemoveItem,
  onClearAll,
  onOpenDetail
}) => {
  const [folderTitle, setFolderTitle] = useState('Expediente de Jurisprudencias SCJN');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

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

  const handleExportPdf = () => {
    if (selectedTesis.length === 0) return;
    setIsGeneratingPdf(true);
    try {
      generateBatchTesisPdf(selectedTesis, folderTitle);
    } catch (err) {
      console.error('Batch PDF Error:', err);
    } finally {
      setTimeout(() => setIsGeneratingPdf(false), 800);
    }
  };

  const handleExportZip = async () => {
    if (selectedTesis.length === 0) return;
    setIsExportingZip(true);
    try {
      await exportBatchAsZip(selectedTesis, folderTitle);
    } catch (err) {
      console.error('Batch ZIP Error:', err);
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleCopyAllCitations = async () => {
    if (selectedTesis.length === 0) return;
    let combined = `=======================================================\n`;
    combined += `COMPENDIO DE CITAS JURISPRUDENCIALES SCJN\n`;
    combined += `${folderTitle}\n`;
    combined += `Total de criterios: ${selectedTesis.length}\n`;
    combined += `=======================================================\n\n`;

    selectedTesis.forEach((t, i) => {
      const cite = generateCitations(t);
      combined += `[CRITERIO ${i + 1}]\n${cite.demandaEscrito}\n\n-------------------------------------------------------\n\n`;
    });

    try {
      await navigator.clipboard.writeText(combined);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    } catch (err) {
      console.error('Copy all failed:', err);
    }
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedTesis, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${folderTitle.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/70 backdrop-blur-xs flex justify-end"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="bg-slate-50 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 p-2 rounded-xl flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <FolderArchive className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Carpeta de Trabajo / Expediente
              </h2>
              <p className="text-xs text-slate-500">
                {selectedTesis.length} {selectedTesis.length === 1 ? 'criterio seleccionado' : 'criterios seleccionados'}
              </p>
            </div>
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

        {/* Folder Custom Title */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nombre del Compendio / Caso:
          </label>
          <input
            type="text"
            value={folderTitle}
            onChange={(e) => setFolderTitle(e.target.value)}
            placeholder="Ej: Amparo en Revisión 124/2024..."
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
          />
        </div>

        {/* Selected List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {selectedTesis.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Layers className="w-12 h-12 stroke-1 mb-2 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">
                No has añadido ninguna tesis a este expediente
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                Usa el botón "+ Añadir" en cualquier resultado de búsqueda para armar un compendio o descargar múltiples casos en un solo PDF.
              </p>
            </div>
          ) : (
            selectedTesis.map((tesis, index) => {
              const reg = String(tesis.registroDigital || tesis.id);
              return (
                <div
                  key={reg}
                  className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-start justify-between gap-3 transition-colors group"
                >
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => onOpenDetail(tesis)}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-bold text-slate-400">
                        #{index + 1}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-blue-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        REG: {reg}
                      </span>
                      <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-black uppercase">
                        {tesis.tipoTesis || 'Jurisprudencia'}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                      {tesis.rubro}
                    </h4>
                  </div>

                  <button
                    onClick={() => onRemoveItem(tesis.id || tesis.registroDigital || reg)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-200 transition-colors shrink-0 cursor-pointer"
                    title="Quitar de este expediente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Action Footer */}
        {selectedTesis.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              {/* Generate Combined PDF */}
              <button
                onClick={handleExportPdf}
                disabled={isGeneratingPdf}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isGeneratingPdf ? 'Creando PDF...' : 'Compendio PDF'}</span>
              </button>

              {/* Download ZIP Package */}
              <button
                onClick={handleExportZip}
                disabled={isExportingZip}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Archive className="w-4 h-4" />
                <span>{isExportingZip ? 'Comprimiendo...' : 'Descargar ZIP'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Copy All Citations */}
              <button
                onClick={handleCopyAllCitations}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {copiedAll ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">¡Copiadas!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                    <span>Copiar Citas</span>
                  </>
                )}
              </button>

              {/* Export JSON */}
              <button
                onClick={handleExportJson}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                <span>Exportar JSON</span>
              </button>
            </div>

            <div className="pt-2 flex justify-between items-center text-xs">
              <button
                onClick={onClearAll}
                className="text-slate-500 hover:text-red-600 font-medium transition-colors cursor-pointer"
              >
                Vaciar expediente
              </button>
              <span className="text-slate-400 font-medium">
                SCJN Exportador Oficial
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
