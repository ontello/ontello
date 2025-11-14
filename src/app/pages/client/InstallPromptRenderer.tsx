import React, { useCallback, useEffect, useMemo, useState } from 'react';
import UAParser from 'ua-parser-js';
import {
  INSTALL_PROMPT_DISMISS_KEY,
  InstallPromptModal,
  type InstallPromptPlatform,
} from './InstallPromptModal';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type InstallEnvironment = {
  isStandalone: boolean;
  isAndroidChrome: boolean;
  isIosSafari: boolean;
  deviceType: string;
};

export function InstallPromptRenderer() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installEnvironment, setInstallEnvironment] = useState<InstallEnvironment | null>(null);
  const [initialOptOut, setInitialOptOut] = useState(false);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [sessionDismissed, setSessionDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(INSTALL_PROMPT_DISMISS_KEY) === 'true';
    setInitialOptOut(stored);
    setStorageLoaded(true);
  }, []);

  useEffect(() => {
    console.log('test1');

    // if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (event: any) => {
      console.log('handleBeforeInstallPrompt');

      event.preventDefault();
      //TODO
      event.prompt();

      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    // if (typeof window === 'undefined') return;

    const parser = new UAParser(window.navigator.userAgent);

    const osName = (parser.getOS().name ?? '').toLowerCase();
    const browserName = (parser.getBrowser().name ?? '').toLowerCase();
    const deviceType = parser.getDevice().type ?? 'desktop';

    const getIsStandalone = () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((window.navigator as unknown as { standalone?: boolean }).standalone);

    const getEnvironment = (isStandalone: boolean): InstallEnvironment => ({
      isStandalone,
      isAndroidChrome: osName.includes('android') && browserName.includes('chrome'),
      isIosSafari:
        (osName.includes('ios') ||
          /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase())) &&
        browserName.includes('safari'),
      deviceType,
    });

    setInstallEnvironment(getEnvironment(getIsStandalone()));

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (event: MediaQueryListEvent) => {
      setInstallEnvironment((prev) => (prev ? { ...prev, isStandalone: event.matches } : prev));
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleDisplayModeChange);
      return () => mediaQuery.removeEventListener('change', handleDisplayModeChange);
    }

    mediaQuery.addListener(handleDisplayModeChange);
    return () => mediaQuery.removeListener(handleDisplayModeChange);
  }, []);

  const platform = useMemo<InstallPromptPlatform>(() => {
    if (!installEnvironment) return 'other';
    if (installEnvironment.isAndroidChrome) return 'android';
    if (installEnvironment.isIosSafari) return 'ios';
    return 'other';
  }, [installEnvironment]);

  console.log('installEnvironment', installEnvironment);
  console.log('storageLoaded', storageLoaded);
  console.log('initialOptOut', initialOptOut);
  console.log('sessionDismissed', sessionDismissed);
  console.log('deferredPrompt', deferredPrompt);

  const shouldShowInstallPrompt =
    Boolean(installEnvironment && !installEnvironment.isStandalone) &&
    storageLoaded &&
    !initialOptOut &&
    !sessionDismissed &&
    // Android Chrome 只有在 beforeinstallprompt 事件触发时才显示弹窗
    !(installEnvironment?.isAndroidChrome && !deferredPrompt);

  const canInstallDirectly = Boolean(installEnvironment?.isAndroidChrome && deferredPrompt);

  const handleInstall = useCallback(async () => {
    console.log('handleInstall');

    if (!deferredPrompt) return;
    setInstalling(true);

    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
      setSessionDismissed(true);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setSessionDismissed(true);
  }, []);

  if (!shouldShowInstallPrompt) return null;

  return (
    <InstallPromptModal
      platform={platform}
      installing={installing}
      initialDontShowAgain={initialOptOut}
      onInstallClick={canInstallDirectly ? handleInstall : undefined}
      onDismiss={handleDismiss}
    />
  );
}
