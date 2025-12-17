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
import { type User } from "@/features/auth/AuthStore";

// Import components for rendering
import { SuspectPDF } from "@/pages/reports/SuspectPDF";
import { ReportPDF } from "@/pages/reports/ReportPDF";
import { ArrestPDF } from "@/pages/reports/ArrestPDF";

// Helper to convert React Element to PDF Blob
const renderAndCapture = async (element: React.ReactElement): Promise<Blob> => {
    // 1. Render component to static HTML string
    // Note: We wrap it in a div with fixed width/style to ensure print layout matches 
    // what html2canvas expects for a "page"
    const staticHtml = ReactDOMServer.renderToStaticMarkup(element);

    // 2. Create a temporary container
    const container = document.createElement("div");
    container.style.width = "210mm"; // A4 width
    container.style.padding = "0";
    container.style.background = "white";
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0";

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

        const imgData = canvas.toDataURL('image/png');

        // Simple single-instance PDF generation
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const pdfImgHeight = (canvas.height * pdfWidth) / canvas.width;

        // First page
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfImgHeight);

        // If content is taller than page, add more pages
        let heightLeft = pdfImgHeight - pdfHeight;
        let pageCount = 1;
        while (heightLeft > 0) {
            pdf.addPage();
            // The position should be negative creates the "scroll" effect
            pdf.addImage(imgData, 'PNG', 0, -(pdfHeight * pageCount), pdfWidth, pdfImgHeight);
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
            { data: investigationLinks }
        ] = await Promise.all([
            supabase.from('reports').select('*, author:noose_user(username, rank, matricule), suspect:noose_civilians(full_name, dob, height, weight, pob, address)'),
            supabase.from('noose_civilians').select('*'),
            supabase.from('arrests').select('*, officer:noose_user(username, rank)'),
            supabase.from('investigations').select('*'),
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
                    report={report}
                    author={report.author as User}
                    suspect={report.suspect as unknown as Civilian}
                    preview={true}
                />
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
                    suspect={civ}
                    arrests={relatedArrests}
                    includeArrests={true}
                    includeInvestigations={true}
                    includeVehicles={true}
                    preview={true}
                />
            );

            civiliansFolder?.file(`${civ.full_name.replace(/[^a-z0-9]/gi, '_')}.pdf`, blob);
            civilianPdfMap.set(civ.id, blob);
        }

        // 4. Arrest Files
        onStatusUpdate("Converting Arrests...");
        const arrestsFolder = zip.folder("Arrestations");
        const arrestPdfMap = new Map<string, Blob>();

        for (const arrest of safeArrests) {
            // Find related civilian for richer data
            const relatedCivilian = safeCivilians.find(c => c.id === arrest.civilian_id) ||
                safeCivilians.find(c => c.full_name === arrest.suspect_name);

            const blob = await renderAndCapture(
                <ArrestPDF
                    arrest={arrest}
                    suspect={relatedCivilian}
                    preview={true}
                />
            );

            arrestsFolder?.file(`Arrest-${arrest.id.slice(0, 8)}.pdf`, blob);
            arrestPdfMap.set(arrest.id, blob);
        }

        // 5. Investigations
        onStatusUpdate("Processing Investigations...");
        const invFolder = zip.folder("Investigations");

        for (const inv of safeInvestigations) {
            const folderName = `${inv.case_number} - ${inv.title.replace(/[^a-z0-9]/gi, '_')}`;
            const caseFolder = invFolder?.folder(folderName);

            // Create Case File PDF
            const blob = await renderAndCapture(
                <div style={{ fontFamily: 'sans-serif', padding: '40px', background: 'white', color: 'black' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>CASE FILE: {inv.case_number}</h1>
                    <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>{inv.title}</h2>
                    <p style={{ marginBottom: '20px', whiteSpace: 'pre-wrap' }}>{inv.description}</p>
                    <p><strong>Status:</strong> {inv.status}</p>
                </div>
            );

            caseFolder?.file("CASE_FILE.pdf", blob);

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
