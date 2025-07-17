export const formatToHHMM = (t: string): string => {
  // Accepts "HH:MM:SS" or "HH:MM"
  const parts = t.split(':');
  return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : t;
};
