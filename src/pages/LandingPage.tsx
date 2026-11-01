import React, { useEffect, useState } from "react";
import { IonContent, IonIcon, IonPage } from "@ionic/react";
import {
  arrowForward,
  checkmarkCircle,
  cloudOfflineOutline,
  cloudUploadOutline,
  cubeOutline,
  documentTextOutline,
  downloadOutline,
  logoGithub,
  moonOutline,
  phonePortraitOutline,
  shieldCheckmarkOutline,
  sparklesOutline,
  sunnyOutline,
  createOutline,
  cashOutline,
  keyOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { cloudService } from "../services/cloud-service";
import {
  formatToken,
  getNetworkStatus,
  getPlans,
  getTokenInfo,
} from "../services/chain";
import "./LandingPage.css";

const GITHUB_URL = "https://github.com/anisharma07/cairo-invoice-frontend";

interface LiveStats {
  block?: number;
  symbol?: string;
  supply?: string;
  plans?: number;
  cheapest?: string;
}

const LandingPage: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const history = useHistory();
  const [stats, setStats] = useState<LiveStats>({});

  useEffect(() => {
    if (cloudService.isAuthenticated()) {
      history.replace("/app/editor");
    }
  }, [history]);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([getNetworkStatus(), getTokenInfo(), getPlans()]).then(
      ([n, t, p]) => {
        if (cancelled) return;
        const next: LiveStats = {};
        if (n.status === "fulfilled") next.block = n.value.blockNumber;
        if (t.status === "fulfilled") {
          next.symbol = t.value.symbol;
          next.supply = formatToken(t.value.totalSupply, t.value.decimals, 0);
        }
        if (p.status === "fulfilled" && p.value.length) {
          next.plans = p.value.length;
          const cheapest = [...p.value].sort((a, b) =>
            a.cost < b.cost ? -1 : 1
          )[0];
          next.cheapest = formatToken(cheapest.cost);
        }
        setStats(next);
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const go = (path: string) => history.push(path);

  const features = [
    {
      icon: cloudOfflineOutline,
      title: "Offline-first",
      body: "Installable PWA with autosave to device storage. Create and edit invoices with no connection; nothing is lost when you go offline.",
    },
    {
      icon: documentTextOutline,
      title: "Spreadsheet-grade editor",
      body: "Ready-made invoice templates on a full spreadsheet engine: formulas, totals, cell styling, logos and signatures.",
    },
    {
      icon: downloadOutline,
      title: "PDF & CSV export",
      body: "Export single invoices or whole workbooks to PDF, CSV, print or share them, on web, Android and iOS.",
    },
    {
      icon: cloudUploadOutline,
      title: "IPFS storage",
      body: "Invoices are pinned to IPFS. The content identifier (CID) is a fingerprint: change one byte and it no longer matches.",
    },
    {
      icon: shieldCheckmarkOutline,
      title: "Anchored on Starknet",
      body: "A Cairo contract records each invoice's name, CID, owner and timestamp. Anyone can verify it, no account needed.",
    },
    {
      icon: cubeOutline,
      title: "Token-metered storage",
      body: "On-chain storage plans paid in an ERC-20 token, with quotas enforced by the contract, not by our server.",
    },
  ];

  const roadmap = [
    {
      icon: sparklesOutline,
      title: "AI invoice agent",
      body: "Draft invoices from a prompt or a photo of a receipt, and flag anomalies before they are anchored.",
    },
    {
      icon: cashOutline,
      title: "Stablecoin settlement",
      body: "A 'Pay this invoice' link that settles in USDC on Starknet and marks the on-chain record as paid.",
    },
    {
      icon: keyOutline,
      title: "Gasless & session keys",
      body: "Account-abstraction paymaster and session keys so small businesses never handle gas or seed phrases.",
    },
  ];

  return (
    <IonPage className={`lp ${isDarkMode ? "lp-dark" : ""}`}>
      <IonContent className="lp-content">
        <header className="lp-nav">
          <div className="lp-container lp-nav-inner">
            <button className="lp-brand" onClick={() => go("/")}>
              <span className="lp-logo" aria-hidden>
                <IonIcon icon={shieldCheckmarkOutline} />
              </span>
              Cairo Invoice
            </button>
            <nav className="lp-links">
              <button onClick={() => go("/explorer")}>Verify</button>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer">
                <IonIcon icon={logoGithub} /> GitHub
              </a>
              <button
                className="lp-icon-btn"
                onClick={toggleDarkMode}
                aria-label="Toggle dark mode"
              >
                <IonIcon icon={isDarkMode ? sunnyOutline : moonOutline} />
              </button>
              <button className="lp-btn lp-btn-sm" onClick={() => go("/app/editor")}>
                Open app
              </button>
            </nav>
          </div>
        </header>

        <section className="lp-hero">
          <div className="lp-container lp-hero-grid">
            <div className="lp-hero-copy">
              <span className="lp-eyebrow">
                <span className="lp-dot" /> Live on Starknet Sepolia
              </span>
              <h1>
                Invoices you can <em>prove</em>.
              </h1>
              <p className="lp-lead">
                Cairo Invoice is an offline-first billing app that anchors every
                invoice on Starknet. Create invoices anywhere, pin them to IPFS,
                and let your clients, auditors or a government office verify
                that the record is untouched.
              </p>
              <div className="lp-ctas">
                <button className="lp-btn" onClick={() => go("/app/editor")}>
                  Create an invoice <IonIcon icon={arrowForward} />
                </button>
                <button
                  className="lp-btn lp-btn-ghost"
                  onClick={() => go("/explorer")}
                >
                  <IonIcon icon={shieldCheckmarkOutline} /> Verify on-chain
                </button>
              </div>
              <p className="lp-fine">
                Free and open source (MIT) · Works offline · Web, Android & iOS
              </p>
            </div>

            <div className="lp-hero-art" aria-hidden>
              <div className="lp-invoice">
                <div className="lp-inv-head">
                  <span>INVOICE</span>
                  <span className="lp-inv-no">#2026-0142</span>
                </div>
                <div className="lp-inv-row">
                  <span>Website maintenance</span>
                  <span>₹18,000</span>
                </div>
                <div className="lp-inv-row">
                  <span>Hosting (12 months)</span>
                  <span>₹6,500</span>
                </div>
                <div className="lp-inv-row">
                  <span>GST 18%</span>
                  <span>₹4,410</span>
                </div>
                <div className="lp-inv-total">
                  <span>Total</span>
                  <span>₹28,910</span>
                </div>
                <div className="lp-stamp">
                  <IonIcon icon={checkmarkCircle} />
                  <div>
                    <strong>Anchored on Starknet</strong>
                    <span>CID Qm…Pv · block {stats.block ? stats.block.toLocaleString() : "…"}</span>
                  </div>
                </div>
              </div>
              <div className="lp-chip lp-chip-a">
                <IonIcon icon={cloudOfflineOutline} /> Saved offline
              </div>
              <div className="lp-chip lp-chip-b">
                <IonIcon icon={cloudUploadOutline} /> Pinned to IPFS
              </div>
            </div>
          </div>
        </section>

        <section className="lp-live">
          <div className="lp-container lp-live-grid">
            <div>
              <span className="lp-live-label">Sepolia block</span>
              <strong>{stats.block ? stats.block.toLocaleString() : "…"}</strong>
            </div>
            <div>
              <span className="lp-live-label">Storage token</span>
              <strong>{stats.symbol ?? "…"}</strong>
            </div>
            <div>
              <span className="lp-live-label">Token supply</span>
              <strong>{stats.supply ?? "…"}</strong>
            </div>
            <div>
              <span className="lp-live-label">On-chain plans</span>
              <strong>
                {stats.plans ?? "…"}
                {stats.cheapest && (
                  <small> from {stats.cheapest} {stats.symbol}</small>
                )}
              </strong>
            </div>
          </div>
          <p className="lp-container lp-live-note">
            Read live from the Cairo contracts, right now, in your browser.
          </p>
        </section>

        <section className="lp-section">
          <div className="lp-container">
            <h2>Everything a small biller needs, plus proof</h2>
            <p className="lp-sub">
              Billing software usually asks you to trust a vendor's server.
              Cairo Invoice keeps your invoices on your device and makes the
              record verifiable by anyone.
            </p>
            <div className="lp-features">
              {features.map((f) => (
                <article key={f.title} className="lp-feature">
                  <IonIcon icon={f.icon} />
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section lp-alt">
          <div className="lp-container">
            <h2>How it works</h2>
            <ol className="lp-steps">
              <li>
                <span className="lp-step-n">1</span>
                <IonIcon icon={createOutline} />
                <h3>Create</h3>
                <p>Pick a template, fill it in, add your logo and signature. Autosaved locally.</p>
              </li>
              <li>
                <span className="lp-step-n">2</span>
                <IonIcon icon={cubeOutline} />
                <h3>Choose a plan</h3>
                <p>Connect ArgentX or Braavos and buy a storage plan with PPT tokens.</p>
              </li>
              <li>
                <span className="lp-step-n">3</span>
                <IonIcon icon={cloudUploadOutline} />
                <h3>Anchor</h3>
                <p>One tap pins the invoice to IPFS and records its CID in the Cairo contract.</p>
              </li>
              <li>
                <span className="lp-step-n">4</span>
                <IonIcon icon={shieldCheckmarkOutline} />
                <h3>Verify</h3>
                <p>Share your address; anyone can check records in the public explorer.</p>
              </li>
            </ol>
          </div>
        </section>

        <section className="lp-section">
          <div className="lp-container">
            <h2>What's next</h2>
            <p className="lp-sub">
              On the roadmap, not shipped yet. Today's app covers everything
              above this section.
            </p>
            <div className="lp-features lp-roadmap">
              {roadmap.map((r) => (
                <article key={r.title} className="lp-feature">
                  <span className="lp-tag">Planned</span>
                  <IonIcon icon={r.icon} />
                  <h3>{r.title}</h3>
                  <p>{r.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-cta">
          <div className="lp-container lp-cta-inner">
            <div>
              <h2>Try it in 30 seconds</h2>
              <p>No sign-up. Your first invoice stays on your device until you choose to anchor it.</p>
            </div>
            <div className="lp-ctas">
              <button className="lp-btn" onClick={() => go("/app/editor")}>
                Open the editor <IonIcon icon={arrowForward} />
              </button>
              <button className="lp-btn lp-btn-ghost lp-on-dark" onClick={() => go("/explorer")}>
                Explore the contracts
              </button>
            </div>
          </div>
        </section>

        <footer className="lp-footer">
          <div className="lp-container lp-footer-inner">
            <span>
              <IonIcon icon={phonePortraitOutline} /> Ionic React · Cairo ·
              Starknet · IPFS · Capacitor
            </span>
            <span>
              Testnet demo: tokens have no monetary value ·{" "}
              <a href={GITHUB_URL} target="_blank" rel="noreferrer">
                Source on GitHub
              </a>
            </span>
          </div>
        </footer>
      </IonContent>
    </IonPage>
  );
};

export default LandingPage;
