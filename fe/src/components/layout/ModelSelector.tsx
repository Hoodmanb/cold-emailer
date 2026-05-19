"use client";

import React, { useState, useEffect } from "react";
import {
  Stack,
  Box,
  Typography,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  Chip,
  Tooltip,
} from "@mui/material";
import { Search, Zap, DollarSign, Star } from "lucide-react";
import axiosInstance from "@/hooks/axios";
import useAuthStore from "@/store/useAuthStore";
import type { AIModel } from "@/types";

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
}

const SPEED_COLOR: Record<string, "success" | "primary" | "warning" | "error"> = {
  "very-fast": "success",
  fast: "primary",
  medium: "warning",
  slow: "error",
};

const COST_COLOR: Record<string, "success" | "primary" | "warning" | "error"> = {
  "very-low": "success",
  low: "primary",
  medium: "warning",
  high: "error",
};

export default function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [models, setModels] = useState<AIModel[]>([]);
  const [search, setSearch] = useState("");
  const setSelectedModel = useAuthStore((s) => s.setSelectedModel);

  useEffect(() => {
    axiosInstance.get("/api/ai/models").then((res) => {
      if (res.data?.data) setModels(res.data.data);
    });
  }, []);

  const filtered = models.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.provider.toLowerCase().includes(search.toLowerCase())
  );

  const selectedModel = models.find((m) => m.id === value);

  const handleChange = (modelId: string) => {
    onChange(modelId);
    setSelectedModel(modelId);
  };

  return (
    <Stack gap={1}>
      <Typography variant="body2" fontWeight={700}>
        AI Model
      </Typography>
      <TextField
        size="small"
        placeholder="Search models..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search size={16} />
            </InputAdornment>
          ),
        }}
      />
      <FormControl size="small" fullWidth>
        <Select
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          renderValue={() =>
            selectedModel ? (
              <Typography variant="body2" fontWeight={600}>
                {selectedModel.name} â€” {selectedModel.provider}
              </Typography>
            ) : (
              "Select a model"
            )
          }
          MenuProps={{ PaperProps: { sx: { maxHeight: 350 } } }}
        >
          {filtered.map((model) => (
            <MenuItem key={model.id} value={model.id}>
              <Stack width="100%" gap={0.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" fontWeight={700}>
                    {model.name}
                  </Typography>
                  <Stack direction="row" gap={0.5}>
                    <Chip
                      icon={<Zap size={10} />}
                      label={model.speed}
                      size="small"
                      color={SPEED_COLOR[model.speed] || "default"}
                      variant="outlined"
                      sx={{ fontSize: "0.6rem", height: 18 }}
                    />
                    <Chip
                      icon={<DollarSign size={10} />}
                      label={model.cost}
                      size="small"
                      color={COST_COLOR[model.cost] || "default"}
                      variant="outlined"
                      sx={{ fontSize: "0.6rem", height: 18 }}
                    />
                    <Stack direction="row" gap={0}>
                      {Array.from({ length: model.quality }).map((_, i) => (
                        <Star key={i} size={10} fill="#f59e0b" color="#f59e0b" />
                      ))}
                    </Stack>
                  </Stack>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {model.provider} Â· {(model.contextWindow / 1000).toFixed(0)}k context Â· {model.description}
                </Typography>
              </Stack>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
}
