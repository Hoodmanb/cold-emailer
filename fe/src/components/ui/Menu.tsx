import * as React from "react";
import { Menu, MenuItem } from "@mui/material";

type DropdownMenuProps = {
  menuTrigger: React.ReactElement;
  menuItems: { label: string; onClick: () => void }[];
};

const CustomDropdownMenu: React.FC<DropdownMenuProps> = ({
  menuTrigger,
  menuItems,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <div
        onClick={handleClick}
        style={{ display: "inline-block", cursor: "pointer" }}
      >
        {menuTrigger}
      </div>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {menuItems.map((item, index) => (
          <MenuItem
            key={index}
            onClick={() => {
              item.onClick();
              handleClose();
            }}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default CustomDropdownMenu;
