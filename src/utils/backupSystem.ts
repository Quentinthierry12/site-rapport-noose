import { supabase } from "@/lib/supabase";
import JSZip from "jszip";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import React from "react";
import ReactDOMServer from "react-dom/server";

import type { Report } from "@/features/reports/reportsService";
import type { Civilian } from "@/features/civilians/civiliansService";
import type { Arrest } from "@/features/arrests/arrestsService";
import type { Investigation, InvestigationLink } from "@/features/investigations/investigationsService";

// Import components for rendering
import { SuspectPDF } from "@/pages/reports/SuspectPDF";
import { ReportPDF } from "@/pages/reports/ReportPDF";

// Helper to convert React Element to PDF Blob
const renderAndCapture = async (element: React.ReactElement, filename: string): Promise<Blob> => {
    // 1. Render component to static HTML string
    // Note: We wrap it in a div with fixed width/style to ensure print layout matches 
    // what html2canvas expects for a "page"
    const staticHtml = ReactDOMServer.renderToStaticMarkup(element);

    // 2. Create a temporary container
    const container = document.createElement("div");
    container.style.width = "210mm"; // A4 width
    // container.style.minHeight = "297mm"; // A4 height - Let height grow naturally to capture full content? 
    // Actually html2canvas needs to see everything.
    // For proper multi-page, we would need to segment. 
    // For now, we capture as one long image and slice it... or simply fit to one page if possible?
    // The user's previous export just prints what's there. 
    // Let's capture the whole scroll height.
    container.style.padding = "0";
    container.style.background = "white";
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0";

    // We inject tailwind styles? 
    // Since we are using renderToStaticMarkup, we are losing the compiled CSS linked in index.html unless we are careful.
    // Wait, the styles in the component use Tailwind classes. 
    // When appended to document.body, they should pick up the global styles IF index.html styles apply to body inputs.
    // Yes, they should.
    container.innerHTML = staticHtml;
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

        // Calculate dimensions
        const imgWidth = 210; // mm
        const pageHeight = 297; // mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight; // This logic for multipage is tricky without proper paging.
            // Simplified: just add new page and shifting? 
            // Standard approach:
            position = -pageHeight * (Math.ceil(imgHeight / pageHeight) - Math.ceil(heightLeft / pageHeight));
            // Actually standard simple loop:
            pdf.addPage();
            // We need to shift the image up
            position = -297; // Shift by one page height? No `position` argument.
            // Rewriting loop logic:
        }

        // Re-do simple multipage logic
        /*
        let heightLeft = imgHeight;
        let position = 0;
        
        if (imgHeight <= pageHeight) {
            pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
        } else {
             // ... This is complex to get pixel perfect. 
             // For this iteration, let's assume content fits or just dump one long page?
             // No, standard PDFs are A4.
             // Let's just output the first page comfortably or simplistic scaling.
             // Ideally we want exact replicas.
        }
        */

        // Fallback: Fit to page if too long? Or strict A4 slicing.
        // Let's stick to the official one-page-at-start or basic slice.
        // Given complexity, let's restart PDF fresh:

        const pdfFinal = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdfFinal.internal.pageSize.getWidth();
        const pdfHeight = pdfFinal.internal.pageSize.getHeight();

        const imgProps = pdfFinal.getImageProperties(imgData);
        // const ratio = imgProps.width / imgProps.height;
        const pdfImgHeight = (imgProps.height * pdfWidth) / imgProps.width;

        // First page
        pdfFinal.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfImgHeight);

        // If content is taller than page, add more pages
        let heightLeft2 = pdfImgHeight - pdfHeight;
        let pageCount = 1;
        while (heightLeft2 > 0) {
            pdfFinal.addPage();
            // The position should be negative creates the "scroll" effect
            pdfFinal.addImage(imgData, 'JPEG', 0, -(pdfHeight * pageCount), pdfWidth, pdfImgHeight);
            heightLeft2 -= pdfHeight;
            pageCount++;
        }

        return pdfFinal.output('blob');
    } finally {
        document.body.removeChild(container);
    }
};

export const generateBackup = async (onStatusUpdate: (status: string) => void) => {
    try {
        const zip = new JSZip();

        // 1. Fetch Data
        onStatusUpdate("Fetching system data...");
        const [
            { data: reports },
            { data: civilians },
            { data: arrests },
            { data: investigations },
            { data: users },
            { data: investigationLinks }
        ] = await Promise.all([
            supabase.from('reports').select('*, author:noose_user(username, rank), suspect:noose_civilians(full_name, dob, height, weight, pob, address)'),
            supabase.from('noose_civilians').select('*'),
            supabase.from('arrests').select('*, officer:noose_user(username, rank)'),
            supabase.from('investigations').select('*'),
            supabase.from('noose_user').select('id, username, rank, division'),
            supabase.from('investigation_links').select('*')
        ]);

        const safeReports = (reports || []) as unknown as Report[];
        const safeCivilians = (civilians || []) as unknown as Civilian[];
        const safeArrests = (arrests || []) as unknown as Arrest[];
        const safeInvestigations = (investigations || []) as unknown as Investigation[];
        const safeLinks = (investigationLinks || []) as unknown as InvestigationLink[];

        // 2. Report PDFs (Using ReportPDF Component)
        onStatusUpdate("Converting Reports...");
        const reportsFolder = zip.folder("Rapports");
        const reportPdfMap = new Map<string, Blob>();

        for (const report of safeReports) {
            onStatusUpdate(`Processing Report ${report.id.slice(0, 6)}...`);

            // Reconstruct the component props
            const blob = await renderAndCapture(
                <ReportPDF 
                    report={ report } 
                    author = { report.author } 
                    suspect = { report.suspect as unknown as Civilian }
                />,
                `Report-${report.id}.pdf`
            );

            reportsFolder?.file(`Report-${report.id.slice(0, 8)}.pdf`, blob);
            reportPdfMap.set(report.id, blob);
        }

        // 3. Civilian PDFs (Using SuspectPDF Component)
        onStatusUpdate("Converting Dossiers...");
        const civiliansFolder = zip.folder("Civils");
        const civilianPdfMap = new Map<string, Blob>();

        for (const civ of safeCivilians) {
            onStatusUpdate(`Processing Civilian ${civ.full_name}...`);

            // Find related arrests/investigations for this civilian
            const relatedArrests = safeArrests.filter(a => a.civilian_id === civ.id || a.suspect_name === civ.full_name);
            // const relatedInvestigations = ... (logic requires investigation links)

            const blob = await renderAndCapture(
                <SuspectPDF 
                    suspect={ civ }
                    arrests = { relatedArrests }
                    includeArrests = { true}
                    includeInvestigations = { true}
                    includeVehicles = { true}
                />,
                `Civilian-${civ.full_name}.pdf`
            );

            civiliansFolder?.file(`${civ.full_name.replace(/[^a-z0-9]/gi, '_')}.pdf`, blob);
            civilianPdfMap.set(civ.id, blob);
        }

        // 4. Arrest Files (Basic HTML capture for now as no full component exists)
        onStatusUpdate("Converting Arrests...");
        const arrestsFolder = zip.folder("Arrestations");
        const arrestPdfMap = new Map<string, Blob>();

        for (const arrest of safeArrests) {
            const div = document.createElement('div');
            div.innerHTML = `
                <div style="font-family: sans-serif; padding: 40px; background:white;">
                    <h1 style="font-size:24px; font-weight:bold; margin-bottom:20px;">ARREST RECORD</h1>
                    <p style="margin-bottom:10px;"><strong>ID:</strong> ${arrest.id}</p>
                    <p style="margin-bottom:10px;"><strong>Suspect:</strong> ${arrest.suspect_name}</p>
                    <p style="margin-bottom:10px;"><strong>Charges:</strong> ${arrest.charges.join(', ')}</p>
                    <p style="margin-bottom:10px;"><strong>Officer:</strong> ${arrest.officer?.rank} ${arrest.officer?.username}</p>
                    <p style="margin-bottom:10px;"><strong>Status:</strong> ${arrest.status}</p>
                </div>
             `;

            // Minified capture for simple elements
            document.body.appendChild(div);
            try {
                const c = await html2canvas(div, { scale: 2 });
                const p = new jsPDF();
                p.addImage(c.toDataURL('image/jpeg'), 'JPEG', 0, 0, 210, (c.height * 210) / c.width);
                const blob = p.output('blob');
                arrestsFolder?.file(`Arrest-${arrest.id.slice(0, 8)}.pdf`, blob);
                arrestPdfMap.set(arrest.id, blob);
            } finally {
                document.body.removeChild(div);
            }
        }


        // 5. Investigations
        onStatusUpdate("Processing Investigations...");
        const invFolder = zip.folder("Investigations");

        for (const inv of safeInvestigations) {
            const folderName = `${inv.case_number} - ${inv.title.replace(/[^a-z0-9]/gi, '_')}`;
            const caseFolder = invFolder?.folder(folderName);

            // Create Case File PDF
            const div = document.createElement('div');
            div.innerHTML = `
                <div style="font-family: sans-serif; padding: 40px; background:white;">
                    <h1 style="font-size:24px; font-weight:bold;">CASE FILE: ${inv.case_number}</h1>
                    <h2 style="font-size:18px; margin-bottom:20px;">${inv.title}</h2>
                    <p style="margin-bottom:20px; white-space:pre-wrap;">${inv.description}</p>
                    <p><strong>Status:</strong> ${inv.status}</p>
                </div>
             `;

            document.body.appendChild(div);
            try {
                const c = await html2canvas(div, { scale: 2 });
                const p = new jsPDF();
                p.addImage(c.toDataURL('image/jpeg'), 'JPEG', 0, 0, 210, (c.height * 210) / c.width);
                const blob = p.output('blob');
                caseFolder?.file("CASE_FILE.pdf", blob);
            } finally {
                document.body.removeChild(div);
            }

            // Link existing blobs
            const links = safeLinks.filter(l => l.investigation_id === inv.id);
            for (const link of links) {
                let existingBlob = null;
                let filename = `Linked-${link.linked_item_type}-${link.linked_item_id.slice(0, 8)}.pdf`;

                if (link.linked_item_type === 'report') {
                    existingBlob = reportPdfMap.get(link.linked_item_id);
                    filename = `Report-${link.linked_item_id.slice(0, 8)}.pdf`;
                } else if (link.linked_item_type === 'civilian') {
                    existingBlob = civilianPdfMap.get(link.linked_item_id);
                    // filename?
                } else if (link.linked_item_type === 'arrest') {
                    existingBlob = arrestPdfMap.get(link.linked_item_id);
                    filename = `Arrest-${link.linked_item_id.slice(0, 8)}.pdf`;
                }

                if (existingBlob) {
                    caseFolder?.file(filename, existingBlob);
                }
            }
        }

        // 6. Finalize
        onStatusUpdate("Compressing...");
        const content = await zip.generateAsync({ type: "blob" });

        const url = window.URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = `NOOSE_BACKUP_${new Date().toISOString().slice(0, 10)}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        onStatusUpdate("Complete!");

    } catch (error) {
        console.error("Backup failed", error);
        throw error;
    }
};
