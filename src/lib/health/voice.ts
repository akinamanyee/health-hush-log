// Voice dictation returns Chinese speech, which may contain Chinese numerals
// (「一百五十二」) rather than Arabic digits. Parse both, on-device only.

const CN_DIGITS: Record<string, number> = {
  零: 0, 〇: 0, 一: 1, 壹: 1, 二: 2, 兩: 2, 貳: 2, 三: 3, 參: 3,
  四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9,
};

const CN_CHARS = "零〇一壹二兩貳三參四五六七八九十拾百佰千仟點負";

function cnInteger(s: string): number {
  let section = 0;
  let num = 0;
  for (const ch of s) {
    const d = CN_DIGITS[ch];
    if (d != null) {
      num = d;
    } else if (ch === "十" || ch === "拾") {
      section += (num || 1) * 10;
      num = 0;
    } else if (ch === "百" || ch === "佰") {
      section += (num || 1) * 100;
      num = 0;
    } else if (ch === "千" || ch === "仟") {
      section += (num || 1) * 1000;
      num = 0;
    }
  }
  return section + num;
}

function cnToNumber(raw: string): number | null {
  let s = raw;
  let sign = 1;
  if (s.startsWith("負")) {
    sign = -1;
    s = s.slice(1);
  }
  const [intPart = "", fracPart = ""] = s.split("點");
  if (!intPart && !fracPart) return null;
  const whole = intPart ? cnInteger(intPart) : 0;
  const frac = [...fracPart].map((ch) => CN_DIGITS[ch]).filter((n) => n != null).join("");
  const value = parseFloat(`${whole}${frac ? `.${frac}` : ""}`);
  return Number.isNaN(value) ? null : sign * value;
}

/** Extract every number spoken in a transcript, Arabic or Chinese, in order. */
export function parseSpokenNumbers(transcript: string): number[] {
  const normalized = transcript
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[．。]/g, ".")
    .replace(/[,，]/g, " ");

  const out: number[] = [];
  const token = new RegExp(`-?\\d+(?:\\.\\d+)?|[${CN_CHARS}]+`, "g");
  for (const match of normalized.match(token) ?? []) {
    if (/\d/.test(match)) {
      const n = parseFloat(match);
      if (!Number.isNaN(n)) out.push(n);
    } else {
      const n = cnToNumber(match);
      if (n != null) out.push(n);
    }
  }
  return out;
}
