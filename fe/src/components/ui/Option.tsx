"use client";
import React from "react";
import { MenuItem, Typography } from "@mui/material";
import Select, { SelectChangeEvent } from "@mui/material/Select";

interface Option {
  label: string;
  value: string;
}

interface SelectOptionProps {
  value: string;
  onBlur?: (event: React.FocusEvent<any>) => void;
  onChange: (value: string) => void;
  options: Option[];
  label?: string;
  name?: string;
  minWidth?: string | number;
  fontSize?: string;
  width?: string;
  height?: string;
  border?: string;
}

export default function SelectOption({
  onBlur,
  value,
  onChange,
  options,
  label = "Select an option",
  name = "",
  minWidth = "200px",
  fontSize = "0.8em",
  width = "100%",
  height = "40px",
  border = "2px",
}: SelectOptionProps) {
  return (
    <Select
      id={name}
      name={name}
      sx={{
        width,
        minWidth,
        height,
        paddingLeft: "8px",
        fontSize,
        textAlign: "left",
        color: value ? "black" : "#878686",
        "& .MuiOutlinedInput-notchedOutline": {
          border: `1 solid #878686`,
        },
        "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
          {
            border: `${border} solid #166ae3`,
          },
        "& .MuiSelect-select": {
          padding: 0,
        },
      }}
      displayEmpty
      renderValue={(selected) => (
        <Typography
          color={selected ? "black" : "#878686"}
          sx={{ fontSize: "1.2em" }}
        >
          {selected || label}
        </Typography>
      )}
      value={value}
      onChange={(e: SelectChangeEvent) => onChange(e.target.value)}
      onBlur={onBlur}
    >
      {options.map((option) => (
        <MenuItem
          key={option.value}
          value={option.label}
          sx={{ p: "5px 5px", fontSize }}
        >
          {option.label}
        </MenuItem>
      ))}
    </Select>
  );
}
