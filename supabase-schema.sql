-- ============================================================================
-- DJBUILDIT PERSONAL WEBSITE - SUPABASE SCHEMA (CONTACT FOCUSED)
-- Clean database design for contact tracking and lead management
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CONTACT MANAGEMENT TABLES
-- ============================================================================

-- Contact form submissions (primary lead generation)
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Contact information
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('fitness', 'finance', 'apps', 'general')),
  message TEXT NOT NULL,
  
  -- Lead qualification data
  lead_status TEXT DEFAULT 'new' CHECK (lead_status IN ('new', 'contacted', 'qualified', 'converted', 'closed')),
  lead_score INTEGER DEFAULT 0,
  follow_up_date TIMESTAMPTZ,
  notes TEXT,
  
  -- Technical metadata
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Form submission metadata
  form_version TEXT DEFAULT '1.0',
  submission_method TEXT DEFAULT 'website_form',
  emailjs_status TEXT,
  emailjs_message_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- Contact follow-ups and communication history
CREATE TABLE contact_communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_submission_id UUID REFERENCES contact_submissions(id) ON DELETE CASCADE,
  
  -- Communication details
  communication_type TEXT NOT NULL CHECK (communication_type IN ('email', 'phone', 'meeting', 'proposal')),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  subject TEXT,
  content TEXT,
  outcome TEXT,
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- LEAD MANAGEMENT
-- ============================================================================

-- Lead profiles for tracking potential customers
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic information
  email TEXT UNIQUE,
  name TEXT,
  phone TEXT,
  
  -- Lead classification
  lead_type TEXT DEFAULT 'website' CHECK (lead_type IN ('website', 'referral', 'social', 'direct')),
  lead_segment TEXT,
  
  -- Behavior tracking
  first_visit_at TIMESTAMPTZ,
  last_visit_at TIMESTAMPTZ,
  session_count INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  
  -- Marketing attribution
  acquisition_source TEXT,
  acquisition_campaign TEXT,
  acquisition_medium TEXT,
  email_subscribed BOOLEAN DEFAULT FALSE,
  marketing_consent BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ANALYTICS & BEHAVIOR TRACKING TABLES
-- ============================================================================

-- User sessions for behavior tracking
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id),
  
  -- Session identification
  session_id TEXT UNIQUE NOT NULL,
  
  -- Session details
  ip_address INET,
  user_agent TEXT,
  device_type TEXT CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
  browser TEXT,
  operating_system TEXT,
  
  -- Geographic data
  country TEXT,
  region TEXT,
  city TEXT,
  
  -- Referral data
  referrer_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  
  -- Session metrics
  pages_viewed INTEGER DEFAULT 0,
  session_duration INTEGER, -- in seconds
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Page views and interactions
CREATE TABLE page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id),
  
  -- Page details
  page_path TEXT NOT NULL,
  page_title TEXT,
  page_category TEXT, -- home, contact, apps, finance, fitness
  
  -- Performance metrics
  load_time INTEGER, -- milliseconds
  time_on_page INTEGER, -- seconds
  scroll_depth DECIMAL(5,2), -- percentage
  
  -- Interaction data
  clicked_elements JSONB,
  form_interactions JSONB,
  
  -- Timestamps
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event tracking (granular user actions)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES user_sessions(id),
  lead_id UUID REFERENCES leads(id),
  
  -- Event classification
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL,
  event_action TEXT NOT NULL,
  event_label TEXT,
  
  -- Event data
  event_data JSONB,
  event_value DECIMAL(10,2),
  
  -- Context
  page_path TEXT,
  
  -- Timestamps
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- BUSINESS INTELLIGENCE TABLES
-- ============================================================================

-- Daily business metrics (aggregated data)
CREATE TABLE daily_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE UNIQUE NOT NULL,
  
  -- Traffic metrics
  unique_visitors INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  sessions INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0.00,
  avg_session_duration INTEGER DEFAULT 0,
  
  -- Lead metrics
  contact_submissions INTEGER DEFAULT 0,
  qualified_leads INTEGER DEFAULT 0,
  lead_conversion_rate DECIMAL(5,2) DEFAULT 0.00,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Contact submissions indexes
CREATE INDEX idx_contact_submissions_email ON contact_submissions(email);
CREATE INDEX idx_contact_submissions_created_at ON contact_submissions(created_at);
CREATE INDEX idx_contact_submissions_lead_status ON contact_submissions(lead_status);
CREATE INDEX idx_contact_submissions_service_type ON contact_submissions(service_type);

-- Lead indexes
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_lead_type ON leads(lead_type);
CREATE INDEX idx_leads_created_at ON leads(created_at);

-- Session indexes
CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX idx_user_sessions_lead_id ON user_sessions(lead_id);
CREATE INDEX idx_user_sessions_started_at ON user_sessions(started_at);

-- Page view indexes
CREATE INDEX idx_page_views_session_id ON page_views(session_id);
CREATE INDEX idx_page_views_page_path ON page_views(page_path);
CREATE INDEX idx_page_views_viewed_at ON page_views(viewed_at);

-- Event indexes
CREATE INDEX idx_events_session_id ON events(session_id);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_occurred_at ON events(occurred_at);

-- Daily metrics indexes
CREATE INDEX idx_daily_metrics_date ON daily_metrics(date);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

-- Policies for contact submissions (allow anonymous submissions)
CREATE POLICY "Admin full access" ON contact_submissions FOR ALL TO service_role USING (true);
CREATE POLICY "Anonymous can insert contact submissions" ON contact_submissions 
  FOR INSERT TO anon WITH CHECK (true);

-- Policies for other tables (admin access only)
CREATE POLICY "Admin full access" ON contact_communications FOR ALL TO service_role USING (true);
CREATE POLICY "Admin full access" ON leads FOR ALL TO service_role USING (true);
CREATE POLICY "Admin full access" ON user_sessions FOR ALL TO service_role USING (true);
CREATE POLICY "Admin full access" ON page_views FOR ALL TO service_role USING (true);
CREATE POLICY "Admin full access" ON events FOR ALL TO service_role USING (true);
CREATE POLICY "Admin full access" ON daily_metrics FOR ALL TO service_role USING (true);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for timestamp updates
CREATE TRIGGER update_contact_submissions_updated_at
    BEFORE UPDATE ON contact_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_communications_updated_at
    BEFORE UPDATE ON contact_communications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_metrics_updated_at
    BEFORE UPDATE ON daily_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 