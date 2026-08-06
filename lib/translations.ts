import type { ModulePriority } from "./erp-modules";
import en from "./locales/en.json";
import am from "./locales/am.json";

export type Language = "en" | "am" | "ti";
export type SupportedLanguage = Exclude<Language, "ti">;

export type ModuleTranslation = {
  title: string;
  shortTitle: string;
  description: string;
  features: string[];
  controls: string[];
};

type DashboardMetricCopy = { label: string; change: string };
type DashboardTransactionCopy = { description: string; category: string; date: string };

export type Dictionary = {
  language: { label: string; english: string; amharic: string };
  priorityLabels: Record<ModulePriority, string>;
  dashboard: {
    brandSubtitle: string;
    nav: { overview: string; modules: string; finance: string; sales: string; purchasing: string; inventory: string; reports: string };
    openLegacy: string;
    companyLocation: string;
    date: string;
    greeting: string;
    summary: string;
    exportReport: string;
    newTransaction: string;
    erpFoundation: string;
    coreModules: string;
    viewAllModules: string;
    phase: string;
    financialPerformance: string;
    revenueOverview: string;
    period: string;
    last12Months: string;
    fromLastYear: string;
    revenueChart: string;
    businessHealth: string;
    excellentCondition: string;
    cashFlow: string;
    strong: string;
    expenseControl: string;
    good: string;
    debtCollection: string;
    needsAttention: string;
    latestActivity: string;
    recentTransactions: string;
    viewAll: string;
    months: string[];
    metricItems: Record<"sales" | "expenses" | "cash" | "debt", DashboardMetricCopy>;
    transactionItems: Record<"wholesale" | "utilities" | "retail" | "restock", DashboardTransactionCopy>;
  };
  modulesPage: {
    backDashboard: string;
    architecture: string;
    title: string;
    intro: string;
    plannedModules: string;
    requiredPhase1: string;
    operationalPhase2: string;
    growthPhase3: string;
    priorityCopy: Record<ModulePriority, string>;
    moduleSingular: string;
    modulePlural: string;
    phase: string;
  };
  moduleDetail: {
    allModules: string;
    phase: string;
    implementationPhase: string;
    businessCapabilities: string;
    manageTitle: string;
    controlsGovernance: string;
    erpGradeTitle: string;
    implementationStatus: string;
    statusTitle: string;
    statusDescription: string;
    returnDashboard: string;
  };
  moduleItems: Record<string, ModuleTranslation>;
};

export const dictionaries: Record<SupportedLanguage, Dictionary> = {
  en: en as Dictionary,
  am: am as Dictionary,
};
