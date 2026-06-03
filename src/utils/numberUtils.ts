/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num
    .toString()
    .replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)])
    .replace(/\./g, '٫'); // Persian decimal marker
}

export function toEnglishDigits(str: string): string {
  const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
  const arabicDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
  let res = str.replace(/٫/g, '.'); // Replace Persian decimal separator with English dot
  for (let i = 0; i < 10; i++) {
    res = res.replace(persianDigits[i], i.toString()).replace(arabicDigits[i], i.toString());
  }
  return res;
}

export function formatRial(value: number): string {
  const rounded = Math.round(value);
  const formattedString = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${toPersianDigits(formattedString)} ریال`;
}

export function formatDecimal(value: number, decimals: number = 2): string {
  // Precise formatting to a maximum of `decimals` decimal places, preserving non-zeros
  const formatted = Number(value.toFixed(decimals)).toString();
  return toPersianDigits(formatted);
}

export const formatToFarsi = (num: number | string | null | undefined): string => {
  if (num === null || num === undefined) return "-";
  const parsed = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(parsed)) return "-";
  
  // 1. Convert to Farsi format (this usually inserts '٬' automatically in modern browsers)
  let persianStr = Number(parsed).toLocaleString('fa-IR');
  
  // 2. Force replace any Arabic separators '٬' or spaces with the standard bottom comma ','
  persianStr = persianStr.replace(/٬/g, ',').replace(/\s/g, ',');
  
  // 3. Wrap the result in LRE (\u202A) and PDF (\u202C) to make it bulletproof in MS Word
  return '\u202A' + persianStr + '\u202C';
};

