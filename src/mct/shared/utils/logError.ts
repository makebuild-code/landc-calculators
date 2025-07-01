export const logError = (message: string, data?: any): boolean => {
  console.log(message, data || '');
  return false;
};
