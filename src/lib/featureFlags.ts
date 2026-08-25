export const isWipPagesEnabled = (): boolean => {
  // Disabled by default unless explicitly enabled via environment variable
  return (
    process.env.ENABLE_WIP_PAGES === "true" ||
    process.env.NEXT_PUBLIC_ENABLE_WIP_PAGES === "true"
  );
};
