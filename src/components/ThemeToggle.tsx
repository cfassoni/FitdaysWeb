"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Sun, Moon } from "lucide-react";
import IconButton from "./IconButton";

interface ThemeToggleProps {
  variant?: "icon" | "full";
}

export default function ThemeToggle({ variant = "icon" }: ThemeToggleProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined" || typeof localStorage === "undefined") return;
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "dark" || saved === "light") {
        setTheme(saved);
        if (saved === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setTheme("dark");
        document.documentElement.classList.add("dark");
      }
    } catch {
      // Ignore localStorage access restrictions
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("theme", nextTheme);
      }
    } catch {
      // Ignore localStorage write failures
    }
  };

  const { t } = useTranslation();
  const titleText = theme === "light" ? t("toolbar.switchToDark") : t("toolbar.switchToLight");

  if (!mounted) {
    return (
      <IconButton
        title={titleText || "Toggle theme"}
        aria-label={titleText || "Toggle theme"}
      >
        <Moon className="h-5 w-5" />
      </IconButton>
    );
  }

  if (variant === "icon") {
    return (
      <IconButton
        onClick={toggleTheme}
        title={titleText}
        aria-label={titleText}
      >
        {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </IconButton>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer w-full focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
      title={titleText}
    >
      {theme === "light" ? (
        <>
          <Moon className="h-5 w-5" />
          <span className="text-sm font-medium">{t("toolbar.switchToDark")}</span>
        </>
      ) : (
        <>
          <Sun className="h-5 w-5" />
          <span className="text-sm font-medium">{t("toolbar.switchToLight")}</span>
        </>
      )}
    </button>
  );
}
