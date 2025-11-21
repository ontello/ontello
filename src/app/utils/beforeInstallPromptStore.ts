export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type Subscriber = (event: BeforeInstallPromptEvent | null) => void;

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let initialized = false;
const subscribers = new Set<Subscriber>();

export const initBeforeInstallPromptListener = () => {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  window.addEventListener('beforeinstallprompt', (event: Event) => {
    const promptEvent = event as BeforeInstallPromptEvent;
    promptEvent.preventDefault();
    deferredPrompt = promptEvent;
    subscribers.forEach((cb) => cb(deferredPrompt));
  });
};

export const getDeferredPrompt = () => deferredPrompt;

export const subscribeBeforeInstallPrompt = (callback: Subscriber) => {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
};

export const clearDeferredPrompt = () => {
  deferredPrompt = null;
};
