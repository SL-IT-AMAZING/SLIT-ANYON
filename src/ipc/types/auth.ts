import { z } from "zod";
import { createClient, defineContract } from "../contracts/core";

export const AuthUserSchema = z.object({
  id: z.string(),
  email: z.string().optional(),
  displayName: z.string().optional(),
  avatarUrl: z.string().optional(),
  provider: z.enum(["google", "email"]),
});

export type AuthUser = z.infer<typeof AuthUserSchema>;

export const AuthStateSchema = z.object({
  user: AuthUserSchema.nullable(),
  accessToken: z.string().nullable(),
  isAuthenticated: z.boolean(),
});

export type AuthState = z.infer<typeof AuthStateSchema>;

export const EmailPasswordInputSchema = z.object({
  email: z.string(),
  password: z.string(),
});

/**
 * Auth contracts define the IPC interface for user authentication.
 */
export const authContracts = {
  /**
   * Get current auth state from persisted session.
   */
  getAuthState: defineContract({
    channel: "auth:get-state",
    input: z.void(),
    output: AuthStateSchema,
  }),

  /**
   * Start Google OAuth login flow.
   * Returns the external URL to open in a browser.
   */
  loginWithGoogle: defineContract({
    channel: "auth:login-google",
    input: z.void(),
    output: z.object({ url: z.string() }),
  }),

  /**
   * Log in with email and password credentials.
   */
  loginWithEmail: defineContract({
    channel: "auth:login-email",
    input: EmailPasswordInputSchema,
    output: AuthStateSchema,
  }),

  /**
   * Create an account with email and password credentials.
   */
  signUpWithEmail: defineContract({
    channel: "auth:signup-email",
    input: EmailPasswordInputSchema,
    output: AuthStateSchema,
  }),

  /**
   * Log out the current user and clear persisted auth tokens.
   */
  logout: defineContract({
    channel: "auth:logout",
    input: z.void(),
    output: z.object({ success: z.boolean() }),
  }),

  /**
   * Refresh the current auth session using refresh token.
   */
  refreshSession: defineContract({
    channel: "auth:refresh-session",
    input: z.void(),
    output: AuthStateSchema,
  }),
} as const;

export const authClient = createClient(authContracts);

export type GetAuthStateInput = z.infer<
  (typeof authContracts)["getAuthState"]["input"]
>;

export type GetAuthStateOutput = z.infer<
  (typeof authContracts)["getAuthState"]["output"]
>;

export type LoginWithGoogleInput = z.infer<
  (typeof authContracts)["loginWithGoogle"]["input"]
>;

export type LoginWithGoogleOutput = z.infer<
  (typeof authContracts)["loginWithGoogle"]["output"]
>;

export type LoginWithEmailInput = z.infer<
  (typeof authContracts)["loginWithEmail"]["input"]
>;

export type LoginWithEmailOutput = z.infer<
  (typeof authContracts)["loginWithEmail"]["output"]
>;

export type SignUpWithEmailInput = z.infer<
  (typeof authContracts)["signUpWithEmail"]["input"]
>;

export type SignUpWithEmailOutput = z.infer<
  (typeof authContracts)["signUpWithEmail"]["output"]
>;

export type LogoutInput = z.infer<(typeof authContracts)["logout"]["input"]>;

export type LogoutOutput = z.infer<(typeof authContracts)["logout"]["output"]>;

export type RefreshSessionInput = z.infer<
  (typeof authContracts)["refreshSession"]["input"]
>;

export type RefreshSessionOutput = z.infer<
  (typeof authContracts)["refreshSession"]["output"]
>;
