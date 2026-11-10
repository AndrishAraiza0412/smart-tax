import { useEffect, useState } from "react";
import { Alert, Modal, ScrollView, Text, View } from "react-native";
import { GastoSchema } from "@smarttax/shared";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { PressableComponent } from "./ui/pressable";
import { Icon } from "./ui/icon";
import { deleteGasto, updateGasto, type Gasto } from "../hooks/useGastos";

/** Hoja para editar o borrar un gasto; `onDone` recarga la lista. */
export function ExpenseEditModal({ gasto, onClose, onDone }: { gasto: Gasto | null; onClose: () => void; onDone: () => void }): React.JSX.Element {
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");
  const [monto, setMonto] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!gasto) return;
    setDescripcion(gasto.descripcion);
    setFecha(gasto.fecha);
    setMonto(String(gasto.monto));
  }, [gasto]);

  const run = async (fn: () => Promise<void>): Promise<void> => {
    setBusy(true);
    try {
      await fn();
      onDone();
      onClose();
    } catch (e) {
      Alert.alert("No se pudo completar", e instanceof Error ? e.message : "Intenta de nuevo");
    } finally {
      setBusy(false);
    }
  };

  const save = (): void => {
    if (!gasto) return;
    const parsed = GastoSchema.safeParse({ descripcion, fecha, monto: Number(monto), categoria: "Otros", facturable: true });
    if (!parsed.success) {
      Alert.alert("Revisa el gasto", parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    void run(() => updateGasto(gasto.id, { descripcion: parsed.data.descripcion, fecha: parsed.data.fecha, monto: parsed.data.monto }));
  };

  const remove = (): void => {
    if (!gasto) return;
    Alert.alert("Eliminar gasto", `¿Eliminar "${gasto.descripcion}"? No se puede deshacer.`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => void run(() => deleteGasto(gasto.id)) },
    ]);
  };

  return (
    <Modal visible={gasto !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ScrollView className="flex-1 bg-canvas dark:bg-night" contentContainerClassName="p-5 pb-10" keyboardShouldPersistTaps="handled">
        <View className="flex-row items-center justify-between">
          <Text className="flex-1 font-sans text-[22px] font-bold text-ink dark:text-white">Editar gasto</Text>
          <PressableComponent variant="scale" haptic="light" onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar" className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10">
            <Icon name="x" size={18} color="inverse" />
          </PressableComponent>
        </View>
        <View className="mt-4">
          <Label>Descripción</Label>
          <Input containerClassName="mt-1.5" value={descripcion} onChangeText={setDescripcion} />
        </View>
        <View className="mt-3">
          <Label>Fecha (AAAA-MM-DD)</Label>
          <Input containerClassName="mt-1.5" keyboardType="number-pad" value={fecha} onChangeText={(v) => setFecha(v.replace(/\D/g, "").slice(0, 8).replace(/^(\d{4})(\d)/, "$1-$2").replace(/^(\d{4}-\d{2})(\d)/, "$1-$2"))} />
        </View>
        <View className="mt-3">
          <Label>Monto</Label>
          <Input containerClassName="mt-1.5" keyboardType="decimal-pad" className="tabular-nums" value={monto} onChangeText={(v) => setMonto(v.replace(",", ".").replace(/[^\d.]/g, "").replace(/^(\d*\.\d*).*$/, "$1"))} />
        </View>
        <Button size="lg" fullWidth className="mt-5" isLoading={busy} disabled={busy} onPress={save}>Guardar cambios</Button>
        <Button variant="outline" size="lg" fullWidth className="mt-3" disabled={busy} onPress={remove}>Eliminar gasto</Button>
      </ScrollView>
    </Modal>
  );
}
