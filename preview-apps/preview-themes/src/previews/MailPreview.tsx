import { Archive, Inbox, MailOpen, Pencil, Send, Trash2 } from "lucide-react";

const folders = [
  { name: "Inbox", icon: Inbox, count: 12, active: true },
  { name: "Sent", icon: Send, count: 48 },
  { name: "Drafts", icon: Pencil, count: 3 },
  { name: "Trash", icon: Trash2, count: 9 },
];

const emails = [
  {
    from: "Lumen Agency",
    subject: "Campaign performance report",
    preview: "Your Q1 campaign exceeded the target CTR by 18%...",
    time: "09:24",
    unread: true,
  },
  {
    from: "Engineering",
    subject: "Release 4.7 shipped",
    preview: "The deployment is complete, and monitoring is green.",
    time: "08:18",
    unread: true,
  },
  {
    from: "Product Team",
    subject: "Roadmap planning notes",
    preview: "Attached are the drafts for next cycle priorities.",
    time: "Yesterday",
    unread: false,
  },
  {
    from: "Finance",
    subject: "Invoice INV-2041",
    preview: "Please review and approve by Friday.",
    time: "Yesterday",
    unread: false,
  },
  {
    from: "Studio Pixel",
    subject: "Updated design assets",
    preview: "We exported all final icon sets in SVG and PNG.",
    time: "Tue",
    unread: false,
  },
];

export function MailPreview() {
  return (
    <section className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="grid min-h-[680px] xl:grid-cols-[220px_320px_1fr]">
        <aside className="border-r bg-muted/30 p-4">
          <button className="mb-4 inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            <Pencil className="h-4 w-4" />
            Compose
          </button>
          <div className="space-y-1">
            {folders.map((folder) => {
              const Icon = folder.icon;
              return (
                <button
                  key={folder.name}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm ${
                    folder.active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {folder.name}
                  </span>
                  <span className="text-xs">{folder.count}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="border-r bg-background">
          <header className="flex items-center justify-between border-b px-4 py-3">
            <p className="font-medium">Inbox</p>
            <button className="rounded-md p-2 text-muted-foreground hover:bg-muted">
              <Archive className="h-4 w-4" />
            </button>
          </header>
          <ul className="divide-y">
            {emails.map((email) => (
              <li key={`${email.from}-${email.subject}`}>
                <button className="w-full px-4 py-3 text-left hover:bg-muted/50">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="font-medium">{email.from}</p>
                    <span className="text-xs text-muted-foreground">
                      {email.time}
                    </span>
                  </div>
                  <p className="text-sm">{email.subject}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {email.preview}
                  </p>
                  {email.unread && (
                    <span className="mt-2 inline-block h-2 w-2 rounded-full bg-primary" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <article className="bg-background p-5 sm:p-6">
          <div className="mb-4 border-b pb-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              From
            </p>
            <h3 className="mt-1 text-lg font-semibold">Lumen Agency</h3>
            <p className="text-sm text-muted-foreground">
              Campaign performance report
            </p>
          </div>
          <div className="space-y-3 text-sm leading-6">
            <p>Hello team,</p>
            <p>
              Great results this week. The awareness campaign is now
              outperforming our baseline by <strong>18%</strong>
              and conversion has improved by <strong>6.2%</strong>.
            </p>
            <p>Highlights:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Top audience segment: product-led teams (34% of conversions)
              </li>
              <li>Best channel: paid social with reduced CPC</li>
              <li>Recommendation: increase budget by 12% next sprint</li>
            </ul>
            <p>Let us know if you want the full breakdown exported in CSV.</p>
            <p>Best,</p>
            <p>
              <MailOpen className="mr-1 inline h-4 w-4" />
              Morgan from Lumen
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}
