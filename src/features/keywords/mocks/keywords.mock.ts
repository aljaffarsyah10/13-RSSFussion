import { Keyword } from "@/types/models";

export const initialMockKeywords: Keyword[] = [
  {
    id: "kw-1",
    userId: "usr-demo",
    topicId: "tpc-1",
    topicName: "Artificial Intelligence",
    keyword: "Agentic AI",
    enabled: true,
    createdAt: "2026-11-01T11:05:00Z",
  },
  {
    id: "kw-2",
    userId: "usr-demo",
    topicId: "tpc-1",
    topicName: "Artificial Intelligence",
    keyword: "Claude 3.7",
    enabled: true,
    createdAt: "2026-11-01T11:06:00Z",
  },
  {
    id: "kw-3",
    userId: "usr-demo",
    topicId: "tpc-2",
    topicName: "Web Infrastructure & Next.js",
    keyword: "Supabase",
    enabled: true,
    createdAt: "2026-11-02T12:10:00Z",
  },
  {
    id: "kw-4",
    userId: "usr-demo",
    topicId: "tpc-2",
    topicName: "Web Infrastructure & Next.js",
    keyword: "Turbopack",
    enabled: true,
    createdAt: "2026-11-02T12:12:00Z",
  },
  {
    id: "kw-5",
    userId: "usr-demo",
    topicId: "tpc-3",
    topicName: "Venture Capital & Funding",
    keyword: "Series A",
    enabled: true,
    createdAt: "2026-11-03T16:05:00Z",
  },
];
