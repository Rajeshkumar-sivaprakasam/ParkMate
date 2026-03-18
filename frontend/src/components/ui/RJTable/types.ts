import { cva, type VariantProps } from "@/lib/utils";

/**
 * RJTable variant configuration
 */
export const tableVariants = cva(
  // Base styles
  "w-full text-left border-collapse",
  {
    variants: {
      // Table size
      size: {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
      },
      // Table variant
      variant: {
        default: "",
        bordered: "border border-gray-200",
        striped: "",
        hover: "",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  },
);

/**
 * RJTableHeader props interface
 */
export interface RJTableHeaderProps<
  T extends object = Record<string, unknown>,
> {
  /**
   * Column definitions
   */
  columns: RJTableColumn<T>[];
  /**
   * Additional className
   */
  className?: string;
}

/**
 * RJTableColumn interface
 */
export interface RJTableColumn<T extends object = Record<string, unknown>> {
  /**
   * Column key (also used for cell data access)
   */
  key: string;
  /**
   * Column header text
   */
  header: React.ReactNode;
  /**
   * Cell render function
   */
  cell?: (row: T, rowIndex: number) => React.ReactNode;
  /**
   * Column width
   */
  width?: string | number;
  /**
   * Column alignment
   */
  align?: "left" | "center" | "right";
  /**
   * Whether column is sortable
   */
  sortable?: boolean;
  /**
   * Custom sort function
   */
  sortFn?: (a: T, b: T) => number;
}

/**
 * RJTableRow props interface
 */
export interface RJTableRowProps<T extends object = Record<string, unknown>> {
  /**
   * Row data
   */
  row: T;
  /**
   * Row index
   */
  rowIndex: number;
  /**
   * Column definitions
   */
  columns: RJTableColumn<T>[];
  /**
   * Whether row is clickable
   */
  clickable?: boolean;
  /**
   * Enable row hover effect
   */
  hoverable?: boolean;
  /**
   * Enable striped rows
   */
  striped?: boolean;
  /**
   * Row click handler
   */
  onClick?: (row: T) => void;
  /**
   * Additional className
   */
  className?: string;
}

/**
 * RJTable props interface
 */
export interface RJTableProps<T extends object = Record<string, unknown>>
  extends
    React.TableHTMLAttributes<HTMLTableElement>,
    VariantProps<typeof tableVariants> {
  /**
   * Table data
   */
  data: T[];
  /**
   * Column definitions
   */
  columns: RJTableColumn<T>[];
  /**
   * Show table header
   */
  showHeader?: boolean;
  /**
   * Enable row hover effect
   */
  hoverable?: boolean;
  /**
   * Enable striped rows
   */
  striped?: boolean;
  /**
   * Enable bordered table
   */
  bordered?: boolean;
  /**
   * Empty state content
   */
  emptyContent?: React.ReactNode;
  /**
   * Loading state
   */
  loading?: boolean;
  /**
   * Loading spinner size
   */
  loadingSize?: "sm" | "md" | "lg";
}
