import { normalizePath } from "../../../shared/normalizePath";
import { unescapeXmlAttr, unescapeXmlContent } from "../../../shared/xmlEscape";
import log from "electron-log";
import { SqlQuery } from "../../lib/schemas";

const logger = log.scope("anyon_tag_parser");

export function getAnyonWriteTags(fullResponse: string): {
  path: string;
  content: string;
  description?: string;
}[] {
  const anyonWriteRegex = /<anyon-write([^>]*)>([\s\S]*?)<\/anyon-write>/gi;
  const pathRegex = /path="([^"]+)"/;
  const descriptionRegex = /description="([^"]+)"/;

  let match;
  const tags: { path: string; content: string; description?: string }[] = [];

  while ((match = anyonWriteRegex.exec(fullResponse)) !== null) {
    const attributesString = match[1];
    let content = unescapeXmlContent(match[2].trim());

    const pathMatch = pathRegex.exec(attributesString);
    const descriptionMatch = descriptionRegex.exec(attributesString);

    if (pathMatch && pathMatch[1]) {
      const path = unescapeXmlAttr(pathMatch[1]);
      const description = descriptionMatch?.[1]
        ? unescapeXmlAttr(descriptionMatch[1])
        : undefined;

      const contentLines = content.split("\n");
      if (contentLines[0]?.startsWith("```")) {
        contentLines.shift();
      }
      if (contentLines[contentLines.length - 1]?.startsWith("```")) {
        contentLines.pop();
      }
      content = contentLines.join("\n");

      tags.push({ path: normalizePath(path), content, description });
    } else {
      logger.warn(
        "Found <anyon-write> tag without a valid 'path' attribute:",
        match[0],
      );
    }
  }
  return tags;
}

export function getAnyonRenameTags(fullResponse: string): {
  from: string;
  to: string;
}[] {
  const anyonRenameRegex =
    /<anyon-rename from="([^"]+)" to="([^"]+)"[^>]*>([\s\S]*?)<\/anyon-rename>/g;
  let match;
  const tags: { from: string; to: string }[] = [];
  while ((match = anyonRenameRegex.exec(fullResponse)) !== null) {
    tags.push({
      from: normalizePath(unescapeXmlAttr(match[1])),
      to: normalizePath(unescapeXmlAttr(match[2])),
    });
  }
  return tags;
}

export function getAnyonDeleteTags(fullResponse: string): string[] {
  const anyonDeleteRegex =
    /<anyon-delete path="([^"]+)"[^>]*>([\s\S]*?)<\/anyon-delete>/g;
  let match;
  const paths: string[] = [];
  while ((match = anyonDeleteRegex.exec(fullResponse)) !== null) {
    paths.push(normalizePath(unescapeXmlAttr(match[1])));
  }
  return paths;
}

export function getAnyonAddDependencyTags(fullResponse: string): string[] {
  const anyonAddDependencyRegex =
    /<anyon-add-dependency packages="([^"]+)">[^<]*<\/anyon-add-dependency>/g;
  let match;
  const packages: string[] = [];
  while ((match = anyonAddDependencyRegex.exec(fullResponse)) !== null) {
    packages.push(...unescapeXmlAttr(match[1]).split(" "));
  }
  return packages;
}

export function getAnyonChatSummaryTag(fullResponse: string): string | null {
  const anyonChatSummaryRegex =
    /<anyon-chat-summary>([\s\S]*?)<\/anyon-chat-summary>/g;
  const match = anyonChatSummaryRegex.exec(fullResponse);
  if (match && match[1]) {
    return unescapeXmlContent(match[1].trim());
  }
  return null;
}

export function getAnyonExecuteSqlTags(fullResponse: string): SqlQuery[] {
  const anyonExecuteSqlRegex =
    /<anyon-execute-sql([^>]*)>([\s\S]*?)<\/anyon-execute-sql>/g;
  const descriptionRegex = /description="([^"]+)"/;
  let match;
  const queries: { content: string; description?: string }[] = [];

  while ((match = anyonExecuteSqlRegex.exec(fullResponse)) !== null) {
    const attributesString = match[1] || "";
    let content = unescapeXmlContent(match[2].trim());
    const descriptionMatch = descriptionRegex.exec(attributesString);
    const description = descriptionMatch?.[1]
      ? unescapeXmlAttr(descriptionMatch[1])
      : undefined;

    // Handle markdown code blocks if present
    const contentLines = content.split("\n");
    if (contentLines[0]?.startsWith("```")) {
      contentLines.shift();
    }
    if (contentLines[contentLines.length - 1]?.startsWith("```")) {
      contentLines.pop();
    }
    content = contentLines.join("\n");

    queries.push({ content, description });
  }

  return queries;
}

export function getAnyonCommandTags(fullResponse: string): string[] {
  const anyonCommandRegex =
    /<anyon-command type="([^"]+)"[^>]*><\/anyon-command>/g;
  let match;
  const commands: string[] = [];

  while ((match = anyonCommandRegex.exec(fullResponse)) !== null) {
    commands.push(unescapeXmlAttr(match[1]));
  }

  return commands;
}

export function getAnyonSearchReplaceTags(fullResponse: string): {
  path: string;
  content: string;
  description?: string;
}[] {
  const anyonSearchReplaceRegex =
    /<anyon-search-replace([^>]*)>([\s\S]*?)<\/anyon-search-replace>/gi;
  const pathRegex = /path="([^"]+)"/;
  const descriptionRegex = /description="([^"]+)"/;

  let match;
  const tags: { path: string; content: string; description?: string }[] = [];

  while ((match = anyonSearchReplaceRegex.exec(fullResponse)) !== null) {
    const attributesString = match[1] || "";
    let content = unescapeXmlContent(match[2].trim());

    const pathMatch = pathRegex.exec(attributesString);
    const descriptionMatch = descriptionRegex.exec(attributesString);

    if (pathMatch && pathMatch[1]) {
      const path = unescapeXmlAttr(pathMatch[1]);
      const description = descriptionMatch?.[1]
        ? unescapeXmlAttr(descriptionMatch[1])
        : undefined;

      // Handle markdown code fences if present
      const contentLines = content.split("\n");
      if (contentLines[0]?.startsWith("```")) {
        contentLines.shift();
      }
      if (contentLines[contentLines.length - 1]?.startsWith("```")) {
        contentLines.pop();
      }
      content = contentLines.join("\n");

      tags.push({ path: normalizePath(path), content, description });
    } else {
      logger.warn(
        "Found <anyon-search-replace> tag without a valid 'path' attribute:",
        match[0],
      );
    }
  }
  return tags;
}
