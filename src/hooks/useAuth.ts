import { ipc } from "@/ipc/types";
import type { AuthUser } from "@/ipc/types";
import { queryKeys } from "@/lib/queryKeys";
import { showError } from "@/lib/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useAuth() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.auth.state,
    queryFn: () => ipc.auth.getAuthState(),
  });

  const loginGoogleMutation = useMutation({
    mutationFn: () => ipc.auth.loginWithGoogle(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.state });
      queryClient.invalidateQueries({ queryKey: queryKeys.entitlement.all });
    },
    onError: (error: Error) => {
      showError(error);
    },
  });

  const loginEmailMutation = useMutation({
    mutationFn: (params: { email: string; password: string }) =>
      ipc.auth.loginWithEmail(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.state });
      queryClient.invalidateQueries({ queryKey: queryKeys.entitlement.all });
    },
    onError: (error: Error) => {
      showError(error);
    },
  });

  const signUpEmailMutation = useMutation({
    mutationFn: (params: { email: string; password: string }) =>
      ipc.auth.signUpWithEmail(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.state });
    },
    onError: (error: Error) => {
      showError(error);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => ipc.auth.logout(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.state });
      queryClient.invalidateQueries({ queryKey: queryKeys.entitlement.all });
    },
    onError: (error: Error) => {
      showError(error);
    },
  });

  const refreshMutation = useMutation({
    mutationFn: () => ipc.auth.refreshSession(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.state });
    },
    onError: (error: Error) => {
      showError(error);
    },
  });

  const loginWithGoogle = async (): Promise<void> => {
    await loginGoogleMutation.mutateAsync();
  };

  const loginWithEmail = async (
    email: string,
    password: string,
  ): Promise<void> => {
    await loginEmailMutation.mutateAsync({ email, password });
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
  ): Promise<void> => {
    await signUpEmailMutation.mutateAsync({ email, password });
  };

  const logout = async (): Promise<void> => {
    await logoutMutation.mutateAsync();
  };

  const refreshSession = async (): Promise<void> => {
    await refreshMutation.mutateAsync();
  };

  return {
    user: (data?.user ?? null) as AuthUser | null,
    isAuthenticated: data?.isAuthenticated ?? false,
    isLoading,
    isLoginPending:
      loginGoogleMutation.isPending || loginEmailMutation.isPending,
    isSignUpPending: signUpEmailMutation.isPending,
    isLogoutPending: logoutMutation.isPending,
    loginWithGoogle,
    loginWithEmail,
    signUpWithEmail,
    logout,
    refreshSession,
  };
}
