"use client";

import { useEffect, useState } from "react";

import type { NotebookPayload } from "@/lib/types";

export function useNotebook() {
  const [data, setData] = useState<NotebookPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [streamLive, setStreamLive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function pull() {
      const response = await fetch("/api/notebook", { cache: "no-store" });
      const json = (await response.json()) as NotebookPayload;
      if (!cancelled) {
        setData(json);
        setLoading(false);
      }
    }

    void pull();
    const poll = window.setInterval(() => {
      void pull();
    }, 8000);

    const stream = new EventSource("/api/notebook/stream");
    stream.onopen = () => setStreamLive(true);
    stream.onerror = () => setStreamLive(false);
    stream.onmessage = (event) => {
      try {
        const json = JSON.parse(event.data) as NotebookPayload;
        setData(json);
        setLoading(false);
        setStreamLive(true);
      } catch {
        setStreamLive(false);
      }
    };

    return () => {
      cancelled = true;
      window.clearInterval(poll);
      stream.close();
    };
  }, []);

  return { data, setData, loading, streamLive };
}
