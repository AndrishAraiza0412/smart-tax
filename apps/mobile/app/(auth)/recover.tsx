import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Alert, ScrollView, Text, View } from "react-native";
import { Icon } from "../../components/ui/icon";
import { z } from "zod";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card } from "../../components/ui/card";
import { AuthHeader } from "../../components/auth-header";
import { Badge } from "../../components/ui/badge";
import { supabase } from "../../lib/supabase";
import { useStrings } from "../../lib/strings";

/** Recupera la contraseña vía `resetPasswordForEmail` (enlace al correo). */
const RecoverSchema = z.object({ email: z.string().trim().email("Correo inválido") });
type RecoverValues = z.infer<typeof RecoverSchema>;

export default function RecoverScreen(): React.JSX.Element {
  const router = useRouter();
  const { control, handleSubmit, formState: { isSubmitting, isValid } } = useForm<RecoverValues>({
    mode: "onTouched",
    resolver: zodResolver(RecoverSchema),
    defaultValues: { email: "" },
  });
  const t = useStrings();
  const submit = async ({ email }: RecoverValues): Promise<void> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) Alert.alert(t.recover.failT, error.message);
      else Alert.alert(t.recover.sentT, t.recover.sentM);
    } catch (error) {
      Alert.alert(t.recover.failT, error instanceof Error ? error.message : "Intenta de nuevo");
    }
  };
  return (
    <ScrollView className="flex-1 bg-canvas dark:bg-night" contentContainerClassName="pb-8">
      <AuthHeader icon="shield" badge={t.recover.badge} title={t.recover.title} desc={t.recover.desc} onBack={() => router.back()} />

      <Card elevation="elevated" className="mx-5 -mt-3 p-5">
        <Text className="font-sans text-[11px] font-bold tracking-wider text-muted dark:text-slate-400">{t.recover.emailLabel}</Text>
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <Input
              error={fieldState.error?.message}
              valid={fieldState.isTouched && !fieldState.invalid && field.value !== ""}
              onBlur={field.onBlur}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="ejemplo@correo.com"
              leftIcon="at-sign"
              containerClassName="mt-1.5"
              onChangeText={field.onChange}
              value={field.value}
            />
          )}
        />
        <View className="mt-1.5 flex-row items-center">
          <Badge variant="success" size="sm">{t.recover.connected}</Badge>
        </View>

        <Button size="lg" fullWidth className="mt-6" disabled={!isValid || isSubmitting} isLoading={isSubmitting} onPress={() => void handleSubmit(submit)()}>
          {isSubmitting ? t.recover.sending : t.recover.submit}
        </Button>
      </Card>

      <Card elevation="flat" className="mx-5 mt-4 p-4">
        <View className="flex-row items-start gap-3">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-skyTint dark:bg-white/10">
            <Icon name="clock" size={14} color="primary" />
          </View>
          <View className="flex-1">
            <Text className="font-sans text-sm font-semibold text-ink dark:text-white">{t.recover.noCode}</Text>
            <Text className="mt-0.5 font-sans text-xs leading-4 text-muted dark:text-slate-400">{t.recover.noCodeDesc}</Text>
          </View>
        </View>
      </Card>

      <View className="mx-5 mt-4 flex-row items-center justify-center gap-4">
        <View className="flex-row items-center">
          <Icon name="lock" size={12} color="#94A3B8" />
          <Text className="ml-1 font-sans text-[11px] text-faint">Cifrado bancario AES-256</Text>
        </View>
        <Text className="font-sans text-[11px] text-faint">SAT · CFDI 4.0</Text>
      </View>

      <View className="mt-5 flex-row justify-center">
        <Text className="font-sans text-sm text-muted dark:text-slate-400">{t.recover.remember}</Text>
        <Link href="/(auth)/login" asChild>
          <Text accessibilityRole="link" className="font-sans text-sm font-semibold text-primary dark:text-cobalt">{t.recover.login}</Text>
        </Link>
      </View>
    </ScrollView>
  );
}
