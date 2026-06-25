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
    PostgrestVersion: "14.1"
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
          area: string
          checked_in: boolean
          checked_in_at: string | null
          created_at: string
          email: string
          event_id: string | null
          full_name: string
          id: string
          medical_concerns: string | null
          mobile: string
          source: string
          updated_at: string
        }
        Insert: {
          age: number
          area: string
          checked_in?: boolean
          checked_in_at?: string | null
          created_at?: string
          email: string
          event_id?: string | null
          full_name: string
          id?: string
          medical_concerns?: string | null
          mobile: string
          source?: string
          updated_at?: string
        }
        Update: {
          age?: number
          area?: string
          checked_in?: boolean
          checked_in_at?: string | null
          created_at?: string
          email?: string
          event_id?: string | null
          full_name?: string
          id?: string
          medical_concerns?: string | null
          mobile?: string
          source?: string
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
          voter_id: string
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
          voter_id: string
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
          voter_id?: string
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
          company_name: string
          contact_name: string
          created_at: string
          email: string
          employee_count: string | null
          id: string
          message: string
          phone: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          company_name: string
          contact_name: string
          created_at?: string
          email: string
          employee_count?: string | null
          id?: string
          message: string
          phone: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          company_name?: string
          contact_name?: string
          created_at?: string
          email?: string
          employee_count?: string | null
          id?: string
          message?: string
          phone?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
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
          id: string
          is_published: boolean
          location: string | null
          organization: Database["public"]["Enums"]["organization_type"]
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
          id?: string
          is_published?: boolean
          location?: string | null
          organization?: Database["public"]["Enums"]["organization_type"]
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
          id?: string
          is_published?: boolean
          location?: string | null
          organization?: Database["public"]["Enums"]["organization_type"]
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
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_email: string
          p_max_submissions?: number
          p_table_name: string
          p_time_window_minutes?: number
        }
        Returns: boolean
      }
      get_consented_donors: {
        Args: never
        Returns: {
          donated_at: string
          name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      abuse_type: "physical" | "emotional" | "financial" | "neglect" | "other"
      app_role: "admin" | "moderator" | "user"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "moderator", "user"],
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
