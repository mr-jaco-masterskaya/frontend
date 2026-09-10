import type { PreorderSlot } from "@/entities/delivery/model/types";

export type ModalTimeSelectProps = {
  isOpen: boolean; 
  onClose:() => void; 
  onTimeSelect: (val: string) => void;
  slots?: PreorderSlot[];
  isLoading?: boolean;
  error?: string | null;
}
