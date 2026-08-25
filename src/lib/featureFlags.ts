export const isWipPagesEnabled = (): boolean => {
  // Always enabled by default for testing/previewing unless explicitly disabled
  if (process.env.NEXT_PUBLIC_ENABLE_WIP_PAGES === "false") return false;
  return true;
};
