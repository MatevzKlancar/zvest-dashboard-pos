"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FlaskConical } from "lucide-react";
import { getDryRunObserved } from "@/lib/dryRunState";

export function DryRunBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(getDryRunObserved());
    const handler = () => setShow(getDryRunObserved());
    window.addEventListener("zvest:dry-run-changed", handler);
    return () => window.removeEventListener("zvest:dry-run-changed", handler);
  }, []);

  if (!show) return null;

  return (
    <Alert className="border-yellow-300 bg-yellow-50">
      <FlaskConical className="h-4 w-4 text-yellow-700" />
      <AlertDescription className="text-yellow-900">
        <span className="font-semibold">Test mode active.</span> Push delivery
        is currently disabled on the backend. Notifications are recorded in
        History but no devices receive them. Contact engineering to enable
        delivery.
      </AlertDescription>
    </Alert>
  );
}
