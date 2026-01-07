import { supabase } from "@/lib/supabase";

export interface TemplateField {
    id: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'date' | 'boolean' | 'textarea';
    required: boolean;
    options?: string[]; // Pour le type 'select'
}

export type BlockType = 'header' | 'warning' | 'personnel' | 'suspect' | 'narrative' | 'fields' | 'signature' | 'footer' | 'spacer' | 'vehicle' | 'evidence' | 'classification';

export interface TemplateBlock {
    id: string;
    type: BlockType;
    title?: string; // Libellé de la section
    config: Record<string, any>;
    fields?: TemplateField[]; // Uniquement pour le type 'fields'
}

export interface TemplateLayoutSettings {
    layout_type: 'report' | 'card' | 'arrest_warrant' | 'badge' | 'custom_v2';
    header_title?: string;
    header_subtitle?: string;
    show_logo: boolean;
    footer_text?: string;
    theme_color?: string; // ex: #1e3a8a
    static_content?: string;
    static_sections?: { title: string; content: string }[];
    blocks?: TemplateBlock[]; // Nouveau système Toolbox V2
}

export interface DocumentTemplate {
    id: string;
    name: string;
    content: string; // Description ou base du document
    category: string;
    min_clearance: number;
    created_by: string;
    created_at: string;
    schema: TemplateField[];
    layout_settings?: TemplateLayoutSettings;
}

export const templatesService = {
    async getAll() {
        const { data, error } = await supabase
            .from('templates')
            .select('*')
            .order('name');

        if (error) throw error;
        return data as DocumentTemplate[];
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('templates')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as DocumentTemplate;
    },

    async create(template: Partial<DocumentTemplate>) {
        const { data, error } = await supabase
            .from('templates')
            .insert(template)
            .select()
            .single();

        if (error) throw error;
        return data as DocumentTemplate;
    },

    async update(id: string, updates: Partial<DocumentTemplate>) {
        const { data, error } = await supabase
            .from('templates')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as DocumentTemplate;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('templates')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
