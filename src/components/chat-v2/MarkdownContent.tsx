import { ipc } from "@/ipc/types";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import type React from "react";
import { useCallback, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

function CodeHeader({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="flex items-center justify-between rounded-t-lg border border-border/50 border-b-0 bg-muted/50 px-3 py-1.5">
      <span className="text-xs text-muted-foreground lowercase">
        {language || "text"}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center justify-center size-5 p-0.5 text-muted-foreground hover:text-foreground transition-colors"
      >
        {copied ? (
          <Check className="size-full" />
        ) : (
          <Copy className="size-full" />
        )}
      </button>
    </div>
  );
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  return (
    <div className="my-2.5 flex flex-col">
      <CodeHeader language={language} code={code} />
      <pre className="rounded-t-none rounded-b-lg border border-border/50 bg-muted/30 p-3 text-xs leading-relaxed overflow-x-auto">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}

const customLink = (props: React.ComponentProps<"a">) => (
  <a
    {...props}
    className="text-foreground underline underline-offset-2"
    onClick={(e) => {
      const url = props.href;
      if (url) {
        e.preventDefault();
        ipc.system.openExternalUrl(url);
      }
    }}
  />
);

export const markdownComponents: Components = {
  h1(props) {
    return (
      <h1 className="mb-2 font-semibold text-base text-foreground">
        {props.children}
      </h1>
    );
  },
  h2(props) {
    return (
      <h2 className="mt-3 mb-1.5 font-semibold text-sm text-foreground">
        {props.children}
      </h2>
    );
  },
  h3(props) {
    return (
      <h3 className="mt-2 mb-1 font-semibold text-sm text-foreground">
        {props.children}
      </h3>
    );
  },
  p(props) {
    return (
      <p className="my-2.5 leading-normal text-sm text-foreground">
        {props.children}
      </p>
    );
  },
  ul(props) {
    return (
      <ul className="my-2 ml-4 list-disc text-sm [&>li]:mt-1">
        {props.children}
      </ul>
    );
  },
  ol(props) {
    return (
      <ol className="my-2 ml-4 list-decimal text-sm [&>li]:mt-1">
        {props.children}
      </ol>
    );
  },
  a: customLink,
  blockquote(props) {
    return (
      <blockquote className="border-l-2 border-border pl-4 italic text-muted-foreground">
        {props.children}
      </blockquote>
    );
  },
  table(props) {
    return (
      <table className="border-separate border-spacing-0 w-full text-sm">
        {props.children}
      </table>
    );
  },
  th(props) {
    return (
      <th className="bg-muted px-3 py-1.5 text-left font-medium text-sm first:rounded-tl-lg last:rounded-tr-lg">
        {props.children}
      </th>
    );
  },
  td(props) {
    return (
      <td className="border-t border-border px-3 py-1.5">{props.children}</td>
    );
  },
  hr() {
    return <hr className="my-4 border-border" />;
  },
  pre(props) {
    // Unwrap pre — the code component handles block rendering
    return <>{props.children}</>;
  },
  code(props) {
    const { className, children } = props;
    const langMatch = /language-(\w+)/.exec(className || "");

    if (langMatch) {
      const language = langMatch[1];
      const codeString = String(children).replace(/\n$/, "");
      return <CodeBlock language={language} code={codeString} />;
    }

    const text = String(children);
    if (text.includes("\n")) {
      return <CodeBlock language="" code={text.replace(/\n$/, "")} />;
    }

    return (
      <code className="rounded-md border border-border/50 bg-muted/50 px-1.5 py-0.5 font-mono text-[0.85em]">
        {children}
      </code>
    );
  },
};

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={cn(className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
