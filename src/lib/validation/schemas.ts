import { z } from "zod";

export const sourceFormSchema = z.object({
  name: z.string().trim().min(2, "Source name must be at least 2 characters").max(60),
  feedUrl: z
    .string()
    .trim()
    .url("Please enter a valid URL (e.g. https://example.com/rss.xml)")
    .refine(
      (url) => url.startsWith("http://") || url.startsWith("https://"),
      "Feed URL must use HTTP or HTTPS protocol"
    ),
  siteUrl: z.string().trim().url("Please enter a valid website URL").optional().or(z.literal("")),
  description: z.string().trim().max(200).optional(),
  fetchIntervalMinutes: z.coerce.number().int().min(15).max(1440).default(60),
});

export type SourceFormValues = z.infer<typeof sourceFormSchema>;

export const sourceUpdateSchema = z.object({
  name: z.string().trim().min(2, "Source name must be at least 2 characters").max(60).optional(),
  enabled: z.boolean().optional(),
  description: z.string().trim().max(200).optional(),
  fetchIntervalMinutes: z.coerce.number().int().min(15).max(1440).optional(),
});

export type SourceUpdateValues = z.infer<typeof sourceUpdateSchema>;

export const topicFormSchema = z.object({
  name: z.string().trim().min(2, "Topic name must be at least 2 characters").max(50),
  description: z.string().trim().max(200).optional(),
});

export type TopicFormValues = z.infer<typeof topicFormSchema>;

export const topicUpdateSchema = z.object({
  name: z.string().trim().min(2, "Topic name must be at least 2 characters").max(50).optional(),
  description: z.string().trim().max(200).optional(),
});

export type TopicUpdateValues = z.infer<typeof topicUpdateSchema>;

export const keywordFormSchema = z.object({
  keyword: z.string().trim().min(2, "Keyword must be at least 2 characters").max(50),
  topicId: z.string().trim().optional(),
});

export type KeywordFormValues = z.infer<typeof keywordFormSchema>;

export const keywordUpdateSchema = z.object({
  enabled: z.boolean().optional(),
  topicId: z.string().trim().nullable().optional(),
});

export type KeywordUpdateValues = z.infer<typeof keywordUpdateSchema>;

export const notificationSettingsSchema = z.object({
  emailNotificationsEnabled: z.boolean(),
  notificationEmail: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
});

export type NotificationSettingsValues = z.infer<typeof notificationSettingsSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: z.string().trim().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().trim().max(100).optional(),
});

export const saveArticleSchema = z.object({
  articleId: z.string().trim().min(1, "articleId is required"),
});
