export type SearchParameter = { key: string; value: string };

export const setSearchParameter = (element: HTMLLinkElement, paramsToAdd: SearchParameter[]) => {
  const url = new URL(element.href);
  const params = new URLSearchParams(url.search);

  paramsToAdd.forEach((param) => {
    params.set(param.key, param.value);
  });

  url.search = params.toString();
  element.href = url.toString();
};
