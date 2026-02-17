import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { isStreamingByIdAtom, selectedChatIdAtom } from "@/atoms/chatAtoms";
import type { SuggestedAction } from "@/lib/schemas";
import { useAtomValue } from "jotai";
import { unescapeXmlAttr, unescapeXmlContent } from "../../../shared/xmlEscape";
import { markdownComponents } from "../chat-v2/MarkdownContent";
import {
  AddDependencyTool,
  AddIntegrationTool,
  CodeSearchResultTool,
  CodeSearchTool,
  CodebaseContextTool,
  DatabaseSchemaTool,
  DeleteTool,
  EditTool,
  ExecuteSqlTool,
  ExitPlanTool,
  GrepTool,
  ListFilesTool,
  LogsTool,
  McpToolCallTool,
  McpToolResultTool,
  OpenCodeToolTool,
  OutputTool,
  ProblemSummaryTool,
  ReadTool,
  RenameTool,
  SearchReplaceTool,
  StatusTool,
  SupabaseProjectInfoTool,
  SupabaseTableSchemaTool,
  ThinkTool,
  WebCrawlTool,
  WebSearchResultTool,
  WebSearchTool,
  WritePlanTool,
  WriteTool,
  mapTagStateToStatus,
} from "../chat-v2/tools";
import { mapActionToButton } from "./ChatInput";
import { FixAllErrorsButton } from "./FixAllErrorsButton";
import type { CustomTagState } from "./stateTypes";

const ANYON_CUSTOM_TAGS = [
  "anyon-write",
  "anyon-rename",
  "anyon-delete",
  "anyon-add-dependency",
  "anyon-execute-sql",
  "anyon-read-logs",
  "anyon-add-integration",
  "anyon-output",
  "anyon-problem-report",
  "anyon-chat-summary",
  "anyon-edit",
  "anyon-grep",
  "anyon-search-replace",
  "anyon-codebase-context",
  "anyon-web-search-result",
  "anyon-web-search",
  "anyon-web-crawl",
  "anyon-code-search-result",
  "anyon-code-search",
  "anyon-read",
  "think",
  "anyon-command",
  "anyon-mcp-tool-call",
  "anyon-mcp-tool-result",
  "anyon-list-files",
  "anyon-database-schema",
  "anyon-supabase-table-schema",
  "anyon-supabase-project-info",
  "anyon-status",
  "opencode-tool",
  "anyon-write-plan",
  "anyon-exit-plan",
];

interface AnyonMarkdownParserProps {
  content: string;
}

export type CustomTagInfo = {
  tag: string;
  attributes: Record<string, string>;
  content: string;
  fullMatch: string;
  inProgress?: boolean;
};

export type ContentPiece =
  | { type: "markdown"; content: string }
  | { type: "custom-tag"; tagInfo: CustomTagInfo };

export const VanillaMarkdownParser = ({ content }: { content: string }) => {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  );
};

/**
 * Custom component to parse markdown content with Anyon-specific tags
 */
export const AnyonMarkdownParser: React.FC<AnyonMarkdownParserProps> = ({
  content,
}) => {
  const chatId = useAtomValue(selectedChatIdAtom);
  const isStreaming = useAtomValue(isStreamingByIdAtom).get(chatId!) ?? false;
  // Extract content pieces (markdown and custom tags)
  const contentPieces = useMemo(() => {
    return parseCustomTagsWithDedup(content);
  }, [content]);

  // Extract error messages and track positions
  const { errorMessages, lastErrorIndex, errorCount } = useMemo(() => {
    const errors: string[] = [];
    let lastIndex = -1;
    let count = 0;

    contentPieces.forEach((piece, index) => {
      if (
        piece.type === "custom-tag" &&
        piece.tagInfo.tag === "anyon-output" &&
        piece.tagInfo.attributes.type === "error"
      ) {
        const errorMessage = piece.tagInfo.attributes.message;
        if (errorMessage?.trim()) {
          errors.push(errorMessage.trim());
          count++;
          lastIndex = index;
        }
      }
    });

    return {
      errorMessages: errors,
      lastErrorIndex: lastIndex,
      errorCount: count,
    };
  }, [contentPieces]);

  return (
    <>
      {contentPieces.map((piece, index) => (
        <React.Fragment key={index}>
          {piece.type === "markdown"
            ? piece.content && (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {piece.content}
                </ReactMarkdown>
              )
            : renderCustomTag(piece.tagInfo, { isStreaming })}
          {index === lastErrorIndex &&
            errorCount > 1 &&
            !isStreaming &&
            chatId && (
              <div className="mt-3 w-full flex">
                <FixAllErrorsButton
                  errorMessages={errorMessages}
                  chatId={chatId}
                />
              </div>
            )}
        </React.Fragment>
      ))}
    </>
  );
};

/**
 * Pre-process content to handle unclosed custom tags
 * Adds closing tags at the end of the content for any unclosed custom tags
 * Assumes the opening tags are complete and valid
 * Returns the processed content and a map of in-progress tags
 */
function preprocessUnclosedTags(content: string): {
  processedContent: string;
  inProgressTags: Map<string, Set<number>>;
} {
  let processedContent = content;
  // Map to track which tags are in progress and their positions
  const inProgressTags = new Map<string, Set<number>>();

  // For each tag type, check if there are unclosed tags
  for (const tagName of ANYON_CUSTOM_TAGS) {
    // Count opening and closing tags
    const openTagPattern = new RegExp(`<${tagName}(?:\\s[^>]*)?>`, "g");
    const closeTagPattern = new RegExp(`</${tagName}>`, "g");

    // Track the positions of opening tags
    const openingMatches: RegExpExecArray[] = [];
    let match;

    // Reset regex lastIndex to start from the beginning
    openTagPattern.lastIndex = 0;

    while ((match = openTagPattern.exec(processedContent)) !== null) {
      openingMatches.push({ ...match });
    }

    const openCount = openingMatches.length;
    const closeCount = (processedContent.match(closeTagPattern) || []).length;

    // If we have more opening than closing tags
    const missingCloseTags = openCount - closeCount;
    if (missingCloseTags > 0) {
      // Add the required number of closing tags at the end
      processedContent += Array(missingCloseTags)
        .fill(`</${tagName}>`)
        .join("");

      // Mark the last N tags as in progress where N is the number of missing closing tags
      const inProgressIndexes = new Set<number>();
      const startIndex = openCount - missingCloseTags;
      for (let i = startIndex; i < openCount; i++) {
        inProgressIndexes.add(openingMatches[i].index);
      }
      inProgressTags.set(tagName, inProgressIndexes);
    }
  }

  return { processedContent, inProgressTags };
}

/**
 * Parse the content to extract custom tags and markdown sections into a unified array
 */
function parseCustomTags(content: string): ContentPiece[] {
  const { processedContent, inProgressTags } = preprocessUnclosedTags(content);

  const tagPattern = new RegExp(
    `<(${ANYON_CUSTOM_TAGS.join("|")})\\s*([^>]*)>(.*?)<\\/\\1>`,
    "gs",
  );

  const contentPieces: ContentPiece[] = [];
  let lastIndex = 0;
  let match;

  // Find all custom tags
  while ((match = tagPattern.exec(processedContent)) !== null) {
    const [fullMatch, tag, attributesStr, tagContent] = match;
    const startIndex = match.index;

    // Add the markdown content before this tag
    if (startIndex > lastIndex) {
      contentPieces.push({
        type: "markdown",
        content: processedContent.substring(lastIndex, startIndex),
      });
    }

    // Parse attributes and unescape values
    const attributes: Record<string, string> = {};
    const attrPattern = /([\w-]+)="([^"]*)"/g;
    let attrMatch;
    while ((attrMatch = attrPattern.exec(attributesStr)) !== null) {
      attributes[attrMatch[1]] = unescapeXmlAttr(attrMatch[2]);
    }

    // Check if this tag was marked as in progress
    const tagInProgressSet = inProgressTags.get(tag);
    const isInProgress = tagInProgressSet?.has(startIndex);

    // Add the tag info with unescaped content
    contentPieces.push({
      type: "custom-tag",
      tagInfo: {
        tag,
        attributes,
        content: unescapeXmlContent(tagContent),
        fullMatch,
        inProgress: isInProgress || false,
      },
    });

    lastIndex = startIndex + fullMatch.length;
  }

  // Add the remaining markdown content
  if (lastIndex < processedContent.length) {
    contentPieces.push({
      type: "markdown",
      content: processedContent.substring(lastIndex),
    });
  }

  return contentPieces;
}

export function parseCustomTagsWithDedup(content: string): ContentPiece[] {
  const pieces = parseCustomTags(content);
  // Deduplicate opencode-tool tags: keep only the LAST occurrence per toolid
  const lastToolIndex = new Map<string, number>();
  pieces.forEach((piece, index) => {
    if (
      piece.type === "custom-tag" &&
      piece.tagInfo.tag === "opencode-tool" &&
      piece.tagInfo.attributes.toolid
    ) {
      lastToolIndex.set(piece.tagInfo.attributes.toolid, index);
    }
  });

  return pieces.filter((piece, index) => {
    if (
      piece.type === "custom-tag" &&
      piece.tagInfo.tag === "opencode-tool" &&
      piece.tagInfo.attributes.toolid
    ) {
      return lastToolIndex.get(piece.tagInfo.attributes.toolid) === index;
    }
    return true;
  });
}

export function getState({
  isStreaming,
  inProgress,
}: {
  isStreaming?: boolean;
  inProgress?: boolean;
}): CustomTagState {
  if (!inProgress) {
    return "finished";
  }
  return isStreaming ? "pending" : "aborted";
}

/**
 * Render a custom tag based on its type
 */
export function renderCustomTag(
  tagInfo: CustomTagInfo,
  { isStreaming }: { isStreaming: boolean },
): React.ReactNode {
  const { tag, attributes, content, inProgress } = tagInfo;
  const status = mapTagStateToStatus(getState({ isStreaming, inProgress }));

  switch (tag) {
    case "anyon-read":
      return <ReadTool path={attributes.path || ""}>{content}</ReadTool>;

    case "anyon-web-search":
      return (
        <WebSearchTool query={attributes.query || ""} status={status}>
          {content}
        </WebSearchTool>
      );

    case "anyon-web-crawl":
      return <WebCrawlTool status={status}>{content}</WebCrawlTool>;

    case "anyon-code-search":
      return (
        <CodeSearchTool query={attributes.query || ""} status={status}>
          {content}
        </CodeSearchTool>
      );

    case "anyon-code-search-result":
      return <CodeSearchResultTool>{content}</CodeSearchResultTool>;

    case "anyon-web-search-result":
      return (
        <WebSearchResultTool status={status}>{content}</WebSearchResultTool>
      );

    case "think":
      return <ThinkTool status={status}>{content}</ThinkTool>;

    case "anyon-write":
      return (
        <WriteTool
          path={attributes.path || ""}
          description={attributes.description || ""}
          status={status}
        >
          {content}
        </WriteTool>
      );

    case "anyon-rename":
      return (
        <RenameTool from={attributes.from || ""} to={attributes.to || ""}>
          {content}
        </RenameTool>
      );

    case "anyon-delete":
      return <DeleteTool path={attributes.path || ""}>{content}</DeleteTool>;

    case "anyon-add-dependency":
      return (
        <AddDependencyTool packages={attributes.packages || ""}>
          {content}
        </AddDependencyTool>
      );

    case "anyon-execute-sql":
      return (
        <ExecuteSqlTool
          description={attributes.description || ""}
          status={status}
        >
          {content}
        </ExecuteSqlTool>
      );

    case "anyon-read-logs":
      return (
        <LogsTool
          node={{
            properties: {
              time: attributes.time || "",
              type: attributes.type || "",
              level: attributes.level || "",
              count: attributes.count || "",
            },
          }}
          status={status}
        >
          {content}
        </LogsTool>
      );

    case "anyon-grep":
      return (
        <GrepTool
          query={attributes.query || ""}
          include={attributes.include || ""}
          exclude={attributes.exclude || ""}
          caseSensitive={attributes["case-sensitive"] === "true"}
          count={attributes.count || ""}
          status={status}
        >
          {content}
        </GrepTool>
      );

    case "anyon-add-integration":
      return (
        <AddIntegrationTool provider={attributes.provider || ""}>
          {content}
        </AddIntegrationTool>
      );

    case "anyon-edit":
      return (
        <EditTool
          path={attributes.path || ""}
          description={attributes.description || ""}
          status={status}
        >
          {content}
        </EditTool>
      );

    case "anyon-search-replace":
      return (
        <SearchReplaceTool
          path={attributes.path || ""}
          description={attributes.description || ""}
          status={status}
        >
          {content}
        </SearchReplaceTool>
      );

    case "anyon-codebase-context":
      return (
        <CodebaseContextTool
          node={{ properties: { files: attributes.files || "" } }}
          status={status}
        >
          {content}
        </CodebaseContextTool>
      );

    case "anyon-mcp-tool-call":
      return (
        <McpToolCallTool
          serverName={attributes.server || ""}
          toolName={attributes.tool || ""}
        >
          {content}
        </McpToolCallTool>
      );

    case "anyon-mcp-tool-result":
      return (
        <McpToolResultTool
          serverName={attributes.server || ""}
          toolName={attributes.tool || ""}
        >
          {content}
        </McpToolResultTool>
      );

    case "anyon-output":
      return (
        <OutputTool
          type={attributes.type as "warning" | "error"}
          message={attributes.message}
        >
          {content}
        </OutputTool>
      );

    case "anyon-problem-report":
      return (
        <ProblemSummaryTool summary={attributes.summary}>
          {content}
        </ProblemSummaryTool>
      );

    case "anyon-chat-summary":
      // Don't render anything for anyon-chat-summary
      return null;

    case "anyon-command":
      if (attributes.type) {
        const action = {
          id: attributes.type,
        } as SuggestedAction;
        return <>{mapActionToButton(action)}</>;
      }
      return null;

    case "anyon-list-files":
      return (
        <ListFilesTool
          directory={attributes.directory || ""}
          recursive={attributes.recursive || ""}
          status={status}
        >
          {content}
        </ListFilesTool>
      );

    case "anyon-database-schema":
      return <DatabaseSchemaTool status={status}>{content}</DatabaseSchemaTool>;

    case "anyon-supabase-table-schema":
      return (
        <SupabaseTableSchemaTool table={attributes.table || ""} status={status}>
          {content}
        </SupabaseTableSchemaTool>
      );

    case "anyon-supabase-project-info":
      return (
        <SupabaseProjectInfoTool status={status}>
          {content}
        </SupabaseProjectInfoTool>
      );

    case "anyon-status":
      return (
        <StatusTool title={attributes.title || "Processing..."} status={status}>
          {content}
        </StatusTool>
      );

    case "anyon-write-plan":
      return (
        <WritePlanTool
          title={attributes.title || "Implementation Plan"}
          summary={attributes.summary}
          complete={attributes.complete}
          status={status}
        >
          {content}
        </WritePlanTool>
      );

    case "anyon-exit-plan":
      return <ExitPlanTool notes={attributes.notes} />;

    case "opencode-tool":
      return (
        <OpenCodeToolTool
          name={attributes.name || ""}
          status={attributes.status || "running"}
          title={attributes.title || attributes.name || ""}
        >
          {content}
        </OpenCodeToolTool>
      );

    default:
      return null;
  }
}
