import clsx from "clsx";
import { Icons } from "../../../../components/icons";

import { Link } from "react-router-dom";
import { colors } from "../../../../api/attributes/color";
import { ColorPalette } from "../../../../components/color-palette";
import { LoadingProducts } from "../../../../components/loading";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { MascaraProvider, useMascaraContext } from "./mascara-context";
import { useMascaraQuery } from "./mascara-query";

export function MascaraSelector() {
  return (
    <div className="mx-auto w-full divide-y px-4">
      <FamilyColorSelector />

      <ColorSelector />

      <div className="flex h-[35px] w-full items-center justify-between text-center sm:h-10">
        <Link
          className={`relative grow text-[11.2px] sm:text-base lg:text-[20.8px]`}
          to="/virtual-try-on/lashes"
        >
          <span className={"text-white/60"}>Lashes</span>
        </Link>
        <div className="h-5 border-r border-white"></div>
        <Link
          className={`relative grow text-[11.2px] sm:text-base lg:text-[20.8px]`}
          to="/virtual-try-on/mascara"
        >
          <span className={"text-white"}>Mascara</span>
        </Link>
      </div>

      <ProductList />
    </div>
  );
}

function FamilyColorSelector() {
  const { t } = useTranslation()
  const { colorFamily, setColorFamily } = useMascaraContext();

  return (
    <div
      className="flex w-full items-center space-x-2 overflow-x-auto py-2 no-scrollbar"
      data-mode="lip-color"
    >
      {colors.map((item, index) => (
        <button
          type="button"
          className={clsx(
            "inline-flex h-5 shrink-0 items-center gap-x-2 rounded-full border border-transparent px-2 py-1 text-[0.625rem] text-white/80",
            {
              "border-white/80": colorFamily === item.value,
            },
          )}
          onClick={() => setColorFamily(item.value)}
        >
          <div
            className="size-2.5 shrink-0 rounded-full"
            style={{
              background: item.hex,
            }}
          />
          <span className="text-[0.625rem]">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

function ColorSelector() {
  const { colorFamily, selectedColor, setSelectedColor } = useMascaraContext();
  const { data } = useMascaraQuery({
    color: colorFamily,
    sub_color: null,
  });

  const extracted_sub_colors = extractUniqueCustomAttributes(
    data?.items ?? [],
    "hexacode",
  ).flatMap((item) => item.split(","));

  return (
    <div className="mx-auto w-full">
      <div className="flex w-full items-center space-x-3 overflow-x-auto py-2 no-scrollbar sm:space-x-4">
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-x-2 rounded-full border border-transparent text-white/80"
          onClick={() => {
            setSelectedColor(null);
          }}
        >
          <Icons.empty className="size-5 sm:size-[1.875rem]" />
        </button>
        {extracted_sub_colors.map((color, index) => (
          <ColorPalette
            key={color}
            size="large"
            palette={{ color }}
            selected={selectedColor === color}
            onClick={() => setSelectedColor(color)}
          />
        ))}
      </div>
    </div>
  );
}

function ProductList() {
  const { colorFamily } = useMascaraContext();

  const { data, isLoading } = useMascaraQuery({
    color: colorFamily,
    sub_color: null,
  });

  return (
    <div className="flex w-full gap-2 overflow-x-auto pb-2 pt-4 no-scrollbar active:cursor-grabbing sm:gap-4">
      {isLoading ? (
        <LoadingProducts />
      ) : (
        data?.items.map((product, index) => {
          return <VTOProductCard product={product} key={product.id} />;
        })
      )}
    </div>
  );
}
