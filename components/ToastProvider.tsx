"use client";

import { createContext, useCallback, useContext, useState } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import type { AlertColor } from "@mui/material/Alert";

type ToastFn = (message: string, severity?: AlertColor) => void;

const ToastContext = createContext<ToastFn>(() => {});

/**
 * Zeigt eine nicht-blockierende Meldung unten in der Mitte an.
 * Ersatz für alert(): const toast = useToast(); toast(t("saveError"));
 * Standard-Severity ist "error", für Erfolgsmeldungen toast(msg, "success").
 */
export function useToast() {
  return useContext(ToastContext);
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<AlertColor>("error");
  const [open, setOpen] = useState(false);

  const toast = useCallback<ToastFn>((msg, sev = "error") => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={(_, reason) => {
          if (reason === "clickaway") return;
          setOpen(false);
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setOpen(false)}
          severity={severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}
