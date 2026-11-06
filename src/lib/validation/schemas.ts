import { z } from "zod";

export const sourceFormSchema = z.object({
  name: z.string().min(2, "Source name must be at least 2 characters").max(60),
  feedUrl: z
    .string()
    .url("Please enter a valid URL (e.g. https://example.com/rss.xml)")
    .refine(
      (url) => url.startsWith("http://") || url.startsWith("https://"),
      "Feed URL must use HTTP or HTTPS protocol"
    ),
  siteUrl: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  description: z.string().max(200).optional(),
  fetchIntervalMinutes: z.coerce.number().min(15).max(1440).default(60),
});

export type SourceFormValues = z.infer<typeof sourceFormSchema>;

export const topicFormSchema = z.object({
  name: z.string().min(2, "Topic name must be at least 2 characters").max(50),
  description: z.string().max(200).optional(),
});

export type TopicFormValues = z.infer<typeof topicFormSchema>;

export const keywordFormSchema = z.object({
  keyword: z.string().min(2, "Keyword must be at least 2 characters").max(50),
  topicId: z.string().optional(),
});

export type KeywordFormValues = z.infer<typeof keywordFormSchema>;
