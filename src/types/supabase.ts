export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      contact_submissions: {
        Row: {
          id: string
          name: string
          email: string
          service_type: 'fitness' | 'finance' | 'apps' | 'general'
          message: string
          lead_status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed'
          lead_score: number
          follow_up_date: string | null
          notes: string | null
          ip_address: string | null
          user_agent: string | null
          referrer: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          form_version: string
          submission_method: string
          emailjs_status: string | null
          emailjs_message_id: string | null
          created_at: string
          updated_at: string
          responded_at: string | null
        }
        Insert: {
          id?: string
          name: string
          email: string
          service_type: 'fitness' | 'finance' | 'apps' | 'general'
          message: string
          lead_status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed'
          lead_score?: number
          follow_up_date?: string | null
          notes?: string | null
          ip_address?: string | null
          user_agent?: string | null
          referrer?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          form_version?: string
          submission_method?: string
          emailjs_status?: string | null
          emailjs_message_id?: string | null
          created_at?: string
          updated_at?: string
          responded_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          service_type?: 'fitness' | 'finance' | 'apps' | 'general'
          message?: string
          lead_status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed'
          lead_score?: number
          follow_up_date?: string | null
          notes?: string | null
          ip_address?: string | null
          user_agent?: string | null
          referrer?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          form_version?: string
          submission_method?: string
          emailjs_status?: string | null
          emailjs_message_id?: string | null
          created_at?: string
          updated_at?: string
          responded_at?: string | null
        }
      }
      contact_communications: {
        Row: {
          id: string
          contact_submission_id: string
          communication_type: 'email' | 'phone' | 'meeting' | 'proposal'
          direction: 'inbound' | 'outbound'
          subject: string | null
          content: string | null
          outcome: string | null
          scheduled_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contact_submission_id: string
          communication_type: 'email' | 'phone' | 'meeting' | 'proposal'
          direction: 'inbound' | 'outbound'
          subject?: string | null
          content?: string | null
          outcome?: string | null
          scheduled_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contact_submission_id?: string
          communication_type?: 'email' | 'phone' | 'meeting' | 'proposal'
          direction?: 'inbound' | 'outbound'
          subject?: string | null
          content?: string | null
          outcome?: string | null
          scheduled_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          email: string | null
          name: string | null
          phone: string | null
          lead_type: 'website' | 'referral' | 'social' | 'direct'
          lead_segment: string | null
          first_visit_at: string | null
          last_visit_at: string | null
          session_count: number
          page_views: number
          acquisition_source: string | null
          acquisition_campaign: string | null
          acquisition_medium: string | null
          email_subscribed: boolean
          marketing_consent: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email?: string | null
          name?: string | null
          phone?: string | null
          lead_type?: 'website' | 'referral' | 'social' | 'direct'
          lead_segment?: string | null
          first_visit_at?: string | null
          last_visit_at?: string | null
          session_count?: number
          page_views?: number
          acquisition_source?: string | null
          acquisition_campaign?: string | null
          acquisition_medium?: string | null
          email_subscribed?: boolean
          marketing_consent?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          name?: string | null
          phone?: string | null
          lead_type?: 'website' | 'referral' | 'social' | 'direct'
          lead_segment?: string | null
          first_visit_at?: string | null
          last_visit_at?: string | null
          session_count?: number
          page_views?: number
          acquisition_source?: string | null
          acquisition_campaign?: string | null
          acquisition_medium?: string | null
          email_subscribed?: boolean
          marketing_consent?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_sessions: {
        Row: {
          id: string
          lead_id: string | null
          session_id: string
          ip_address: string | null
          user_agent: string | null
          device_type: 'mobile' | 'tablet' | 'desktop' | null
          browser: string | null
          operating_system: string | null
          country: string | null
          region: string | null
          city: string | null
          referrer_url: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          utm_term: string | null
          utm_content: string | null
          pages_viewed: number
          session_duration: number | null
          started_at: string
          ended_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          lead_id?: string | null
          session_id: string
          ip_address?: string | null
          user_agent?: string | null
          device_type?: 'mobile' | 'tablet' | 'desktop' | null
          browser?: string | null
          operating_system?: string | null
          country?: string | null
          region?: string | null
          city?: string | null
          referrer_url?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_term?: string | null
          utm_content?: string | null
          pages_viewed?: number
          session_duration?: number | null
          started_at?: string
          ended_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string | null
          session_id?: string
          ip_address?: string | null
          user_agent?: string | null
          device_type?: 'mobile' | 'tablet' | 'desktop' | null
          browser?: string | null
          operating_system?: string | null
          country?: string | null
          region?: string | null
          city?: string | null
          referrer_url?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_term?: string | null
          utm_content?: string | null
          pages_viewed?: number
          session_duration?: number | null
          started_at?: string
          ended_at?: string | null
          created_at?: string
        }
      }
      page_views: {
        Row: {
          id: string
          session_id: string
          lead_id: string | null
          page_path: string
          page_title: string | null
          page_category: string | null
          load_time: number | null
          time_on_page: number | null
          scroll_depth: number | null
          clicked_elements: Json | null
          form_interactions: Json | null
          viewed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          lead_id?: string | null
          page_path: string
          page_title?: string | null
          page_category?: string | null
          load_time?: number | null
          time_on_page?: number | null
          scroll_depth?: number | null
          clicked_elements?: Json | null
          form_interactions?: Json | null
          viewed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          lead_id?: string | null
          page_path?: string
          page_title?: string | null
          page_category?: string | null
          load_time?: number | null
          time_on_page?: number | null
          scroll_depth?: number | null
          clicked_elements?: Json | null
          form_interactions?: Json | null
          viewed_at?: string
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          session_id: string | null
          lead_id: string | null
          event_type: string
          event_category: string
          event_action: string
          event_label: string | null
          event_data: Json | null
          event_value: number | null
          page_path: string | null
          occurred_at: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id?: string | null
          lead_id?: string | null
          event_type: string
          event_category: string
          event_action: string
          event_label?: string | null
          event_data?: Json | null
          event_value?: number | null
          page_path?: string | null
          occurred_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string | null
          lead_id?: string | null
          event_type?: string
          event_category?: string
          event_action?: string
          event_label?: string | null
          event_data?: Json | null
          event_value?: number | null
          page_path?: string | null
          occurred_at?: string
          created_at?: string
        }
      }
      daily_metrics: {
        Row: {
          id: string
          date: string
          unique_visitors: number
          page_views: number
          sessions: number
          bounce_rate: number
          avg_session_duration: number
          contact_submissions: number
          qualified_leads: number
          lead_conversion_rate: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date: string
          unique_visitors?: number
          page_views?: number
          sessions?: number
          bounce_rate?: number
          avg_session_duration?: number
          contact_submissions?: number
          qualified_leads?: number
          lead_conversion_rate?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          unique_visitors?: number
          page_views?: number
          sessions?: number
          bounce_rate?: number
          avg_session_duration?: number
          contact_submissions?: number
          qualified_leads?: number
          lead_conversion_rate?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
