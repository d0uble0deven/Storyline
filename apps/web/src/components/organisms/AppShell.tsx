import { useState } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import { useProjects } from "../../api/hooks.js";
import { Avatar } from "../atoms/Avatar.js";
import { Modal } from "../molecules/Modal.js";
import { IconFilm, IconFolder, IconPlus, IconSettings, IconShield } from "../icons.js";
import styles from "./AppShell.module.css";

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <span className={styles.logo}>
      <span className={styles.logoMark} aria-hidden="true">
        <IconFilm size={15} />
      </span>
      {!compact && <span className={styles.logoText}>Storyline</span>}
    </span>
  );
}

export function AppShell() {
  const { data: projects } = useProjects();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const recent = (projects ?? []).slice(0, 3);

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Main navigation">
        <Link to="/" className={styles.logoLink} aria-label="Storyline home">
          <Logo />
        </Link>
        <nav className={styles.nav}>
          <NavLink to="/projects" end className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navActive : ""}`}>
            <IconFolder size={16} /> <span>Projects</span>
          </NavLink>
          <NavLink to="/projects/new" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navActive : ""}`}>
            <IconPlus size={16} /> <span>Start a story</span>
          </NavLink>
        </nav>
        {recent.length > 0 && (
          <div className={styles.recent}>
            <p className={styles.recentTitle}>Recent</p>
            {recent.map((p) => (
              <NavLink
                key={p.id}
                to={`/projects/${p.id}`}
                className={({ isActive }) => `${styles.recentItem} ${isActive ? styles.navActive : ""}`}
              >
                {p.name}
              </NavLink>
            ))}
          </div>
        )}
        <div className={styles.sidebarFooter}>
          <button type="button" className={styles.navItem} onClick={() => setSettingsOpen(true)}>
            <IconSettings size={16} /> <span>Settings</span>
          </button>
          <div className={styles.user}>
            <Avatar name="You" />
            <div>
              <p className={styles.userName}>Your studio</p>
              <p className={styles.userHint}>Private by default</p>
            </div>
          </div>
        </div>
      </aside>
      <div className={styles.content}>
        <Outlet />
      </div>

      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Settings" width={480}>
        <div className={styles.settings}>
          <p className={styles.settingsPrivacy}>
            <IconShield size={16} />
            Your videos remain private and are only used to create your Storyline project.
          </p>
          <ul className={styles.settingsList}>
            <li>Projects are private by default — sharing is always an explicit choice.</li>
            <li>Delete source files after export <em>(coming soon)</em></li>
            <li>Share-link expiration <em>(coming soon)</em></li>
            <li>Revoke connected service access <em>(coming soon)</em></li>
            <li>Delete a project permanently from its dashboard card.</li>
          </ul>
          <p className={styles.settingsHint}>
            Accounts, billing, and connected services arrive with a future release. Everything in this preview is stored
            locally on your machine.
          </p>
        </div>
      </Modal>
    </div>
  );
}
