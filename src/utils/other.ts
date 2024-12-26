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