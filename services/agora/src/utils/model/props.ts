// When trying to export directly from the same file as the props, I get the following error so I created this external file.
// Error: Module '"*.vue"' has no exported member 'OnboardingLayoutProps'. Did you mean to use 'import OnboardingLayoutProps from "*.vue"' instead?
// FILE  /home/nicobao/zkorum/zkorum/services/agora/src/router/routes.ts:2:28
export interface OnboardingLayoutProps {
  hasGoBackButton: boolean;
  hasHelpButton: boolean;
}

export interface MainLayoutProps {
  hasGoBackButton: boolean;
  isFullscreen: boolean;
  enableHeader: boolean;
}
