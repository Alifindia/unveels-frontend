// FindTheLookMainScreen.tsx
import { useEffect, useRef, useState } from "react";
import { RecorderStatus, TopNavigation } from "../../components/assistant";
import { Icons } from "../../components/icons";
import { useCamera } from "../../context/recorder-context";
import { useTranslation } from "react-i18next";

export function FindTheLookMainScreen({
  onSelection,
}: {
  onSelection: () => void;
}) {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Refs for the file inputs
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const snapshotUploadRef = useRef<HTMLInputElement>(null);
  const photoVideoUploadRef = useRef<HTMLInputElement>(null);

  // Refs for displaying the uploaded media
  const uploadedImageRef = useRef<HTMLImageElement>(null);
  const uploadedVideoRef = useRef<HTMLVideoElement>(null);
  const { imageRef, videoRef, setRunningMode } = useCamera();

  // Function to toggle active sections
  const handleSectionClick = (
    section: "liveCamera" | "takeSnapshot" | "uploadPhotoOrVideo",
  ) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const handleLiveCamera = () => {
    onSelection();
    setRunningMode("LIVE_CAMERA");
    imageRef.current = null;
    videoRef.current = null;
  };

  const handleUploadImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file) {
      console.log("Image uploaded:", file);
      const reader = new FileReader();
      reader.onload = () => {
        if (uploadedImageRef.current) {
          uploadedImageRef.current.src = reader.result as string;
          uploadedImageRef.current.onload = () => {
            imageRef.current = uploadedImageRef.current; // Set imageRef with uploaded image
            console.log(
              "Image HTML Element is fully loaded:",
              imageRef.current,
            );
            setRunningMode("IMAGE");
            onSelection();
          };
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPhotoOrVideo = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file) {
      const fileType = file.type;
      console.log("Uploaded file type:", fileType);
      if (fileType.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          if (uploadedImageRef.current) {
            uploadedImageRef.current.src = reader.result as string;
            imageRef.current = uploadedImageRef.current;
            setRunningMode("IMAGE");
            onSelection();
          }
        };
        reader.readAsDataURL(file);
      } else if (fileType.startsWith("video/")) {
        const videoURL = URL.createObjectURL(file);
        if (uploadedVideoRef.current) {
          uploadedVideoRef.current.src = videoURL;

          // Akses elemen HTML setelah video dimuat
          uploadedVideoRef.current.onloadeddata = () => {
            videoRef.current = uploadedVideoRef.current;
            console.log("Video HTML Element after load:", videoRef.current);
            setRunningMode("VIDEO");
            onSelection();
          };
        }
      } else {
        console.warn("Unsupported file type:", fileType);
      }
    }
  };

  return (
    <div className="relative mx-auto flex h-full min-h-dvh w-full flex-col bg-black pt-20">
      <input
        ref={photoVideoUploadRef}
        type="file"
        accept="image/*,video/*"
        style={{ display: "none" }}
        onChange={handleUploadPhotoOrVideo}
      />
      <input
        ref={snapshotUploadRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleUploadImage}
      />
      <TopNavigation />
      <div className="px-4 text-center font-extrabold text-white xl:text-start xl:text-2xl">
        {t(`viewftl.page`)}
      </div>

      <div className="space-y-4 p-3.5">
        {/* Section Live Camera */}
        <div
          className="cursor-pointer rounded-3xl bg-[#252525] p-5 text-white shadow-[inset_5.2px_5.2px_19.5px_rgba(255,255,255,0.1)] lg:p-16"
          onClick={() => handleSectionClick("liveCamera")}
        >
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-5 lg:w-2/3">
              <div className="flex items-center space-x-2">
                <Icons.liveCamera className="size-8 shrink-0" />
                <h3 className="text-2xl font-bold">
                  {" "}
                  {t(`camera_select.live.title`)}
                </h3>
              </div>
              <p>{t(`camera_select.live.desc.text`)}</p>
              {activeSection === "liveCamera" && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="bg-gradient-to-b from-[#473209] to-[#CA9C43] bg-clip-text text-transparent">
                      ▼
                    </span>
                    <h4 className="font-semibold">
                      {t(`camera_select.live.desc.h4`)}
                    </h4>
                  </div>
                  <ul className="list-disc space-y-1 pl-5 text-xs text-white lg:text-sm">
                    <li>{t(`camera_select.live.desc.li1`)}</li>
                    <li>{t(`camera_select.live.desc.li2`)}</li>
                    <li>{t(`camera_select.live.desc.li3`)}</li>
                    <li>{t(`camera_select.live.desc.li4`)}</li>
                    <li>{t(`camera_select.live.desc.li5`)}</li>
                    <li>{t(`camera_select.live.desc.li6`)} </li>
                  </ul>
                </div>
              )}
            </div>
            {activeSection === "liveCamera" && (
              <button
                onClick={() => handleLiveCamera()}
                className="mt-6 w-full bg-gradient-to-r from-[#473209] to-[#CA9C43] px-10 py-3 font-semibold text-white shadow-lg lg:w-auto"
              >
                {t(`camera_select.live.desc.btn`)}
              </button>
            )}
          </div>
        </div>

        {/* Section Take a Snapshot */}
        <div
          className="cursor-pointer rounded-3xl bg-[#252525] p-5 text-white shadow-[inset_5.2px_5.2px_19.5px_rgba(255,255,255,0.1)] lg:p-16"
          onClick={() => handleSectionClick("takeSnapshot")}
        >
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-5 lg:w-2/3">
              <div className="flex items-center space-x-2">
                <Icons.takeSnapshot className="size-8 shrink-0" />
                <h3 className="truncate text-lg font-bold lg:text-2xl">
                  {t(`camera_select.snap.title`)}
                </h3>{" "}
              </div>
              <p>{t(`camera_select.snap.desc.text`)}</p>
              {activeSection === "takeSnapshot" && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="bg-gradient-to-b from-[#473209] to-[#CA9C43] bg-clip-text text-transparent">
                      ▼
                    </span>
                    <h4 className="font-semibold">
                      {t(`camera_select.snap.desc.h4`)}
                    </h4>
                  </div>
                  <ul className="list-disc space-y-1 pl-5 text-xs text-white lg:text-sm">
                    <li className="whitespace-normal">
                      {t(`camera_select.snap.desc.li1`)}
                    </li>
                    <li className="whitespace-normal">
                      {t(`camera_select.snap.desc.li2`)}
                    </li>
                    <li className="whitespace-normal">
                      {t(`camera_select.snap.desc.li3`)}
                    </li>
                    <li className="whitespace-normal">
                      {t(`camera_select.snap.desc.li4`)}
                    </li>
                  </ul>
                </div>
              )}
            </div>
            {activeSection === "takeSnapshot" && (
              <div>
                <button
                  onClick={() => snapshotUploadRef.current?.click()}
                  className="mt-6 w-full bg-gradient-to-r from-[#473209] to-[#CA9C43] px-40 py-3 font-semibold text-white shadow-lg lg:w-auto"
                >
                  {t(`camera_select.snap.desc.btn`)}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Section Upload Photo or Video */}
        <div
          className="cursor-pointer rounded-3xl bg-[#252525] p-5 text-white shadow-[inset_5.2px_5.2px_19.5px_rgba(255,255,255,0.1)] lg:p-16"
          onClick={() => handleSectionClick("uploadPhotoOrVideo")}
        >
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-5 lg:w-2/3">
              <div className="flex items-center space-x-2">
                <Icons.uploadPhotoOrVideo className="size-8 shrink-0" />
                <h3 className="truncate text-lg font-bold lg:text-2xl">
                  {t(`camera_select.upload.title`)}
                </h3>{" "}
              </div>
              <p className="overflow-hidden text-ellipsis text-sm leading-relaxed lg:text-base">
                {t(`camera_select.upload.desc.text`)}
              </p>
              {activeSection === "uploadPhotoOrVideo" && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="bg-gradient-to-b from-[#473209] to-[#CA9C43] bg-clip-text text-transparent">
                      ▼
                    </span>
                    <h4 className="font-semibold">
                      {t(`camera_select.upload.desc.h4`)}
                    </h4>
                  </div>
                  <ul className="list-disc space-y-1 pl-5 text-xs text-white lg:text-sm">
                    <li className="whitespace-normal">
                      {t(`camera_select.upload.desc.li1`)}{" "}
                    </li>
                    <li className="whitespace-normal">
                      {t(`camera_select.upload.desc.li2`)}{" "}
                    </li>
                    <li className="whitespace-normal">
                      {t(`camera_select.upload.desc.li3`)}
                    </li>
                    <li className="whitespace-normal"></li>
                    <li className="whitespace-normal">
                      {t(`camera_select.upload.desc.li4`)}
                    </li>
                  </ul>
                </div>
              )}
            </div>
            {activeSection === "uploadPhotoOrVideo" && (
              <div>
                <button
                  onClick={() => photoVideoUploadRef.current?.click()}
                  className="mt-6 w-full bg-gradient-to-r from-[#473209] to-[#CA9C43] px-10 py-3 font-semibold text-white shadow-lg lg:w-auto"
                >
                  {t(`camera_select.upload.desc.btn`)}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Uploaded Image */}
      <img
        ref={uploadedImageRef}
        alt="Uploaded Image"
        style={{ width: "300px", marginTop: "10px", display: "none" }} // Hide it, will be displayed in VideoStream
      />

      {/* Uploaded Video */}
      <video
        ref={uploadedVideoRef}
        controls
        style={{ width: "300px", marginTop: "10px", display: "none" }} // Hide it, will be displayed in VideoStream
      />
    </div>
  );
}
