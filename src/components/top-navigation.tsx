import { ChevronLeft, Heart, Plus, X } from "lucide-react";
import { useCamera } from "../context/recorder-context";
import { Link } from "react-router-dom";
import { Icons } from "./icons";
import { CSSProperties } from "react";
import { useCartContext } from "../context/cart-context";

export function TopNavigation({
  item = false,
  cart = false,
}: {
  item?: boolean;
  cart?: boolean;
}) {
  const { flipCamera } = useCamera();
  const { cartItemCount } = useCartContext();

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-5 [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
      <div className="flex flex-col gap-4">
        <button className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-black/25 backdrop-blur-3xl">
          <ChevronLeft className="size-6 text-white" />
        </button>

        {item ? (
          <div className="space-y-2 pt-10">
            <div className="flex gap-x-4">
              <button className="flex size-8 shrink-0 items-center justify-center rounded-full bg-black/25 backdrop-blur-3xl">
                <Heart className="size-5 text-white" />
              </button>
              <div>
                <p className="font-semibold leading-4 text-white">
                  Pro Filt’r Soft Matte Longwear Liquid Found
                </p>
                <p className="text-white/60">Brand Name</p>
              </div>
            </div>
            <div className="flex items-center gap-x-4">
              <button className="flex size-8 shrink-0 items-center justify-center rounded-full bg-black/25 backdrop-blur-3xl">
                <Plus className="size-5 text-white" />
              </button>
              <p className="font-medium text-white">$52.00</p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-4">
        <Link
          type="button"
          className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-black/25 backdrop-blur-3xl"
          to="/"
        >
          <X className="size-6 text-white" />
        </Link>

        <div className="relative -m-0.5 p-0.5">
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent"
            style={
              {
                background: `linear-gradient(148deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0.77) 100%) border-box`,
                "-webkit-mask": `linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)`,
                mask: `linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)`,
                "-webkit-mask-composite": "destination-out",
                "mask-composite": "exclude",
              } as CSSProperties
            }
          />
          <button
            type="button"
            className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-black/25 backdrop-blur-3xl"
            onClick={flipCamera}
          >
            <Icons.flipCamera className="size-6 text-white" />
          </button>
        </div>

        {cart && (
          <button
            type="button"
            className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-black/25 backdrop-blur-3xl"
          >
            <Icons.myCart className="size-6 text-white" />
            <span className="absolute bottom-[5px] right-[5px] flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {cartItemCount}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
