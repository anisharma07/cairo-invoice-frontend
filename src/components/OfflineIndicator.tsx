import React from "react";
import { IonIcon } from "@ionic/react";
import { cloudOfflineOutline } from "ionicons/icons";
import { usePWA } from "../hooks/usePWA";

/**
 * Compact, single offline notice. Rendered once at app level so it never
 * stacks (Ionic keeps hidden pages mounted) or covers toolbar actions.
 */
const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWA();
  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        left: "50%",
        top: 60,
        transform: "translateX(-50%)",
        zIndex: 20000,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        borderRadius: 999,
        background: "#3b1d1a",
        color: "#ffd9d2",
        font: "600 13px/1.2 Inter, -apple-system, 'Segoe UI', sans-serif",
        boxShadow: "0 6px 24px rgba(0,0,0,.25)",
        whiteSpace: "nowrap",
        pointerEvents: "none",
      }}
    >
      <IonIcon icon={cloudOfflineOutline} style={{ fontSize: 16 }} />
      Offline: changes are saved on this device
    </div>
  );
};

export default OfflineIndicator;
