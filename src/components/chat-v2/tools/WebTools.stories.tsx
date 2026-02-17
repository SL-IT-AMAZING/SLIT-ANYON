import type { Meta, StoryObj } from "@storybook/react";
import { WebSearchTool } from "./WebSearchTool";
import { WebSearchResultTool } from "./WebSearchResultTool";
import { WebCrawlTool } from "./WebCrawlTool";

const meta: Meta = {
  title: "chat-v2/tools/WebTools",
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

export const SearchRunning: StoryObj = {
  render: () => (
    <WebSearchTool
      query="react server components best practices"
      status="running"
    />
  ),
};

export const SearchCompleted: StoryObj = {
  render: () => (
    <WebSearchTool query="electron ipc architecture" status="completed">
      {`Found 5 results for "electron ipc architecture":
1. Electron IPC Communication - electronjs.org
2. Inter-Process Communication in Electron - blog.example.com
3. Secure IPC patterns for Electron apps - dev.to
4. Building Electron apps with typed IPC - medium.com
5. Electron contextBridge and IPC - stackoverflow.com`}
    </WebSearchTool>
  ),
};

export const SearchError: StoryObj = {
  render: () => (
    <WebSearchTool query="failing search query" status="error">
      {"Network error: Failed to fetch search results"}
    </WebSearchTool>
  ),
};

export const SearchResultRunning: StoryObj = {
  render: () => (
    <WebSearchResultTool status="running">
      {"Loading search result content..."}
    </WebSearchResultTool>
  ),
};

export const SearchResultCompleted: StoryObj = {
  render: () => (
    <WebSearchResultTool status="completed">
      {`Electron uses a multi-process architecture with a main process and renderer processes. The main process manages application lifecycle and native APIs, while renderer processes handle the UI. Communication between them happens through Inter-Process Communication (IPC) channels using ipcMain and ipcRenderer modules.

Best practices include validating all IPC inputs, using contextBridge for secure preload scripts, and avoiding the remote module for security reasons.`}
    </WebSearchResultTool>
  ),
};

export const CrawlRunning: StoryObj = {
  render: () => (
    <WebCrawlTool status="running">
      {"Crawling https://example.com/docs/getting-started ..."}
    </WebCrawlTool>
  ),
};

export const CrawlCompleted: StoryObj = {
  render: () => (
    <WebCrawlTool status="completed">
      {`# Getting Started

Welcome to the documentation. This guide will help you set up your development environment.

## Prerequisites
- Node.js 18+
- npm or yarn
- Git

## Installation
Run the following command to install dependencies:
  npm install

## Configuration
Create a .env file in the project root with your settings.`}
    </WebCrawlTool>
  ),
};

export const AllWebTools: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-2">
      <WebSearchTool query="react server components" status="running" />
      <WebSearchTool
        query="electron security best practices"
        status="completed"
      >
        {`Found 3 results for "electron security best practices"`}
      </WebSearchTool>
      <WebSearchResultTool status="completed">
        {
          "Electron security involves using contextBridge, validating IPC inputs, and enabling sandboxing for renderer processes."
        }
      </WebSearchResultTool>
      <WebCrawlTool status="completed">
        {`# Security Checklist\n- Enable contextIsolation\n- Use contextBridge\n- Validate all IPC inputs\n- Disable nodeIntegration`}
      </WebCrawlTool>
      <WebSearchTool query="network failure example" status="error">
        {"Request timed out after 30s"}
      </WebSearchTool>
    </div>
  ),
};
