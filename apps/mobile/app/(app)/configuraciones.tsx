import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { useColorScheme } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { regimenesFiscales } from "@smarttax/shared";
import { HeroGradient } from "../../components/hero-gradient";
import { ScreenHeader } from "../../components/screen-header";
import { Select } from "../../components/ui/select";
import { Switch } from "../../components/ui/switch";
import { Icon } from "../../components/ui/icon";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { PressableComponent } from "../../components/ui/pressable";
import { supabase } from "../../lib/supabase";
import { isBelvoConfigured, openLink } from "../../lib/belvo";
import { clearStoredSession } from "../../lib/biometric-session";
import { setCurrency, setLanguage, usePrefs, type Currency, type Language } from "../../lib/preferences";
import { fill, useStrings } from "../../lib/strings";
import { useMoney } from "../../lib/money";
import { deducibilidad, regimenCompatible, regimenesPara, tipoPersona } from "../../lib/fiscal";
import { randomPurchase } from "../../lib/cards";
import { insertGasto } from "../../hooks/useGastos";
import { usePlan } from "../../hooks/usePlan";
import { useCards, type Card as SavedCard } from "../../hooks/useCards";
import { CardForm } from "../../components/card-form";
import { Link, useRouter } from "expo-router";

/**
 * Configuración: perfil fiscal (RFC/régimen desde `profiles`), apariencia,
 * idioma/moneda, planes, conexión Belvo y cierre de sesión.
 */
function ToggleRow({ icon, label, value, onChange }: { icon: string; label: string; value: boolean; onChange: (v: boolean) => void }): React.JSX.Element {
  return (
    <PressableComponent variant="both" haptic="selection" onPress={() => onChange(!value)} accessibilityRole="switch" accessibilityState={{ checked: value }} accessibilityLabel={label} className="flex-row items-center py-3">
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-skyTint dark:bg-white/10">
        <Icon name={icon} size={18} color="primary" />
      </View>
      <Text className="ml-3 flex-1 font-sans text-[15px] text-ink dark:text-white">{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </PressableComponent>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <Card elevation="flat" className="mx-5 mt-4 px-4 py-2">
      <Text className="pb-1 pt-2 text-[11px] font-bold tracking-widest text-muted dark:text-slate-400">{title}</Text>
      {children}
    </Card>
  );
}

export default function Configuraciones(): React.JSX.Element {
  const router = useRouter();
  const [rfc, setRfc] = useState("");
  const [regimen, setRegimen] = useState("");
  const [email, setEmail] = useState("");
  useEffect(() => {
    void (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setEmail(user.email ?? "");
        const { data } = await supabase.from("profiles").select("rfc,regimen_fiscal").eq("id", user.id).single();
        if (data) {
          setRfc((data.rfc as string | null) ?? "");
          setRegimen((data.regimen_fiscal as string | null) ?? "");
        }
      } catch {
        // Sin red: se conservan los valores por defecto
      }
    })();
  }, []);
  const { currency, language } = usePrefs();
  const t = useStrings();
  const { format } = useMoney();
  const { plan, can } = usePlan();
  const { cards, add, remove } = useCards();
  const [showCardForm, setShowCardForm] = useState(false);
  const persona = tipoPersona(rfc);
  const planName = plan === "pro" ? t.planes.pro : plan === "negocios" ? t.planes.biz : t.planes.free;
  const { colorScheme, setColorScheme } = useColorScheme();
  const dark = colorScheme === "dark";
  const applyLanguage = async (v: Language) => {
    await setLanguage(v);
  };
  const pickLanguage = () => {
    Alert.alert(t.cfg.chooseLang, "", [
      { text: t.cfg.spanish, onPress: () => void applyLanguage("es") },
      { text: t.cfg.english, onPress: () => void applyLanguage("en") },
      { text: t.cfg.cancel, style: "cancel" },
    ]);
  };
  const applyCurrency = async (v: Currency) => {
    await setCurrency(v);
  };
  const pickCurrency = () => {
    Alert.alert(t.cfg.chooseCurr, "", [
      { text: "MXN $", onPress: () => void applyCurrency("MXN") },
      { text: "USD $", onPress: () => void applyCurrency("USD") },
      { text: t.cfg.cancel, style: "cancel" },
    ]);
  };
  const save = async () => {
    if (rfc.trim() && !persona) {
      Alert.alert("RFC inválido", "Debe tener 13 caracteres (persona física) o 12 (persona moral).");
      return;
    }
    if (!regimenCompatible(regimen, persona)) {
      Alert.alert("Régimen no compatible", `El régimen ${regimen} no aplica a persona ${persona === "moral" ? "moral" : "física"}.`);
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("profiles").update({ rfc: rfc.trim().toUpperCase() || null, regimen_fiscal: regimen || null }).eq("id", user.id);
      Alert.alert(error ? "No se pudo guardar" : t.cfg.saved, error?.message);
    } catch (error) {
      Alert.alert("No se pudo guardar", error instanceof Error ? error.message : "Intenta de nuevo");
    }
  };
  const simulatePurchase = async (card: SavedCard) => {
    const p = randomPurchase();
    const facturable = deducibilidad(regimen, p.categoria, persona).deducible ?? true;
    try {
      await insertGasto({
        descripcion: p.descripcion,
        monto: p.monto,
        fecha: new Date().toLocaleDateString("en-CA"),
        categoria: p.categoria,
        facturable,
        es_automatico: true,
        forma_pago: "04",
        payment_method_id: card.id,
        cfdi_estado: facturable ? "facturable" : "no_facturable",
      });
      Alert.alert(t.cards.purchaseT, fill(t.cards.purchaseM, { desc: p.descripcion, amount: format(p.monto), brand: card.brand, last4: card.last4 }));
    } catch (e) {
      Alert.alert(t.cards.purchaseT, e instanceof Error ? e.message : "Intenta de nuevo");
    }
  };
  const confirmRemove = (card: SavedCard) => {
    Alert.alert(t.cards.removeT, fill(t.cards.removeM, { brand: card.brand, last4: card.last4 }), [
      { text: t.cfg.cancel, style: "cancel" },
      { text: t.cards.remove, style: "destructive", onPress: () => void remove(card.id).catch((e: unknown) => Alert.alert(t.cards.removeT, e instanceof Error ? e.message : "")) },
    ]);
  };
  const logout = async () => {
    try {
      await clearStoredSession();
      await supabase.auth.signOut();
    } catch (error) {
      Alert.alert(t.cfg.logout, error instanceof Error ? error.message : "Intenta de nuevo");
    }
    router.replace("/(auth)/login");
  };
  const connectBank = async () => {
    if (!isBelvoConfigured()) {
      Alert.alert(t.cfg.bankPendingT, t.cfg.bankPendingM);
      return;
    }
    try {
      await openLink();
    } catch (error) {
      Alert.alert(t.cfg.bankFailT, error instanceof Error ? error.message : "Intenta de nuevo");
    }
  };
  return (
    <ScrollView className="flex-1 bg-canvas dark:bg-night" contentContainerClassName="pb-8">
      <SafeAreaView edges={["top"]}>
        <ScreenHeader title={t.cfg.title} subtitle={t.cfg.subtitle} onBack={() => router.back()} />

        <Card elevation="flat" className="mx-5 mt-4 p-4">
          <View className="flex-row items-center gap-3">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-primary dark:bg-cobalt">
              <Text className="font-sans text-lg font-bold text-white">{email.slice(0, 2).toUpperCase() || "··"}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-sans text-[15px] font-semibold text-ink dark:text-white">{t.cfg.fiscal}</Text>
              <Text className="mt-0.5 font-sans text-xs text-muted dark:text-slate-400">{email || "Cargando…"}</Text>
            </View>
          </View>
        </Card>

        {plan === "gratis" ? (
          <View className="mx-5 mt-4 overflow-hidden rounded-2xl">
            <HeroGradient style={{ padding: 20 }}>
              <Text className="font-sans text-lg font-bold text-white">{t.cfg.proTitle}</Text>
              <Text className="mt-1 font-sans text-[13px] text-white/75">{t.cfg.proDesc}</Text>
              <Link href="/(app)/planes" asChild>
                <PressableComponent variant="both" haptic="light" className="mt-3 items-center justify-center rounded-xl bg-white py-3">
                  <Text className="font-sans text-sm font-bold text-primary">{t.cfg.plans}</Text>
                </PressableComponent>
              </Link>
            </HeroGradient>
          </View>
        ) : (
          <Section title={t.planes.title.toUpperCase()}>
            <Link href="/(app)/planes" asChild>
              <PressableComponent variant="both" haptic="light" className="flex-row items-center py-3">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-skyTint dark:bg-white/10">
                  <Icon name="star" size={18} color="primary" />
                </View>
                <Text className="ml-3 flex-1 font-sans text-[15px] font-semibold text-ink dark:text-white">{planName}</Text>
                <Text className="mr-2 font-sans text-sm text-muted dark:text-slate-400">{t.cards.seePlans}</Text>
                <Icon name="chevron-right" size={18} color="#94A3B8" />
              </PressableComponent>
            </Link>
          </Section>
        )}

        <Section title={t.cfg.profile}>
          <View className="py-2">
            <Label>{t.cfg.rfc}</Label>
            <Input containerClassName="mt-1.5" leftIcon="file-text" value={rfc} onChangeText={setRfc} autoCapitalize="characters" placeholder={t.cfg.rfcPh} />
            <View className="mt-3">
              <Label>{t.cfg.regimen}</Label>
            </View>
            <Select
              options={regimenesPara(persona, regimenesFiscales).map((r) => ({ value: r, label: r }))}
              value={regimen}
              onChange={setRegimen}
              placeholder={t.cfg.regimenPh}
            />
            {persona && (
              <Text className={`mt-1.5 font-sans text-xs ${regimenCompatible(regimen, persona) ? "text-muted dark:text-slate-400" : "text-error"}`}>
                {regimenCompatible(regimen, persona)
                  ? `Persona ${persona === "moral" ? "moral" : "física"}: se muestran solo regímenes compatibles.`
                  : `El régimen ${regimen} no aplica a persona ${persona === "moral" ? "moral" : "física"}.`}
              </Text>
            )}
            <Button size="lg" fullWidth className="mb-2 mt-4" onPress={() => void save()}>
              {t.cfg.save}
            </Button>
          </View>
        </Section>

        <Section title={t.cfg.appearance}>
          <ToggleRow icon="moon" label={t.cfg.dark} value={dark} onChange={(v) => setColorScheme(v ? "dark" : "light")} />
        </Section>

        <Section title={t.cfg.prefs}>
          <PressableComponent variant="both" haptic="light" onPress={() => pickLanguage()} className="flex-row items-center py-3">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-skyTint dark:bg-white/10">
              <Icon name="globe" size={18} color="primary" />
            </View>
            <Text className="ml-3 flex-1 font-sans text-[15px] text-ink dark:text-white">{t.cfg.language}</Text>
            <Text className="mr-2 font-sans text-sm text-muted dark:text-slate-400">{language === "en" ? t.cfg.english : t.cfg.spanish}</Text>
            <Icon name="chevron-right" size={18} color="#94A3B8" />
          </PressableComponent>
          <PressableComponent variant="both" haptic="light" onPress={() => pickCurrency()} className="flex-row items-center py-3">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-skyTint dark:bg-white/10">
              <Icon name="dollar-sign" size={18} color="primary" />
            </View>
            <Text className="ml-3 flex-1 font-sans text-[15px] text-ink dark:text-white">{t.cfg.currency}</Text>
            <Text className="mr-2 font-sans text-sm text-muted dark:text-slate-400">{currency === "USD" ? "USD $" : "MXN $"}</Text>
            <Icon name="chevron-right" size={18} color="#94A3B8" />
          </PressableComponent>
        </Section>

        <Section title={t.cards.title}>
          {!can("cards") ? (
            <View className="items-center py-4">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10">
                <Icon name="lock" size={20} color="muted" />
              </View>
              <Text className="mt-2 text-center font-sans text-sm text-muted dark:text-slate-400">{t.cards.locked}</Text>
              <Link href="/(app)/planes" asChild>
                <PressableComponent variant="both" haptic="light" className="mt-3 items-center justify-center rounded-xl bg-primary px-5 py-3 dark:bg-cobalt">
                  <Text className="font-sans text-sm font-bold text-white">{t.cards.seePlans}</Text>
                </PressableComponent>
              </Link>
            </View>
          ) : (
            <View className="pb-2">
              {cards.length === 0 && <Text className="py-2 font-sans text-sm text-muted dark:text-slate-400">{t.cards.empty}</Text>}
              {cards.map((c) => (
                <View key={c.id} className="flex-row items-center border-b border-border py-3 dark:border-stroke">
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-skyTint dark:bg-white/10">
                    <Icon name="credit-card" size={18} color="primary" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="font-sans text-[15px] font-semibold tabular-nums text-ink dark:text-white">{c.brand} •••• {c.last4}</Text>
                    <Text className="font-sans text-xs tabular-nums text-muted dark:text-slate-400">{t.cards.expires} {String(c.exp_month).padStart(2, "0")}/{String(c.exp_year).slice(-2)}</Text>
                  </View>
                  <PressableComponent variant="scale" haptic="light" onPress={() => void simulatePurchase(c)} className="mr-2 items-center justify-center rounded-full bg-primary px-3 py-2 dark:bg-cobalt">
                    <Text className="font-sans text-xs font-bold text-white">{t.cards.simulate}</Text>
                  </PressableComponent>
                  <PressableComponent variant="scale" haptic="light" onPress={() => confirmRemove(c)} accessibilityRole="button" accessibilityLabel={t.cards.remove} className="h-9 w-9 items-center justify-center rounded-full bg-roseTint dark:bg-[rgba(244,63,94,0.12)]">
                    <Icon name="trash-2" size={16} color="#E11D48" />
                  </PressableComponent>
                </View>
              ))}
              {showCardForm ? (
                <View className="mt-3">
                  <CardForm onSubmit={async (input) => { await add(input); setShowCardForm(false); }} />
                </View>
              ) : (
                <Button variant="outline" leftIcon="plus" fullWidth className="mt-3" onPress={() => setShowCardForm(true)}>
                  {t.cards.add}
                </Button>
              )}
            </View>
          )}
        </Section>

        <Card elevation="flat" className="mx-5 mt-4 p-4">
          <Text className="mb-2 text-[11px] font-bold tracking-widest text-muted dark:text-slate-400">{t.cfg.bank}</Text>
          <Button accessibilityLabel="Conectar banco" size="lg" fullWidth onPress={() => void connectBank()}>
            {t.cfg.connect}
          </Button>
        </Card>

        <PressableComponent variant="both" haptic="medium" onPress={() => void logout()} className="mx-5 mt-4 items-center justify-center rounded-xl border border-error/30 bg-roseTint py-4 dark:border-[rgba(244,63,94,0.3)] dark:bg-[rgba(244,63,94,0.12)]">
          <Text className="font-sans text-[15px] font-semibold text-roseText dark:text-[#FDA4AF]">{t.cfg.logout}</Text>
        </PressableComponent>
        <Text className="mt-4 text-center font-sans text-xs text-faint">{t.cfg.version}</Text>
      </SafeAreaView>
    </ScrollView>
  );
}