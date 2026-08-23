import { useEffect, useRef } from "react";
import "./LiquidGlassCard.css";

type Project = {
  number: string;
  category: string;
  title: string;
  description: string;
};

const projects: Project[] = [
  {
    number: "01",
    category: "BUSINESS",
    title: "The Royal Event",
    description:
      "premium event planner turning your corporate, birthday, and dream wedding visions into royal realities.",
  },
  {
    number: "02",
    category: "BUSINESS",
    title: "Royal Bakery",
    description:
      "Baking your imagination into premium custom cakes for birthdays, anniversaries, and every royal celebration.",
  },
];

export default function LiquidGlassCard() {
  const glassRef = useRef<HTMLDivElement>(null);
  const displacementRef = useRef<SVGFEImageElement>(null);

  useEffect(() => {
    const glass = glassRef.current;
    const map = displacementRef.current;

    if (!glass || !map) return;

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const image = ctx.createImageData(512, 512);
    const data = image.data;

    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 512; x++) {
        const nx = (x / 511) * 2 - 1;
        const ny = (y / 511) * 2 - 1;

        const edge = Math.max(Math.abs(nx), Math.abs(ny));

        const strength = Math.pow(
          Math.min(1, Math.max(0, (edge - 0.62) / 0.38)),
          2,
        );

        const dx = -nx * strength;
        const dy = -ny * strength;

        const i = (y * 512 + x) * 4;

        data[i] = 128 + dx * 70;
        data[i + 1] = 128 + dy * 70;
        data[i + 2] = 128;
        data[i + 3] = 255;
      }
    }

    ctx.putImageData(image, 0, 0);

    map.setAttribute("href", canvas.toDataURL("image/png"));
  }, []);
  return (
    <section className="liquid-glass-layer">
      <div ref={glassRef} className="liquid-glass-card">
        <div className="glass-card-glow glass-card-glow-one" />
        <div className="glass-card-glow glass-card-glow-two" />

        <div className="glass-card-inner">
          <a
            className="portfolio-link"
            href="https://www.instagram.com/ig_anuj_pwr?igsi=MTlpMHdreWdmeXRhNQ=="
            aria-label="Visit Pawar Royals Instagram"
          ></a>

          <header className="portfolio-header">
            <div className="portfolio-eyebrow">
              <span className="eyebrow-dot" />
              PORTFOLIO
            </div>

            <h1>
              Pawar
              <span>Royals</span>
            </h1>

            <p className="portfolio-intro">Pawar Brotherhood Empires</p>

            <div className="portfolio-logo" aria-hidden="true">
              <img
                src="/anujpawar.png"
                alt=""
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </div>
          </header>

          <div className="portfolio-divider" />

          <div className="projects-grid">
            {projects.map((project) => (
              <article className="project-card" key={project.number}>
                <a
                  className="project-card-link"
                  href={
                    project.number === "01"
                      ? "https://www.instagram.com/the_royalevents01?igsi=eXUzbWRncmJrOGF3"
                      : "https://www.instagram.com/royal_bakery_.04?igsi=NGxmeGpsOGF2M2gy"
                  }
                  aria-label={`Visit ${project.title}`}
                ></a>

                <div className="project-top">
                  <span className="project-number">{project.number}</span>

                  <span className="project-category">{project.category}</span>
                </div>

                <div className="project-content">
                  <h2>{project.title}</h2>

                  <p>{project.description}</p>
                </div>

                <button type="button" className="project-button">
                  <span>CLICK EXPLORE MORE...</span>
                </button>

                <div className="project-logo" aria-hidden="true">
                  <img
                    src={
                      project.number === "01" ? "/pawartre.png" : "/pawarrb.png"
                    }
                    alt=""
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                  />
                </div>
              </article>
            ))}
          </div>

          <footer className="portfolio-footer">
            <span>Ahirwars Studios</span>

            <a
              className="portfolio-button"
              href="https://www.instagram.com/anujvlogchapter?igsi=MWJ1b3A0MjIxNzgzcQ=="
              aria-label="View Full Portfolio"
            >
              VIEW FULL PORTFOLIO
              <span>→</span>
            </a>
          </footer>
        </div>
      </div>
    </section>
  );
}
