import { Layout, Header } from '../components/layouts';

interface ExpenseFormCompletePageProps {
  onBackToForm: () => void;
}

export default function ExpenseFormCompletePage({
  onBackToForm,
}: ExpenseFormCompletePageProps) {
  return (
    <Layout>
      <Header
        icon={<i className="bi bi-check-circle text-5xl"></i>}
        title="提出完了"
        description="経費精算書を正常に提出しました"
        iconBgColor="bg-green-100"
        iconTextColor="text-green-600"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          onClick={onBackToForm}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        >
          <i className="bi bi-arrow-left"></i>
          新規提出
        </button>
      </div>
    </Layout>
  );
}
