import { toast } from 'sonner';
import billPrintCss from '@/billPrint.css?raw';

/**
 * Prints a `.bill-print` element (a receipt/bill DOM node already rendered
 * on screen) in an isolated pop-up window instead of the app's own document.
 *
 * window.print() on the app itself also prints the dashboard/sidebar behind
 * the modal — hiding it with `visibility: hidden` still leaves it occupying
 * layout height, and `@page { size: 80mm auto }` measures the whole
 * document, so that leftover height fed through as a blank leading page on
 * the thermal roll. A pop-up whose document contains only the bill has
 * nothing else to measure.
 */
export function printBillElement(container: HTMLElement | null) {
  if (!container) return;

  const printWindow = window.open('', '_blank', 'width=420,height=640');
  if (!printWindow) {
    toast.error('Pop-up blocked — allow pop-ups for this site to print.');
    return;
  }

  printWindow.document.write(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Print</title><style>${billPrintCss}</style></head><body>${container.outerHTML}</body></html>`
  );
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };
}
