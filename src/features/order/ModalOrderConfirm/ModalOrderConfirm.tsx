import { Modal } from "@/shared/ui/Modal/Modal";
import { OrderList } from "@/widgets/Order/ui/OrderList/OrderList";
import { Button } from "@/shared/ui/Button/Button";
import { ModalOrderConfirmProps } from "./ModalOrderConfirm.types";
import "./ModalOrderConfirm.styles.css";
import { ModalOrderDelete } from "../ModalOrderDelete/ModalOrderDelete";
// Kept for the product decision record: the success modal was replaced by the global toast.
// import { ModalOrderSuccess } from "../ModalOrderSuccess/ModalOrderSuccess";
import { useState } from "react";

export const ModalOrderConfirm = ({
  renderActions,
  isOpen,
  onClose,
  onCancel,
  onEdit,
  onConfirm,
  isConfirming = false,
  title,
  deliveryType="delivery",
  deliveryTime,
  clientPhone,
  address,
  intercom,
  payment,
  promocode,
  promocodeDescription,
  comment,
  items,
  totalPrice,
  deliveryPrice = 0,
}: ModalOrderConfirmProps) => {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleCancelClick = () => {
    setIsDeleteOpen(true);
  };

  const handleConfirmCancel = () => {
    setIsDeleteOpen(false);
    onCancel?.();
    onClose();
  };

  const handleCloseDelete = () => {
    setIsDeleteOpen(false);
  };

  const handleConfirmClick = async () => {
    try {
      const confirmed = await onConfirm?.();
      if (confirmed === false) return;
    } catch {
      // The parent exposes the actionable API error while the modal remains open.
    }
  };

  return (
    <>
      <Modal title={title} isOpen={isOpen} onClose={onClose}>
        <div className="modal-order-confirm__content">
          {/* Левая колонка */}
          <div className="modal-order-confirm__info">
            <h2 className="modal-order-confirm__info-title">О заказе</h2>

            <div className="modal-order-confirm__field">
              <span className="modal-order-confirm__field-label">
                {deliveryType === "pickup" ? "Самовывоз" : "Доставка"}
              </span>
              <span className="modal-order-confirm__field-value">
                {deliveryTime}
              </span>
            </div>

            <div className="modal-order-confirm__field">
              <span className="modal-order-confirm__field-label">
                Телефон клиента
              </span>
              <span className="modal-order-confirm__field-value">
                {clientPhone}
              </span>
            </div>

            <div className="modal-order-confirm__field">
              <span className="modal-order-confirm__field-label">Адрес</span>
              <span className="modal-order-confirm__field-value">{address}</span>
            </div>

            {deliveryType === "delivery" && (
              <div className="modal-order-confirm__field">
                <span className="modal-order-confirm__field-label">Домофон</span>
                <span className="modal-order-confirm__field-value modal-order-confirm__field-value--accent">
                  {intercom}
                </span>
              </div>
            )}

            {promocode && (
              <div className="modal-order-confirm__field">
                <span className="modal-order-confirm__field-label">Промокод</span>
                <span className="modal-order-confirm__field-value">
                  {promocode}
                </span>
                {promocodeDescription && (
                  <span className="modal-order-confirm__field-value">
                    {promocodeDescription}
                  </span>
                )}
              </div>
            )}

            {comment && (
              <div className="modal-order-confirm__field">
                <span className="modal-order-confirm__field-label">
                  Комментарий
                </span>
                <span className="modal-order-confirm__field-value">
                  {comment}
                </span>
              </div>
            )}

            {deliveryType === "delivery" && (
              <div className="modal-order-confirm__field">
              <span className="modal-order-confirm__field-label">Оплата</span>
              <span className="modal-order-confirm__field-value">{payment}</span>
            </div>
          )}
          </div>

          {/* Правая колонка */}
          <div className="modal-order-confirm__right">
            <OrderList
              items={items}
              totalPrice={totalPrice}
              deliveryPrice={deliveryPrice}
              variant="wide"
              className="modal-order-confirm__order-list"
            />

            <div className="modal-order-confirm__actions">
              {renderActions ? renderActions() : (
                <>
                  <div className="modal-order-confirm__actions-left">
                    <Button
                      variant="base"
                      theme="error"
                      size="sm"
                      onClick={handleCancelClick}
                      className="!w-auto px-5"
                    >
                      Отменить
                    </Button>
                    <Button
                      variant="base"
                      theme="secondary"
                      size="sm"
                      onClick={onEdit}
                      className="!w-auto px-5"
                    >
                      Редактировать
                    </Button>
                  </div>
                  <Button
                    variant="base"
                    theme="primary"
                    size="md"
                    onClick={handleConfirmClick}
                    disabled={isConfirming}
                    className="!w-auto px-5"
                  >
                    {isConfirming ? "Создание…" : "Подтвердить заказ"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Modal>
      <ModalOrderDelete isOpen={isDeleteOpen} onClose={handleCloseDelete} onCancelOrder={handleConfirmCancel}/>
      {/* <ModalOrderSuccess isOpen={isSuccessOpen} onClose={handleCloseSuccess}/> */}
    </>
  );
};
