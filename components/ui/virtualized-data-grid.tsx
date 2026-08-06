"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

export type VirtualizedDataGridColumn<Row> = {
  key: string;
  header: string;
  width: string;
  align?: "start" | "center" | "end";
  render: (row: Row) => ReactNode;
};

type VirtualizedDataGridProps<Row> = {
  ariaLabel: string;
  rows: readonly Row[];
  columns: readonly VirtualizedDataGridColumn<Row>[];
  getRowKey: (row: Row) => string;
  emptyState: string;
  maxHeight?: number;
  minWidth?: number;
  overscan?: number;
  rowHeight?: number;
  getRowClassName?: (row: Row) => string | undefined;
};

const HEADER_HEIGHT = 44;

export function VirtualizedDataGrid<Row>({
  ariaLabel,
  rows,
  columns,
  getRowKey,
  emptyState,
  maxHeight = 520,
  minWidth = 820,
  overscan = 8,
  rowHeight = 54,
  getRowClassName,
}: VirtualizedDataGridProps<Row>) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const previousKeysRef = useRef(new Set(rows.map(getRowKey)));
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(maxHeight);
  const [freshKeys, setFreshKeys] = useState<Set<string>>(new Set());

  const gridTemplateColumns = useMemo(
    () => columns.map((column) => column.width).join(" "),
    [columns],
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      setViewportHeight(entry.contentRect.height);
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const currentKeys = new Set(rows.map(getRowKey));
    const additions = new Set<string>();
    currentKeys.forEach((key) => {
      if (!previousKeysRef.current.has(key)) additions.add(key);
    });
    previousKeysRef.current = currentKeys;
    if (!additions.size) return;
    setFreshKeys(additions);
    const timeout = window.setTimeout(() => setFreshKeys(new Set()), 900);
    return () => window.clearTimeout(timeout);
  }, [getRowKey, rows]);

  const bodyScrollTop = Math.max(0, scrollTop - HEADER_HEIGHT);
  const bodyViewportHeight = Math.max(rowHeight, viewportHeight - HEADER_HEIGHT);
  const startIndex = Math.max(0, Math.floor(bodyScrollTop / rowHeight) - overscan);
  const endIndex = Math.min(
    rows.length,
    Math.ceil((bodyScrollTop + bodyViewportHeight) / rowHeight) + overscan,
  );
  const visibleRows = rows.slice(startIndex, endIndex);
  const totalHeight = rows.length * rowHeight;

  if (!rows.length) return <div className="finance-empty">{emptyState}</div>;

  return (
    <div
      className="virtual-data-grid"
      role="table"
      aria-label={ariaLabel}
      aria-colcount={columns.length}
      aria-rowcount={rows.length + 1}
    >
      <div
        className="virtual-grid-viewport"
        ref={viewportRef}
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        style={{ maxHeight }}
      >
        <div className="virtual-grid-canvas" style={{ minWidth }}>
          <div
            className="virtual-grid-header"
            role="row"
            style={{ gridTemplateColumns }}
          >
            {columns.map((column) => (
              <div
                className={`virtual-grid-cell align-${column.align ?? "start"}`}
                role="columnheader"
                key={column.key}
              >
                {column.header}
              </div>
            ))}
          </div>

          <div className="virtual-grid-body" role="rowgroup" style={{ height: totalHeight }}>
            {visibleRows.map((row, visibleIndex) => {
              const rowIndex = startIndex + visibleIndex;
              const key = getRowKey(row);
              const rowClassName = getRowClassName?.(row);
              const rowStyle: CSSProperties = {
                gridTemplateColumns,
                height: rowHeight,
                transform: `translateY(${rowIndex * rowHeight}px)`,
              };

              return (
                <div
                  aria-rowindex={rowIndex + 2}
                  className={`virtual-grid-row${rowClassName ? ` ${rowClassName}` : ""}`}
                  data-live-row={freshKeys.has(key) ? "true" : undefined}
                  data-row-index={rowIndex}
                  key={key}
                  role="row"
                  style={rowStyle}
                  tabIndex={0}
                >
                  {columns.map((column) => (
                    <div
                      className={`virtual-grid-cell align-${column.align ?? "start"}`}
                      key={column.key}
                      role="cell"
                    >
                      {column.render(row)}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="virtual-grid-status" aria-live="polite">
        Rendering {visibleRows.length.toLocaleString("en-US")} of {rows.length.toLocaleString("en-US")} rows
      </div>
    </div>
  );
}
