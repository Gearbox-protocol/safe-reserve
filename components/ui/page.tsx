import { BackButton } from "@/components/ui/back-button";

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  backButton?: {
    href: string;
    text: string;
  };
}

export function PageLayout({ children, title, backButton }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      {backButton && (
        <BackButton href={backButton.href} text={backButton.text} />
      )}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
      </div>
      {children}
    </div>
  );
}
