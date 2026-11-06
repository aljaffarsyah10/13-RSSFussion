import { Topic } from "@/types/models";

export const initialMockTopics: Topic[] = [
  {
    id: "tpc-1",
    userId: "usr-demo",
    name: "Artificial Intelligence",
    description: "LLMs, neural networks, agentic computing, and foundational models.",
    keywordsCount: 3,
    articlesCount: 14,
    createdAt: "2026-11-01T11:00:00Z",
  },
  {
    id: "tpc-2",
    userId: "usr-demo",
    name: "Web Infrastructure & Next.js",
    description: "Fullstack frameworks, edge servers, PostgreSQL, and runtime tooling.",
    keywordsCount: 2,
    articlesCount: 8,
    createdAt: "2026-11-02T12:00:00Z",
  },
  {
    id: "tpc-3",
    userId: "usr-demo",
    name: "Venture Capital & Funding",
    description: "Seed rounds, Series A investments, startup acquisitions, and IPOs.",
    keywordsCount: 1,
    articlesCount: 5,
    createdAt: "2026-11-03T16:00:00Z",
  },
];
