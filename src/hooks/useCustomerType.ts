import { useShop } from "./useShop";
import { CustomerType } from "@/lib/types";

export interface UseCustomerTypeReturn {
  customerType: CustomerType | undefined;
  isExternalQRCustomer: boolean;
  isPlatformCustomer: boolean;
  isEnterpriseCustomer: boolean;
  isLoading: boolean;
}

/**
 * Hook to detect customer type and provide helper flags
 * @returns Customer type information and loading state
 */
export const useCustomerType = (): UseCustomerTypeReturn => {
  const { data: shop, isLoading } = useShop();

  const customerType = shop?.customers?.type;

  return {
    customerType,
    isExternalQRCustomer: customerType === "external-qr-codes",
    isPlatformCustomer: customerType === "platform",
    isEnterpriseCustomer: customerType === "enterprise",
    isLoading,
  };
};
