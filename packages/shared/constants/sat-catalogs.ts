/** Catálogos SAT para CFDI 4.0: regímenes, usos, métodos/forma de pago y tipos de relación. */
export const regimenesFiscales = [
  "601", "603", "605", "606", "607", "608", "609", "610",
  "611", "612", "614", "616", "620", "621", "622", "626",
] as const;

export const usosCFDI = [
  "G01", "G02", "G03", "I01", "I02", "I03", "I04", "I05",
  "I06", "I07", "I08", "D01", "D02", "D03",
] as const;

export const metodosPago = ["PUE", "PPD"] as const;

export const formasPago = [
  "01", "02", "03", "04", "05", "06", "08", "12", "13", "14",
  "15", "17", "23", "24", "25", "26", "27", "28", "29", "30",
  "31", "99",
] as const;

export const tiposRelacion = [
  "01", "02", "03", "04", "05", "06", "07", "08", "09",
] as const;
