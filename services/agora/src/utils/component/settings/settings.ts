export interface SettingsInterface {
  icon: string;
  label: string;
  action: () => void;
  routeName: string;
  isWarning: boolean;
}
