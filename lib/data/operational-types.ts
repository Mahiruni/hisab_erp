import type { OperationalModuleSlug } from "../operational-modules";

export type OperationalRecord = {
  id: string;
  number: string;
  type: string;
  title: string;
  description: string | null;
  counterparty: string | null;
  owner: string | null;
  status: string;
  priority: "low" | "normal" | "high" | "critical";
  amount: number;
  dueDate: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type OperationalActivity = {
  id: string;
  recordId: string;
  recordNumber: string;
  eventType: string;
  previousStatus: string | null;
  newStatus: string | null;
  message: string | null;
  createdAt: string;
};

export type OperationalSnapshot = {
  mode: "demo" | "live";
  moduleSlug: OperationalModuleSlug;
  organizationName: string;
  metrics: {
    total: number;
    active: number;
    completed: number;
    atRisk: number;
    value: number;
  };
  records: OperationalRecord[];
  activity: OperationalActivity[];
};
