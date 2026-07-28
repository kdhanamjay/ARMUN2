import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CommitteeInfo } from '../types';
import { DEFAULT_JUDGE_PINS } from '../data/initialData';

export function exportCredentialsPDF(
  adminPin: string,
  judgePins: Record<string, string>,
  committees: CommitteeInfo[]
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const timestamp = new Date().toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('MUN SECRETARIAT CREDENTIALS DIRECTORY', 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`CONFIDENTIAL SECURITY DOCUMENT • Generated: ${timestamp}`, 14, 22);

  // Section 1: Executive Secretariat Admin Credentials
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('1. Secretariat Executive Admin Account', 14, 42);

  autoTable(doc, {
    startY: 46,
    head: [['Role Title', 'Account Username', 'Master Admin Password / PIN']],
    body: [
      ['Secretariat Admin / Executive', 'admin', adminPin || 'admin123'],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229], // indigo-600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { fontStyle: 'bold' },
      2: { fontStyle: 'bold' },
    },
  });

  // Section 2: Committee Judge Credentials
  const lastY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 12 : 70;

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('2. Committee Judge Login Credentials Matrix', 14, lastY);

  const judgeRows: string[][] = [];

  committees.forEach((c) => {
    [1, 2, 3].forEach((j) => {
      const key = `${c.id}-${j}`;
      const pin = judgePins[key] || DEFAULT_JUDGE_PINS[key] || '1111';
      const username = `${c.id.toLowerCase()}_judge${j}`;
      judgeRows.push([
        c.id,
        c.name,
        `Judge ${j}`,
        username,
        pin,
      ]);
    });
  });

  autoTable(doc, {
    startY: lastY + 4,
    head: [['Committee Code', 'Committee Name', 'Judge Slot', 'System Username', 'Security PIN / Password']],
    body: judgeRows,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42], // slate-900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      3: { fontStyle: 'bold' },
      4: { fontStyle: 'bold' },
    },
  });

  // Footer / Security Warning
  const pageHeight = doc.internal.pageSize.height;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    'STRICTLY CONFIDENTIAL • For authorized Model UN Secretariat & Evaluator distribution only.',
    14,
    pageHeight - 10
  );

  // Save the PDF file
  doc.save(`MUN_Credentials_Passwords_Directory_${new Date().toISOString().split('T')[0]}.pdf`);
}
