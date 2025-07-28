// Appointment slot types
export interface AppointmentSlot {
  startTime: string;
  endTime: string;
  capacity: number;
  enabled: boolean;
}

export interface AppointmentDay {
  date: string;
  slots: AppointmentSlot[];
}

export interface MortgageAppointmentSlotsResponse {
  urlcalled: string;
  result: AppointmentDay[];
  paramvalues: string;
}

export interface AppointmentSelection {
  date: string;
  time: string;
}
