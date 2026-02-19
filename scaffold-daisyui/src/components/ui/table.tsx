import { cn } from "@/lib/utils";
import {
  type HTMLAttributes,
  type TableHTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
  forwardRef,
} from "react";

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  zebra?: boolean;
  pinRows?: boolean;
  pinCols?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
}

const Table = forwardRef<HTMLTableElement, TableProps>(
  (
    { className, zebra, pinRows, pinCols, size = "md", children, ...props },
    ref,
  ) => {
    return (
      <div className="overflow-x-auto">
        <table
          className={cn(
            "table",
            zebra && "table-zebra",
            pinRows && "table-pin-rows",
            pinCols && "table-pin-cols",
            size !== "md" && `table-${size}`,
            className,
          )}
          ref={ref}
          {...props}
        >
          {children}
        </table>
      </div>
    );
  },
);
Table.displayName = "Table";

const TableHead = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead className={cn(className)} ref={ref} {...props} />
));
TableHead.displayName = "TableHead";

const TableBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody className={cn(className)} ref={ref} {...props} />
));
TableBody.displayName = "TableBody";

const TableRow = forwardRef<
  HTMLTableRowElement,
  HTMLAttributes<HTMLTableRowElement> & { hover?: boolean; active?: boolean }
>(({ className, hover, active, ...props }, ref) => (
  <tr
    className={cn(hover && "hover", active && "active", className)}
    ref={ref}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHeaderCell = forwardRef<
  HTMLTableCellElement,
  ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th className={cn(className)} ref={ref} {...props} />
));
TableHeaderCell.displayName = "TableHeaderCell";

const TableCell = forwardRef<
  HTMLTableCellElement,
  TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td className={cn(className)} ref={ref} {...props} />
));
TableCell.displayName = "TableCell";

export { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell };
