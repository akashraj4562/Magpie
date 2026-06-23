import { PageHeader } from '../components/primitives';

export function Soon({ title, sub }: { title: string; sub?: string }) {
  return (
    <div>
      <PageHeader title={title} sub={sub} />
      <div className="rounded-[10px] border border-line bg-surface px-4 py-10 text-center text-sm text-mute">Being built in the next increment.</div>
    </div>
  );
}
