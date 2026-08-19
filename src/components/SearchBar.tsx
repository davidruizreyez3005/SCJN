import React, { useState } from 'react';
import { 
  Search, 
  X, 
  SlidersHorizontal, 
  RefreshCw, 
  Sparkles, 
  Calendar, 
  Scale, 
  ArrowUpDown,
  Layers,
  BookOpen,
  Database
} from 'lucide-react';
import { FilterOptions } from '../types';

interface SearchBarProps {
  filters: FilterOptions;
  onFilterChange: (newFilters: Partial<FilterOptions>) => void;
  onSearchSubmit: () => void;
  isLoading: boolean;
  onReset: () => void;
}

const QUICK_TOPICS = [
  'Alimentos',
  'Pensión Retroactiva',
  'Violencia Vicaria',
  'Custodia Compartida',
  'Amparo Indirecto',
  'Suspensión Provisional',
  'Presunción de Inocencia',
  'Audiencia Inicial',
  'Tortura y Prueba Ilícita',
  'Despido Injustificado',
  'Salarios Caídos',
  'Teletrabajo',
  'Transferencias Bancarias',
  'Usura en Pagaré',
  'Bloqueo de Cuentas UIF',
  'Devolución de Impuestos',
  'Caducidad Fiscal',
  'Arrendamiento y Desahucio',
  'Prescripción Positiva',
  'Daño Moral',
  'Suplencia de la Queja',
  'Perspectiva de Género',
  'Libre Desarrollo',
  'Derecho al Agua'
];

export const SearchBar: React.FC<SearchBarProps> = ({
  filters,
  onFilterChange,
  onSearchSubmit,
  isLoading,
  onReset
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit();
  };

  const handlePresetClick = (topic: string) => {
    onFilterChange({ query: topic });
    setTimeout(() => {
      onSearchSubmit();
    }, 50);
  };

  const setDatePreset = (preset: 'year' | '3years' | '11th' | 'all') => {
    const today = new Date().toISOString().split('T')[0];
    if (preset === 'year') {
      const past = new Date();
      past.setFullYear(past.getFullYear() - 1);
      onFilterChange({ startDate: past.toISOString().split('T')[0], endDate: today });
    } else if (preset === '3years') {
      const past = new Date();
      past.setFullYear(past.getFullYear() - 3);
      onFilterChange({ startDate: past.toISOString().split('T')[0], endDate: today });
    } else if (preset === '11th') {
      onFilterChange({ startDate: '2021-05-01', endDate: today, epoca: 'Undécima' });
    } else {
      onFilterChange({ startDate: '', endDate: '' });
    }
  };

  const activeFilterCount = [
    filters.epoca !== 'todas',
    filters.instancia !== 'todas' || (filters.judicialBody && filters.judicialBody !== 'todas' && filters.judicialBody !== 'all'),
    filters.tipo !== 'todos',
    filters.materia !== 'todas',
    Boolean(filters.startDate || filters.endDate),
    filters.sortBy && filters.sortBy !== 'relevance'
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 sm:p-4 mb-3.5">
      <form onSubmit={handleSubmit}>
        
        {/* Main Search Input */}
        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          
          <input
            id="main-search-input"
            type="text"
            value={filters.query}
            onChange={(e) => onFilterChange({ query: e.target.value })}
            placeholder="Buscar por Registro (ej. 2032503), rubro o palabras..."
            className="w-full pl-9 pr-20 py-2.5 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-900 placeholder-slate-400 border border-transparent focus:border-blue-500 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />

          <div className="absolute right-1.5 flex items-center gap-1">
            {filters.query && (
              <button
                type="button"
                onClick={() => onFilterChange({ query: '' })}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              id="search-submit-btn"
              type="submit"
              disabled={isLoading}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer min-h-[34px]"
            >
              {isLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              <span>Buscar</span>
            </button>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="mt-2.5 flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-xs text-slate-600">
          <span className="font-semibold text-slate-400 flex items-center gap-1 shrink-0 text-[10px] uppercase tracking-wider mr-0.5">
            <Sparkles className="w-3 h-3 text-blue-500" />
            Temas:
          </span>
          {QUICK_TOPICS.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => handlePresetClick(topic)}
              className="px-2.5 py-1 shrink-0 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-medium text-[11px] transition-colors cursor-pointer border border-transparent hover:border-blue-200 whitespace-nowrap"
            >
              {topic}
            </button>
          ))}
        </div>

        {/* Toggle Filters & Sort Toolbar */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <button
              id="toggle-advanced-filters-btn"
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex items-center gap-1 text-[11px] font-bold transition-colors cursor-pointer px-2.5 py-1.5 rounded-lg shrink-0 ${
                showAdvanced || activeFilterCount > 0
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filtros</span>
              {activeFilterCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-blue-600 text-white rounded-full text-[9px] font-black">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Quick Sort Dropdown */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 flex-1 min-w-0">
              <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" />
              <select
                id="search-sort-select"
                value={filters.sortBy || 'relevance'}
                onChange={(e) => {
                  onFilterChange({ sortBy: e.target.value as any });
                  setTimeout(() => onSearchSubmit(), 30);
                }}
                className="bg-transparent text-[11px] font-semibold text-slate-700 focus:outline-none cursor-pointer w-full truncate"
              >
                <option value="relevance">Relevancia Jurídica</option>
                <option value="date_desc">Más Recientes (Fecha)</option>
                <option value="date_asc">Más Antiguos (Fecha)</option>
                <option value="id_desc">Reg. Digital (Mayor)</option>
                <option value="id_asc">Reg. Digital (Menor)</option>
              </select>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button
              id="reset-filters-btn"
              type="button"
              onClick={onReset}
              className="text-[11px] text-red-600 hover:underline font-bold transition-colors cursor-pointer shrink-0"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {showAdvanced && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
            
            <div className="grid grid-cols-2 gap-2">
              {/* Época */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-blue-600" />
                  Época
                </label>
                <select
                  id="filter-epoca"
                  value={filters.epoca}
                  onChange={(e) => onFilterChange({ epoca: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option value="todas">Todas las Épocas</option>
                  <option value="Undécima">Undécima (2021-Act)</option>
                  <option value="Décima">Décima (2011-2021)</option>
                  <option value="Novena">Novena (1995-2011)</option>
                  <option value="Octava">Octava (1988-1995)</option>
                  <option value="Séptima">Séptima (1969-1988)</option>
                  <option value="Sexta">Sexta (1957-1969)</option>
                  <option value="Quinta">Quinta (1917-1957)</option>
                </select>
              </div>

              {/* Materia Jurídica */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Materia
                </label>
                <select
                  id="filter-materia"
                  value={filters.materia}
                  onChange={(e) => onFilterChange({ materia: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option value="todas">Todas las Materias</option>
                  <option value="Constitucional">Constitucional</option>
                  <option value="Penal">Penal</option>
                  <option value="Civil">Civil</option>
                  <option value="Laboral">Laboral</option>
                  <option value="Administrativa">Administrativa</option>
                  <option value="Común">Común</option>
                  <option value="Familiar">Familiar</option>
                  <option value="Fiscal">Fiscal</option>
                  <option value="Agraria">Agraria</option>
                  <option value="Mercantil">Mercantil</option>
                  <option value="Ambiental">Ambiental</option>
                </select>
              </div>

              {/* Órgano Jurisdiccional */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 flex items-center gap-1">
                  <Scale className="w-3 h-3 text-blue-600" />
                  Órgano / Instancia
                </label>
                <select
                  id="filter-judicial-body"
                  value={filters.judicialBody || filters.instancia}
                  onChange={(e) => {
                    const val = e.target.value;
                    onFilterChange({ judicialBody: val, instancia: val });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option value="todas">Todos los Órganos</option>
                  <option value="scjn_all">Suprema Corte (Pleno y Salas)</option>
                  <option value="scjn_pleno">Pleno de la SCJN</option>
                  <option value="scjn_primera_sala">Primera Sala SCJN</option>
                  <option value="scjn_segunda_sala">Segunda Sala SCJN</option>
                  <option value="colegiados">Tribunales Colegiados</option>
                  <option value="plenos_regionales">Plenos Regionales</option>
                </select>
              </div>

              {/* Tipo de Tesis */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-slate-500" />
                  Tipo de Criterio
                </label>
                <select
                  id="filter-tipo"
                  value={filters.tipo}
                  onChange={(e) => onFilterChange({ tipo: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option value="todos">Todos los Tipos</option>
                  <option value="Jurisprudencia">Jurisprudencia (Obligatoria)</option>
                  <option value="Tesis Aislada">Tesis Aislada (Orientadora)</option>
                </select>
              </div>
            </div>

            {/* Date Range Filtering */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-blue-600" />
                  Rango de Fechas
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDatePreset('year')}
                    className="px-1.5 py-0.5 text-[10px] font-semibold bg-white text-slate-600 rounded border border-slate-200"
                  >
                    1 Año
                  </button>
                  <button
                    type="button"
                    onClick={() => setDatePreset('11th')}
                    className="px-1.5 py-0.5 text-[10px] font-semibold bg-white text-slate-600 rounded border border-slate-200"
                  >
                    11ª Época
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  id="filter-start-date"
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => onFilterChange({ startDate: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 font-medium"
                />
                <input
                  id="filter-end-date"
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => onFilterChange({ endDate: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 font-medium"
                />
              </div>
            </div>

            {/* Action Bar */}
            <button
              type="button"
              onClick={() => onSearchSubmit()}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              Aplicar Filtros al Acervo
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
