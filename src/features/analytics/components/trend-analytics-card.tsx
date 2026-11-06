"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { analyticsApi, TrendAnalytics } from "@/lib/api/client";
import { BarChart3, TrendingUp, Layers, Newspaper, Loader2 } from "lucide-react";

export function TrendAnalyticsCard() {
  const [trends, setTrends] = React.useState<TrendAnalytics | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    analyticsApi
      .getTrends()
      .then(setTrends)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="border-border">
        <CardContent className="flex items-center justify-center p-8 text-xs text-muted-foreground gap-2">
          <Loader2 className="size-4 animate-spin" />
          <span>Loading intelligence analytics...</span>
        </CardContent>
      </Card>
    );
  }

  if (!trends) return null;

  const maxDailyCount = Math.max(...trends.articlesPerDay.map((d) => d.count), 1);

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="size-4 text-primary" />
              <span>Ingestion Trend & Topic Analytics</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Daily volume and topic distribution over the past 7 days ({trends.totalIngestedPastWeek} stories ingested).
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-md border border-border/50">
            <TrendingUp className="size-3.5 text-emerald-500" />
            <span className="font-medium text-foreground">{trends.totalIngestedPastWeek}</span>
            <span>in 7d</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-1">
        {/* Daily Ingestion Bar Chart */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-foreground">Articles Ingested per Day</span>
          <div className="flex items-end justify-between gap-2 h-28 pt-4 px-2 border-b border-border/60">
            {trends.articlesPerDay.map((day) => {
              const heightPct = Math.max(Math.round((day.count / maxDailyCount) * 100), 6);
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[10px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    {day.count}
                  </span>
                  <div
                    className="w-full max-w-[36px] rounded-t-sm bg-primary/80 hover:bg-primary transition-all duration-300"
                    style={{ height: `${heightPct}%` }}
                    title={`${day.label}: ${day.count} articles`}
                  />
                  <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[40px]">
                    {day.label.split(",")[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Breakdown Split: Top Sources & Topics */}
        <div className="grid gap-4 sm:grid-cols-2 text-xs pt-1">
          {/* Top Sources */}
          <div className="space-y-2.5 rounded-lg border border-border/60 bg-muted/10 p-3">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Newspaper className="size-3.5 text-muted-foreground" />
              <span>Top Active Sources</span>
            </div>
            {trends.topSources.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic">No articles recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {trends.topSources.map((source) => {
                  const maxSrc = trends.topSources[0]?.count || 1;
                  const pct = Math.round((source.count / maxSrc) * 100);
                  return (
                    <div key={source.name} className="space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-medium text-foreground truncate max-w-[180px]">{source.name}</span>
                        <span className="text-muted-foreground font-mono">{source.count} articles</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-primary/70 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Topic Distribution */}
          <div className="space-y-2.5 rounded-lg border border-border/60 bg-muted/10 p-3">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Layers className="size-3.5 text-muted-foreground" />
              <span>Topic Keyword Activity</span>
            </div>
            {trends.topicDistribution.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic">No monitored topics defined.</p>
            ) : (
              <div className="space-y-2">
                {trends.topicDistribution.map((topic) => (
                  <div key={topic.name} className="flex justify-between items-center text-[11px] pb-1.5 border-b border-border/40 last:border-0 last:pb-0">
                    <span className="font-medium text-foreground truncate max-w-[180px]">{topic.name}</span>
                    <span className="font-mono text-muted-foreground bg-muted/40 px-2 py-0.5 rounded text-[10px]">
                      {topic.count} matches
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
