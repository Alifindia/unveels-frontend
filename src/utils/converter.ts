// converter.ts
import { AnimationClip, NumberKeyframeTrack } from "three";

const fps: number = 60;

interface BlendShapeData {
  [key: string]: number;
}

interface RecordedData {
  blendshapes: BlendShapeData;
}

type MorphTargetDictionary = { [key: string]: number };

function modifiedKey(key: string): string {
  if (
    [
      "eyeLookDownLeft",
      "eyeLookDownRight",
      "eyeLookInLeft",
      "eyeLookInRight",
      "eyeLookOutLeft",
      "eyeLookOutRight",
      "eyeLookUpLeft",
      "eyeLookUpRight",
    ].includes(key)
  ) {
    return key;
  }

  if (key.endsWith("Right")) {
    return key.replace("Right", "_R");
  }
  if (key.endsWith("Left")) {
    return key.replace("Left", "_L");
  }
  return key;
}

function createAnimation(
  recordedData: RecordedData[],
  morphTargetDictionary: MorphTargetDictionary,
  bodyPart: string,
): AnimationClip | null {
  if (recordedData.length === 0) {
    return null;
  }

  const animation: number[][] = Array(Object.keys(morphTargetDictionary).length)
    .fill([])
    .map(() => []);
  const time: number[] = [];
  let finishedFrames: number = 0;

  recordedData.forEach((d) => {
    Object.entries(d.blendshapes).forEach(([key, value]) => {
      if (!(modifiedKey(key) in morphTargetDictionary)) return;

      if (key === "mouthShrugUpper") {
        value += 0.4;
      }

      animation[morphTargetDictionary[modifiedKey(key)]].push(value);
    });
    time.push(finishedFrames / fps);
    finishedFrames++;
  });

  const tracks: NumberKeyframeTrack[] = [];
  //   let flag = false;

  Object.entries(recordedData[0].blendshapes).forEach(([key]) => {
    if (!(modifiedKey(key) in morphTargetDictionary)) return;

    const i = morphTargetDictionary[modifiedKey(key)];
    const track = new NumberKeyframeTrack(
      `${bodyPart}.morphTargetInfluences[${i}]`,
      time,
      animation[i],
    );
    tracks.push(track);
  });

  const clip = new AnimationClip("animation", -1, tracks);
  return clip;
}

export default createAnimation;
