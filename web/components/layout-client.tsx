"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { ModalForm } from "@/components/modal-form";
import { ContactForm } from "@/components/forms/contact-form";
import { CallbackForm } from "@/components/forms/callback-form";
import { Toaster } from "@/components/ui/toaster";

export function LayoutClient({ children }: { children: React.ReactNode }) {
  const [contactOpen, setContactOpen] = useState(false);
  const [callbackOpen, setCallbackOpen] = useState(false);

  return (
    <>
      <SiteHeader
        onOpenContactModal={() => setContactOpen(true)}
        onOpenCallbackModal={() => setCallbackOpen(true)}
      />
      <main className="min-h-[calc(100vh-10rem)]">{children}</main>

      <ModalForm
        open={contactOpen}
        onOpenChange={setContactOpen}
        title="Обратная связь"
      >
        <ContactForm onSuccess={() => setContactOpen(false)} />
      </ModalForm>

      <ModalForm
        open={callbackOpen}
        onOpenChange={setCallbackOpen}
        title="Заказать звонок"
      >
        <CallbackForm onSuccess={() => setCallbackOpen(false)} />
      </ModalForm>

      <Toaster />
    </>
  );
}
