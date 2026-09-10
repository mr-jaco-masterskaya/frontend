import { Button } from "@/shared/ui/Button/Button";
import { Modal } from "@/shared/ui/Modal/Modal"
import { Text } from "@/shared/ui/Typography/Typography";
import { useState } from "react";
import "./ModalTimeSelect.style.css";
import { ModalTimeSelectProps } from "./ModalTimeSelect.types";
import { timeSlots } from "../../utils/mocks";
import { Slot } from "../Slot/Slot";
import type { PreorderSlot } from "@/entities/delivery/model/types";

type DayPeriod = "morning" | "day" | "evening";

const getPeriod = (slot: PreorderSlot): DayPeriod | null => {
  const hour = Number((slot.start ?? String(slot.value)).slice(0, 2));
  if (!Number.isFinite(hour)) return null;
  if (hour < 12) return "morning";
  if (hour < 18) return "day";
  return "evening";
};

const displaySlot = (slot: PreorderSlot) =>
  slot.label || (slot.start && slot.end ? `${slot.start} - ${slot.end}` : String(slot.value));

export const ModalTimeSelect = ({ isOpen, onClose, onTimeSelect, slots, isLoading = false, error = null }: ModalTimeSelectProps) => {
  const [activeDayPeriod, setActiveDayPeriod] = useState<DayPeriod | null>(null);
  const [activeTimePeriod, setActiveTimePeriod] = useState<string | null>(null);
  const periodSlots = slots?.filter((slot) => slot.start && slot.end).reduce<Record<DayPeriod, PreorderSlot[]>>((result, slot) => {
    const period = getPeriod(slot);
    if (period) result[period].push(slot);
    return result;
  }, { morning: [], day: [], evening: [] });

  const handleClose = () => {
    setActiveDayPeriod(null);
    setActiveTimePeriod(null);
    onClose();
  }

  return (
    <Modal title="Выбор времени" isOpen={isOpen} onClose={handleClose}>
      <div className="time-select-container">
        <Text variant="label-s-regular-12">Выберите время суток</Text>
        <div className="period-group">
          <Slot 
            variant="daySlot"
            isActive={activeDayPeriod==="morning"}
            onClick={() => {
              setActiveDayPeriod("morning");
              setActiveTimePeriod(null);
            }}
          >
              Утро 10:00 - 11:45
          </Slot>
          <Slot 
            variant="daySlot"
            isActive={activeDayPeriod==="day"}
            onClick={() => {
              setActiveDayPeriod("day");
              setActiveTimePeriod(null);
            }}
          >
            День 12:00 - 17:45
          </Slot>
          <Slot
            variant="daySlot"
            isActive={activeDayPeriod==="evening"}
            onClick={() => {
              setActiveDayPeriod("evening");
              setActiveTimePeriod(null);
            }}
          >
            Вечер 18:00 - 21:00
          </Slot>
        </div>
        
        {activeDayPeriod && (
          <div className="time-slots-container">
            <Text variant="label-s-regular-12">Выберите период доставки</Text>
            {isLoading && <Text>Загрузка доступного времени…</Text>}
            {error && <Text>{error}</Text>}
            {!isLoading && !error && <ul className="time-slots-list">
              {(periodSlots ? periodSlots[activeDayPeriod].map((slot) => ({ value: `${slot.start} - ${slot.end}`, label: displaySlot(slot), disabled: slot.disabled })) : timeSlots[activeDayPeriod].map((slot) => ({ value: slot, label: slot, disabled: false }))).map((slot) => (
                <li key={slot.value}>
                  <Slot 
                    variant="timeSlot"
                    isActive={activeTimePeriod === slot.value}
                    onClick={() => !slot.disabled && setActiveTimePeriod(slot.value)}
                  >
                    {slot.label}
                  </Slot>
                </li>
              ))}
            </ul>}
            <div className="time-slots-btns-group">
              <Button 
                variant="base" 
                theme="secondary" 
                className="time-select-cancel-btn"
                onClick={handleClose}
              >
                <Text>Отмена</Text>
              </Button>
              <Button 
                variant="base" 
                theme={activeTimePeriod ? "primary" : "secondary"} 
                className="time-select-confirm-btn"
                onClick={() => {
                  if (!activeTimePeriod) return;
                  onTimeSelect(activeTimePeriod);
                  handleClose();
                }}
              >
                <Text>Выбрать</Text>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
