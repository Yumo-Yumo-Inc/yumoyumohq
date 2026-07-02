export default function WelcomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-app-bg-base">
      {children}
    </div>
  );
}
