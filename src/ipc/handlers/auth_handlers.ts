import {
  getAuthState,
  loginWithEmail,
  loginWithGoogle,
  logout,
  refreshSession,
  signUpWithEmail,
} from "../../main/auth";
import { authContracts } from "../types/auth";
import { createTypedHandler } from "./base";

export function registerAuthHandlers() {
  createTypedHandler(authContracts.getAuthState, async () => {
    return getAuthState();
  });

  createTypedHandler(authContracts.loginWithGoogle, async () => {
    return loginWithGoogle();
  });

  createTypedHandler(authContracts.loginWithEmail, async (_, input) => {
    return loginWithEmail(input.email, input.password);
  });

  createTypedHandler(authContracts.signUpWithEmail, async (_, input) => {
    return signUpWithEmail(input.email, input.password);
  });

  createTypedHandler(authContracts.logout, async () => {
    return logout();
  });

  createTypedHandler(authContracts.refreshSession, async () => {
    return refreshSession();
  });
}
