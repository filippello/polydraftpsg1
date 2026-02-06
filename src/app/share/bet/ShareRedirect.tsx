"use client";

import { useEffect } from "react";

export function ShareRedirect({ url }: { url: string }) {
  useEffect(() => {
    window.location.replace(url);
  }, [url]);

  return null;
}
