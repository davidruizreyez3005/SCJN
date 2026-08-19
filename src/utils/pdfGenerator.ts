import { jsPDF } from 'jspdf';
import { TesisData } from '../types';

export function generateSingleTesisPdf(tesis: TesisData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  let y = margin;

  // Header band - Sleek Blue 600
  doc.setFillColor(37, 99, 235);
  doc.rect(margin, y, contentWidth, 2.5, 'F');
  y += 8;

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('SUPREMA CORTE DE JUSTICIA DE LA NACIÓN', margin, y);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  y += 5;
  doc.text('REPOSITORIO DE JURISPRUDENCIAS Y TESIS AISLADAS', margin, y);
  
  const regId = String(tesis.registroDigital || tesis.ius || tesis.id || 'N/D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(37, 99, 235);
  doc.text(`REGISTRO DIGITAL: ${regId}`, pageWidth - margin, y - 2, { align: 'right' });

  y += 6;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Metadata Card Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 28, 2, 2, 'F');
  
  doc.setFontSize(8.5);
  const col1X = margin + 4;
  const col2X = margin + (contentWidth / 2) + 2;
  let metaY = y + 5.5;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Época:', col1X, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(tesis.epoca || 'Undécima Época', col1X + 16, metaY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Tipo:', col2X, metaY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(tesis.tipoTesis === 'Jurisprudencia' ? 37 : 15, tesis.tipoTesis === 'Jurisprudencia' ? 99 : 23, tesis.tipoTesis === 'Jurisprudencia' ? 235 : 42);
  doc.text(tesis.tipoTesis || 'Jurisprudencia', col2X + 14, metaY);

  metaY += 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Instancia:', col1X, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(tesis.instancia || 'SCJN', col1X + 18, metaY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Materia(s):', col2X, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  const matText = Array.isArray(tesis.materias) ? tesis.materias.join(', ') : (tesis.materia || 'Común');
  doc.text(matText, col2X + 18, metaY);

  metaY += 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Fuente:', col1X, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(tesis.fuente || 'Semanario Judicial de la Federación', col1X + 16, metaY);

  if (tesis.clave) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Clave:', col2X, metaY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(tesis.clave, col2X + 14, metaY);
  }

  metaY += 5.5;
  if (tesis.localizacion) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Localización:', col1X, metaY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(tesis.localizacion, col1X + 22, metaY);
  }

  y += 33;

  // Rubro Title Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(37, 99, 235);
  doc.text('RUBRO:', margin, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  const rubroLines = doc.splitTextToSize(tesis.rubro || 'SIN RUBRO', contentWidth);
  doc.text(rubroLines, margin, y);
  y += rubroLines.length * 4.8 + 4;

  // Texto / Cuerpo
  if (tesis.texto) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(37, 99, 235);
    doc.text('TEXTO:', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const textoLines = doc.splitTextToSize(tesis.texto, contentWidth);
    
    // Paginate if necessary
    for (let i = 0; i < textoLines.length; i++) {
      if (y > pageHeight - margin - 15) {
        doc.addPage();
        y = margin + 5;
      }
      doc.text(textoLines[i], margin, y);
      y += 4.6;
    }
    y += 4;
  }

  // Precedentes
  if (tesis.precedentes) {
    if (y > pageHeight - margin - 25) {
      doc.addPage();
      y = margin + 5;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(37, 99, 235);
    doc.text('PRECEDENTES:', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    const precLines = doc.splitTextToSize(tesis.precedentes, contentWidth);
    for (let i = 0; i < precLines.length; i++) {
      if (y > pageHeight - margin - 12) {
        doc.addPage();
        y = margin + 5;
      }
      doc.text(precLines[i], margin, y);
      y += 4.2;
    }
    y += 4;
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - margin + 2, pageWidth - margin, pageHeight - margin + 2);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('SCJN Repositorio Digital - Semanario Judicial de la Federación', margin, pageHeight - margin + 6);
    doc.text(`Página ${p} de ${totalPages}`, pageWidth - margin, pageHeight - margin + 6, { align: 'right' });
  }

  doc.save(`SCJN_Tesis_${regId}.pdf`);
}

export function generateBatchTesisPdf(tesisList: TesisData[], folderTitle = 'Compendio de Jurisprudencias SCJN'): void {
  if (!tesisList || tesisList.length === 0) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  // PORTADA / COVER PAGE
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 14, 'F');
  doc.setFillColor(37, 99, 235); // Blue 600 bar
  doc.rect(0, 14, pageWidth, 2.5, 'F');
  doc.setFillColor(15, 23, 42);
  doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');

  let y = 60;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.text('SUPREMA CORTE DE JUSTICIA DE LA NACIÓN', pageWidth / 2, y, { align: 'center' });
  
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.text('PODER JUDICIAL DE LA FEDERACIÓN • MÉXICO', pageWidth / 2, y, { align: 'center' });

  y += 25;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 40, 3, 3, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(37, 99, 235);
  doc.text(folderTitle.toUpperCase(), pageWidth / 2, y + 16, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Total de Criterios y Tesis Incluidos: ${tesisList.length}`, pageWidth / 2, y + 25, { align: 'center' });
  doc.text(`Generado: ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, y + 32, { align: 'center' });

  // ÍNDICE DE CONTENIDO
  y += 55;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('ÍNDICE DE TESIS:', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  for (let i = 0; i < Math.min(tesisList.length, 12); i++) {
    const item = tesisList[i];
    const reg = item.registroDigital || item.id || 'N/D';
    const rubroShort = (item.rubro || 'Sin rubro').slice(0, 75) + '...';
    doc.text(`${i + 1}. [Reg. ${reg}] ${rubroShort}`, margin, y);
    y += 5;
  }
  if (tesisList.length > 12) {
    doc.text(`... y ${tesisList.length - 12} tesis adicionales en este compendio.`, margin, y);
  }

  // AGREGAR CADA TESIS
  tesisList.forEach((tesis, index) => {
    doc.addPage();
    let currentY = margin;

    // Header bar
    doc.setFillColor(37, 99, 235);
    doc.rect(margin, currentY, contentWidth, 2, 'F');
    currentY += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(37, 99, 235);
    doc.text(`CRITERIO #${index + 1} DE ${tesisList.length} • REGISTRO DIGITAL: ${tesis.registroDigital || tesis.id}`, margin, currentY);
    currentY += 6;

    // Metadata box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, currentY, contentWidth, 22, 2, 2, 'F');

    doc.setFontSize(8);
    const c1 = margin + 3;
    const c2 = margin + contentWidth / 2;
    let mY = currentY + 5;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Época / Instancia:', c1, mY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(`${tesis.epoca || 'Undécima Época'} • ${tesis.instancia || 'SCJN'}`, c1 + 27, mY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Tipo:', c2, mY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text(tesis.tipoTesis || 'Jurisprudencia', c2 + 10, mY);

    mY += 5;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Materia(s):', c1, mY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(Array.isArray(tesis.materias) ? tesis.materias.join(', ') : (tesis.materia || 'Común'), c1 + 17, mY);

    if (tesis.localizacion) {
      mY += 5;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Localización:', c1, mY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(tesis.localizacion, c1 + 19, mY);
    }

    currentY += 26;

    // Rubro
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    const rLines = doc.splitTextToSize(tesis.rubro || 'SIN RUBRO', contentWidth);
    doc.text(rLines, margin, currentY);
    currentY += rLines.length * 4.6 + 4;

    // Texto
    if (tesis.texto) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      const tLines = doc.splitTextToSize(tesis.texto, contentWidth);
      for (let j = 0; j < tLines.length; j++) {
        if (currentY > pageHeight - margin - 12) {
          doc.addPage();
          currentY = margin + 5;
        }
        doc.text(tLines[j], margin, currentY);
        currentY += 4.2;
      }
      currentY += 3;
    }

    // Precedentes
    if (tesis.precedentes) {
      if (currentY > pageHeight - margin - 20) {
        doc.addPage();
        currentY = margin + 5;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(37, 99, 235);
      doc.text('Precedentes:', margin, currentY);
      currentY += 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      const pLines = doc.splitTextToSize(tesis.precedentes, contentWidth);
      for (let k = 0; k < pLines.length; k++) {
        if (currentY > pageHeight - margin - 10) {
          doc.addPage();
          currentY = margin + 5;
        }
        doc.text(pLines[k], margin, currentY);
        currentY += 3.8;
      }
    }
  });

  // Footer for all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - margin + 2, pageWidth - margin, pageHeight - margin + 2);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('SCJN Compendio Jurídico • Semanario Judicial de la Federación', margin, pageHeight - margin + 6);
    doc.text(`Página ${p} de ${totalPages}`, pageWidth - margin, pageHeight - margin + 6, { align: 'right' });
  }

  const safeTitle = folderTitle.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`${safeTitle}_${tesisList.length}_Tesis.pdf`);
}

