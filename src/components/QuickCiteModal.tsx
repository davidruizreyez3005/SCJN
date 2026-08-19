import React, { useState } from 'react';
import { 
  X, 
  Quote, 
  Check, 
  Copy, 
  FileText, 
  Scale, 
  BookMarked, 
  Calendar, 
  User, 
  Hash, 
  Layers 
} from 'lucide-react';
import { TesisData } from '../types';
import { generateCitations } from '../utils/citationHelper';

interface QuickCiteModalProps {
  tesis: TesisData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QuickCiteModal: React.FC<QuickCiteModalProps> = ({
  tesis,
  isOpen,
  onClose
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'alwd' | 'demanda' | 'scjn' | 'apa' | 'componentes'>('alwd');

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

  if (!isOpen || !tesis) return null;

  const citations = generateCitations(tesis);
  const comps = citations.components;
  const regId = String(tesis.registroDigital || tesis.ius || tesis.id || 'N/D');

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-150">
        
        {/* Mobile Pull / Tap to Close Handle */}
        <div 
          onClick={onClose}
          className="sm:hidden w-full py-1.5 flex justify-center bg-slate-100 border-b border-slate-200 cursor-pointer active:bg-slate-200"
          title="Toca para cerrar"
        >
          <div className="w-12 h-1 bg-slate-400 rounded-full" />
        </div>

        {/* Header */}
        <div className="bg-slate-50 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 p-2 rounded-xl flex items-center justify-center text-white shadow-xs">
              <Quote className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Generador de Citas Jurídicas SCJN
              </h2>
              <p className="text-[11px] sm:text-xs font-mono text-blue-600 font-semibold">
                Registro Digital: {regId}
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

        {/* Format Selector Tabs */}
        <div className="bg-slate-100/80 px-3 py-1.5 border-b border-slate-200 flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('alwd')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer min-h-[34px] ${
              activeTab === 'alwd'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            Estilo ALWD Legal
          </button>
          <button
            onClick={() => setActiveTab('demanda')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer min-h-[34px] ${
              activeTab === 'demanda'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            Escrito de Demanda
          </button>
          <button
            onClick={() => setActiveTab('scjn')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer min-h-[34px] ${
              activeTab === 'scjn'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            Oficial Semanario
          </button>
          <button
            onClick={() => setActiveTab('apa')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer min-h-[34px] ${
              activeTab === 'apa'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            APA 7.ª Ed.
          </button>
          <button
            onClick={() => setActiveTab('componentes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer min-h-[34px] ${
              activeTab === 'componentes'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            Componentes (Metadatos)
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Rubro Reference */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 line-clamp-2">
            {tesis.rubro}
          </div>

          {/* TAB 1: ALWD */}
          {activeTab === 'alwd' && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <BookMarked className="w-4 h-4 text-blue-600" />
                    Estilo ALWD (Association of Legal Writing Directors)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Formato estándar internacional para citas de precedentes y tribunales constitucionales
                  </p>
                </div>
                <button
                  id="copy-alwd-btn"
                  onClick={() => handleCopy(citations.alwd, 'alwd')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl shadow-xs transition-colors cursor-pointer min-h-[36px]"
                >
                  {copiedKey === 'alwd' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar ALWD</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap font-mono leading-relaxed select-all">
                {citations.alwd}
              </pre>
            </div>
          )}

          {/* TAB 2: Demanda Judicial */}
          {activeTab === 'demanda' && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Para Escrito de Demanda / Amparo / Recurso
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Encabezado formal para fundamentar agravios y conceptos de violación
                  </p>
                </div>
                <button
                  id="copy-demanda-btn"
                  onClick={() => handleCopy(citations.demandaEscrito, 'demanda')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl shadow-xs transition-colors cursor-pointer min-h-[36px]"
                >
                  {copiedKey === 'demanda' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Cita</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap font-sans max-h-40 overflow-y-auto leading-relaxed select-all">
                {citations.demandaEscrito}
              </pre>
            </div>
          )}

          {/* TAB 3: Semanario Judicial Oficial */}
          {activeTab === 'scjn' && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-slate-800" />
                    Formato Oficial del Semanario Judicial (SJF)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Identificación canónica de la Gaceta y Libro oficial
                  </p>
                </div>
                <button
                  id="copy-scjn-btn"
                  onClick={() => handleCopy(citations.scjnOficial, 'scjn')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white rounded-xl shadow-xs transition-colors cursor-pointer min-h-[36px]"
                >
                  {copiedKey === 'scjn' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Cita</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap font-sans max-h-40 overflow-y-auto leading-relaxed select-all">
                {citations.scjnOficial}
              </pre>
            </div>
          )}

          {/* TAB 4: APA 7 */}
          {activeTab === 'apa' && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900">
                    Formato APA 7.ª Edición (Artículos y Tesis Académicas)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Estilo bibliográfico para investigación jurídica y doctrina
                  </p>
                </div>
                <button
                  id="copy-apa-btn"
                  onClick={() => handleCopy(citations.apa7, 'apa')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200 rounded-xl transition-colors cursor-pointer min-h-[36px]"
                >
                  {copiedKey === 'apa' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-600" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs text-slate-800 select-all">
                {citations.apa7}
              </div>
            </div>
          )}

          {/* TAB 5: Componentes Desglosados */}
          {activeTab === 'componentes' && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                Componentes Estructurados de la Cita
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Asunto / Expediente
                  </div>
                  <div className="font-bold text-slate-800 mt-0.5">{comps.caseName}</div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                    <Hash className="w-3 h-3" /> Número de Expediente
                  </div>
                  <div className="font-bold text-slate-800 mt-0.5">{comps.docketNumber}</div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                    <Scale className="w-3 h-3" /> Tribunal / Sala
                  </div>
                  <div className="font-bold text-slate-800 mt-0.5">{comps.court}</div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Fecha / Año
                  </div>
                  <div className="font-bold text-slate-800 mt-0.5">{comps.date || 'Sin fecha'}</div>
                </div>

                {comps.judgeRapporteur && (
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 sm:col-span-2">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                      <User className="w-3 h-3" /> Ministro / Magistrado Ponente
                    </div>
                    <div className="font-bold text-slate-800 mt-0.5">{comps.judgeRapporteur}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-4 sm:px-5 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer min-h-[40px]"
          >
            Listo / Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

