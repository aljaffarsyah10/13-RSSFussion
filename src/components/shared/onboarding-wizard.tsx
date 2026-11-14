"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { onboardingApi } from "@/lib/api/client";
import { OnboardingState } from "@/types/models";
import { Sparkles, CheckCircle2, Rss, ArrowRight, Loader2, Bot, Code, Rocket } from "lucide-react";

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted: () => void;
}

export function OnboardingWizard({ isOpen, onClose, onCompleted }: OnboardingWizardProps) {
  const [onboardingState, setOnboardingState] = React.useState<OnboardingState | null>(null);
  const [selectedPresetId, setSelectedPresetId] = React.useState<string>("ai-agents");
  const [customKeyword, setCustomKeyword] = React.useState("AI");
  const [isLoading, setIsLoading] = React.useState(false);
  const [step, setStep] = React.useState<1 | 2>(1);

  React.useEffect(() => {
    if (isOpen) {
      onboardingApi.getState().then(setOnboardingState).catch(() => {});
    }
  }, [isOpen]);

  const activePreset = onboardingState?.suggestedTopics?.find((p) => p.id === selectedPresetId);

  const handlePresetSelect = (id: string) => {
    setSelectedPresetId(id);
    const p = onboardingState?.suggestedTopics?.find((item) => item.id === id);
    if (p && p.defaultKeywords?.[0]) {
      setCustomKeyword(p.defaultKeywords[0]);
    }
  };

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      await onboardingApi.complete({
        selectedPresetId,
        customKeyword,
      });
      onCompleted();
      onClose();
    } catch {
      onCompleted();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const getPresetIcon = (id: string) => {
    if (id === "ai-agents") return <Bot className="size-4 text-primary" />;
    if (id === "tech-engineering") return <Code className="size-4 text-blue-500" />;
    return <Rocket className="size-4 text-amber-500" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold font-heading">
                {step === 1 ? "Welcome to RSSFusion!" : "Configure Your Intelligence Beat"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {step === 1
                  ? "Choose a starter beat to immediately populate your personalized article intelligence stream."
                  : "Review the initial feed sources and monitor keywords that will be automatically added."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-3 pt-2">
            <Label className="text-xs font-semibold text-foreground">Select your primary focus area:</Label>
            <div className="grid gap-2.5">
              {(onboardingState?.suggestedTopics || []).map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? "border-primary bg-primary/4 ring-2 ring-primary/30"
                        : "border-border/70 bg-card hover:border-border hover:bg-muted/20"
                    }`}
                  >
                    <div className="flex size-8 items-center justify-center rounded-lg bg-muted/60 shrink-0 mt-0.5">
                      {getPresetIcon(preset.id)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">{preset.name}</span>
                        {isSelected && (
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-medium text-primary">
                            Selected
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{preset.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {activePreset && (
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3 space-y-2">
                <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                  <Rss className="size-3 text-primary" />
                  Curated Publications to Ingest:
                </span>
                <div className="space-y-1">
                  {activePreset.suggestedFeeds.map((feed) => (
                    <div key={feed.url} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                      <span className="font-medium text-foreground">{feed.name}</span>
                      <span className="text-[10px] text-muted-foreground/60 truncate">({feed.siteUrl})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="seedKeyword" className="text-xs font-medium">
                Initial keyword to watch & alert:
              </Label>
              <Input
                id="seedKeyword"
                value={customKeyword}
                onChange={(e) => setCustomKeyword(e.target.value)}
                placeholder="e.g. OpenAI, Next.js, LLM"
                className="h-8.5 text-xs bg-background/80"
              />
              <p className="text-[10px] text-muted-foreground">
                You can add more keywords, custom feeds, or import OPML files anytime in your dashboard.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 pt-3 border-t border-border/40">
          {step === 1 ? (
            <>
              <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
                Skip for now
              </Button>
              <Button size="sm" onClick={() => setStep(2)} className="text-xs gap-1.5 cursor-pointer shadow-xs">
                <span>Continue</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setStep(1)} disabled={isLoading} className="text-xs">
                Back
              </Button>
              <Button
                size="sm"
                onClick={handleFinish}
                disabled={isLoading}
                className="text-xs gap-1.5 cursor-pointer shadow-xs"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Setting up workspace...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5" />
                    <span>Launch Intelligence Stream</span>
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
