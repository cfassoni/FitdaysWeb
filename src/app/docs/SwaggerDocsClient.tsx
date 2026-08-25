"use client";

import { useEffect, useRef } from "react";

export default function SwaggerDocsClient() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Swagger UI CSS
    const linkId = "swagger-ui-css";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css";
      document.head.appendChild(link);
    }

    // Load Swagger UI JS Bundle
    const scriptId = "swagger-ui-bundle";
    const initSwagger = () => {
      const win = window as unknown as {
        SwaggerUIBundle?: (config: {
          url: string;
          domNode: HTMLElement | null;
          deepLinking?: boolean;
          presets?: unknown[];
          layout?: string;
        }) => void;
      };

      if (typeof win.SwaggerUIBundle === "function" && containerRef.current) {
        win.SwaggerUIBundle({
          url: "/api/openapi.json",
          domNode: containerRef.current,
          deepLinking: true,
          layout: "BaseLayout",
        });
      }
    };

    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js";
      script.async = true;
      script.onload = () => {
        initSwagger();
      };
      document.body.appendChild(script);
    } else {
      initSwagger();
    }
  }, []);

  return (
    <div style={{ padding: "16px 24px" }}>
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto 16px auto",
          padding: "12px 16px",
          borderRadius: "8px",
          backgroundColor: "#fef3c7",
          border: "1px solid #f59e0b",
          color: "#92400e",
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>
          ⚠️ <strong>Development / Testing Mode Only</strong>: This Swagger explorer is automatically disabled in production environments.
        </span>
        <span style={{ fontSize: "12px", opacity: 0.85 }}>v0.4.0</span>
      </div>
      <div ref={containerRef} id="swagger-ui" />
    </div>
  );
}
