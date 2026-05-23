import PageWrapper from '../components/layout/PageWrapper';

export default function Placeholder({ title }) {
  return (
    <PageWrapper title={title}>
      <p className="text-secondary">Coming soon — API is ready.</p>
    </PageWrapper>
  );
}
