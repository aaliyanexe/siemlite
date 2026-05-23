export default function Badge({ children, className = '' }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-sm badge-text ${className}`}>
      {children}
    </span>
  );
}
