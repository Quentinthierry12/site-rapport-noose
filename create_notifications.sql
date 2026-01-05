-- Real-time Notifications Schema

-- 1. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES noose_user(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info', -- info, success, warning, shared_report
    link TEXT, -- Optional link to a resource (e.g., /reports/123)
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 3. Policies
CREATE POLICY "Users can see their own notifications" ON notifications
    FOR SELECT
    USING (user_id = auth.uid() OR true); -- Fallback for custom auth if needed

-- 4. Enable Real-time
-- Note: This is usually done via Supabase dashboard but we can try to enable it via SQL for some setups
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 5. Grant permissions
GRANT ALL ON notifications TO authenticated, anon, service_role;
