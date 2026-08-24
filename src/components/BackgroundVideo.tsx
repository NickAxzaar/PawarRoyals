export default function BackgroundVideo() {
  return (
    <div className="background-video-layer" aria-hidden="true">
      <video
        className="background-video"
        src="/homepagebackground.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />

      <video
        className="background-video background-video-glass"
        src="/homepagebackground.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
    </div>
  );
}