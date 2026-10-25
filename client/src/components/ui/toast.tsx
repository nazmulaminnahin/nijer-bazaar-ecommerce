import { useEffect, useState } from "react";
import { X } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

let toastQueue: ToastMessage[] = [];
let listeners: ((toasts: ToastMessage[]) => void)[] = [];

export const toast = {
  success: (message: string, title?: string) => addToast("success", message, title),
  error: (message: string, title?: string) => addToast("error", message, title),
  info: (message: string, title?: string) => addToast("info", message, title),
  warning: (message: string, title?: string) => addToast("warning", message, title),
};

function addToast(type: ToastType, message: string, title?: string) {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast: ToastMessage = { id, type, message, title };
  toastQueue = [...toastQueue, newToast];
  notifyListeners();

  setTimeout(() => {
    removeToast(id);
  }, 5000);
}

function removeToast(id: string) {
  toastQueue = toastQueue.filter((t) => t.id !== id);
  notifyListeners();
}

function notifyListeners() {
  listeners.forEach((listener) => listener(toastQueue));
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    listeners.push(setToasts);
    return () => {
      listeners = listeners.filter((l) => l !== setToasts);
    };
  }, []);

  const getToastStyles = (type: ToastType) => {
    const base = "shadow-lg rounded-lg p-4 flex items-start gap-3 max-w-md min-w-[260px]";
    switch (type) {
      case "success":
        return `${base} bg-green-50 border border-green-200 text-green-800`;
      case "error":
        return `${base} bg-red-50 border border-red-200 text-red-800`;
      case "warning":
        return `${base} bg-yellow-50 border border-yellow-200 text-yellow-800`;
      case "info":
      default:
        return `${base} bg-blue-50 border border-blue-200 text-blue-800`;
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={getToastStyles(t.type)}>
          <div className="flex-1">
            {t.title && <p className="text-xs font-bold mb-0.5">{t.title}</p>}
            <p className="text-sm font-medium">{t.message}</p>
          </div>
          <button
            onClick={() => removeToast(t.id)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}