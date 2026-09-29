/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";

export function BlockImage({ src, alt, fallback, eager = false }: { src?: string | null; alt: string; fallback: ReactNode; eager?: boolean }) {
  const safeSrc = src && ((src.startsWith("/") && !src.startsWith("//")) || src.startsWith("https://")) ? src : null;
  return safeSrc
    ? <img src={safeSrc} alt={alt} loading={eager ? "eager" : "lazy"} className="block-data-image" />
    : <>{fallback}</>;
}
