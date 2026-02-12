import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { AnyonWrite } from "./AnyonWrite";
import { AnyonRename } from "./AnyonRename";
import { AnyonDelete } from "./AnyonDelete";
import { AnyonAddDependency } from "./AnyonAddDependency";
import { AnyonExecuteSql } from "./AnyonExecuteSql";
import { AnyonLogs } from "./AnyonLogs";
import { AnyonGrep } from "./AnyonGrep";
import { AnyonAddIntegration } from "./AnyonAddIntegration";
import { AnyonEdit } from "./AnyonEdit";
import { AnyonSearchReplace } from "./AnyonSearchReplace";
import { AnyonCodebaseContext } from "./AnyonCodebaseContext";
import { AnyonThink } from "./AnyonThink";
import { CodeHighlight } from "./CodeHighlight";
import { useAtomValue } from "jotai";
import { isStreamingByIdAtom, selectedChatIdAtom } from "@/atoms/chatAtoms";
import { CustomTagState } from "./stateTypes";
import { AnyonOutput } from "./AnyonOutput";
import { AnyonProblemSummary } from "./AnyonProblemSummary";
import { ipc } from "@/ipc/types";
import { AnyonMcpToolCall } from "./AnyonMcpToolCall";
import { AnyonMcpToolResult } from "./AnyonMcpToolResult";
import { AnyonWebSearchResult } from "./AnyonWebSearchResult";
import { AnyonWebSearch } from "./AnyonWebSearch";
import { AnyonWebCrawl } from "./AnyonWebCrawl";
import { AnyonCodeSearchResult } from "./AnyonCodeSearchResult";
import { AnyonCodeSearch } from "./AnyonCodeSearch";
import { AnyonRead } from "./AnyonRead";
import { AnyonListFiles } from "./AnyonListFiles";
import { AnyonDatabaseSchema } from "./AnyonDatabaseSchema";
import { AnyonSupabaseTableSchema } from "./AnyonSupabaseTableSchema";
import { AnyonSupabaseProjectInfo } from "./AnyonSupabaseProjectInfo";
import { AnyonStatus } from "./AnyonStatus";
import { AnyonWritePlan } from "./AnyonWritePlan";
import { AnyonExitPlan } from "./AnyonExitPlan";
import { OpenCodeTool } from "./OpenCodeTool";
import { mapActionToButton } from "./ChatInput";
import { SuggestedAction } from "@/lib/schemas";
import { FixAllErrorsButton } from "./FixAllErrorsButton";
import { unescapeXmlAttr, unescapeXmlContent } from "../../../shared/xmlEscape";

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

type CustomTagInfo = {
  tag: string;
  attributes: Record<string, string>;
  content: string;
  fullMatch: string;
  inProgress?: boolean;
};

type ContentPiece =
  | { type: "markdown"; content: string }
  | { type: "custom-tag"; tagInfo: CustomTagInfo };

const customLink = ({
  node: _node,
  ...props
}: {
  node?: any;
  [key: string]: any;
}) => (
  <a
    {...props}
    onClick={(e) => {
      const url = props.href;
      if (url) {
        e.preventDefault();
        ipc.system.openExternalUrl(url);
      }
    }}
  />
);

export const VanillaMarkdownParser = ({ content }: { content: string }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code: CodeHighlight,
        a: customLink,
      }}
    >
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
                  components={{
                    code: CodeHighlight,
                    a: customLink,
                  }}
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

function getState({
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
function renderCustomTag(
  tagInfo: CustomTagInfo,
  { isStreaming }: { isStreaming: boolean },
): React.ReactNode {
  const { tag, attributes, content, inProgress } = tagInfo;

  switch (tag) {
    case "anyon-read":
      return (
        <AnyonRead
          node={{
            properties: {
              path: attributes.path || "",
            },
          }}
        >
          {content}
        </AnyonRead>
      );
    case "anyon-web-search":
      return (
        <AnyonWebSearch
          node={{
            properties: {
              query: attributes.query || "",
              state: getState({ isStreaming, inProgress }),
            },
          }}
        >
          {content}
        </AnyonWebSearch>
      );
    case "anyon-web-crawl":
      return (
        <AnyonWebCrawl
          node={{
            properties: {},
          }}
        >
          {content}
        </AnyonWebCrawl>
      );
    case "anyon-code-search":
      return (
        <AnyonCodeSearch
          node={{
            properties: {
              query: attributes.query || "",
              state: getState({ isStreaming, inProgress }),
            },
          }}
        >
          {content}
        </AnyonCodeSearch>
      );
    case "anyon-code-search-result":
      return (
        <AnyonCodeSearchResult
          node={{
            properties: {},
          }}
        >
          {content}
        </AnyonCodeSearchResult>
      );
    case "anyon-web-search-result":
      return (
        <AnyonWebSearchResult
          node={{
            properties: {
              state: getState({ isStreaming, inProgress }),
            },
          }}
        >
          {content}
        </AnyonWebSearchResult>
      );
    case "think":
      return (
        <AnyonThink
          node={{
            properties: {
              state: getState({ isStreaming, inProgress }),
            },
          }}
        >
          {content}
        </AnyonThink>
      );
    case "anyon-write":
      return (
        <AnyonWrite
          node={{
            properties: {
              path: attributes.path || "",
              description: attributes.description || "",
              state: getState({ isStreaming, inProgress }),
            },
          }}
        >
          {content}
        </AnyonWrite>
      );

    case "anyon-rename":
      return (
        <AnyonRename
          node={{
            properties: {
              from: attributes.from || "",
              to: attributes.to || "",
            },
          }}
        >
          {content}
        </AnyonRename>
      );

    case "anyon-delete":
      return (
        <AnyonDelete
          node={{
            properties: {
              path: attributes.path || "",
            },
          }}
        >
          {content}
        </AnyonDelete>
      );

    case "anyon-add-dependency":
      return (
        <AnyonAddDependency
          node={{
            properties: {
              packages: attributes.packages || "",
            },
          }}
        >
          {content}
        </AnyonAddDependency>
      );

    case "anyon-execute-sql":
      return (
        <AnyonExecuteSql
          node={{
            properties: {
              state: getState({ isStreaming, inProgress }),
              description: attributes.description || "",
            },
          }}
        >
          {content}
        </AnyonExecuteSql>
      );

    case "anyon-read-logs":
      return (
        <AnyonLogs
          node={{
            properties: {
              state: getState({ isStreaming, inProgress }),
              time: attributes.time || "",
              type: attributes.type || "",
              level: attributes.level || "",
              count: attributes.count || "",
            },
          }}
        >
          {content}
        </AnyonLogs>
      );

    case "anyon-grep":
      return (
        <AnyonGrep
          node={{
            properties: {
              state: getState({ isStreaming, inProgress }),
              query: attributes.query || "",
              include: attributes.include || "",
              exclude: attributes.exclude || "",
              "case-sensitive": attributes["case-sensitive"] || "",
              count: attributes.count || "",
            },
          }}
        >
          {content}
        </AnyonGrep>
      );

    case "anyon-add-integration":
      return (
        <AnyonAddIntegration
          node={{
            properties: {
              provider: attributes.provider || "",
            },
          }}
        >
          {content}
        </AnyonAddIntegration>
      );

    case "anyon-edit":
      return (
        <AnyonEdit
          node={{
            properties: {
              path: attributes.path || "",
              description: attributes.description || "",
              state: getState({ isStreaming, inProgress }),
            },
          }}
        >
          {content}
        </AnyonEdit>
      );

    case "anyon-search-replace":
      return (
        <AnyonSearchReplace
          node={{
            properties: {
              path: attributes.path || "",
              description: attributes.description || "",
              state: getState({ isStreaming, inProgress }),
            },
          }}
        >
          {content}
        </AnyonSearchReplace>
      );

    case "anyon-codebase-context":
      return (
        <AnyonCodebaseContext
          node={{
            properties: {
              files: attributes.files || "",
              state: getState({ isStreaming, inProgress }),
            },
          }}
        >
          {content}
        </AnyonCodebaseContext>
      );

    case "anyon-mcp-tool-call":
      return (
        <AnyonMcpToolCall
          node={{
            properties: {
              serverName: attributes.server || "",
              toolName: attributes.tool || "",
            },
          }}
        >
          {content}
        </AnyonMcpToolCall>
      );

    case "anyon-mcp-tool-result":
      return (
        <AnyonMcpToolResult
          node={{
            properties: {
              serverName: attributes.server || "",
              toolName: attributes.tool || "",
            },
          }}
        >
          {content}
        </AnyonMcpToolResult>
      );

    case "anyon-output":
      return (
        <AnyonOutput
          type={attributes.type as "warning" | "error"}
          message={attributes.message}
        >
          {content}
        </AnyonOutput>
      );

    case "anyon-problem-report":
      return (
        <AnyonProblemSummary summary={attributes.summary}>
          {content}
        </AnyonProblemSummary>
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
        <AnyonListFiles
          node={{
            properties: {
              directory: attributes.directory || "",
              recursive: attributes.recursive || "",
              state: getState({ isStreaming, inProgress }),
            },
          }}
        >
          {content}
        </AnyonListFiles>
      );

    case "anyon-database-schema":
      return (
        <AnyonDatabaseSchema
          node={{
            properties: {
              state: getState({ isStreaming, inProgress }),
            },
          }}
        >
          {content}
        </AnyonDatabaseSchema>
      );

    case "anyon-supabase-table-schema":
      return (
        <AnyonSupabaseTableSchema
          node={{
            properties: {
              table: attributes.table || "",
              state: getState({ isStreaming, inProgress }),
            },
          }}
        >
          {content}
        </AnyonSupabaseTableSchema>
      );

    case "anyon-supabase-project-info":
      return (
        <AnyonSupabaseProjectInfo
          node={{
            properties: {
              state: getState({ isStreaming, inProgress }),
            },
          }}
        >
          {content}
        </AnyonSupabaseProjectInfo>
      );

    case "anyon-status":
      return (
        <AnyonStatus
          node={{
            properties: {
              title: attributes.title || "Processing...",
              state: getState({ isStreaming, inProgress }),
            },
          }}
        >
          {content}
        </AnyonStatus>
      );

    case "anyon-write-plan":
      return (
        <AnyonWritePlan
          node={{
            properties: {
              title: attributes.title || "Implementation Plan",
              summary: attributes.summary,
              complete: attributes.complete,
              state: getState({ isStreaming, inProgress }),
            },
          }}
        >
          {content}
        </AnyonWritePlan>
      );

    case "anyon-exit-plan":
      return (
        <AnyonExitPlan
          node={{
            properties: {
              notes: attributes.notes,
            },
          }}
        />
      );

    case "opencode-tool":
      return (
        <OpenCodeTool
          name={attributes.name || ""}
          status={attributes.status || "running"}
          title={attributes.title || attributes.name || ""}
        >
          {content}
        </OpenCodeTool>
      );

    default:
      return null;
  }
}
