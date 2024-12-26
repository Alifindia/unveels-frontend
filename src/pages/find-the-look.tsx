import {
  FaceLandmarker,
  FilesetResolver,
  ObjectDetector,
} from "@mediapipe/tasks-vision";
import clsx from "clsx";
import { capitalize } from "lodash";
import {
  ChevronLeft,
  CirclePlay,
  Heart,
  PauseCircle,
  StopCircle,
  X,
} from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  handAccessoriesProductTypeFilter,
  headAccessoriesProductTypeFilter,
  neckAccessoriesProductTypeFilter,
} from "../api/attributes/accessories";
import {
  getFaceMakeupProductTypeIds,
  getLashMakeupProductTypeIds,
  getLensesProductTypeIds,
  getLipsMakeupProductTypeIds,
} from "../api/attributes/makeups";
import { useProducts } from "../api/get-product";
import { useLipsProductQuery } from "../api/lips";
import { FindTheLookMainScreen } from "../components/find-the-look/find-the-look-main-screen";
import { FindTheLookScene } from "../components/find-the-look/find-the-look-scene";
import { Footer } from "../components/footer";
import { Icons } from "../components/icons";
import { LoadingProducts } from "../components/loading";
import { ModelLoadingScreen } from "../components/model-loading-screen";
import { BrandName } from "../components/product/brand";
import { Rating } from "../components/rating";
import { VideoScene } from "../components/recorder/recorder";
import { VideoStream } from "../components/recorder/video-stream";
import { ShareModal } from "../components/share-modal";
import { TopNavigation } from "../components/top-navigation";
import {
  FindTheLookProvider,
  useFindTheLookContext,
} from "../context/find-the-look-context";
import { CameraProvider, useCamera } from "../context/recorder-context";
import { SkinAnalysisProvider } from "../context/skin-analysis-context";
import { useModelLoader } from "../hooks/useModelLoader";
import { useRecordingControls } from "../hooks/useRecorder";
import { FindTheLookItems } from "../types/findTheLookItems";
import { baseApiUrl, getProductAttributes, mediaUrl } from "../utils/apiUtils";
import { VTOProductCard } from "../components/vto/vto-product-card";

export function FindTheLook() {
  return (
    <CameraProvider>
      <SkinAnalysisProvider>
        <FindTheLookProvider>
          <div className="h-full min-h-dvh">
            <Main />
          </div>
        </FindTheLookProvider>
      </SkinAnalysisProvider>
    </CameraProvider>
  );
}

function Main() {
  const { criterias } = useCamera();
  const [selectionMade, setSelectionMade] = useState(false);

  const modelsRef = useRef<{
    faceLandmarker: FaceLandmarker | null;
    handDetector: ObjectDetector | null;
    ringDetector: ObjectDetector | null;
    neckDetector: ObjectDetector | null;
    earringDetector: ObjectDetector | null;
    glassDetector: ObjectDetector | null;
    headDetector: ObjectDetector | null;
    makeupDetector: ObjectDetector | null;
  }>({
    faceLandmarker: null,
    handDetector: null,
    ringDetector: null,
    neckDetector: null,
    earringDetector: null,
    glassDetector: null,
    headDetector: null,
    makeupDetector: null,
  });

  const steps = [
    async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
      );

      const faceLandmarkerInstance = await FaceLandmarker.createFromOptions(
        vision,
        {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU",
          },
          runningMode: "IMAGE",
          numFaces: 1,
          minFaceDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
        },
      );
      modelsRef.current.faceLandmarker = faceLandmarkerInstance;
    },
    async () => {
      const handDetectorInstance = await ObjectDetector.createFromOptions(
        await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
        ),
        {
          baseOptions: {
            modelAssetPath: "/media/unveels/models/find-the-look/hand.tflite",
            delegate: "GPU",
          },
          runningMode: "IMAGE",
          maxResults: 2,
          scoreThreshold: 0.63,
        },
      );
      modelsRef.current.handDetector = handDetectorInstance;
    },
    async () => {
      const ringDetectorInstance = await ObjectDetector.createFromOptions(
        await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
        ),
        {
          baseOptions: {
            modelAssetPath: "/media/unveels/models/find-the-look/rings.tflite",
            delegate: "GPU",
          },
          runningMode: "IMAGE",
          maxResults: 1,
          scoreThreshold: 0.8,
        },
      );
      modelsRef.current.ringDetector = ringDetectorInstance;
    },
    async () => {
      const neckDetectorInstance = await ObjectDetector.createFromOptions(
        await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
        ),
        {
          baseOptions: {
            modelAssetPath: "/media/unveels/models/find-the-look/neck.tflite",
            delegate: "GPU",
          },
          runningMode: "IMAGE",
          maxResults: 1,
          scoreThreshold: 0.8,
        },
      );
      modelsRef.current.neckDetector = neckDetectorInstance;
    },
    async () => {
      const earringDetectorInstance = await ObjectDetector.createFromOptions(
        await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
        ),
        {
          baseOptions: {
            modelAssetPath:
              "/media/unveels/models/find-the-look/earrings.tflite",
            delegate: "GPU",
          },
          runningMode: "IMAGE",
          maxResults: 1,
          scoreThreshold: 0.8,
        },
      );
      modelsRef.current.earringDetector = earringDetectorInstance;
    },
    async () => {
      const glassDetectorInstance = await ObjectDetector.createFromOptions(
        await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
        ),
        {
          baseOptions: {
            modelAssetPath: "/media/unveels/models/find-the-look/glass.tflite",
            delegate: "GPU",
          },
          runningMode: "IMAGE",
          maxResults: 1,
          scoreThreshold: 0.6,
        },
      );
      modelsRef.current.glassDetector = glassDetectorInstance;
    },
    async () => {
      const headDetectorInstance = await ObjectDetector.createFromOptions(
        await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
        ),
        {
          baseOptions: {
            modelAssetPath: "/media/unveels/models/find-the-look/head.tflite",
            delegate: "GPU",
          },
          runningMode: "IMAGE",
          maxResults: 1,
          scoreThreshold: 0.8,
        },
      );
      modelsRef.current.headDetector = headDetectorInstance;
    },
    async () => {
      const makeupDetectorInstance = await ObjectDetector.createFromOptions(
        await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
        ),
        {
          baseOptions: {
            modelAssetPath: "/media/unveels/models/find-the-look/makeup.tflite",
            delegate: "GPU",
          },
          runningMode: "IMAGE",
          maxResults: 4,
          scoreThreshold: 0.1,
        },
      );
      modelsRef.current.makeupDetector = makeupDetectorInstance;
    },
  ];

  const {
    progress,
    isLoading: modelLoading,
    loadModels,
  } = useModelLoader(steps);

  useEffect(() => {
    loadModels();
  }, []);

  const handleSelection = () => {
    setSelectionMade(true);
  };

  if (modelLoading) {
    return <ModelLoadingScreen progress={progress} />;
  }

  return (
    <>
      {!selectionMade && (
        <FindTheLookMainScreen onSelection={handleSelection} />
      )}
      {selectionMade && (
        <div className="relative mx-auto h-full min-h-dvh w-full bg-black">
          <div className="absolute inset-0">
            {criterias.isCaptured && criterias.capturedImage ? (
              <FindTheLookScene models={modelsRef.current} />
            ) : (
              <>
                <VideoStream />
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.9) 100%)`,
                    zIndex: 0,
                  }}
                ></div>
              </>
            )}
          </div>
          <RecorderStatus />
          <TopNavigation cart={true} />

          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0">
            <MainContent />
            <Footer />
          </div>
        </div>
      )}
    </>
  );
}

function MainContent() {
  const { criterias } = useCamera();
  const [shareOpen, setShareOpen] = useState(false);

  if (criterias.isFinished) {
    return shareOpen ? (
      <ShareModal
        onClose={() => {
          setShareOpen(false);
        }}
      />
    ) : (
      <div className="flex space-x-5 px-5 pb-10 font-serif">
        <button
          type="button"
          className="h-10 w-full rounded border border-[#CA9C43] text-white"
        >
          Exit
        </button>
        <button
          type="button"
          className="h-10 w-full rounded bg-gradient-to-r from-[#CA9C43] to-[#92702D] text-white"
          onClick={() => setShareOpen(true)}
        >
          Share <Icons.share className="ml-4 inline-block size-6" />
        </button>
      </div>
    );
  }

  return <BottomContent />;
}

function MakeupCategories({
  makeups,
  activeTab,
  onTabChange,
}: {
  makeups: FindTheLookItems[];
  activeTab?: string | null;
  onTabChange: (label: string) => void;
}) {
  const [tab, setTab] = useState<string | undefined>(
    activeTab ?? makeups[0]?.label,
  );
  const { setView } = useFindTheLookContext();

  // Update the tab if activeTab changes
  useEffect(() => {
    if (activeTab) {
      setTab(activeTab);
    }
  }, [activeTab]);

  return (
    <div className="relative space-y-2 px-4 pb-4">
      <div className="flex w-full items-center space-x-2.5 overflow-x-auto pt-4 no-scrollbar sm:pt-7">
        {makeups.map((category) => {
          const isActive = capitalize(tab) === capitalize(category.label);
          return (
            <Fragment key={category.section}>
              <button
                className={clsx(
                  "relative flex h-[18px] shrink-0 items-center rounded-full border border-white px-2 text-[9.8px] text-white sm:h-7 sm:px-3 sm:py-1 sm:text-sm",
                  {
                    "bg-[linear-gradient(90deg,#CA9C43_0%,#916E2B_27.4%,#6A4F1B_59.4%,#473209_100%)]":
                      isActive,
                  },
                )}
                onClick={() => {
                  setTab(category.label);
                  onTabChange(category.label); // Notify parent of the selected tab
                }}
              >
                {category.label}
              </button>
            </Fragment>
          );
        })}
      </div>

      <div className="text-right">
        <button
          type="button"
          className="text-[10px] text-white sm:text-sm"
          onClick={() => {
            setView("all_categories");
          }}
        >
          View all
        </button>
      </div>

      {/* Render ProductList if a valid tab (label) is selected */}
      {tab && mapTypes[tab] ? <ProductList product_type={tab} /> : null}
    </div>
  );
}

function AccessoriesCategories({
  accessories,
  activeTab,
  onTabChange,
}: {
  accessories: FindTheLookItems[];
  activeTab?: string | null;
  onTabChange: (label: string) => void;
}) {
  const [tab, setTab] = useState<string | undefined>(
    activeTab ?? capitalize(accessories[0]?.label),
  );
  const { setView } = useFindTheLookContext();

  // Update the tab if activeTab changes
  useEffect(() => {
    if (activeTab) {
      setTab(capitalize(activeTab));
    }
  }, [activeTab]);

  function onTabClick(label: string) {
    setTab(label);
    onTabChange(label); // Notify parent of the selected tab
  }

  return (
    <div className="relative space-y-2 px-4 pb-4">
      <div className="flex w-full items-center space-x-2.5 overflow-x-auto pt-4 no-scrollbar sm:pt-7">
        {accessories.map((category) => {
          const isActive = capitalize(tab) === capitalize(category.label);
          return (
            <Fragment key={category.section}>
              <button
                className={clsx(
                  "relative flex h-[18px] shrink-0 items-center rounded-full border border-white px-2 text-[9.8px] text-white sm:h-7 sm:px-3 sm:py-1 sm:text-sm",
                  {
                    "bg-[linear-gradient(90deg,#CA9C43_0%,#916E2B_27.4%,#6A4F1B_59.4%,#473209_100%)]":
                      isActive,
                  },
                )}
                onClick={() => {
                  onTabClick(capitalize(category.label));
                }}
              >
                {category.label}
              </button>
            </Fragment>
          );
        })}
      </div>

      <div className="text-right">
        <button
          type="button"
          className="text-[10px] text-white sm:text-sm"
          onClick={() => {
            setView("all_categories");
          }}
        >
          View all
        </button>
      </div>

      {/* Render ProductList if a valid tab (label) is selected */}
      {tab && mapTypes[tab] ? <ProductList product_type={tab} /> : null}
    </div>
  );
}

const mapTypes: {
  [key: string]: {
    attributeName: string;
    values: string[];
  };
} = {
  // Makeups
  Lipstick: {
    attributeName: "lips_makeup_product_type",
    values: getLipsMakeupProductTypeIds([
      "Lipsticks",
      "Lip Stains",
      "Lip Tints",
      "Lip Glosses",
    ]),
  },
  Mascara: {
    attributeName: "lash_makeup_product_type",
    values: getLashMakeupProductTypeIds(["Mascaras"]),
  },
  Blusher: {
    attributeName: "face_makeup_product_type",
    values: getFaceMakeupProductTypeIds(["Blushes"]),
  },
  Highlighter: {
    attributeName: "face_makeup_product_type",
    values: getFaceMakeupProductTypeIds(["Highlighters"]),
  },
  Eyecolor: {
    attributeName: "lenses_product_type",
    values: getLensesProductTypeIds(["Daily Lenses", "Monthly Lenses"]),
  },

  // Accessories
  Sunglasses: {
    attributeName: "head_accessories_product_type",
    values: headAccessoriesProductTypeFilter(["Sunglasses"]),
  },
  "Head Bands": {
    attributeName: "head_accessories_product_type",
    values: headAccessoriesProductTypeFilter(["Head Bands"]),
  },
  Glasses: {
    attributeName: "head_accessories_product_type",
    values: headAccessoriesProductTypeFilter(["Glasses"]),
  },
  Caps: {
    attributeName: "head_accessories_product_type",
    values: headAccessoriesProductTypeFilter(["Hats"]),
  },
  Hats: {
    attributeName: "head_accessories_product_type",
    values: headAccessoriesProductTypeFilter(["Hats"]),
  },
  Chokers: {
    attributeName: "neck_accessories_product_type",
    values: neckAccessoriesProductTypeFilter(["Chokers"]),
  },
  Earrings: {
    attributeName: "head_accessories_product_type",
    values: headAccessoriesProductTypeFilter(["Earrings"]),
  },
  Necklace: {
    attributeName: "neck_accessories_product_type",
    values: headAccessoriesProductTypeFilter(["Necklaces"]),
  },
  Scarf: {
    attributeName: "neck_accessories_product_type",
    values: neckAccessoriesProductTypeFilter(["Scarves"]),
  },
  Bracelet: {
    attributeName: "hand_accessories_product_type",
    values: handAccessoriesProductTypeFilter(["Bracelets"]),
  },
  Rings: {
    attributeName: "hand_accessories_product_type",
    values: handAccessoriesProductTypeFilter(["Rings"]),
  },
};

function ProductList({ product_type }: { product_type: string }) {
  const { data } = useProducts({
    product_type_key: mapTypes[product_type].attributeName,
    type_ids: mapTypes[product_type].values,
  });

  return (
    <div className="flex w-full gap-4 overflow-x-auto no-scrollbar active:cursor-grabbing">
      {data ? (
        data.items.map((product, index) => {
          const imageUrl =
            mediaUrl(product.media_gallery_entries[0].file) ??
            "https://picsum.photos/id/237/200/300";

          return (
            <div
              key={product.id}
              className="w-[115px] rounded shadow"
              onClick={() => {
                window.open(
                  `${baseApiUrl}/${product.custom_attributes.find((attr) => attr.attribute_code === "url_key")?.value as string}.html`,
                  "_blank",
                );
              }}
            >
              <div className="relative h-[80px] w-[115px] overflow-hidden">
                <img
                  src={imageUrl}
                  alt="Product"
                  className="rounded object-cover"
                />
              </div>

              <h3 className="line-clamp-2 py-1 text-[0.625rem] font-semibold text-white sm:h-10 sm:py-2">
                {product.name}
              </h3>

              <p className="h-3 text-[0.5rem] text-white/60">
                <BrandName brandId={getProductAttributes(product, "brand")} />
              </p>

              <div className="flex items-end justify-between space-x-1 pt-1">
                <div className="bg-gradient-to-r from-[#CA9C43] to-[#92702D] bg-clip-text text-[0.625rem] text-transparent">
                  ${product.price.toFixed(2)}
                </div>
                <button
                  type="button"
                  className="flex h-5 items-center justify-center bg-gradient-to-r from-[#CA9C43] to-[#92702D] px-2.5 text-[0.5rem] font-semibold text-white sm:h-7"
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                >
                  Add to cart
                </button>
              </div>
            </div>
          );
        })
      ) : (
        <LoadingProducts />
      )}
    </div>
  );
}

const groupedItems = (findTheLookItems: FindTheLookItems[]) => {
  if (!findTheLookItems) return { makeup: [], accessories: [] };
  return {
    makeup: findTheLookItems.filter((item) => item.section === "makeup"),
    accessories: findTheLookItems.filter(
      (item) => item.section === "accessories",
    ),
  };
};

function BottomContent() {
  const { criterias, setCriterias } = useCamera();
  const { view, setView, findTheLookItems, tab, section, setTab, setSection } =
    useFindTheLookContext();
  const [groupedItemsData, setGroupedItemsData] = useState<{
    makeup: FindTheLookItems[];
    accessories: FindTheLookItems[];
  }>({
    makeup: [],
    accessories: [],
  });

  useEffect(() => {
    if (findTheLookItems) {
      const grouped = groupedItems(findTheLookItems);
      setGroupedItemsData(grouped);
    }
  }, [findTheLookItems]);

  const handleTabChange = (label: string) => {
    setTab(label);
  };

  // Narrowing section type for initialSection
  const initialSection: "makeup" | "accessories" | undefined =
    section === "makeup" || section === "accessories" ? section : undefined;

  // Render different views based on the criteria and view
  if (criterias.isCaptured) {
    // If `tab` and `section` are both not null, render ProductRecommendationsTabs with initial section
    if (tab && section) {
      return (
        <ProductRecommendationsTabs
          groupedItemsData={groupedItemsData}
          initialSection={initialSection} // Using narrowed type here
          activeTab={tab} // Pass activeTab to set the initial active category
          onClose={() => {
            setTab(null);
            setSection(null);
            setView("face"); // Reset to face view
          }}
        />
      );
    }

    // Render the views based on `view`
    if (view === "face") {
      return (
        <InferenceResults
          onFaceClick={() => {
            setView("single_category");
          }}
          onResultClick={() => {
            setView("recommendations");
          }}
        />
      );
    }

    if (view === "recommendations") {
      return (
        <ProductRecommendationsTabs
          groupedItemsData={groupedItemsData}
          initialSection="makeup" // Default to makeup section when entering recommendations view
          onClose={() => setView("face")}
        />
      );
    }

    if (view === "single_category") {
      return (
        <SingleCategoryView
          category="Lipstick"
          onClose={() => {
            setView("face");
          }}
        />
      );
    }

    return (
      <AllProductsPage
        onClose={() => {
          setView("face");
        }}
        groupedItemsData={groupedItemsData}
      />
    );
  }

  return <VideoScene />;
}

function InferenceResults({
  onFaceClick,
  onResultClick,
}: {
  onFaceClick?: () => void;
  onResultClick?: () => void;
}) {
  return (
    <>
      <div className="absolute inset-x-0 bottom-32 flex items-center justify-center">
        <button
          type="button"
          className="bg-black px-10 py-3 text-sm text-white"
          onClick={() => {
            onResultClick?.();
          }}
        >
          FIND THE LOOK
        </button>
      </div>
    </>
  );
}

function ProductRecommendationsTabs({
  groupedItemsData,
  onClose,
  initialSection = "makeup",
  activeTab,
}: {
  groupedItemsData: {
    makeup: FindTheLookItems[];
    accessories: FindTheLookItems[];
  };
  onClose: () => void;
  initialSection?: "makeup" | "accessories"; // New prop to initialize the section
  activeTab?: string; // Active tab for initializing the selected tab in categories
}) {
  const [tab, setTab] = useState<"makeup" | "accessories">(initialSection); // Set initial tab based on initialSection

  console.log({
    activeTab,
  });

  useEffect(() => {
    setTab(initialSection); // Update tab if initialSection changes
  }, [initialSection]);

  const activeClassNames =
    "border-white inline-block text-transparent bg-[linear-gradient(90deg,#CA9C43_0%,#916E2B_27.4%,#6A4F1B_59.4%,#473209_100%)] bg-clip-text";

  return (
    <>
      <div className="fixed inset-0 h-full w-full" onClick={onClose}></div>
      <div className="mx-auto w-full space-y-2 px-4 lg:max-w-xl">
        <div className="flex h-6 w-full items-center justify-between border-b border-gray-600 text-center sm:h-10">
          {["makeup", "accessories"].map((section) => {
            const isActive = tab.toLowerCase() === section;
            return (
              <Fragment key={section}>
                <button
                  key={section}
                  className={`relative h-full grow border-b font-luxury text-sm sm:text-lg ${
                    isActive
                      ? activeClassNames
                      : "border-transparent text-gray-500"
                  }`}
                  onClick={() => setTab(section as "makeup" | "accessories")}
                >
                  <span
                    className={clsx("capitalize", {
                      "text-white/70 blur-sm": isActive,
                    })}
                  >
                    {section}
                  </span>
                  {isActive ? (
                    <>
                      <div
                        className={clsx(
                          "absolute inset-0 flex items-center justify-center blur-sm",
                          activeClassNames,
                        )}
                      >
                        <span className="text-center text-sm capitalize md:text-lg">
                          {section}
                        </span>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-center text-sm capitalize text-white/70 md:text-lg">
                          {section}
                        </span>
                      </div>
                    </>
                  ) : null}
                </button>
              </Fragment>
            );
          })}
        </div>
      </div>
      {tab === "makeup" ? (
        <MakeupCategories
          makeups={groupedItemsData.makeup}
          activeTab={activeTab} // Pass activeTab to MakeupCategories
          onTabChange={(label) => setTab("makeup")}
        />
      ) : (
        <AccessoriesCategories
          accessories={groupedItemsData.accessories}
          activeTab={activeTab} // Pass activeTab to AccessoriesCategories
          onTabChange={(label) => setTab("accessories")}
        />
      )}
    </>
  );
}

function AllProductsPage({
  onClose,
  groupedItemsData,
}: {
  onClose: () => void;
  groupedItemsData: {
    makeup: FindTheLookItems[];
    accessories: FindTheLookItems[];
  };
}) {
  const [tab, setTab] = useState<"makeup" | "accessories">("makeup");
  const { selectedItems: cart, dispatch } = useFindTheLookContext();

  return (
    <div
      className={clsx(
        "fixed inset-0 flex h-dvh flex-col bg-black font-sans text-white",
      )}
    >
      {/* Navigation */}
      <div className="flex items-center justify-between px-4 py-2">
        <button type="button" className="size-6" onClick={() => onClose()}>
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="flex items-center justify-end space-x-2.5">
          <Heart className="size-6" />
          <Icons.bag className="size-6" />
        </div>
      </div>

      {cart.items.length > 0 ? (
        <div className="mx-auto my-4 flex w-fit space-x-2.5 rounded-lg bg-white/25 p-4">
          {cart.items.map((product) => {
            const imageUrl = mediaUrl(
              product.media_gallery_entries[0].file,
            ) as string;
            return (
              <div className="relative size-9">
                <img src={imageUrl} className="h-full w-full object-cover" />

                <div className="absolute right-0 top-0">
                  <button
                    type="button"
                    onClick={() => {
                      dispatch({ type: "remove", payload: product });
                    }}
                  >
                    <X className="size-5 text-black" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="mx-auto flex w-full max-w-[480px] px-4 py-3">
        {["makeup", "accessories"].map((item) => (
          <button
            key={item}
            type="button"
            className={clsx(
              "flex h-8 w-full items-center justify-center border text-xs uppercase",
              item === tab
                ? "border-white bg-white text-black"
                : "border-white text-white",
            )}
            onClick={() => {
              dispatch({ type: "reset" });
              setTab(item as "makeup" | "accessories");
            }}
          >
            Similar {item}
          </button>
        ))}
      </div>

      {tab === "makeup" ? (
        <MakeupAllView makeups={groupedItemsData.makeup} />
      ) : (
        <AccessoriesAllView accessories={groupedItemsData.accessories} />
      )}

      <div className="h-20">
        <div className="mx-auto flex max-w-sm space-x-2.5 pb-6 pt-4 lg:space-x-6">
          <button
            type="button"
            className="flex h-10 w-full items-center justify-center border border-white text-xs font-semibold text-white"
          >
            TRY NOW
          </button>
          <button
            type="button"
            className="flex h-10 w-full items-center justify-center border border-white bg-white text-xs font-semibold text-black"
          >
            ADD ALL TO CART
          </button>
        </div>
      </div>
    </div>
  );
}

function MakeupAllView({ makeups }: { makeups: FindTheLookItems[] }) {
  const validMakeups = makeups.filter((category) => mapTypes[category.label]);

  return (
    <div className="h-full flex-1 overflow-y-auto px-5">
      <div className="space-y-14">
        {validMakeups.map((category) => (
          <ProductHorizontalList
            category={category.label}
            key={category.section}
          />
        ))}
      </div>
    </div>
  );
}

function AccessoriesAllView({
  accessories,
}: {
  accessories: FindTheLookItems[];
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
          />
        ))}
      </div>
    </div>
  );
}

function ProductHorizontalList({ category }: { category: string }) {
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

  return (
    <div key={category}>
      <div className="py-4">
        <h2 className="text-base text-[#E6E5E3]">{category}</h2>
      </div>
      <div className="flex w-full gap-4 overflow-x-auto no-scrollbar active:cursor-grabbing">
        {data ? (
          data.items.map((product, index) => {
            const imageUrl =
              mediaUrl(product.media_gallery_entries[0].file) ??
              "https://picsum.photos/id/237/200/300";

            return (
              <div
                key={product.id}
                className="w-[calc(50%-0.5rem)] shrink-0 rounded shadow lg:w-[calc(16.667%-0.5rem)]"
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

function SingleCategoryView({
  category,
  onClose,
}: {
  category: string;
  onClose: () => void;
}) {
  const { data } = useLipsProductQuery({});

  return (
    <div
      className={clsx(
        "fixed inset-0 flex h-dvh flex-col bg-black font-sans text-white",
      )}
    >
      {/* Navigation */}
      <div className="flex items-center justify-between px-4 py-2">
        <button type="button" className="size-6" onClick={() => onClose()}>
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="flex items-center justify-end space-x-2.5">
          <Heart className="size-6" />
          <Icons.bag className="size-6" />
        </div>
      </div>

      <div className="h-full flex-1 overflow-y-auto px-5">
        <div className="py-4">
          <h2 className="text-base text-[#E6E5E3]">{category}</h2>
        </div>
        <div className="grid grid-cols-2 gap-2.5 py-4 sm:grid-cols-3 xl:grid-cols-6">
          {data
            ? data.items.map((product, index) => {
                const imageUrl = mediaUrl(
                  product.media_gallery_entries[0].file,
                ) as string;
                return (
                  <div
                    key={product.id}
                    className="w-full rounded shadow"
                    onClick={() => {
                      window.open(
                        `${baseApiUrl}/${product.custom_attributes.find((attr) => attr.attribute_code === "url_key")?.value as string}.html`,
                        "_blank",
                      );
                    }}
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={imageUrl}
                        alt="Product"
                        className="h-full w-full rounded object-cover"
                      />
                    </div>

                    <h3 className="line-clamp-2 pt-2.5 text-xs font-semibold text-white">
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
                      >
                        ADD TO CART
                      </button>
                      <button
                        type="button"
                        className="flex h-10 w-full items-center justify-center border border-white bg-white text-xs font-semibold text-black"
                      >
                        TRY ON
                      </button>
                    </div>
                  </div>
                );
              })
            : null}
        </div>
      </div>
    </div>
  );
}

function RecorderStatus() {
  const { isRecording, formattedTime, handleStartPause, handleStop, isPaused } =
    useRecordingControls();
  const { finish } = useCamera();

  return (
    <div className="absolute inset-x-0 top-14 flex items-center justify-center gap-4">
      <button
        className="flex size-8 items-center justify-center"
        onClick={handleStartPause}
      >
        {isPaused ? (
          <CirclePlay className="size-6 text-white" />
        ) : isRecording ? (
          <PauseCircle className="size-6 text-white" />
        ) : null}
      </button>
      <span className="relative flex size-4">
        {isRecording ? (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
        ) : null}
        <span className="relative inline-flex size-4 rounded-full bg-red-500"></span>
      </span>
      <div className="font-serif text-white">{formattedTime}</div>
      <button
        className="flex size-8 items-center justify-center"
        onClick={
          isRecording
            ? () => {
                handleStop();
                finish();
              }
            : handleStartPause
        }
      >
        {isRecording || isPaused ? (
          <StopCircle className="size-6 text-white" />
        ) : (
          <CirclePlay className="size-6 text-white" />
        )}
      </button>
    </div>
  );
}
