import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "Missing code parameter" },
      { status: 400 },
    );
  }

  const deepLinkUrl = `anyon://auth-return?code=${encodeURIComponent(code)}`;

  const html = `<!DOCTYPE html>
<html>
  <head><title>Redirecting...</title></head>
  <body>
    <p>Redirecting to ANYON...</p>
    <script>
      window.location.href = "${deepLinkUrl}";
      setTimeout(() => {
        document.body.innerHTML = '<p>If ANYON did not open, <a href="${deepLinkUrl}">click here</a>.</p>';
      }, 2000);
    </script>
  </body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
