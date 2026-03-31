import { z } from "zod";

const phoneRegex = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/;

const consentField = z.boolean().refine((val) => val === true, {
  message: "Необходимо согласие на обработку данных",
});

export const buyFormSchema = z.object({
  name: z.string().min(2, "Введите имя"),
  phone: z.string().min(1, "Введите телефон").regex(phoneRegex, "Введите телефон полностью"),
  email: z.string().email("Некорректный email").optional().or(z.literal("")),
  message: z.string().optional(),
  product: z.string().optional(),
  consent: consentField,
  honeypot: z.string().max(0).optional(),
});

export const dealerFormSchema = z.object({
  name: z.string().min(2, "Введите имя"),
  phone: z.string().min(1, "Введите телефон").regex(phoneRegex, "Введите телефон полностью"),
  email: z.string().email("Некорректный email").optional().or(z.literal("")),
  company: z.string().optional(),
  message: z.string().optional(),
  consent: consentField,
  honeypot: z.string().max(0).optional(),
});

export const contactFormSchema = z.object({
  name: z.string().min(2, "Введите имя"),
  phone: z.string().min(1, "Введите телефон").regex(phoneRegex, "Введите телефон полностью"),
  email: z.string().email("Некорректный email").optional().or(z.literal("")),
  message: z.string().optional(),
  consent: consentField,
  honeypot: z.string().max(0).optional(),
});

export const callbackFormSchema = z.object({
  name: z.string().min(2, "Введите имя"),
  phone: z.string().min(1, "Введите телефон").regex(phoneRegex, "Введите телефон полностью"),
  message: z.string().optional(),
  consent: consentField,
  honeypot: z.string().max(0).optional(),
});

export const reviewFormSchema = z.object({
  author: z.string().min(2, "Введите имя"),
  text: z.string().min(10, "Минимум 10 символов"),
  rating: z.number().min(1).max(5).optional(),
  consent: consentField,
  honeypot: z.string().max(0).optional(),
});

export const DEALER_ATTACHMENT_MAX_SIZE = 10 * 1024 * 1024; // 10 MB
export const DEALER_ATTACHMENT_ACCEPTED_TYPES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/pdf",
];
export const DEALER_ATTACHMENT_ACCEPT = ".docx,.doc,.pdf";

export type BuyFormData = z.infer<typeof buyFormSchema>;
export type DealerFormData = z.infer<typeof dealerFormSchema>;
export type ContactFormData = z.infer<typeof contactFormSchema>;
export type CallbackFormData = z.infer<typeof callbackFormSchema>;
export type ReviewFormData = z.infer<typeof reviewFormSchema>;
