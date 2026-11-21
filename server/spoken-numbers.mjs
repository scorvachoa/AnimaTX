// Verbalization is only used by the acoustic aligner; visible script stays intact.
const small = {
  es: [
    "cero",
    "uno",
    "dos",
    "tres",
    "cuatro",
    "cinco",
    "seis",
    "siete",
    "ocho",
    "nueve",
    "diez",
    "once",
    "doce",
    "trece",
    "catorce",
    "quince",
    "dieciseis",
    "diecisiete",
    "dieciocho",
    "diecinueve",
    "veinte",
    "veintiuno",
    "veintidos",
    "veintitres",
    "veinticuatro",
    "veinticinco",
    "veintiseis",
    "veintisiete",
    "veintiocho",
    "veintinueve",
  ],
  en: [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
  ],
  pt: [
    "zero",
    "um",
    "dois",
    "tres",
    "quatro",
    "cinco",
    "seis",
    "sete",
    "oito",
    "nove",
    "dez",
    "onze",
    "doze",
    "treze",
    "catorze",
    "quinze",
    "dezesseis",
    "dezessete",
    "dezoito",
    "dezenove",
  ],
};
const tens = {
  es: [
    "",
    "",
    "veinte",
    "treinta",
    "cuarenta",
    "cincuenta",
    "sesenta",
    "setenta",
    "ochenta",
    "noventa",
  ],
  en: [
    "",
    "",
    "twenty",
    "thirty",
    "forty",
    "fifty",
    "sixty",
    "seventy",
    "eighty",
    "ninety",
  ],
  pt: [
    "",
    "",
    "vinte",
    "trinta",
    "quarenta",
    "cinquenta",
    "sessenta",
    "setenta",
    "oitenta",
    "noventa",
  ],
};
function integer(value, language) {
  const n = Number(value),
    l = language;
  if (value.length > 12 || !Number.isSafeInteger(n) || /^0\d/.test(value))
    return [...value].map((d) => small[l][+d]).join(" ");
  if (n < small[l].length) return small[l][n];
  if (n < 100)
    return (
      tens[l][Math.floor(n / 10)] +
      (n % 10
        ? (l === "en" ? " " : l === "es" ? " y " : " e ") +
          integer(String(n % 10), l)
        : "")
    );
  if (n < 1000) {
    const remainder = n % 100,
      h = Math.floor(n / 100);
    if (l === "en")
      return (
        small.en[h] +
        " hundred" +
        (remainder ? " " + integer(String(remainder), l) : "")
      );
    if (n === 100) return l === "es" ? "cien" : "cem";
    const hundreds =
      l === "es"
        ? [
            "",
            "ciento",
            "doscientos",
            "trescientos",
            "cuatrocientos",
            "quinientos",
            "seiscientos",
            "setecientos",
            "ochocientos",
            "novecientos",
          ]
        : [
            "",
            "cento",
            "duzentos",
            "trezentos",
            "quatrocentos",
            "quinhentos",
            "seiscentos",
            "setecentos",
            "oitocentos",
            "novecentos",
          ];
    return (
      hundreds[h] +
      (remainder
        ? (l === "pt" ? " e " : " ") + integer(String(remainder), l)
        : "")
    );
  }
  const scale = n < 1e6 ? 1000 : l === "en" && n >= 1e9 ? 1e9 : 1e6,
    count = Math.floor(n / scale),
    remainder = n % scale;
  let label;
  if (scale === 1000)
    label =
      l === "en"
        ? integer(String(count), l) + " thousand"
        : (count === 1
            ? ""
            : (l === "es"
                ? integer(String(count), l).replace(/uno$/, "un")
                : integer(String(count), l)) + " ") + "mil";
  else if (l === "en")
    label =
      integer(String(count), l) + (scale === 1e9 ? " billion" : " million");
  else
    label =
      count === 1
        ? l === "es"
          ? "un millon"
          : "um milhao"
        : (l === "es"
            ? integer(String(count), l).replace(/uno$/, "un")
            : integer(String(count), l)) +
          (l === "es" ? " millones" : " milhoes");
  return (
    label +
    (remainder
      ? (l === "pt" && remainder < 100 ? " e " : " ") +
        integer(String(remainder), l)
      : "")
  );
}
export function spokenNumber(value, language = "es") {
  const l = language.startsWith("en")
    ? "en"
    : language.startsWith("pt")
      ? "pt"
      : "es";
  let raw = value;
  // A group of three digits after every separator is interpreted as thousands.
  if (/^\d{1,3}(?:[.,]\d{3})+$/.test(raw)) raw = raw.replace(/[.,]/g, "");
  else if (raw.includes(",") && raw.includes(".")) {
    const decimal = raw.lastIndexOf(",") > raw.lastIndexOf(".") ? "," : ".";
    raw = raw.replace(decimal === "," ? /\./g : /,/g, "").replace(",", ".");
  } else raw = raw.replace(",", ".");
  if (!/^\d+(?:\.\d+)?$/.test(raw))
    throw Error(`Número no reconocido: ${value}`);
  const [whole, fraction] = raw.split(".");
  return (
    integer(whole, l) +
    (fraction
      ? (l === "en" ? " point " : l === "pt" ? " virgula " : " coma ") +
        [...fraction].map((d) => small[l][+d]).join(" ")
      : "")
  );
}
export function spokenScriptToken(token, language = "es") {
  const l = language.startsWith("en")
    ? "en"
    : language.startsWith("pt")
      ? "pt"
      : "es";
  const percentages = {
    es: " por ciento ",
    en: " percent ",
    pt: " por cento ",
  };
  const currencies =
    l === "en"
      ? { USD: " dollars", EUR: " euros", PEN: " soles" }
      : { USD: " dolares", EUR: " euros", PEN: " soles" };
  let text = token,
    suffix = "";
  const money = /^(S\/|US\$|\$|€|USD|EUR|PEN)([-+]?\d[\d.,]*)([.!?;:]*)$/i.exec(
    text,
  );
  if (money) {
    text = money[2] + money[3];
    suffix =
      currencies[
        /^(S\/|PEN)$/i.test(money[1])
          ? "PEN"
          : /^(€|EUR)$/i.test(money[1])
            ? "EUR"
            : "USD"
      ];
  }
  text = text.replace(
    /(\d)-(\d)/g,
    `$1 ${l === "es" ? "a" : l === "pt" ? "a" : "to"} $2`,
  );
  text = text.replace(
    /(?<!\d)(\d{1,2}):(\d{2})(?!\d)/g,
    (_, h, m) =>
      integer(String(+h), l) +
      (Number(m)
        ? (l === "es" ? " y " : l === "pt" ? " e " : " ") +
          integer(String(+m), l)
        : ""),
  );
  text = text.replace(
    /-(?=\d)/g,
    l === "es" ? " menos " : l === "pt" ? " menos " : " minus ",
  );
  text = text.replace(/\d+(?:[.,]\d+)*/g, (value) => spokenNumber(value, l));
  if (suffix && l === "es") text = text.replace(/uno([.!?;:]*)$/, "un$1");
  if (money && /^0*1$/.test(money[2])) suffix = suffix.replace(/s$/, "");
  return text.replace(/%/g, percentages[l]) + suffix;
}
