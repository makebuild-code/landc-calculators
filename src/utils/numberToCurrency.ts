export const numberToCurrency = (number: number): string => {
  interface Options {
    style: 'currency';
    currency: string;
    minimumFractionDigits: number;
    maximumFractionDigits: number;
  }

  const options: Options = {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: number < 100 ? 2 : 0,
  };

  const numberToFormat = number < 100 ? number : Math.round(number);

  const regexPattern = /£/;
  return new Intl.NumberFormat('en-GB', options).format(numberToFormat).replace(regexPattern, '');
};
