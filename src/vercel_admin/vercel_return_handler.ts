import { writeSettings } from "../main/settings";

export function handleVercelOAuthReturn({
  token,
  refreshToken,
  expiresIn,
  teamId,
  installationId,
}: {
  token: string;
  refreshToken?: string;
  expiresIn?: number;
  teamId?: string;
  installationId?: string;
}) {
  writeSettings({
    vercel: {
      accessToken: {
        value: token,
      },
      ...(refreshToken && {
        refreshToken: {
          value: refreshToken,
        },
      }),
      ...(expiresIn !== undefined && { expiresIn }),
      tokenTimestamp: Math.floor(Date.now() / 1000),
      ...(teamId && { teamId }),
      ...(installationId && { installationId }),
    },
  });
}
