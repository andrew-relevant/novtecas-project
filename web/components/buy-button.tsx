"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ModalForm } from "@/components/modal-form";
import { BuyForm } from "@/components/forms/buy-form";

interface BuyButtonProps {
  productTitle: string;
}

export function BuyButton({ productTitle }: BuyButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="lg" onClick={() => setOpen(true)}>
        Купить
      </Button>
      <ModalForm open={open} onOpenChange={setOpen} title="Купить">
        <BuyForm
          productTitle={productTitle}
          onSuccess={() => setOpen(false)}
        />
      </ModalForm>
    </>
  );
}
