// Tipos para autenticação
export interface User {
  id: number;
  username: string;
  role: 'admin' | 'nurse';
  created_at: string;
}

// Tipos para pacientes
export interface Patient {
  id: number;
  name: string;
  age: number;
  sector: string;
  bed: number;
  weight: number;
  rate: number;
  round_rate: boolean;
  hgt_history: HGTRecord[];
  start_time: string;
  status: 'active' | 'completed' | 'paused';
  created_by: number;
  updated_at: string;
}

// Histórico de HGT (glicemia)
export interface HGTRecord {
  timestamp: string;
  hgt_value: number;
  rate_before: number;
  rate_after: number;
  action: string;
  notes?: string;
}

// Formulário de cadastro de paciente
export interface PatientForm {
  name: string;
  age: number;
  sector: string;
  bed: number;
  weight: number;
  round_rate: boolean;
}

// Setores disponíveis
export const SECTORS = [
  'COENF',
  'Ortopedia',
  'Cardiologia',
  'UTI',
  'Neurologia',
  'Pneumologia',
  'Gastroenterologia',
  'Oncologia'
] as const;

export type Sector = typeof SECTORS[number];

// Tipos para alertas
export interface Alert {
  id: string;
  patient_id: number;
  type: 'hgt_check' | 'solution_change' | 'hypoglycemia' | 'hyperglycemia';
  message: string;
  scheduled_time: string;
  status: 'pending' | 'completed' | 'dismissed';
  created_at: string;
}

// Tipos para notificações
export interface NotificationConfig {
  title: string;
  body: string;
  schedule?: {
    at: Date;
  };
  extra?: {
    patient_id: number;
    type: string;
  };
}

// Protocolo de insulina - regras de ajuste
export interface InsulinProtocol {
  hgt_value: number;
  current_rate: number;
  previous_hgt?: number;
  action: 'stop' | 'reduce_50' | 'maintain' | 'increase_50' | 'hypoglycemia_protocol';
  new_rate: number;
  next_check_minutes: number;
  alert_message?: string;
}

// Resposta da API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}