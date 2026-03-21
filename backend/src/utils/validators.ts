export const supportedDomains = ['youtube.com', 'youtu.be', 'drive.google.com', 'dropbox.com'];

export function isValidVideoLink(url: string): boolean {
  return supportedDomains.some(domain => url.includes(domain));
}
