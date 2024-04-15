export const numberToCurrency = (number: number): string => {
  interface Options {
    style: string;
    currency: string;
    minimumFractionDigits: number;
    maximumFractionDigits: number;
  }

  const options: Options = {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  };

  const roundedNumber = Math.round(number);

  const regexPattern = /£/;
  return new Intl.NumberFormat('en-GB', options).format(roundedNumber).replace(regexPattern, '');
};
