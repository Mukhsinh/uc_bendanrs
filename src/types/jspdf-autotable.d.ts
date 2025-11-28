declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';

  interface AutoTableOptions {
    head?: any[][];
    body?: any[][];
    startY?: number;
    theme?: 'striped' | 'grid' | 'plain';
    styles?: {
      fontSize?: number;
      cellPadding?: number;
      [key: string]: any;
    };
    headStyles?: {
      fillColor?: number[];
      textColor?: number | number[];
      fontStyle?: string;
      [key: string]: any;
    };
    columnStyles?: {
      [key: number]: {
        cellWidth?: number;
        fontStyle?: string;
        [key: string]: any;
      };
    };
    [key: string]: any;
  }

  function autoTable(doc: jsPDF, options: AutoTableOptions): void;

  export default autoTable;
}
