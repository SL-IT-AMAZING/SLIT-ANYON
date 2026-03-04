import {
  Bell,
  CheckCircle2,
  CreditCard,
  DollarSign,
  TrendingUp,
  User,
  Users,
} from "lucide-react";

const team = [
  { name: "Mina Park", role: "Design Lead", status: "Online" },
  { name: "Arjun Shah", role: "Frontend Engineer", status: "In focus mode" },
  { name: "Lena Rossi", role: "Product Manager", status: "Reviewing roadmap" },
];

export function CardsPreview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Cards</h1>
        <p className="text-sm text-muted-foreground">
          A mix of practical card layouts for app surfaces.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-xl border bg-card p-5 text-card-foreground shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Monthly Revenue</p>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-semibold tracking-tight">$48,294</p>
          <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-xs text-accent-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            +12.4% this month
          </div>
        </article>

        <article className="rounded-xl border bg-card p-5 text-card-foreground shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/15 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Harper Stone</p>
              <p className="text-sm text-muted-foreground">Growth Strategist</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Building lifecycle experiments and retention campaigns.
          </p>
          <button className="mt-4 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90">
            View profile
          </button>
        </article>

        <article className="rounded-xl border bg-card p-5 text-card-foreground shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-medium">Payment Method</p>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            <div className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
              Cardholder Name
            </div>
            <div className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
              •••• •••• •••• 8421
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
                08/28
              </div>
              <div className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
                CVC
              </div>
            </div>
            <button className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
              Save card
            </button>
          </div>
        </article>

        <article className="rounded-xl border bg-card p-5 text-card-foreground shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <p className="font-medium">Notifications</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="rounded-md border bg-background p-3">
              New payout scheduled for Friday, 4:00 PM.
            </div>
            <div className="rounded-md border bg-background p-3">
              3 approval requests are waiting for review.
            </div>
            <div className="rounded-md border bg-background p-3">
              API usage reached 76% of your monthly plan.
            </div>
          </div>
        </article>

        <article className="rounded-xl border bg-card p-5 text-card-foreground shadow-sm">
          <p className="mb-3 font-medium">Workspace Settings</p>
          <div className="space-y-3 text-sm">
            {[
              "Enable multi-factor authentication",
              "Weekly digest emails",
              "Auto-archive inactive projects",
            ].map((item, index) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-md border bg-background p-3"
              >
                <span>{item}</span>
                <span
                  className={`h-5 w-9 rounded-full p-0.5 transition-colors ${
                    index === 1 ? "bg-muted" : "bg-primary"
                  }`}
                >
                  <span
                    className={`block h-4 w-4 rounded-full bg-card transition-transform ${
                      index === 1 ? "translate-x-0" : "translate-x-4"
                    }`}
                  />
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border bg-card p-5 text-card-foreground shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4" />
            <p className="font-medium">Team Members</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((member) => (
              <div
                key={member.name}
                className="rounded-md border bg-background p-3"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-secondary-foreground">
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.role}
                    </p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  {member.status}
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
