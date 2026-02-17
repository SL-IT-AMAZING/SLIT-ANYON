import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useGenerateThemeFromUrl,
  useGenerateThemePrompt,
} from "@/hooks/useCustomThemes";
import { ipc } from "@/ipc/types";
import { showError } from "@/lib/toast";
import { Link, Loader2, Sparkles, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import type {
  ThemeGenerationMode,
  ThemeGenerationModel,
  ThemeInputSource,
} from "@/ipc/types";

// Image upload constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per image (raw file size)
const MAX_IMAGES = 5;

// Default model for AI theme generation
const DEFAULT_THEME_GENERATION_MODEL: ThemeGenerationModel = "gemini-3-pro";

// Image stored with file path (for IPC) and blob URL (for preview)
interface ThemeImage {
  path: string; // File path in temp directory
  preview: string; // Blob URL for displaying thumbnail
}

interface AIGeneratorTabProps {
  aiName: string;
  setAiName: (name: string) => void;
  aiDescription: string;
  setAiDescription: (desc: string) => void;
  aiGeneratedPrompt: string;
  setAiGeneratedPrompt: (prompt: string) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
  isDialogOpen: boolean;
}

export function AIGeneratorTab({
  aiName,
  setAiName,
  aiDescription,
  setAiDescription,
  aiGeneratedPrompt,
  setAiGeneratedPrompt,
  onSave,
  isSaving,
  isDialogOpen,
}: AIGeneratorTabProps) {
  const { t } = useTranslation("app");
  const [aiImages, setAiImages] = useState<ThemeImage[]>([]);
  const [aiKeywords, setAiKeywords] = useState("");
  const [aiGenerationMode, setAiGenerationMode] =
    useState<ThemeGenerationMode>("inspired");
  const [aiSelectedModel, setAiSelectedModel] = useState<ThemeGenerationModel>(
    DEFAULT_THEME_GENERATION_MODEL,
  );
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Track if dialog is open to prevent orphaned uploads from adding images after close
  const isDialogOpenRef = useRef(isDialogOpen);

  // URL-based generation state
  const [inputSource, setInputSource] = useState<ThemeInputSource>("images");
  const [websiteUrl, setWebsiteUrl] = useState("");

  const generatePromptMutation = useGenerateThemePrompt();
  const generateFromUrlMutation = useGenerateThemeFromUrl();
  const isGenerating =
    generatePromptMutation.isPending || generateFromUrlMutation.isPending;

  // Cleanup function to revoke blob URLs and delete temp files
  const cleanupImages = useCallback(
    async (images: ThemeImage[], showErrors = false) => {
      // Revoke blob URLs to free memory
      images.forEach((img) => {
        URL.revokeObjectURL(img.preview);
      });

      // Delete temp files via IPC
      const paths = images.map((img) => img.path);
      if (paths.length > 0) {
        try {
          await ipc.template.cleanupThemeImages({ paths });
        } catch {
          if (showErrors) {
            showError(t("library.themes.aiGenerator.errors.cleanupFailed"));
          }
        }
      }
    },
    [t],
  );

  // Keep ref in sync with isDialogOpen prop
  useEffect(() => {
    isDialogOpenRef.current = isDialogOpen;
  }, [isDialogOpen]);

  // Keep a ref to current images for cleanup without causing effect re-runs
  const aiImagesRef = useRef<ThemeImage[]>([]);
  useEffect(() => {
    aiImagesRef.current = aiImages;
  }, [aiImages]);

  // Cleanup images and reset state when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      // Use ref to get current images to avoid dependency on aiImages
      const imagesToCleanup = aiImagesRef.current;
      if (imagesToCleanup.length > 0) {
        cleanupImages(imagesToCleanup);
        setAiImages([]);
      }
      setAiKeywords("");
      setAiGenerationMode("inspired");
      setAiSelectedModel(DEFAULT_THEME_GENERATION_MODEL);
      setInputSource("images");
      setWebsiteUrl("");
    }
  }, [isDialogOpen, cleanupImages]);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const availableSlots = MAX_IMAGES - aiImages.length;
      if (availableSlots <= 0) {
        showError(
          t("library.themes.aiGenerator.errors.maxImages", { max: MAX_IMAGES }),
        );
        return;
      }

      const filesToProcess = Array.from(files).slice(0, availableSlots);
      const skippedCount = files.length - filesToProcess.length;

      if (skippedCount > 0) {
        showError(
          t("library.themes.aiGenerator.errors.skippedFiles", {
            availableSlots,
            skippedCount,
          }),
        );
      }

      setIsUploading(true);

      try {
        const newImages: ThemeImage[] = [];

        for (const file of filesToProcess) {
          // Validate file type
          if (!file.type.startsWith("image/")) {
            showError(
              t("library.themes.aiGenerator.errors.invalidImage", {
                filename: file.name,
              }),
            );
            continue;
          }

          // Validate file size (raw file size)
          if (file.size > MAX_FILE_SIZE) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
            showError(
              t("library.themes.aiGenerator.errors.fileTooLarge", {
                filename: file.name,
                sizeMB,
              }),
            );
            continue;
          }

          try {
            // Read file as base64 for upload
            const base64Data = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onerror = () =>
                reject(
                  new Error(
                    t("library.themes.aiGenerator.errors.readFileFailed"),
                  ),
                );
              reader.onload = () => {
                const base64 = reader.result as string;
                const data = base64.split(",")[1];
                if (!data) {
                  reject(
                    new Error(
                      t(
                        "library.themes.aiGenerator.errors.extractImageDataFailed",
                      ),
                    ),
                  );
                  return;
                }
                resolve(data);
              };
              reader.readAsDataURL(file);
            });

            // Save to temp file via IPC
            const result = await ipc.template.saveThemeImage({
              data: base64Data,
              filename: file.name,
            });

            // Create blob URL for preview (much more memory efficient than base64 in DOM)
            const preview = URL.createObjectURL(file);

            newImages.push({
              path: result.path,
              preview,
            });
          } catch (err) {
            showError(
              t("library.themes.aiGenerator.errors.processingFailed", {
                filename: file.name,
                message:
                  err instanceof Error
                    ? err.message
                    : t("library.themes.aiGenerator.errors.unknownError"),
              }),
            );
          }
        }

        if (newImages.length > 0) {
          // Check if dialog was closed while upload was in progress
          if (!isDialogOpenRef.current) {
            // Dialog closed - cleanup orphaned images immediately
            await cleanupImages(newImages);
            return;
          }

          setAiImages((prev) => {
            // Double-check limit in case of race conditions
            const remaining = MAX_IMAGES - prev.length;
            return [...prev, ...newImages.slice(0, remaining)];
          });
        }
      } finally {
        setIsUploading(false);
        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [aiImages.length, cleanupImages, t],
  );

  const handleRemoveImage = useCallback(
    async (index: number) => {
      const imageToRemove = aiImages[index];
      if (imageToRemove) {
        // Cleanup the removed image - show errors since this is a user action
        await cleanupImages([imageToRemove], true);
      }
      setAiImages((prev) => prev.filter((_, i) => i !== index));
    },
    [aiImages, cleanupImages],
  );

  const handleGenerate = useCallback(async () => {
    if (inputSource === "images") {
      // Image-based generation
      if (aiImages.length === 0) {
        showError(t("library.themes.aiGenerator.errors.uploadAtLeastOne"));
        return;
      }

      try {
        const result = await generatePromptMutation.mutateAsync({
          imagePaths: aiImages.map((img) => img.path),
          keywords: aiKeywords,
          generationMode: aiGenerationMode,
          model: aiSelectedModel,
        });
        setAiGeneratedPrompt(result.prompt);
        toast.success(
          t("library.themes.aiGenerator.success.generatedFromImages"),
        );
      } catch (error) {
        showError(
          t("library.themes.aiGenerator.errors.generateFailed", {
            message:
              error instanceof Error
                ? error.message
                : t("library.themes.aiGenerator.errors.unknownError"),
          }),
        );
      }
    } else {
      // URL-based generation
      if (!websiteUrl.trim()) {
        showError(t("library.themes.aiGenerator.errors.websiteRequired"));
        return;
      }

      try {
        const result = await generateFromUrlMutation.mutateAsync({
          url: websiteUrl,
          keywords: aiKeywords,
          generationMode: aiGenerationMode,
          model: aiSelectedModel,
        });

        setAiGeneratedPrompt(result.prompt);
        toast.success(
          t("library.themes.aiGenerator.success.generatedFromWebsite"),
        );
      } catch (error) {
        showError(
          t("library.themes.aiGenerator.errors.generateFailed", {
            message:
              error instanceof Error
                ? error.message
                : t("library.themes.aiGenerator.errors.unknownError"),
          }),
        );
      }
    }
  }, [
    inputSource,
    aiImages,
    websiteUrl,
    aiKeywords,
    aiGenerationMode,
    aiSelectedModel,
    generatePromptMutation,
    generateFromUrlMutation,
    setAiGeneratedPrompt,
  ]);

  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="ai-name">
          {t("library.themes.aiGenerator.themeName")}
        </Label>
        <Input
          id="ai-name"
          placeholder={t("library.themes.aiGenerator.themeNamePlaceholder")}
          value={aiName}
          onChange={(e) => setAiName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ai-description">
          {t("library.themes.aiGenerator.descriptionOptional")}
        </Label>
        <Input
          id="ai-description"
          placeholder={t("library.themes.aiGenerator.descriptionPlaceholder")}
          value={aiDescription}
          onChange={(e) => setAiDescription(e.target.value)}
        />
      </div>

      {/* Input Source Toggle */}
      <div className="space-y-3">
        <Label>{t("library.themes.aiGenerator.referenceSource")}</Label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setInputSource("images")}
            className={`flex flex-col items-center rounded-lg border p-3 text-center transition-colors ${
              inputSource === "images"
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/50"
            }`}
          >
            <Upload className="h-5 w-5 mb-1" />
            <span className="font-medium text-sm">
              {t("library.themes.aiGenerator.inputSources.uploadImages")}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              {t(
                "library.themes.aiGenerator.inputSources.uploadImagesDescription",
              )}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setInputSource("url")}
            className={`flex flex-col items-center rounded-lg border p-3 text-center transition-colors ${
              inputSource === "url"
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/50"
            }`}
          >
            <Link className="h-5 w-5 mb-1" />
            <span className="font-medium text-sm">
              {t("library.themes.aiGenerator.inputSources.websiteUrl")}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              {t(
                "library.themes.aiGenerator.inputSources.websiteUrlDescription",
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Image Upload Section - only shown when inputSource is "images" */}
      {inputSource === "images" && (
        <div className="space-y-2">
          <Label>{t("library.themes.aiGenerator.referenceImages")}</Label>
          <div
            className={`border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
              disabled={isUploading}
            />
            {isUploading ? (
              <Loader2 className="h-8 w-8 mx-auto text-muted-foreground mb-2 animate-spin" />
            ) : (
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            )}
            <p className="text-sm text-muted-foreground">
              {isUploading
                ? t("library.themes.aiGenerator.uploading")
                : t("library.themes.aiGenerator.clickToUpload")}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {t("library.themes.aiGenerator.uploadHint")}
            </p>
          </div>

          {/* Image counter */}
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {t("library.themes.aiGenerator.imageCount", {
              count: aiImages.length,
              max: MAX_IMAGES,
            })}
            {aiImages.length >= MAX_IMAGES && (
              <span className="text-destructive ml-2">
                {t("library.themes.aiGenerator.maxReached")}
              </span>
            )}
          </p>

          {/* Image Preview */}
          {aiImages.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {aiImages.map((img, index) => (
                <div key={img.path} className="relative group">
                  <img
                    src={img.preview}
                    alt={t("library.themes.aiGenerator.uploadAlt", {
                      index: index + 1,
                    })}
                    className="h-16 w-16 object-cover rounded-md border"
                  />
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* URL Input Section - only shown when inputSource is "url" */}
      {inputSource === "url" && (
        <div className="space-y-2">
          <Label htmlFor="website-url">
            {t("library.themes.aiGenerator.inputSources.websiteUrl")}
          </Label>
          <Input
            id="website-url"
            type="url"
            placeholder={t("library.themes.aiGenerator.websitePlaceholder")}
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            disabled={isGenerating}
          />
          <p className="text-xs text-muted-foreground">
            {t("library.themes.aiGenerator.websiteHint")}
          </p>
        </div>
      )}

      {/* Keywords Input */}
      <div className="space-y-2">
        <Label htmlFor="ai-keywords">
          {t("library.themes.aiGenerator.keywordsOptional")}
        </Label>
        <Input
          id="ai-keywords"
          placeholder={t("library.themes.aiGenerator.keywordsPlaceholder")}
          value={aiKeywords}
          onChange={(e) => setAiKeywords(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          {t("library.themes.aiGenerator.keywordsHint")}
        </p>
      </div>

      {/* Generation Mode Selection */}
      <div className="space-y-3">
        <Label>{t("library.themes.aiGenerator.generationMode")}</Label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setAiGenerationMode("inspired")}
            className={`flex flex-col items-start rounded-lg border p-3 text-left transition-colors ${
              aiGenerationMode === "inspired"
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/50"
            }`}
          >
            <span className="font-medium">
              {t("library.themes.aiGenerator.modes.inspired.label")}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              {t("library.themes.aiGenerator.modes.inspired.description")}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setAiGenerationMode("high-fidelity")}
            className={`flex flex-col items-start rounded-lg border p-3 text-left transition-colors ${
              aiGenerationMode === "high-fidelity"
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/50"
            }`}
          >
            <span className="font-medium">
              {t("library.themes.aiGenerator.modes.highFidelity.label")}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              {t("library.themes.aiGenerator.modes.highFidelity.description")}
            </span>
          </button>
        </div>
      </div>

      {/* Model Selection */}
      <div className="space-y-3">
        <Label>{t("library.themes.aiGenerator.modelSelection")}</Label>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setAiSelectedModel("gemini-3-pro")}
            className={`flex flex-col items-center rounded-lg border p-3 text-center transition-colors ${
              aiSelectedModel === "gemini-3-pro"
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/50"
            }`}
          >
            <span className="font-medium text-sm">
              {t("library.themes.aiGenerator.models.gemini.label")}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              {t("library.themes.aiGenerator.models.gemini.description")}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setAiSelectedModel("claude-opus-4.5")}
            className={`flex flex-col items-center rounded-lg border p-3 text-center transition-colors ${
              aiSelectedModel === "claude-opus-4.5"
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/50"
            }`}
          >
            <span className="font-medium text-sm">
              {t("library.themes.aiGenerator.models.claude.label")}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              {t("library.themes.aiGenerator.models.claude.description")}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setAiSelectedModel("gpt-5.2")}
            className={`flex flex-col items-center rounded-lg border p-3 text-center transition-colors ${
              aiSelectedModel === "gpt-5.2"
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/50"
            }`}
          >
            <span className="font-medium text-sm">
              {t("library.themes.aiGenerator.models.gpt.label")}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              {t("library.themes.aiGenerator.models.gpt.description")}
            </span>
          </button>
        </div>
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={
          isGenerating ||
          (inputSource === "images" && aiImages.length === 0) ||
          (inputSource === "url" && !websiteUrl.trim())
        }
        variant="secondary"
        className="w-full"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {inputSource === "url"
              ? t("library.themes.aiGenerator.generatingFromWebsite")
              : t("library.themes.aiGenerator.generatingPrompt")}
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            {t("library.themes.aiGenerator.generateThemePrompt")}
          </>
        )}
      </Button>

      {/* Generated Prompt Display */}
      <div className="space-y-2">
        <Label htmlFor="ai-prompt">
          {t("library.themes.aiGenerator.generatedPrompt")}
        </Label>
        {aiGeneratedPrompt ? (
          <Textarea
            id="ai-prompt"
            className="min-h-[200px] font-mono text-sm"
            value={aiGeneratedPrompt}
            onChange={(e) => setAiGeneratedPrompt(e.target.value)}
            placeholder={t(
              "library.themes.aiGenerator.generatedPromptPlaceholder",
            )}
          />
        ) : (
          <div className="min-h-[100px] border rounded-md p-4 flex items-center justify-center text-muted-foreground text-sm text-center">
            {t("library.themes.aiGenerator.noPromptYet")}{" "}
            {inputSource === "images"
              ? t("library.themes.aiGenerator.emptyStateImages")
              : t("library.themes.aiGenerator.emptyStateUrl")}
          </div>
        )}
      </div>

      {/* Save Button - only show when prompt is generated */}
      {aiGeneratedPrompt && (
        <Button
          onClick={onSave}
          disabled={isSaving || !aiName.trim()}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("library.themes.saving")}
            </>
          ) : (
            t("library.themes.saveTheme")
          )}
        </Button>
      )}
    </div>
  );
}
