# Implementation Plan: V2 PDF System Rework

This plan outlines the steps to create a flexible, efficient, and "practice-oriented" V2 PDF system for NOOSE reports. The goal is to allow dynamic customization of PDF outputs (logos, legal warnings, layout sections) without hardcoding every variation.

## Phase 1: Core Component & Prototyping (Current Status)
We have started this phase by creating the foundational files.
- [x] **Create `CustomReportPDF.tsx`**: A flexible React component that accepts a `config` object instead of fixed props. This allows rendering any combination of sections.
- [x] **Create `PDFV2Playground.tsx`**: A purely frontend tool to "practice" and test the new PDF system with real-time preview, allowing you to tweak layouts before integrating them into the main app.
- [ ] **Register Playground Route**: Add the playground to `App.tsx` so you can access it at `/pdf-v2`.

## Phase 2: Data Structure & Templates
To make this a real "system", we need to store these configurations.
- [ ] **Define `PDFTemplateConfig` Interface**:
    - JSON structure to hold: `logoUrl`, `warningText`, `layoutOrder` (optional), `customFields`.
- [ ] **Update Report Schema (Frontend)**:
    - Add a `pdf_config` field (JSON) to the Report type (or use the existing `template_data` if suitable, but `pdf_config` is cleaner for visual settings).

## Phase 3: Enhanced Features (User Requests)
Implement the specific fields requested.
- [ ] **Legal Warning Selector**: 
    - Create a dropdown to select between standard legal text and the specific **"U.S. Code Title 18 § 793 - Espionnage"** text.
    - Allow manual editing of this text.
- [ ] **Visual Customization**:
    - **Logo Input**: A field to paste a generic image URL for the header.
    - **"Information" Section**: A specific distinct box (separate from "Facts" and "Report") for "Information Suspect/Details" or other metadata.
- [ ] **Officer & Suspect Blocks**:
    - Refine the `CustomReportPDF` to handle lists of officers (e.g., if multiple officers are involved) and dynamic suspect details (height, weight, etc.) more gracefully.

## Phase 4: Integration into Main App
Move from the "Practice Playground" to the actual Report Editor.
- [ ] **Modify `ReportPage.tsx`**:
    - Add a "PDF Settings" tab/modal.
    - Include the controls from the Playground (Logo URL, Warning Text selector).
- [ ] **Preview Mode**:
    - Add a "V2 Preview" button that opens the `CustomReportPDF` with the current report data mapped to the new configuration.

## Phase 5: Standardization (Optional but Recommended)
- [ ] **Save as Template**: Allow users to save their current configuration (e.g., "Espionage Report Layout") as a reusable template for future reports.

---

## Action Plan for Next Steps:
1.  **Register the route** for `PDFV2Playground` so you can immediately see and play with the V2 system.
2.  **Refine `CustomReportPDF`** to look exactly like the "Premium/Vibrant" aesthetic requested (better fonts, better spacing).
3.  **Add the "Espionage" warning text** as a preset in the playground.
4.  **Wait for your feedback** before integrating it into `ReportPage.tsx`.
