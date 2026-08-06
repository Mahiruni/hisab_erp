export type MetricKey = "sales" | "expenses" | "cash" | "debt";

export type Metric = {
  key: MetricKey;
  value: string;
  tone: "positive" | "warning" | "neutral";
  icon: "sales" | "expense" | "cash" | "debt";
};

export type TransactionKey = "wholesale" | "utilities" | "retail" | "restock";

export type Transaction = {
  key: TransactionKey;
  id: string;
  amount: string;
  type: "income" | "expense";
};

export const metrics: Metric[] = [
  { key: "sales", value: "ETB 48,250", tone: "positive", icon: "sales" },
  { key: "expenses", value: "ETB 12,840", tone: "warning", icon: "expense" },
  { key: "cash", value: "ETB 186,400", tone: "positive", icon: "cash" },
  { key: "debt", value: "ETB 74,600", tone: "neutral", icon: "debt" },
];

export const transactions: Transaction[] = [
  { key: "wholesale", id: "TRX-1048", amount: "+ ETB 18,500", type: "income" },
  { key: "utilities", id: "TRX-1047", amount: "− ETB 4,250", type: "expense" },
  { key: "retail", id: "TRX-1046", amount: "+ ETB 12,800", type: "income" },
  { key: "restock", id: "TRX-1045", amount: "− ETB 8,590", type: "expense" },
];

export const monthlyPerformance = [42, 56, 48, 68, 61, 78, 72, 88, 82, 96, 91, 108];
