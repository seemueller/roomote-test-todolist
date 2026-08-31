import { invoke, isTauri } from "@tauri-apps/api/core";
import { useCallback, useState } from "react";
import { APP_VERSION } from "../version";

export function useUpdateCheck() {
  const [showChangelog, setShowChangelog] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState<string | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [installingUpdate, setInstallingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<{ kind: "info" | "error"; text: string } | null>(
    null,
  );

  const closeChangelog = useCallback(() => setShowChangelog(false), []);

  async function triggerCheckUpdate() {
    if (!isTauri()) {
      setUpdateStatus({
        kind: "info",
        text: "Updates stehen nur in der installierten App zur Verfügung, nicht im Browser.",
      });
      return;
    }
    setCheckingUpdate(true);
    setUpdateStatus(null);
    try {
      const result = await invoke<{ update_available: boolean; version?: string }>(
        "check_for_update",
      );
      if (result.update_available && result.version) {
        setUpdateAvailable(result.version);
      } else {
        setUpdateStatus({
          kind: "info",
          text: `Version ${APP_VERSION} ist aktuell. Kein Update verfügbar.`,
        });
      }
    } catch (err) {
      setUpdateStatus({ kind: "error", text: `Update-Prüfung fehlgeschlagen: ${String(err)}` });
    } finally {
      setCheckingUpdate(false);
    }
  }

  const handleInstallUpdate = useCallback(async () => {
    setInstallingUpdate(true);
    try {
      await invoke("install_update");
      setUpdateAvailable(null);
      setUpdateStatus({
        kind: "info",
        text: "Update installiert. Die Anwendung startet neu, um die neue Version zu laden.",
      });
    } catch (err) {
      setUpdateAvailable(null);
      setUpdateStatus({ kind: "error", text: `Installation fehlgeschlagen: ${String(err)}` });
    } finally {
      setInstallingUpdate(false);
    }
  }, []);

  return {
    showChangelog,
    setShowChangelog,
    closeChangelog,
    updateAvailable,
    setUpdateAvailable,
    checkingUpdate,
    installingUpdate,
    updateStatus,
    setUpdateStatus,
    triggerCheckUpdate,
    handleInstallUpdate,
  };
}
