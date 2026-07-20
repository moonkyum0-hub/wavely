import { createContext, useContext, useState, useCallback, useRef } from "react";
import { AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastItem {
  id: number;
  message: string;
  type: "error" | "info";
}

interface ToastCtx {
  show: (message: string, type?: "error" | "info") => void;
}

const ToastContext = createContext<ToastCtx>({ show: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const show = useCallback((message: string, type: "error" | "info" = "error") => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 items-stretch pointer-events-none px-4 w-full max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "toast-in pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm font-medium shadow-lg",
              t.type === "error" ? "bg-rose-600 text-white" : "bg-[#1e3a8a] text-white"
            )}
          >
            {t.type === "error"
              ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              : <Info className="w-4 h-4 shrink-0 mt-0.5" />}
            <span className="flex-1 leading-snug">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
