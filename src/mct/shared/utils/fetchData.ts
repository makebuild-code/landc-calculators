import { getBaseURLForAPI } from 'src/utils/getBaseURLForAPI';

export const fetchData = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
  const baseURL = getBaseURLForAPI();
  const response = await fetch(`${baseURL}${endpoint}`, options);
  if (!response.ok) throw new Error('Failed to fetch data');

  return response.json();
};
