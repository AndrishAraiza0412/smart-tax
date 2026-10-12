import { useEffect, useState } from "react";

import { getUsdPerMxn, usePrefs, type Currency } from "./preferences";

/** Formatea un monto guardado en MXN según la moneda elegida (los inputs siempre capturan MXN). */
export function useMoney(): { format: (mxn: number) => string; currency: Currency } {
  const { currency } = usePrefs();
  const [usdPerMxn, setUsdPerMxn] = useState(0.057);
  useEffect(() => {
    if (currency === "USD") void getUsdPerMxn().then(setUsdPerMxn);
  }, [currency]);
  return {
    currency,
    format: (mxn: number) =>
      currency === "USD"
        ? `$${(mxn * usdPerMxn).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
        : `$${mxn.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  };
}
