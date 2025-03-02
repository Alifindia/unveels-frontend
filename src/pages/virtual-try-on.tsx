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
import { VirtualTryOnScene } from "../components/vto/virtual-try-on-scene";
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

export function VirtualTryOn() {
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
              />
            )}
            {mode === "VIDEO" && (
              <VirtualTryOnScene mediaFile={mediaFile} mode={mode} />
            )}
            {mode === "LIVE" && (
              <VirtualTryOnScene mediaFile={mediaFile} mode={mode} />
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
  const { criterias } = useCamera();
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/virtual-try-on/makeups");
  }, []);

  return (
    <>
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => {
            navigate("/virtual-try-on/makeups");
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

export function TryOnSelector() {
  const { t } = useTranslation();

  const [tab, setTab] = useState("makeup" as "makeup" | "accessories" | null);

  const activeClassNames =
    "border-white inline-block text-transparent bg-[linear-gradient(90deg,#CA9C43_0%,#916E2B_27.4%,#6A4F1B_59.4%,#473209_100%)] bg-clip-text text-transparent";

  return (
    <div className="mx-auto w-full max-w-lg space-y-2 px-4">
      <div className="flex h-10 w-full items-center justify-between border-b border-gray-600 text-center">
        {["makeup", "accessories"].map((shadeTab) => {
          const isActive = tab === shadeTab;
          return (
            <Fragment key={shadeTab}>
              <button
                key={shadeTab}
                className={`relative h-10 grow border-b font-luxury text-[10px] sm:text-[12px] lg:text-[14px] ${
                  isActive
                    ? activeClassNames
                    : "border-transparent text-gray-500"
                }`}
                onClick={() => setTab(shadeTab as "makeup" | "accessories")}
              >
                <span
                  className={clsx(
                    "capitalize",
                    isActive ? "text-white/70 blur-sm" : "",
                  )}
                >
                  {t("vto." + shadeTab)}
                </span>
                {isActive ? (
                  <>
                    <div
                      className={clsx(
                        "absolute inset-0 flex items-center justify-center text-[10px] blur-sm sm:text-[12px] lg:text-[14px]",
                        activeClassNames,
                      )}
                    >
                      <span className="text-center text-[10px] capitalize sm:text-[12px] lg:text-[14px]">
                        {t("vto." + shadeTab)}
                      </span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-center text-[10px] capitalize text-white/70 sm:text-[12px] lg:text-[14px]">
                        {t("vto." + shadeTab)}
                      </span>
                    </div>
                  </>
                ) : null}
              </button>
            </Fragment>
          );
        })}
      </div>

      {tab === "makeup" ? (
        <Makeups />
      ) : tab === "accessories" ? (
        <Accessories />
      ) : null}
      <Outlet />
    </div>
  );
}

export function Makeups() {
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
        <div className="flex w-full min-w-0 justify-around gap-x-4 py-4 peer-has-[data-mode]:hidden">
          {shadeOptions.map((option, index) => (
            <button
              key={index}
              className="flex flex-col items-center space-y-2"
              data-selected={selectedMakeup === option.name}
              onClick={() => {
                setSelectedMakeup(option.name);
                setSelectedProductNumber(null);
              }}
            >
              <div
                className={clsx(
                  "text-dm relative flex w-10 shrink-0 items-center justify-center rounded-3xl border border-transparent py-1 text-center text-xs text-white transition-all",
                  {
                    "bg-gradient-to-r from-[#CA9C43] via-[#916E2B] to-[#473209]":
                      selectedMakeup === option.name,
                  },
                )}
              >
                {cloneElement(option.icon, {
                  className: "text-white size-5", // Reduce icon size here
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
              <div className="text-center text-[10px] !leading-4 text-white xl:text-xs 2xl:text-sm">
                {t("vto." + option.name)} {/* Reduce text size here */}
              </div>
            </button>
          ))}
        </div>

        {selectedMakeup === "Lips" ? (
          <LipsMode />
        ) : selectedMakeup === "Eyes" ? (
          <EyesMode />
        ) : selectedMakeup === "Face" ? (
          <FaceMode />
        ) : selectedMakeup === "Nails" ? (
          <NailsMode />
        ) : selectedMakeup === "Hair" ? (
          <HairMode />
        ) : null}
      </div>
    </>
  );
}

export function Accessories() {
  const { t } = useTranslation();

  const shadeOptions = [
    {
      name: "Head Accessories",
      icon: <Icons.accessoryHead />,
      items: [
        "Sunglasses",
        "Glasses",
        "Earring",
        "Hats",
        "Tiaras",
        "Headbands",
      ],
    },
    {
      name: "Neck Accessories",
      icon: <Icons.accessoryNeck />,
      items: ["Pendants", "Necklaces", "Chokers", "Scarves"],
    },
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
        <div className="flex w-full min-w-0 justify-around gap-x-4 py-4 peer-has-[data-mode]:hidden">
          {shadeOptions.map((option, index) => (
            <button
              key={index}
              className="flex flex-col items-center justify-center space-y-2"
              data-selected={selectedAccessory === option.name}
              onClick={() => setSelectedAccessory(option.name)}
            >
              <div
                className={clsx(
                  "relative flex h-[30px] w-[36px] shrink-0 items-center justify-center rounded-3xl border border-transparent py-1 text-center text-xs text-white transition-all sm:h-[38px] sm:w-[46px]",
                  {
                    "bg-gradient-to-r from-[#CA9C43] via-[#916E2B] to-[#473209]":
                      selectedAccessory === option.name,
                  },
                )}
              >
                {cloneElement(option.icon, {
                  className: "text-white size-5", // Reduce icon size here
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
              <div className="text-center text-[10px] !leading-4 text-white xl:text-xs 2xl:text-sm">
                {t("vto." + option.name)} {/* Reduce text size here */}
              </div>
            </button>
          ))}
        </div>

        {selectedAccessory === "Head Accessories" ? (
          <HeadAccessoriesMode />
        ) : selectedAccessory === "Neck Accessories" ? (
          <NeckAccessoriesMode />
        ) : selectedAccessory === "Hand Accessories" ? (
          <HandAccessoriesMode />
        ) : selectedAccessory === "Nails" ? (
          <NailsMode />
        ) : null}
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

  const handleBackClick = () => {
    if (location.pathname !== "/virtual-try-on/makeups") {
      navigate("/virtual-try-on/makeups");
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

        <div className="relative -m-0.5 p-0.5">
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent"
            style={{
              background: `linear-gradient(148deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0.77) 100%) border-box`,
              WebkitMask: `linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)`,
              mask: `linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)`,
              WebkitMaskComposite: "destination-out",
              maskComposite: "exclude",
            }}
          />
        </div>
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
