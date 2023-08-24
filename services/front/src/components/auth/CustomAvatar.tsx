import Avatar from "@mui/material/Avatar";

interface CustomAvatarProps {
  email: string;
}

// two first char of email is displayed
export function CustomAvatar(props: CustomAvatarProps) {
  return (
    <Avatar sx={{ width: 32, height: 32 }}>{props.email.slice(0, 2)}</Avatar>
  );
}
