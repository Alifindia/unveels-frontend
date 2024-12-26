import clsx from "clsx";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { textures } from "../api/attributes/texture";
import data from "../assets/message.json";
import { ColorPalette } from "../components/color-palette";
import { Icons } from "../components/icons";
import { LoadingProducts } from "../components/loading";

export function SingleVirtualTryOnDetail() {
  const {} = useParams();
  return (
    <div className="mx-auto w-full divide-y px-4">
      <div>
        <ColorSelector />
      </div>

      <TextureSelector />

      {/* <ShadesSelector />*/}

      {/* <ShapeSelector /> */}

      <Mode />

      <ProductList />
    </div>
  );
}

const sub_color = [
  "#E0467C",
  "#740039",
  "#8D0046",
  "#B20058",
  "#B51F69",
  "#DF1050",
  "#E31B7B",
  "#E861A4",
  "#FE3699",
];

function ColorSelector() {
  const handleColorClick = () => {};

  const handleClearSelection = () => {};

  return (
    <div className="mx-auto w-full py-2 lg:max-w-xl">
      <div className="flex w-full items-center space-x-4 overflow-x-auto no-scrollbar py-2.5">
        <button
          type="button"
          className="inline-flex size-[1.875rem] shrink-0 items-center gap-x-2 rounded-full border border-transparent text-white/80"
          onClick={handleClearSelection}
        >
          <Icons.empty className="size-[1.875rem]" />
        </button>
        {sub_color.map((color, index) => (
          <ColorPalette
            key={color}
            size="large"
            palette={{ color }}
            onClick={() => handleColorClick()}
          />
        ))}
      </div>
      {/* Removed the error message since all buttons are enabled */}
    </div>
  );
}

function TextureSelector() {
  const { sku } = useParams();
  const productConfigurable = data.items.filter((i) => i.sku === sku);
  const textureAttribute = productConfigurable[0].custom_attributes.find(
    (i) => i.attribute_code === "texture",
  );
  const textureProducts = textures.filter(
    (i) => i.value === textureAttribute?.value,
  );

  const [selectedTexture, setSelectedTexture] = useState<string | null>(null);
  return (
    <div className="mx-auto w-full py-2 lg:max-w-xl">
      <div className="flex w-full items-center space-x-4 overflow-x-auto no-scrollbar">
        {textureProducts.map((texture, index) => (
          <button
            key={texture.label}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center gap-x-2 rounded-full border border-white/80 px-3 py-1 text-white/80",
              {
                "border-white/80 bg-gradient-to-r from-[#CA9C43] to-[#473209]":
                  selectedTexture === texture.value,
              },
            )}
            onClick={() => {
              if (selectedTexture === texture.value) {
                setSelectedTexture(null);
              } else {
                setSelectedTexture(texture.value);
              }
            }}
          >
            <span className="text-sm">{texture.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const blushes = [
  "/blushes/blusher-1.png",
  "/blushes/blusher-2.png",
  "/blushes/blusher-3.png",
  "/blushes/blusher-4.png",
  "/blushes/blusher-5.png",
];

function ShapeSelector() {
  const [selectedShape, setSelectedShape] = useState<string>();

  function setPattern(pattern: number, patternName: string) {
    setSelectedShape(patternName);
  }

  return (
    <div className="mx-auto w-full py-2 lg:max-w-xl">
      <div className="flex w-full items-center space-x-4 overflow-x-auto no-scrollbar py-2.5">
        {blushes.map((path, index) => (
          <button
            key={index}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center rounded-sm border border-transparent text-white/80",
              {
                "border-white/80": selectedShape === index.toString(),
              },
            )}
            onClick={() => setPattern(index, index.toString())}
          >
            <img src={path} alt="Highlighter" className="size-12 rounded" />
          </button>
        ))}
      </div>
    </div>
  );
}

const modes = [
  {
    name: "Lip Color",
    path: "lip-color",
  },
  {
    name: "Lip Liner",
    path: "lip-liner",
  },
  {
    name: "Lip Plumper",
    path: "lip-plumper",
  },
];

export function Mode() {
  const navigate = useNavigate();
  return (
    <div className="flex w-full items-center space-x-4 overflow-x-auto no-scrollbar">
      {modes.map((mode, index) => (
        <button
          key={mode.path}
          type="button"
          className="inline-flex items-center gap-x-2 whitespace-nowrap rounded-full border border-white/80 px-3 py-1 text-white/80"
          onClick={() => {
            navigate("/virtual-try-on/" + mode.path);
          }}
        >
          <span className="text-sm">{mode.name}</span>
        </button>
      ))}
    </div>
  );
}

function ProductList() {
  const [isLoading, setIsloading] = useState(false);
  const { sku } = useParams();
  const productConfigurable = data.items.find((i) => i.sku === sku);
  const category = productConfigurable?.custom_attributes.find(
    (i) => i.attribute_code === "lips_makeup_product_type",
  );
  console.log(category);
  const productSimples = data.items.filter((i) =>
    productConfigurable?.extension_attributes.configurable_product_links?.includes(
      i.id,
    ),
  );

  return (
    <div className="flex w-full gap-4 overflow-x-auto pb-2 pt-4 no-scrollbar active:cursor-grabbing">
      {isLoading ? (
        <LoadingProducts />
      ) : (
        productSimples.map((product, index) => {
          const imageUrl =
            // mediaUrl(product.media_gallery_entries[0].file) ??
            "https://picsum.photos/id/237/200/300";

          return (
            <div key={index} className="w-[100px] rounded shadow">
              <div className="relative h-[70px] w-[100px] overflow-hidden">
                <img
                  src={imageUrl}
                  alt="Product"
                  className="rounded object-cover"
                />
              </div>

              <h3 className="line-clamp-2 h-10 py-2 text-[0.625rem] font-semibold text-white">
                {product.name}
              </h3>
              <p className="text-[0.625rem] text-white/60">
                {/* <BrandName brandId={getProductAttributes(product, "brand")} />{" "} */}
                Brand
              </p>
              <div className="flex items-end justify-between space-x-1 pt-1">
                <div className="bg-gradient-to-r from-[#CA9C43] to-[#92702D] bg-clip-text text-[0.625rem] text-transparent">
                  {product.price}
                </div>
                <button
                  type="button"
                  className="flex h-7 items-center justify-center bg-gradient-to-r from-[#CA9C43] to-[#92702D] px-2.5 text-[0.5rem] font-semibold text-white"
                >
                  Add to cart
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
