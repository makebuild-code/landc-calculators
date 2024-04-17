export type SearchParameter = { key: string; value: string };

export const appendSearchParameter = (element: HTMLLinkElement, paramsToAdd: SearchParameter[]) => {
  // eslint-disable-next-line no-console
  console.log('appendSearchParameter');

  const url = new URL(element.href);
  const params = new URLSearchParams(url.search);

  paramsToAdd.forEach((param) => {
    params.append(param.key, param.value);
  });

  url.search = params.toString();
  element.href = url.toString();
};
