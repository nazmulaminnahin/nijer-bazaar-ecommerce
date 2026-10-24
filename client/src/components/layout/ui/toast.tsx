import React, { useEffect, useState } from "react";
import { X, CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

let toasts: ToastItem[] = [];
let listeners: Array<(toasts: ToastItem[]) => void> = [];

function notify(listeners: Array<(toasts: ToastItem[]) => void>, newToasts: ToastItem[]) {
  listeners.forEach((l) => l([...newToasts]));
}

function addToast(type: ToastType, message: string, title?: string) {
  const id = Math.random().toString(36).slice(2);
  toasts = [...toasts, { id, type, message, title }];
  notify(listeners, toasts);
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify(listeners, toasts);
  }, 4000);
}

export const toast = {
  success: (message: string, title?: string) => addToast("success", message, title),
  error: (message: string, title?: string) => addToast("error", message, title),
  warning: (message: string, title?: string) => addToast("warning", message, title),
  info: (message: string, title?: string) => addToast("info", message, title),
};

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
  error: <XCircle className="h-5 w-5 text-red-500" />,
  warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
};

const bgClasses: Record<ToastType, string> = {
  success: "border-l-4 border-green-500",
  error: "border-l-4 border-red-500",
  warning: "border-l-4 border-yellow-500",
  info: "border-l-4 border-blue-500",
};

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    listeners.push(setItems);
    return () => {
      listeners = listeners.filter((l) => l !== setItems);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80">
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "flex items-start gap-3 rounded-xl bg-white p-4 shadow-lg",
            bgClasses[item.type]
          )}
        >
          {icons[item.type]}
          <div className="flex-1 min-w-0">
            {item.title && (
              <p className="text-sm font-semibold text-gray-900">{item.title}</p>
            )}
            <p className="text-sm text-gray-600">{item.message}</p>
          </div>
          <button
            onClick={() => {
              toasts = toasts.filter((t) => t.id !== item.id);
              notify(listeners, toasts);
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}