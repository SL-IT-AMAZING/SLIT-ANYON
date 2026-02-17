import {
  ChevronsDownUp,
  ChevronsUpDown,
  CircleX,
  Loader,
  Rabbit,
} from "lucide-react";
import type React from "react";
import type { ReactNode } from "react";
import { useState } from "react";
import { CodeHighlight } from "./CodeHighlight";
import type { CustomTagState } from "./stateTypes";

interface AnyonEditProps {
  children?: ReactNode;
  node?: any;
  path?: string;
  description?: string;
}

export const AnyonEdit: React.FC<AnyonEditProps> = ({
  children,
  node,
  path: pathProp,
  description: descriptionProp,
}) => {
  const [isContentVisible, setIsContentVisible] = useState(false);

  // Use props directly if provided, otherwise extract from node
  const path = pathProp || node?.properties?.path || "";
  const description = descriptionProp || node?.properties?.description || "";
  const state = node?.properties?.state as CustomTagState;
  const inProgress = state === "pending";
  const aborted = state === "aborted";

  // Extract filename from path
  const fileName = path ? path.split("/").pop() : "";

  return (
    <div
      className={`bg-(--background-lightest) hover:bg-(--background-lighter) rounded-lg px-4 py-2 border my-2 cursor-pointer ${
        inProgress
          ? "border-amber-500"
          : aborted
            ? "border-red-500"
            : "border-border"
      }`}
      onClick={() => setIsContentVisible(!isContentVisible)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <Rabbit size={16} />
            <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded ml-1 font-medium">
              Turbo Edit
            </span>
          </div>
          {fileName && (
            <span className="text-muted-foreground font-medium text-sm">
              {fileName}
            </span>
          )}
          {inProgress && (
            <div className="flex items-center text-amber-600 text-xs">
              <Loader size={14} className="mr-1 animate-spin" />
              <span>Editing...</span>
            </div>
          )}
          {aborted && (
            <div className="flex items-center text-red-600 text-xs">
              <CircleX size={14} className="mr-1" />
              <span>Did not finish</span>
            </div>
          )}
        </div>
        <div className="flex items-center">
          {isContentVisible ? (
            <ChevronsDownUp
              size={20}
              className="text-muted-foreground hover:text-accent-foreground"
            />
          ) : (
            <ChevronsUpDown
              size={20}
              className="text-muted-foreground hover:text-accent-foreground"
            />
          )}
        </div>
      </div>
      {path && (
        <div className="text-xs text-muted-foreground font-medium mb-1">
          {path}
        </div>
      )}
      {description && (
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">Summary: </span>
          {description}
        </div>
      )}
      {isContentVisible && (
        <div
          className="text-xs cursor-text"
          onClick={(e) => e.stopPropagation()}
        >
          <CodeHighlight className="language-typescript">
            {children}
          </CodeHighlight>
        </div>
      )}
    </div>
  );
};
