import { LocalNotifications } from '@capacitor/local-notifications';
import { NotificationConfig } from '../types';

/**
 * Inicializa o sistema de notificações e solicita permissões
 */
export async function initializeNotifications(): Promise<boolean> {
  try {
    // Verificar se estamos em um ambiente web ou mobile
    if (typeof window === 'undefined') {
      return false;
    }

    // Verificar se o plugin está disponível
    if (!LocalNotifications) {
      console.warn('LocalNotifications plugin not available');
      return false;
    }

    // Solicitar permissões
    const permission = await LocalNotifications.requestPermissions();
    
    if (permission.display === 'granted') {
      console.log('Notification permissions granted');
      return true;
    } else {
      console.warn('Notification permissions denied');
      return false;
    }
  } catch (error) {
    console.error('Error initializing notifications:', error);
    return false;
  }
}

/**
 * Agenda uma notificação para verificação de HGT
 */
export async function scheduleHGTCheck(
  patientName: string,
  patientId: number,
  checkTime: Date
): Promise<void> {
  try {
    const notification: NotificationConfig = {
      title: 'VitaFlow - Verificação HGT',
      body: `Verificar HGT do paciente ${patientName}`,
      schedule: {
        at: checkTime
      },
      extra: {
        patient_id: patientId,
        type: 'hgt_check'
      }
    };

    await scheduleNotification(notification, `hgt_${patientId}_${checkTime.getTime()}`);
  } catch (error) {
    console.error('Error scheduling HGT check notification:', error);
  }
}

/**
 * Agenda uma notificação para troca de solução
 */
export async function scheduleSolutionChange(
  patientName: string,
  patientId: number,
  changeTime: Date
): Promise<void> {
  try {
    const notification: NotificationConfig = {
      title: 'VitaFlow - Troca de Solução',
      body: `Trocar solução de 20 mL para ${patientName}`,
      schedule: {
        at: changeTime
      },
      extra: {
        patient_id: patientId,
        type: 'solution_change'
      }
    };

    await scheduleNotification(notification, `solution_${patientId}_${changeTime.getTime()}`);
  } catch (error) {
    console.error('Error scheduling solution change notification:', error);
  }
}

/**
 * Agenda uma notificação de alerta urgente (hipoglicemia)
 */
export async function scheduleUrgentAlert(
  patientName: string,
  patientId: number,
  message: string,
  delayMinutes: number = 0
): Promise<void> {
  try {
    const alertTime = new Date();
    alertTime.setMinutes(alertTime.getMinutes() + delayMinutes);

    const notification: NotificationConfig = {
      title: 'VitaFlow - ALERTA URGENTE',
      body: `${patientName}: ${message}`,
      schedule: {
        at: alertTime
      },
      extra: {
        patient_id: patientId,
        type: 'urgent_alert'
      }
    };

    await scheduleNotification(notification, `urgent_${patientId}_${alertTime.getTime()}`);
  } catch (error) {
    console.error('Error scheduling urgent alert:', error);
  }
}

/**
 * Função genérica para agendar notificações
 */
async function scheduleNotification(config: NotificationConfig, id: string): Promise<void> {
  try {
    if (!LocalNotifications) {
      // Fallback para web usando Web Notifications API
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(config.title, {
          body: config.body,
          icon: '/icons/icon-192x192.png'
        });
      }
      return;
    }

    await LocalNotifications.schedule({
      notifications: [{
        id: parseInt(id.replace(/\D/g, '').slice(-8)), // Usar últimos 8 dígitos como ID numérico
        title: config.title,
        body: config.body,
        schedule: config.schedule,
        extra: config.extra,
        sound: 'default',
        attachments: undefined,
        actionTypeId: '',
        group: 'vitaflow'
      }]
    });

    console.log(`Notification scheduled: ${config.title}`);
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
}

/**
 * Cancela todas as notificações de um paciente
 */
export async function cancelPatientNotifications(patientId: number): Promise<void> {
  try {
    if (!LocalNotifications) {
      return;
    }

    // Obter todas as notificações pendentes
    const pending = await LocalNotifications.getPending();
    
    // Filtrar notificações do paciente
    const patientNotifications = pending.notifications.filter(
      notification => notification.extra?.patient_id === patientId
    );

    if (patientNotifications.length > 0) {
      const ids = patientNotifications.map(n => ({ id: n.id }));
      await LocalNotifications.cancel({ notifications: ids });
      console.log(`Cancelled ${patientNotifications.length} notifications for patient ${patientId}`);
    }
  } catch (error) {
    console.error('Error cancelling patient notifications:', error);
  }
}

/**
 * Cancela uma notificação específica
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    if (!LocalNotifications) {
      return;
    }

    const id = parseInt(notificationId.replace(/\D/g, '').slice(-8));
    await LocalNotifications.cancel({
      notifications: [{ id }]
    });

    console.log(`Notification cancelled: ${notificationId}`);
  } catch (error) {
    console.error('Error cancelling notification:', error);
  }
}

/**
 * Lista todas as notificações pendentes
 */
export async function getPendingNotifications(): Promise<any[]> {
  try {
    if (!LocalNotifications) {
      return [];
    }

    const pending = await LocalNotifications.getPending();
    return pending.notifications;
  } catch (error) {
    console.error('Error getting pending notifications:', error);
    return [];
  }
}

/**
 * Configura intervalos automáticos para verificações de HGT
 */
export function setupHGTIntervals(patientId: number, patientName: string): void {
  // Verificação de HGT a cada hora
  const hgtInterval = setInterval(() => {
    const nextCheck = new Date();
    nextCheck.setHours(nextCheck.getHours() + 1);
    scheduleHGTCheck(patientName, patientId, nextCheck);
  }, 60 * 60 * 1000); // 1 hora

  // Troca de solução a cada 6 horas
  const solutionInterval = setInterval(() => {
    const nextChange = new Date();
    nextChange.setHours(nextChange.getHours() + 6);
    scheduleSolutionChange(patientName, patientId, nextChange);
  }, 6 * 60 * 60 * 1000); // 6 horas

  // Armazenar IDs dos intervalos para cancelar posteriormente
  if (typeof window !== 'undefined') {
    window.vitaFlowIntervals = window.vitaFlowIntervals || {};
    window.vitaFlowIntervals[patientId] = {
      hgt: hgtInterval,
      solution: solutionInterval
    };
  }
}

/**
 * Cancela intervalos automáticos de um paciente
 */
export function clearHGTIntervals(patientId: number): void {
  if (typeof window !== 'undefined' && window.vitaFlowIntervals) {
    const intervals = window.vitaFlowIntervals[patientId];
    if (intervals) {
      clearInterval(intervals.hgt);
      clearInterval(intervals.solution);
      delete window.vitaFlowIntervals[patientId];
      console.log(`Intervals cleared for patient ${patientId}`);
    }
  }
}

// Declaração de tipos para window
declare global {
  interface Window {
    vitaFlowIntervals?: {
      [patientId: number]: {
        hgt: NodeJS.Timeout;
        solution: NodeJS.Timeout;
      };
    };
  }
}