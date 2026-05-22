import express from 'express';

const router = express.Router();

router.get('/', (_req, res) => {
  res.json({
    feature: 'Vendor Cash Commitments',
    summary: { committed30Day: 128500, committed60Day: 214300, renewalRisk: 3, runwayImpactDays: 12 },
    commitments: [
      { vendor: 'Cloud Hosting', dueDate: '2026-06-01', amount: 42000, category: 'Infrastructure', action: 'Renegotiate term' },
      { vendor: 'Ingredient Supplier', dueDate: '2026-06-08', amount: 36500, category: 'COGS', action: 'Protect supply' },
      { vendor: 'Fleet Lease', dueDate: '2026-06-15', amount: 18000, category: 'Operations', action: 'Review utilization' },
    ],
    recommendations: [
      'Sequence committed outflows against forecasted weekly receipts.',
      'Flag renewals that compress runway by more than seven days.',
      'Move flexible vendors into delayed payment terms before peak inventory weeks.',
    ],
  });
});

export default router;
