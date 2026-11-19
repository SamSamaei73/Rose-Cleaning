import type { ComponentProps } from "react";

/** One copper frame and inset for hero, service and editorial photography. */
export function PhotoFrame({
  children,
  className = "",
  ...props
}: ComponentProps<"div">) {
  return (
    <div className={`photo-frame ${className}`} {...props}>
      <div className="photo-frame-inset">{children}</div>
    </div>
  );
}
