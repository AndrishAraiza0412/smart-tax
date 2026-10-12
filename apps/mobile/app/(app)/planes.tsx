import { useState } from "react";
import { Alert, Modal, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { ScreenHeader } from "../../components/screen-header";
import { CardForm } from "../../components/card-form";
import { Icon } from "../../components/ui/icon";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { PressableComponent } from "../../components/ui/pressable";
import { usePlan } from "../../hooks/usePlan";
import { useCards } from "../../hooks/useCards";
import { fill, useStrings } from "../../lib/strings";
import type { Plan as PlanId } from "../../lib/plan";

/** Planes de suscripción guardados en `profiles.plan`, con checkout simulado usando tarjetas de prueba. */
type Plan = { id: PlanId; name: string; price: string; period: string; features: string[]; highlight: boolean };

export default function Planes(): React.JSX.Element {
  const router = useRouter();
  const t = useStrings();
  const { plan: current, setPlan } = usePlan();
  const { cards, add } = useCards();
  const [checkout, setCheckout] = useState<Plan | null>(null);
  const [cardId, setCardId] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const PLANS: Plan[] = [
    { id: "gratis", name: t.planes.free, price: "$0", period: t.planes.forever, features: [...t.planes.fFree], highlight: false },
    { id: "pro", name: t.planes.pro, price: "$149", period: t.planes.perMonth, features: [...t.planes.fPro], highlight: true },
    { id: "negocios", name: t.planes.biz, price: "$399", period: t.planes.perMonth, features: [...t.planes.fBiz], highlight: false },
  ];

  const choose = (plan: Plan): void => {
    if (plan.id === current) return;
    if (plan.id === "gratis") {
      Alert.alert(t.planes.downgradeT, t.planes.downgradeM, [
        { text: t.planes.cancelBtn, style: "cancel" },
        { text: t.planes.confirmBtn, style: "destructive", onPress: () => void confirm(plan) },
      ]);
      return;
    }
    setCardId(cards[0]?.id ?? null);
    setCheckout(plan);
  };

  const confirm = async (plan: Plan): Promise<void> => {
    setPaying(true);
    try {
      await setPlan(plan.id);
      setCheckout(null);
      Alert.alert(t.planes.doneT, fill(t.planes.doneM, { name: plan.name }));
    } catch (e) {
      Alert.alert(t.planes.doneT, e instanceof Error ? e.message : "Intenta de nuevo");
    } finally {
      setPaying(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-canvas dark:bg-night" contentContainerClassName="pb-8">
      <SafeAreaView edges={["top"]}>
        <ScreenHeader title={t.planes.heroTitle} subtitle={t.planes.heroDesc} onBack={() => router.back()} />

        {PLANS.map((plan) => (
          <Card key={plan.id} elevation={plan.highlight ? "outlined" : "flat"} className="mx-5 mt-4 p-5">
            <View className="flex-row items-center justify-between">
              <Text className="font-sans text-[15px] font-bold text-ink dark:text-white">{plan.name}</Text>
              {current === plan.id ? (
                <Badge variant="success">{t.planes.current}</Badge>
              ) : plan.highlight ? (
                <Badge variant="primary">{t.planes.recommended}</Badge>
              ) : null}
            </View>
            <View className="mt-2 flex-row items-baseline">
              <Text className="font-sans text-[30px] font-bold tabular-nums text-ink dark:text-white">{plan.price}</Text>
              <Text className="ml-1 font-sans text-sm text-muted dark:text-slate-400">{plan.period}</Text>
            </View>
            <View className="mt-3 gap-2">
              {plan.features.map((f) => (
                <View key={f} className="flex-row items-center">
                  <Icon name="check-circle" size={15} color="secondary" />
                  <Text className="ml-2 flex-1 font-sans text-sm text-muted dark:text-slate-400">{f}</Text>
                </View>
              ))}
            </View>
            <Button
              variant={current === plan.id ? "ghost" : plan.highlight ? "primary" : "outline"}
              size="lg"
              fullWidth
              className="mt-4"
              disabled={current === plan.id}
              onPress={() => choose(plan)}
            >
              {current === plan.id ? t.planes.currentPlan : t.planes.choose}
            </Button>
          </Card>
        ))}
      </SafeAreaView>

      <Modal visible={checkout !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setCheckout(null)}>
        <ScrollView className="flex-1 bg-canvas dark:bg-night" contentContainerClassName="p-5 pb-10" keyboardShouldPersistTaps="handled">
          <View className="flex-row items-center justify-between">
            <Text className="flex-1 font-sans text-[22px] font-bold text-ink dark:text-white">{fill(t.planes.checkoutT, { name: checkout?.name ?? "" })}</Text>
            <PressableComponent variant="scale" haptic="light" onPress={() => setCheckout(null)} accessibilityRole="button" accessibilityLabel={t.planes.close} className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10">
              <Icon name="x" size={18} color="inverse" />
            </PressableComponent>
          </View>
          <Text className="mt-1 font-sans text-[13px] text-muted dark:text-slate-400">
            {fill(t.planes.checkoutDesc, { price: checkout?.price ?? "", period: checkout?.period ?? "" })}
          </Text>

          {cards.length > 0 && (
            <>
              <Text className="mb-2 mt-6 font-sans text-label-caps uppercase tracking-[0.06em] text-muted dark:text-slate-400">{t.planes.payWith}</Text>
              {cards.map((c) => {
                const selected = c.id === cardId;
                return (
                  <PressableComponent
                    key={c.id}
                    variant="scale"
                    haptic="selection"
                    onPress={() => setCardId(c.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    className={`mb-2 flex-row items-center rounded-2xl border-2 bg-surface p-4 dark:bg-nightcard ${selected ? "border-primary dark:border-cobalt" : "border-border dark:border-stroke"}`}
                  >
                    <Icon name="credit-card" size={20} color="primary" />
                    <Text className="ml-3 flex-1 font-sans text-[15px] font-semibold tabular-nums text-ink dark:text-white">{c.brand} •••• {c.last4}</Text>
                    {selected && <Icon name="check-circle" size={20} color="primary" />}
                  </PressableComponent>
                );
              })}
              <Button size="lg" fullWidth className="mt-3" disabled={!cardId || paying} isLoading={paying} onPress={() => checkout && void confirm(checkout)}>
                {t.planes.payBtn}
              </Button>
            </>
          )}

          <Text className="mb-2 mt-6 font-sans text-label-caps uppercase tracking-[0.06em] text-muted dark:text-slate-400">{t.planes.addCard}</Text>
          <Card elevation="flat" className="p-4">
            <CardForm
              submitLabel={cards.length > 0 ? t.planes.addCard : t.planes.payBtn}
              onSubmit={async (input) => {
                const first = cards.length === 0;
                const card = await add(input);
                setCardId(card.id);
                if (first && checkout) await confirm(checkout);
              }}
            />
          </Card>
        </ScrollView>
      </Modal>
    </ScrollView>
  );
}
