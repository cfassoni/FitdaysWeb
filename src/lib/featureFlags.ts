export const isWipPagesEnabled = (): boolean => {
  // Disabled by default unless explicitly enabled via environment variable
  return process.env.ENABLE_WIP_PAGES === "true";
};
