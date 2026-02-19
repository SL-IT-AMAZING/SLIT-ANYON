import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown } from "lucide-react";
import { useState } from "react";

interface Invoice {
  id: string;
  status: "paid" | "pending" | "overdue";
  method: string;
  amount: number;
}

const initialInvoices: Invoice[] = [
  { id: "INV-001", status: "paid", method: "Credit Card", amount: 250.0 },
  { id: "INV-002", status: "pending", method: "PayPal", amount: 150.0 },
  { id: "INV-003", status: "overdue", method: "Bank Transfer", amount: 350.0 },
  { id: "INV-004", status: "paid", method: "Credit Card", amount: 450.0 },
  { id: "INV-005", status: "paid", method: "PayPal", amount: 550.0 },
  { id: "INV-006", status: "pending", method: "Bank Transfer", amount: 200.0 },
  { id: "INV-007", status: "paid", method: "Credit Card", amount: 300.0 },
];

interface User {
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  joined: string;
}

const users: User[] = [
  {
    name: "Alice Johnson",
    email: "alice@example.com",
    role: "Admin",
    status: "active",
    joined: "Jan 2024",
  },
  {
    name: "Bob Smith",
    email: "bob@example.com",
    role: "Editor",
    status: "active",
    joined: "Feb 2024",
  },
  {
    name: "Carol White",
    email: "carol@example.com",
    role: "Viewer",
    status: "inactive",
    joined: "Mar 2024",
  },
  {
    name: "David Brown",
    email: "david@example.com",
    role: "Editor",
    status: "active",
    joined: "Apr 2024",
  },
  {
    name: "Eve Davis",
    email: "eve@example.com",
    role: "Admin",
    status: "active",
    joined: "May 2024",
  },
];

const statusVariant = {
  paid: "default" as const,
  active: "default" as const,
  pending: "secondary" as const,
  inactive: "secondary" as const,
  overdue: "destructive" as const,
};

export function TablePreview() {
  const [sortAsc, setSortAsc] = useState(true);
  const [invoices, setInvoices] = useState(initialInvoices);

  const handleSort = () => {
    setSortAsc(!sortAsc);
    setInvoices(
      [...invoices].sort((a, b) =>
        sortAsc ? a.amount - b.amount : b.amount - a.amount,
      ),
    );
  };

  const total = invoices.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tables</h2>
        <p className="text-muted-foreground mt-1">
          Structured data display with headers, rows, and sorting.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Invoices</CardTitle>
          <CardDescription>
            Recent invoices with sortable amount column. Click the amount header
            to sort.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>A list of recent invoices.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Invoice</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8"
                    onClick={handleSort}
                  >
                    Amount
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.id}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[inv.status]}>
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{inv.method}</TableCell>
                  <TableCell className="text-right font-mono">
                    ${inv.amount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end border-t pt-4 mt-2">
            <div className="text-sm">
              <span className="text-muted-foreground">Total: </span>
              <span className="font-semibold font-mono">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Members</CardTitle>
          <CardDescription>
            A table displaying team member information with roles and status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.email}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[user.status]}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{user.joined}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
