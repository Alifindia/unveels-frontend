import { Icons } from "../../components/icons";
import { RecordDialog } from "../../components/record-dialog";
import SwirlyBackground from "../../assets/swirly-background.svg";
import SwirlyBackgroundDesktop from "../../assets/swirly-background-desktop.svg";
import { TopNavigation } from "../../components/assistant";

const WelcomeScreen = ({ onStarted }: { onStarted: () => void }) => {
  return (
    <div className="relative mx-auto flex min-h-dvh w-full flex-col">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="w-[1700px] -translate-x-[350px] -translate-y-[900px] lg:hidden">
          <img
            src={SwirlyBackground}
            alt="Assistant"
            className="animate-swirly h-auto object-cover opacity-20"
          />
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 overflow-hidden">
        <img
          src={SwirlyBackgroundDesktop}
          alt="Assistant"
          className="relative hidden h-[1222px] w-[2704px] object-cover opacity-25 lg:block"
        />
      </div>
      <TopNavigation />
      <div className="flex h-dvh w-full flex-1 flex-col items-start justify-center px-4 lg:items-center">
        <div>
          <Icons.logo className="size-12 lg:ml-10 lg:size-24" />

          <p className="text-[1.125rem] text-white lg:text-center lg:text-[2.125rem]">
            Welcome to{" "}
            <span className="inline-block bg-[linear-gradient(90deg,#CA9C43_36.41%,#916E2B_46.74%,#6A4F1B_58.8%,#473209_74.11%)] bg-clip-text text-transparent">
              Sarah
            </span>
            , Your Virtual Shopping Assistant
          </p>
          <div className="pt-4 text-sm text-white lg:text-lg">
            Hello and welcome! I’m Sarah, here to assist you with all your
            shopping needs.
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-10 w-full px-6 pb-12 lg:static lg:pt-32">
          <button
            type="button"
            onClick={() => onStarted()}
            className="mx-auto flex w-full items-center justify-center rounded bg-[linear-gradient(90deg,#CA9C43_0%,#916E2B_27.4%,#6A4F1B_59.4%,#473209_100%)] p-2.5 text-sm text-white lg:max-w-md lg:p-4 lg:text-[26px]"
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
