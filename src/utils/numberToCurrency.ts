export const numberToCurrency = (number: number): string => {
  interface Options {
    style: string;
    currency: string;
    maximumSignificantDigits?: number;
  }

  const options: Options = {
    style: 'currency',
    currency: 'GBP',
  };

  let showPennies = false;
  if (!Number.isInteger(number)) {
    showPennies = true;
  }

  if (!showPennies) options.maximumSignificantDigits = 21;

  const regexPattern = /£/g;
  return new Intl.NumberFormat('gb-GB', options).format(number).replace(regexPattern, '');
};
