/** A small, self-hosted subset of the workspace's Font Awesome regular icons. */
export function DashboardIcon({ name, size = 18, className }: { name: string; size?: number; className?: string }) {
  const mask = `url(/icons/dashboard/${name}.svg) center / contain no-repeat`;
  return <span aria-hidden="true" className={className} style={{ display: "inline-block", width: size, height: size, flexShrink: 0, backgroundColor: "currentColor", mask, WebkitMask: mask }} />;
}
