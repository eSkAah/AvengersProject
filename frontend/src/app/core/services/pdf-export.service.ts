import { Injectable, inject } from '@angular/core';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { MockDataService } from './mock-data.service';

export interface ExportOptions {
  title?: string;
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  includeTimestamp?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class PdfExportService {
  private readonly mockData = inject(MockDataService);

  /**
   * Export a specific HTML element to PDF
   */
  async exportElementToPdf(
    element: HTMLElement,
    options: ExportOptions = {}
  ): Promise<void> {
    const {
      title = 'Rapport Avengers',
      filename = 'rapport-avengers',
      orientation = 'portrait',
      includeTimestamp = true,
    } = options;

    // Show loading state
    const originalOpacity = element.style.opacity;

    try {
      // Capture the element as canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;

      // Add header
      this.addHeader(pdf, title, pageWidth, includeTimestamp);

      // Calculate image dimensions
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const headerOffset = 25;

      // Add image
      const imgData = canvas.toDataURL('image/png');

      if (imgHeight > pageHeight - headerOffset - margin) {
        // Multi-page handling
        let heightLeft = imgHeight;
        let position = headerOffset;

        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - position - margin);

        while (heightLeft > 0) {
          pdf.addPage();
          position = -(pageHeight - position - margin);
          pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      } else {
        pdf.addImage(imgData, 'PNG', margin, headerOffset, imgWidth, imgHeight);
      }

      // Add footer
      this.addFooter(pdf, pageWidth, pageHeight);

      // Save the PDF
      const timestamp = includeTimestamp ? `-${this.getTimestamp()}` : '';
      pdf.save(`${filename}${timestamp}.pdf`);
    } finally {
      element.style.opacity = originalOpacity;
    }
  }

  /**
   * Export dashboard data to PDF (structured report)
   */
  async exportDashboardReport(options: ExportOptions = {}): Promise<void> {
    const {
      title = 'Tableau de Bord - Rapport',
      filename = 'dashboard-rapport',
      includeTimestamp = true,
    } = options;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = 25;

    // Add header
    this.addHeader(pdf, title, pageWidth, includeTimestamp);

    // Get data
    const engagements = this.mockData.engagements();
    const documents = this.mockData.documents();
    const financialTotals = {
      totalAssets: engagements.reduce((sum, e) => sum + e.financialData.assets, 0),
      totalLiabilities: engagements.reduce((sum, e) => sum + e.financialData.liabilities, 0),
      totalRevenue: engagements.reduce((sum, e) => sum + e.financialData.revenue, 0),
      avgCompletion: Math.round(
        engagements.reduce((sum, e) => sum + e.completionPercent, 0) / engagements.length
      ),
    };

    // Section: Executive Summary
    yPosition = this.addSection(pdf, 'Résumé Exécutif', margin, yPosition);
    yPosition += 5;

    const summaryItems = [
      `Total Engagements: ${engagements.length}`,
      `Engagements à risque élevé: ${engagements.filter(e => e.riskLevel === 'high').length}`,
      `Engagements terminés: ${engagements.filter(e => e.status === 'completed').length}`,
      `Total Documents: ${documents.length}`,
      `Avancement moyen: ${financialTotals.avgCompletion}%`,
    ];

    summaryItems.forEach(item => {
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      pdf.text(`• ${item}`, margin + 5, yPosition);
      yPosition += 6;
    });

    yPosition += 10;

    // Section: Financial Summary
    yPosition = this.addSection(pdf, 'Résumé Financier', margin, yPosition);
    yPosition += 5;

    const financialItems = [
      `Total Actifs: ${this.formatCurrency(financialTotals.totalAssets)}`,
      `Total Passifs: ${this.formatCurrency(financialTotals.totalLiabilities)}`,
      `Chiffre d'affaires total: ${this.formatCurrency(financialTotals.totalRevenue)}`,
    ];

    financialItems.forEach(item => {
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      pdf.text(`• ${item}`, margin + 5, yPosition);
      yPosition += 6;
    });

    yPosition += 10;

    // Section: Engagements by Country
    yPosition = this.addSection(pdf, 'Répartition par Pays', margin, yPosition);
    yPosition += 5;

    // Group by country
    const byCountry: Record<string, { count: number; revenue: number }> = {};
    engagements.forEach(e => {
      if (!byCountry[e.country]) {
        byCountry[e.country] = { count: 0, revenue: 0 };
      }
      byCountry[e.country].count++;
      byCountry[e.country].revenue += e.financialData.revenue;
    });

    Object.entries(byCountry)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .forEach(([country, data]) => {
        pdf.setFontSize(10);
        pdf.setTextColor(60, 60, 60);
        pdf.text(`• ${country}: ${data.count} engagement(s) - ${this.formatCurrency(data.revenue)}`, margin + 5, yPosition);
        yPosition += 6;
      });

    yPosition += 10;

    // Section: Engagement Details Table
    yPosition = this.addSection(pdf, 'Détail des Engagements', margin, yPosition);
    yPosition += 8;

    // Table header
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Entité', margin, yPosition);
    pdf.text('Statut', margin + 60, yPosition);
    pdf.text('Risque', margin + 90, yPosition);
    pdf.text('Avancement', margin + 115, yPosition);
    pdf.text('Échéance', margin + 145, yPosition);

    yPosition += 2;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;

    // Table rows
    engagements.forEach(eng => {
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        this.addHeader(pdf, title, pageWidth, false);
        yPosition = 30;
      }

      pdf.setFontSize(9);
      pdf.setTextColor(40, 40, 40);
      pdf.text(eng.entity.substring(0, 25), margin, yPosition);
      pdf.text(this.getStatusLabel(eng.status), margin + 60, yPosition);

      // Risk color
      const riskColors: Record<string, [number, number, number]> = {
        high: [239, 68, 68],
        medium: [245, 158, 11],
        low: [16, 185, 129],
      };
      const riskColor = riskColors[eng.riskLevel] || [100, 100, 100];
      pdf.setTextColor(...riskColor);
      pdf.text(eng.riskLevel.toUpperCase(), margin + 90, yPosition);

      pdf.setTextColor(40, 40, 40);
      pdf.text(`${eng.completionPercent}%`, margin + 115, yPosition);
      pdf.text(new Date(eng.dueDate).toLocaleDateString('fr-FR'), margin + 145, yPosition);

      yPosition += 6;
    });

    // Add footer
    this.addFooter(pdf, pageWidth, pageHeight);

    // Save
    const timestamp = includeTimestamp ? `-${this.getTimestamp()}` : '';
    pdf.save(`${filename}${timestamp}.pdf`);
  }

  private addHeader(
    pdf: jsPDF,
    title: string,
    pageWidth: number,
    includeDate: boolean
  ): void {
    // Yellow header bar
    pdf.setFillColor(255, 230, 0);
    pdf.rect(0, 0, pageWidth, 18, 'F');

    // Title
    pdf.setFontSize(14);
    pdf.setTextColor(46, 46, 56);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, 15, 12);

    // Date
    if (includeDate) {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
        pageWidth - 70,
        12
      );
    }
  }

  private addSection(
    pdf: jsPDF,
    title: string,
    margin: number,
    yPosition: number
  ): number {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(46, 46, 56);
    pdf.text(title, margin, yPosition);

    // Underline
    pdf.setDrawColor(255, 230, 0);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition + 2, margin + 50, yPosition + 2);

    return yPosition + 8;
  }

  private addFooter(pdf: jsPDF, pageWidth: number, pageHeight: number): void {
    const totalPages = pdf.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);

      // Footer line
      pdf.setDrawColor(200, 200, 200);
      pdf.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);

      // Footer text
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text('Avengers Project - Document confidentiel', 15, pageHeight - 10);
      pdf.text(`Page ${i} / ${totalPages}`, pageWidth - 30, pageHeight - 10);
    }
  }

  private getTimestamp(): string {
    const now = new Date();
    return `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }

  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      received: 'Reçu',
      processing: 'En cours',
      review: 'En révision',
      completed: 'Terminé',
    };
    return labels[status] || status;
  }
}
