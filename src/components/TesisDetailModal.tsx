import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Quote, 
  Check, 
  Share2, 
  Plus, 
  Sparkles, 
  BookOpen, 
  Scale, 
  FileText, 
  Layers, 
  Copy,
  ExternalLink,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { TesisData, AiAnalysisResult } from '../types';
import { generateSingleTesisPdf } from '../utils/pdfGenerator';
import { generateCitations } from '../utils/citationHelper';
import { safeFetchJson } from '../utils/apiHelper';

interface TesisDetailModalProps {
  tesis: TesisData | null;
  isOpen: boolean;
  onClose: () => void;
  isSelected: boolean;
  onToggleSelect: (tesis: TesisData) => void;
}

export const TesisDetailModal: React.FC<TesisDetailModalProps> = ({
  tesis,
  isOpen,
  onClose,
  isSelected,
  onToggleSelect
}) => {
  const [activeTab, setActiveTab] = useState<'texto' | 'citas' | 'ai'>('texto');
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysisResult | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

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

  const regId = String(tesis.registroDigital || tesis.ius || tesis.id || 'N/D');
  const citations = generateCitations(tesis);

  const handleCopyCitation = async (text: string, formatName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFormat(formatName);
      setTimeout(() => setCopiedFormat(null), 2500);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  const handleFetchAiAnalysis = async () => {
    if (aiAnalysis || isAiLoading) return;
    setIsAiLoading(true);
    try {
      const resp = await safeFetchJson<AiAnalysisResult>('/api/scjn/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tesis })
      });
      if (resp.ok && resp.data) {
        setAiAnalysis(resp.data);
      } else {
        // Deterministic fallback
        setAiAnalysis({
          resumenEjecutivo: `Tesis emitida por ${tesis.instancia || 'la SCJN'} relativa a "${tesis.rubro}". Establece lineamientos vinculantes en materia ${tesis.materia || 'constitucional'}.`,
          criterioJuridico: tesis.texto ? tesis.texto.slice(0, 280) + '...' : tesis.rubro,
          aplicabilidadPractica: "Invocable en demandas de amparo indirecto, amparo directo, contestaciones de demanda y recursos afines.",
          palabrasClave: [tesis.materia || "Derecho", tesis.epoca || "SCJN", "Jurisprudencia", "México"],
          citaRecomendada: `Época: ${tesis.epoca || 'Undécima'}. Instancia: ${tesis.instancia || 'SCJN'}. Registro: ${tesis.registroDigital || tesis.id}. "${tesis.rubro}".`
        });
      }
    } catch (err) {
      console.error('AI Analysis failed:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleTabSwitch = (tab: 'texto' | 'citas' | 'ai') => {
    setActiveTab(tab);
    if (tab === 'ai' && !aiAnalysis && !isAiLoading) {
      handleFetchAiAnalysis();
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `SCJN Reg. ${regId}`,
          text: `${tesis.rubro}\n\n${citations.formatoCorto}`,
          url: `https://sjf2.scjn.gob.mx/detalle/tesis/${regId}`
        });
      } catch {}
    } else {
      handleCopyCitation(citations.scjnOficial, 'Compartir');
    }
  };

  const fontClass = {
    normal: 'text-sm leading-relaxed',
    large: 'text-base leading-relaxed',
    xlarge: 'text-lg leading-loose'
  }[fontSize];

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Mobile Pull / Tap to Close Handle */}
        <div 
          onClick={onClose}
          className="sm:hidden w-full py-1.5 flex justify-center bg-slate-100 border-b border-slate-200 cursor-pointer active:bg-slate-200"
          title="Toca para cerrar"
        >
          <div className="w-12 h-1 bg-slate-400 rounded-full" />
        </div>

        {/* Modal Top Bar */}
        <div className="bg-slate-50 px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="font-mono text-xs font-bold text-blue-600 bg-white px-2 sm:px-2.5 py-1 rounded-md border border-slate-200 shrink-0">
              REG: {regId}
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 truncate">
              {tesis.tipoTesis || 'Jurisprudencia'}
            </span>
            <span className="text-xs text-slate-500 hidden md:inline font-medium truncate">
              {tesis.epoca || 'Undécima Época'}
            </span>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Font Zoom Controls */}
            <div className="hidden md:flex items-center bg-white border border-slate-200 rounded-lg p-0.5 mr-1">
              <button
                onClick={() => setFontSize('normal')}
                className={`px-2 py-1 text-xs rounded ${fontSize === 'normal' ? 'bg-slate-200 font-bold text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
                title="Texto normal"
              >
                A
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`px-2 py-1 text-xs rounded ${fontSize === 'large' ? 'bg-slate-200 font-bold text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
                title="Texto mediano"
              >
                A+
              </button>
              <button
                onClick={() => setFontSize('xlarge')}
                className={`px-2 py-1 text-xs rounded ${fontSize === 'xlarge' ? 'bg-slate-200 font-bold text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
                title="Texto grande"
              >
                A++
              </button>
            </div>

            {/* Add to Dossier */}
            <button
              type="button"
              onClick={() => onToggleSelect(tesis)}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isSelected ? 'En Expediente' : 'Añadir'}</span>
            </button>

            {/* Download PDF */}
            <button
              onClick={() => generateSingleTesisPdf(tesis)}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Descargar PDF oficial con membrete"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">PDF</span>
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="p-1.5 text-slate-500 hover:text-slate-900 bg-white border border-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Compartir criterio"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Prominent High-Contrast Close Button */}
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer ml-1 min-h-[36px]"
              title="Cerrar ventana (Escape)"
            >
              <X className="w-4 h-4 text-slate-700" />
              <span>Cerrar</span>
            </button>
          </div>
        </div>

        {/* Tab Headers */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center gap-2 sm:gap-4 overflow-x-auto">
          <button
            onClick={() => handleTabSwitch('texto')}
            className={`py-3.5 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'texto'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Texto & Criterio Oficial</span>
          </button>

          <button
            onClick={() => handleTabSwitch('citas')}
            className={`py-3.5 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'citas'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Quote className="w-4 h-4" />
            <span>Generador de Citas Forenses</span>
          </button>

          <button
            onClick={() => handleTabSwitch('ai')}
            className={`py-3.5 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'ai'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>Análisis Jurídico IA</span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto flex-1 bg-white">
          
          {/* TAB 1: TEXTO OFICIAL */}
          {activeTab === 'texto' && (
            <div className="space-y-6">
              {/* Institutional Header Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Registro Digital</p>
                  <p className="text-sm font-mono font-bold text-slate-900">{regId}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Época / Instancia</p>
                  <p className="text-sm font-medium text-slate-800">{tesis.epoca || 'Undécima'} / {tesis.instancia || 'SCJN'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Tipo & Materia</p>
                  <p className="text-sm font-medium text-slate-800">
                    {tesis.tipoTesis || 'Jurisprudencia'} ({Array.isArray(tesis.materias) ? tesis.materias.join(', ') : (tesis.materia || 'Común')})
                  </p>
                </div>
              </div>

              {/* Rubro */}
              <div>
                <span className="inline-block bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-1 rounded-md mb-2">
                  RUBRO OFICIAL
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                  {tesis.rubro}
                </h2>
              </div>

              {/* Texto */}
              {tesis.texto && (
                <div>
                  <h3 className="text-xs uppercase font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4 tracking-wider">
                    TEXTO DE LA TESIS
                  </h3>
                  <div className={`text-slate-600 font-sans whitespace-pre-line text-justify ${fontClass}`}>
                    {tesis.texto}
                  </div>
                </div>
              )}

              {/* Precedentes */}
              {tesis.precedentes && (
                <div className="pt-4 border-t border-slate-200">
                  <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">
                    Precedentes / Votación
                  </h3>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 whitespace-pre-line font-mono leading-relaxed">
                    {tesis.precedentes}
                  </div>
                </div>
              )}

              {/* Sleek Dark Citation Box */}
              <div className="mt-8 p-6 bg-slate-900 text-white rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-mono text-blue-400">Formato de Citación Automática (SCJN)</p>
                  <button
                    onClick={() => handleCopyCitation(citations.scjnOficial, 'scjn_inline')}
                    className="text-xs font-bold text-blue-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                  >
                    {copiedFormat === 'scjn_inline' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-sm italic font-serif leading-relaxed text-slate-200">
                  "{citations.scjnOficial}"
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: GENERADOR DE CITAS FORENSES */}
          {activeTab === 'citas' && (
            <div className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 flex items-start gap-2">
                <Quote className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">Citas jurídicas automatizadas:</strong> Formateadas conforme a estándares forenses mexicanos e internacionales (ALWD, SJF Oficial, Escritos de Demanda y APA 7.ª).
                </div>
              </div>

              {/* 1. Estilo ALWD (Association of Legal Writing Directors) */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-blue-600" />
                    Estilo ALWD Legal (Precedente Judicial Internacional)
                  </span>
                  <button
                    onClick={() => handleCopyCitation(citations.alwd, 'alwd')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    {copiedFormat === 'alwd' ? (
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

              {/* 2. Formato Demanda Judicial */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    Formato para Escrito de Demanda / Amparo / Recurso
                  </span>
                  <button
                    onClick={() => handleCopyCitation(citations.demandaEscrito, 'demanda')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    {copiedFormat === 'demanda' ? (
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
                <pre className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed select-all">
                  {citations.demandaEscrito}
                </pre>
              </div>

              {/* 3. Formato SCJN Oficial */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-slate-700" />
                    Formato Semanario Judicial de la Federación (Oficial)
                  </span>
                  <button
                    onClick={() => handleCopyCitation(citations.scjnOficial, 'scjn')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    {copiedFormat === 'scjn' ? (
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
                <pre className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed select-all">
                  {citations.scjnOficial}
                </pre>
              </div>

              {/* 4. Componentes Estructurados */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-600" />
                  Metadatos y Componentes de la Cita
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Caso / Asunto</div>
                    <div className="font-bold text-slate-800 mt-0.5">{citations.components.caseName}</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Expediente</div>
                    <div className="font-bold text-slate-800 mt-0.5">{citations.components.docketNumber}</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Tribunal / Órgano</div>
                    <div className="font-bold text-slate-800 mt-0.5">{citations.components.court}</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Fecha de Resolución</div>
                    <div className="font-bold text-slate-800 mt-0.5">{citations.components.date || 'Sin fecha'}</div>
                  </div>
                  {citations.components.judgeRapporteur && (
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 sm:col-span-2">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Ministro / Magistrado Ponente</div>
                      <div className="font-bold text-slate-800 mt-0.5">{citations.components.judgeRapporteur}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Formato APA 7ma Edición */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    Formato APA (7.ª edición) / Artículos e Investigaciones
                  </span>
                  <button
                    onClick={() => handleCopyCitation(citations.apa7, 'apa')}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    {copiedFormat === 'apa' ? (
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
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-800 select-all">
                  {citations.apa7}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ANÁLISIS JURÍDICO IA */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              {isAiLoading ? (
                <div className="text-center py-12">
                  <Sparkles className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-900">
                    Analizando criterio jurisprudencial con Gemini...
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Extrayendo núcleo normativo, aplicabilidad procesal y resumen ejecutivo.
                  </p>
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-5">
                  {/* Resumen Ejecutivo */}
                  <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      Resumen Ejecutivo (En lenguaje claro)
                    </h4>
                    <p className="text-sm text-slate-800 leading-relaxed">
                      {aiAnalysis.resumenEjecutivo}
                    </p>
                  </div>

                  {/* Criterio Jurídico Obligatorio */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-blue-600" />
                      Núcleo del Criterio Jurídico
                    </h4>
                    <p className="text-sm text-slate-800 leading-relaxed font-medium">
                      {aiAnalysis.criterioJuridico}
                    </p>
                  </div>

                  {/* Aplicabilidad Práctica en Juicio */}
                  <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-700" />
                      Aplicabilidad Práctica & Argumentación
                    </h4>
                    <p className="text-sm text-slate-800 leading-relaxed">
                      {aiAnalysis.aplicabilidadPractica}
                    </p>
                  </div>

                  {/* Palabras Clave */}
                  {aiAnalysis.palabrasClave && aiAnalysis.palabrasClave.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Conceptos Clave
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {aiAnalysis.palabrasClave.map((kw, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200"
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10">
                  <button
                    onClick={handleFetchAiAnalysis}
                    className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 hover:bg-blue-700 cursor-pointer"
                  >
                    Generar Análisis con IA
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-3 sm:px-6 py-3 border-t border-slate-200 flex items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <a
              href={`https://sjf2.scjn.gob.mx/detalle/tesis/${regId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold"
            >
              <span>Ver en Semanario Judicial</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 active:bg-black text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cerrar Ventana</span>
          </button>
        </div>

      </div>
    </div>
  );
};
