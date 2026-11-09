export type AuthModalMode = "signIn" | "signUp" | "forgotPassword";

export const requestAuthModal = (
  mode: AuthModalMode = "signIn",
  callbackUrl?: string
) => {
  if (typeof window === "undefined") return;
  const event = new CustomEvent("awegift:auth-modal", {
    detail: { mode, callbackUrl },
  });
  window.setTimeout(() => window.dispatchEvent(event), 0);
};
