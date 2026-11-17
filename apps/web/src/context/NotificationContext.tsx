import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type NotificationType = "success" | "error" | "info";

interface NotificationOptions {
  type?: NotificationType;
  duration?: number;
}

interface NotificationItem {
  id: number;
  message: string;
  type: NotificationType;
  duration: number;
}

interface NotificationContextValue {
  notify: (
    message: string,
    options?: NotificationOptions
  ) => number | undefined;
  dismiss: (id: number) => void;
  clear: () => void;
}

const NotificationContext =
  createContext<NotificationContextValue | undefined>(undefined);

function NotificationToast({
  item,
  onDismiss,
}: {
  item: NotificationItem;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    if (item.duration <= 0) return;

    const timer = window.setTimeout(() => {
      onDismiss(item.id);
    }, item.duration);

    return () => window.clearTimeout(timer);
  }, [item.id, item.duration, onDismiss]);

  const symbol =
    item.type === "success"
      ? "✓"
      : item.type === "error"
        ? "!"
        : "i";

  return (
    <div
      className={`cf-toast cf-toast--${item.type}`}
      role={item.type === "error" ? "alert" : "status"}
      aria-live={item.type === "error" ? "assertive" : "polite"}
    >
      <span className="cf-toast__symbol" aria-hidden="true">
        {symbol}
      </span>

      <p className="cf-toast__message">{item.message}</p>

      <button
        type="button"
        className="cf-toast__close"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(item.id)}
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}

export function NotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [notifications, setNotifications] = useState<
    NotificationItem[]
  >([]);

  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setNotifications((current) =>
      current.filter((item) => item.id !== id)
    );
  }, []);

  const clear = useCallback(() => {
    setNotifications([]);
  }, []);

  const notify = useCallback(
    (
      message: string,
      options: NotificationOptions = {}
    ) => {
      const cleanMessage = message.trim();

      if (!cleanMessage) return undefined;

      const type = options.type ?? "info";
      const duration =
        options.duration ?? (type === "error" ? 6500 : 4500);

      const id = ++nextId.current;

      setNotifications((current) => [
        ...current,
        {
          id,
          message: cleanMessage,
          type,
          duration,
        },
      ].slice(-4));

      return id;
    },
    []
  );

  const value = useMemo(
    () => ({ notify, dismiss, clear }),
    [notify, dismiss, clear]
  );

  return (
    <NotificationContext.Provider value={value}>
      <>
        {children}

        <div className="cf-toast-viewport" aria-label="Notifications">
          {notifications.map((item) => (
            <NotificationToast
              key={item.id}
              item={item}
              onDismiss={dismiss}
            />
          ))}
        </div>
      </>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotification must be used inside NotificationProvider."
    );
  }

  return context;
}