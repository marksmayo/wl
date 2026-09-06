import "server-only";
import { headers } from "next/headers";

export type Device = "desktop" | "mobile";

export async function detectDevice(): Promise<Device> {
  const h = await headers();
  const ua = h.get("user-agent") ?? "";
  return /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ? "mobile" : "desktop";
}
