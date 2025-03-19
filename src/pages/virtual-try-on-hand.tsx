import clsx from "clsx";
import {
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  CirclePlay,
  Heart,
  PauseCircle,
  Plus,
  StopCircle,
  X,
} from "lucide-react";
import {
  cloneElement,
  CSSProperties,
  Fragment,
  useEffect,
  useState,
} from "react";
import { Icons } from "../components/icons";

import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";

import { Footer } from "../components/footer";
import { VideoScene } from "../components/recorder/recorder";
import { CameraProvider, useCamera } from "../context/recorder-context";
import { ShareModal } from "../components/share-modal";
import { SkinColorProvider } from "../components/skin-tone-finder-scene/skin-color-context";
import { usePage } from "../hooks/usePage";
import { useRecordingControls } from "../hooks/useRecorder";
import { EyesMode } from "./vto/eyes/eyes-makeup";
import { FaceMode } from "./vto/face/face-makeup";
import { HairMode } from "./vto/hair/hair-makeup";
import { HandAccessoriesMode } from "./vto/hand-accessories/hand-accessories";
import { HeadAccessoriesMode } from "./vto/head-accesories/head-accessories";
import { LipsMode } from "./vto/lips/lips-makeup";
import { NailsMode } from "./vto/nails/nails-makeup";
import { NeckAccessoriesMode } from "./vto/neck-accessories/neck-accessories";
import {
  VirtualTryOnScene,
  VtoDefaultDetection,
} from "../components/vto/virtual-try-on-scene";
import { MakeupProvider } from "../context/makeup-context";
import { AccesoriesProvider } from "../context/accesories-context";
import { LipColorProvider } from "./vto/lips/lip-color/lip-color-context";
import { LipLinerProvider } from "./vto/lips/lip-liner/lip-liner-context";
import { LipPlumperProvider } from "./vto/lips/lip-plumper/lip-plumper-context";
import { BlushProvider } from "./vto/face/blush/blush-context";
import { FoundationProvider } from "./vto/face/foundation/foundation-context";
import { HighlighterProvider } from "./vto/face/highlighter/highlighter-context";
import { ContourProvider } from "./vto/face/contour/contour-context";
import { BronzerProvider } from "./vto/face/bronzer/bronzer-context";
import { ConcealerProvider } from "./vto/face/concealer/concealer-context";
import { EyeLinerProvider } from "./vto/eyes/eye-liners/eye-liner-context";
import { MascaraProvider } from "./vto/eyes/mascara/mascara-context";
import { LenseProvider } from "./vto/eyes/lenses/lense-context";
import { LashesProvider } from "./vto/eyes/lashes/lashes-context";
import { EyebrowsProvider } from "./vto/eyes/eyebrows/eyebrows-context";
import { EyeShadowProvider } from "./vto/eyes/eye-shadow/eye-shadow-context";
import { HairColorProvider } from "./vto/hair/hair-color/hair-color-context";
import { PressOnNailsProvider } from "./vto/nails/press-on-nails/press-on-nails-context";
import { NailPolishProvider } from "./vto/nails/nail-polish/nail-polish-context";
import { EarringsProvider } from "./vto/head-accesories/earrings/earrings-context";
import { GlassesProvider } from "./vto/head-accesories/glasses/glasses-context";
import { HatsProvider } from "./vto/head-accesories/hats/hats-context";
import { NeckwearProvider } from "./vto/neck-accessories/neckwear/neckwear-context";
import { ScarvesProvider } from "./vto/neck-accessories/scarves/scarves-context";
import { TiaraProvider } from "./vto/head-accesories/tiaras/tiaras-context";
import { HeadbandProvider } from "./vto/head-accesories/headband/headband-context";
import { HandwearProvider } from "./vto/hand-accessories/handwear/handwear-context";
import { WatchesProvider } from "./vto/hand-accessories/watches/watches-context";
import VoiceCommand from "../components/voice-command/voice-command";
import { VirtualTryOnMakeupsVoiceProvider } from "../context/virtual-try-on-makeups-voice-context";
import {
  SelecProductNumberProvider,
  useSelecProductNumberContext,
} from "./vto/select-product-context";
import { ScreenshotPreview } from "../components/screenshot-preview";
import ChangeModel from "../components/change-model";
import {
  FindTheLookProvider,
  useFindTheLookContext,
} from "../context/find-the-look-context";
import { CartProvider, useCartContext } from "../context/cart-context";
import { VTOAllProductsPage } from "../components/vto/vto-all-product-page";
import { FilterProvider } from "../context/filter-context";
import { useTranslation } from "react-i18next";
import { getCookie } from "../utils/other";
import UploadMediaDialog from "../components/vto/upload-media-dialog";
import SuccessPopup from "../components/popup-add-to-cart";

interface VirtualTryOnProvider {
  children: React.ReactNode;
}

export function VirtualTryOnProvider({ children }: VirtualTryOnProvider) {
  return (
    <SelecProductNumberProvider>
      <WatchesProvider>
        <HandwearProvider>
          <ScarvesProvider>
            <NeckwearProvider>
              <TiaraProvider>
                <HeadbandProvider>
                  <HatsProvider>
                    <GlassesProvider>
                      <EarringsProvider>
                        <HairColorProvider>
                          <PressOnNailsProvider>
                            <NailPolishProvider>
                              <MascaraProvider>
                                <LenseProvider>
                                  <LashesProvider>
                                    <EyebrowsProvider>
                                      <EyeShadowProvider>
                                        <EyeLinerProvider>
                                          <ConcealerProvider>
                                            <ContourProvider>
                                              <BronzerProvider>
                                                <HighlighterProvider>
                                                  <FoundationProvider>
                                                    <BlushProvider>
                                                      <LipColorProvider>
                                                        <LipLinerProvider>
                                                          <LipPlumperProvider>
                                                            {children}
                                                          </LipPlumperProvider>
                                                        </LipLinerProvider>
                                                      </LipColorProvider>
                                                    </BlushProvider>
                                                  </FoundationProvider>
                                                </HighlighterProvider>
                                              </BronzerProvider>
                                            </ContourProvider>
                                          </ConcealerProvider>
                                        </EyeLinerProvider>
                                      </EyeShadowProvider>
                                    </EyebrowsProvider>
                                  </LashesProvider>
                                </LenseProvider>
                              </MascaraProvider>
                            </NailPolishProvider>
                          </PressOnNailsProvider>
                        </HairColorProvider>
                      </EarringsProvider>
                    </GlassesProvider>
                  </HatsProvider>
                </HeadbandProvider>
              </TiaraProvider>
            </NeckwearProvider>
          </ScarvesProvider>
        </HandwearProvider>
      </WatchesProvider>
    </SelecProductNumberProvider>
  );
}

export function VirtualTryOnHand() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const storeLang = getCookie("store");

    const lang = storeLang === "ar" ? "ar" : "en";

    i18n.changeLanguage(lang);
  }, [i18n]);

  return (
    <CameraProvider>
      <SkinColorProvider>
        <MakeupProvider>
          <AccesoriesProvider>
            <VirtualTryOnMakeupsVoiceProvider>
              <VirtualTryOnProvider>
                <FindTheLookProvider>
                  <CartProvider>
                    <FilterProvider>
                      <div className="h-full min-h-dvh">
                        <Main />
                      </div>
                    </FilterProvider>
                  </CartProvider>
                </FindTheLookProvider>
              </VirtualTryOnProvider>
            </VirtualTryOnMakeupsVoiceProvider>
          </AccesoriesProvider>
        </MakeupProvider>
      </SkinColorProvider>
    </CameraProvider>
  );
}

function Main() {
  const { criterias } = useCamera();
  const [isMainContentVisible, setMainContentVisible] = useState(true);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"IMAGE" | "VIDEO" | "LIVE">("LIVE");
  const [showChangeModel, setShowChangeModel] = useState(false);
  const [modelImageSrc, setModelImageSrc] = useState<string | null>(null);

  const { view, setView, sectionName, mapTypes, groupedItemsData } =
    useFindTheLookContext();
  const { dataItem, type } = useCartContext();

  if (view === "all_categories") {
    return (
      <VTOAllProductsPage
        onClose={() => {
          setView("face");
        }}
        groupedItemsData={groupedItemsData}
        name={sectionName}
        mapTypes={mapTypes}
      />
    );
  }

  if (view === "face") {
    if (showChangeModel) {
      return (
        <ChangeModel
          onClose={() => setShowChangeModel(false)}
          onChooseImageSrc={(src) => {
            setModelImageSrc(src);
            setMode("IMAGE");
          }}
        />
      );
    }
    return (
      <>
        {criterias.screenshotImage && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10,
            }}
          >
            <ScreenshotPreview />
          </div>
        )}
        <div className="relative mx-auto h-full min-h-dvh w-full bg-black">
          <SuccessPopup product={dataItem} type={type} />
          <div className={`absolute inset-0`}>
            {mode === "IMAGE" && (
              <VirtualTryOnScene
                mediaFile={mediaFile}
                mode={mode}
                modelImageSrc={modelImageSrc}
                defaultDetection={VtoDefaultDetection.HAND_LANDMARKER}
              />
            )}
            {mode === "VIDEO" && (
              <VirtualTryOnScene
                mediaFile={mediaFile}
                mode={mode}
                defaultDetection={VtoDefaultDetection.HAND_LANDMARKER}
              />
            )}
            {mode === "LIVE" && (
              <VirtualTryOnScene
                mediaFile={mediaFile}
                mode={mode}
                defaultDetection={VtoDefaultDetection.HAND_LANDMARKER}
              />
            )}
            <div className="pointer-events-none absolute inset-0"></div>
          </div>
          <TopNavigation />

          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0">
            <Sidebar
              onExpandClick={() => setMainContentVisible(!isMainContentVisible)}
              setMediaFile={setMediaFile}
              setMode={setMode}
              setShowChangeModel={setShowChangeModel}
            />
            <div className="bg-black/10 shadow-lg backdrop-blur-sm">
              {isMainContentVisible && <MainContent />}
              <Footer />
            </div>
          </div>
        </div>
      </>
    );
  }

  return <></>;
}

function MainContent() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => {
            setCollapsed(!collapsed);
          }}
          className="flex h-3 w-full items-center justify-center bg-transparent"
        >
          <div className="h-1 w-8 rounded-full bg-gray-400 xl:w-10" />
        </button>
      </div>
      {collapsed ? null : <BottomContent />}
    </>
  );
}

export function TryOnSelectorHand({ path }: { path: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const tabOptions = [
    {
      name: "Nails",
      icon: <Icons.makeupNails />,
    },
    {
      name: "Hand Accessories",
      icon: <Icons.accessoryHand />,
    },
  ];

  const tab =
    path == "hand"
      ? "Hand Accessories"
      : path == "nail"
        ? "Nails"
        : "Hand Accessories";

  const activeClassNames =
    "border-white inline-block text-transparent bg-[linear-gradient(90deg,#CA9C43_0%,#916E2B_27.4%,#6A4F1B_59.4%,#473209_100%)] bg-clip-text text-transparent";

  const tabName = (name: string) => (name === "Nails" ? "nail" : "hand");

  return (
    <div className="mx-auto w-full max-w-lg space-y-2 px-4">
      <div className="flex w-full items-center justify-around border-b border-gray-600 text-center">
        {tabOptions.map((shadeTab) => {
          const isActive = tab === shadeTab.name;
          return (
            <Fragment key={shadeTab.name}>
              <button
                key={shadeTab.name}
                className={`flex w-full flex-col items-center ${isActive ? "border-b border-gray-100 text-white" : "text-gray-500"} py-3`}
                onClick={() =>
                  navigate("/virtual-try-on-hand/" + tabName(shadeTab.name))
                }
              >
                <div
                  className={clsx(
                    "text-dm relative flex w-10 shrink-0 items-center justify-center rounded-3xl border border-transparent py-1 text-center text-xs text-white transition-all",
                    {
                      "bg-gradient-to-r from-[#CA9C43] via-[#916E2B] to-[#473209]":
                        isActive,
                    },
                  )}
                >
                  {cloneElement(shadeTab.icon, {
                    className: "text-white size-5",
                  })}

                  <div
                    className="absolute inset-0 rounded-3xl border-2 border-transparent p-1"
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
                </div>
                <div className="text-center text-[10px] !leading-4 lg:text-sm">
                  {t("vto." + shadeTab.name)}
                </div>
              </button>
            </Fragment>
          );
        })}
      </div>

      {tab === "Hand Accessories" ? (
        <Hands />
      ) : tab === "Nails" ? (
        <Nails />
      ) : null}
      <Outlet />
    </div>
  );
}

export function Hands() {
  const { t } = useTranslation();

  const shadeOptions = [
    {
      name: "Lips",
      icon: <Icons.makeupLips />,
      items: ["Lip Color", "Lip Liner", "Lip Plumper"],
    },
    {
      name: "Eyes",
      icon: <Icons.makeupEyes />,
      items: [
        "Eyebrows",
        "Eye Shadow",
        "Eye Liner",
        "Lashes",
        "Mascara",
        "Lenses",
      ],
    },
    {
      name: "Face",
      icon: <Icons.makeupFace />,
      items: [
        "Foundation",
        "Concealer",
        "Contour",
        "Blush",
        "Bronzer",
        "Highlighter",
      ],
    },
    {
      name: "Hair",
      icon: <Icons.makeupHair />,
      items: ["Hair Color"],
    },
  ];

  const [selectedMakeup, setSelectedMakeup] = useState<string | null>(null);
  const { setSelectedProductNumber } = useSelecProductNumberContext();

  return (
    <>
      <div className="flex flex-col items-start">
        <HandAccessoriesMode />
      </div>
    </>
  );
}

export function Nails() {
  const { t } = useTranslation();

  const shadeOptions = [
    {
      name: "Hand Accessories",
      icon: <Icons.accessoryHand />,
      items: ["Watches", "Rings", "Bracelets", "Bangles"],
    },
    {
      name: "Nails",
      icon: <Icons.makeupNails />,
      items: ["Nail Polish", "Press on Nails"],
    },
  ];

  const [selectedAccessory, setSelectedAccessory] = useState<string | null>(
    null,
  );

  return (
    <>
      <div className="flex flex-col items-start">
        <NailsMode />
      </div>
    </>
  );
}

function BottomContent() {
  return <Outlet />;
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

export function TopNavigation({}: {}) {
  const isDevelopment = process.env.NODE_ENV === "development";
  const navigate = useNavigate();
  const location = useLocation();
  const { summaryCount } = useCartContext();

  const handleBackClick = () => {
    if (location.pathname !== "/virtual-try-on-hand/hand") {
      navigate(-1);
    } else {
      if (isDevelopment) {
        window.location.href = "/";
      } else {
        window.location.href =
          import.meta.env.VITE_API_BASE_URL + "/technologies";
      }
    }
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-5 [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
      <div className="flex flex-col gap-4">
        <button
          className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-black/25 backdrop-blur-3xl"
          onClick={handleBackClick}
        >
          <ChevronLeft className="size-6 text-white" />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {isDevelopment ? (
          <Link
            type="button"
            className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-black/25 backdrop-blur-3xl"
            to="/"
          >
            <X className="size-6 text-white" />
          </Link>
        ) : (
          <a
            type="button"
            className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-black/25 backdrop-blur-3xl"
            href={import.meta.env.VITE_API_BASE_URL + "/technologies"}
          >
            <X className="size-6 text-white" />
          </a>
        )}

        <button
          type="button"
          className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-black/25 backdrop-blur-3xl"
        >
          <Icons.myCart className="size-6 text-white" />
          <span className="absolute bottom-[5px] right-[5px] flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {summaryCount}
          </span>
        </button>
      </div>
    </div>
  );
}

interface SidebarProps {
  onExpandClick: () => void;
  setMediaFile: (file: File | null) => void;
  setMode: (mode: "IMAGE" | "VIDEO" | "LIVE") => void;
  setShowChangeModel: (isShow: boolean) => void;
}

function Sidebar({
  onExpandClick,
  setMediaFile,
  setMode,
  setShowChangeModel,
}: SidebarProps) {
  const { flipCamera, compareCapture, resetCapture, screenShoot } = useCamera();

  return (
    <div className="pointer-events-none flex flex-col items-center justify-center place-self-end pb-4 pr-5 [&_button]:pointer-events-auto">
      <div className="relative p-0.5">
        <div className="absolute inset-0 rounded-full border-2 border-transparent" />

        <div className="flex flex-col gap-4 rounded-full bg-black/25 px-1.5 py-2 backdrop-blur-md">
          {/* <VoiceCommand /> */}
          <button className="" onClick={screenShoot}>
            <Icons.camera className="size-3 text-white xl:size-4 2xl:size-5" />
          </button>
          <button className="" onClick={flipCamera}>
            <Icons.flipCamera className="size-3 text-white xl:size-4 2xl:size-5" />
          </button>
          <button className="" onClick={onExpandClick}>
            <Icons.expand className="size-3 text-white xl:size-4 2xl:size-5" />
          </button>
          <button className="" onClick={compareCapture}>
            <Icons.compare className="size-3 text-white xl:size-4 2xl:size-5" />
          </button>
          <UploadMediaDialog
            setMediaFile={setMediaFile}
            setMode={setMode}
            setShowChangeModel={setShowChangeModel}
          />
        </div>
      </div>
    </div>
  );
}
