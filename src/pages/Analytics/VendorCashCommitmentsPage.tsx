import React, { useEffect, useState } from 'react';

interface Commitment {
  vendor: string;
  dueDate: string;
  amount: number;
  category: string;
  action: string;
}

export default function VendorCashCommitmentsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/vendor-cash-commitments')
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData({ error: 'Unable to load vendor cash commitments.' }));
  }, []);

  if (!data) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-900">Vendor Cash Commitments</h1>
      <p className="mt-2 text-gray-600">Committed vendor outflows mapped to runway impact and renewal risk.</p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <Metric label="30-Day Committed" value={`$${data.summary?.committed30Day?.toLocaleString()}`} />
        <Metric label="60-Day Committed" value={`$${data.summary?.committed60Day?.toLocaleString()}`} />
        <Metric label="Renewal Risk" value={data.summary?.renewalRisk} />
        <Metric label="Runway Impact" value={`${data.summary?.runwayImpactDays} days`} />
      </div>
      <div className="mt-6 bg-white rounded-lg border border-gray-200 overflow-hidden">
        {(data.commitments || []).map((item: Commitment) => (
          <div key={item.vendor} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 border-b border-gray-100">
            <strong>{item.vendor}</strong><span>{item.dueDate}</span><span>${item.amount.toLocaleString()}</span><span>{item.category}</span><span>{item.action}</span>
          </div>
        ))}
      </div>
      <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-900">Recommendations</h2>
        <ul className="mt-3 list-disc pl-5 text-gray-700">{data.recommendations?.map((item: string) => <li key={item}>{item}</li>)}</ul>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="bg-white rounded-lg border border-gray-200 p-4"><div className="text-sm text-gray-500">{label}</div><div className="text-2xl font-semibold text-gray-900">{value}</div></div>;
}
