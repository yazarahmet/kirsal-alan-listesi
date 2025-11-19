/**
 * Normalizes Turkish text for case-insensitive and diacritic-insensitive comparison.
 * Converts standard Turkish characters to their simple Latin equivalents to ensure:
 * I,İ,ı,i -> i
 * U,Ü,u,ü -> u
 * O,Ö,o,ö -> o
 * C,Ç,c,ç -> c
 * G,Ğ,g,ğ -> g
 * S,Ş,s,ş -> s
 */
export const normalizeTurkish = (text: string): string => {
  if (!text) return "";
  
  let normalized = text.toLocaleLowerCase('tr-TR');

  // Manual replacement for strict broad matching as requested
  normalized = normalized
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');

  return normalized;
};
