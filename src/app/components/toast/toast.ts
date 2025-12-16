import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ToastConfig, ToastHost, ToastHostHandle, ToastType } from './ToastHost';

export type ToastApi = {
  open: (config: ToastConfig) => string;
  info: (content: React.ReactNode, duration?: number) => string;
  success: (content: React.ReactNode, duration?: number) => string;
  warning: (content: React.ReactNode, duration?: number) => string;
  error: (content: React.ReactNode, duration?: number) => string;
  close: (id: string) => void;
  clear: () => void;
  destroy: () => void;
};

type ToastGlobalState = {
  root?: Root;
  container?: HTMLElement;
  host?: ToastHostHandle | null;
  queue: ToastConfig[];
  counter: number;
};

const TOAST_GLOBAL_KEY = '__CINNY_ACTION_TOAST__';
const TOAST_CONTAINER_ID = 'cinny-action-toast-root';

const globalStore = globalThis as unknown as Record<string, ToastGlobalState | undefined>;
const globalState: ToastGlobalState =
  globalStore[TOAST_GLOBAL_KEY] ??
  (globalStore[TOAST_GLOBAL_KEY] = {
    queue: [],
    counter: 0,
  });

const createId = () => {
  globalState.counter += 1;
  return `toast_${Date.now()}_${globalState.counter}`;
};

const ensureHost = () => {
  if (typeof document === 'undefined') return;
  if (globalState.root) return;

  const existing = document.getElementById(TOAST_CONTAINER_ID);
  const container = existing ?? document.createElement('div');
  container.id = TOAST_CONTAINER_ID;
  if (!existing) document.body.appendChild(container);

  globalState.container = container;
  globalState.root = createRoot(container);

  globalState.root.render(
    React.createElement(ToastHost, {
      createId,
      ref: (host: ToastHostHandle | null) => {
        globalState.host = host;
        if (!host) return;
        const queued = globalState.queue;
        globalState.queue = [];
        queued.forEach((q) => host.open(q));
      },
    })
  );
};

const open = (config: ToastConfig) => {
  ensureHost();
  const id = config.id ?? createId();
  const next: ToastConfig = { ...config, id };

  if (globalState.host) return globalState.host.open(next);
  globalState.queue.push(next);
  return id;
};

const typeFn =
  (type: ToastType) =>
  (content: React.ReactNode, duration?: number): string =>
    open({ type, content, duration });

const close = (id: string) => {
  if (globalState.host) globalState.host.close(id);
  globalState.queue = globalState.queue.filter((t) => t.id !== id);
};

const clear = () => {
  if (globalState.host) globalState.host.clear();
  globalState.queue = [];
};

const destroy = () => {
  clear();
  globalState.root?.unmount();
  globalState.root = undefined;
  globalState.host = undefined;
  globalState.container?.remove();
  globalState.container = undefined;
};

export const toast: ToastApi = {
  open,
  info: typeFn('info'),
  success: typeFn('success'),
  warning: typeFn('warning'),
  error: typeFn('error'),
  close,
  clear,
  destroy,
};
