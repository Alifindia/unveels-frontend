import { useState } from "react";
import { FindTheLookItems } from "../../types/findTheLookItems";
import clsx from "clsx";
import { ChevronLeft, Heart } from "lucide-react";
import { Icons } from "../icons";
import { useFindTheLookContext } from "../../context/find-the-look-context";
import { useProducts } from "../../api/get-product";
import { useCartContext } from "../../context/cart-context";
import {
  baseApiUrl,
  getProductAttributes,
  mediaUrl,
} from "../../utils/apiUtils";
import { BrandName } from "../product/brand";
import { Rating } from "../rating";
import { LoadingProducts } from "../loading";

export function VTOAllProductsPage({
  onClose,
  groupedItemsData,
  name,
  mapTypes,
}: {
  onClose: () => void;
  groupedItemsData: {
    makeup: FindTheLookItems[];
    accessories: FindTheLookItems[];
  };
  name: string;
  mapTypes: {
    [key: string]: {
      attributeName: string;
      values: string[];
    };
  };
}) {
  const [tab] = useState<"makeup" | "accessories">("makeup");

  return (
    <div
      className={clsx(
        "fixed inset-0 flex h-dvh flex-col bg-black px-2 font-sans text-white",
      )}
    >
      {/* Navigation */}
      <div className="flex items-center justify-between px-4 py-2">
        <button type="button" className="size-6" onClick={() => onClose()}>
          <ChevronLeft className="h-6 w-6" />
        </button>
      </div>

      {/* section pages */}
      <div className="mb-3 flex items-center justify-between px-4 py-2">
        <div className="text-3xl">{name}</div>
        <div className="flex items-center justify-end space-x-2.5">
          <Heart className="size-6" />
          <Icons.bag className="size-6" />
        </div>
      </div>

      <div className="mb-4 flex flex-row justify-between space-x-2">
        <button className="flex w-full items-center rounded bg-gray-800 px-4 py-2 text-white sm:w-auto">
          Sort
          <Icons.sort className="ml-2 size-6" />
        </button>
        <button className="flex w-full items-center rounded bg-gray-800 px-4 py-2 text-white sm:w-auto">
          Filter
          <Icons.filter className="ml-2 size-6" />
        </button>
      </div>

      {tab === "makeup" ? (
        <MakeupAllView makeups={groupedItemsData.makeup} mapTypes={mapTypes} />
      ) : (
        <AccessoriesAllView
          accessories={groupedItemsData.accessories}
          mapTypes={mapTypes}
        />
      )}
    </div>
  );
}

function MakeupAllView({
  makeups,
  mapTypes,
}: {
  makeups: FindTheLookItems[];
  mapTypes: {
    [key: string]: {
      attributeName: string;
      values: string[];
    };
  };
}) {
  const validMakeups = makeups.filter((category) => mapTypes[category.label]);

  return (
    <div className="h-full flex-1 overflow-y-auto px-5">
      <div className="space-y-14">
        {validMakeups.map((category) => (
          <ProductHorizontalList
            category={category.label}
            key={category.section}
            mapTypes={mapTypes}
          />
        ))}
      </div>
    </div>
  );
}

function AccessoriesAllView({
  accessories,
  mapTypes,
}: {
  accessories: FindTheLookItems[];
  mapTypes: {
    [key: string]: {
      attributeName: string;
      values: string[];
    };
  };
}) {
  const validAccessories = accessories.filter(
    (category) => mapTypes[category.label],
  );

  return (
    <div className="h-full flex-1 overflow-y-auto px-5">
      <div className="space-y-14">
        {validAccessories.map((category) => (
          <ProductHorizontalList
            category={category.label}
            key={category.section}
            mapTypes={mapTypes}
          />
        ))}
      </div>
    </div>
  );
}

function ProductHorizontalList({
  category,
  mapTypes,
}: {
  category: string;
  mapTypes: {
    [key: string]: {
      attributeName: string;
      values: string[];
    };
  };
}) {
  const { selectedItems: cart, dispatch } = useFindTheLookContext(); // Assuming dispatch is here

  if (!mapTypes[category]) {
    console.warn(`Category "${category}" is not defined in mapTypes.`);
    return null;
  }

  const { attributeName, values } = mapTypes[category];
  const { data } = useProducts({
    product_type_key: attributeName,
    type_ids: values,
  });

  const { addItemToCart } = useCartContext();

  const handleAddToCart = async (id: string, url: string) => {
    try {
      await addItemToCart(id, url);
      console.log(`Product ${id} added to cart!`);
    } catch (error) {
      console.error("Failed to add product to cart:", error);
    }
  };

  return (
    <div key={category}>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        {data ? (
          data.items.map((product) => {
            const imageUrl =
              mediaUrl(product.media_gallery_entries[0].file) ??
              "https://picsum.photos/id/237/200/300";

            return (
              <div
                key={product.id}
                className="rounded shadow"
                onClick={() => {
                  window.open(
                    `${baseApiUrl}/${product.custom_attributes.find((attr) => attr.attribute_code === "url_key")?.value as string}.html`,
                    "_blank",
                  );
                }}
              >
                <div className="relative aspect-square w-full overflow-hidden">
                  <img
                    src={imageUrl}
                    alt="Product"
                    className="h-full w-full rounded object-cover"
                  />
                </div>

                <h3 className="line-clamp-2 h-10 pt-2.5 text-xs font-semibold text-white">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/60">
                    <BrandName
                      brandId={getProductAttributes(product, "brand")}
                    />
                  </p>
                  <div className="flex flex-wrap items-center justify-end gap-x-1">
                    <span className="text-sm font-bold text-white">
                      ${product.price.toFixed(2)}
                    </span>
                  </div>
                </div>
                <Rating rating={4} />
                <div className="flex space-x-1 pt-1">
                  <button
                    type="button"
                    className="flex h-10 w-full items-center justify-center border border-white text-xs font-semibold text-white"
                    onClick={() => {
                      handleAddToCart(
                        product.id.toString(),
                        `${baseApiUrl}/${product.custom_attributes.find((attr) => attr.attribute_code === "url_key")?.value as string}.html`,
                      );
                    }}
                  >
                    ADD TO CART
                  </button>
                  <button
                    type="button"
                    className="flex h-10 w-full items-center justify-center border border-white bg-white text-xs font-semibold text-black"
                    onClick={() => {
                      dispatch({ type: "add", payload: product });
                    }}
                  >
                    SELECT
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <LoadingProducts />
        )}
      </div>
    </div>
  );
}
