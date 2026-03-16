import { translations } from "@/lib/demo/content";

export interface TranslationProviderState {
  code: string;
  status: string;
  headline: string;
  body: string;
}

export function getTranslation(code: string) {
  return translations.find((translation) => translation.code === code);
}

export function getTranslationProviderState(code: string): TranslationProviderState {
  const translation = getTranslation(code);

  if (!translation) {
    return {
      code,
      status: "unavailable",
      headline: "Tradução não cadastrada",
      body: "Esta rota referencia uma tradução ausente na configuração atual."
    };
  }

  if (translation.activationStatus === "pending_license") {
    return {
      code: translation.code,
      status: translation.activationStatus,
      headline: `${translation.name} pendente de licença`,
      body: "A UI e o adapter já existem, mas o texto completo ainda não foi habilitado por questões de direitos."
    };
  }

  return {
    code: translation.code,
    status: translation.activationStatus,
    headline: `${translation.name} disponível`,
    body: translation.summary
  };
}
