import { useSyncExternalStore } from "react";

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

const listeners = new Set<() => void>();

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
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
  notifyListeners();
  return next;
}

export function clearWishFlowState(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(FLOW_STATE_KEY);
  }
  notifyListeners();
}

/**
 * sessionStorage는 서버에 없으므로 SSR 스냅샷은 항상 undefined로 고정한다.
 * useSyncExternalStore가 hydration 직후 자동으로 실제 클라이언트 값으로
 * 다시 렌더링하므로, useState 초기화 함수에서 직접 읽을 때 생기는
 * hydration 불일치(SSR: {} vs 클라이언트: 저장된 값) 없이 복원할 수 있다.
 */
export function useWishFlowValue<K extends keyof WishFlowState>(
  key: K,
): WishFlowState[K] | undefined {
  return useSyncExternalStore(
    subscribe,
    () => getWishFlowState()[key],
    () => undefined,
  );
}
