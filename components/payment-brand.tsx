import { Icon } from "./ui/icon";

export type PaymentBrandName = "telebirr" | "mpesa" | "bank";
type PaymentBrandProps = { brand: PaymentBrandName; primary?: boolean; compact?: boolean };
const TELEBIRR_OFFICIAL_LOGO = "https://www.ethiotelecom.et/wp-content/uploads/2025/10/telebirr-logo-01.png";
const MPESA_OFFICIAL_BRAND_PAGE = "https://www.safaricom.co.ke/brand-assets?id=2021";

/** Payment trademarks remain separate from product icons and are never approximated with custom SVG paths. */
export function PaymentBrand({ brand, primary = false, compact = false }: PaymentBrandProps) {
  if (brand === "telebirr") return <span className={`payment-brand${primary ? " primary" : ""}${compact ? " compact" : ""}`} data-brand="telebirr"><span className="payment-brand-logo-frame"><img alt="telebirr" className="payment-brand-logo telebirr-logo" decoding="async" height={40} loading="lazy" referrerPolicy="no-referrer" src={TELEBIRR_OFFICIAL_LOGO} width={70} /></span><span className="payment-brand-copy"><strong>telebirr</strong>{!compact && <small>Primary local payment rail</small>}</span></span>;
  if (brand === "mpesa") return <a aria-label="Open Safaricom official M-PESA brand asset page" className={`payment-brand pending${compact ? " compact" : ""}`} data-brand="mpesa" href={MPESA_OFFICIAL_BRAND_PAGE} rel="noopener noreferrer" target="_blank" title="Safaricom official M-PESA brand asset page"><span className="payment-brand-logo-frame pending" aria-hidden="true"><Icon name="smartphone" size={22} /></span><span className="payment-brand-copy"><strong>M-PESA</strong>{!compact && <small>Official logo upload required</small>}</span></a>;
  return <span className={`payment-brand neutral${compact ? " compact" : ""}`} data-brand="bank"><span className="payment-brand-logo-frame" aria-hidden="true"><Icon name="landmark" size={22} /></span><span className="payment-brand-copy"><strong>Bank transfer</strong>{!compact && <small>Statement and settlement imports</small>}</span></span>;
}

export function PaymentBrandRow() { return <div className="payment-brand-row" aria-label="Reconciliation payment rails"><PaymentBrand brand="telebirr" primary /><PaymentBrand brand="mpesa" /><PaymentBrand brand="bank" /></div>; }
