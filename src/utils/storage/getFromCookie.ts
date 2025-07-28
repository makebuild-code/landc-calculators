export const getFromCookie = (key: string): string | null => {
  const cookie = document.cookie.split('; ').find((row) => row.startsWith(`${key}=`));
  if (cookie) return cookie.split('=')[1];
  return null;
};
