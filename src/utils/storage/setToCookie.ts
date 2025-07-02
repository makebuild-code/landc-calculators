export const setToCookie = (key: string, value: string) => {
  document.cookie = `${key}=${value}; path=/`;
};
