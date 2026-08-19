import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { SearchBar } from './components/SearchBar';
import { TesisCard } from './components/TesisCard';
import { TesisDetailModal } from './components/TesisDetailModal';
import { QuickCiteModal } from './components/QuickCiteModal';
import { OfflineSyncModal } from './components/OfflineSyncModal';
import { getOfflineTesisCount } from './utils/offlineDb';
import { getFirestoreTesisCount, saveTesisToCloud, uploadEntireDatabaseToFirestore, getTesisFromCloud, searchFirestoreTesis } from './utils/cloudSync';
import { safeFetchJson } from './utils/apiHelper';
import { TesisData, FilterOptions } from './types';
import { 
  FolderArchive, 
  Download, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  Scale, 
  BookOpen, 
  CheckSquare, 
  Square,
  Sparkles,
  Layers,
  Quote,
  Copy,
  Check,
  FileText,
  Hash,
  Trash2,
  RefreshCw,
  SlidersHorizontal,
  Database,
  ExternalLink
} from 'lucide-react';
import { generateBatchTesisPdf, generateSingleTesisPdf } from './utils/pdfGenerator';
import { generateCitations } from './utils/citationHelper';

const INITIAL_FILTERS: FilterOptions = {
  query: '',
  epoca: 'todas',
  instancia: 'todas',
  judicialBody: 'all',
  tipo: 'todos',
  materia: 'todas',
  startDate: '',
  endDate: '',
  sortBy: 'relevance'
};

const SAMPLE_REGISTROS = [
  { id: '2032503', label: 'Resp. Patrimonial del Estado', epoca: '11ª Época (2026)' },
  { id: '2032498', label: 'Prueba Pericial Administrativa', epoca: '11ª Época (2026)' },
  { id: '2027550', label: 'Prisión Preventiva Oficiosa', epoca: '11ª Época (Pleno)' },
  { id: '2025001', label: 'Libre Desarrollo Personalidad', epoca: '11ª Época' },
  { id: '2024880', label: 'Interés Superior de la Niñez', epoca: '11ª Época' },
  { id: '2023500', label: 'Presunción de Inocencia', epoca: '10ª Época' }
];

export default function App() {
  const [totalCount, setTotalCount] = useState<number | null>(311838);
  const [activeTab, setActiveTab] = useState<'search' | 'dossier' | 'direct' | 'citations'>('search');
  
  const [filters, setFilters] = useState<FilterOptions>(INITIAL_FILTERS);
  const [results, setResults] = useState<TesisData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalResultsCount, setTotalResultsCount] = useState<number>(0);

  // Active Dossier (Carpeta de Trabajo)
  const [selectedTesis, setSelectedTesis] = useState<TesisData[]>(() => {
    try {
      const saved = localStorage.getItem('scjn_expediente_tesis');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [dossierTitle, setDossierTitle] = useState('Expediente de Jurisprudencias SCJN');
  const [isDossierPdfLoading, setIsDossierPdfLoading] = useState(false);
  const [copiedAllCitations, setCopiedAllCitations] = useState(false);

  // Direct Lookup state (in Direct Tab)
  const [directInput, setDirectInput] = useState('');
  const [isDirectLoading, setIsDirectLoading] = useState(false);
  const [directError, setDirectError] = useState<string | null>(null);

  // Citations Studio Selected Tesis
  const [citationStudioTesis, setCitationStudioTesis] = useState<TesisData | null>(null);
  const [copiedCitationKey, setCopiedCitationKey] = useState<string | null>(null);

  // Modal States
  const [detailTesis, setDetailTesis] = useState<TesisData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [citeTesis, setCiteTesis] = useState<TesisData | null>(null);
  const [isCiteOpen, setIsCiteOpen] = useState<boolean>(false);
  const [isOfflineSyncOpen, setIsOfflineSyncOpen] = useState<boolean>(false);
  const [offlineCount, setOfflineCount] = useState<number>(0);

  // Save selected dossier to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('scjn_expediente_tesis', JSON.stringify(selectedTesis));
    } catch (err) {
      console.warn('Error saving to localStorage:', err);
    }
  }, [selectedTesis]);

  // Check offline DB count on mount
  useEffect(() => {
    getOfflineTesisCount().then((count) => {
      setOfflineCount(count);
    });
  }, []);

  // Background auto-sync all SCJN data with full metadata to Firestore
  useEffect(() => {
    getFirestoreTesisCount().then((count) => {
      fetch('/api/scjn/all-database')
        .then(res => res.json())
        .then(data => {
          if (data && data.tesis && data.tesis.length > 0) {
            if (count < data.tesis.length) {
              uploadEntireDatabaseToFirestore(data.tesis).catch(err => {
                console.warn('Background Firestore metadata hydration error:', err);
              });
            }
          }
        })
        .catch(() => {});
    });
  }, []);

  // Fetch total count on mount
  useEffect(() => {
    safeFetchJson<{ count?: number }>('/api/scjn/count')
      .then((res) => {
        if (res.ok && res.data && typeof res.data.count === 'number') {
          setTotalCount(res.data.count);
        }
      })
      .catch((err) => console.warn('Could not load count:', err));
  }, []);

  // Search API Call with Cloud Firestore & SCJN Hybrid Engine
  const performSearch = useCallback(async (targetPage = 1, currentFilters = filters) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('page', targetPage.toString());
      params.append('pageSize', '15');

      if (currentFilters.query.trim()) params.append('q', currentFilters.query.trim());
      if (currentFilters.epoca !== 'todas') params.append('epoca', currentFilters.epoca);
      if (currentFilters.instancia !== 'todas') params.append('instancia', currentFilters.instancia);
      if (currentFilters.judicialBody && currentFilters.judicialBody !== 'all' && currentFilters.judicialBody !== 'todas') {
        params.append('judicialBody', currentFilters.judicialBody);
      }
      if (currentFilters.tipo !== 'todos') params.append('tipo', currentFilters.tipo);
      if (currentFilters.materia !== 'todas') params.append('materia', currentFilters.materia);
      if (currentFilters.startDate) params.append('startDate', currentFilters.startDate);
      if (currentFilters.endDate) params.append('endDate', currentFilters.endDate);
      if (currentFilters.sortBy) params.append('sortBy', currentFilters.sortBy);

      // Run Server Search and Cloud Firestore in parallel for maximum recall & speed
      const [apiPromise, firestorePromise] = [
        safeFetchJson<any>(`/api/scjn/search?${params.toString()}`),
        currentFilters.query.trim() 
          ? searchFirestoreTesis(
              currentFilters.query.trim(), 
              currentFilters.epoca, 
              currentFilters.materia, 
              currentFilters.judicialBody || currentFilters.instancia,
              30
            )
          : searchFirestoreTesis('', currentFilters.epoca, currentFilters.materia, undefined, 30)
      ];

      const [resp, firestoreResults] = await Promise.all([
        apiPromise.catch(() => ({ ok: false, data: null })),
        firestorePromise.catch(() => [] as TesisData[])
      ]);

      const apiData = resp.ok && resp.data ? resp.data : { results: [], total: 0, totalPages: 1 };
      const apiResults: TesisData[] = apiData.results || [];

      // Merge and deduplicate records with full metadata preservation
      const recordMap = new Map<string, TesisData>();

      // Add API results
      apiResults.forEach(item => {
        const id = String(item.registroDigital || item.ius || item.id);
        if (id) recordMap.set(id, item);
      });

      // Merge Cloud Firestore results
      firestoreResults.forEach(item => {
        const id = String(item.registroDigital || item.ius || item.id);
        if (id) {
          if (recordMap.has(id)) {
            // Merge metadata fields
            const existing = recordMap.get(id)!;
            recordMap.set(id, { ...existing, ...item });
          } else {
            recordMap.set(id, item);
          }
        }
      });

      const mergedResults = Array.from(recordMap.values());

      // Sorting
      if (currentFilters.sortBy === 'date_desc') {
        mergedResults.sort((a, b) => (b.fechaPublicacion || '').localeCompare(a.fechaPublicacion || ''));
      } else if (currentFilters.sortBy === 'date_asc') {
        mergedResults.sort((a, b) => (a.fechaPublicacion || '').localeCompare(b.fechaPublicacion || ''));
      } else if (currentFilters.sortBy === 'id_desc') {
        mergedResults.sort((a, b) => Number(b.registroDigital || b.id || 0) - Number(a.registroDigital || a.id || 0));
      } else if (currentFilters.sortBy === 'id_asc') {
        mergedResults.sort((a, b) => Number(a.registroDigital || a.id || 0) - Number(b.registroDigital || b.id || 0));
      }

      setResults(mergedResults);
      setTotalPages(Math.max(apiData.totalPages || 1, Math.ceil(mergedResults.length / 15) || 1));
      setPage(targetPage);
      setTotalResultsCount(Math.max(apiData.total || 0, mergedResults.length));

      // Auto-persist fresh metadata into Firestore in background
      if (apiResults.length > 0) {
        apiResults.forEach((t: TesisData) => {
          saveTesisToCloud(t).catch(() => {});
        });
      }

      // Auto-set citation studio sample if empty
      if (!citationStudioTesis && mergedResults.length > 0) {
        setCitationStudioTesis(mergedResults[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al buscar tesis en el repositorio de la SCJN.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, citationStudioTesis]);

  useEffect(() => {
    performSearch(1);
  }, []);

  // Filter Handlers
  const handleFilterChange = (updated: Partial<FilterOptions>) => {
    const nextFilters = { ...filters, ...updated };
    setFilters(nextFilters);
    setPage(1);
    performSearch(1, nextFilters);
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setPage(1);
    performSearch(1, INITIAL_FILTERS);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      performSearch(newPage);
      const container = document.getElementById('mobile-scroll-container');
      if (container) container.scrollTop = 0;
    }
  };

  // Dossier Helpers
  const isTesisSelected = (tesis: TesisData) => {
    const id = String(tesis.registroDigital || tesis.id);
    return selectedTesis.some((t) => String(t.registroDigital || t.id) === id);
  };

  const toggleSelectTesis = (tesis: TesisData) => {
    const id = String(tesis.registroDigital || tesis.id);
    if (isTesisSelected(tesis)) {
      setSelectedTesis((prev) => prev.filter((t) => String(t.registroDigital || t.id) !== id));
    } else {
      setSelectedTesis((prev) => [tesis, ...prev]);
    }
  };

  const handleSelectAllPage = () => {
    const allSelected = results.every((r) => isTesisSelected(r));
    if (allSelected) {
      const pageIds = new Set(results.map((r) => String(r.registroDigital || r.id)));
      setSelectedTesis((prev) => prev.filter((t) => !pageIds.has(String(t.registroDigital || t.id))));
    } else {
      const newItems = results.filter((r) => !isTesisSelected(r));
      setSelectedTesis((prev) => [...prev, ...newItems]);
    }
  };

  const handleRemoveFromDossier = (id: string | number) => {
    setSelectedTesis((prev) => prev.filter((t) => String(t.registroDigital || t.id) !== String(id)));
  };

  const handleClearDossier = () => {
    setSelectedTesis([]);
  };

  const handleExportDossierPdf = () => {
    if (selectedTesis.length === 0) return;
    setIsDossierPdfLoading(true);
    try {
      generateBatchTesisPdf(selectedTesis, dossierTitle);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsDossierPdfLoading(false), 800);
    }
  };

  const handleCopyAllCitations = async () => {
    if (selectedTesis.length === 0) return;
    let combined = `=======================================================\n`;
    combined += `COMPENDIO DE CITAS JURISPRUDENCIALES SCJN\n`;
    combined += `${dossierTitle}\n`;
    combined += `Total de criterios: ${selectedTesis.length}\n`;
    combined += `=======================================================\n\n`;

    selectedTesis.forEach((t, i) => {
      const cite = generateCitations(t);
      combined += `[CRITERIO ${i + 1}]\n${cite.demandaEscrito}\n\n-------------------------------------------------------\n\n`;
    });

    try {
      await navigator.clipboard.writeText(combined);
      setCopiedAllCitations(true);
      setTimeout(() => setCopiedAllCitations(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // Direct Lookup Action
  const handleDirectLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = directInput.trim();
    if (!clean) return;

    setIsDirectLoading(true);
    setDirectError(null);

    try {
      // 1. Try Firestore first
      const cloudTesis = await getTesisFromCloud(clean);
      if (cloudTesis) {
        setDetailTesis(cloudTesis);
        setIsDetailOpen(true);
        setCitationStudioTesis(cloudTesis);
        return;
      }

      // 2. Fallback to SCJN API
      const resp = await safeFetchJson<TesisData>(`/api/scjn/tesis/${encodeURIComponent(clean)}`);
      if (!resp.ok || !resp.data) {
        throw new Error(resp.error || `No se encontró ninguna tesis con el Registro Digital "${clean}". Verifica que el número sea de 5 a 7 dígitos.`);
      }
      const data = resp.data;
      saveTesisToCloud(data).catch(() => {});
      setDetailTesis(data);
      setIsDetailOpen(true);
      setCitationStudioTesis(data);
    } catch (err: any) {
      setDirectError(err.message || 'Error al consultar la tesis.');
    } finally {
      setIsDirectLoading(false);
    }
  };

  const handleOpenDirectId = async (idStr: string) => {
    setDirectInput(idStr);
    setIsDirectLoading(true);
    setDirectError(null);

    try {
      // 1. Try Firestore first
      const cloudTesis = await getTesisFromCloud(idStr);
      if (cloudTesis) {
        setDetailTesis(cloudTesis);
        setIsDetailOpen(true);
        setCitationStudioTesis(cloudTesis);
        return;
      }

      // 2. Fallback to API
      const r = await safeFetchJson<TesisData>(`/api/scjn/tesis/${idStr}`);
      if (!r.ok || !r.data) throw new Error(r.error || 'No disponible en este momento.');
      const data = r.data;
      saveTesisToCloud(data).catch(() => {});
      setDetailTesis(data);
      setIsDetailOpen(true);
      setCitationStudioTesis(data);
    } catch (err: any) {
      setDirectError(err.message || 'Error al cargar tesis.');
    } finally {
      setIsDirectLoading(false);
    }
  };

  // Modal open helpers
  const handleOpenDetail = (tesis: TesisData) => {
    setDetailTesis(tesis);
    setIsDetailOpen(true);
    setCitationStudioTesis(tesis);
  };

  const handleQuickCite = (tesis: TesisData) => {
    setCiteTesis(tesis);
    setIsCiteOpen(true);
    setCitationStudioTesis(tesis);
  };

  const handleCopyCitationStudio = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCitationKey(key);
      setTimeout(() => setCopiedCitationKey(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const allPageSelected = results.length > 0 && results.every((r) => isTesisSelected(r));
  const currentStudioCitations = citationStudioTesis ? generateCitations(citationStudioTesis) : null;

  return (
    <div className="w-full max-w-lg mx-auto h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans text-slate-900 select-none sm:border-x sm:border-slate-300 sm:shadow-2xl">
      
      {/* Mobile Top Navbar */}
      <Navbar
        totalCount={totalCount}
        selectedCount={selectedTesis.length}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenOfflineSync={() => setIsOfflineSyncOpen(true)}
        offlineReady={offlineCount > 0}
      />

      {/* Main Scrollable Content Area */}
      <main id="mobile-scroll-container" className="flex-1 overflow-y-auto overflow-x-hidden pb-20">
        
        {/* TAB 1: BUSCADOR DE TESIS */}
        {activeTab === 'search' && (
          <div className="p-3.5 sm:p-4 space-y-3">
            
            {/* Real-Time Database Indicator & Offline Downloader Trigger */}
            <div 
              onClick={() => setIsOfflineSyncOpen(true)}
              className="bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl p-3 shadow-xs border border-blue-800 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 bg-blue-500/30 rounded-lg shrink-0">
                  <Database className="w-4 h-4 text-blue-300" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold">Acervo SCJN</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[10px] bg-indigo-500/40 text-indigo-200 font-bold px-1.5 py-0.5 rounded border border-indigo-400/30">
                      ☁️ Firestore Cloud
                    </span>
                    {offlineCount > 0 && (
                      <span className="text-[10px] bg-emerald-500/30 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-500/40">
                        ⚡ 0ms Local ({offlineCount.toLocaleString()})
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-blue-200 font-medium truncate">
                    {totalCount ? totalCount.toLocaleString('es-MX') : '311,838'} criterios • Toca para sincronizar en la Nube y memoria local
                  </p>
                </div>
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOfflineSyncOpen(true);
                }}
                className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-[11px] font-bold rounded-lg transition-colors shrink-0 ml-2 border border-white/20"
              >
                {offlineCount > 0 ? 'Sincronizar' : 'Descargar'}
              </button>
            </div>

            {/* Quick Época Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-xs">
              <button
                type="button"
                onClick={() => handleFilterChange({ epoca: 'todas' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                  filters.epoca === 'todas'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Todas las Épocas
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange({ epoca: 'Undécima' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                  filters.epoca === 'Undécima'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                11ª Época (2021-Act)
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange({ epoca: 'Décima' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                  filters.epoca === 'Décima'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                10ª Época (2011-2021)
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange({ epoca: 'Novena' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                  filters.epoca === 'Novena'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                9ª Época (1995-2011)
              </button>
            </div>

            {/* Search and Advanced Filters */}
            <SearchBar
              filters={filters}
              onFilterChange={handleFilterChange}
              onSearchSubmit={() => {
                setPage(1);
                performSearch(1);
              }}
              isLoading={isLoading}
              onReset={handleResetFilters}
            />

            {/* Results Header Bar */}
            <div className="flex items-center justify-between px-1 text-xs">
              <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                <span>Resultados:</span>
                <strong className="text-slate-900 font-bold">{totalResultsCount.toLocaleString('es-MX')}</strong>
                <span>criterios</span>
              </div>

              {results.length > 0 && (
                <button
                  onClick={handleSelectAllPage}
                  className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  {allPageSelected ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                      <span>Desmarcar pág.</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5 text-blue-600" />
                      <span>Marcar pág. ({results.length})</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{error}</p>
                  <button
                    onClick={() => performSearch(page)}
                    className="mt-1 font-bold text-red-700 underline cursor-pointer"
                  >
                    Reintentar consulta
                  </button>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="space-y-3 pt-2">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-white p-4 rounded-xl border border-slate-200 animate-pulse space-y-2.5">
                    <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                    <div className="h-3 bg-slate-100 rounded-md w-full" />
                    <div className="h-3 bg-slate-100 rounded-md w-5/6" />
                    <div className="flex gap-2 pt-2">
                      <div className="h-6 bg-slate-200 rounded-md w-16" />
                      <div className="h-6 bg-slate-200 rounded-md w-16" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && results.length === 0 && !error && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <Search className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800">No se encontraron tesis con estos criterios</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Prueba buscando por una sola palabra clave o restablece los filtros para ver el catálogo general.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Restablecer filtros
                </button>
              </div>
            )}

            {/* Results List */}
            {!isLoading && results.length > 0 && (
              <div className="space-y-3">
                {results.map((tesis) => (
                  <TesisCard
                    key={String(tesis.registroDigital || tesis.id)}
                    tesis={tesis}
                    isSelected={isTesisSelected(tesis)}
                    onToggleSelect={toggleSelectTesis}
                    onOpenDetail={handleOpenDetail}
                    onQuickCite={handleQuickCite}
                  />
                ))}
              </div>
            )}

            {/* Mobile Pagination Bar */}
            {!isLoading && totalPages > 1 && (
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs mt-4">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-xs font-bold text-slate-700 rounded-xl transition-colors cursor-pointer min-h-[38px]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>

                <span className="text-xs text-slate-500 font-medium">
                  Pág. <strong className="text-slate-900 font-bold">{page}</strong> de <strong className="text-slate-900 font-bold">{totalPages.toLocaleString('es-MX')}</strong>
                </span>

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-xs font-bold text-slate-700 rounded-xl transition-colors cursor-pointer min-h-[38px]"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: EXPEDIENTE / DOSSIER */}
        {activeTab === 'dossier' && (
          <div className="p-3.5 sm:p-4 space-y-4">
            
            {/* Header Card */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-600 p-2 rounded-xl">
                    <FolderArchive className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold">Mi Carpeta de Jurisprudencias</h2>
                    <p className="text-[11px] text-slate-400">
                      {selectedTesis.length} {selectedTesis.length === 1 ? 'criterio guardado' : 'criterios guardados'}
                    </p>
                  </div>
                </div>

                {selectedTesis.length > 0 && (
                  <button
                    onClick={handleClearDossier}
                    className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                    title="Vaciar expediente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Title input */}
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">
                  Carátula / Asunto del Compendio:
                </label>
                <input
                  type="text"
                  value={dossierTitle}
                  onChange={(e) => setDossierTitle(e.target.value)}
                  placeholder="Ej: Amparo en Revisión 124/2024..."
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Primary Batch Action Buttons */}
              {selectedTesis.length > 0 && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleExportDossierPdf}
                    disabled={isDossierPdfLoading}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer min-h-[42px]"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-200" />
                    <span>{isDossierPdfLoading ? 'Generando...' : 'Descargar PDF'}</span>
                  </button>

                  <button
                    onClick={handleCopyAllCitations}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer min-h-[42px]"
                  >
                    {copiedAllCitations ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                    <span>{copiedAllCitations ? '¡Copiado!' : 'Copiar Citas'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Dossier Item List */}
            {selectedTesis.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
                <FolderArchive className="w-12 h-12 text-slate-300 mx-auto" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800">El expediente está vacío</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                    Navega en el buscador y presiona el botón <strong>"+ Añadir"</strong> en cualquier tesis para compilarla en un PDF descargable.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('search')}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Explorar Acervo SCJN</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-semibold">
                  <span>Criterios en el documento ({selectedTesis.length})</span>
                </div>

                {selectedTesis.map((t, idx) => {
                  const reg = String(t.registroDigital || t.id);
                  return (
                    <div
                      key={reg}
                      className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-start justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0" onClick={() => handleOpenDetail(t)}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            #{idx + 1} • REG: {reg}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">
                            {t.tipoTesis || 'Jurisprudencia'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-2 cursor-pointer hover:text-blue-600">
                          {t.rubro}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 pt-0.5">
                        <button
                          onClick={() => generateSingleTesisPdf(t)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                          title="Descargar PDF individual"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleRemoveFromDossier(reg)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                          title="Quitar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* TAB 3: DIRECT LOOKUP (IUS) */}
        {activeTab === 'direct' && (
          <div className="p-3.5 sm:p-4 space-y-4">
            
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3.5">
              <div className="flex items-center gap-2.5">
                <div className="bg-blue-600 p-2 rounded-xl text-white">
                  <Hash className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Consulta Directa de Registro IUS
                  </h2>
                  <p className="text-xs text-slate-500">
                    Acceso instantáneo a cualquiera de las 311,838+ tesis del país.
                  </p>
                </div>
              </div>

              <form onSubmit={handleDirectLookupSubmit} className="space-y-3">
                <div>
                  <input
                    type="text"
                    value={directInput}
                    onChange={(e) => setDirectInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Introduce No. de Registro (ej. 2032503)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-center tracking-widest"
                  />
                </div>

                {directError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{directError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isDirectLoading || !directInput.trim()}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
                >
                  {isDirectLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Abrir Documento Oficial SCJN</span>
                </button>
              </form>

              {/* Sample Shortcuts */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-400 block mb-2 uppercase font-semibold">
                  Tesis Recientes y Precedentes Destacados:
                </span>
                <div className="space-y-1.5">
                  {SAMPLE_REGISTROS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleOpenDirectId(s.id)}
                      className="w-full p-2.5 text-left bg-slate-50 hover:bg-blue-50 text-slate-800 hover:text-blue-700 rounded-xl border border-slate-200 hover:border-blue-200 transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-slate-900 truncate">{s.label}</div>
                        <div className="text-[10px] text-slate-500">{s.epoca}</div>
                      </div>
                      <div className="text-xs font-mono font-bold text-blue-600 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shrink-0">
                        {s.id}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: CITAS JURÍDICAS & ALWD */}
        {activeTab === 'citations' && (
          <div className="p-3.5 sm:p-4 space-y-4">
            
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="bg-blue-600 p-2 rounded-xl text-white">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Generador Forense & ALWD Legal
                  </h2>
                  <p className="text-xs text-slate-500">
                    Formatos canónicos listos para copiar a tu demanda o escrito judicial.
                  </p>
                </div>
              </div>

              {citationStudioTesis ? (
                <div className="space-y-3 pt-2">
                  {/* Current Active Rubro */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800">
                    <span className="text-[10px] font-mono text-blue-600 font-bold block mb-1">
                      REG: {String(citationStudioTesis.registroDigital || citationStudioTesis.id)}
                    </span>
                    <p className="font-semibold line-clamp-2">{citationStudioTesis.rubro}</p>
                  </div>

                  {currentStudioCitations && (
                    <div className="space-y-3">
                      {/* ALWD */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">
                            1. Estilo ALWD Legal Internacional
                          </span>
                          <button
                            onClick={() => handleCopyCitationStudio(currentStudioCitations.alwd, 'alwd')}
                            className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold transition-colors"
                          >
                            {copiedCitationKey === 'alwd' ? '¡Copiado!' : 'Copiar'}
                          </button>
                        </div>
                        <pre className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap">
                          {currentStudioCitations.alwd}
                        </pre>
                      </div>

                      {/* Escrito de Demanda */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">
                            2. Para Escrito de Demanda / Amparo
                          </span>
                          <button
                            onClick={() => handleCopyCitationStudio(currentStudioCitations.demandaEscrito, 'demanda')}
                            className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold transition-colors"
                          >
                            {copiedCitationKey === 'demanda' ? '¡Copiado!' : 'Copiar'}
                          </button>
                        </div>
                        <pre className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap font-sans">
                          {currentStudioCitations.demandaEscrito}
                        </pre>
                      </div>

                      {/* Semanario Oficial */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">
                            3. Oficial Semanario Judicial (SJF)
                          </span>
                          <button
                            onClick={() => handleCopyCitationStudio(currentStudioCitations.scjnOficial, 'scjn')}
                            className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors"
                          >
                            {copiedCitationKey === 'scjn' ? '¡Copiado!' : 'Copiar'}
                          </button>
                        </div>
                        <pre className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap font-sans">
                          {currentStudioCitations.scjnOficial}
                        </pre>
                      </div>

                      {/* APA 7 */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">
                            4. Formato APA 7.ª Edición
                          </span>
                          <button
                            onClick={() => handleCopyCitationStudio(currentStudioCitations.apa7, 'apa')}
                            className="px-2.5 py-1 bg-white text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-colors"
                          >
                            {copiedCitationKey === 'apa' ? '¡Copiado!' : 'Copiar'}
                          </button>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800">
                          {currentStudioCitations.apa7}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400">
                  <Quote className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">
                    Selecciona una tesis en el buscador para visualizar todas sus citas forenses.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* Android Mobile Bottom Navigation Bar (Dock) */}
      <nav className="fixed bottom-0 inset-x-0 max-w-lg mx-auto bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-3 z-40 flex items-center justify-around shadow-lg">
        {/* Tab 1: Buscar */}
        <button
          onClick={() => setActiveTab('search')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer min-h-[48px] ${
            activeTab === 'search' ? 'text-blue-600 font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <Search className={`w-5 h-5 mb-0.5 ${activeTab === 'search' ? 'text-blue-600' : 'text-slate-400'}`} />
          <span className="text-[11px] leading-tight">Buscar</span>
        </button>

        {/* Tab 2: Expediente */}
        <button
          onClick={() => setActiveTab('dossier')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer relative min-h-[48px] ${
            activeTab === 'dossier' ? 'text-blue-600 font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <div className="relative">
            <FolderArchive className={`w-5 h-5 mb-0.5 ${activeTab === 'dossier' ? 'text-blue-600' : 'text-slate-400'}`} />
            {selectedTesis.length > 0 && (
              <span className="absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 bg-blue-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {selectedTesis.length}
              </span>
            )}
          </div>
          <span className="text-[11px] leading-tight">Expediente</span>
        </button>

        {/* Tab 3: Directo IUS */}
        <button
          onClick={() => setActiveTab('direct')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer min-h-[48px] ${
            activeTab === 'direct' ? 'text-blue-600 font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <Hash className={`w-5 h-5 mb-0.5 ${activeTab === 'direct' ? 'text-blue-600' : 'text-slate-400'}`} />
          <span className="text-[11px] leading-tight">Registro</span>
        </button>

        {/* Tab 4: Citas Forenses */}
        <button
          onClick={() => setActiveTab('citations')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer min-h-[48px] ${
            activeTab === 'citations' ? 'text-blue-600 font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <Scale className={`w-5 h-5 mb-0.5 ${activeTab === 'citations' ? 'text-blue-600' : 'text-slate-400'}`} />
          <span className="text-[11px] leading-tight">Citas</span>
        </button>
      </nav>

      {/* Full Screen / Bottom Sheet Reader & Citer Modals */}
      <TesisDetailModal
        tesis={detailTesis}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        isSelected={detailTesis ? isTesisSelected(detailTesis) : false}
        onToggleSelect={toggleSelectTesis}
      />

      <QuickCiteModal
        tesis={citeTesis}
        isOpen={isCiteOpen}
        onClose={() => setIsCiteOpen(false)}
      />

      <OfflineSyncModal
        isOpen={isOfflineSyncOpen}
        onClose={() => setIsOfflineSyncOpen(false)}
        onSyncComplete={(count) => {
          setOfflineCount(count);
          performSearch(1);
        }}
      />

    </div>
  );
}
