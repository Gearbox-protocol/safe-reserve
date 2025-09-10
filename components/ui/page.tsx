import { BackButton } from "@/components/ui/back-button";
import { Card } from "./card";

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: JSX.Element;
  icon?: JSX.Element;
  backButton?: {
    href: string;
    text?: string;
    onClick?: () => void;
  };
  actionButton?: JSX.Element;
}

export function PageLayout({
  children,
  title,
  description,
  icon,
  backButton,
  actionButton,
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white p-6 overflow-y-auto">
      {backButton && (
        <BackButton
          href={backButton.href}
          text={backButton.text}
          onClick={backButton.onClick}
        />
      )}

      <div className="flex items-center space-x-4 mb-6 w-full">
        {icon}

        <div className="w-full">
          <div className="flex justify-between items-center w-full">
            <h1 className="text-3xl font-bold">{title}</h1>
            {actionButton}
          </div>
          {description}
        </div>
      </div>

      <Card className="bg-black border-0 overflow-y-auto">{children}</Card>
    </div>
  );
}
