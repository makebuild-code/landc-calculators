import { AppointmentManager } from './Manager';

export const initAppointment = (component: HTMLElement): AppointmentManager | null => {
  const manager = new AppointmentManager(component);
  if (!manager) return null;
  return manager;
};
