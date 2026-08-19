export interface TesisData {
  id?: string | number;
  ius?: string | number;
  registroDigital?: string | number;
  rubro?: string;
  texto?: string;
  precedentes?: string;
  epoca?: string;
  instancia?: string;
  tipoTesis?: string;
  materia?: string;
  materias?: string[];
  fuente?: string;
  localizacion?: string;
  clave?: string;
  asunto?: string;
  fechaPublicacion?: string;
  fechaSentencia?: string;
  volumen?: string;
  pagina?: string;
  tomo?: string;
  organoJurisdiccional?: string;
  circuito?: string;
  ponente?: string;
  expediente?: string;
  votacion?: string;
  urlPdfOficial?: string;
  relevanceScore?: number;
  [key: string]: any;
}

export interface CitationComponents {
  caseName: string;
  docketNumber: string;
  court: string;
  date: string;
  digitalRegister: string;
  epoca: string;
  source: string;
  keyNumber: string;
  judgeRapporteur: string;
  thesisType: string;
}

export interface CitationFormats {
  alwd: string;
  scjnOficial: string;
  demandaEscrito: string;
  apa7: string;
  chicago: string;
  formatoCorto: string;
  components: CitationComponents;
}

export interface FilterOptions {
  query: string;
  epoca: string;
  instancia: string;
  judicialBody: string;
  tipo: string;
  materia: string;
  startDate: string;
  endDate: string;
  sortBy: 'relevance' | 'date_desc' | 'date_asc' | 'id_desc' | 'id_asc';
}

export interface AiAnalysisResult {
  resumenEjecutivo: string;
  criterioJuridico: string;
  aplicabilidadPractica: string;
  palabrasClave: string[];
  citaRecomendada: string;
}

export interface BatchExportOptions {
  includeRubro: boolean;
  includeTexto: boolean;
  includePrecedentes: boolean;
  includeLocalizacion: boolean;
  includeCitas: boolean;
  includeAiSummary: boolean;
  format: 'pdf' | 'json' | 'txt' | 'zip';
}

