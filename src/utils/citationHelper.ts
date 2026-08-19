import { TesisData, CitationFormats, CitationComponents } from '../types';

export function extractCitationComponents(tesis: TesisData): CitationComponents {
  const digitalRegister = String(tesis.registroDigital || tesis.ius || tesis.id || 'N/D');
  const caseName = tesis.rubro || 'Sin Rubro Especificado';
  const court = tesis.instancia || tesis.organoJurisdiccional || 'Suprema Corte de Justicia de la Nación';
  const epoca = tesis.epoca || 'Undécima Época';
  const source = tesis.fuente || 'Semanario Judicial de la Federación';
  const keyNumber = tesis.clave || '';
  const thesisType = tesis.tipoTesis || 'Jurisprudencia';

  // Extract docket number / expediente from precedentes or explicit fields
  let docketNumber = tesis.expediente || tesis.asunto || '';
  if (!docketNumber && tesis.precedentes) {
    const docketMatch = tesis.precedentes.match(/(Amparo\s+(?:en\s+revisi[oó]n|directo(?:\s+en\s+revisi[oó]n)?|indirecto)?\s+\d+\/\d{4}|Contradicci[oó]n\s+de\s+(?:tesis|criterios)\s+\d+\/\d{4}|Acci[oó]n\s+de\s+inconstitucionalidad\s+\d+\/\d{4}|Controversia\s+constitucional\s+\d+\/\d{4}|Recurso\s+de\s+reclamaci[oó]n\s+\d+\/\d{4}|Incidente\s+de\s+incompetencia\s+\d+\/\d{4})/i);
    if (docketMatch) {
      docketNumber = docketMatch[1];
    }
  }
  if (!docketNumber) {
    docketNumber = `Exp. Reg. ${digitalRegister}`;
  }

  // Extract judge rapporteur / ponente
  let judgeRapporteur = tesis.ponente || '';
  if (!judgeRapporteur && tesis.precedentes) {
    const ponenteMatch = tesis.precedentes.match(/Ponente:\s*(?:Ministr[oa]|Magistrad[oa])?\s*([^.\n;]+)/i);
    if (ponenteMatch) {
      judgeRapporteur = ponenteMatch[1].trim();
    }
  }

  // Extract date
  let date = tesis.fechaPublicacion || tesis.fechaSentencia || '';
  if (!date && tesis.precedentes) {
    const dateMatch = tesis.precedentes.match(/(\d{1,2}\s+de\s+[a-záéíóú]+\s+de\s+\d{4})/i);
    if (dateMatch) {
      date = dateMatch[1];
    }
  }
  if (!date) {
    date = epoca.includes('Undécima') ? '2021-2025' : (epoca.includes('Décima') ? '2011-2021' : 's.f.');
  }

  return {
    caseName,
    docketNumber,
    court,
    date,
    digitalRegister,
    epoca,
    source,
    keyNumber,
    judgeRapporteur: judgeRapporteur || 'No especificado en registro',
    thesisType
  };
}

export function generateCitations(tesis: TesisData): CitationFormats {
  const comp = extractCitationComponents(tesis);
  const materia = Array.isArray(tesis.materias) ? tesis.materias.join(', ') : (tesis.materia || 'Común');
  const localizacion = tesis.localizacion ? `${tesis.localizacion}.` : '';
  const clavePrefix = comp.keyNumber ? `Tesis: ${comp.keyNumber}. ` : '';

  // 1. ALWD Guide to Legal Citation (adapted for Mexican Constitutional & Federal Courts)
  // Standard format: Court [Abbr.], Division/Chamber, Docket/Case Name, Reporter [Abbr.], Epoch, Thesis No., Digital Reg. (Date).
  const alwd = `SCJN, ${comp.court}, ${comp.docketNumber}, Semanario Judicial de la Federación [S.J.F.], ${comp.epoca}${comp.keyNumber ? `, Tesis ${comp.keyNumber}` : ''}, Reg. Digital ${comp.digitalRegister} (${comp.date}).`;

  // 2. Formato SCJN Oficial (Semanario Judicial de la Federación y Gaceta)
  const scjnOficial = `Registro digital: ${comp.digitalRegister}.
Instancia: ${comp.court}.
${comp.epoca}.
Materia(s): ${materia}.
${clavePrefix}Fuente: ${comp.source}.
${localizacion ? `${localizacion}\n` : ''}Tipo: ${comp.thesisType}.

${comp.caseName}.
${tesis.texto ? `\n${tesis.texto}` : ''}
${tesis.precedentes ? `\n\nPrecedentes:\n${tesis.precedentes}` : ''}`.trim();

  // 3. Formato para Demanda / Escrito Judicial (Listo para insertar en capítulos de Derecho / Conceptos de Violación)
  const demandaEscrito = `Al respecto, resulta plenamente aplicable el criterio obligatorio sustentado por ${comp.court}, visible en el Semanario Judicial de la Federación con el Registro Digital ${comp.digitalRegister} (${comp.epoca}), cuyos rubro y texto a la letra rezan:

"${comp.caseName}."
${tesis.texto ? `\n"${tesis.texto}"` : ''}

[${comp.thesisType}, ${comp.court}, ${comp.epoca}, Registro Digital: ${comp.digitalRegister}${comp.keyNumber ? `, ${comp.keyNumber}` : ''}${comp.docketNumber ? `, Asunto: ${comp.docketNumber}` : ''}]`.trim();

  // 4. Formato APA 7ma Edición
  const apaYear = comp.date.match(/\d{4}/)?.[0] || 's.f.';
  const apa7 = `Suprema Corte de Justicia de la Nación [SCJN]. (${apaYear}). ${comp.caseName} [${comp.thesisType}]. ${comp.source}. Registro Digital ${comp.digitalRegister}. https://sjf2.scjn.gob.mx/detalle/tesis/${comp.digitalRegister}`;

  // 5. Formato Chicago / Footnote Jurídico
  const chicago = `Suprema Corte de Justicia de la Nación, ${comp.court}, «${comp.caseName}», ${comp.thesisType}, ${comp.epoca}, Registro Digital ${comp.digitalRegister}${comp.docketNumber ? ` (${comp.docketNumber})` : ''}.`;

  // 6. Formato Corto / Pinpoint
  const shortRubro = comp.caseName.length > 80 ? `${comp.caseName.slice(0, 77)}...` : comp.caseName;
  const formatoCorto = `SCJN, ${comp.court}, Reg. ${comp.digitalRegister}, ${comp.epoca} («${shortRubro}»)`;

  return {
    alwd,
    scjnOficial,
    demandaEscrito,
    apa7,
    chicago,
    formatoCorto,
    components: comp
  };
}

