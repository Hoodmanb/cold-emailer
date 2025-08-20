export const getRandomColor = () => {
  const colors = [
    "#CBD5E1", // Light Slate
    "#94A3B8", // Muted Blue Gray
    "#BFDBFE", // Soft Blue
    "#93C5FD", // Medium Sky Blue
    "#FDBA74", // Soft Orange
    "#FCD34D", // Warm Yellow
    "#FBBF24", // Amber Gold
    "#FDBA74", // Soft Orange
    "#86EFAC", // Mint Green
    "#4ADE80", // Emerald Green
    "#34D399", // Teal Green
    "#A78BFA", // Soft Purple
    "#C084FC", // Medium Purple
    "#F472B6", // Soft Pink
    "#FB7185", // Rose Red
    "#F87171", // Light Red
    "#EF4444", // Stronger Red
    "#F97316", // Vibrant Orange
  ];

  const randomIndex = Math.floor(Math.random() * colors.length);
  return colors[randomIndex];
};
