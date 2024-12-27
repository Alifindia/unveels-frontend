import { Suspense, useEffect, useState } from "react";
import { createMemoryRouter, Link, RouterProvider } from "react-router-dom";
import { useBrandsQuerySuspense } from "./api/brands";
import { useCategoriesQuerySuspense } from "./api/categories";
import "./index.css";
import { VirtulAssistant } from "./pages/assistant/virtual-assistant";
import { FaceAnalyzer } from "./pages/face-analyzer";
import { FindTheLook } from "./pages/find-the-look";
import { FindTheLookWeb } from "./pages/find-the-look-web";
import { PersonalityFinder } from "./pages/personality-finder";
import { PersonalityFinderWeb } from "./pages/personality-finder-web-";
import { SeeImprovement } from "./pages/see-improvement";
import { SingleVirtualTryOn } from "./pages/single-virtual-try-on";
import { SkinAnalysis } from "./pages/skin-analysis";
import { SkinAnalysisWeb } from "./pages/skin-analysis-web";
import { SkinToneFinder } from "./pages/skin-tone-finder";
import { SkinToneFinderWeb } from "./pages/skin-tone-finder-web";
import { TryOnSelector, VirtualTryOn } from "./pages/virtual-try-on";
import { EyeLinerSelector } from "./pages/vto/eyes/eye-liners/eye-liner";
import { EyeShadowSelector } from "./pages/vto/eyes/eye-shadow/eye-shadow";
import { EyebrowsSelector } from "./pages/vto/eyes/eyebrows/eyebrows";
import { EyesMode } from "./pages/vto/eyes/eyes-makeup";
import { LashesSelector } from "./pages/vto/eyes/lashes/lashes";
import { LenseSelector } from "./pages/vto/eyes/lenses/lense";
import { MascaraSelector } from "./pages/vto/eyes/mascara/mascara";
import { BlushSelector } from "./pages/vto/face/blush/blush";
import { BronzerSelector } from "./pages/vto/face/bronzer/bronzer";
import { ConcealerSelector } from "./pages/vto/face/concealer/concealer";
import { ContourSelector } from "./pages/vto/face/contour/contour";
import { FaceMode } from "./pages/vto/face/face-makeup";
import { FoundationSelector } from "./pages/vto/face/foundation/foundation";
import { HighlighterSelector } from "./pages/vto/face/highlighter/highlighter";
import { HairColorSelector } from "./pages/vto/hair/hair-color/hair-color";
import { HairMode } from "./pages/vto/hair/hair-makeup";
import { HandwearSelector } from "./pages/vto/hand-accessories/handwear/handwear";
import { WatchesSelector } from "./pages/vto/hand-accessories/watches/watches";
import { EarringsSelector } from "./pages/vto/head-accesories/earrings/earrings";
import { GlassesSelector } from "./pages/vto/head-accesories/glasses/glasses";
import { HatsSelector } from "./pages/vto/head-accesories/hats/hats";
import { HeadbandSelector } from "./pages/vto/head-accesories/headband/headband";
import { TiaraSelector } from "./pages/vto/head-accesories/tiaras/tiaras";
import { LipColorSelector } from "./pages/vto/lips/lip-color/lip-color";
import { LipLinerSelector } from "./pages/vto/lips/lip-liner/lip-liner";
import { LipPlumperSelector } from "./pages/vto/lips/lip-plumper/lip-plumper";
import { LipsMode } from "./pages/vto/lips/lips-makeup";
import { NailPolishSelector } from "./pages/vto/nails/nail-polish/nail-polish";
import { NailsMode } from "./pages/vto/nails/nails-makeup";
import { PressOnNailsSelector } from "./pages/vto/nails/press-on-nails/press-on-nails";
import { NeckwearSelector } from "./pages/vto/neck-accessories/neckwear/neckwear";
import { ScarvesSelector } from "./pages/vto/neck-accessories/scarves/scarves";
import { VirtualAvatar } from "./pages/virtual-avatar";
import { createGuestCart } from "./api/create-guest-cart";
import { useCartContext } from "./context/cart-context";
import { SeeImprovementWeb } from "./pages/see-improvement-web";
import { VirtualTryOnWeb } from "./pages/virtual-try-on-web";
import {
  VirtualTryOnMakeups,
  TryOnSelectorMakeups,
} from "./pages/virtual-try-on-makeups";
import {
  VirtualTryOnMakeupsVoice,
  TryOnSelectorMakeupsVoice,
} from "./pages/virtual-try-on-makeups-voice";
import {
  TryOnSelectorAccesories,
  VirtualTryOnAccesories,
} from "./pages/virtual-try-on-accesories";

// Define routes using object syntax
const routes = [
  {
    path: "/",
    element: (
      <Suspense fallback={<>Loading...</>}>
        <Home />
      </Suspense>
    ),
  },
  { path: "/skin-tone-finder", element: <SkinToneFinder /> },
  { path: "/personality-finder", element: <PersonalityFinder /> },
  { path: "/face-analyzer", element: <FaceAnalyzer /> },
  { path: "/skin-analysis", element: <SkinAnalysis /> },
  { path: "/find-the-look", element: <FindTheLook /> },
  { path: "/personality-finder-web", element: <PersonalityFinderWeb /> },
  { path: "/find-the-look-web", element: <FindTheLookWeb /> },
  { path: "/skin-tone-finder-web", element: <SkinToneFinderWeb /> },
  { path: "/virtual-assistant", element: <VirtulAssistant /> },
  { path: "/skin-analysis-web", element: <SkinAnalysisWeb /> },
  { path: "/virtual-avatar-web", element: <VirtualAvatar /> },
  { path: "/see-improvement-web", element: <SeeImprovementWeb /> },
  { path: "/see-improvement", element: <SeeImprovement /> },
  { path: "/virtual-try-on-web", element: <VirtualTryOnWeb /> },
  {
    path: "/virtual-try-on-product",
    element: <SingleVirtualTryOn />,
  },
  {
    path: "/virtual-try-on",
    element: <VirtualTryOn />,
    children: [
      { path: "makeups", element: <TryOnSelector /> },
      // Lips
      { path: "lips", element: <LipsMode /> },
      { path: "lip-color", element: <LipColorSelector /> },
      { path: "lip-liner", element: <LipLinerSelector /> },
      { path: "lip-plumper", element: <LipPlumperSelector /> },
      // Eyes
      { path: "eyes", element: <EyesMode /> },
      { path: "eyebrows", element: <EyebrowsSelector /> },
      { path: "eye-shadow", element: <EyeShadowSelector /> },
      { path: "eye-liner", element: <EyeLinerSelector /> },
      { path: "lashes", element: <LashesSelector /> },
      { path: "mascara", element: <MascaraSelector /> },
      { path: "lenses", element: <LenseSelector /> },
      // Face
      { path: "face", element: <FaceMode /> },
      { path: "foundation", element: <FoundationSelector /> },
      { path: "concealer", element: <ConcealerSelector /> },
      { path: "contour", element: <ContourSelector /> },
      { path: "blush", element: <BlushSelector /> },
      { path: "bronzer", element: <BronzerSelector /> },
      { path: "highlighter", element: <HighlighterSelector /> },
      // Nails
      { path: "nails", element: <NailsMode /> },
      { path: "nail-polish", element: <NailPolishSelector /> },
      { path: "press-on-nails", element: <PressOnNailsSelector /> },
      // Hair
      { path: "hair", element: <HairMode /> },
      { path: "hair-color", element: <HairColorSelector /> },

      // Head
      { path: "sunglasses", element: <GlassesSelector /> },
      { path: "glasses", element: <GlassesSelector /> },
      { path: "earrings", element: <EarringsSelector /> },
      { path: "headbands", element: <HeadbandSelector /> },
      { path: "hats", element: <HatsSelector /> },
      { path: "tiaras", element: <TiaraSelector /> },
      // Neck
      { path: "pendants", element: <NeckwearSelector /> },
      { path: "necklaces", element: <NeckwearSelector /> },
      { path: "chokers", element: <NeckwearSelector /> },
      { path: "scarves", element: <ScarvesSelector /> },
      // Hand
      { path: "rings", element: <HandwearSelector /> },
      { path: "bracelets", element: <HandwearSelector /> },
      { path: "bangles", element: <HandwearSelector /> },
      { path: "watches", element: <WatchesSelector /> },
    ],
  },
  {
    path: "/virtual-try-on-makeups",
    element: <VirtualTryOnMakeups />,
    children: [
      { path: "makeups", element: <TryOnSelectorMakeups /> },
      // Lips
      { path: "lips", element: <LipsMode /> },
      { path: "lip-color", element: <LipColorSelector /> },
      { path: "lip-liner", element: <LipLinerSelector /> },
      { path: "lip-plumper", element: <LipPlumperSelector /> },
      // Eyes
      { path: "eyes", element: <EyesMode /> },
      { path: "eyebrows", element: <EyebrowsSelector /> },
      { path: "eye-shadow", element: <EyeShadowSelector /> },
      { path: "eye-liner", element: <EyeLinerSelector /> },
      { path: "lashes", element: <LashesSelector /> },
      { path: "mascara", element: <MascaraSelector /> },
      { path: "lenses", element: <LenseSelector /> },
      // Face
      { path: "face", element: <FaceMode /> },
      { path: "foundation", element: <FoundationSelector /> },
      { path: "concealer", element: <ConcealerSelector /> },
      { path: "contour", element: <ContourSelector /> },
      { path: "blush", element: <BlushSelector /> },
      { path: "bronzer", element: <BronzerSelector /> },
      { path: "highlighter", element: <HighlighterSelector /> },
      // Nails
      { path: "nails", element: <NailsMode /> },
      { path: "nail-polish", element: <NailPolishSelector /> },
      { path: "press-on-nails", element: <PressOnNailsSelector /> },
      // Hair
      { path: "hair", element: <HairMode /> },
      { path: "hair-color", element: <HairColorSelector /> },
    ],
  },
  {
    path: "/virtual-try-on-makeups-voice",
    element: <VirtualTryOnMakeupsVoice />,
    children: [
      { path: "makeups", element: <TryOnSelectorMakeupsVoice /> },
      // Lips
      { path: "lips", element: <LipsMode /> },
      { path: "lip-color", element: <LipColorSelector /> },
      { path: "lip-liner", element: <LipLinerSelector /> },
      { path: "lip-plumper", element: <LipPlumperSelector /> },
      // Eyes
      { path: "eyes", element: <EyesMode /> },
      { path: "eyebrows", element: <EyebrowsSelector /> },
      { path: "eye-shadow", element: <EyeShadowSelector /> },
      { path: "eye-liner", element: <EyeLinerSelector /> },
      { path: "lashes", element: <LashesSelector /> },
      { path: "mascara", element: <MascaraSelector /> },
      { path: "lenses", element: <LenseSelector /> },
      // Face
      { path: "face", element: <FaceMode /> },
      { path: "foundation", element: <FoundationSelector /> },
      { path: "concealer", element: <ConcealerSelector /> },
      { path: "contour", element: <ContourSelector /> },
      { path: "blush", element: <BlushSelector /> },
      { path: "bronzer", element: <BronzerSelector /> },
      { path: "highlighter", element: <HighlighterSelector /> },
      // Nails
      { path: "nails", element: <NailsMode /> },
      { path: "nail-polish", element: <NailPolishSelector /> },
      { path: "press-on-nails", element: <PressOnNailsSelector /> },
      // Hair
      { path: "hair", element: <HairMode /> },
      { path: "hair-color", element: <HairColorSelector /> },
    ],
  },
  {
    path: "/virtual-try-on-accesories",
    element: <VirtualTryOnAccesories />,
    children: [
      { path: "accesories", element: <TryOnSelectorAccesories /> },
      // Head
      { path: "sunglasses", element: <GlassesSelector /> },
      { path: "glasses", element: <GlassesSelector /> },
      { path: "earrings", element: <EarringsSelector /> },
      { path: "headbands", element: <HeadbandSelector /> },
      { path: "hats", element: <HatsSelector /> },
      { path: "tiaras", element: <TiaraSelector /> },
      // Neck
      { path: "pendants", element: <NeckwearSelector /> },
      { path: "necklaces", element: <NeckwearSelector /> },
      { path: "chokers", element: <NeckwearSelector /> },
      { path: "scarves", element: <ScarvesSelector /> },
      // Hand
      { path: "rings", element: <HandwearSelector /> },
      { path: "bracelets", element: <HandwearSelector /> },
      { path: "bangles", element: <HandwearSelector /> },
      { path: "watches", element: <WatchesSelector /> },
    ],
  },
];

function Home() {
  useCategoriesQuerySuspense();
  useBrandsQuerySuspense();

  return (
    <div className="absolute left-0 top-4 flex flex-col gap-4">
      <LinkButton to="/skin-tone-finder">Skin Tone Finder</LinkButton>
      <LinkButton to="/personality-finder">Personality Finder</LinkButton>
      <LinkButton to="/face-analyzer">Face Analyzer</LinkButton>
      <LinkButton to="/skin-analysis">Skin Analysis</LinkButton>
      <LinkButton to="/find-the-look">Find The Look</LinkButton>
      <LinkButton to="/personality-finder-web">
        Personality Finder Web
      </LinkButton>
      <LinkButton to="/skin-tone-finder-web">Skin Tone Finder Web</LinkButton>
      <LinkButton to="/skin-analysis-web">Skin Analysis Web</LinkButton>
      <LinkButton to="/find-the-look-web">Find The Look Web</LinkButton>
      <LinkButton to="/virtual-avatar-web">Virtual Avatar Web</LinkButton>
      <LinkButton to="/see-improvement-web">See Improvement Web</LinkButton>
      <LinkButton to="/virtual-try-on-web">Virtual Try On Web</LinkButton>
      <LinkButton to="/virtual-try-on/makeups">Virtual Try On</LinkButton>
      <LinkButton to="/virtual-try-on-makeups/makeups">
        Virtual Try On Makeup
      </LinkButton>
      <LinkButton to="/virtual-try-on-makeups-voice/makeups">
        Virtual Try On Makeup Voice
      </LinkButton>
      <LinkButton to="/virtual-try-on-accesories/accesories">
        Virtual Try On Accesories
      </LinkButton>
      <LinkButton to="/virtual-try-on-product?sku=3348901601412">
        Virtual Try On Product
      </LinkButton>
      <LinkButton to="/virtual-assistant">Virtual Assistant</LinkButton>
      <LinkButton to="/see-improvement">See Improvement</LinkButton>
    </div>
  );
}
function App() {
  const { guestCartId, setGuestCartId } = useCartContext();

  useEffect(() => {
    const initializeCart = async () => {
      if (!guestCartId) {
        try {
          const cartId = await createGuestCart();
          setGuestCartId(cartId);
        } catch (error) {
          console.error("Failed to initialize guest cart:", error);
        }
      }
    };

    initializeCart();
  }, [guestCartId, setGuestCartId]);

  const router = import.meta.env.DEV
    ? createMemoryRouter(routes, {
        initialEntries: [window.__INITIAL_ROUTE__ || "/"],
      })
    : createMemoryRouter(routes, {
        initialEntries: [window.__INITIAL_ROUTE__ || "/"],
      });
  return <RouterProvider router={router} />;
}

// Link button component
function LinkButton({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  return (
    <Link to={to}>
      <button type="button" className="border border-black">
        {children}
      </button>
    </Link>
  );
}

export default App;
