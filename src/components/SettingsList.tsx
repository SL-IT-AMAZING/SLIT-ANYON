import { activeSettingsSectionAtom } from "@/atoms/viewAtoms";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useScrollAndNavigateTo } from "@/hooks/useScrollAndNavigateTo";
import { SECTION_IDS, SETTINGS_SEARCH_INDEX } from "@/lib/settingsSearchIndex";
import { cn } from "@/lib/utils";
import Fuse from "fuse.js";
import { useAtom } from "jotai";
import { SearchIcon, XIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type SettingsSection = {
  id: string;
  label: string;
};

const fuse = new Fuse(SETTINGS_SEARCH_INDEX, {
  keys: [
    { name: "label", weight: 2 },
    { name: "description", weight: 1 },
    { name: "keywords", weight: 1.5 },
    { name: "sectionLabel", weight: 0.5 },
  ],
  threshold: 0.4,
  includeScore: true,
  ignoreLocation: true,
});

export function SettingsList() {
  const { t } = useTranslation(["app", "settings"]);
  const [activeSection, setActiveSection] = useAtom(activeSettingsSectionAtom);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const settingsSections: SettingsSection[] = useMemo(
    () => [
      {
        id: SECTION_IDS.general,
        label: t("sections.general", { ns: "settings" }),
      },
      {
        id: SECTION_IDS.workflow,
        label: t("sections.workflow", { ns: "settings" }),
      },
      { id: SECTION_IDS.ai, label: t("sections.ai", { ns: "settings" }) },
      {
        id: SECTION_IDS.telemetry,
        label: t("sections.telemetry", { ns: "settings" }),
      },
      {
        id: SECTION_IDS.integrations,
        label: t("sections.integrations", { ns: "settings" }),
      },
      {
        id: SECTION_IDS.toolsMcp,
        label: t("sections.tools", { ns: "settings" }),
      },
      {
        id: SECTION_IDS.experiments,
        label: t("sections.experiments", { ns: "settings" }),
      },
      {
        id: SECTION_IDS.dangerZone,
        label: t("sections.dangerZone", { ns: "settings" }),
      },
    ],
    [t],
  );

  const sectionLabelById = useMemo(
    () =>
      settingsSections.reduce<Record<string, string>>((acc, section) => {
        acc[section.id] = section.label;
        return acc;
      }, {}),
    [settingsSections],
  );

  const scrollAndNavigateTo = useScrollAndNavigateTo("/settings", {
    behavior: "smooth",
    block: "start",
  });

  const scrollAndNavigateToWithHighlight = useScrollAndNavigateTo("/settings", {
    behavior: "smooth",
    block: "start",
    highlight: true,
  });

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return fuse.search(searchQuery.trim());
  }, [searchQuery]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
            return;
          }
        }
      },
      { rootMargin: "-20% 0px -80% 0px", threshold: 0 },
    );

    for (const section of settingsSections) {
      const el = document.getElementById(section.id);
      if (el) {
        observer.observe(el);
      }
    }

    return () => {
      observer.disconnect();
    };
  }, [setActiveSection, settingsSections]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 p-4">
        <h2 className="text-lg font-semibold tracking-tight">
          {t("settings.title", { ns: "app" })}
        </h2>
      </div>
      <div className="flex-shrink-0 px-4 pb-2">
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder={t("search.placeholder", { ns: "settings" })}
            aria-label={t("search.ariaLabel", { ns: "settings" })}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-input bg-transparent pl-8 pr-8 py-1.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                inputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={t("search.clearAriaLabel", { ns: "settings" })}
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <ScrollArea className="flex-grow">
        <div className="space-y-1 p-4 pt-0">
          {searchResults !== null ? (
            searchResults.length > 0 ? (
              searchResults.map((result) => (
                <button
                  key={`${result.item.id}-${result.refIndex}`}
                  onClick={() => {
                    scrollAndNavigateToWithHighlight(
                      result.item.id,
                      result.item.sectionId,
                    );
                    setSearchQuery("");
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-sm transition-colors hover:bg-sidebar-accent"
                >
                  <div className="font-medium">{result.item.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {sectionLabelById[result.item.sectionId] ??
                      result.item.sectionLabel}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                {t("search.noResults", { ns: "settings" })}
              </div>
            )
          ) : (
            settingsSections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollAndNavigateTo(section.id)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                  activeSection === section.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                    : "hover:bg-sidebar-accent",
                )}
              >
                {section.label}
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
