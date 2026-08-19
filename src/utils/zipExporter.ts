import JSZip from 'jszip';
import { TesisData } from '../types';
import { generateCitations } from './citationHelper';

export async function exportBatchAsZip(tesisList: TesisData[], folderName = 'Jurisprudencias_SCJN'): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder(folderName) || zip;

  // Add an index summary text file
  let indexContent = `=======================================================\n`;
  indexContent += `COMPENDIO DE JURISPRUDENCIAS Y TESIS SCJN\n`;
  indexContent += `Fecha de generación: ${new Date().toLocaleString('es-MX')}\n`;
  indexContent += `Total de criterios: ${tesisList.length}\n`;
  indexContent += `Fuente: Repositorio Oficial SCJN / Semanario Judicial de la Federación\n`;
  indexContent += `=======================================================\n\n`;

  tesisList.forEach((tesis, idx) => {
    const reg = tesis.registroDigital || tesis.id || 'N_D';
    const citations = generateCitations(tesis);

    indexContent += `${idx + 1}. [Registro Digital ${reg}] ${tesis.rubro}\n`;
    indexContent += `   Época: ${tesis.epoca || 'Undécima'} | Instancia: ${tesis.instancia || 'SCJN'} | Materia: ${tesis.materia || 'Común'}\n\n`;

    // Create individual text file for each tesis
    const fileName = `Tesis_${reg}.txt`;
    let fileBody = `=======================================================\n`;
    fileBody += `SUPREMA CORTE DE JUSTICIA DE LA NACIÓN\n`;
    fileBody += `REGISTRO DIGITAL: ${reg}\n`;
    fileBody += `=======================================================\n\n`;
    fileBody += `ÉPOCA: ${tesis.epoca || 'Undécima Época'}\n`;
    fileBody += `INSTANCIA: ${tesis.instancia || 'Suprema Corte de Justicia de la Nación'}\n`;
    fileBody += `TIPO DE TESIS: ${tesis.tipoTesis || 'Jurisprudencia'}\n`;
    fileBody += `MATERIA: ${Array.isArray(tesis.materias) ? tesis.materias.join(', ') : (tesis.materia || 'Común')}\n`;
    fileBody += `FUENTE: ${tesis.fuente || 'Semanario Judicial de la Federación'}\n`;
    fileBody += `LOCALIZACIÓN: ${tesis.localizacion || 'No especificada'}\n`;
    if (tesis.clave) fileBody += `CLAVE: ${tesis.clave}\n`;
    fileBody += `\n-------------------------------------------------------\n`;
    fileBody += `RUBRO:\n`;
    fileBody += `-------------------------------------------------------\n`;
    fileBody += `${tesis.rubro}\n\n`;
    fileBody += `-------------------------------------------------------\n`;
    fileBody += `TEXTO:\n`;
    fileBody += `-------------------------------------------------------\n`;
    fileBody += `${tesis.texto || 'Sin texto registrado.'}\n\n`;
    
    if (tesis.precedentes) {
      fileBody += `-------------------------------------------------------\n`;
      fileBody += `PRECEDENTES:\n`;
      fileBody += `-------------------------------------------------------\n`;
      fileBody += `${tesis.precedentes}\n\n`;
    }

    fileBody += `=======================================================\n`;
    fileBody += `CITAS OFICIALES Y DOCTRINALES:\n`;
    fileBody += `=======================================================\n`;
    fileBody += `[1] CITA OFICIAL SCJN:\n${citations.scjnOficial}\n\n`;
    fileBody += `[2] CITA PARA ESCRITO JUDICIAL / DEMANDA:\n${citations.demandaEscrito}\n\n`;
    fileBody += `[3] CITA FORMATO APA 7ma EDICIÓN:\n${citations.apa7}\n\n`;

    folder.file(fileName, fileBody);
  });

  // Add the Index file
  folder.file('00_INDICE_GENERAL.txt', indexContent);

  // Add the full JSON dataset file
  folder.file('tesis_dataset_completo.json', JSON.stringify(tesisList, null, 2));

  // Generate blob and trigger download
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${folderName}_${tesisList.length}_Tesis.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
