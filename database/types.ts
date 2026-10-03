/**
 * Database types.
 *
 * Regenerate after every migration rather than hand-editing:
 *   npx supabase gen types typescript --project-id <id> > database/types.ts
 *
 * The shape below mirrors database/migrations and is what the Supabase clients
 * are parameterised on.
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['users']['Insert']>
        Relationships: []
      }

      profiles: {
        Row: {
          user_id: string
          country_code: string
          monthly_income: number | null
          monthly_expenses: number | null
          existing_debt_payments: number | null
          credit_score: number | null
          savings_balance: number | null
          risk_tolerance: 'conservative' | 'balanced' | 'aggressive' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          country_code?: string
          monthly_income?: number | null
          monthly_expenses?: number | null
          existing_debt_payments?: number | null
          credit_score?: number | null
          savings_balance?: number | null
          risk_tolerance?: 'conservative' | 'balanced' | 'aggressive' | null
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }

      providers: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          country_code: string
          rating: number | null
          website_url: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['providers']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['providers']['Insert']>
        Relationships: []
      }

      products: {
        Row: {
          id: string
          provider_id: string
          category: 'mortgage' | 'car-loan' | 'personal-loan' | 'savings'
          name: string
          country_code: string
          currency: string
          rate_min: number
          rate_max: number
          rate_type: 'fixed' | 'variable'
          term_months_min: number
          term_months_max: number
          amount_min: number
          amount_max: number
          origination_fee: number
          min_credit_score: number | null
          min_income: number | null
          max_debt_to_income: number | null
          residency_required: boolean
          featured: boolean
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['products']['Row'],
          'id' | 'created_at' | 'updated_at'
        > & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['products']['Insert']>
        Relationships: []
      }

      rates: {
        Row: {
          id: string
          product_id: string | null
          benchmark: string | null
          country_code: string
          category: string
          rate: number
          effective_date: string
          source: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['rates']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['rates']['Insert']>
        Relationships: []
      }

      scenarios: {
        Row: {
          id: string
          user_id: string
          calculator_id: string
          name: string
          inputs: Json
          results: Json
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          calculator_id: string
          name: string
          inputs?: Json
          results?: Json
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['scenarios']['Insert']>
        Relationships: []
      }

      goals: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'savings' | 'debt-free' | 'purchase' | 'retirement'
          target_amount: number
          current_amount: number
          target_date: string | null
          monthly_contribution: number | null
          annual_return: number
          linked_scenario_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['goals']['Row'],
          'id' | 'created_at' | 'updated_at'
        > & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['goals']['Insert']>
        Relationships: []
      }

      goal_contributions: {
        Row: {
          id: string
          goal_id: string
          amount: number
          occurred_on: string
          note: string | null
          created_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['goal_contributions']['Row'],
          'id' | 'created_at'
        > & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['goal_contributions']['Insert']>
        Relationships: []
      }

      events: {
        Row: {
          id: number
          user_id: string | null
          anonymous_id: string | null
          name: string
          properties: Json
          country_code: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at'> & {
          id?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['events']['Insert']>
        Relationships: []
      }

      ai_usage: {
        Row: {
          id: number
          user_id: string | null
          feature: string
          model: string
          input_tokens: number
          output_tokens: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['ai_usage']['Row'], 'id' | 'created_at'> & {
          id?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['ai_usage']['Insert']>
        Relationships: []
      }

      countries: {
        Row: {
          code: string
          name: string
          currency: string
          locale: string
          quotes_effective_annual_rate: boolean
          max_debt_to_income: number
          min_down_payment_ratio: number
        }
        Insert: Database['public']['Tables']['countries']['Row']
        Update: Partial<Database['public']['Tables']['countries']['Row']>
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
