import { useEffect, useState } from "react";
import { FindTheLookItems } from "../../types/findTheLookItems";
import clsx from "clsx";
import { ChevronLeft, Currency, Heart } from "lucide-react";
import { Icons } from "../icons";
import { useFindTheLookContext } from "../../context/find-the-look-context";
import { useProducts, useProductsVTOAll } from "../../api/get-product";
import { useCartContext } from "../../context/cart-context";
import {
  baseApiUrl,
  getProductAttributes,
  mediaUrl,
} from "../../utils/apiUtils";
import { BrandName } from "../product/brand";
import { Rating } from "../rating";
import { LoadingProducts } from "../loading";
import { useFilterContext } from "../../context/filter-context";
import { getCurrencyAndRate } from "../../utils/other";
import { exchangeRates } from "../../utils/constants";
import SuccessPopup from "../popup-add-to-cart";

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
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [sorting, setSorting] = useState(false);
  const { sort, setSort } = useFilterContext();

  const toggleFilter = () => {
    setIsFilterVisible((prev) => !prev);
  };

  const closeFilter = () => {
    setIsFilterVisible(false);
  };

  const toggleSorting = () => {
    setSorting((prev) => !prev);
    setSort(sorting);
  };
  const { dataItem, type } = useCartContext();

  return (
    <div className="fixed inset-0 flex flex-col bg-black px-2 font-sans text-white">
      <SuccessPopup product={dataItem} type={type} />
      {isFilterVisible && (
        <div
          className="fixed inset-0 z-40 bg-black opacity-50"
          onClick={() => setIsFilterVisible(false)}
        ></div>
      )}
      {/* Navigation */}
      <div className="flex items-center justify-between px-4 py-2">
        <button type="button" className="size-6" onClick={() => onClose()}>
          <ChevronLeft className="h-6 w-6" />
        </button>
      </div>
      {/* Section Pages */}
      <div className="mb-3 flex items-center justify-between px-4 py-2">
        <div className="text-3xl">{name}</div>
        <div className="flex items-center justify-end space-x-2.5">
          <Heart className="size-6" />
          <Icons.bag className="size-6" />
        </div>
      </div>
      <div className="mb-4 flex flex-row justify-between space-x-2">
        {/* Sort Button */}
        <button
          className={`flex w-full items-center rounded-xl px-4 py-2 sm:w-auto ${
            sorting ? "bg-gray-600" : "bg-gray-800"
          } text-white`}
          onClick={toggleSorting}
        >
          Sort
          <Icons.sort className="ml-2 size-6" />
        </button>

        {/* Filter Button */}
        <button
          className="flex w-full items-center rounded-xl bg-gray-800 px-4 py-2 text-white sm:w-auto"
          onClick={toggleFilter}
        >
          Filter
          <Icons.filter className="ml-2 size-6" />
        </button>
      </div>

      {/* Filter Component */}
      {isFilterVisible && <FilterComponent closeFilter={closeFilter} />}

      {/* Makeup Tab */}
      {tab === "makeup" ? (
        <MakeupAllView makeups={groupedItemsData.makeup} mapTypes={mapTypes} />
      ) : (
        <></>
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
  const { selectedItems: cart, dispatch } = useFindTheLookContext();
  const {
    selectedBrand,
    selectedCountry,
    selectedSizeOne,
    selectedSizeTwo,
    minPrice,
    maxPrice,
    selectedFormation,
    sort,
  } = useFilterContext();

  if (!mapTypes[category]) {
    console.warn(`Category "${category}" is not defined in mapTypes.`);
    return null;
  }

  const { attributeName, values } = mapTypes[category];

  const { currency, rate, currencySymbol } = getCurrencyAndRate(exchangeRates);

  // Using useProductsVTOAll hook with dependencies that trigger data refetch
  const { data, refetch, isLoading, isFetching } = useProductsVTOAll({
    product_type_key: attributeName,
    type_ids: values,
    order: sort,
    selectedFormation: selectedFormation,
    selectedBrand: selectedBrand,
    selectedCountry: selectedCountry,
    selectedSizeOne: selectedSizeOne,
    selectedSizeTwo: selectedSizeTwo,
    maxPrice: maxPrice,
    minPrice: minPrice,
  });

  // Whenever a filter context value changes, trigger refetch
  useEffect(() => {
    refetch();
  }, [
    selectedBrand,
    selectedCountry,
    selectedSizeOne,
    selectedSizeTwo,
    minPrice,
    maxPrice,
    selectedFormation,
    sort,
    refetch, // Ensure refetch is included to avoid stale closures
  ]);

  const { addItemToCart, setDataItem, setType } = useCartContext();

  const handleAddToCart = async (id: string, url: string, dataProduct: any) => {
    try {
      await addItemToCart(id, url);
      setType("unit")
      setDataItem(dataProduct)
      console.log(`Product ${id} added to cart!`);
    } catch (error) {
      console.error("Failed to add product to cart:", error);
    }
  };

  return (
    <div key={category}>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        {isLoading || isFetching ? (
          <LoadingProducts /> // Show loading spinner when data is being fetched
        ) : (
          data?.items.map((product) => {
            const imageUrl =
              mediaUrl(product.media_gallery_entries[0]?.file) ??
              "https://picsum.photos/id/237/200/300";

            return (
              <div
                key={product.id}
                className="rounded-xl shadow"
              >
                <div
                  className="cursor-pointer"
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
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/60">
                    <BrandName
                      brandId={getProductAttributes(product, "brand")}
                    />
                  </p>
                  <div className="flex flex-wrap items-center justify-end gap-x-1">
                    <span className="text-sm font-bold text-white">
                      {currencySymbol}({(product.price * rate).toFixed(3)})
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
                        product
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
        )}
      </div>
    </div>
  );
}

function FilterComponent({ closeFilter }: { closeFilter: () => void }) {
  const {
    selectedBrand,
    setSelectedBrand,
    selectedCountry,
    setSelectedCountry,
    selectedSizeOne,
    setSelectedSizeOne,
    selectedSizeTwo,
    setSelectedSizeTwo,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    setSelectedFormation,
    selectedFormation,
  } = useFilterContext();

  const sizeOne = [
    {
      label: "Small",
      value: "5975",
    },
    {
      label: "Medium",
      value: "10",
    },
    {
      label: "Large",
      value: "11",
    },
    {
      label: "Extra Large",
      value: "12",
    },
    {
      label: "46-50ml",
      value: "5587",
    },
    {
      label: "6-10ml",
      value: "5588",
    },
    {
      label: "71-75ml",
      value: "5589",
    },
    {
      label: "26-30ml",
      value: "5590",
    },
    {
      label: "51-55ml",
      value: "5591",
    },
    {
      label: "16-20ml",
      value: "5592",
    },
    {
      label: "76-80ml",
      value: "5593",
    },
    {
      label: "31-35ml",
      value: "5594",
    },
    {
      label: "36-40ml",
      value: "5595",
    },
    {
      label: "86-90ml",
      value: "5596",
    },
    {
      label: "41-45ml",
      value: "5597",
    },
    {
      label: "66-70ml",
      value: "5598",
    },
    {
      label: "56-60ml",
      value: "5599",
    },
    {
      label: "21-25ml",
      value: "5600",
    },
    {
      label: "11-15ml",
      value: "5601",
    },
    {
      label: "81-85ml",
      value: "5602",
    },
    {
      label: "61-65ml",
      value: "5603",
    },
    {
      label: "1-5ml",
      value: "5604",
    },
    {
      label: "91-95ml",
      value: "5605",
    },
    {
      label: "96-100ml",
      value: "5606",
    },
    {
      label: "100+ml",
      value: "5607",
    },
  ];

  const sizeTwo = [
    {
      label: "3",
      value: "6568",
    },
    {
      label: "3.5",
      value: "6569",
    },
    {
      label: "4",
      value: "6570",
    },
    {
      label: "4.5",
      value: "6571",
    },
    {
      label: "5",
      value: "6572",
    },
    {
      label: "5.5",
      value: "6573",
    },
    {
      label: "6",
      value: "6574",
    },
    {
      label: "6.5",
      value: "6575",
    },
    {
      label: "7",
      value: "6576",
    },
    {
      label: "7.5",
      value: "6577",
    },
    {
      label: "8",
      value: "6578",
    },
    {
      label: "8.5",
      value: "6579",
    },
    {
      label: "9",
      value: "6580",
    },
    {
      label: "9.5",
      value: "6581",
    },
    {
      label: "10",
      value: "6582",
    },
    {
      label: "10.5",
      value: "6583",
    },
    {
      label: "11",
      value: "6584",
    },
    {
      label: "11.5",
      value: "6585",
    },
    {
      label: "12",
      value: "6586",
    },
    {
      label: "12.5",
      value: "6587",
    },
    {
      label: "13",
      value: "6588",
    },
    {
      label: "13.5",
      value: "6589",
    },
  ];

  const brands = [
    {
      label: "Acm Laboratories",
      value: "6362",
    },
    {
      label: "Acqua Di Parma",
      value: "6363",
    },
    {
      label: "Aerin",
      value: "6364",
    },
    {
      label: "Airval",
      value: "6365",
    },
    {
      label: "Armaf",
      value: "6366",
    },
    {
      label: "Arteolfatto",
      value: "6367",
    },
    {
      label: "Atkinsons",
      value: "6368",
    },
    {
      label: "Avène",
      value: "6369",
    },
    {
      label: "Azhar Alsaboun",
      value: "6370",
    },
    {
      label: "Babybjorn",
      value: "6371",
    },
    {
      label: "Babyzen Yoyo",
      value: "6372",
    },
    {
      label: "Baobab Collection",
      value: "6373",
    },
    {
      label: "Barts",
      value: "6374",
    },
    {
      label: "Bath&Body Works",
      value: "6375",
    },
    {
      label: "Bdk",
      value: "6376",
    },
    {
      label: "Beaba",
      value: "6377",
    },
    {
      label: "Bijan",
      value: "6378",
    },
    {
      label: "Bill Blass",
      value: "6379",
    },
    {
      label: "Bioderma",
      value: "6380",
    },
    {
      label: "Boadicea The Victorious",
      value: "6381",
    },
    {
      label: "Bobbi Brown",
      value: "6382",
    },
    {
      label: "Boon",
      value: "6383",
    },
    {
      label: "Bottega Veneta",
      value: "6384",
    },
    {
      label: "Brioni",
      value: "6385",
    },
    {
      label: "Burberry",
      value: "6386",
    },
    {
      label: "Bvlgari",
      value: "6387",
    },
    {
      label: "Calvin Klein",
      value: "6388",
    },
    {
      label: "Carolina Hererra",
      value: "6389",
    },
    {
      label: "Carrera",
      value: "6390",
    },
    {
      label: "Cartier",
      value: "6391",
    },
    {
      label: "Catrice",
      value: "6392",
    },
    {
      label: "Caudalie",
      value: "6393",
    },
    {
      label: "Chanel",
      value: "6394",
    },
    {
      label: "Clinique",
      value: "6395",
    },
    {
      label: "Culti Milano",
      value: "6396",
    },
    {
      label: "Cybex",
      value: "6397",
    },
    {
      label: "Derby",
      value: "6398",
    },
    {
      label: "Dior",
      value: "6399",
    },
    {
      label: "Disney",
      value: "6400",
    },
    {
      label: "Dockatot",
      value: "6401",
    },
    {
      label: "Dr. Vranjes",
      value: "6402",
    },
    {
      label: "Elizabeth Arden",
      value: "6403",
    },
    {
      label: "Essence",
      value: "6404",
    },
    {
      label: "Essie",
      value: "6405",
    },
    {
      label: "Estee Lauder",
      value: "6406",
    },
    {
      label: "Eveline Cosmetics",
      value: "6407",
    },
    {
      label: "Farm Stay",
      value: "6408",
    },
    {
      label: "Frank Olivier",
      value: "6409",
    },
    {
      label: "Fridababy",
      value: "6410",
    },
    {
      label: "Georges Rech",
      value: "6411",
    },
    {
      label: "Giorgio Armani",
      value: "6412",
    },
    {
      label: "Givenchy",
      value: "6413",
    },
    {
      label: "Guerlain",
      value: "6414",
    },
    {
      label: "Guess",
      value: "6415",
    },
    {
      label: "Hello Kitty",
      value: "6416",
    },
    {
      label: "Henbor",
      value: "6417",
    },
    {
      label: "Hugo Boss",
      value: "6418",
    },
    {
      label: "Infantino",
      value: "6419",
    },
    {
      label: "Initio",
      value: "6420",
    },
    {
      label: "Invisibobble",
      value: "6421",
    },
    {
      label: "Jean Paul Gaultier",
      value: "6422",
    },
    {
      label: "Jo Malone London",
      value: "6423",
    },
    {
      label: "Jovan",
      value: "6424",
    },
    {
      label: "Just For Men",
      value: "6425",
    },
    {
      label: "Kerastase",
      value: "6426",
    },
    {
      label: "Kevin Murphy",
      value: "6427",
    },
    {
      label: "Kiehls",
      value: "6428",
    },
    {
      label: "Kryolan",
      value: "6429",
    },
    {
      label: "L'Action Paris",
      value: "6431",
    },
    {
      label: "L'Objet",
      value: "6435",
    },
    {
      label: "Label.M",
      value: "6430",
    },
    {
      label: "Lancaster",
      value: "6432",
    },
    {
      label: "Lancome",
      value: "6433",
    },
    {
      label: "Leonor Greyl",
      value: "6434",
    },
    {
      label: "Luminous",
      value: "6436",
    },
    {
      label: "Make Up For Ever",
      value: "6437",
    },
    {
      label: "Makeup Studio",
      value: "6438",
    },
    {
      label: "Malibu",
      value: "6439",
    },
    {
      label: "Mamas & Papas",
      value: "6440",
    },
    {
      label: "Marvel",
      value: "6441",
    },
    {
      label: "Mavala",
      value: "6442",
    },
    {
      label: "Moby",
      value: "6443",
    },
    {
      label: "My Happy Planet",
      value: "6444",
    },
    {
      label: "Napper",
      value: "6445",
    },
    {
      label: "Nickelodeon",
      value: "6446",
    },
    {
      label: "Nuby",
      value: "6447",
    },
    {
      label: "Nuna",
      value: "6448",
    },
    {
      label: "Orly",
      value: "6449",
    },
    {
      label: "Oskia",
      value: "6450",
    },
    {
      label: "Oz Naturals",
      value: "6451",
    },
    {
      label: "Paco Rabanne",
      value: "6452",
    },
    {
      label: "Pana Dora",
      value: "6453",
    },
    {
      label: "Parfums De Marly",
      value: "6454",
    },
    {
      label: "Pharmaceris",
      value: "6455",
    },
    {
      label: "Philip Kingsley",
      value: "6456",
    },
    {
      label: "Potwells",
      value: "6457",
    },
    {
      label: "Quut",
      value: "6458",
    },
    {
      label: "Ralph Lauren",
      value: "6459",
    },
    {
      label: "Revlon",
      value: "6460",
    },
    {
      label: "Shnuggle",
      value: "6461",
    },
    {
      label: "Svr",
      value: "6462",
    },
    {
      label: "The Body Shop",
      value: "6463",
    },
    {
      label: "Tommy Hilfiger",
      value: "6464",
    },
    {
      label: "Touch Beauty",
      value: "6465",
    },
    {
      label: "Twistshake",
      value: "6466",
    },
    {
      label: "Uriage",
      value: "6467",
    },
    {
      label: "Vagisil",
      value: "6468",
    },
    {
      label: "Versace",
      value: "6469",
    },
    {
      label: "Vichy",
      value: "6470",
    },
    {
      label: "Anastasia Beverly Hills",
      value: "6605",
    },
    {
      label: "Anesthesia",
      value: "6606",
    },
    {
      label: "Ardell",
      value: "6607",
    },
    {
      label: "Beauty Blender",
      value: "6608",
    },
    {
      label: "Beesline",
      value: "6609",
    },
    {
      label: "Abercrombie & Fitch",
      value: "6651",
    },
    {
      label: "Acqua Bambino",
      value: "6652",
    },
    {
      label: "Adidas",
      value: "6653",
    },
    {
      label: "Adnan.B",
      value: "6654",
    },
    {
      label: "Adrienne Vittadini",
      value: "6655",
    },
    {
      label: "Afnan",
      value: "6656",
    },
    {
      label: "Agent Provocateur",
      value: "6657",
    },
    {
      label: "Aigner",
      value: "6658",
    },
    {
      label: "Ajmal",
      value: "6659",
    },
    {
      label: "Alexander Mqueen",
      value: "6660",
    },
    {
      label: "Alexandre-J",
      value: "6661",
    },
    {
      label: "Alfred Verne",
      value: "6662",
    },
    {
      label: "All Sins 18K",
      value: "6663",
    },
    {
      label: "Almas Creation",
      value: "6664",
    },
    {
      label: "Alterna",
      value: "6665",
    },
  ];

  const madeIn = [
    {
      label: "Hong Kong",
      value: "5555",
    },
    {
      label: "Canada",
      value: "5556",
    },
    {
      label: "Japan",
      value: "5557",
    },
    {
      label: "Finland",
      value: "5558",
    },
    {
      label: "India",
      value: "5559",
    },
    {
      label: "Czech Republic",
      value: "5560",
    },
    {
      label: "Kuwait",
      value: "5561",
    },
    {
      label: "France",
      value: "5562",
    },
    {
      label: "Germany",
      value: "5563",
    },
    {
      label: "Malaysia",
      value: "5564",
    },
    {
      label: "Greece",
      value: "5565",
    },
    {
      label: "Italy",
      value: "5566",
    },
    {
      label: "Indonesia",
      value: "5567",
    },
    {
      label: "Egypt",
      value: "5568",
    },
    {
      label: "China",
      value: "5569",
    },
    {
      label: "Lebanon",
      value: "5570",
    },
    {
      label: "Iran",
      value: "5571",
    },
    {
      label: "Brazil",
      value: "5572",
    },
    {
      label: "Morocco",
      value: "5573",
    },
    {
      label: "Korea",
      value: "5574",
    },
    {
      label: "Pakistan",
      value: "5575",
    },
    {
      label: "Saudi Arabia",
      value: "5576",
    },
    {
      label: "Singapore",
      value: "5577",
    },
    {
      label: "Spain",
      value: "5578",
    },
    {
      label: "Sri Lanka",
      value: "5579",
    },
    {
      label: "Switzerland",
      value: "5580",
    },
    {
      label: "Taiwan",
      value: "5581",
    },
    {
      label: "Thailand",
      value: "5582",
    },
    {
      label: "Turkey",
      value: "5583",
    },
    {
      label: "United Arab Emirates",
      value: "5584",
    },
    {
      label: "United Kingdom",
      value: "5585",
    },
    {
      label: "United States",
      value: "5586",
    },
    {
      label: "England",
      value: "5622",
    },
    {
      label: "Netherlands",
      value: "5623",
    },
    {
      label: "Poland",
      value: "5624",
    },
  ];

  // Formation options with label and value
  const formations = [
    { label: "Foam", value: "5536" },
    { label: "Gel", value: "5537" },
    { label: "Bar", value: "5538" },
    { label: "Balm", value: "5539" },
    { label: "Mousse", value: "5540" },
    { label: "Cream", value: "5541" },
    { label: "Capsule", value: "5542" },
    { label: "Oil", value: "5543" },
    { label: "Glue", value: "5544" },
    { label: "Patches", value: "5545" },
    { label: "Lotion", value: "5546" },
    { label: "Spray", value: "5547" },
    { label: "Wax", value: "5548" },
    { label: "Stick", value: "5549" },
    { label: "Powder", value: "5550" },
    { label: "Tablets", value: "5551" },
    { label: "Paste", value: "5552" },
    { label: "Liquid", value: "5553" },
    { label: "Sheet", value: "5554" },
  ];

  const handleFormationClick = (formation: {
    label: string;
    value: string;
  }) => {
    // Jika tombol formation yang sama diklik, hilangkan pilihan yang ada
    if (selectedFormation === formation.value) {
      setSelectedFormation(""); // Non-aktifkan filter jika sudah aktif
      console.log("Formation deactivated");
    } else {
      setSelectedFormation(formation.value); // Aktifkan filter
      console.log("Selected Formation Value:", formation.value);
    }
  };

  // Handler untuk Brand Name
  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedBrand(value);
    console.log("Selected Brand Value:", value);
  };

  // Handler untuk Country of Origin
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedCountry(value);
    console.log("Selected Country Value:", value);
  };

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = Number(e.target.value);
    value = Math.max(0, Math.min(value, maxPrice - 1));
    setMinPrice(value);
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = Number(e.target.value);
    value = Math.min(1000, Math.max(value, minPrice + 1));
    setMaxPrice(value);
  };

  const handleMinSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = Number(e.target.value);
    value = Math.max(0, Math.min(value, maxPrice - 1));
    setMinPrice(value);
  };

  const handleMaxSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = Number(e.target.value);
    value = Math.min(1000, Math.max(value, minPrice + 1));
    setMaxPrice(value);
  };

  const handleSizeOneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedSizeOne(value);
    console.log("Selected Size One:", value);
  };

  const handleSizeTwoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedSizeTwo(value);
    console.log("Selected Size Two:", value);
  };

  const { currency, rate, currencySymbol } = getCurrencyAndRate(exchangeRates);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-lg bg-[#09090b] p-4">
      <div
        className="mb-4 flex cursor-pointer justify-center"
        onClick={closeFilter}
      >
        <div className="h-1 w-12 rounded-full bg-white"></div>
      </div>

      <div className="space-y-4">
        {/* Brand Filter */}
        <div>
          <label className="mb-2 block text-sm font-bold" htmlFor="brand">
            Brand Name
          </label>
          <select
            className="w-full rounded-xl border border-white bg-[#09090b] p-2 text-white"
            id="brand"
            value={selectedBrand} // Bind ke state
            onChange={handleBrandChange} // Update state saat berubah
          >
            <option value="">Select Brand</option>
            {brands.map((brand) => (
              <option key={brand.value} value={brand.value}>
                {brand.label}
              </option>
            ))}
          </select>
        </div>

        {/* Country of Origin Filter */}
        <div>
          <label className="mb-2 block text-sm font-bold" htmlFor="country">
            Country Of Origin
          </label>
          <select
            className="w-full rounded-xl border border-white bg-[#09090b] p-2 text-white"
            id="country"
            value={selectedCountry} // Bind ke state
            onChange={handleCountryChange} // Update state saat berubah
          >
            <option value="">Made in</option>
            {madeIn.map((country) => (
              <option key={country.value} value={country.value}>
                {country.label}
              </option>
            ))}
          </select>
        </div>

        {/* Size Filter */}
        <div>
          <label className="mb-2 block text-sm font-bold" htmlFor="size">
            Size
          </label>
          <div className="flex space-x-2">
            <select
              className="rounded-xl border border-white bg-[#09090b] p-2 text-white"
              id="size-one"
              value={selectedSizeOne} // Bind ke state sizeOne
              onChange={handleSizeOneChange} // Update state saat nilai berubah
            >
              <option value="">Select Size One</option>
              {sizeOne.map((size) => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </select>
            <select
              className="rounded-xl border border-white bg-[#09090b] p-2 text-white"
              id="size-two"
              value={selectedSizeTwo} // Bind ke state sizeTwo
              onChange={handleSizeTwoChange} // Update state saat nilai berubah
            >
              <option value="">Select Size Two</option>
              {sizeTwo.map((size) => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Price Range Filter */}
        <div>
          <label className="mb-2 block text-sm font-bold" htmlFor="price-range">
            Price range
          </label>
          <div className="flex space-x-2">
            <input
              className="w-1/2 rounded-xl border border-white bg-[#09090b] p-2 text-white"
              id="min-price"
              placeholder="Min"
              type="number"
              value={minPrice}
              onChange={handleMinInputChange}
            />
            <input
              className="w-1/2 rounded-xl border border-white bg-[#09090b] p-2 text-white"
              id="max-price"
              placeholder="Max"
              type="number"
              value={maxPrice}
              onChange={handleMaxInputChange}
            />
          </div>
          <div className="my-4 flex justify-between text-sm">
            <span>
              {currencySymbol}{minPrice}
            </span>
            <span>
              {currencySymbol}{maxPrice}
            </span>
          </div>
          <div className="relative h-6 w-full">
            {/* Fixed Price range overlay */}
            <div
              className="absolute top-1/2 h-2 -translate-y-1/2 transform bg-gradient-to-r from-yellow-500 to-yellow-800"
              style={{
                left: "0%", // Fixed position
                right: "0%", // Fixed position
              }}
            ></div>

            {/* Minimum Slider */}
            <input
              type="range"
              min="0"
              max="1000"
              step="1"
              value={minPrice}
              className="absolute z-20 h-2 w-full appearance-none bg-transparent"
              style={{ top: "20%", transform: "translateY(-50%)" }} // Center the slider vertically
              onChange={handleMinSliderChange}
              disabled
            />

            {/* Maximum Slider */}
            <input
              type="range"
              min="0"
              max="1000"
              step="1"
              value={maxPrice}
              className="absolute z-20 h-2 w-full appearance-none bg-transparent"
              style={{ top: "20%", transform: "translateY(-50%)" }} // Center the slider vertically
              onChange={handleMaxSliderChange}
              disabled
            />
          </div>

          {/* Custom Styles for Sliders */}
          <style>
            {`
      input[type="range"] {
        -webkit-appearance: none; /* Override default CSS styles */
        appearance: none;
        background: transparent; /* Remove default background */
      }

      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none; /* Override default styles */
        appearance: none;
        width: 16px; /* Width of the thumb */
        height: 16px; /* Height of the thumb */
        background: white; /* Color of the thumb */
        border-radius: 50%; /* Make it round */
        cursor: pointer; /* Cursor style */
      }

      input[type="range"]::-moz-range-thumb {
        width: 16px; /* Width of the thumb */
        height: 16px; /* Height of the thumb */
        background: white; /* Color of the thumb */
        border-radius: 50%; /* Make it round */
        cursor: pointer; /* Cursor style */
      }

      input[type="range"]::-ms-thumb {
        width: 16px; /* Width of the thumb */
        height: 16px; /* Height of the thumb */
        background: white; /* Color of the thumb */
        border-radius: 50%; /* Make it round */
        cursor: pointer; /* Cursor style */
      }

      input[type="range"]::-webkit-slider-runnable-track {
        height: 2px; /* Height of the track */
        background: transparent; /* Background of the track */
      }

      input[type="range"]::-moz-range-track {
        height: 2px; /* Height of the track */
        background: transparent; /* Background of the track */
      }

      input[type="range"]::-ms-track {
        height: 2px; /* Height of the track */
        background: transparent; /* Background of the track */
        border-color: transparent; /* Remove border */
        color: transparent; /* Remove color */
      }
    `}
          </style>
        </div>

        {/* Formation Filter Section */}
        <div>
          <label className="mb-2 block text-xs font-bold" htmlFor="formation">
            Formation
          </label>
          <div
            className="flex overflow-x-auto whitespace-nowrap"
            style={{
              scrollbarWidth: "none" /* Firefox */,
              msOverflowStyle: "none" /* IE and Edge */,
              overflow: "auto" /* Ensure overflow is enabled */,
            }}
          >
            {/* For WebKit browsers (Chrome, Safari, Opera) */}
            <style>
              {`
        .scrollbar-hidden::-webkit-scrollbar {
          display: none;
        }
      `}
            </style>
            {formations.map((formation) => (
              <button
                key={formation.value}
                onClick={() => handleFormationClick(formation)} // Pass formation object to the handler
                className={`-full mx-1 rounded-xl border px-3 py-1 text-xs ${
                  selectedFormation === formation.value
                    ? "border-white bg-white text-black"
                    : "border-white bg-transparent text-white"
                }`}
              >
                {formation.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
