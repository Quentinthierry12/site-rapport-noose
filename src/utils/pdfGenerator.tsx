import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import ReactDOMServer from "react-dom/server";
import React from "react";

// Helper to convert React Element to PDF Blob
export const renderAndCapture = async (element: React.ReactElement): Promise<Blob> => {
    // 1. Render component to static HTML string
    const staticHtml = ReactDOMServer.renderToStaticMarkup(element);

    // 2. Create a temporary container
    const container = document.createElement("div");
    container.style.width = "210mm"; // A4 width
    container.style.padding = "0";
    container.style.background = "white";
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0";

    // 3. Clean up the HTML to remove 'hidden' or 'print:block' constraints for capture
    // AND strip modern color functions (oklch) that html2canvas doesn't support
    const processedHtml = staticHtml
        .replace(/hidden /g, '')
        .replace(/print:block/g, '')
        .replace(/print-only/g, '')
        .replace(/oklch\([^)]+\)/g, '#000000'); // Replace oklch with black fallback

    container.innerHTML = `
        <style>
            /* Force fallback for colors that html2canvas doesn't support (like oklch) */
            * {
                border-color: #000000 !important;
                outline-color: #000000 !important;
            }
            .bg-white { background-color: #ffffff !important; }
            .text-black { color: #000000 !important; }
            .bg-gray-50 { background-color: #f8fafc !important; }
            .bg-gray-100 { background-color: #f1f5f9 !important; }
            .border-black { border-color: #000000 !important; }
        </style>
        ${processedHtml}
    `;
    document.body.appendChild(container);

    try {
        // html2canvas capture
        const canvas = await html2canvas(container, {
            scale: 2, // Retain quality
            useCORS: true,
            logging: false,
            width: 794, // 210mm at ~96 DPI
            windowWidth: 1000 // Ensure viewport is wide enough
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        // Simple single-instance PDF generation
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const pdfImgHeight = (canvas.height * pdfWidth) / canvas.width;

        // First page
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfImgHeight);

        // If content is taller than page, add more pages
        let heightLeft = pdfImgHeight - pdfHeight;
        let pageCount = 1;
        while (heightLeft > 0) {
            pdf.addPage();
            // The position should be negative creates the "scroll" effect
            pdf.addImage(imgData, 'JPEG', 0, -(pdfHeight * pageCount), pdfWidth, pdfImgHeight);
            heightLeft -= pdfHeight;
            pageCount++;
        }

        return pdf.output('blob');
    } finally {
        if (document.body.contains(container)) {
            document.body.removeChild(container);
        }
    }
};
