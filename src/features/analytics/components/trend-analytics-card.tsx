"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { analyticsApi, TrendAnalytics } from "@/lib/api/client";
import { BarChart3, TrendingUp, Layers, Newspaper, Loader2, Calendar } from "lucide-react";

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
      <Card className="border border-border/80 bg-card/80">
        <CardContent className="flex items-center justify-center p-8 text-xs text-muted-foreground gap-2">
          <Loader2 className="size-4 animate-spin text-primary" />
          <span>Loading intelligence analytics...</span>
        </CardContent>
      </Card>
    );
  }

  if (!trends) return null;

  const maxDailyCount = Math.max(...trends.articlesPerDay.map((d) => d.count), 1);

  return (
    <Card className="border border-border/80 bg-card/85 shadow-xs">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md border border-border/60 bg-secondary/80 text-foreground">
                <BarChart3 className="size-3.5 text-primary" />
              </div>
              <span>Ingestion Trend & Topic Analytics</span>
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Daily volume and topic distribution over the past 7 days ({trends.totalIngestedPastWeek} stories ingested).
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/80 px-2.5 py-1 rounded-md border border-border/60 w-fit">
            <TrendingUp className="size-3.5 text-emerald-500" />
            <span className="font-semibold text-foreground font-heading">{trends.totalIngestedPastWeek}</span>
            <span>articles in 7d</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-5">
        {/* Daily Ingestion Bar Chart */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Calendar className="size-3 text-muted-foreground" />
              Articles Ingested per Day
            </span>
            <span className="text-[11px] text-muted-foreground">Past 7 Days</span>
          </div>
          <div className="flex items-end justify-between gap-2.5 h-32 pt-6 px-3 border-b border-border/60 bg-muted/15 rounded-lg">
            {trends.articlesPerDay.map((day) => {
              const heightPct = Math.max(Math.round((day.count / maxDailyCount) * 100), 8);
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-mono font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    {day.count}
                  </span>
                  <div
                    className="w-full max-w-[40px] rounded-t-md bg-primary/75 hover:bg-primary transition-all duration-200 cursor-pointer shadow-2xs group-hover:shadow-xs"
                    style={{ height: `${heightPct}%` }}
                    title={`${day.label}: ${day.count} articles`}
                  />
                  <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[44px] pb-1">
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
          <div className="space-y-3 rounded-xl border border-border/70 bg-card/60 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between font-semibold text-foreground border-b border-border/50 pb-2">
              <span className="flex items-center gap-1.5">
                <Newspaper className="size-3.5 text-primary" />
                <span>Top Active Sources</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-normal">By volume</span>
            </div>
            {trends.topSources.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic py-2">No articles recorded yet.</p>
            ) : (
              <div className="space-y-2.5">
                {trends.topSources.map((source) => {
                  const maxSrc = trends.topSources[0]?.count || 1;
                  const pct = Math.round((source.count / maxSrc) * 100);
                  return (
                    <div key={source.name} className="space-y-1.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-medium text-foreground truncate max-w-[180px]">{source.name}</span>
                        <span className="text-muted-foreground font-mono font-medium">{source.count} articles</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-secondary/80 overflow-hidden">
                        <div className="h-full bg-primary/80 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Topic Distribution */}
          <div className="space-y-3 rounded-xl border border-border/70 bg-card/60 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between font-semibold text-foreground border-b border-border/50 pb-2">
              <span className="flex items-center gap-1.5">
                <Layers className="size-3.5 text-primary" />
                <span>Topic Keyword Activity</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-normal">Total hits</span>
            </div>
            {trends.topicDistribution.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic py-2">No monitored topics defined.</p>
            ) : (
              <div className="space-y-2">
                {trends.topicDistribution.map((topic) => (
                  <div key={topic.name} className="flex justify-between items-center text-[11px] pb-1.5 border-b border-border/40 last:border-0 last:pb-0">
                    <span className="font-medium text-foreground truncate max-w-[180px]">{topic.name}</span>
                    <span className="font-mono text-foreground font-semibold bg-secondary/90 px-2 py-0.5 rounded-md text-[10px] border border-border/40">
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
