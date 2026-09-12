const FLOW_STATE_KEY = "ohgyeol.wishFlow";

export interface WishFlowState {
  primaryWishTagId?: string;
  primaryWishLabel?: string;
  secondaryWishTagId?: string;
  secondaryWishLabel?: string;
  heartTagId?: string;
  heartLabel?: string;
  freeText?: string;
}

export function getWishFlowState(): WishFlowState {
  if (typeof window === "undefined") return {};
  const raw = sessionStorage.getItem(FLOW_STATE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as WishFlowState;
  } catch {
    return {};
  }
}

export function setWishFlowState(patch: Partial<WishFlowState>): WishFlowState {
  const next = { ...getWishFlowState(), ...patch };
  if (typeof window !== "undefined") {
    sessionStorage.setItem(FLOW_STATE_KEY, JSON.stringify(next));
  }
  return next;
}

export function clearWishFlowState(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(FLOW_STATE_KEY);
  }
}
