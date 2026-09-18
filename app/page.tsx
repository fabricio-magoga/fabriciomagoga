"use client";

import { Dithering } from "@paper-design/shaders-react";
import { useState, useEffect } from "react";
import Link from "next/link";
// 1. Importação necessária para a animação
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function ThemeToggle({
  isDarkMode,
  onToggle,
}: {
  isDarkMode: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`p-2 rounded-full transition-colors ${
        isDarkMode
          ? "hover:bg-white/10 text-white"
          : "hover:bg-black/10 text-black"
      }`}
      aria-label="Toggle theme"
    >
      {isDarkMode ? (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

function ShapeSelector({
  currentShape,
  onShapeChange,
  isDarkMode,
}: {
  currentShape: string;
  onShapeChange: (shape: string) => void;
  isDarkMode: boolean;
}) {
  const shapes = [
    "auto",
    "cat",
    "warp",
    "sphere",
    "ripple",
    "swirl",
    "wave",
    "disabled",
  ];

  return (
    <Select value={currentShape} onValueChange={onShapeChange}>
      <SelectTrigger
        className={`border-0 bg-transparent text-sm p-0 h-auto focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none outline-none ring-0 hover:opacity-70 transition-opacity [&>svg]:hidden ${isDarkMode ? "text-white" : "text-black"}`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        className={`${isDarkMode ? "bg-black, text-white" : "bg-white, text-black"} border-none`}
      >
        {shapes.map((shape) => (
          <SelectItem key={shape} value={shape}>
            {shape === "auto"
              ? "Auto"
              : shape === "disabled"
                ? "Disabled"
                : shape.charAt(0).toUpperCase() + shape.slice(1)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SectionEntry({
  date,
  title,
  org,
  href,
  target,
  rel,
}: {
  date: string;
  title: string;
  org?: string;
  href?: string;
  target?: string;
  rel?: string;
}) {
  const titleContent = href ? (
    <a
      href={href}
      target={target || "_blank"}
      rel={rel || "noopener noreferrer"}
      className="hover:underline"
    >
      {title}
    </a>
  ) : (
    <span>{title}</span>
  );

  return (
    <div className="flex flex-col sm:flex-row items-baseline whitespace-nowrap overflow-hidden">
      <span className="text-xs sm:text-sm opacity-60 mx-4 shrink-0">
        {date}
      </span>
      <div>
        <span className="text-xs sm:text-sm mx-1 sm:mx-2 truncate">
          {titleContent}
        </span>
        {org && (
          <span className="text-xs sm:text-sm opacity-60 shrink-0">
            {"@ " + org}
          </span>
        )}
      </div>
    </div>
  );
}

function FooterLinks() {
  const links = [
    {
      label: "Linkedin",
      href: "https://www.linkedin.com/in/fabriciomagoga/",
      external: true,
    },
    {
      label: "Github",
      href: "https://github.com/fabricio-magoga",
      external: true,
    },
    {
      label: "Email",
      href: "mailto:contato@fabriciomagoga.com.br",
      external: true,
    },
    {
      label: "Resume",
      href: "/CV_FABRICIO_MAGOGA.pdf",
      external: false,
    },
  ];

  return (
    <nav aria-label="Social links">
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm sm:text-base font-mono">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            {...(link.external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className="hover:underline"
          >
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

export default function ResumePage() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  const [currentShape, setCurrentShape] = useState(() => {
    if (typeof window === "undefined") return "auto";
    const saved = localStorage.getItem("shape");
    return saved || "auto";
  });

  const [shapeIndex, setShapeIndex] = useState(0);

  const SHAPES = ["cat", "warp", "sphere", "ripple", "swirl"];

  // Determina qual shape deve ser exibido
  const displayShape =
    currentShape === "disabled"
      ? "sphere"
      : currentShape === "auto"
        ? SHAPES[shapeIndex]
        : currentShape;

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") {
      setIsDarkMode(saved === "dark");
      document.documentElement.dataset.theme = saved;
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const theme = isDarkMode ? "dark" : "light";
    localStorage.setItem("theme", theme);
    document.cookie = `theme=${theme}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.dataset.theme = theme;
  }, [isDarkMode, isHydrated]);

  // Effect para salvar shape no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem("shape", currentShape);
  }, [currentShape]);

  // Effect para alternar o shape automaticamente quando em modo "auto"
  useEffect(() => {
    if (currentShape === "auto") {
      const interval = setInterval(() => {
        setShapeIndex((prev) => (prev + 1) % SHAPES.length);
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [currentShape]);

  return (
    <div
      className={`relative flex flex-col md:flex-row ${
        isHydrated ? "opacity-100" : "opacity-0"
      } ${isDarkMode ? "bg-black" : "bg-white"}`}
    >
      <div className="w-full h-[30vh] md:h-auto md:w-1/2 md:order-2 relative shrink-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={displayShape}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }} // Duração da transição
            className="w-full h-full"
          >
            <Dithering
              style={{ height: "100%", width: "100%" }}
              colorBack={isDarkMode ? "hsl(0, 0%, 0%)" : "hsl(0, 0%, 100%)"}
              colorFront={
                isDarkMode ? "hsl(320, 100%, 70%)" : "hsl(320, 100%, 50%)"
              }
              shape={displayShape as any}
              type="4x4"
              pxSize={1}
              offsetX={0}
              offsetY={0}
              scale={0.8}
              rotation={0}
              speed={currentShape === "disabled" ? 0 : 0.2}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content panel */}
      <div
        className={`w-full md:w-1/2 md:order-1 font-mono relative z-10 flex flex-col h-screen overflow-y-auto ${
          isDarkMode ? "bg-black text-white" : "bg-white text-black"
        }`}
      >
        <div className="flex-1 p-5 sm:p-8">
          {/* Top bar with site name and theme toggle */}
          <div className="flex items-center justify-between mb-8 sm:mb-12">
            <h1 className="text-sm sm:text-lg font-normal">
              <Link
                href="/"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                fabriciomagoga.com.br
              </Link>
            </h1>
            <div className="flex items-center gap-3">
              <ShapeSelector
                currentShape={currentShape}
                onShapeChange={setCurrentShape}
                isDarkMode={isDarkMode}
              />
              <ThemeToggle
                isDarkMode={isDarkMode}
                onToggle={() => setIsDarkMode(!isDarkMode)}
              />
            </div>
          </div>

          {/* Name and title */}
          <header className="mb-8 sm:mb-12">
            <h2 className="text-base sm:text-lg font-normal text-balance">
              <Link
                href="https://www.google.com/search?q=Fabrício Magoga"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                FABRÍCIO MAGOGA
              </Link>
            </h2>
            <h3 className="text-base sm:text-lg font-normal opacity-80">
              SOFTWARE ENGINEER
            </h3>
          </header>

          <div className="flex-1">
            {/* Experience Section */}
            <section
              className="mb-8 sm:mb-12 space-y-2"
              aria-label="Experience"
            >
              <h4 className="text-sm sm:text-base font-normal opacity-50 uppercase tracking-wider">
                Experience
              </h4>
              <SectionEntry
                date="Oct 2025 → Present"
                title="IT Intern"
                org="INSS"
              />
            </section>

            {/* Education Section */}
            <section className="mb-8 sm:mb-12 space-y-2" aria-label="Education">
              <h4 className="text-sm sm:text-base font-normal opacity-50 uppercase tracking-wider">
                Education
              </h4>
              <SectionEntry
                date="2025 → 2028"
                title="Engenharia de Software"
                org="FIAP"
                href="https://www.fiap.com.br/graduacao/bacharelado/engenharia-de-software/"
                target="_blank"
                rel="noopener noreferrer"
              />
              <SectionEntry
                date="2025 → 2028"
                title="Defesa Cibernética"
                org="FATEC JD"
                href="https://fatecjd.edu.br/site/defesa-cibernetica/"
                target="_blank"
                rel="noopener noreferrer"
              />
              <SectionEntry
                date="2022 → 2024"
                title="Técnico em Informática"
                org="Escolas Anchieta"
                href="https://tecnicos.anchieta.br/cursos-tecnicos/tecnico-em-informatica/"
                target="_blank"
                rel="noopener noreferrer"
              />
            </section>

            {/* Projects Section */}
            <section className="mb-8 sm:mb-12 space-y-2" aria-label="Projects">
              <h4 className="text-sm sm:text-base font-normal opacity-50 uppercase tracking-wider">
                Projects
              </h4>
              <SectionEntry date="2025" title="URL Shortener" href="/url" />
            </section>
          </div>
        </div>

        {/* Footer Links - flows naturally instead of absolute positioning */}
        <footer className="shrink-0 p-5 sm:p-8 pt-0">
          <FooterLinks />
        </footer>
      </div>
    </div>
  );
}
