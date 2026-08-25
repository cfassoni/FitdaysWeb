export const isWipPagesEnabled = (): boolean => {
  // Disabled by default unless explicitly enabled via environment variable
  return process.env.NEXT_PUBLIC_ENABLE_WIP_PAGES === "true";
};
