import { InsulinProtocol } from '../types';

/**
 * Calcula o ajuste de vazão de insulina baseado no protocolo médico
 * @param hgt_value Valor atual da glicemia (HGT)
 * @param current_rate Vazão atual de insulina
 * @param previous_hgt Valor anterior da glicemia (opcional)
 * @param round_rate Se deve arredondar a vazão
 * @returns Objeto com a ação a ser tomada e nova vazão
 */
export function calculateInsulinAdjustment(
  hgt_value: number,
  current_rate: number,
  previous_hgt?: number,
  round_rate: boolean = true
): InsulinProtocol {
  let action: InsulinProtocol['action'];
  let new_rate: number;
  let next_check_minutes: number = 60; // Padrão: 1 hora
  let alert_message: string | undefined;

  // Protocolo de ajuste baseado nos valores de HGT
  if (hgt_value < 90) {
    // HGT < 90 mg/dL: Hipoglicemia severa
    action = 'hypoglycemia_protocol';
    new_rate = 0; // Parar bomba
    next_check_minutes = 15; // Reavaliar em 15 minutos
    alert_message = 'HIPOGLICEMIA SEVERA: Infundir 20 mL de glicose 50% e reavaliar em 15 minutos';
  } else if (hgt_value < 140) {
    // HGT < 140 mg/dL: Desligar bomba
    action = 'stop';
    new_rate = 0;
    next_check_minutes = 30; // Reavaliar em 30 minutos
    alert_message = 'HGT baixo: Bomba desligada. Reavaliar em 30 minutos';
  } else if (hgt_value >= 140 && hgt_value <= 180) {
    // HGT 140-180 mg/dL: Reduzir vazão em 50%
    action = 'reduce_50';
    new_rate = current_rate * 0.5;
    alert_message = 'HGT no alvo inferior: Vazão reduzida em 50%';
  } else {
    // HGT > 180 mg/dL: Calcular delta com HGT anterior
    if (previous_hgt !== undefined) {
      const delta_percentage = ((hgt_value - previous_hgt) / previous_hgt) * 100;
      
      if (delta_percentage < 50) {
        // Delta < 50%: Aumentar vazão em 50%
        action = 'increase_50';
        new_rate = current_rate * 1.5;
        alert_message = `HGT alto com melhora lenta (${delta_percentage.toFixed(1)}%): Vazão aumentada em 50%`;
      } else if (delta_percentage >= 50 && delta_percentage <= 70) {
        // Delta 50-70%: Manter vazão
        action = 'maintain';
        new_rate = current_rate;
        alert_message = `HGT alto com melhora adequada (${delta_percentage.toFixed(1)}%): Vazão mantida`;
      } else {
        // Delta > 70%: Reduzir vazão em 50%
        action = 'reduce_50';
        new_rate = current_rate * 0.5;
        alert_message = `HGT alto com melhora rápida (${delta_percentage.toFixed(1)}%): Vazão reduzida em 50%`;
      }
    } else {
      // Primeira medição com HGT > 180: Aumentar vazão
      action = 'increase_50';
      new_rate = current_rate * 1.5;
      alert_message = 'HGT alto (primeira medição): Vazão aumentada em 50%';
    }
  }

  // Arredondar vazão se necessário
  if (round_rate && new_rate > 0) {
    new_rate = Math.round(new_rate);
  }

  // Garantir que a vazão não seja negativa
  new_rate = Math.max(0, new_rate);

  return {
    hgt_value,
    current_rate,
    previous_hgt,
    action,
    new_rate,
    next_check_minutes,
    alert_message
  };
}

/**
 * Calcula a vazão inicial de insulina baseada no peso
 * @param weight Peso do paciente em kg
 * @param round_rate Se deve arredondar a vazão
 * @returns Vazão inicial em UI/h
 */
export function calculateInitialRate(weight: number, round_rate: boolean = true): number {
  let rate = weight * 0.1; // 0.1 UI/kg/h
  
  if (round_rate) {
    rate = Math.round(rate);
  }
  
  return Math.max(1, rate); // Vazão mínima de 1 UI/h
}

/**
 * Verifica se é necessário trocar a solução (a cada 6 horas)
 * @param start_time Horário de início do protocolo
 * @returns Se deve trocar a solução
 */
export function shouldChangeSolution(start_time: string): boolean {
  const startDate = new Date(start_time);
  const now = new Date();
  const diffHours = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  
  return diffHours >= 6;
}

/**
 * Calcula o próximo horário de verificação de HGT
 * @param last_check Último horário de verificação
 * @param interval_minutes Intervalo em minutos
 * @returns Próximo horário de verificação
 */
export function getNextCheckTime(last_check: string, interval_minutes: number = 60): Date {
  const lastCheckDate = new Date(last_check);
  return new Date(lastCheckDate.getTime() + (interval_minutes * 60 * 1000));
}

/**
 * Formata a vazão para exibição
 * @param rate Vazão em UI/h
 * @returns String formatada
 */
export function formatRate(rate: number): string {
  if (rate === 0) return 'Bomba desligada';
  return `${rate.toFixed(1)} UI/h`;
}

/**
 * Formata o valor de HGT para exibição
 * @param hgt Valor de HGT
 * @returns String formatada
 */
export function formatHGT(hgt: number): string {
  return `${hgt} mg/dL`;
}

/**
 * Valida se o valor de HGT está dentro do range aceitável
 * @param hgt Valor de HGT
 * @returns Se o valor é válido
 */
export function isValidHGT(hgt: number): boolean {
  return hgt >= 30 && hgt <= 600; // Range médico aceitável
}

/**
 * Classifica o nível de glicemia
 * @param hgt Valor de HGT
 * @returns Classificação do nível
 */
export function classifyGlycemia(hgt: number): {
  level: 'hypoglycemia_severe' | 'hypoglycemia' | 'normal' | 'hyperglycemia_mild' | 'hyperglycemia_severe';
  color: string;
  description: string;
} {
  if (hgt < 70) {
    return {
      level: 'hypoglycemia_severe',
      color: 'text-red-600',
      description: 'Hipoglicemia Severa'
    };
  } else if (hgt < 90) {
    return {
      level: 'hypoglycemia',
      color: 'text-orange-600',
      description: 'Hipoglicemia'
    };
  } else if (hgt >= 90 && hgt <= 180) {
    return {
      level: 'normal',
      color: 'text-green-600',
      description: 'Normal'
    };
  } else if (hgt > 180 && hgt <= 250) {
    return {
      level: 'hyperglycemia_mild',
      color: 'text-yellow-600',
      description: 'Hiperglicemia Leve'
    };
  } else {
    return {
      level: 'hyperglycemia_severe',
      color: 'text-red-600',
      description: 'Hiperglicemia Severa'
    };
  }
}