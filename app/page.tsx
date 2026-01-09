"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { LocaleSwitcher } from "@/components/locale-switcher";

/**
 * CompilaloEasy Landing Page
 *
 * Filosofia: Empatizzare col problema, non vendere features.
 */

// ============================================================================
// SLIDE CONFIG (solo metadata, testi vengono dalle traduzioni)
// ============================================================================

interface SlideConfig {
  id: number;
  emphasis: "problem" | "solution" | "cta";
  hasSubtext: boolean;
}

const SLIDES_CONFIG: SlideConfig[] = [
  { id: 1, emphasis: "problem", hasSubtext: false },
  { id: 2, emphasis: "problem", hasSubtext: true },
  { id: 3, emphasis: "problem", hasSubtext: true },
  { id: 4, emphasis: "solution", hasSubtext: true },
  { id: 5, emphasis: "cta", hasSubtext: true },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LandingPage() {
  const router = useRouter();
  const t = useTranslations("landing");

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const isLastSlide = currentSlide === SLIDES_CONFIG.length - 1;
  const slideConfig = SLIDES_CONFIG[currentSlide];

  // Auto-advance disabled after user interaction
  useEffect(() => {
    if (hasInteracted || isLastSlide) return;

    const timer = setTimeout(() => {
      goToNextSlide();
    }, 4500);

    return () => clearTimeout(timer);
  }, [currentSlide, hasInteracted, isLastSlide]);

  const goToNextSlide = useCallback(() => {
    if (isTransitioning || isLastSlide) return;

    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide((prev) => prev + 1);
      setIsTransitioning(false);
    }, 300);
  }, [isTransitioning, isLastSlide]);

  const goToSlide = useCallback(
    (index: number) => {
      if (isTransitioning || index === currentSlide) return;

      setHasInteracted(true);
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide(index);
        setIsTransitioning(false);
      }, 300);
    },
    [isTransitioning, currentSlide]
  );

  const handleCTA = () => {
    router.push("/editor");
  };

  const handleLogin = () => {
    router.push("/auth");
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setHasInteracted(true);
        if (!isLastSlide) goToNextSlide();
      }
      if (e.key === "ArrowLeft" && currentSlide > 0) {
        e.preventDefault();
        setHasInteracted(true);
        goToSlide(currentSlide - 1);
      }
      if (e.key === "Enter" && isLastSlide) {
        handleCTA();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide, isLastSlide, goToNextSlide, goToSlide]);

  // Testi tradotti per la slide corrente
  const headline = t(`slides.${slideConfig.id}.headline`);
  const subtext = slideConfig.hasSubtext
    ? t(`slides.${slideConfig.id}.subtext`)
    : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Minimal */}
      <header className="fixed top-0 left-0 right-0 z-50 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-(--brand-primary) flex items-center justify-center">
              <span className="text-white font-semibold text-sm">CE</span>
            </div>
            <span className="text-lg font-semibold text-foreground">
              Compilalo<span className="text-[var(--brand-primary)]">Easy</span>
            </span>
          </div>

          {/* Right side: Language + Login */}
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <LocaleSwitcher variant="compact" />

            {/* Login link */}
            <button
              onClick={handleLogin}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("header.alreadyHaveAccount")}{" "}
              <span className="font-medium text-[var(--brand-primary)]">
                {t("header.login")}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Fullscreen Slide */}
      <main
        className="flex-1 flex items-center justify-center px-6 cursor-pointer"
        onClick={() => {
          setHasInteracted(true);
          if (!isLastSlide) goToNextSlide();
        }}
      >
        <div className="max-w-3xl mx-auto text-center">
          {/* Slide Content */}
          <div
            className={cn(
              "transition-all duration-300 ease-out",
              isTransitioning
                ? "opacity-0 translate-y-4"
                : "opacity-100 translate-y-0"
            )}
          >
            {/* Headline */}
            <h1
              className={cn(
                "text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight",
                slideConfig.emphasis === "cta"
                  ? "text-[var(--brand-primary)]"
                  : "text-foreground"
              )}
            >
              {headline}
            </h1>

            {/* Subtext */}
            {subtext && (
              <p
                className={cn(
                  "mt-6 text-xl md:text-2xl",
                  slideConfig.emphasis === "solution"
                    ? "text-foreground/80"
                    : "text-muted-foreground"
                )}
              >
                {subtext}
              </p>
            )}

            {/* CTA Button - Only on last slide */}
            {isLastSlide && (
              <div className="mt-12 animate-fade-in">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCTA();
                  }}
                  className={cn(
                    "inline-flex items-center gap-3 px-8 py-4",
                    "bg-(--brand-primary) hover:bg-[var(--brand-primary-hover)]",
                    "text-white text-lg font-medium",
                    "rounded-xl shadow-lg hover:shadow-xl",
                    "transform hover:-translate-y-0.5",
                    "transition-all duration-200"
                  )}
                >
                  {t("cta.tryEditor")}
                  <ArrowRight className="h-5 w-5" />
                </button>
                <p className="mt-4 text-sm text-muted-foreground">
                  {t("cta.freeNoRegistration")}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Slide Indicators */}
          <div className="flex items-center gap-2">
            {SLIDES_CONFIG.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  goToSlide(index);
                }}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  index === currentSlide
                    ? "w-8 bg-(--brand-primary)"
                    : "w-2 bg-[var(--border-emphasis)] hover:bg-muted-foreground"
                )}
                aria-label={t("navigation.goToSlide", { number: index + 1 })}
              />
            ))}
          </div>

          {/* Next hint - hidden on last slide */}
          {!isLastSlide && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
              <span className="hidden sm:inline">
                {t("navigation.clickOrPressSpace")}
              </span>
              <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
            </div>
          )}

          {/* Skip to CTA */}
          {!isLastSlide && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(SLIDES_CONFIG.length - 1);
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("navigation.skip")}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
