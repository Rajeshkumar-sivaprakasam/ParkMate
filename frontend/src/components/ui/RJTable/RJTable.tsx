import React from "react";
import { cn } from "@/lib/utils";
import { RJSpinner } from "../RJSpinner";
import {
  tableVariants,
  type RJTableProps,
  type RJTableColumn,
  type RJTableRowProps,
  type RJTableHeaderProps,
} from "./types";

/**
 * Alignment mapping
 */
const alignMap = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

/**
 * RJTableHeader - Table header component
 */
function RJTableHeader<T extends object = Record<string, unknown>>({
  columns,
  className,
}: RJTableHeaderProps<T>) {
  return (
    <thead
      className={cn(
        "bg-gray-50 border-b border-gray-200",
        className
      )}
    >
      <tr>
        {columns.map((column) => (
          <th
            key={column.key}
            className={cn(
              "px-6 py-3 font-semibold text-gray-700",
              column.align && alignMap[column.align]
            )}
            style={{ width: column.width }}
          >
            {column.header}
          </th>
        ))}
      </tr>
    </thead>
  );
}

/**
 * RJTableRow - Table row component
 */
function RJTableRow<T extends object = Record<string, unknown>>({
  row,
  rowIndex,
  columns,
  clickable,
  onClick,
  className,
}: RJTableRowProps<T>) {
  return (
    <tr
      className={cn(
        "border-b border-gray-100",
        clickable && "cursor-pointer hover:bg-gray-50",
        rowIndex % 2 === 1 && "bg-gray-50/50",
        className
      )}
      onClick={() => clickable && onClick?.(row)}
    >
      {columns.map((column) => {
        // Use custom cell render or default
        const cellContent = column.cell
          ? column.cell(row, rowIndex)
          : (row[column.key as keyof T] as React.ReactNode);

        return (
          <td
            key={column.key}
            className={cn(
              "px-6 py-4 text-gray-700",
              column.align && alignMap[column.align]
            )}
          >
            {cellContent}
          </td>
        );
      })}
    </tr>
  );
}

/**
 * RJTable - A fully customizable table component
 * 
 * @example
 * ```tsx
 * // Basic usage
 * const columns = [
 *   { key: 'name', header: 'Name' },
 *   { key: 'email', header: 'Email' },
 *   { 
 *     key: 'status', 
 *     header: 'Status',
 *     cell: (row) => <RJBadge>{row.status}</RJBadge>
 *   },
 * ];
 * 
 * <RJTable data={users} columns={columns} />
 * 
 * // With options
 * <RJTable 
 *   data={users} 
 *   columns={columns}
 *   striped 
 *   hoverable 
 *   bordered
 * />
 * 
 * // Empty state
 * <RJTable 
 *   data={[]} 
 *   columns={columns}
 *   emptyContent={<p>No data found</p>}
 * />
 * ```
 */
export const RJTable = React.forwardRef<HTMLTableElement, RJTableProps>(
  (
    {
      className,
      size,
      variant,
      data,
      columns,
      showHeader = true,
      hoverable = true,
      striped = false,
      bordered = false,
      emptyContent,
      loading = false,
      loadingSize = "md",
      ...props
    },
    ref
  ) => {
    // Build className based on props
    const tableClassName = cn(
      tableVariants({
        size,
        variant: bordered ? "bordered" : variant,
      }),
      className
    );

    // Loading state
    if (loading) {
      return (
        <div className="w-full">
          <table ref={ref} className={tableClassName}>
            {showHeader && <RJTableHeader columns={columns} />}
            <tbody>
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RJSpinner size={loadingSize} />
                    <span className="text-gray-500">Loading...</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    // Empty state
    if (!data || data.length === 0) {
      return (
        <div className="w-full">
          {showHeader && <table ref={ref} className={tableClassName} {...props} />}
          {emptyContent ? (
            <div className="py-12 text-center">
              {emptyContent}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              No data available
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="w-full overflow-x-auto rounded-xl border border-gray-200">
        <table ref={ref} className={tableClassName} {...props}>
          {showHeader && <RJTableHeader columns={columns} />}
          <tbody>
            {data.map((row, rowIndex) => (
              <RJTableRow
                key={rowIndex}
                row={row}
                rowIndex={rowIndex}
                columns={columns}
                hoverable={hoverable}
                striped={striped}
              />
            ))}
          </tbody>
        </table>
      </div>
    );
  }
);

// Display name for React DevTools
RJTable.displayName = "RJTable";

export default RJTable;
