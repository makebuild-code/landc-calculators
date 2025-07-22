type LogErrorOptions = {
  data?: any;
  returnNull?: boolean;
};

export function logError(message: string, options: LogErrorOptions = {}): false | null {
  console.error(message, options.data || '');
  return options.returnNull ? null : false;
}
