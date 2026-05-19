"use client";

import React, { useEffect, useRef } from "react";
import { Box, Typography } from "@mui/material";

interface ScoreRingProps {
  score: number;
  size?: number;
  label?: string;
}

const getColor = (score: number) => {
  if (score >= 75) return "#22c55e";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
};

export default function ScoreRing({ score, size = 120, label = "ATS Score" }: ScoreRingProps) {
  const circleRef = useRef<SVGCircleElement>(null);

  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = getColor(score);

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.style.strokeDashoffset = String(strokeDashoffset);
    }
  }, [strokeDashoffset]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
      <Box sx={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={10}
          />
          {/* Score arc */}
          <circle
            ref={circleRef}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
          />
        </svg>
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <Typography variant="h5" fontWeight={700} color={color} lineHeight={1}>
            {score}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            /100
          </Typography>
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        {label}
      </Typography>
    </Box>
  );
}
