export default ({ env }) => ({
  "users-permissions": {
    config: {
      jwtSecret: env("JWT_SECRET"),
    },
  },
  email: {
    config: {
      provider: "@strapi/provider-email-nodemailer",
      providerOptions: {
        host: env("SMTP_HOST", ""),
        port: env.int("SMTP_PORT", 587),
        secure: env.bool("SMTP_SECURE", false),
        auth: {
          user: env("SMTP_USER", ""),
          pass: env("SMTP_PASS", ""),
        },
      },
      settings: {
        defaultFrom: env("SMTP_FROM", "noreply@novtecas.ru"),
        defaultReplyTo: env("SMTP_REPLY_TO", "asfalt@novtecas.ru"),
      },
    },
  },
});
