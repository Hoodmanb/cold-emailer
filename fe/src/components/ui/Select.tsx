import React from "react";
import {
  Box,
  OutlinedInput,
  InputLabel,
  MenuItem,
  FormControl,
  Select,
  Chip,
} from "@mui/material";
import { useTheme, Theme } from "@mui/material/styles";
import { SelectChangeEvent } from "@mui/material/Select";

type MultiSelectChipProps = {
  name: string;
  label?: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  width?: number | string;
  height?: number | string;
  onBlur?: (event: React.FocusEvent<any>) => void;
};

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

function getStyles(name: string, selected: readonly string[], theme: Theme) {
  return {
    fontWeight: selected.includes(name)
      ? theme.typography.fontWeightMedium
      : theme.typography.fontWeightRegular,
  };
}

const MultiSelectChip: React.FC<MultiSelectChipProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder,
  width = 300,
  height = "40px",
  onBlur,
  name,
}) => {
  const theme = useTheme();

  const handleChange = (event: SelectChangeEvent<typeof value>) => {
    const {
      target: { value: targetValue },
    } = event;
    onChange(
      typeof targetValue === "string" ? targetValue.split(",") : targetValue
    );
  };

  return (
    <FormControl sx={{ width }}>
      <Select
        fullWidth
        onBlur={onBlur}
        multiple
        name={name}
        value={value}
        onChange={handleChange}
        input={
          <OutlinedInput
            label={label}
            sx={{ height: value.length > 0 ? "auto" : height }}
          />
        }
        renderValue={(selected) => (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 0.5,
              maxHeight: 100,
              overflowY: "auto",
            }}
          >
            {selected.length > 0 ? (
              selected.map((val, index) => <Chip key={val + index} label={val} />)
            ) : placeholder ? (
              <Box
                sx={{
                  color: "red",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {placeholder}
              </Box>
            ) : null}
          </Box>
        )}
        MenuProps={MenuProps}
      >
        {options.map((option) => (
          <MenuItem
            key={option}
            value={option}
            style={getStyles(option, value, theme)}
          >
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default MultiSelectChip;
