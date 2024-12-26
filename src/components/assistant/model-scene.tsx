import { Loader, OrthographicCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import Avatar from "./avatar";
import { BlendData } from "../../types/blendData";

interface ModelSceneProps {
  speak: boolean;
  playing: boolean;
  blendshape: BlendData[];
}

const ModelScene = ({ speak, playing, blendshape }: ModelSceneProps) => {
  return (
    <>
      <Canvas dpr={2}>
        <OrthographicCamera
          makeDefault
          zoom={420}
          position={[0.06, 1.2, 1]}
          rotation={[0, 0.05, 0]}
        />
        <Suspense fallback={null}>
          {/* Main directional light */}
          <directionalLight intensity={2} position={[0, 1, 25]} castShadow />

          {/* Ambient light for soft overall lighting */}
          <ambientLight intensity={1} />

          {/* Point light for adding focus in specific areas */}
          <pointLight intensity={20} position={[10, 20, -10]} castShadow />

          {/* Spotlight for dramatic lighting effect */}
          <spotLight
            intensity={0.8}
            position={[15, 20, 20]}
            angle={0.2}
            penumbra={0.5}
            castShadow
          />
        </Suspense>
        <Suspense fallback={null}>
          <Avatar
            avatar_url="/media/unveels/3d/sarahkarakter.glb"
            speak={speak}
            playing={playing}
            blendshape={blendshape}
          />
        </Suspense>
      </Canvas>
      <Loader dataInterpolation={() => `Loading... please wait`} />
    </>
  );
};

export default ModelScene;
