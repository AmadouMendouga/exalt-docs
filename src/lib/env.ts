import "server-only";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable d'environnement manquante : ${name}`);
  }
  return value;
}

export const env = {
  get supabaseUrl() {
    return requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  },
  get supabaseServiceRoleKey() {
    return requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  },
  get adminPassword() {
    return requireEnv("ADMIN_PASSWORD");
  },
  get sessionSecret() {
    return requireEnv("SESSION_SECRET");
  },
  get institutWhatsapp() {
    return requireEnv("INSTITUT_WHATSAPP");
  },
  get siteUrl() {
    return requireEnv("NEXT_PUBLIC_SITE_URL");
  },
  get whatsappToken(): string | undefined {
    return process.env.WHATSAPP_TOKEN || undefined;
  },
  get whatsappPhoneNumberId(): string | undefined {
    return process.env.WHATSAPP_PHONE_NUMBER_ID || undefined;
  },
  get whatsappTemplateName(): string | undefined {
    return process.env.WHATSAPP_TEMPLATE_NAME || undefined;
  },
  get whatsappTemplateLang(): string | undefined {
    return process.env.WHATSAPP_TEMPLATE_LANG || undefined;
  },
};
