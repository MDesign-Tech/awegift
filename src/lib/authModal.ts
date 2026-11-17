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

export const requestEmailVerificationModal = (
  email: string,
  codeAlreadySent = false
) => {
  if (typeof window === "undefined") return;
  const event = new CustomEvent("awegift:email-verification-modal", {
    detail: { email, codeAlreadySent },
  });
  window.setTimeout(() => window.dispatchEvent(event), 0);
};
