import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Box, Icon, IconButton, Icons, Text, color } from 'folds';
import * as css from './Toast.css';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export type ToastConfig = {
  id?: string;
  type?: ToastType;
  title?: React.ReactNode;
  content: React.ReactNode;
  duration?: number;
  onClose?: () => void;
};

export type ToastHostHandle = {
  open: (config: ToastConfig) => string;
  close: (id: string) => void;
  clear: () => void;
};

type ToastItem = {
  id: string;
  type: ToastType;
  title?: React.ReactNode;
  content: React.ReactNode;
  duration: number;
  onClose?: () => void;
};

type ToastHostProps = {
  maxToasts?: number;
  createId?: () => string;
};

const DEFAULT_DURATION = 3000;

const getIcon = (type: ToastType) => {
  if (type === 'success') return Icons.Check;
  if (type === 'warning' || type === 'error') return Icons.Warning;
  return Icons.Info;
};

const getIconColor = (type: ToastType) => {
  if (type === 'success') return color.Success.Main;
  if (type === 'warning') return color.Warning.Main;
  if (type === 'error') return color.Critical.Main;
  return color.Primary.Main;
};

export const ToastHost = forwardRef<ToastHostHandle, ToastHostProps>(
  ({ maxToasts = 3, createId }, ref) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
    const toastsRef = useRef<ToastItem[]>([]);

    useEffect(() => {
      toastsRef.current = toasts;
    }, [toasts]);

    const clearTimeoutFor = useCallback((id: string) => {
      const t = timeoutsRef.current.get(id);
      if (t) clearTimeout(t);
      timeoutsRef.current.delete(id);
    }, []);

    const removeToast = useCallback(
      (id: string) => {
        const toast = toastsRef.current.find((t) => t.id === id);
        clearTimeoutFor(id);
        toast?.onClose?.();
        toastsRef.current = toastsRef.current.filter((t) => t.id !== id);
        setToasts(toastsRef.current);
      },
      [clearTimeoutFor]
    );

    const clearAll = useCallback(() => {
      toastsRef.current.forEach((t) => t.onClose?.());
      timeoutsRef.current.forEach((t) => clearTimeout(t));
      timeoutsRef.current.clear();
      toastsRef.current = [];
      setToasts([]);
    }, []);

    const openToast = useCallback(
      (toastConfig: ToastConfig) => {
        const toastId = toastConfig.id ?? createId?.() ?? `${Date.now()}_${Math.random()}`;
        const type = toastConfig.type ?? 'info';
        const duration = toastConfig.duration ?? DEFAULT_DURATION;

        const item: ToastItem = {
          id: toastId,
          type,
          title: toastConfig.title,
          content: toastConfig.content,
          duration,
          onClose: toastConfig.onClose,
        };

        const limit = Math.max(1, maxToasts);
        const nextAll = [item, ...toastsRef.current.filter((t) => t.id !== toastId)];
        const capped = nextAll.slice(0, limit);
        const dropped = nextAll.slice(limit);
        toastsRef.current = capped;
        setToasts(capped);

        dropped.forEach((t) => {
          clearTimeoutFor(t.id);
          t.onClose?.();
        });

        clearTimeoutFor(toastId);
        if (duration > 0) {
          const timeout = setTimeout(() => removeToast(toastId), duration);
          timeoutsRef.current.set(toastId, timeout);
        }

        return toastId;
      },
      [clearTimeoutFor, createId, maxToasts, removeToast]
    );

    useImperativeHandle(
      ref,
      () => ({
        open: openToast,
        close: removeToast,
        clear: clearAll,
      }),
      [clearAll, openToast, removeToast]
    );

    useEffect(
      () => () => {
        toastsRef.current.forEach((t) => t.onClose?.());
        timeoutsRef.current.forEach((t) => clearTimeout(t));
        timeoutsRef.current.clear();
      },
      []
    );

    if (toasts.length === 0) return null;

    return (
      <div className={css.ToastViewport} aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={css.ToastItem({ type: t.type })}
            role={t.type === 'error' ? 'alert' : 'status'}
          >
            <span className={css.ToastAccent({ type: t.type })} aria-hidden />
            <Icon size="100" src={getIcon(t.type)} style={{ color: getIconColor(t.type) }} filled />
            <Box className={css.ToastContent} direction="Column" gap="100">
              {t.title && (
                <Text size="B300">{t.title}</Text>
              )}
              <Text className={css.ToastMessage} size="T300">
                {t.content}
              </Text>
            </Box>
            <IconButton
              size="300"
              radii="300"
              aria-label="Close notification"
              onClick={() => removeToast(t.id)}
            >
              <Icon size="100" src={Icons.Cross} />
            </IconButton>
          </div>
        ))}
      </div>
    );
  }
);

ToastHost.displayName = 'ToastHost';
