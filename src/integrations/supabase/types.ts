export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      abuse_reports: {
        Row: {
          abuse_type: Database["public"]["Enums"]["abuse_type"]
          admin_notes: string | null
          assigned_to: string | null
          created_at: string
          description: string
          id: string
          is_anonymous: boolean
          reporter_contact: string | null
          reporter_name: string | null
          reporter_relationship: string | null
          status: Database["public"]["Enums"]["report_status"]
          updated_at: string
          victim_age: number | null
          victim_location: string
          victim_name: string
        }
        Insert: {
          abuse_type: Database["public"]["Enums"]["abuse_type"]
          admin_notes?: string | null
          assigned_to?: string | null
          created_at?: string
          description: string
          id?: string
          is_anonymous?: boolean
          reporter_contact?: string | null
          reporter_name?: string | null
          reporter_relationship?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
          victim_age?: number | null
          victim_location: string
          victim_name: string
        }
        Update: {
          abuse_type?: Database["public"]["Enums"]["abuse_type"]
          admin_notes?: string | null
          assigned_to?: string | null
          created_at?: string
          description?: string
          id?: string
          is_anonymous?: boolean
          reporter_contact?: string | null
          reporter_name?: string | null
          reporter_relationship?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
          victim_age?: number | null
          victim_location?: string
          victim_name?: string
        }
        Relationships: []
      }
      active_members: {
        Row: {
          created_at: string
          id: string
          name: string
          phone_digits: string
          raw_phone: string | null
          synced_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          phone_digits: string
          raw_phone?: string | null
          synced_at?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone_digits?: string
          raw_phone?: string | null
          synced_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_check_log: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      author_notifications: {
        Row: {
          actor_name: string | null
          blog_id: string | null
          blog_slug: string | null
          blog_title: string | null
          comment_body: string | null
          comment_id: string | null
          created_at: string
          id: string
          read_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_name?: string | null
          blog_id?: string | null
          blog_slug?: string | null
          blog_title?: string | null
          comment_body?: string | null
          comment_id?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_name?: string | null
          blog_id?: string | null
          blog_slug?: string | null
          blog_title?: string | null
          comment_body?: string | null
          comment_id?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "author_notifications_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_ai_suggestions: {
        Row: {
          blog_id: string | null
          created_at: string
          id: string
          suggestions: Json
          user_id: string
        }
        Insert: {
          blog_id?: string | null
          created_at?: string
          id?: string
          suggestions: Json
          user_id: string
        }
        Update: {
          blog_id?: string | null
          created_at?: string
          id?: string
          suggestions?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_ai_suggestions_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_comments: {
        Row: {
          blog_id: string
          body: string
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          status: string
          updated_at: string
          user_id: string | null
          website: string | null
        }
        Insert: {
          blog_id: string
          body: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Update: {
          blog_id?: string
          body?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_likes: {
        Row: {
          anon_key: string | null
          blog_id: string
          created_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          anon_key?: string | null
          blog_id: string
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          anon_key?: string | null
          blog_id?: string
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_likes_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          unsubscribe_token: string
          updated_at: string
          verified: boolean
          verified_at: string | null
          verify_token: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          unsubscribe_token?: string
          updated_at?: string
          verified?: boolean
          verified_at?: string | null
          verify_token?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          unsubscribe_token?: string
          updated_at?: string
          verified?: boolean
          verified_at?: string | null
          verify_token?: string
        }
        Relationships: []
      }
      blogs: {
        Row: {
          admin_notes: string | null
          author_id: string | null
          body: string
          content_hash: string | null
          cover_image_url: string | null
          created_at: string
          guest_name: string | null
          guest_phone: string | null
          id: string
          is_guest: boolean
          language: string | null
          published_at: string | null
          slug: string | null
          sort_order: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          author_id?: string | null
          body?: string
          content_hash?: string | null
          cover_image_url?: string | null
          created_at?: string
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          is_guest?: boolean
          language?: string | null
          published_at?: string | null
          slug?: string | null
          sort_order?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          author_id?: string | null
          body?: string
          content_hash?: string | null
          cover_image_url?: string | null
          created_at?: string
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          is_guest?: boolean
          language?: string | null
          published_at?: string | null
          slug?: string | null
          sort_order?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      collaborations: {
        Row: {
          collaborator_logo_url: string | null
          collaborator_text: string | null
          created_at: string
          description: string | null
          display_order: number
          event_id: string
          id: string
          initiative_type: string
          is_published: boolean
          org_logo: string
          outcomes: Json
          partner_name: string
          sector: string
          updated_at: string
        }
        Insert: {
          collaborator_logo_url?: string | null
          collaborator_text?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          event_id: string
          id?: string
          initiative_type?: string
          is_published?: boolean
          org_logo?: string
          outcomes?: Json
          partner_name: string
          sector?: string
          updated_at?: string
        }
        Update: {
          collaborator_logo_url?: string | null
          collaborator_text?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          event_id?: string
          id?: string
          initiative_type?: string
          is_published?: boolean
          org_logo?: string
          outcomes?: Json
          partner_name?: string
          sector?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaborations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "registration_events"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          admin_notes: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      credential_requests: {
        Row: {
          created_at: string
          id: string
          kind: string
          proposed_password: string | null
          reason: string | null
          requested_by: string
          requested_by_name: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_membership_id: string | null
          target_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          proposed_password?: string | null
          reason?: string | null
          requested_by: string
          requested_by_name?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_membership_id?: string | null
          target_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          proposed_password?: string | null
          reason?: string | null
          requested_by?: string
          requested_by_name?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_membership_id?: string | null
          target_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      donations: {
        Row: {
          admin_notes: string | null
          amount: string
          consent_to_publish: boolean
          created_at: string
          email: string
          id: string
          name: string
          pan_card: string | null
          phone: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          amount: string
          consent_to_publish?: boolean
          created_at?: string
          email: string
          id?: string
          name: string
          pan_card?: string | null
          phone: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          amount?: string
          consent_to_publish?: boolean
          created_at?: string
          email?: string
          id?: string
          name?: string
          pan_card?: string | null
          phone?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          age: number
          amount_inr: number | null
          area: string
          checked_in: boolean
          checked_in_at: string | null
          created_at: string
          email: string | null
          event_id: string | null
          full_name: string
          id: string
          is_member: boolean
          medical_concerns: string | null
          membership_id: string | null
          mobile: string
          paid_at: string | null
          payment_status: string
          source: string
          stripe_session_id: string | null
          updated_at: string
        }
        Insert: {
          age: number
          amount_inr?: number | null
          area: string
          checked_in?: boolean
          checked_in_at?: string | null
          created_at?: string
          email?: string | null
          event_id?: string | null
          full_name: string
          id?: string
          is_member?: boolean
          medical_concerns?: string | null
          membership_id?: string | null
          mobile: string
          paid_at?: string | null
          payment_status?: string
          source?: string
          stripe_session_id?: string | null
          updated_at?: string
        }
        Update: {
          age?: number
          amount_inr?: number | null
          area?: string
          checked_in?: boolean
          checked_in_at?: string | null
          created_at?: string
          email?: string | null
          event_id?: string | null
          full_name?: string
          id?: string
          is_member?: boolean
          medical_concerns?: string | null
          membership_id?: string | null
          mobile?: string
          paid_at?: string | null
          payment_status?: string
          source?: string
          stripe_session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "registration_events"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_reminders: {
        Row: {
          channel: string
          id: string
          member_user_id: string
          membership_id: string | null
          message: string | null
          sent_at: string
          sent_by: string | null
        }
        Insert: {
          channel?: string
          id?: string
          member_user_id: string
          membership_id?: string | null
          message?: string | null
          sent_at?: string
          sent_by?: string | null
        }
        Update: {
          channel?: string
          id?: string
          member_user_id?: string
          membership_id?: string | null
          message?: string | null
          sent_at?: string
          sent_by?: string | null
        }
        Relationships: []
      }
      member_imports: {
        Row: {
          chapter: string | null
          created_at: string
          email: string | null
          id: string
          last_paid_month: string | null
          linked_user_id: string | null
          membership_id: string | null
          monthly_fee_amount: number | null
          name: string
          note: string | null
          paid_up_until: string | null
          phone_digits: string | null
          plan: string | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          chapter?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_paid_month?: string | null
          linked_user_id?: string | null
          membership_id?: string | null
          monthly_fee_amount?: number | null
          name: string
          note?: string | null
          paid_up_until?: string | null
          phone_digits?: string | null
          plan?: string | null
          source: string
          status?: string
          updated_at?: string
        }
        Update: {
          chapter?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_paid_month?: string | null
          linked_user_id?: string | null
          membership_id?: string | null
          monthly_fee_amount?: number | null
          name?: string
          note?: string | null
          paid_up_until?: string | null
          phone_digits?: string | null
          plan?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      member_passwords: {
        Row: {
          password: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          password: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          password?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      membership_applications: {
        Row: {
          address: string
          admin_notes: string | null
          blood_group: string
          child_contact: string
          chronic_disease: string
          created_at: string
          date_of_birth: string
          email: string
          health_insurance: string
          id: string
          major_operation: string
          name: string
          photo_path: string | null
          plan: string
          status: string
          updated_at: string
          voter_id: string | null
        }
        Insert: {
          address: string
          admin_notes?: string | null
          blood_group: string
          child_contact: string
          chronic_disease: string
          created_at?: string
          date_of_birth: string
          email: string
          health_insurance: string
          id?: string
          major_operation: string
          name: string
          photo_path?: string | null
          plan?: string
          status?: string
          updated_at?: string
          voter_id?: string | null
        }
        Update: {
          address?: string
          admin_notes?: string | null
          blood_group?: string
          child_contact?: string
          chronic_disease?: string
          created_at?: string
          date_of_birth?: string
          email?: string
          health_insurance?: string
          id?: string
          major_operation?: string
          name?: string
          photo_path?: string | null
          plan?: string
          status?: string
          updated_at?: string
          voter_id?: string | null
        }
        Relationships: []
      }
      membership_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          created_at: string
          details: Json
          entity: string | null
          entity_id: string | null
          id: string
          ip: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          details?: Json
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          details?: Json
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip?: string | null
        }
        Relationships: []
      }
      membership_transactions: {
        Row: {
          advance_credit_inr: number
          amount_inr: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          credit_used_inr: number
          id: string
          member_user_id: string
          membership_id: string | null
          monthly_fee_amount: number | null
          months_covered: number | null
          note: string | null
          paid_on: string
          period_end: string | null
          period_start: string | null
          receipt_url: string | null
          receiver_name: string | null
          recorded_by: string | null
          rejected_reason: string | null
          screenshot_path: string | null
          settled: boolean
          settled_at: string | null
          settled_by: string | null
          source: string
          state: string
          stripe_session_id: string | null
          transaction_ref: string | null
          updated_at: string
        }
        Insert: {
          advance_credit_inr?: number
          amount_inr: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          credit_used_inr?: number
          id?: string
          member_user_id: string
          membership_id?: string | null
          monthly_fee_amount?: number | null
          months_covered?: number | null
          note?: string | null
          paid_on?: string
          period_end?: string | null
          period_start?: string | null
          receipt_url?: string | null
          receiver_name?: string | null
          recorded_by?: string | null
          rejected_reason?: string | null
          screenshot_path?: string | null
          settled?: boolean
          settled_at?: string | null
          settled_by?: string | null
          source: string
          state?: string
          stripe_session_id?: string | null
          transaction_ref?: string | null
          updated_at?: string
        }
        Update: {
          advance_credit_inr?: number
          amount_inr?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          credit_used_inr?: number
          id?: string
          member_user_id?: string
          membership_id?: string | null
          monthly_fee_amount?: number | null
          months_covered?: number | null
          note?: string | null
          paid_on?: string
          period_end?: string | null
          period_start?: string | null
          receipt_url?: string | null
          receiver_name?: string | null
          recorded_by?: string | null
          rejected_reason?: string | null
          screenshot_path?: string | null
          settled?: boolean
          settled_at?: string | null
          settled_by?: string | null
          source?: string
          state?: string
          stripe_session_id?: string | null
          transaction_ref?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_blogs: {
        Row: {
          blog_id: string
          newsletter_id: string
          position: number
        }
        Insert: {
          blog_id: string
          newsletter_id: string
          position?: number
        }
        Update: {
          blog_id?: string
          newsletter_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_blogs_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_blogs_newsletter_id_fkey"
            columns: ["newsletter_id"]
            isOneToOne: false
            referencedRelation: "newsletters"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletters: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          issue_number: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          issue_number?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          issue_number?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          notification_type: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          notification_type: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          notification_type?: string
        }
        Relationships: []
      }
      partner_inquiries: {
        Row: {
          admin_notes: string | null
          collaboration_area: string | null
          company_name: string
          contact_name: string
          created_at: string
          email: string
          employee_count: string | null
          id: string
          message: string
          organization_type: string | null
          phone: string
          preferred_contact_time: string | null
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          admin_notes?: string | null
          collaboration_area?: string | null
          company_name: string
          contact_name: string
          created_at?: string
          email: string
          employee_count?: string | null
          id?: string
          message: string
          organization_type?: string | null
          phone: string
          preferred_contact_time?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          admin_notes?: string | null
          collaboration_area?: string | null
          company_name?: string
          contact_name?: string
          created_at?: string
          email?: string
          employee_count?: string | null
          id?: string
          message?: string
          organization_type?: string | null
          phone?: string
          preferred_contact_time?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      partner_outcomes: {
        Row: {
          created_at: string
          display_order: number
          icon: string
          id: string
          is_published: boolean
          label: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          icon?: string
          id?: string
          is_published?: boolean
          label: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          display_order?: number
          icon?: string
          id?: string
          is_published?: boolean
          label?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      partner_testimonials: {
        Row: {
          author_name: string
          author_role: string | null
          created_at: string
          display_order: number
          event_date: string | null
          id: string
          image_url: string | null
          is_published: boolean
          organization: string | null
          quote: string
          updated_at: string
        }
        Insert: {
          author_name: string
          author_role?: string | null
          created_at?: string
          display_order?: number
          event_date?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          organization?: string | null
          quote: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          author_role?: string | null
          created_at?: string
          display_order?: number
          event_date?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          organization?: string | null
          quote?: string
          updated_at?: string
        }
        Relationships: []
      }
      partnership_faqs: {
        Row: {
          answer: string
          created_at: string
          display_order: number
          id: string
          is_published: boolean
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      plan_prices: {
        Row: {
          created_at: string
          created_by: string | null
          effective_from: string
          id: string
          monthly_amount: number | null
          note: string | null
          plan_key: string
          updated_at: string
          yearly_amount: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          effective_from?: string
          id?: string
          monthly_amount?: number | null
          note?: string | null
          plan_key: string
          updated_at?: string
          yearly_amount?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          effective_from?: string
          id?: string
          monthly_amount?: number | null
          note?: string | null
          plan_key?: string
          updated_at?: string
          yearly_amount?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          admin_username: string | null
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          bio: string | null
          chapter: string | null
          country_code: string | null
          created_at: string
          credit_balance_inr: number
          digest_email: string | null
          digest_last_sent_at: string | null
          email: string | null
          email_digest_enabled: boolean
          full_name: string | null
          id: string
          is_console_admin: boolean
          last_paid_month: string | null
          member_since: string | null
          member_status: string
          membership_id: string | null
          monthly_fee_amount: number | null
          must_change_password: boolean
          paid_up_until: string | null
          phone_e164: string | null
          plan: string | null
          preferred_font_size: number
          rejected_reason: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_username?: string | null
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          chapter?: string | null
          country_code?: string | null
          created_at?: string
          credit_balance_inr?: number
          digest_email?: string | null
          digest_last_sent_at?: string | null
          email?: string | null
          email_digest_enabled?: boolean
          full_name?: string | null
          id?: string
          is_console_admin?: boolean
          last_paid_month?: string | null
          member_since?: string | null
          member_status?: string
          membership_id?: string | null
          monthly_fee_amount?: number | null
          must_change_password?: boolean
          paid_up_until?: string | null
          phone_e164?: string | null
          plan?: string | null
          preferred_font_size?: number
          rejected_reason?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_username?: string | null
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          chapter?: string | null
          country_code?: string | null
          created_at?: string
          credit_balance_inr?: number
          digest_email?: string | null
          digest_last_sent_at?: string | null
          email?: string | null
          email_digest_enabled?: boolean
          full_name?: string | null
          id?: string
          is_console_admin?: boolean
          last_paid_month?: string | null
          member_since?: string | null
          member_status?: string
          membership_id?: string | null
          monthly_fee_amount?: number | null
          must_change_password?: boolean
          paid_up_until?: string | null
          phone_e164?: string | null
          plan?: string | null
          preferred_font_size?: number
          rejected_reason?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      registration_events: {
        Row: {
          banner_url: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          display_order: number
          enable_registration: boolean
          end_date: string | null
          end_time: string | null
          event_date: string | null
          field_config: Json
          gallery: Json
          id: string
          is_paid: boolean
          is_published: boolean
          location: string | null
          members_free: boolean
          organization: Database["public"]["Enums"]["organization_type"]
          payment_note: string | null
          price_inr: number
          registration_open: boolean
          resource_link: string | null
          slug: string
          start_time: string | null
          status: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at: string
          venue_address: string | null
          venue_name: string | null
        }
        Insert: {
          banner_url?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          enable_registration?: boolean
          end_date?: string | null
          end_time?: string | null
          event_date?: string | null
          field_config?: Json
          gallery?: Json
          id?: string
          is_paid?: boolean
          is_published?: boolean
          location?: string | null
          members_free?: boolean
          organization?: Database["public"]["Enums"]["organization_type"]
          payment_note?: string | null
          price_inr?: number
          registration_open?: boolean
          resource_link?: string | null
          slug: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
        }
        Update: {
          banner_url?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          enable_registration?: boolean
          end_date?: string | null
          end_time?: string | null
          event_date?: string | null
          field_config?: Json
          gallery?: Json
          id?: string
          is_paid?: boolean
          is_published?: boolean
          location?: string | null
          members_free?: boolean
          organization?: Database["public"]["Enums"]["organization_type"]
          payment_note?: string | null
          price_inr?: number
          registration_open?: boolean
          resource_link?: string | null
          slug?: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
        }
        Relationships: []
      }
      reminder_templates: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      report_evidence: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          report_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          report_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_evidence_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "abuse_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_sessions: {
        Row: {
          created_at: string
          day_of_week: number
          display_order: number
          end_time: string | null
          facebook_url: string | null
          id: string
          is_active: boolean
          meet_url: string | null
          note: string | null
          start_time: string
          title: string
          title_bn: string | null
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          created_at?: string
          day_of_week: number
          display_order?: number
          end_time?: string | null
          facebook_url?: string | null
          id?: string
          is_active?: boolean
          meet_url?: string | null
          note?: string | null
          start_time: string
          title: string
          title_bn?: string | null
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          created_at?: string
          day_of_week?: number
          display_order?: number
          end_time?: string | null
          facebook_url?: string | null
          id?: string
          is_active?: boolean
          meet_url?: string | null
          note?: string | null
          start_time?: string
          title?: string
          title_bn?: string | null
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      scheduled_reminders: {
        Row: {
          created_at: string
          created_by: string | null
          error: string | null
          id: string
          message: string | null
          processed_at: string | null
          scheduled_for: string
          sent_count: number | null
          skipped_count: number | null
          status: string
          updated_at: string
          user_ids: string[]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          message?: string | null
          processed_at?: string | null
          scheduled_for: string
          sent_count?: number | null
          skipped_count?: number | null
          status?: string
          updated_at?: string
          user_ids: string[]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          message?: string | null
          processed_at?: string | null
          scheduled_for?: string
          sent_count?: number | null
          skipped_count?: number | null
          status?: string
          updated_at?: string
          user_ids?: string[]
        }
        Relationships: []
      }
      sms_log: {
        Row: {
          created_at: string
          error: string | null
          id: string
          member_user_id: string | null
          membership_id: string | null
          phone_digits: string | null
          provider_message_id: string | null
          purpose: string
          recipients: Json
          status: string
          transaction_id: string | null
          variables: Json
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          member_user_id?: string | null
          membership_id?: string | null
          phone_digits?: string | null
          provider_message_id?: string | null
          purpose?: string
          recipients?: Json
          status?: string
          transaction_id?: string | null
          variables?: Json
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          member_user_id?: string | null
          membership_id?: string | null
          phone_digits?: string | null
          provider_message_id?: string | null
          purpose?: string
          recipients?: Json
          status?: string
          transaction_id?: string | null
          variables?: Json
        }
        Relationships: []
      }
      success_stories: {
        Row: {
          author_name: string | null
          author_role: string | null
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_featured: boolean
          is_published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          author_role?: string | null
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          author_role?: string | null
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          bio: string | null
          category: Database["public"]["Enums"]["team_category"]
          created_at: string
          display_order: number
          facebook_url: string | null
          github_url: string | null
          id: string
          instagram_url: string | null
          is_active: boolean
          linkedin_url: string | null
          name: string
          photo_url: string | null
          role: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          category: Database["public"]["Enums"]["team_category"]
          created_at?: string
          display_order?: number
          facebook_url?: string | null
          github_url?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean
          linkedin_url?: string | null
          name: string
          photo_url?: string | null
          role: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          category?: Database["public"]["Enums"]["team_category"]
          created_at?: string
          display_order?: number
          facebook_url?: string | null
          github_url?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean
          linkedin_url?: string | null
          name?: string
          photo_url?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      volunteer_applications: {
        Row: {
          admin_notes: string | null
          city: string
          created_at: string
          email: string
          id: string
          motivation: string
          name: string
          phone: string
          status: Database["public"]["Enums"]["volunteer_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          city: string
          created_at?: string
          email: string
          id?: string
          motivation: string
          name: string
          phone: string
          status?: Database["public"]["Enums"]["volunteer_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          city?: string
          created_at?: string
          email?: string
          id?: string
          motivation?: string
          name?: string
          phone?: string
          status?: Database["public"]["Enums"]["volunteer_status"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      blog_comments_public: {
        Row: {
          blog_id: string | null
          body: string | null
          created_at: string | null
          id: string | null
          name: string | null
          website: string | null
        }
        Insert: {
          blog_id?: string | null
          body?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          website?: string | null
        }
        Update: {
          blog_id?: string | null
          body?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_approve_writer: { Args: { _user_id: string }; Returns: undefined }
      admin_reject_writer: {
        Args: { _reason?: string; _user_id: string }
        Returns: undefined
      }
      check_rate_limit: {
        Args: {
          p_email: string
          p_max_submissions?: number
          p_table_name: string
          p_time_window_minutes?: number
        }
        Returns: boolean
      }
      get_author_public: {
        Args: { _user_id: string }
        Returns: {
          avatar_url: string
          bio: string
          full_name: string
          user_id: string
        }[]
      }
      get_authors_public: {
        Args: { _user_ids: string[] }
        Returns: {
          avatar_url: string
          bio: string
          full_name: string
          user_id: string
        }[]
      }
      get_consented_donors: {
        Args: never
        Returns: {
          donated_at: string
          name: string
        }[]
      }
      get_registration_payment_status: {
        Args: { _registration_id: string }
        Returns: {
          amount_inr: number
          is_member: boolean
          payment_status: string
        }[]
      }
      get_writer_status_by_phone: { Args: { _phone: string }; Returns: string }
      guest_account_hint: {
        Args: { _phone: string }
        Returns: {
          exists_account: boolean
          has_membership_id: boolean
          status: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_active_member: { Args: { _phone: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_any_admin: { Args: never; Returns: boolean }
      is_approved_writer: { Args: { _uid: string }; Returns: boolean }
      is_hosla_member: {
        Args: { _email: string; _phone: string }
        Returns: boolean
      }
      is_main_admin: { Args: never; Returns: boolean }
      is_phone_available: { Args: { _phone: string }; Returns: boolean }
      make_membership_id: {
        Args: { _name: string; _phone: string }
        Returns: string
      }
      my_donations: {
        Args: never
        Returns: {
          amount: string
          created_at: string
          id: string
          name: string
          status: string
        }[]
      }
      my_event_registrations: {
        Args: never
        Returns: {
          amount_inr: number
          checked_in: boolean
          checked_in_at: string
          created_at: string
          event_date: string
          event_id: string
          event_slug: string
          event_title: string
          id: string
          payment_status: string
        }[]
      }
      search_members: {
        Args: { _q: string }
        Returns: {
          full_name: string
          member_status: string
          membership_id: string
          monthly_fee_amount: number
          paid_up_until: string
          phone_e164: string
          plan: string
          user_id: string
        }[]
      }
    }
    Enums: {
      abuse_type: "physical" | "emotional" | "financial" | "neglect" | "other"
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "team_admin"
        | "main_admin"
        | "member"
      organization_type: "shraddha" | "hosla" | "both"
      project_status: "upcoming" | "ongoing" | "completed"
      report_status: "new" | "investigating" | "resolved" | "archived"
      team_category:
        | "president"
        | "core"
        | "senior_members"
        | "advocates"
        | "counsellors"
        | "volunteers_technical"
        | "volunteers_hr"
        | "volunteers_marketing"
        | "volunteers_social_media"
        | "volunteers_design"
        | "interns"
        | "board_member"
      volunteer_status: "pending" | "contacted" | "accepted" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      abuse_type: ["physical", "emotional", "financial", "neglect", "other"],
      app_role: [
        "admin",
        "moderator",
        "user",
        "team_admin",
        "main_admin",
        "member",
      ],
      organization_type: ["shraddha", "hosla", "both"],
      project_status: ["upcoming", "ongoing", "completed"],
      report_status: ["new", "investigating", "resolved", "archived"],
      team_category: [
        "president",
        "core",
        "senior_members",
        "advocates",
        "counsellors",
        "volunteers_technical",
        "volunteers_hr",
        "volunteers_marketing",
        "volunteers_social_media",
        "volunteers_design",
        "interns",
        "board_member",
      ],
      volunteer_status: ["pending", "contacted", "accepted", "rejected"],
    },
  },
} as const
