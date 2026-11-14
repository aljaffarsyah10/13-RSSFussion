import { createServerSupabaseClient } from "@/lib/supabase/server";
import { OnboardingState } from "@/types/models";
import { createSource } from "./source.service";
import { createTopic } from "./topic.service";
import { createKeyword } from "./keyword.service";

export const SUGGESTED_PRESETS = [
  {
    id: "ai-agents",
    name: "AI & Agents",
    description: "Frontier LLMs, autonomous agents, neural architectures & AI development.",
    defaultKeywords: ["AI", "LLM", "Agent", "OpenAI"],
    suggestedFeeds: [
      { name: "Hacker News", url: "https://news.ycombinator.com/rss", siteUrl: "https://news.ycombinator.com" },
      { name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/", siteUrl: "https://techcrunch.com" },
    ],
  },
  {
    id: "tech-engineering",
    name: "Engineering & Dev",
    description: "Software engineering, cloud infrastructure, TypeScript, and open source.",
    defaultKeywords: ["TypeScript", "Next.js", "PostgreSQL", "Cloud"],
    suggestedFeeds: [
      { name: "GitHub Blog", url: "https://github.blog/feed/", siteUrl: "https://github.blog" },
      { name: "The Verge Tech", url: "https://www.theverge.com/rss/index.xml", siteUrl: "https://www.theverge.com" },
    ],
  },
  {
    id: "startups-vc",
    name: "Startups & VC",
    description: "Startup funding rounds, venture capital, SaaS metrics, and founder essays.",
    defaultKeywords: ["SaaS", "Seed", "Venture", "Valuation"],
    suggestedFeeds: [
      { name: "TechCrunch Startups", url: "https://techcrunch.com/category/startups/feed/", siteUrl: "https://techcrunch.com" },
    ],
  },
];

export async function getOnboardingState(userId: string): Promise<OnboardingState> {
  const supabase = await createServerSupabaseClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", userId)
    .single();

  return {
    completed: Boolean(profile?.onboarding_completed),
    suggestedTopics: SUGGESTED_PRESETS,
  };
}

export async function completeOnboarding(
  userId: string,
  payload: {
    selectedPresetId?: string;
    customTopicName?: string;
    customKeyword?: string;
    selectedFeedUrls?: string[];
  }
): Promise<{ success: boolean }> {
  const supabase = await createServerSupabaseClient();

  // 1. If a preset was selected, create topic and keyword
  let createdTopicId: string | undefined;

  const preset = SUGGESTED_PRESETS.find((p) => p.id === payload.selectedPresetId);
  const topicName = payload.customTopicName?.trim() || preset?.name;

  if (topicName) {
    try {
      const topic = await createTopic(userId, {
        name: topicName,
        description: preset?.description || "Monitored topic created during onboarding",
      });
      createdTopicId = topic.id;
    } catch {
      // ignore if topic already exists
    }
  }

  // 2. Add keyword
  const keywordText = payload.customKeyword?.trim() || preset?.defaultKeywords[0];
  if (keywordText) {
    try {
      await createKeyword(userId, {
        keyword: keywordText,
        topicId: createdTopicId,
      });
    } catch {
      // ignore if keyword already exists
    }
  }

  // 3. Add selected feeds
  const feedsToAdd = payload.selectedFeedUrls || (preset ? preset.suggestedFeeds.map((f) => f.url) : []);
  for (const feedUrl of feedsToAdd.slice(0, 3)) {
    try {
      const presetFeed = preset?.suggestedFeeds.find((f) => f.url === feedUrl);
      await createSource(userId, {
        name: presetFeed?.name || "RSS Feed",
        feedUrl,
        siteUrl: presetFeed?.siteUrl || "",
        fetchIntervalMinutes: 60,
      });
    } catch {
      // ignore duplicate or failed feed
    }
  }

  // 4. Mark onboarding completed
  await supabase
    .from("profiles")
    .update({
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  return { success: true };
}
