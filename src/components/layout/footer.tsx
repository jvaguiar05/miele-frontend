import { Shield, FileText, HelpCircle, Github } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  const footerLinks = [
    { label: "Privacidade", href: "/privacy", icon: Shield },
    { label: "Termos", href: "/terms", icon: FileText },
    { label: "Suporte", href: "/support", icon: HelpCircle },
  ];

  return (
    <footer className="border-t border-border/40 bg-background/50 backdrop-blur-sm">
      <div className="container px-3 sm:px-4">
        <div className="flex flex-col sm:flex-row h-auto sm:h-12 items-center justify-between py-3 sm:py-0 gap-3 sm:gap-0">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-gradient-to-br from-primary/80 to-primary/60 flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">
                M
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Miele. Todos os direitos reservados.
            </p>
          </div>
          <nav className="flex flex-wrap items-center justify-center sm:justify-end gap-0.5 sm:gap-1">
            {footerLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.label}
                  to={link.href}
                  className="group flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                >
                  <Icon className="h-3 w-3 opacity-70 group-hover:opacity-100 transition-opacity" />
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              );
            })}
            <div className="hidden sm:block h-3 w-px bg-border mx-1" />
            <a
              href="https://github.com/your-org/miele"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
              title="GitHub"
            >
              <Github className="h-3 w-3 opacity-70 group-hover:opacity-100 transition-opacity" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
