-- Mise à jour pour le système de templates dynamiques

-- 1. Ajouter la colonne schema à la table templates
ALTER TABLE templates ADD COLUMN IF NOT EXISTS schema JSONB DEFAULT '[]'::jsonb;

-- 2. Mettre à jour la table reports pour supporter les templates
ALTER TABLE reports ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES templates(id);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS template_data JSONB DEFAULT '{}'::jsonb;

-- 3. Ajouter une colonne suspect_id aux rapports si elle n'existe pas déjà (utilisé dans ReportPage.tsx)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reports' AND column_name='suspect_id') THEN
        ALTER TABLE reports ADD COLUMN suspect_id UUID;
    END IF;
END $$;

-- 4. Ajouter une colonne shared_with_teams si elle n'existe pas
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reports' AND column_name='shared_with_teams') THEN
        ALTER TABLE reports ADD COLUMN shared_with_teams UUID[] DEFAULT '{}';
    END IF;
END $$;

-- 5. Ajouter la colonne layout_settings à la table templates
ALTER TABLE templates ADD COLUMN IF NOT EXISTS layout_settings JSONB DEFAULT '{"layout_type": "report", "show_logo": true}'::jsonb;
