import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { X } from "lucide-react";
import { CSSProperties, ReactNode } from "react";

export function RecordDialog({
  onConfirm,
  children,
}: {
  onConfirm?: () => void;
  children: ReactNode;
}) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>{children}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="data-[state=open]:animate-overlayShow fixed inset-0 bg-black/50" />
        <AlertDialog.Content className="data-[state=open]:animate-contentShow fixed left-1/2 top-1/2 w-full max-w-xs -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-black/20 p-0.5 backdrop-blur-3xl">
          <div
            className="absolute inset-0 border-2 border-transparent pointer-events-none rounded-3xl"
            style={
              {
                background: `linear-gradient(90deg, #CA9C43 0%, #916E2B 27.4%, #6A4F1B 59.4%, #473209 100%)`,
                "-webkit-mask": `linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)`,
                mask: `linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)`,
                "-webkit-mask-composite": "destination-out",
                "mask-composite": "exclude",
              } as CSSProperties
            }
          />
          <div className="px-3 py-4">
            <AlertDialog.Title className="pb-2.5 text-sm font-medium text-white">
              Do you want to record the full experience?
            </AlertDialog.Title>
            <div className="flex justify-around">
              <AlertDialog.Cancel asChild>
                <button className="inline-flex items-center justify-center rounded-md border border-[#B8860B] px-6 py-2 font-medium leading-none text-white outline-none hover:bg-[#B8860B] hover:text-black focus:shadow-[0_0_0_2px] focus:shadow-black">
                  No
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action
                asChild
                onClick={() => {
                  onConfirm?.();
                }}
              >
                {/* background: linear-gradient(90deg, #CA9C43 0%, #92702D 100%); */}
                <button className="inline-flex items-center justify-center rounded-md bg-gradient-to-br from-[#CA9C43] to-[#92702D] px-4 py-2 font-medium leading-none text-white outline-none hover:bg-[#DAA520] focus:shadow-[0_0_0_2px] focus:shadow-black">
                  Yes
                </button>
              </AlertDialog.Action>
            </div>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
