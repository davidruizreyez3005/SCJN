import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Quote, 
  Plus, 
  Check, 
  Share2, 
  ExternalLink,
  BookOpen,
  Sparkles,
  Layers
} from 'lucide-react';
import { TesisData } from '../types';
import { generateSingleTesisPdf } from '../utils/pdfGenerator';
import { generateCitations } from '../utils/citationHelper';

interface TesisCardProps {
  tesis: TesisData;
  isSelected: boolean;
  onToggleSelect: (tesis: TesisData) => void;
  onOpenDetail: (tesis: TesisData) => void;
  onQuickCite: (tesis: TesisData) => void;
}

export const TesisCard: React.FC<TesisCardProps> = ({
  tesis,
  isSelected,
  onToggleSelect,
  onOpenDetail,
  onQuickCite
}) => {
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  const regId = String(tesis.registroDigital || tesis.ius || tesis.id || 'N/D');
  const isJurisprudencia = tesis.tipoTesis?.toLowerCase().includes('jurisprudencia');

  const handleDownloadPdf = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPdfGenerating(true);
    try {
      generateSingleTesisPdf(tesis);
    } catch (err) {
      console.error('PDF error:', err);
    } finally {
      setTimeout(() => setIsPdfGenerating(false), 500);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const citations = generateCitations(tesis);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `SCJN Tesis Reg. ${regId}`,
          text: `${tesis.rubro}\n\n${citations.formatoCorto}`,
          url: `https://sjf2.scjn.gob.mx/detalle/tesis/${regId}`
        });
      } catch (err) {
        // user cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(citations.scjnOficial);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2000);
    }
  };

  const materia = Array.isArray(tesis.materias) ? tesis.materias.join(', ') : (tesis.materia || 'Común');

  return (
    <div 
      className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${
        isSelected 
          ? 'border-slate-200 border-l-4 border-l-blue-600 shadow-sm bg-blue-50/20' 
          : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      <div className="p-4 sm:p-5">
        {/* Top Meta Bar */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Selection Checkbox */}
            <button
              type="button"
              onClick={() => onToggleSelect(tesis)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              title={isSelected ? "Quitar del expediente" : "Añadir a mi expediente"}
            >
              {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 text-slate-500" />}
              <span>{isSelected ? 'En Expediente' : 'Añadir'}</span>
            </button>

            {/* Registro Digital Badge */}
            <span className="font-mono text-xs font-bold text-blue-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
              REG: {regId}
            </span>

            {/* Tipo Badge */}
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
              isJurisprudencia 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-slate-100 text-slate-700'
            }`}>
              {tesis.tipoTesis || 'Jurisprudencia'}
            </span>

            {/* Época */}
            <span className="text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md font-medium border border-slate-100">
              {tesis.epoca || 'Undécima Época'}
            </span>
          </div>

          <div className="text-right text-[11px] text-slate-400 font-medium whitespace-nowrap hidden sm:block">
            {tesis.instancia || 'SCJN'}
          </div>
        </div>

        {/* Rubro (Title) */}
        <h2 
          onClick={() => onOpenDetail(tesis)}
          className="text-sm sm:text-base font-bold text-slate-900 leading-snug cursor-pointer hover:text-blue-600 transition-colors mb-2 line-clamp-2"
        >
          {tesis.rubro}
        </h2>

        {/* Texto Excerpt */}
        {tesis.texto && (
          <p 
            onClick={() => onOpenDetail(tesis)}
            className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2 mb-3 cursor-pointer"
          >
            {tesis.texto}
          </p>
        )}

        {/* Footer Info & Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <span className="font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
              Materia: {materia}
            </span>
            {tesis.clave && (
              <span className="hidden sm:inline font-mono text-slate-500">
                {tesis.clave}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Cite */}
            <button
              onClick={() => onQuickCite(tesis)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
              title="Copiar cita en formato oficial o para demanda"
            >
              <Quote className="w-3.5 h-3.5 text-blue-600" />
              <span>Citar</span>
            </button>

            {/* Download PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={isPdfGenerating}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Descargar este criterio individual en PDF oficial"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">PDF</span>
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              title="Compartir o copiar enlace"
            >
              {copiedNotification ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Read Full Detail */}
            <button
              onClick={() => onOpenDetail(tesis)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-200" />
              <span>Leer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
