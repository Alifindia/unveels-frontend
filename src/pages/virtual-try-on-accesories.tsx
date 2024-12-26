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
import { cloneElement, CSSProperties, Fragment, useState } from "react";
import { Icons } from "../components/icons";

import { Link, Outlet, useNavigate } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";

import { Footer } from "../components/footer";
import { CameraProvider, useCamera } from "../context/recorder-context";
import { ShareModal } from "../components/share-modal";
import { SkinColorProvider } from "../components/skin-tone-finder-scene/skin-color-context";
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

interface VirtualTryOnProvider {
  children: React.ReactNode;
}

export function VirtualTryOnProvider({ children }: VirtualTryOnProvider) {
  return (
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
  );
}

export function VirtualTryOnAccesories() {
  return (
    <CameraProvider>
      <SkinColorProvider>
        <MakeupProvider>
          <AccesoriesProvider>
            <VirtualTryOnProvider>
              <div className="h-full min-h-dvh">
                <Main />
              </div>
            </VirtualTryOnProvider>
          </AccesoriesProvider>
        </MakeupProvider>
      </SkinColorProvider>
    </CameraProvider>
  );
}

function Main() {
  return (
    <div className="relative mx-auto h-full min-h-dvh w-full bg-black">
      <div className="absolute inset-0">
        <VirtualTryOnScene />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.9) 100%)`,
          }}
        ></div>
      </div>
      {/* <RecorderStatus /> */}
      <TopNavigation item={false} cart={false} />

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0">
        <Sidebar />
        <MainContent />
        <Footer />
      </div>
    </div>
  );
}

function MainContent() {
  const [collapsed, setCollapsed] = useState(false);
  const { criterias } = useCamera();
  const [shareOpen, setShareOpen] = useState(false);
  const navigate = useNavigate();

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

  return (
    <>
      {collapsed ? null : <BottomContent />}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => {
            navigate("/virtual-try-on/makeups");
          }}
        >
          <ChevronDown className="size-6 text-white" />
        </button>
      </div>
    </>
  );
}

export function TryOnSelectorAccesories() {
  return (
    <div className="mx-auto w-full max-w-lg space-y-2 px-4">
      <Accessories />
    </div>
  );
}

export function Accessories() {
  const shadeOptions = [
    {
      name: "Head Accessories",
      icon: <Icons.accessoryHead />,
    },
    {
      name: "Neck Accessories",
      icon: <Icons.accessoryNeck />,
    },
    {
      name: "Hand Accessories",
      icon: <Icons.accessoryHand />,
    },
    {
      name: "Nails",
      icon: <Icons.makeupNails />,
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
                  "relative flex h-[34px] w-[42px] shrink-0 items-center justify-center rounded-3xl border border-transparent py-2 text-center text-xs text-white transition-all sm:h-[44.2px] sm:w-[54.6px]",
                  {
                    "bg-gradient-to-r from-[#CA9C43] via-[#916E2B] to-[#473209]":
                      selectedAccessory === option.name,
                  },
                )}
              >
                {cloneElement(option.icon, {
                  className: "text-white size-6",
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
              <div className="text-center text-[9.8px] !leading-4 text-white sm:text-sm lg:text-lg">
                {option.name}
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

export function TopNavigation({
  item = false,
  cart = false,
}: {
  item?: boolean;
  cart?: boolean;
}) {
  const { flipCamera } = useCamera();
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-5 [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
      <div className="flex flex-col gap-4">
        <Link
          className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-black/25 backdrop-blur-3xl"
          to="/virtual-try-on/makeups"
        >
          <ChevronLeft className="size-6 text-white" />
        </Link>

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
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <div className="pointer-events-none flex flex-col items-center justify-center place-self-end pb-4 pr-5 [&_button]:pointer-events-auto">
      <div className="relative p-0.5">
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

        <div className="flex flex-col gap-4 rounded-full bg-black/25 px-1.5 py-2 backdrop-blur-md">
          <button className="">
            <Icons.camera className="size-4 text-white sm:size-6" />
          </button>
          <button className="">
            <Icons.flipCamera className="size-4 text-white sm:size-6" />
          </button>
          <button className="">
            <Icons.expand className="size-4 text-white sm:size-6" />
          </button>
          <button className="">
            <Icons.compare className="size-4 text-white sm:size-6" />
          </button>
          <button className="">
            <Icons.reset className="size-4 text-white sm:size-6" />
          </button>
          <UploadMediaDialog />
          <button>
            <Icons.share className="size-4 text-white sm:size-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

function UploadMediaDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button type="button" className="flex items-center justify-center">
          <Icons.upload className="size-4 text-white sm:size-6" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-blackA6 data-[state=open]:animate-overlayShow fixed inset-0" />
        <Dialog.Content className="data-[state=open]:animate-contentShow fixed left-1/2 top-1/2 flex max-h-[85vh] w-full max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col justify-center rounded-lg bg-[#0000002E] px-2 py-4 text-white backdrop-blur">
          <div className="flex w-full flex-col justify-center">
            <Dialog.Title className="mb-2 text-center text-[14px] text-white">
              How would you like to try on the makeup ?
            </Dialog.Title>
            <div className="grid grid-cols-3 gap-2">
              <button className="upload-photo flex w-full cursor-pointer flex-col items-center justify-center rounded-lg bg-[#00000042] p-2 backdrop-blur">
                <Icons.uploadPhoto className="size-5 text-white" />

                <p className="mt-2 text-center text-[12px] text-white">
                  Upload Photo
                </p>
                <p className="mt-1 text-left text-[8px] text-white">
                  Upload a photo of yourself to see how different makeup shades
                  look on you.
                </p>
              </button>

              <button className="upload-video flex w-full cursor-pointer flex-col items-center justify-center rounded-lg bg-[#00000042] p-2 backdrop-blur">
                <Icons.uploadVideo className="size-5 text-white" />
                <p className="mt-2 text-center text-[12px] text-white">
                  Upload Video
                </p>
                <p className="mt-1 text-left text-[8px] text-white">
                  Upload a video to apply makeup dynamically and see how they
                  look in motion.
                </p>
              </button>

              <button className="choose-model flex w-full cursor-pointer flex-col items-center justify-center rounded-lg bg-[#00000042] p-2 backdrop-blur">
                <Icons.chooseModel className="size-5 text-white" />
                <p className="mt-2 text-center text-[12px] text-white">
                  Choose model
                </p>
                <p className="mt-1 text-left text-[8px] text-white">
                  Choose a model to see how different makeup appear on a
                  pre-selected image.
                </p>
              </button>
            </div>
          </div>

          <Dialog.Close asChild>
            <button
              className="text-violet11 hover:bg-violet4 focus:shadow-violet7 absolute right-2.5 top-2.5 inline-flex size-[25px] appearance-none items-center justify-center rounded-full focus:shadow-[0_0_0_2px] focus:outline-none"
              aria-label="Close"
            >
              <X />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
