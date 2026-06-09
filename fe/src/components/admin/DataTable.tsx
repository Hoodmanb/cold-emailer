"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from "@mui/material";

export type DataTableColumn<T> = {
  id: string;
  label: string;
  align?: "left" | "right" | "center";
  render: (row: T, index: number) => React.ReactNode;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  emptyMessage?: string;
  getRowKey: (row: T, index: number) => string;
};

export default function DataTable<T>({
  columns,
  rows,
  emptyMessage = "No records found",
  getRowKey,
}: DataTableProps<T>) {
  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.id} align={col.align || "left"} sx={{ fontWeight: 700 }}>
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length}>
                <Typography variant="body2" color="text.secondary" py={2} textAlign="center">
                  {emptyMessage}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => (
              <TableRow key={getRowKey(row, index)} hover>
                {columns.map((col) => (
                  <TableCell key={col.id} align={col.align || "left"}>
                    {col.render(row, index)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
