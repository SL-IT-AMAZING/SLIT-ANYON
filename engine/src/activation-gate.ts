export function isAnyonActivated(): boolean {
  return process.env.ANYON_ACTIVE === "1";
}
