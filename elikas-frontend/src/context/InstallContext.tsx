import { createContext, useContext, useEffect, useState } from "react";

interface BeforeInstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallContextType {
  deferredPrompt: BeforeInstallEvent | null;
  isStandalone: boolean;
  promptHandled: boolean;
  canInstall: boolean;
  triggerInstall: () => Promise<void>;
}

const InstallContext = createContext<InstallContextType | undefined>(undefined);

export function InstallProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [promptHandled, setPromptHandled] = useState(false);

  //Install prompt
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallEvent);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  // Install done
  useEffect(() => {
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setPromptHandled(true);
    };
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => window.removeEventListener("appinstalled", handleAppInstalled);
  }, []);

  // hasInstalled
  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    setIsStandalone(mediaQuery.matches);
    const handleChange = (e: MediaQueryListEvent) => setIsStandalone(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install banner: ${outcome}`);
    setDeferredPrompt(null);
    setPromptHandled(true);
  };

  const canInstall = !!deferredPrompt && !promptHandled && !isStandalone;

  return (
    <InstallContext.Provider
      value={{
        deferredPrompt,
        isStandalone,
        promptHandled,
        canInstall,
        triggerInstall,
      }}
    >
      {children}
    </InstallContext.Provider>
  );
}

export function useInstall() {
  const ctx = useContext(InstallContext);
  if (!ctx) throw new Error("useInstall must be used within InstallProvider");
  return ctx;
}
