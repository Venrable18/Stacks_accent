// Lightweight app-wide event bus using a dedicated EventTarget

const bus = new EventTarget();

export type AppEventMap = {
  'nft:refresh': { reason?: string };
  'tx:confirmed': { txId: string };
};

export function on<K extends keyof AppEventMap>(type: K, handler: (detail: AppEventMap[K]) => void) {
  const wrapped = (e: Event) => handler((e as CustomEvent<AppEventMap[K]>).detail);
  bus.addEventListener(type, wrapped as EventListener);
  return () => bus.removeEventListener(type, wrapped as EventListener);
}

export function emit<K extends keyof AppEventMap>(type: K, detail: AppEventMap[K]) {
  bus.dispatchEvent(new CustomEvent(type, { detail }));
}
