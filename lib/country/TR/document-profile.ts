import type { ReceiptContext } from "@/app/api/receipt/analyze/types";
import type { DocumentProfile } from "../base";

export function resolveTurkishDocumentProfile(context: ReceiptContext): DocumentProfile {
  if ((context as any).isEcommerceEfatura) {
    return "efatura";
  }

  if ((context as any).isPosSlip) {
    return "pos-slip";
  }

  return "receipt";
}
