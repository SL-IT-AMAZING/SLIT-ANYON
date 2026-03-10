import { z } from "zod";

export const BuiltinCommandNameSchema = z.enum([
  "init-deep",
  "persist-loop",
  "anyon-loop",
  "cancel-persist",
  "refactor",
  "start-work",
  "stop-continuation",
]);

export type BuiltinCommandName = z.infer<typeof BuiltinCommandNameSchema>;
