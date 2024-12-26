import { useAnimations, useFBX, useGLTF } from "@react-three/drei";
import { LineSegments, Mesh, SkinnedMesh } from "three";
import * as THREE from "three";
import _ from "lodash";
import { useEffect, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import createAnimation from "../../utils/converter";
import blinkData from "../../assets/blendDataBlink.json";
import { useLoadTextures } from "../../utils/textures";
import axios from "axios";
import { applyAvatarMaterials } from "../../utils/avatarMaterialUtils";

const host = "https://talking-avatar.evorty.id";

function makeSpeech(text: string, language = "en-US") {
  console.log(text, language);

  return axios.post(host + "/talk", { text, language });
}

interface AvatarProps {
  avatar_url: string;
  speak: boolean;
  text: string;
  setAudioSource: (audioSource: string) => void;
  playing: boolean;
  setSpeak: (speak: boolean) => void;
  language: string | "en-US";
}

const Avatar = ({
  avatar_url,
  speak,
  text,
  playing,
  setAudioSource,
  setSpeak,
  language,
}: AvatarProps) => {
  const gltf = useGLTF(avatar_url);
  const textures = useLoadTextures();
  const mixer = useMemo(
    () => new THREE.AnimationMixer(gltf.scene),
    [gltf.scene],
  );
  const { animations } = gltf;
  const { actions } = useAnimations(animations, gltf.scene);

  const idleAnimation = animations.find((clip) => clip.name === "idle");
  const talkAnimation = animations.find((clip) => clip.name === "talk");

  const [clips, setClips] = useState<(THREE.AnimationClip | null)[]>([]);
  let morphTargetDictionaryBody: Mesh["morphTargetDictionary"] | null = null;
  let morphTargetDictionaryLowerTeeth: Mesh["morphTargetDictionary"] | null =
    null;

  gltf.scene.traverse((node) => {
    if (
      node instanceof Mesh ||
      node instanceof LineSegments ||
      node instanceof SkinnedMesh
    ) {
      node.castShadow = true;
      node.receiveShadow = true;
      node.frustumCulled = false;

      applyAvatarMaterials(node, textures);

      if (node.name.includes("TeethLower")) {
        morphTargetDictionaryLowerTeeth = node.morphTargetDictionary;
      }

      if (node.name.includes("Body")) {
        morphTargetDictionaryBody = node.morphTargetDictionary;
      }
    }
  });

  useEffect(() => {
    if (idleAnimation) {
      const idleAction = mixer.clipAction(idleAnimation);
      idleAction.play();
    }
  }, [idleAnimation, mixer]);

  useEffect(() => {
    if (speak) {
      // Transition smoothly from idle to talk
      if (idleAnimation && talkAnimation) {
        const idleAction = mixer.clipAction(idleAnimation);
        const talkAction = mixer.clipAction(talkAnimation);

        idleAction.crossFadeTo(talkAction, 0.5, false).play();

        // Pass 'ar' for Arabic language here
        makeSpeech(text, language) // Pass "ar" for Arabic
          .then((response) => {
            console.log("Response Headers:", response.headers);
            console.log("Response Data:", response.data);
            const { blendData, filename } = response.data;
            if (morphTargetDictionaryBody) {
              const newClips = [
                createAnimation(
                  blendData,
                  morphTargetDictionaryBody,
                  "HG_Body",
                ),
                createAnimation(
                  blendData,
                  morphTargetDictionaryLowerTeeth || {},
                  "HG_TeethLower",
                ),
              ];
              setClips(newClips);
              // Tambahkan delay 1 detik sebelum menetapkan audio source
              setTimeout(() => {
                const audioSource = host + filename;
                setAudioSource(audioSource);

                talkAction.reset().setLoop(THREE.LoopRepeat, Infinity);
                talkAction.clampWhenFinished = true;
              }, 1000); // Delay 1 detik (1000 milidetik)
            }
          })
          .catch((err) => {
            console.error(err);
            setSpeak(false);
          });
      }
    } else {
      if (talkAnimation) {
        const talkAction = mixer.clipAction(talkAnimation);
        talkAction.stop();
      }
      if (idleAnimation) {
        mixer.clipAction(idleAnimation).reset().play();
      }
    }
  }, [
    speak,
    text,
    morphTargetDictionaryBody,
    morphTargetDictionaryLowerTeeth,
    setAudioSource,
    setSpeak,
    mixer,
    idleAnimation,
    talkAnimation,
  ]);

  useEffect(() => {
    if (morphTargetDictionaryBody) {
      // Pastikan variabel valid
      const blinkClip = createAnimation(
        blinkData,
        morphTargetDictionaryBody,
        "HG_Body",
      );
      if (blinkClip) {
        const blinkAction = mixer.clipAction(blinkClip);
        blinkAction.play();
      }
    }
  }, [mixer, morphTargetDictionaryBody]);

  useEffect(() => {
    if (!playing) return;

    _.each(clips, (clip) => {
      if (clip) {
        const clipAction = mixer.clipAction(clip);
        clipAction.setLoop(THREE.LoopOnce, 1);
        clipAction.play();
      }
    });
  }, [playing, clips, mixer]);

  useFrame((state, delta) => {
    mixer.update(delta);
  });

  return (
    <group name="avatar">
      <primitive object={gltf.scene} dispose={null} />
    </group>
  );
};

export default Avatar;
