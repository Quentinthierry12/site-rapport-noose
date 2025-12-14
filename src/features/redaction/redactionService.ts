import { supabase } from '@/lib/supabase';

export interface ReportVersion {
    id: string;
    report_id: string;
    version_type: 'full' | 'partial' | 'public';
    redacted_fields: string[]; // Array of field names to redact
    created_by: string;
    created_at: string;
}

export interface RedactionConfig {
    // Common sensitive fields that can be redacted
    suspect_name?: boolean;
    suspect_address?: boolean;
    suspect_dob?: boolean;
    officer_name?: boolean;
    witness_names?: boolean;
    phone_numbers?: boolean;
    custom_fields?: string[]; // Additional custom field names
}

export const redactionService = {
    // Create a new redacted version
    async createVersion(
        reportId: string,
        versionType: 'full' | 'partial' | 'public',
        redactedFields: string[],
        userId: string
    ): Promise<ReportVersion> {
        const { data, error } = await supabase
            .from('report_versions')
            .insert({
                report_id: reportId,
                version_type: versionType,
                redacted_fields: redactedFields,
                created_by: userId
            })
            .select()
            .single();

        if (error) throw error;
        return data as ReportVersion;
    },

    // Update existing version
    async updateVersion(
        versionId: string,
        redactedFields: string[]
    ): Promise<ReportVersion> {
        const { data, error } = await supabase
            .from('report_versions')
            .update({ redacted_fields: redactedFields })
            .eq('id', versionId)
            .select()
            .single();

        if (error) throw error;
        return data as ReportVersion;
    },

    // Get all versions for a report
    async getVersions(reportId: string): Promise<ReportVersion[]> {
        const { data, error } = await supabase
            .from('report_versions')
            .select('*')
            .eq('report_id', reportId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as ReportVersion[];
    },

    // Get specific version
    async getVersion(reportId: string, versionType: string): Promise<ReportVersion | null> {
        const { data, error } = await supabase
            .from('report_versions')
            .select('*')
            .eq('report_id', reportId)
            .eq('version_type', versionType)
            .maybeSingle();

        if (error) throw error;
        return data as ReportVersion | null;
    },

    // Delete version
    async deleteVersion(versionId: string): Promise<void> {
        const { error } = await supabase
            .from('report_versions')
            .delete()
            .eq('id', versionId);

        if (error) throw error;
    },

    // Get appropriate version based on user clearance
    async getVersionForClearance(
        reportId: string,
        userClearance: number
    ): Promise<ReportVersion | null> {
        // Clearance 4+ can see full (no redaction)
        if (userClearance >= 4) {
            return null; // No redaction needed
        }

        // Clearance 2-3 can see partial
        if (userClearance >= 2) {
            return this.getVersion(reportId, 'partial');
        }

        // Clearance 0-1 can only see public
        return this.getVersion(reportId, 'public');
    },

    // Helper: Convert RedactionConfig to field array
    configToFields(config: RedactionConfig): string[] {
        const fields: string[] = [];

        if (config.suspect_name) fields.push('suspect_name');
        if (config.suspect_address) fields.push('suspect_address');
        if (config.suspect_dob) fields.push('suspect_dob');
        if (config.officer_name) fields.push('officer_name');
        if (config.witness_names) fields.push('witness_names');
        if (config.phone_numbers) fields.push('phone_numbers');

        if (config.custom_fields) {
            fields.push(...config.custom_fields);
        }

        return fields;
    },

    // Helper: Apply redaction to report data
    applyRedaction(reportData: any, redactedFields: string[]): any {
        const redacted = { ...reportData };

        redactedFields.forEach(field => {
            if (field in redacted) {
                redacted[field] = '[REDACTED]';
            }
        });

        return redacted;
    }
};
