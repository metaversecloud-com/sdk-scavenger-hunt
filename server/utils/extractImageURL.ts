export const extractImageURL = (url: string) => {
  return `https://${url.split("https%3A//")[1].split("?")[0]}`
}