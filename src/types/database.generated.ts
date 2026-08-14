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
    PostgrestVersion: "14.15"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      animal_statuses: {
        Row: {
          color_token: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          is_active_status: boolean
          is_system: boolean
          name: string
          org_id: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          color_token?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_active_status?: boolean
          is_system?: boolean
          name: string
          org_id: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          color_token?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_active_status?: boolean
          is_system?: boolean
          name?: string
          org_id?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "animal_statuses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_statuses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_statuses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "animal_statuses_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      animals: {
        Row: {
          acquisition_date: string | null
          acquisition_type: string
          anitrac_ain: string | null
          breed_id: string | null
          color: string | null
          created_at: string
          created_by: string | null
          dam_id: string | null
          date_of_birth: string | null
          deleted_at: string | null
          dob_is_estimated: boolean
          id: string
          name: string | null
          notes: string | null
          org_id: string
          photo_path: string | null
          ranch_id: string
          section_id: string | null
          sex: string
          sire_id: string | null
          species_id: string | null
          status_id: string
          tag_number: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          acquisition_date?: string | null
          acquisition_type?: string
          anitrac_ain?: string | null
          breed_id?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          dam_id?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          dob_is_estimated?: boolean
          id?: string
          name?: string | null
          notes?: string | null
          org_id: string
          photo_path?: string | null
          ranch_id: string
          section_id?: string | null
          sex?: string
          sire_id?: string | null
          species_id?: string | null
          status_id: string
          tag_number: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          acquisition_date?: string | null
          acquisition_type?: string
          anitrac_ain?: string | null
          breed_id?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          dam_id?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          dob_is_estimated?: boolean
          id?: string
          name?: string | null
          notes?: string | null
          org_id?: string
          photo_path?: string | null
          ranch_id?: string
          section_id?: string | null
          sex?: string
          sire_id?: string | null
          species_id?: string | null
          status_id?: string
          tag_number?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "animals_breed_id_fkey"
            columns: ["breed_id"]
            isOneToOne: false
            referencedRelation: "breeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_dam_id_fkey"
            columns: ["dam_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_dam_id_fkey"
            columns: ["dam_id"]
            isOneToOne: false
            referencedRelation: "v_animal_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_dam_id_fkey"
            columns: ["dam_id"]
            isOneToOne: false
            referencedRelation: "v_upcoming_vaccinations"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "animals_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "ranches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "v_ranch_stats"
            referencedColumns: ["ranch_id"]
          },
          {
            foreignKeyName: "animals_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "ranch_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_sire_id_fkey"
            columns: ["sire_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_sire_id_fkey"
            columns: ["sire_id"]
            isOneToOne: false
            referencedRelation: "v_animal_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_sire_id_fkey"
            columns: ["sire_id"]
            isOneToOne: false
            referencedRelation: "v_upcoming_vaccinations"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animals_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "animal_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          id: string
          mime_type: string | null
          org_id: string
          size_bytes: number | null
          updated_at: string
          updated_by: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          id?: string
          mime_type?: string | null
          org_id: string
          size_bytes?: number | null
          updated_at?: string
          updated_by?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          entity_id?: string
          entity_type?: string
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          org_id?: string
          size_bytes?: number | null
          updated_at?: string
          updated_by?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "attachments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          id: string
          occurred_at: string
          org_id: string
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          id?: string
          occurred_at?: string
          org_id: string
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          id?: string
          occurred_at?: string
          org_id?: string
          record_id?: string | null
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
        ]
      }
      birth_offspring: {
        Row: {
          animal_id: string
          birth_id: string
          birth_weight: number | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          org_id: string
          outcome: string
          sex: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          animal_id: string
          birth_id: string
          birth_weight?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          org_id: string
          outcome?: string
          sex: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          animal_id?: string
          birth_id?: string
          birth_weight?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          org_id?: string
          outcome?: string
          sex?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "birth_offspring_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birth_offspring_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "v_animal_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birth_offspring_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "v_upcoming_vaccinations"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "birth_offspring_birth_id_fkey"
            columns: ["birth_id"]
            isOneToOne: false
            referencedRelation: "births"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birth_offspring_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birth_offspring_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birth_offspring_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "birth_offspring_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      births: {
        Row: {
          birth_date: string
          breeding_event_id: string | null
          complications: string | null
          created_at: string
          created_by: string | null
          dam_id: string
          deleted_at: string | null
          ease: string
          id: string
          litter_size: number
          notes: string | null
          org_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          birth_date: string
          breeding_event_id?: string | null
          complications?: string | null
          created_at?: string
          created_by?: string | null
          dam_id: string
          deleted_at?: string | null
          ease?: string
          id?: string
          litter_size?: number
          notes?: string | null
          org_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          birth_date?: string
          breeding_event_id?: string | null
          complications?: string | null
          created_at?: string
          created_by?: string | null
          dam_id?: string
          deleted_at?: string | null
          ease?: string
          id?: string
          litter_size?: number
          notes?: string | null
          org_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "births_breeding_event_id_fkey"
            columns: ["breeding_event_id"]
            isOneToOne: false
            referencedRelation: "breeding_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "births_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "births_dam_id_fkey"
            columns: ["dam_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "births_dam_id_fkey"
            columns: ["dam_id"]
            isOneToOne: false
            referencedRelation: "v_animal_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "births_dam_id_fkey"
            columns: ["dam_id"]
            isOneToOne: false
            referencedRelation: "v_upcoming_vaccinations"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "births_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "births_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "births_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      breeding_events: {
        Row: {
          created_at: string
          created_by: string | null
          dam_id: string
          deleted_at: string | null
          expected_due_date: string | null
          expected_due_window_end: string | null
          expected_due_window_start: string | null
          external_sire_note: string | null
          id: string
          joining_end: string | null
          joining_start: string | null
          method: string
          notes: string | null
          org_id: string
          service_date: string | null
          sire_id: string | null
          status: string
          straw_code: string | null
          technician: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          dam_id: string
          deleted_at?: string | null
          expected_due_date?: string | null
          expected_due_window_end?: string | null
          expected_due_window_start?: string | null
          external_sire_note?: string | null
          id?: string
          joining_end?: string | null
          joining_start?: string | null
          method: string
          notes?: string | null
          org_id: string
          service_date?: string | null
          sire_id?: string | null
          status?: string
          straw_code?: string | null
          technician?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          dam_id?: string
          deleted_at?: string | null
          expected_due_date?: string | null
          expected_due_window_end?: string | null
          expected_due_window_start?: string | null
          external_sire_note?: string | null
          id?: string
          joining_end?: string | null
          joining_start?: string | null
          method?: string
          notes?: string | null
          org_id?: string
          service_date?: string | null
          sire_id?: string | null
          status?: string
          straw_code?: string | null
          technician?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "breeding_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breeding_events_dam_id_fkey"
            columns: ["dam_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breeding_events_dam_id_fkey"
            columns: ["dam_id"]
            isOneToOne: false
            referencedRelation: "v_animal_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breeding_events_dam_id_fkey"
            columns: ["dam_id"]
            isOneToOne: false
            referencedRelation: "v_upcoming_vaccinations"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "breeding_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breeding_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "breeding_events_sire_id_fkey"
            columns: ["sire_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breeding_events_sire_id_fkey"
            columns: ["sire_id"]
            isOneToOne: false
            referencedRelation: "v_animal_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breeding_events_sire_id_fkey"
            columns: ["sire_id"]
            isOneToOne: false
            referencedRelation: "v_upcoming_vaccinations"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "breeding_events_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      breeds: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          name: string
          org_id: string
          species_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name: string
          org_id: string
          species_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name?: string
          org_id?: string
          species_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "breeds_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breeds_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breeds_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "breeds_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breeds_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      care_activities: {
        Row: {
          activity_date: string
          activity_type_id: string
          animal_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          next_due_date: string | null
          notes: string | null
          org_id: string
          performed_by: string | null
          product: string | null
          ranch_id: string | null
          section_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          activity_date: string
          activity_type_id: string
          animal_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          next_due_date?: string | null
          notes?: string | null
          org_id: string
          performed_by?: string | null
          product?: string | null
          ranch_id?: string | null
          section_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          activity_date?: string
          activity_type_id?: string
          animal_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          next_due_date?: string | null
          notes?: string | null
          org_id?: string
          performed_by?: string | null
          product?: string | null
          ranch_id?: string | null
          section_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "care_activities_activity_type_id_fkey"
            columns: ["activity_type_id"]
            isOneToOne: false
            referencedRelation: "care_activity_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_activities_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_activities_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "v_animal_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_activities_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "v_upcoming_vaccinations"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "care_activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_activities_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_activities_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "care_activities_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_activities_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "ranches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_activities_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "v_ranch_stats"
            referencedColumns: ["ranch_id"]
          },
          {
            foreignKeyName: "care_activities_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "ranch_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_activities_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      care_activity_types: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          name: string
          org_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name: string
          org_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name?: string
          org_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "care_activity_types_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_activity_types_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_activity_types_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "care_activity_types_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_items: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          name: string
          notes: string | null
          org_id: string
          unit: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name: string
          notes?: string | null
          org_id: string
          unit: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          org_id?: string
          unit?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "feed_items_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feeding_records: {
        Row: {
          animal_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          feed_date: string
          feed_item_id: string
          id: string
          notes: string | null
          org_id: string
          quantity: number
          ranch_id: string | null
          section_id: string | null
          unit: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          animal_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          feed_date: string
          feed_item_id: string
          id?: string
          notes?: string | null
          org_id: string
          quantity: number
          ranch_id?: string | null
          section_id?: string | null
          unit: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          animal_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          feed_date?: string
          feed_item_id?: string
          id?: string
          notes?: string | null
          org_id?: string
          quantity?: number
          ranch_id?: string | null
          section_id?: string | null
          unit?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feeding_records_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feeding_records_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "v_animal_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feeding_records_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "v_upcoming_vaccinations"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "feeding_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feeding_records_feed_item_id_fkey"
            columns: ["feed_item_id"]
            isOneToOne: false
            referencedRelation: "feed_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feeding_records_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feeding_records_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "feeding_records_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "ranches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feeding_records_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "v_ranch_stats"
            referencedColumns: ["ranch_id"]
          },
          {
            foreignKeyName: "feeding_records_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "ranch_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feeding_records_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      illness_types: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          name: string
          notes: string | null
          org_id: string
          species_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name: string
          notes?: string | null
          org_id: string
          species_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          org_id?: string
          species_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "illness_types_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "illness_types_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "illness_types_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "illness_types_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "illness_types_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      illnesses: {
        Row: {
          animal_id: string
          created_at: string
          created_by: string | null
          custom_name: string | null
          deleted_at: string | null
          diagnosed_by: string | null
          diagnosis: string | null
          id: string
          illness_type_id: string | null
          notes: string | null
          onset_date: string
          org_id: string
          resolved_date: string | null
          severity: string
          status: string
          symptoms: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          animal_id: string
          created_at?: string
          created_by?: string | null
          custom_name?: string | null
          deleted_at?: string | null
          diagnosed_by?: string | null
          diagnosis?: string | null
          id?: string
          illness_type_id?: string | null
          notes?: string | null
          onset_date: string
          org_id: string
          resolved_date?: string | null
          severity: string
          status?: string
          symptoms?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          animal_id?: string
          created_at?: string
          created_by?: string | null
          custom_name?: string | null
          deleted_at?: string | null
          diagnosed_by?: string | null
          diagnosis?: string | null
          id?: string
          illness_type_id?: string | null
          notes?: string | null
          onset_date?: string
          org_id?: string
          resolved_date?: string | null
          severity?: string
          status?: string
          symptoms?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "illnesses_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "illnesses_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "v_animal_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "illnesses_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "v_upcoming_vaccinations"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "illnesses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "illnesses_illness_type_id_fkey"
            columns: ["illness_type_id"]
            isOneToOne: false
            referencedRelation: "illness_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "illnesses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "illnesses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "illnesses_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          deleted_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          org_id: string
          role: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          deleted_at?: string | null
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          org_id: string
          role: string
          token?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          org_id?: string
          role?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
        ]
      }
      medications: {
        Row: {
          active_ingredient: string | null
          created_at: string
          created_by: string | null
          default_withdrawal_days: number | null
          deleted_at: string | null
          id: string
          name: string
          notes: string | null
          org_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active_ingredient?: string | null
          created_at?: string
          created_by?: string | null
          default_withdrawal_days?: number | null
          deleted_at?: string | null
          id?: string
          name: string
          notes?: string | null
          org_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active_ingredient?: string | null
          created_at?: string
          created_by?: string | null
          default_withdrawal_days?: number | null
          deleted_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          org_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "medications_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mortalities: {
        Row: {
          animal_id: string
          cause_category: string
          cause_details: string | null
          created_at: string
          created_by: string | null
          date_of_death: string
          deleted_at: string | null
          disposal_method: string | null
          id: string
          notes: string | null
          org_id: string
          postmortem_done: boolean
          ranch_id: string
          section_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          animal_id: string
          cause_category: string
          cause_details?: string | null
          created_at?: string
          created_by?: string | null
          date_of_death: string
          deleted_at?: string | null
          disposal_method?: string | null
          id?: string
          notes?: string | null
          org_id: string
          postmortem_done?: boolean
          ranch_id: string
          section_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          animal_id?: string
          cause_category?: string
          cause_details?: string | null
          created_at?: string
          created_by?: string | null
          date_of_death?: string
          deleted_at?: string | null
          disposal_method?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          postmortem_done?: boolean
          ranch_id?: string
          section_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mortalities_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mortalities_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "v_animal_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mortalities_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "v_upcoming_vaccinations"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "mortalities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mortalities_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mortalities_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "mortalities_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "ranches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mortalities_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "v_ranch_stats"
            referencedColumns: ["ranch_id"]
          },
          {
            foreignKeyName: "mortalities_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "ranch_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mortalities_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      movements: {
        Row: {
          animal_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          from_ranch_id: string
          from_section_id: string | null
          id: string
          movement_date: string
          notes: string | null
          org_id: string
          permit_number: string | null
          reason: string | null
          recorded_by: string | null
          to_ranch_id: string
          to_section_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          animal_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          from_ranch_id: string
          from_section_id?: string | null
          id?: string
          movement_date: string
          notes?: string | null
          org_id: string
          permit_number?: string | null
          reason?: string | null
          recorded_by?: string | null
          to_ranch_id: string
          to_section_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          animal_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          from_ranch_id?: string
          from_section_id?: string | null
          id?: string
          movement_date?: string
          notes?: string | null
          org_id?: string
          permit_number?: string | null
          reason?: string | null
          recorded_by?: string | null
          to_ranch_id?: string
          to_section_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movements_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "v_animal_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "v_upcoming_vaccinations"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_from_ranch_id_fkey"
            columns: ["from_ranch_id"]
            isOneToOne: false
            referencedRelation: "ranches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_from_ranch_id_fkey"
            columns: ["from_ranch_id"]
            isOneToOne: false
            referencedRelation: "v_ranch_stats"
            referencedColumns: ["ranch_id"]
          },
          {
            foreignKeyName: "movements_from_section_id_fkey"
            columns: ["from_section_id"]
            isOneToOne: false
            referencedRelation: "ranch_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "movements_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_to_ranch_id_fkey"
            columns: ["to_ranch_id"]
            isOneToOne: false
            referencedRelation: "ranches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_to_ranch_id_fkey"
            columns: ["to_ranch_id"]
            isOneToOne: false
            referencedRelation: "v_ranch_stats"
            referencedColumns: ["ranch_id"]
          },
          {
            foreignKeyName: "movements_to_section_id_fkey"
            columns: ["to_section_id"]
            isOneToOne: false
            referencedRelation: "ranch_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          created_at: string
          created_by: string | null
          feature_flags: Json
          org_id: string
          stale_health_days: number
          updated_at: string
          updated_by: string | null
          weight_unit: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          feature_flags?: Json
          org_id: string
          stale_health_days?: number
          updated_at?: string
          updated_by?: string | null
          weight_unit?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          feature_flags?: Json
          org_id?: string
          stale_health_days?: number
          updated_at?: string
          updated_by?: string | null
          weight_unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      pregnancy_checks: {
        Row: {
          breeding_event_id: string
          check_date: string
          checked_by: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          estimated_days: number | null
          id: string
          method: string | null
          org_id: string
          result: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          breeding_event_id: string
          check_date: string
          checked_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          estimated_days?: number | null
          id?: string
          method?: string | null
          org_id: string
          result: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          breeding_event_id?: string
          check_date?: string
          checked_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          estimated_days?: number | null
          id?: string
          method?: string | null
          org_id?: string
          result?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pregnancy_checks_breeding_event_id_fkey"
            columns: ["breeding_event_id"]
            isOneToOne: false
            referencedRelation: "breeding_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pregnancy_checks_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pregnancy_checks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pregnancy_checks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pregnancy_checks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "pregnancy_checks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean
          last_seen_at: string | null
          org_id: string
          phone: string | null
          role: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          full_name: string
          id: string
          is_active?: boolean
          last_seen_at?: string | null
          org_id: string
          phone?: string | null
          role: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          last_seen_at?: string | null
          org_id?: string
          phone?: string | null
          role?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "profiles_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ranch_assignments: {
        Row: {
          assigned_at: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          org_id: string
          profile_id: string
          ranch_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          assigned_at?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          org_id: string
          profile_id: string
          ranch_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          assigned_at?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          org_id?: string
          profile_id?: string
          ranch_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ranch_assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ranch_assignments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ranch_assignments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "ranch_assignments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ranch_assignments_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "ranches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ranch_assignments_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "v_ranch_stats"
            referencedColumns: ["ranch_id"]
          },
          {
            foreignKeyName: "ranch_assignments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ranch_sections: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          org_id: string
          ranch_id: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          org_id: string
          ranch_id: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          org_id?: string
          ranch_id?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ranch_sections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ranch_sections_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ranch_sections_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "ranch_sections_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "ranches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ranch_sections_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "v_ranch_stats"
            referencedColumns: ["ranch_id"]
          },
          {
            foreignKeyName: "ranch_sections_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ranches: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          cover_image_path: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          location: string | null
          name: string
          notes: string | null
          org_id: string
          size_acres: number | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          cover_image_path?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          org_id: string
          size_acres?: number | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          cover_image_path?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          org_id?: string
          size_acres?: number | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ranches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ranches_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ranches_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "ranches_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          animal_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          due_date: string
          id: string
          kind: string
          org_id: string
          payload: Json
          ranch_id: string | null
          sent_at: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          animal_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          due_date: string
          id?: string
          kind: string
          org_id: string
          payload?: Json
          ranch_id?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          animal_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          due_date?: string
          id?: string
          kind?: string
          org_id?: string
          payload?: Json
          ranch_id?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reminders_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "v_animal_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "v_upcoming_vaccinations"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "reminders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "reminders_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "ranches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "v_ranch_stats"
            referencedColumns: ["ranch_id"]
          },
          {
            foreignKeyName: "reminders_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      species: {
        Row: {
          created_at: string
          created_by: string | null
          default_gestation_days: number | null
          default_tag_prefix: string | null
          deleted_at: string | null
          icon_key: string | null
          id: string
          is_system: boolean
          name: string
          org_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          default_gestation_days?: number | null
          default_tag_prefix?: string | null
          deleted_at?: string | null
          icon_key?: string | null
          id?: string
          is_system?: boolean
          name: string
          org_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          default_gestation_days?: number | null
          default_tag_prefix?: string | null
          deleted_at?: string | null
          icon_key?: string | null
          id?: string
          is_system?: boolean
          name?: string
          org_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "species_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "species_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "species_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "species_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tag_sequences: {
        Row: {
          next_number: number
          org_id: string
          prefix: string
          updated_at: string
        }
        Insert: {
          next_number?: number
          org_id: string
          prefix: string
          updated_at?: string
        }
        Update: {
          next_number?: number
          org_id?: string
          prefix?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tag_sequences_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_sequences_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
        ]
      }
      treatments: {
        Row: {
          administered_by_profile: string | null
          animal_id: string
          cost: number | null
          created_at: string
          created_by: string | null
          custom_medication: string | null
          deleted_at: string | null
          dosage: string | null
          duration_days: number | null
          follow_up_date: string | null
          id: string
          illness_id: string | null
          medication_id: string | null
          notes: string | null
          org_id: string
          outcome: string | null
          route: string | null
          treatment_date: string
          updated_at: string
          updated_by: string | null
          veterinarian_id: string | null
          withdrawal_until: string | null
        }
        Insert: {
          administered_by_profile?: string | null
          animal_id: string
          cost?: number | null
          created_at?: string
          created_by?: string | null
          custom_medication?: string | null
          deleted_at?: string | null
          dosage?: string | null
          duration_days?: number | null
          follow_up_date?: string | null
          id?: string
          illness_id?: string | null
          medication_id?: string | null
          notes?: string | null
          org_id: string
          outcome?: string | null
          route?: string | null
          treatment_date: string
          updated_at?: string
          updated_by?: string | null
          veterinarian_id?: string | null
          withdrawal_until?: string | null
        }
        Update: {
          administered_by_profile?: string | null
          animal_id?: string
          cost?: number | null
          created_at?: string
          created_by?: string | null
          custom_medication?: string | null
          deleted_at?: string | null
          dosage?: string | null
          duration_days?: number | null
          follow_up_date?: string | null
          id?: string
          illness_id?: string | null
          medication_id?: string | null
          notes?: string | null
          org_id?: string
          outcome?: string | null
          route?: string | null
          treatment_date?: string
          updated_at?: string
          updated_by?: string | null
          veterinarian_id?: string | null
          withdrawal_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treatments_administered_by_profile_fkey"
            columns: ["administered_by_profile"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatments_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatments_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "v_animal_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatments_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "v_upcoming_vaccinations"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "treatments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatments_illness_id_fkey"
            columns: ["illness_id"]
            isOneToOne: false
            referencedRelation: "illnesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatments_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "treatments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatments_veterinarian_id_fkey"
            columns: ["veterinarian_id"]
            isOneToOne: false
            referencedRelation: "veterinarians"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccinations: {
        Row: {
          administered_by_profile: string | null
          animal_id: string
          batch_number: string | null
          created_at: string
          created_by: string | null
          date_administered: string
          deleted_at: string | null
          dose: string | null
          id: string
          next_due_date: string | null
          notes: string | null
          org_id: string
          route: string | null
          updated_at: string
          updated_by: string | null
          vaccine_id: string
          veterinarian_id: string | null
        }
        Insert: {
          administered_by_profile?: string | null
          animal_id: string
          batch_number?: string | null
          created_at?: string
          created_by?: string | null
          date_administered: string
          deleted_at?: string | null
          dose?: string | null
          id?: string
          next_due_date?: string | null
          notes?: string | null
          org_id: string
          route?: string | null
          updated_at?: string
          updated_by?: string | null
          vaccine_id: string
          veterinarian_id?: string | null
        }
        Update: {
          administered_by_profile?: string | null
          animal_id?: string
          batch_number?: string | null
          created_at?: string
          created_by?: string | null
          date_administered?: string
          deleted_at?: string | null
          dose?: string | null
          id?: string
          next_due_date?: string | null
          notes?: string | null
          org_id?: string
          route?: string | null
          updated_at?: string
          updated_by?: string | null
          vaccine_id?: string
          veterinarian_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vaccinations_administered_by_profile_fkey"
            columns: ["administered_by_profile"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccinations_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccinations_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "v_animal_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccinations_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "v_upcoming_vaccinations"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "vaccinations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccinations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccinations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "vaccinations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccinations_vaccine_id_fkey"
            columns: ["vaccine_id"]
            isOneToOne: false
            referencedRelation: "vaccines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccinations_veterinarian_id_fkey"
            columns: ["veterinarian_id"]
            isOneToOne: false
            referencedRelation: "veterinarians"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccines: {
        Row: {
          created_at: string
          created_by: string | null
          default_interval_days: number | null
          deleted_at: string | null
          id: string
          name: string
          notes: string | null
          org_id: string
          species_id: string | null
          target_disease: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          default_interval_days?: number | null
          deleted_at?: string | null
          id?: string
          name: string
          notes?: string | null
          org_id: string
          species_id?: string | null
          target_disease?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          default_interval_days?: number | null
          deleted_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          org_id?: string
          species_id?: string | null
          target_disease?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vaccines_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccines_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccines_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "vaccines_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccines_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vet_visit_animals: {
        Row: {
          animal_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          org_id: string
          updated_at: string
          updated_by: string | null
          vet_visit_id: string
        }
        Insert: {
          animal_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          org_id: string
          updated_at?: string
          updated_by?: string | null
          vet_visit_id: string
        }
        Update: {
          animal_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          org_id?: string
          updated_at?: string
          updated_by?: string | null
          vet_visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vet_visit_animals_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_visit_animals_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "v_animal_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_visit_animals_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "v_upcoming_vaccinations"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "vet_visit_animals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_visit_animals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_visit_animals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "vet_visit_animals_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_visit_animals_vet_visit_id_fkey"
            columns: ["vet_visit_id"]
            isOneToOne: false
            referencedRelation: "v_upcoming_vet_followups"
            referencedColumns: ["vet_visit_id"]
          },
          {
            foreignKeyName: "vet_visit_animals_vet_visit_id_fkey"
            columns: ["vet_visit_id"]
            isOneToOne: false
            referencedRelation: "vet_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      vet_visits: {
        Row: {
          cost: number | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          findings: string | null
          id: string
          next_visit_date: string | null
          notes: string | null
          org_id: string
          purpose: string | null
          ranch_id: string
          recommendations: string | null
          updated_at: string
          updated_by: string | null
          veterinarian_id: string | null
          visit_date: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          findings?: string | null
          id?: string
          next_visit_date?: string | null
          notes?: string | null
          org_id: string
          purpose?: string | null
          ranch_id: string
          recommendations?: string | null
          updated_at?: string
          updated_by?: string | null
          veterinarian_id?: string | null
          visit_date: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          findings?: string | null
          id?: string
          next_visit_date?: string | null
          notes?: string | null
          org_id?: string
          purpose?: string | null
          ranch_id?: string
          recommendations?: string | null
          updated_at?: string
          updated_by?: string | null
          veterinarian_id?: string | null
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "vet_visits_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_visits_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_visits_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "vet_visits_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "ranches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_visits_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "v_ranch_stats"
            referencedColumns: ["ranch_id"]
          },
          {
            foreignKeyName: "vet_visits_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_visits_veterinarian_id_fkey"
            columns: ["veterinarian_id"]
            isOneToOne: false
            referencedRelation: "veterinarians"
            referencedColumns: ["id"]
          },
        ]
      }
      veterinarians: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          org_id: string
          phone: string | null
          practice: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          org_id: string
          phone?: string | null
          practice?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          org_id?: string
          phone?: string | null
          practice?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "veterinarians_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "veterinarians_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "veterinarians_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "veterinarians_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weight_records: {
        Row: {
          animal_id: string
          body_condition_score: number | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          method: string
          notes: string | null
          org_id: string
          recorded_by: string | null
          updated_at: string
          updated_by: string | null
          weight_date: string
          weight_kg: number | null
        }
        Insert: {
          animal_id: string
          body_condition_score?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          method: string
          notes?: string | null
          org_id: string
          recorded_by?: string | null
          updated_at?: string
          updated_by?: string | null
          weight_date: string
          weight_kg?: number | null
        }
        Update: {
          animal_id?: string
          body_condition_score?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          method?: string
          notes?: string | null
          org_id?: string
          recorded_by?: string | null
          updated_at?: string
          updated_by?: string | null
          weight_date?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weight_records_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weight_records_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "v_animal_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weight_records_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "v_upcoming_vaccinations"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "weight_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weight_records_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weight_records_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "weight_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weight_records_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_animal_attention_summary: {
        Row: {
          animal_id: string | null
          org_id: string | null
          ranch_id: string | null
          reason_count: number | null
          severity_rank: number | null
          worst_severity: string | null
        }
        Relationships: []
      }
      v_animal_current: {
        Row: {
          acquisition_date: string | null
          acquisition_type: string | null
          anitrac_ain: string | null
          attention_reason_count: number | null
          attention_severity: string | null
          breed_id: string | null
          breed_name: string | null
          color: string | null
          created_at: string | null
          dam_id: string | null
          date_of_birth: string | null
          deleted_at: string | null
          dob_is_estimated: boolean | null
          id: string | null
          is_active_status: boolean | null
          last_event_date: string | null
          name: string | null
          notes: string | null
          org_id: string | null
          photo_path: string | null
          ranch_id: string | null
          ranch_name: string | null
          section_id: string | null
          section_name: string | null
          sex: string | null
          sire_id: string | null
          species_id: string | null
          species_name: string | null
          status_color_token: string | null
          status_id: string | null
          status_name: string | null
          tag_number: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "animals_breed_id_fkey"
            columns: ["breed_id"]
            isOneToOne: false
            referencedRelation: "breeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_dam_id_fkey"
            columns: ["dam_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_dam_id_fkey"
            columns: ["dam_id"]
            isOneToOne: false
            referencedRelation: "v_animal_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_dam_id_fkey"
            columns: ["dam_id"]
            isOneToOne: false
            referencedRelation: "v_upcoming_vaccinations"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "animals_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "ranches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "v_ranch_stats"
            referencedColumns: ["ranch_id"]
          },
          {
            foreignKeyName: "animals_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "ranch_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_sire_id_fkey"
            columns: ["sire_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_sire_id_fkey"
            columns: ["sire_id"]
            isOneToOne: false
            referencedRelation: "v_animal_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_sire_id_fkey"
            columns: ["sire_id"]
            isOneToOne: false
            referencedRelation: "v_upcoming_vaccinations"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "animals_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "animal_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      v_animal_weight_series: {
        Row: {
          animal_id: string | null
          average_daily_gain_kg: number | null
          body_condition_score: number | null
          id: string | null
          method: string | null
          org_id: string | null
          previous_weight_date: string | null
          previous_weight_kg: number | null
          weight_date: string | null
          weight_kg: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weight_records_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weight_records_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "v_animal_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weight_records_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "v_upcoming_vaccinations"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "weight_records_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weight_records_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
        ]
      }
      v_animals_requiring_attention: {
        Row: {
          animal_id: string | null
          due_date: string | null
          org_id: string | null
          ranch_id: string | null
          reason: string | null
          severity: string | null
        }
        Relationships: []
      }
      v_attention_summary_report: {
        Row: {
          count: number | null
          org_id: string | null
          ranch_id: string | null
          reason: string | null
          severity: string | null
          species_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "animals_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
        ]
      }
      v_birth_report: {
        Row: {
          count: number | null
          group_label: string | null
          month: string | null
          org_id: string | null
          ranch_id: string | null
          ranch_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "animals_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "ranches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "v_ranch_stats"
            referencedColumns: ["ranch_id"]
          },
          {
            foreignKeyName: "births_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "births_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
        ]
      }
      v_breeding_performance_report: {
        Row: {
          aborted_count: number | null
          confirmed_pregnant_count: number | null
          delivered_count: number | null
          not_pregnant_count: number | null
          org_id: string | null
          ranch_id: string | null
          ranch_name: string | null
          served_count: number | null
          species_id: string | null
          species_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "animals_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "ranches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "v_ranch_stats"
            referencedColumns: ["ranch_id"]
          },
          {
            foreignKeyName: "animals_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breeding_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breeding_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
        ]
      }
      v_care_activity_report: {
        Row: {
          count: number | null
          group_label: string | null
          month: string | null
          org_id: string | null
          ranch_id: string | null
          ranch_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "care_activities_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_activities_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
        ]
      }
      v_feeding_report: {
        Row: {
          count: number | null
          group_label: string | null
          month: string | null
          org_id: string | null
          quantity: number | null
          ranch_id: string | null
          ranch_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feeding_records_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feeding_records_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
        ]
      }
      v_illness_report: {
        Row: {
          count: number | null
          group_label: string | null
          month: string | null
          org_id: string | null
          ranch_id: string | null
          ranch_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "animals_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "ranches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "v_ranch_stats"
            referencedColumns: ["ranch_id"]
          },
          {
            foreignKeyName: "illnesses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "illnesses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
        ]
      }
      v_inventory_report: {
        Row: {
          count: number | null
          is_active_status: boolean | null
          org_id: string | null
          ranch_id: string | null
          ranch_name: string | null
          sex: string | null
          species_id: string | null
          species_name: string | null
          status_id: string | null
          status_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "animals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "animals_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "ranches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "v_ranch_stats"
            referencedColumns: ["ranch_id"]
          },
          {
            foreignKeyName: "animals_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "animal_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      v_mortality_report: {
        Row: {
          count: number | null
          group_label: string | null
          month: string | null
          org_id: string | null
          ranch_id: string | null
          ranch_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mortalities_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mortalities_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "mortalities_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "ranches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mortalities_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "v_ranch_stats"
            referencedColumns: ["ranch_id"]
          },
        ]
      }
      v_movement_report: {
        Row: {
          count: number | null
          group_label: string | null
          month: string | null
          org_id: string | null
          ranch_id: string | null
          ranch_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movements_from_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "ranches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_from_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "v_ranch_stats"
            referencedColumns: ["ranch_id"]
          },
          {
            foreignKeyName: "movements_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
        ]
      }
      v_org_stats: {
        Row: {
          active_animal_count: number | null
          animals_requiring_attention_count: number | null
          deaths_last_30_days: number | null
          female_count: number | null
          male_count: number | null
          new_enrollments_last_30_days: number | null
          org_id: string | null
          ranch_count: number | null
          species_breakdown: Json | null
        }
        Relationships: []
      }
      v_ranch_stats: {
        Row: {
          active_animal_count: number | null
          attention_count: number | null
          deaths_last_30_days: number | null
          female_count: number | null
          male_count: number | null
          new_enrollments_last_30_days: number | null
          org_id: string | null
          ranch_id: string | null
          ranch_name: string | null
          species_breakdown: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ranches_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ranches_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
        ]
      }
      v_recent_activity: {
        Row: {
          actor_id: string | null
          actor_name: string | null
          animal_id: string | null
          description: string | null
          details: Json | null
          event_date: string | null
          event_type: string | null
          occurred_at: string | null
          org_id: string | null
          ranch_id: string | null
          source_id: string | null
          species_id: string | null
        }
        Relationships: []
      }
      v_treatment_report: {
        Row: {
          count: number | null
          group_label: string | null
          month: string | null
          org_id: string | null
          ranch_id: string | null
          ranch_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "animals_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "ranches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "v_ranch_stats"
            referencedColumns: ["ranch_id"]
          },
          {
            foreignKeyName: "treatments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
        ]
      }
      v_upcoming_vaccinations: {
        Row: {
          animal_id: string | null
          animal_name: string | null
          next_due_date: string | null
          org_id: string | null
          ranch_id: string | null
          species_id: string | null
          tag_number: string | null
          vaccination_id: string | null
          vaccine_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "animals_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "ranches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "v_ranch_stats"
            referencedColumns: ["ranch_id"]
          },
          {
            foreignKeyName: "animals_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccinations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccinations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
        ]
      }
      v_upcoming_vet_followups: {
        Row: {
          next_visit_date: string | null
          org_id: string | null
          purpose: string | null
          ranch_id: string | null
          vet_visit_id: string | null
          veterinarian_id: string | null
          veterinarian_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vet_visits_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_visits_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "vet_visits_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "ranches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_visits_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "v_ranch_stats"
            referencedColumns: ["ranch_id"]
          },
          {
            foreignKeyName: "vet_visits_veterinarian_id_fkey"
            columns: ["veterinarian_id"]
            isOneToOne: false
            referencedRelation: "veterinarians"
            referencedColumns: ["id"]
          },
        ]
      }
      v_vaccination_compliance_report: {
        Row: {
          active_count: number | null
          org_id: string | null
          overdue_count: number | null
          ranch_id: string | null
          ranch_name: string | null
          species_id: string | null
          species_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "animals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "animals_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "ranches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "v_ranch_stats"
            referencedColumns: ["ranch_id"]
          },
          {
            foreignKeyName: "animals_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
        ]
      }
      v_weight_growth_report: {
        Row: {
          avg_adg_kg: number | null
          month: string | null
          org_id: string | null
          ranch_id: string | null
          ranch_name: string | null
          reading_count: number | null
          species_id: string | null
          species_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "animals_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "ranches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_ranch_id_fkey"
            columns: ["ranch_id"]
            isOneToOne: false
            referencedRelation: "v_ranch_stats"
            referencedColumns: ["ranch_id"]
          },
          {
            foreignKeyName: "animals_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weight_records_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weight_records_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_org_stats"
            referencedColumns: ["org_id"]
          },
        ]
      }
    }
    Functions: {
      auth_org_id: { Args: never; Returns: string }
      bulk_health_event: {
        Args: {
          p_administered_by_profile?: string
          p_animal_ids: string[]
          p_batch_number?: string
          p_date_administered: string
          p_dose?: string
          p_next_due_date?: string
          p_notes?: string
          p_route?: string
          p_vaccine_id: string
          p_veterinarian_id?: string
        }
        Returns: {
          administered_by_profile: string | null
          animal_id: string
          batch_number: string | null
          created_at: string
          created_by: string | null
          date_administered: string
          deleted_at: string | null
          dose: string | null
          id: string
          next_due_date: string | null
          notes: string | null
          org_id: string
          route: string | null
          updated_at: string
          updated_by: string | null
          vaccine_id: string
          veterinarian_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "vaccinations"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      bulk_illness_event: {
        Args: {
          p_animal_ids: string[]
          p_custom_name?: string
          p_diagnosed_by?: string
          p_diagnosis?: string
          p_illness_type_id?: string
          p_notes?: string
          p_onset_date: string
          p_resolved_date?: string
          p_severity: string
          p_status?: string
          p_symptoms?: string
        }
        Returns: {
          animal_id: string
          created_at: string
          created_by: string | null
          custom_name: string | null
          deleted_at: string | null
          diagnosed_by: string | null
          diagnosis: string | null
          id: string
          illness_type_id: string | null
          notes: string | null
          onset_date: string
          org_id: string
          resolved_date: string | null
          severity: string
          status: string
          symptoms: string | null
          updated_at: string
          updated_by: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "illnesses"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      bulk_reserve_tags: {
        Args: {
          p_count: number
          p_prefix: string
          p_ranch_id: string
          p_section_id?: string
          p_species_id?: string
        }
        Returns: {
          acquisition_date: string | null
          acquisition_type: string
          anitrac_ain: string | null
          breed_id: string | null
          color: string | null
          created_at: string
          created_by: string | null
          dam_id: string | null
          date_of_birth: string | null
          deleted_at: string | null
          dob_is_estimated: boolean
          id: string
          name: string | null
          notes: string | null
          org_id: string
          photo_path: string | null
          ranch_id: string
          section_id: string | null
          sex: string
          sire_id: string | null
          species_id: string | null
          status_id: string
          tag_number: string
          updated_at: string
          updated_by: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "animals"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      bulk_treatment_event: {
        Args: {
          p_administered_by_profile?: string
          p_animal_ids: string[]
          p_custom_medication?: string
          p_dosage?: string
          p_duration_days?: number
          p_follow_up_date?: string
          p_illness_id?: string
          p_medication_id?: string
          p_notes?: string
          p_outcome?: string
          p_route?: string
          p_treatment_date: string
          p_veterinarian_id?: string
          p_withdrawal_until?: string
        }
        Returns: {
          administered_by_profile: string | null
          animal_id: string
          cost: number | null
          created_at: string
          created_by: string | null
          custom_medication: string | null
          deleted_at: string | null
          dosage: string | null
          duration_days: number | null
          follow_up_date: string | null
          id: string
          illness_id: string | null
          medication_id: string | null
          notes: string | null
          org_id: string
          outcome: string | null
          route: string | null
          treatment_date: string
          updated_at: string
          updated_by: string | null
          veterinarian_id: string | null
          withdrawal_until: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "treatments"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      bulk_weight_event: {
        Args: {
          p_animal_ids: string[]
          p_body_condition_score?: number
          p_method: string
          p_notes?: string
          p_weight_date: string
          p_weight_kg?: number
        }
        Returns: {
          animal_id: string
          body_condition_score: number | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          method: string
          notes: string | null
          org_id: string
          recorded_by: string | null
          updated_at: string
          updated_by: string | null
          weight_date: string
          weight_kg: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "weight_records"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_ancestors: {
        Args: { p_animal_id: string; p_max_depth?: number }
        Returns: {
          depth: number
          id: string
          relation: string
        }[]
      }
      get_animal_facet_counts: {
        Args: {
          p_breed_ids?: string[]
          p_ranch_id?: string
          p_search?: string
          p_section_ids?: string[]
          p_sexes?: string[]
          p_species_ids?: string[]
          p_status_ids?: string[]
        }
        Returns: Json
      }
      get_dashboard_stats: {
        Args: {
          p_date_from?: string
          p_date_to?: string
          p_ranch_ids?: string[]
          p_species_id?: string
        }
        Returns: Json
      }
      get_descendants: {
        Args: { p_animal_id: string; p_max_depth?: number }
        Returns: {
          depth: number
          id: string
        }[]
      }
      has_animal_access: { Args: { p_animal_id: string }; Returns: boolean }
      has_ranch_access: { Args: { p_ranch_id: string }; Returns: boolean }
      is_owner: { Args: never; Returns: boolean }
      next_tag_number: {
        Args: { p_org_id: string; p_prefix: string }
        Returns: string
      }
      record_birth: {
        Args: {
          p_birth_date: string
          p_breeding_event_id?: string
          p_complications?: string
          p_dam_id: string
          p_ease?: string
          p_notes?: string
          p_offspring: Json
        }
        Returns: {
          birth_date: string
          breeding_event_id: string | null
          complications: string | null
          created_at: string
          created_by: string | null
          dam_id: string
          deleted_at: string | null
          ease: string
          id: string
          litter_size: number
          notes: string | null
          org_id: string
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "births"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_death: {
        Args: {
          p_animal_id: string
          p_cause_category: string
          p_cause_details?: string
          p_date_of_death: string
          p_disposal_method?: string
          p_notes?: string
          p_postmortem_done?: boolean
        }
        Returns: {
          animal_id: string
          cause_category: string
          cause_details: string | null
          created_at: string
          created_by: string | null
          date_of_death: string
          deleted_at: string | null
          disposal_method: string | null
          id: string
          notes: string | null
          org_id: string
          postmortem_done: boolean
          ranch_id: string
          section_id: string | null
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "mortalities"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_movement: {
        Args: {
          p_animal_id: string
          p_movement_date?: string
          p_notes?: string
          p_permit_number?: string
          p_reason?: string
          p_to_ranch_id: string
          p_to_section_id?: string
        }
        Returns: {
          animal_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          from_ranch_id: string
          from_section_id: string | null
          id: string
          movement_date: string
          notes: string | null
          org_id: string
          permit_number: string | null
          reason: string | null
          recorded_by: string | null
          to_ranch_id: string
          to_section_id: string | null
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "movements"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_vet_visit: {
        Args: {
          p_animal_ids: string[]
          p_findings?: string
          p_next_visit_date?: string
          p_notes?: string
          p_purpose?: string
          p_recommendations?: string
          p_veterinarian_id?: string
          p_visit_date: string
        }
        Returns: {
          cost: number | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          findings: string | null
          id: string
          next_visit_date: string | null
          notes: string | null
          org_id: string
          purpose: string | null
          ranch_id: string
          recommendations: string | null
          updated_at: string
          updated_by: string | null
          veterinarian_id: string | null
          visit_date: string
        }
        SetofOptions: {
          from: "*"
          to: "vet_visits"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      touch_presence: { Args: never; Returns: undefined }
      uuid_generate_v7: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
