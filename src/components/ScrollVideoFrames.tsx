import { useEffect, useRef } from "react";

const FRAME_COUNT = 596;

const DESKTOP_FRAME_WIDTH = 1920;
const DESKTOP_FRAME_HEIGHT = 1080;

const MOBILE_FRAME_WIDTH = 960;
const MOBILE_FRAME_HEIGHT = 540;

const MOBILE_BREAKPOINT = 768;

const DESKTOP_FRAME_PATH = (frame: number) =>
  `/runtime/desktop/frame-${String(frame + 1).padStart(4, "0")}.webp`;

const MOBILE_FRAME_PATH = (frame: number) =>
  `/runtime/mobile/frame-${String(frame + 1).padStart(4, "0")}.webp`;

type LoadedFrame = {
  image: HTMLImageElement;
  decoded: boolean;
};

export default function ScrollVideoFrames() {
  const sectionRef = useRef<HTMLElement | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const framesRef = useRef<(LoadedFrame | null)[]>(
    new Array(FRAME_COUNT).fill(null),
  );

  const loadingRef = useRef<boolean[]>(new Array(FRAME_COUNT).fill(false));

  const targetFrameRef = useRef(0);

  const currentFrameRef = useRef(0);

  const animationFrameRef = useRef<number | null>(null);

  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const section = sectionRef.current;

    const canvas = canvasRef.current;

    if (!section || !canvas) {
      return;
    }

    const context = canvas.getContext("2d", {
      alpha: false,
      desynchronized: true,
    });

    if (!context) {
      return;
    }

    let destroyed = false;

    let viewportWidth = window.innerWidth;

    let viewportHeight = window.innerHeight;

    const getIsMobile = () => viewportWidth <= MOBILE_BREAKPOINT;

    const getFramePath = (frame: number) =>
      getIsMobile() ? MOBILE_FRAME_PATH(frame) : DESKTOP_FRAME_PATH(frame);

    const resizeCanvas = () => {
      viewportWidth = window.innerWidth;

      viewportHeight = window.innerHeight;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(viewportWidth * dpr);

      canvas.height = Math.round(viewportHeight * dpr);

      canvas.style.width = `${viewportWidth}px`;
      canvas.style.height = `${viewportHeight}px`;

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

      drawFrame(currentFrameRef.current);

      context.imageSmoothingEnabled = true;

      context.imageSmoothingQuality = "high";

      drawFrame(currentFrameRef.current);
    };

    const drawFrame = (frame: number) => {
      if (destroyed) {
        return;
      }

      const loaded = framesRef.current[frame];

      if (!loaded || !loaded.decoded) {
        return;
      }

      const sourceWidth = getIsMobile()
        ? MOBILE_FRAME_WIDTH
        : DESKTOP_FRAME_WIDTH;

      const sourceHeight = getIsMobile()
        ? MOBILE_FRAME_HEIGHT
        : DESKTOP_FRAME_HEIGHT;

      const canvasWidth = canvas.width;

      const canvasHeight = canvas.height;

      /*
       * Cover the entire viewport while
       * preserving the source 16:9 ratio.
       */
      const scale = Math.max(
        canvasWidth / sourceWidth,

        canvasHeight / sourceHeight,
      );

      const width = sourceWidth * scale;

      const height = sourceHeight * scale;

      const x = (canvasWidth - width) / 2;

      const y = (canvasHeight - height) / 2;

      context.fillStyle = "#000";

      context.fillRect(0, 0, canvasWidth, canvasHeight);

      context.drawImage(loaded.image, x, y, width, height);

      currentFrameRef.current = frame;
    };

    /*
     * Load ONE frame.
     *
     * The first frame is deliberately handled
     * separately so the page never waits for
     * a giant batch before displaying anything.
     */
    const loadFrame = (frame: number) => {
      if (destroyed || frame < 0 || frame >= FRAME_COUNT) {
        return;
      }

      if (framesRef.current[frame] || loadingRef.current[frame]) {
        return;
      }

      loadingRef.current[frame] = true;

      const image = new Image();

      image.decoding = "async";

      image.onload = async () => {
        if (destroyed) {
          return;
        }

        try {
          await image.decode();
        } catch {
          /*
           * Browser may already have
           * decoded the image.
           */
        }

        if (destroyed) {
          return;
        }

        framesRef.current[frame] = {
          image,
          decoded: true,
        };

        loadingRef.current[frame] = false;

        if (frame === targetFrameRef.current) {
          drawFrame(frame);
        }
      };

      image.onerror = () => {
        loadingRef.current[frame] = false;

        console.error(
          `Failed to load frame ${frame + 1}: ${getFramePath(frame)}`,
        );
      };

      image.src = getFramePath(frame);
    };

    /*
     * Limited background preloading.
     *
     * We intentionally DO NOT launch hundreds
     * of simultaneous requests.
     */
    const preloadRadius = (center: number) => {
      const radius = getIsMobile() ? 18 : 28;

      const start = Math.max(0, center - radius);

      const end = Math.min(FRAME_COUNT - 1, center + radius);

      /*
       * Prioritize the direction of travel.
       */
      const current = currentFrameRef.current;

      const direction = center >= current ? 1 : -1;

      for (let distance = 0; distance <= radius; distance++) {
        const forward = center + distance * direction;

        const backward = center - distance * direction;

        if (forward >= start && forward <= end) {
          loadFrame(forward);
        }

        if (backward >= start && backward <= end) {
          loadFrame(backward);
        }
      }
    };

    /*
     * Initial load:
     *
     * Frame 0 gets priority.
     * Then the nearby frames are loaded.
     */
    const startInitialLoading = () => {
      loadFrame(0);

      window.setTimeout(() => {
        if (destroyed) {
          return;
        }

        for (let i = 1; i <= 4; i++) {
          loadFrame(i);
        }
      }, 350);
    };

    const calculateTargetFrame = () => {
      const rect = section.getBoundingClientRect();

      const scrollDistance = section.offsetHeight - window.innerHeight;

      if (scrollDistance <= 0) {
        return 0;
      }

      const progress = Math.min(1, Math.max(0, -rect.top / scrollDistance));

      return Math.min(
        FRAME_COUNT - 1,
        Math.max(0, Math.round(progress * (FRAME_COUNT - 1))),
      );
    };

    const updateTargetFrame = () => {
      if (destroyed) {
        return;
      }

      const target = calculateTargetFrame();

      targetFrameRef.current = target;

      preloadRadius(target);
    };

    let scrollScheduled = false;

    const onScroll = () => {
      if (scrollScheduled) {
        return;
      }

      scrollScheduled = true;

      requestAnimationFrame(() => {
        scrollScheduled = false;

        updateTargetFrame();
      });
    };

    /*
     * Rendering is independent from
     * the scroll event.
     *
     * This is critical for smoothness.
     */
    const render = () => {
      if (destroyed) {
        return;
      }

      const target = targetFrameRef.current;

      const current = currentFrameRef.current;

      if (target !== current) {
        const targetFrame = framesRef.current[target];

        /*
         * Best case:
         * target is already decoded.
         */
        if (targetFrame && targetFrame.decoded) {
          drawFrame(target);
        } else {
          /*
           * Find the closest decoded frame.
           *
           * This keeps the screen alive instead
           * of turning black while the requested
           * frame is downloading.
           */
          const direction = target > current ? 1 : -1;

          let candidate = current + direction;

          for (let i = 0; i < 24; i++) {
            if (candidate >= 0 && candidate < FRAME_COUNT) {
              const candidateFrame = framesRef.current[candidate];

              if (candidateFrame && candidateFrame.decoded) {
                drawFrame(candidate);

                break;
              }
            }

            candidate += direction;
          }

          /*
           * Always make sure the actual
           * target is being requested.
           */
          loadFrame(target);
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    /*
     * Clear decoded frames when switching
     * between desktop/mobile resolution.
     */
    const clearFrameCache = () => {
      framesRef.current.forEach((frame) => {
        if (frame) {
          frame.image.src = "";
        }
      });

      framesRef.current = new Array(FRAME_COUNT).fill(null);

      loadingRef.current = new Array(FRAME_COUNT).fill(false);
    };

    const onResize = () => {
      const oldMobile = viewportWidth <= MOBILE_BREAKPOINT;

      const newMobile = window.innerWidth <= MOBILE_BREAKPOINT;

      if (oldMobile !== newMobile) {
        clearFrameCache();

        targetFrameRef.current = currentFrameRef.current;

        resizeCanvas();

        loadFrame(currentFrameRef.current);

        preloadRadius(currentFrameRef.current);

        return;
      }

      resizeCanvas();
    };

    window.addEventListener("scroll", onScroll, {
      passive: true,
    });

    window.addEventListener("resize", onResize);

    /*
     * Observe the actual viewport/container
     * for responsive layout changes.
     */
    resizeObserverRef.current = new ResizeObserver(resizeCanvas);

    resizeObserverRef.current.observe(document.documentElement);

    resizeCanvas();

    startInitialLoading();

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      destroyed = true;

      window.removeEventListener("scroll", onScroll);

      window.removeEventListener("resize", onResize);

      resizeObserverRef.current?.disconnect();

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      framesRef.current.forEach((frame) => {
        if (frame) {
          frame.image.src = "";
        }
      });
    };
  }, []);

  return (
    <section ref={sectionRef} className="scroll-video-section">
      <div className="scroll-video-sticky" aria-hidden="true">
        <canvas ref={canvasRef} className="scroll-video-canvas" />
      </div>
    </section>
  );
}
