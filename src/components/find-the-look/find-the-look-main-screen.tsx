// FindTheLookMainScreen.tsx
import { useEffect, useRef, useState } from "react";
import { RecorderStatus, TopNavigation } from "../../components/assistant";
import { Icons } from "../../components/icons";
import { useCamera } from "../../context/recorder-context";

export function FindTheLookMainScreen({
  onSelection,
}: {
  onSelection: () => void;
}) {
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
      <RecorderStatus />
      <TopNavigation />
      <div className="px-4 text-center font-extrabold text-white xl:text-start xl:text-2xl">
        How do you want to find the look
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
                <h3 className="truncate text-lg font-bold lg:text-2xl">
                  Live Camera
                </h3>
              </div>
              <p className="overflow-hidden text-ellipsis text-sm leading-relaxed lg:text-base">
                Capture the essence of elegance in real-time with our live
                camera feature.
              </p>
              {activeSection === "liveCamera" && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="bg-gradient-to-b from-[#473209] to-[#CA9C43] bg-clip-text text-transparent">
                      ▼
                    </span>
                    <h4 className="font-semibold">Steps to Follow</h4>
                  </div>
                  <ul className="list-disc space-y-1 pl-5 text-xs text-white lg:text-sm">
                    <li className="whitespace-normal">
                      Hold the camera parallel to the face.
                    </li>
                    <li className="whitespace-normal">
                      Ensure the entire face is centered in the frame.
                    </li>
                    <li className="whitespace-normal">
                      Position the camera at eye level with the face.
                    </li>
                    <li className="whitespace-normal">
                      Keep the camera steady and avoid tilting.
                    </li>
                    <li className="whitespace-normal">
                      Ensure the area is well-lit for clear detection.
                    </li>
                    <li className="whitespace-normal">
                      Avoid shadows on the face by using soft, even lighting.
                    </li>
                  </ul>
                </div>
              )}
            </div>
            {activeSection === "liveCamera" && (
              <button
                onClick={() => handleLiveCamera()}
                className="mt-6 w-full bg-gradient-to-r from-[#473209] to-[#CA9C43] px-10 py-3 font-semibold text-white shadow-lg lg:w-auto"
              >
                USE LIVE CAMERA
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
                  Take a Snapshot
                </h3>
              </div>
              <p className="overflow-hidden text-ellipsis text-sm leading-relaxed lg:text-base">
                Unveil the potential of your favorite images with our photo
                upload feature.
              </p>
              {activeSection === "takeSnapshot" && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="bg-gradient-to-b from-[#473209] to-[#CA9C43] bg-clip-text text-transparent">
                      ▼
                    </span>
                    <h4 className="font-semibold">Steps to Follow</h4>
                  </div>
                  <ul className="list-disc space-y-1 pl-5 text-xs text-white lg:text-sm">
                    <li className="whitespace-normal">
                      Take a clear, high-resolution photo for the best results.
                    </li>
                    <li className="whitespace-normal">
                      Make sure the entire upper body is visible in the photo.
                    </li>
                    <li className="whitespace-normal">
                      Take a photo with even lighting and minimal shadows.
                    </li>
                    <li className="whitespace-normal">
                      Ensure the photo contains only one individual for accurate
                      analysis.
                    </li>
                  </ul>
                </div>
              )}
            </div>
            {activeSection === "takeSnapshot" && (
              <button
                onClick={() => snapshotUploadRef.current?.click()}
                className="mt-6 w-full bg-gradient-to-r from-[#473209] to-[#CA9C43] px-10 py-3 font-semibold text-white shadow-lg lg:w-auto"
              >
                UPLOAD PHOTO
              </button>
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
                  Upload Photo Or Video
                </h3>
              </div>
              <p className="overflow-hidden text-ellipsis text-sm leading-relaxed lg:text-base">
                Immerse yourself in the luxury of transformation with our video
                upload feature.
              </p>
              {activeSection === "uploadPhotoOrVideo" && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="bg-gradient-to-b from-[#473209] to-[#CA9C43] bg-clip-text text-transparent">
                      ▼
                    </span>
                    <h4 className="font-semibold">Steps to Follow</h4>
                  </div>
                  <ul className="list-disc space-y-1 pl-5 text-xs text-white lg:text-sm">
                    <li className="whitespace-normal">
                      Choose a high-quality photo or video for upper body only.
                    </li>
                    <li className="whitespace-normal">
                      Ensure the photo or video is stable and not shaky.
                    </li>
                    <li className="whitespace-normal">
                      Make sure the entire look is visible.
                    </li>
                    <li className="whitespace-normal">
                      Opt for a photo or video with bright, even lighting and
                      minimal shadows.
                    </li>
                    <li className="whitespace-normal">
                      Ensure the photo or video contains only one individual for
                      precise detection.
                    </li>
                  </ul>
                </div>
              )}
            </div>
            {activeSection === "uploadPhotoOrVideo" && (
              <button
                onClick={() => photoVideoUploadRef.current?.click()}
                className="mt-6 w-full bg-gradient-to-r from-[#473209] to-[#CA9C43] px-10 py-3 font-semibold text-white shadow-lg lg:w-auto"
              >
                UPLOAD PHOTO/VIDEO
              </button>
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
