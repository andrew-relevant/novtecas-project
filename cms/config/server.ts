export default ({ env }) => {
  const config: Record<string, unknown> = {
    host: env("STRAPI_HOST", "0.0.0.0"),
    port: env.int("STRAPI_PORT", 1337),
    app: {
      keys: env.array("APP_KEYS"),
    },
  };

  const publicUrl = env("PUBLIC_URL", "");
  if (publicUrl) {
    config.url = publicUrl;
  }

  return config;
};
