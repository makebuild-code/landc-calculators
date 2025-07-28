export const getOrginalDate = (date: Date): string => {
  const day = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
  const dayNumber = date.getDate();
  const suffix = getOrdinalSuffix(dayNumber);
  return day.replace(/\d+/, dayNumber + suffix);
};

export const getOrdinalSuffix = (day: number): string => {
  if (day > 3 && day < 21) return 'th'; // Catch 11th, 12th, 13th
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
};
