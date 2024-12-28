import clsx from "clsx";
import { colors } from "../../../../api/attributes/color";
import { patterns } from "../../../../api/attributes/pattern";
import { Product } from "../../../../api/shared";
import { ColorPalette } from "../../../../components/color-palette";
import { Icons } from "../../../../components/icons";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { useEyeLinerContext } from "./eye-liner-context";
import { useEffect, useState } from "react";
import { useMakeup } from "../../../../context/makeup-context";

export function SingleEyeLinerSelector({ product }: { product: Product }) {
  return (
    <div className="mx-auto w-full divide-y px-4">
      <div>
        <ColorSelector product={product} />
      </div>

      <ShapeSelector />
      <ProductList product={product} />
    </div>
  );
}

function ColorSelector({ product }: { product: Product }) {
  const { colorFamily, selectedColor, setSelectedColor } = useEyeLinerContext();

  const extracted_sub_colors = extractUniqueCustomAttributes(
    [product],
    "hexacode",
  ).flatMap((color) => color.split(","));

  return (
    <div className="mx-auto w-full py-1 sm:py-2">
      <div className="flex w-full items-center space-x-4 overflow-x-auto py-2.5 no-scrollbar">
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

const eyeliners = [
  "/media/unveels/vto/eyeliners/eyeliners_arabic-down 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_arabic-light 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_arabic-up 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_double-mod 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_down-basic 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_down-bold 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_down-light 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_middle-basic 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_middle-bold 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_middle-light 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_open-wings 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_up-basic 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_up-bold 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_up-light 1.png",
];

function ShapeSelector() {
  const { selectedShape, setSelectedShape } = useEyeLinerContext();

  return (
    <div className="mx-auto w-full py-4">
      <div className="flex w-full items-center space-x-4 overflow-x-auto no-scrollbar">
        {patterns.eyeliners.map((pattern, index) => (
          <button
            key={index}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center rounded-sm border border-transparent text-white/80",
              {
                "border-white/80": selectedShape === pattern.value,
              },
            )}
            onClick={() => {
              if (selectedShape === pattern.value) {
                setSelectedShape(null);
              } else {
                setSelectedShape(pattern.value);
              }
            }}
          >
            <img
              src={eyeliners[index % eyeliners.length]}
              alt="Eyebrow"
              className="size-[35px] rounded sm:size-[50px] lg:size-[65px]"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductList({ product }: { product: Product }) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const {
    colorFamily,
    setColorFamily,
    selectedColor,
    setSelectedColor,
    colorFamilyToInclude,
    setColorFamilyToInclude,
    selectedShape,
  } = useEyeLinerContext();

  const { setEyelinerColor, setEyelinerPattern, setShowEyeliner } = useMakeup();

  useEffect(() => {
    setEyelinerColor(selectedColor || "#ffffff");
    var pattern = patterns["eyeliners"].findIndex(
      (e) => e.value == selectedShape,
    );
    setEyelinerPattern(pattern != -1 ? pattern : 0);
    setShowEyeliner(selectedColor != null);
  }, [selectedColor, selectedShape]);

  if (colorFamilyToInclude == null && product != null) {
    setColorFamilyToInclude(
      product.custom_attributes.find((c) => c.attribute_code === "color")
        ?.value,
    );
  }

  const handleProductClick = (product: Product) => {
    console.log(product);
    setSelectedProduct(product);
    setColorFamily(
      product.custom_attributes.find((item) => item.attribute_code === "color")
        ?.value,
    );
    setSelectedColor(
      product.custom_attributes.find(
        (item) => item.attribute_code === "hexacode",
      )?.value,
    );
  };

  return (
    <div className="flex w-full gap-2 overflow-x-auto pb-2 pt-4 no-scrollbar active:cursor-grabbing sm:gap-4">
      {[product].map((item) => (
        <VTOProductCard
          key={item.id}
          product={item}
          selectedProduct={selectedProduct}
          setSelectedProduct={setSelectedProduct}
          onClick={() => handleProductClick(product)}
        />
      ))}
    </div>
  );
}
