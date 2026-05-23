import Sidebar from './Sidebar';

export default function PageWrapper({ children, title }) {
  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto max-w-content">
        {title && <h2 className="page-title mb-8">{title}</h2>}
        {children}
      </main>
    </div>
  );
}
