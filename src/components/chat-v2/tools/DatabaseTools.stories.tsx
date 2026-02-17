import type { Meta, StoryObj } from "@storybook/react";
import { ExecuteSqlTool } from "./ExecuteSqlTool";
import { DatabaseSchemaTool } from "./DatabaseSchemaTool";
import { SupabaseTableSchemaTool } from "./SupabaseTableSchemaTool";
import { SupabaseProjectInfoTool } from "./SupabaseProjectInfoTool";
import { AddDependencyTool } from "./AddDependencyTool";
import { AddIntegrationTool } from "./AddIntegrationTool";

const meta: Meta = {
  title: "chat-v2/tools/DatabaseTools",
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

export const ExecuteSqlRunning: StoryObj = {
  render: () => (
    <ExecuteSqlTool description="Fetch active users" status="running">
      {`SELECT id, name, email\nFROM users\nWHERE active = true\nORDER BY created_at DESC\nLIMIT 50;`}
    </ExecuteSqlTool>
  ),
};

export const ExecuteSqlCompleted: StoryObj = {
  render: () => (
    <ExecuteSqlTool description="Insert new record" status="completed">
      {`INSERT INTO posts (title, body, author_id)\nVALUES ('Hello World', 'First post content', 1);`}
    </ExecuteSqlTool>
  ),
};

export const DatabaseSchemaCompleted: StoryObj = {
  render: () => (
    <DatabaseSchemaTool status="completed">
      {`CREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  name TEXT NOT NULL,\n  email TEXT UNIQUE NOT NULL,\n  created_at TIMESTAMPTZ DEFAULT now()\n);\n\nCREATE TABLE posts (\n  id SERIAL PRIMARY KEY,\n  title TEXT NOT NULL,\n  body TEXT,\n  author_id INTEGER REFERENCES users(id)\n);`}
    </DatabaseSchemaTool>
  ),
};

export const SupabaseTableSchemaForUsers: StoryObj = {
  render: () => (
    <SupabaseTableSchemaTool table="users" status="completed">
      {`id: uuid (PK, default: gen_random_uuid())\nname: text (NOT NULL)\nemail: text (UNIQUE, NOT NULL)\navatar_url: text\ncreated_at: timestamptz (default: now())\nupdated_at: timestamptz`}
    </SupabaseTableSchemaTool>
  ),
};

export const SupabaseProjectInfoRunning: StoryObj = {
  render: () => (
    <SupabaseProjectInfoTool status="running">
      {`Project: my-app-prod\nRegion: us-east-1\nAPI URL: https://abc123.supabase.co\nStatus: Active`}
    </SupabaseProjectInfoTool>
  ),
};

export const AddDependencyWithPackages: StoryObj = {
  render: () => (
    <AddDependencyTool packages="react-query zod" status="completed">
      {`added 2 packages in 3.2s\n\n+ @tanstack/react-query@5.0.0\n+ zod@3.22.0`}
    </AddDependencyTool>
  ),
};

export const AddIntegrationSupabase: StoryObj = {
  render: () => (
    <AddIntegrationTool provider="Supabase" status="completed">
      {`Integration added: Supabase\nEnvironment variables configured.`}
    </AddIntegrationTool>
  ),
};

export const AllDatabaseToolStates: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-2">
      <ExecuteSqlTool description="Running query" status="running">
        {`SELECT * FROM users;`}
      </ExecuteSqlTool>
      <DatabaseSchemaTool status="completed">
        {`CREATE TABLE users (id SERIAL PRIMARY KEY, name TEXT);`}
      </DatabaseSchemaTool>
      <SupabaseTableSchemaTool table="posts" status="completed">
        {`id: uuid (PK)\ntitle: text\nbody: text`}
      </SupabaseTableSchemaTool>
      <SupabaseProjectInfoTool status="error">
        {`Error: Could not connect to project.`}
      </SupabaseProjectInfoTool>
      <AddDependencyTool packages="lodash dayjs" status="completed">
        {`added 2 packages in 1.8s`}
      </AddDependencyTool>
      <AddIntegrationTool provider="Stripe" status="running" />
    </div>
  ),
};
