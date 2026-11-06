export function matchKeywordsInText(
  text: string,
  keywords: Array<{ id: string; keyword: string }>
): string[] {
  if (!text || keywords.length === 0) return [];

  const normalizedText = text.normalize("NFKC").toLowerCase();
  const matchedIds: string[] = [];

  for (const { id, keyword } of keywords) {
    if (!keyword.trim()) continue;
    const cleanKeyword = keyword.trim().normalize("NFKC").toLowerCase();

    // Escape regex special characters
    const escaped = cleanKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    try {
      // Exact word boundary matching for unicode characters
      const regex = new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, "u");
      if (regex.test(normalizedText)) {
        matchedIds.push(id);
      }
    } catch {
      // Fallback to substring match if regex engine fails on special characters
      if (normalizedText.includes(cleanKeyword)) {
        matchedIds.push(id);
      }
    }
  }

  return Array.from(new Set(matchedIds));
}
