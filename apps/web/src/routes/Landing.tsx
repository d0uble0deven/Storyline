import { Link } from "react-router-dom";
import { Logo } from "../components/organisms/AppShell.js";
import { Button } from "../components/atoms/Button.js";
import { IconCheck, IconFilm, IconPlay, IconShield, IconUpload } from "../components/icons.js";
import styles from "./Landing.module.css";

const SCENES = [
  { sky: "#cfe3ee", ground: "#b9b6ae", sun: "#f7e8b8" },
  { sky: "#f2cf9d", ground: "#c2b294", sun: "#f4c977" },
  { sky: "#c8cdd1", ground: "#8d9a76" },
  { sky: "#d9a08c", ground: "#7d6f77", sun: "#f1a45f" },
  { sky: "#9aa4ad", ground: "#8e948f" },
  { sky: "#cfe3ee", ground: "#a9c29a", sun: "#f7e8b8" },
];

function MiniScene({ scene, playing }: { scene: (typeof SCENES)[number]; playing?: boolean }) {
  return (
    <svg viewBox="0 0 160 90" className={styles.miniScene} aria-hidden="true">
      <rect width="160" height="58" fill={scene.sky} />
      {scene.sun && <circle cx="118" cy="20" r="10" fill={scene.sun} />}
      <rect y="58" width="160" height="32" fill={scene.ground} />
      <path d="M66 90 L74 58 L86 58 L100 90 Z" fill="#00000022" />
      {playing && <path d="M70 33 l22 12 -22 12z" fill="#ffffffd9" />}
    </svg>
  );
}

const STEPS = [
  { icon: <IconUpload size={20} />, title: "Add your videos", text: "Upload from your phone, camera, or cloud. Storyline organizes everything by time and place." },
  { icon: <IconFilm size={20} />, title: "Describe your story", text: "One creative brief in your own words — what happened, what matters, how it should feel." },
  { icon: <IconCheck size={20} />, title: "Approve the highlights", text: "Storyline finds the moments that matter and explains why. You stay in control of every clip." },
  { icon: <IconPlay size={20} />, title: "Create your film", text: "A first cut appears in minutes. Refine it by asking in plain language, then export and share." },
];

const USE_CASES = [
  ["Personal progress", "Learning to ride, run, lift, or play — a year of practice in four minutes."],
  ["Travel", "Three weeks of clips become the trip you actually remember."],
  ["Family memories", "The everyday moments that quietly become the big ones."],
  ["Sports", "A season of games, cut to the plays worth reliving."],
  ["Weddings", "Every phone at the party, one beautiful film."],
  ["Pets", "From tiny chaos to certified good boy."],
  ["Year-in-review", "Twelve months, one story worth keeping."],
  ["Creative projects", "Document the making of anything you build."],
] as const;

export function Landing() {
  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <Logo />
        <div className={styles.navActions}>
          <Link to="/projects" className={styles.navLink}>
            Open Storyline
          </Link>
        </div>
      </header>

      <main>
        <section className={styles.hero}>
          <h1 className={styles.headline}>Your videos already contain a story.</h1>
          <p className={styles.sub}>
            Storyline finds the moments that matter, helps you shape the narrative, and creates a finished
            video — without complicated editing tools.
          </p>
          <div className={styles.ctas}>
            <Link to="/projects/new">
              <Button variant="primary" size="lg">Start a Story</Button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg">See How It Works</Button>
            </a>
          </div>

          <div className={styles.preview} role="img" aria-label="Preview of the Storyline app: uploaded clips, selected highlights, and a first-cut player">
            <div className={styles.previewChrome}>
              <span /><span /><span />
            </div>
            <div className={styles.previewBody}>
              <div className={styles.previewLeft}>
                <p className={styles.previewLabel}>Your moments</p>
                <div className={styles.previewGrid}>
                  {SCENES.map((s, i) => (
                    <div key={i} className={styles.previewThumb}>
                      <MiniScene scene={s} />
                      {(i === 1 || i === 3 || i === 5) && (
                        <span className={styles.previewCheck}>
                          <IconCheck size={10} />
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <p className={styles.previewLabel}>Your story</p>
                <div className={styles.previewSequence}>
                  {["Starting out", "Finding balance", "Going further", "Confidence"].map((c) => (
                    <span key={c} className={styles.previewChip}>{c}</span>
                  ))}
                </div>
              </div>
              <div className={styles.previewPlayer}>
                <MiniScene scene={SCENES[3]} playing />
                <div className={styles.previewBar}>
                  <span className={styles.previewProgress} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section} id="how-it-works">
          <h2 className={styles.sectionTitle}>How it works</h2>
          <div className={styles.steps}>
            {STEPS.map((step, i) => (
              <div key={step.title} className={styles.step}>
                <div className={styles.stepIcon}>{step.icon}</div>
                <p className={styles.stepNumber}>Step {i + 1}</p>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepText}>{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Made for the stories you're already living</h2>
          <div className={styles.cases}>
            {USE_CASES.map(([title, text]) => (
              <div key={title} className={styles.caseCard}>
                <h3 className={styles.caseTitle}>{title}</h3>
                <p className={styles.caseText}>{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.finalCta}>
          <h2 className={styles.finalHeadline}>The moments are already there. Storyline helps you find them.</h2>
          <Link to="/projects/new">
            <Button variant="primary" size="lg">Start a Story</Button>
          </Link>
        </section>
      </main>

      <footer className={styles.footer}>
        <Logo />
        <p className={styles.footerPrivacy}>
          <IconShield size={14} /> Your videos remain private and are only used to create your Storyline project.
        </p>
      </footer>
    </div>
  );
}
