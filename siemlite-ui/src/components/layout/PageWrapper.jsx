import Sidebar from './Sidebar';

export default function PageWrapper({ children, title }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        {title && <h2 className="text-2xl font-semibold text-white mb-6">{title}</h2>}
        {children}
      </main>
    </div>
  );
}
