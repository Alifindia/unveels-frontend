import * as Dialog from "@radix-ui/react-dialog";
import { Icons } from "../icons";
import { X } from "lucide-react";

function UploadMediaDialog({
  setMediaFile,
  setMode,
  setShowChangeModel,
}: {
  setMediaFile: (file: File | null) => void;
  setMode: (mode: "IMAGE" | "VIDEO" | "LIVE") => void;
  setShowChangeModel: (isShow: boolean) => void;
}) {
  const handleUploadPhoto = (event: any) => {
    const file = event.target.files[0];
    if (file) {
      setMode("IMAGE");
      setMediaFile(file);
    }
  };

  const handleUploadVideo = (event: any) => {
    const file = event.target.files[0];
    if (file) {
      setMode("VIDEO");
      setMediaFile(file);
    }
  };

  const handleChangeModel = () => {
    setShowChangeModel(true);
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button type="button" className="flex items-center justify-center">
          <Icons.upload className="size-4 text-white xl:size-5 2xl:size-6" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-blackA6 data-[state=open]:animate-overlayShow fixed inset-0" />
        <Dialog.Content className="data-[state=open]:animate-contentShow fixed left-1/2 top-1/2 flex max-h-[85vh] w-full max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col justify-center rounded-lg bg-[#0000002E] px-2 py-4 text-white backdrop-blur">
          <div className="flex w-full flex-col justify-center">
            <Dialog.Title className="mb-2 text-center text-[14px] text-white">
              How would you like to try on the makeup?
            </Dialog.Title>
            <div className="grid grid-cols-3 gap-2">
              <button
                className="upload-photo flex w-full cursor-pointer flex-col items-center justify-center rounded-lg bg-[#00000042] p-2 backdrop-blur"
                onClick={() => {
                  const photoInput = document.getElementById("photoInput");
                  if (photoInput) {
                    photoInput.click();
                  }
                }}
              >
                <Icons.uploadPhoto className="size-5 text-white" />
                <p className="mt-2 text-center text-[12px] text-white">
                  Upload Photo
                </p>
                <p className="mt-1 text-left text-[8px] text-white">
                  Upload a photo of yourself to see how different makeup shades
                  look on you.
                </p>
                <input
                  id="photoInput"
                  type="file"
                  accept="image/*"
                  onChange={handleUploadPhoto}
                  style={{ display: "none" }}
                />
              </button>

              <button
                className="upload-video flex w-full cursor-pointer flex-col items-center justify-center rounded-lg bg-[#00000042] p-2 backdrop-blur"
                onClick={() => {
                  const videoInput = document.getElementById("videoInput");
                  if (videoInput) {
                    videoInput.click();
                  }
                }}
              >
                <Icons.uploadVideo className="size-5 text-white" />
                <p className="mt-2 text-center text-[12px] text-white">
                  Upload Video
                </p>
                <p className="mt-1 text-left text-[8px] text-white">
                  Upload a video to apply makeup dynamically and see how they
                  look in motion.
                </p>
                <input
                  id="videoInput"
                  type="file"
                  accept="video/*"
                  onChange={handleUploadVideo}
                  style={{ display: "none" }}
                />
              </button>

              <button
                onClick={handleChangeModel}
                className="choose-model flex w-full cursor-pointer flex-col items-center justify-center rounded-lg bg-[#00000042] p-2 backdrop-blur"
              >
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

export default UploadMediaDialog;
