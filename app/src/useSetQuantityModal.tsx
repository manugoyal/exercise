import { useCallback, useRef, useState } from "react";
import { z } from "zod";

export type SetQuantityModalInfo = {
  quantityName: string;
  initialQuantityValue: number | null | undefined;
  setQuantity: (quantity: number) => void;
};

export function useSetQuantityModal(key: number) {
  const [quantityName, setQuantityName] = useState<string>("");
  const [quantityValue, setQuantityValue] = useState<string>("");
  const setQuantityRef = useRef<(quantity: number) => void>(() => {});
  const ref = useRef<HTMLDialogElement>(null);
  const onChangeQuantity = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setQuantityValue(e.target.value),
    [],
  );

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.currentTarget);
      const quantityInput = formData.get("quantity");
      const result = z.coerce
        .number()
        .nullable()
        .safeParse(quantityInput || null);
      if (!result.success) {
        alert(`Invalid quantity ${quantityInput}`);
        return;
      }
      const newQuantity = result.data;
      if (newQuantity !== null) {
        setQuantityRef.current(newQuantity);
      }
    } finally {
      ref.current?.close();
    }
  }, []);

  const handleCancel = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    ref.current?.close();
  }, []);

  const modal = (
    <dialog key={key} ref={ref}>
      <form onSubmit={handleSubmit}>
        <label>
          Enter {quantityName}:
          <input
            type="number"
            name="quantity"
            value={quantityValue}
            onChange={onChangeQuantity}
          />
        </label>
        <br />
        <button type="submit"> Submit </button>
        <br />
        <button onClick={handleCancel}> Cancel </button>
      </form>
    </dialog>
  );

  const showModal = useCallback((info: SetQuantityModalInfo) => {
    setQuantityName(info.quantityName);
    setQuantityValue(
      info.initialQuantityValue ? String(info.initialQuantityValue) : "",
    );
    setQuantityRef.current = info.setQuantity;
    ref.current?.showModal();
  }, []);

  return { modal, showModal };
}
