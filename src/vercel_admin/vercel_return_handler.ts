import { writeSettings } from "../main/settings";

export function handleVercelOAuthReturn({
  token,
  refreshToken,
  expiresIn,
}: {
  token: string;
  refreshToken: string;
  expiresIn: number;
}) {
  writeSettings({
    vercel: {
      accessToken: {
        value: token,
      },
      refreshToken: {
        value: refreshToken,
      },
      expiresIn,
      tokenTimestamp: Math.floor(Date.now() / 1000),
    },
  });
}
