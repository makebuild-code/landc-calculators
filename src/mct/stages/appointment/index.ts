import { AppointmentManager } from './Manager';

export const initAppointment = (component: HTMLElement): AppointmentManager => {
  return new AppointmentManager(component);
};
