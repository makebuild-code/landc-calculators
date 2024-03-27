/**
 * A function to programatically create an element of any type
 * @param type what type of element is it
 * @param location to what element should it be added as a child to
 * @param options what additional items should be added, e.g. class, dataset, text, callback or attribute
 * @returns the HTML element
 */

type CallBackType = (ev: Event) => void;

export const createElement = (
  type: string,
  location: HTMLHeadElement | HTMLBodyElement,
  options: { [key: string]: string | boolean | CallBackType } = {}
) => {
  const element = document.createElement(type);

  Object.entries(options).forEach(([key, value]) => {
    switch (key) {
      case 'class':
        element.classList.add(value as string);
        break;
      case 'dataset':
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          element.dataset[dataKey] = dataValue;
        });
        break;
      case 'text':
        element.textContent = value as string;
        break;
      case 'callback':
        element.onload = value as CallBackType;
        break;
      default:
        element.setAttribute(key, value as string);
        break;
    }
  });

  location.appendChild(element);
  return element;
};
