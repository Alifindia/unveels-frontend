import React from "react";

const BleedEffect = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg fill="none" viewBox="0 0 406 152" {...props}>
      <g filter="url(#filter0_f_9846_588)">
        <ellipse cx="203" cy="76" fill="#342112" rx="143" ry="16" />
      </g>
      <g filter="url(#filter1_f_9846_588)">
        <path
          fill="#CA9C43"
          d="M346 85.563C346 91.327 281.977 93 203 93S60 91.327 60 85.563c0-5.765 64.023.438 143 .438s143-6.203 143-.438Z"
        />
      </g>
      <defs>
        <filter
          id="filter0_f_9846_588"
          width="406"
          height="152"
          x="0"
          y="0"
          color-interpolation-filters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur
            result="effect1_foregroundBlur_9846_588"
            stdDeviation="30"
          />
        </filter>
        <filter
          id="filter1_f_9846_588"
          width="306"
          height="29.891"
          x="50"
          y="73.109"
          color-interpolation-filters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur
            result="effect1_foregroundBlur_9846_588"
            stdDeviation="5"
          />
        </filter>
      </defs>
    </svg>
  );
};

export default BleedEffect;
