import { useState } from "react";
import { Alert, Text, View } from "react-native";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import type { CardInput } from "../lib/cards";

/** Formulario de tarjeta de prueba; `onSubmit` valida y guarda (lanza con mensaje). */
export function CardForm({ onSubmit, submitLabel = "Guardar tarjeta" }: { onSubmit: (input: CardInput) => Promise<unknown>; submitLabel?: string }): React.JSX.Element {
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [holder, setHolder] = useState("");
  const [saving, setSaving] = useState(false);

  // "4242424242424242" -> "4242 4242 4242 4242"; "1229" -> "12/29"
  const formatNumber = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  const submit = async () => {
    setSaving(true);
    try {
      await onSubmit({ number, expiry, holder });
      setNumber(""); setExpiry(""); setHolder("");
    } catch (e) {
      Alert.alert("Tarjeta no válida", e instanceof Error ? e.message : "Intenta de nuevo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View>
      <Label>Número de tarjeta</Label>
      <Input containerClassName="mt-1.5" className="tabular-nums" leftIcon="credit-card" keyboardType="number-pad" placeholder="4242 4242 4242 4242" value={number} onChangeText={(v) => setNumber(formatNumber(v))} />
      <View className="mt-3 flex-row" style={{ gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Label>Vence</Label>
          <Input containerClassName="mt-1.5" className="tabular-nums" keyboardType="number-pad" placeholder="MM/AA" value={expiry} onChangeText={(v) => setExpiry(formatExpiry(v))} />
        </View>
        <View style={{ flex: 1.6 }}>
          <Label>Titular</Label>
          <Input containerClassName="mt-1.5" autoCapitalize="characters" placeholder="NOMBRE APELLIDO" value={holder} onChangeText={setHolder} />
        </View>
      </View>
      <Text className="mt-2 font-sans text-xs text-muted dark:text-slate-400">Solo tarjetas de prueba. Guardamos únicamente la marca y los últimos 4 dígitos.</Text>
      <Button size="lg" fullWidth className="mt-4" isLoading={saving} disabled={saving} onPress={() => void submit()}>
        {submitLabel}
      </Button>
    </View>
  );
}
