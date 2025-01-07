export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function capitalizeWords(str:string) {
  if (!str) return ""; // Handle empty or undefined strings
  return str
    .split(" ") // Split the string into words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
    .join(" "); // Join the words back into a string
}

export const getLastPathSegment = (path:string) => {
  if (!path) return "";
  const lastSlashIndex = path.lastIndexOf("/"); // Find the last "/"
  return path.substring(lastSlashIndex + 1); // Extract everything after the last "/"
};

export function getCookie(name: string) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export const getCurrencyAndRate = (
  exchangeRates: { currency_to: string; rate: number }[],
) => {
  // Currency mapping
  // Get data from localStorage
  const localStorageData = localStorage.getItem("current_currency");

  if (!localStorageData) {
    // If no data found, default to KWD with rate 1
    return {
      currency: "KWD",
      rate: 1,
    };
  }

  // Extract currency symbol from the "subtotal" field
  // const subtotal: string = localStorageData.subtotal;
  // const currencySymbolMatch = subtotal.match(/>([^\d\s]+)\s/); // Match currency symbol before the amount
  // const currencySymbol: string | null = currencySymbolMatch
  //   ? currencySymbolMatch[1]
  //   : null;

  // If currency symbol is null, fallback to default "KWD"
  const currencyCode = localStorageData;

  // Find the corresponding exchange rate
  const exchangeRate = exchangeRates.find(
    (rate) => rate.currency_to === currencyCode,
  );

  const currencyMapping: { [key: string]: string } = {
    BHD: "BHD ",
    AUD: "A$",
    GBP: "£",
    CAD: "CA$",
    CNY: "CN¥",
    EUR: "€",
    USD: "$",
    KWD: "KWD ",
    IQD: "IQD ",
    JPY: "¥",
    OMR: "OMR ",
    QAR: "QAR ",
    RUB: "RUB ",
    SAR: "SAR ",
    AED: "AED ",
  };

  return {
    currency: currencyCode,
    rate: exchangeRate ? exchangeRate.rate : 1, // Default rate is 1 for KWD
    currencySymbol: currencyMapping[currencyCode] || "KWD",
  };
};
