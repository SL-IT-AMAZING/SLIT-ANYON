import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const MAIN_PATH =
  "M260.909 3.21674C275.059 1.60805 288.756 -0.0579168 302.605 0.00154619C344.037 0.179479 383.474 9.40714 421.163 26.2739C439.296 34.3886 456.711 43.8669 472.01 56.7557C479.554 63.1113 481.08 72.3303 476.136 79.9823C471.391 87.3261 461.509 90.1038 453.162 86.0234C448.694 83.8391 444.574 80.9398 440.309 78.3434C406.699 57.8837 370.563 44.6622 331.323 40.4001C277.338 34.5365 227.101 46.584 180.051 72.8022C133.39 98.8031 97.9826 136.051 72.4544 182.776C55.3282 214.122 44.4674 247.668 41.1651 283.182C36.0785 337.885 47.618 389.065 76.637 436.046C82.6076 445.713 89.1425 454.946 96.4986 463.584C103.837 472.201 111.629 480.393 120.972 488.241C113.26 470.914 107.319 453.761 102.731 436.104C95.2106 407.163 92.5989 377.75 94.4383 348.023C96.4499 315.514 103.807 284.083 118.024 254.714C148.307 192.155 195.679 148.962 263.877 131.674C319.145 117.664 370.892 127.363 416.859 161.51C451.974 187.595 472.994 223.181 479.562 266.441C485.709 306.919 477.163 344.425 451.728 377.041C428.234 407.168 397.206 424.063 358.91 427.613C337.423 429.604 317.308 424.249 297.378 417.529C289.075 414.729 285.49 406.571 288.157 398.067C290.628 390.187 297.85 386.326 306.403 388.492C315.261 390.734 323.87 393.812 333.018 395.066C366.24 399.622 394.618 390.048 417.959 366.098C435.563 348.034 445.265 326.242 447.433 301.036C447.906 295.54 448.392 290.173 447.546 284.656C447.126 281.914 446.08 280.174 443.933 278.563C417.479 258.716 388.059 248.342 354.766 251.607C326.384 254.391 301.744 266.312 280.027 284.506C275.309 288.458 270.633 292.466 266.646 297.237C260.828 304.197 251.532 305.025 244.886 299.406C238.512 294.017 237.617 284.132 243.376 277.399C251.523 267.875 260.794 259.463 270.854 251.997C292.058 236.261 315.579 225.579 341.681 221.272C371.377 216.371 400.009 220.569 427.481 232.809C429.421 233.673 431.195 235.006 434.103 235.041C430.315 227.323 426.246 220.177 421.149 213.697C398.677 185.123 369.455 168.183 333.366 163.358C284.289 156.797 241.481 171.718 204.062 202.749C165.72 234.545 143.832 276.458 136.187 325.01C123.858 403.314 144.501 472.988 196.844 532.517C236.444 577.553 286.684 604.836 345.748 614.487C415.706 625.919 480.441 610.354 539.841 572.438C592.448 538.858 630.646 492.699 655.98 435.822C668.725 407.209 676.573 377.234 680.439 346.14C682.296 331.208 682.536 316.265 682.434 301.278C682.401 296.545 682.844 291.853 685.43 287.814C689.519 281.425 695.511 278.056 703.157 278.771C710.777 279.483 716.036 283.81 718.956 290.858C720.108 293.638 720.665 296.594 720.773 299.621C722.185 339.367 717.633 378.424 706.114 416.49C692.131 462.701 669.095 504.045 637.803 540.849C603.879 580.747 562.97 611.271 515.201 632.555C487.824 644.753 459.162 652.576 429.431 656.551C362.841 665.454 300.171 653.192 241.249 621.429C219.462 609.685 199.429 595.268 181.71 577.896C166.689 563.17 149.105 552.372 131.06 541.77C82.6121 513.308 47.3816 472.669 24.5105 421.386C6.22709 380.389 -2.08967 337.376 0.445659 292.563C3.45718 239.332 19.4238 190.06 47.8399 144.904C70.7803 108.449 100.13 78.0386 135.469 53.5226C173.272 27.297 215.032 10.6517 260.909 3.21674Z";

const DOT_PATHS = [
  // Dot 0
  "M560.536 306.474C563.439 293.724 572.937 287.91 583.658 291.951C590.79 294.639 595.846 303.149 594.531 310.254C592.933 318.887 586.09 325.041 577.755 325.342C569.861 325.627 562.771 319.891 561.098 311.794C560.765 310.184 560.674 308.523 560.536 306.474Z",
  // Dot 1
  "M562.244 345.634C573.6 344.521 582.387 351.727 582.774 362.067C583.122 371.401 574.516 379.712 564.776 379.447C556.827 379.23 549.557 372.35 548.439 363.986C547.349 355.838 553.013 348.117 562.244 345.634Z",
  // Dot 2
  "M582.056 197.259C581.337 207.735 573.998 214.781 564.71 214.328C555.836 213.895 548.213 206.058 548.289 197.447C548.374 187.853 555.722 180.146 565.037 179.882C574.371 179.617 581.484 186.722 582.056 197.259Z",
  // Dot 3
  "M491.054 112.55C485.395 103.94 485.312 97.1877 490.545 90.7089C495.039 85.1456 502.793 82.9879 509.478 85.4405C516.206 87.9083 520.631 93.9676 520.833 100.987C521.031 107.893 517.064 114.314 510.943 116.994C504.167 119.961 497.268 118.499 491.054 112.55Z",
  // Dot 4
  "M490.041 457.063C490.607 447.135 495.559 441.158 503.937 439.894C512.509 438.602 520.113 442.961 522.997 450.82C525.635 458.009 522.346 466.96 515.516 471.177C504.826 477.777 491.382 470.537 490.041 457.063Z",
  // Dot 5
  "M478.61 483.483C481.571 495.332 474.303 502.914 467.779 505.172C459.735 507.958 450.518 503.939 446.974 496.136C443.373 488.211 446.294 478.927 453.781 474.497C461.422 469.976 471.24 471.98 476.369 479.175C477.226 480.378 477.796 481.787 478.61 483.483Z",
  // Dot 6
  "M394.631 502.641C397.787 495.355 403.049 491.459 410.601 491.495C417.468 491.528 422.666 494.926 425.66 501.155C428.73 507.542 428.135 513.696 423.644 519.316C418.634 525.583 410.183 526.996 402.456 523.425C396.505 520.674 391.276 510.834 394.631 502.641Z",
  // Dot 7
  "M533.052 426.928C526.76 423.115 523.807 417.749 524.6 410.883C525.452 403.503 529.614 398.277 536.819 396.033C543.47 393.961 549.294 395.981 554.059 400.809C559.383 406.204 560.004 414.142 555.938 420.993C552.116 427.432 544.787 430.496 537.593 428.6C536.16 428.223 534.786 427.621 533.052 426.928Z",
  // Dot 8
  "M553.034 156.573C543.167 165.627 530.786 163.749 525.222 152.661C521.827 145.899 523.75 137.221 529.708 132.414C536.004 127.335 544.733 127.156 550.929 131.981C557.121 136.803 559.264 145.715 555.804 152.61C555.141 153.93 554.139 155.08 553.034 156.573Z",
  // Dot 9
  "M561.412 253.766C561.544 244.955 565.813 238.397 572.545 236.141C579.358 233.858 587.278 235.975 591.518 241.434C595.913 247.091 596.359 253.448 593.472 259.772C590.659 265.936 583.42 270.008 577.205 269.29C569.931 268.448 565.024 264.36 562.402 257.549C561.986 256.469 561.782 255.307 561.412 253.766Z",
  // Dot 10
  "M233.295 438.813C223.55 435.915 218.998 428.8 220.275 418.966C221.211 411.754 228.5 405.621 236.507 405.307C244.358 405 251.847 411.502 253.457 420.023C255.47 430.675 245.155 440.543 233.295 438.813Z",
  // Dot 11
  "M288.397 500.507C285.692 484.39 299.512 476.418 310.724 480.748C317.601 483.404 322.021 490.421 321.443 497.671C320.891 504.592 315.44 510.775 308.457 512.4C301.107 514.111 293.737 510.998 290.08 504.575C289.427 503.428 289.006 502.149 288.397 500.507Z",
  // Dot 12
  "M280.556 463.571C280.713 473.721 273.834 481.57 264.606 482.27C257.143 482.837 248.958 476.174 247.423 468.283C245.814 460.012 251.287 451.697 259.914 449.305C269.122 446.752 277.511 452.406 280.556 463.571Z",
  // Dot 13
  "M354.801 528.288C343.486 525.497 338.674 519.014 340.102 508.999C341.254 500.922 347.753 495.06 355.773 494.863C363.884 494.663 371.455 500.951 372.754 508.963C374.105 517.295 369.618 524.778 361.585 527.283C359.551 527.917 357.344 527.998 354.801 528.288Z",
  // Dot 14
  "M228.34 341.652C220.965 338.464 217.342 333.055 217.692 325.474C218.062 317.467 222.466 311.885 229.536 309.981C236.516 308.101 242.456 310.36 246.839 315.824C251.087 321.119 252.088 327.168 248.808 333.493C245.5 339.874 240.262 343.023 233.065 342.699C231.599 342.634 230.154 342.11 228.34 341.652Z",
  // Dot 15
  "M222.148 358.106C236.648 355.616 245.697 370.026 240.918 380.977C237.925 387.833 230.885 391.968 223.664 390.954C216.31 389.922 210.394 384.154 209.346 376.995C208.16 368.888 211.629 362.435 218.928 359.22C219.837 358.82 220.799 358.538 222.148 358.106Z",
];

/** Clockwise traversal order (0°=North, CW) */
const CLOCKWISE_ORDER = [3, 8, 2, 9, 0, 1, 7, 4, 5, 6, 13, 11, 12, 10, 15, 14];

/** Distance from SVG center (361, 330): nearest → farthest */
const DISTANCE_ORDER = [14, 15, 10, 12, 11, 13, 6, 5, 4, 7, 1, 0, 9, 2, 8, 3];

export type LogoSpinnerVariant =
  | "dotChase"
  | "strokeDraw"
  | "strokeLoop"
  | "strokeTrace"
  | "strokeFill"
  | "pulseWave"
  | "combined";

interface LogoSpinnerProps {
  variant?: LogoSpinnerVariant;
  size?: number;
  className?: string;
}

function DotChase({ size }: { size: number }) {
  const totalDots = DOT_PATHS.length;
  const cycleDuration = 1.6;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 722 660"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={MAIN_PATH} fill="currentColor" opacity={0.12} />
      {CLOCKWISE_ORDER.map((dotIndex, clockPos) => (
        <motion.path
          key={dotIndex}
          d={DOT_PATHS[dotIndex]}
          fill="currentColor"
          animate={{ opacity: [0.08, 1, 0.08] }}
          transition={{
            duration: cycleDuration,
            delay: (clockPos / totalDots) * cycleDuration,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      ))}
    </svg>
  );
}

function StrokeDraw({ size }: { size: number }) {
  const drawDuration = 2.4;
  const fadeInDuration = 0.6;
  const dotStagger = 0.04;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 722 660"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <motion.path
        d={MAIN_PATH}
        stroke="currentColor"
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0.8 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          pathLength: {
            duration: drawDuration,
            ease: "easeInOut",
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
            repeatDelay: 1.2,
          },
          opacity: { duration: 0.3 },
        }}
      />

      <motion.path
        d={MAIN_PATH}
        fill="currentColor"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0.15, 0.15, 0] }}
        transition={{
          duration: drawDuration + fadeInDuration + 1.2,
          times: [0, 0.55, 0.7, 0.85, 1],
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />

      {CLOCKWISE_ORDER.map((dotIndex, clockPos) => (
        <motion.path
          key={dotIndex}
          d={DOT_PATHS[dotIndex]}
          fill="currentColor"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: [0, 0, 1, 1, 0],
            scale: [0.5, 0.5, 1, 1, 0.5],
          }}
          transition={{
            duration: drawDuration + fadeInDuration + 1.2,
            times: [0, 0.5, 0.6, 0.85, 1],
            delay: clockPos * dotStagger,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      ))}
    </svg>
  );
}

function PulseWave({ size }: { size: number }) {
  const totalDots = DOT_PATHS.length;
  const cycleDuration = 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 722 660"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <motion.path
        d={MAIN_PATH}
        fill="currentColor"
        animate={{ opacity: [0.06, 0.14, 0.06] }}
        transition={{
          duration: cycleDuration,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />

      {DISTANCE_ORDER.map((dotIndex, distPos) => (
        <motion.path
          key={dotIndex}
          d={DOT_PATHS[dotIndex]}
          fill="currentColor"
          animate={{
            opacity: [0.08, 1, 0.08],
            scale: [0.85, 1.1, 0.85],
          }}
          transition={{
            duration: cycleDuration,
            delay: (distPos / totalDots) * cycleDuration,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "center", transformBox: "fill-box" }}
        />
      ))}
    </svg>
  );
}

function Combined({ size }: { size: number }) {
  const totalDots = DOT_PATHS.length;
  const chaseDuration = 1.6;
  const rotationDuration = 10;

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{
        duration: rotationDuration,
        repeat: Number.POSITIVE_INFINITY,
        ease: "linear",
      }}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 722 660"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={MAIN_PATH} fill="currentColor" opacity={0.1} />
        {CLOCKWISE_ORDER.map((dotIndex, clockPos) => (
          <motion.path
            key={dotIndex}
            d={DOT_PATHS[dotIndex]}
            fill="currentColor"
            animate={{ opacity: [0.06, 0.9, 0.06] }}
            transition={{
              duration: chaseDuration,
              delay: (clockPos / totalDots) * chaseDuration,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>
    </motion.div>
  );
}

function StrokeLoop({ size }: { size: number }) {
  // stroke draw (2s) → fill in (0.8s) → hold (0.6s) → fill out (0.8s) → stroke erase (2s) → pause (0.4s)
  const total = 6.6;
  const t = (s: number) => s / total;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 722 660"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <motion.path
        d={MAIN_PATH}
        stroke="currentColor"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{
          pathLength: [0, 1, 1, 1, 1, 0, 0],
        }}
        transition={{
          duration: total,
          times: [0, t(2), t(2.8), t(3.4), t(4.2), t(6.2), 1],
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <motion.path
        d={MAIN_PATH}
        fill="currentColor"
        animate={{
          opacity: [0, 0, 1, 1, 0, 0, 0],
        }}
        transition={{
          duration: total,
          times: [0, t(2), t(2.8), t(3.4), t(4.2), t(4.2), 1],
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      {CLOCKWISE_ORDER.map((dotIndex, clockPos) => (
        <motion.path
          key={dotIndex}
          d={DOT_PATHS[dotIndex]}
          fill="currentColor"
          animate={{
            opacity: [0, 0, 1, 1, 0, 0],
            scale: [0.4, 0.4, 1, 1, 0.4, 0.4],
          }}
          transition={{
            duration: total,
            times: [0, t(2), t(2.8), t(3.4), t(4.2), 1],
            delay: clockPos * 0.03,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "center", transformBox: "fill-box" }}
        />
      ))}
    </svg>
  );
}

function StrokeTrace({ size }: { size: number }) {
  const traceDuration = 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 722 660"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={MAIN_PATH}
        stroke="currentColor"
        strokeWidth={2.5}
        fill="none"
        opacity={0.1}
      />
      <path d={MAIN_PATH} fill="currentColor" opacity={0.05} />
      <motion.path
        d={MAIN_PATH}
        stroke="currentColor"
        strokeWidth={3.5}
        fill="none"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray="0.12 0.88"
        animate={{ strokeDashoffset: [0, -1] }}
        transition={{
          duration: traceDuration,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
      />
      {DOT_PATHS.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          fill="currentColor"
          animate={{ opacity: [0.1, 0.45, 0.1] }}
          transition={{
            duration: 1.2,
            delay: (i / DOT_PATHS.length) * 1.2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      ))}
    </svg>
  );
}

function StrokeFill({ size }: { size: number }) {
  const maskId = "logo-stroke-fill-mask";
  const drawDuration = 2.5;
  const holdDuration = 0.6;
  const totalDuration = drawDuration * 2 + holdDuration * 2;

  const times: [number, number, number, number, number] = [
    0,
    drawDuration / totalDuration,
    (drawDuration + holdDuration) / totalDuration,
    (drawDuration * 2 + holdDuration) / totalDuration,
    1,
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 722 660"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <mask id={maskId}>
          <rect width="722" height="660" fill="black" />
          <motion.path
            d={MAIN_PATH}
            stroke="white"
            strokeWidth={120}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{ pathLength: [0, 1, 1, 0, 0] }}
            transition={{
              duration: totalDuration,
              times,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        </mask>
      </defs>
      <g mask={`url(#${maskId})`}>
        <path d={MAIN_PATH} fill="currentColor" />
        {DOT_PATHS.map((d, i) => (
          <path key={i} d={d} fill="currentColor" />
        ))}
      </g>
    </svg>
  );
}

const VARIANT_MAP: Record<
  LogoSpinnerVariant,
  React.ComponentType<{ size: number }>
> = {
  dotChase: DotChase,
  strokeDraw: StrokeDraw,
  strokeLoop: StrokeLoop,
  strokeTrace: StrokeTrace,
  strokeFill: StrokeFill,
  pulseWave: PulseWave,
  combined: Combined,
};

export function LogoSpinner({
  variant = "dotChase",
  size = 48,
  className,
}: LogoSpinnerProps) {
  const Variant = VARIANT_MAP[variant];

  return (
    <div
      className={cn("text-foreground", className)}
      role="status"
      aria-label="Loading"
    >
      <Variant size={size} />
    </div>
  );
}
