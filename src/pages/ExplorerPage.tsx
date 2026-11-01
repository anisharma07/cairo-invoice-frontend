import React, { useCallback, useEffect, useState } from "react";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import {
  arrowBack,
  checkmarkCircle,
  cloudUploadOutline,
  createOutline,
  cubeOutline,
  openOutline,
  searchOutline,
  shieldCheckmarkOutline,
  walletOutline,
  alertCircleOutline,
} from "ionicons/icons";
import { useHistory, useLocation } from "react-router-dom";
import { useAccount } from "@starknet-react/core";
import {
  MED_INVOICE_CONTRACT_ADDRESS,
  MED_TOKEN_CONTRACT_ADDRESS,
} from "../abis/constants";
import { voyagerContract } from "../config/starknet";
import {
  AccountSnapshot,
  NetworkStatus,
  Plan,
  TokenInfo,
  formatToken,
  getAccountSnapshot,
  getContractOwner,
  getNetworkStatus,
  getPlans,
  getTokenInfo,
  isValidAddress,
  looksLikeCid,
} from "../services/chain";
import { getIPFSUrl } from "../utils/ipfs";
import { useTheme } from "../contexts/ThemeContext";
import "./ExplorerPage.css";

const short = (a: string, n = 6) =>
  a.length > 2 * n + 2 ? `${a.slice(0, n + 2)}…${a.slice(-n)}` : a;

const formatDate = (unix: number) =>
  unix
    ? new Date(unix * 1000).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

interface ExplorerPageProps {
  embedded?: boolean;
}

const ExplorerPage: React.FC<ExplorerPageProps> = ({ embedded = false }) => {
  const { isDarkMode } = useTheme();
  const history = useHistory();
  const location = useLocation();
  const { address: connectedAddress } = useAccount();

  const [network, setNetwork] = useState<NetworkStatus | null>(null);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [owner, setOwner] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [snapshot, setSnapshot] = useState<AccountSnapshot | null>(null);
  const [lookupState, setLookupState] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const [lookupError, setLookupError] = useState("");

  // Network + token + plans
  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      try {
        const [n, t, p, o] = await Promise.all([
          getNetworkStatus(),
          getTokenInfo(),
          getPlans(),
          getContractOwner(),
        ]);
        if (cancelled) return;
        setNetwork(n);
        setTokenInfo(t);
        setPlans(p);
        setOwner(o);
        setLoadError(null);
      } catch (e: any) {
        if (cancelled) return;
        setLoadError(
          navigator.onLine
            ? "Couldn't reach Starknet Sepolia. Retrying…"
            : "You're offline. On-chain data will load when you reconnect."
        );
        retryTimer = setTimeout(load, 5000);
      }
    };
    load();
    const onOnline = () => {
      clearTimeout(retryTimer);
      load();
    };
    window.addEventListener("online", onOnline);
    const timer = setInterval(async () => {
      try {
        const n = await getNetworkStatus();
        if (!cancelled) setNetwork(n);
      } catch {
        /* keep last value */
      }
    }, 12000);
    return () => {
      cancelled = true;
      clearInterval(timer);
      clearTimeout(retryTimer);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  const lookup = useCallback(async (addr: string) => {
    const a = addr.trim();
    if (!isValidAddress(a)) {
      setLookupState("error");
      setLookupError("Enter a valid Starknet address (0x…)");
      return;
    }
    setLookupState("loading");
    setLookupError("");
    try {
      const snap = await getAccountSnapshot(a);
      setSnapshot(snap);
      setLookupState("idle");
    } catch (e: any) {
      setSnapshot(null);
      setLookupState("error");
      setLookupError(e?.message?.slice(0, 160) || "Lookup failed");
    }
  }, []);

  // ?address=0x… deep link
  useEffect(() => {
    const addr = new URLSearchParams(location.search).get("address");
    if (addr) {
      setQuery(addr);
      lookup(addr);
    }
  }, [location.search, lookup]);

  const decimals = tokenInfo?.decimals ?? 18;
  const symbol = tokenInfo?.symbol ?? "PPT";
  const usagePct =
    snapshot && snapshot.filesAllowed > 0
      ? Math.min(100, (snapshot.filesUsed / snapshot.filesAllowed) * 100)
      : 0;

  return (
    <IonPage className={`explorer-page ${isDarkMode ? "dark" : ""}`}>
      <IonHeader className="ion-no-border">
        <IonToolbar className="explorer-toolbar">
          {!embedded && (
            <IonButtons slot="start">
              <IonButton onClick={() => history.push("/")} aria-label="Back">
                <IonIcon icon={arrowBack} />
              </IonButton>
            </IonButtons>
          )}
          <IonTitle>On-chain Explorer</IonTitle>
          <IonButtons slot="end">
            <span className="net-pill" title={network?.rpcHost || ""}>
              <span className={`dot ${network ? "live" : ""}`} />
              Sepolia
              {network && (
                <span className="block">#{network.blockNumber.toLocaleString()}</span>
              )}
            </span>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="explorer-content">
        <div className="ex-wrap">
          <section className="ex-intro">
            <h1>Verify invoices on Starknet</h1>
            <p>
              Every invoice saved to the chain is stored on IPFS and anchored in
              a Cairo contract with its content hash (CID) and timestamp. Anyone
              can look up an address and check its records. No wallet needed.
            </p>
          </section>

          {loadError && (
            <div className="ex-alert">
              <IonIcon icon={alertCircleOutline} /> {loadError}
            </div>
          )}

          {/* Lookup */}
          <section className="ex-card ex-lookup" aria-labelledby="lookup-h">
            <h2 id="lookup-h">
              <IonIcon icon={shieldCheckmarkOutline} /> Look up invoice records
            </h2>
            <form
              className="lookup-row"
              onSubmit={(e) => {
                e.preventDefault();
                lookup(query);
              }}
            >
              <input
                className="lookup-input"
                placeholder="Starknet address, e.g. 0x0162…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                spellCheck={false}
                aria-label="Starknet address"
              />
              <IonButton type="submit" className="lookup-btn">
                {lookupState === "loading" ? (
                  <IonSpinner name="dots" />
                ) : (
                  <>
                    <IonIcon icon={searchOutline} slot="start" /> Verify
                  </>
                )}
              </IonButton>
            </form>
            <div className="lookup-hints">
              {owner && (
                <button
                  type="button"
                  className="chip-btn"
                  onClick={() => {
                    setQuery(owner);
                    lookup(owner);
                  }}
                >
                  Try the demo account
                </button>
              )}
              {connectedAddress && (
                <button
                  type="button"
                  className="chip-btn"
                  onClick={() => {
                    setQuery(connectedAddress);
                    lookup(connectedAddress);
                  }}
                >
                  <IonIcon icon={walletOutline} /> My wallet
                </button>
              )}
            </div>
            {lookupState === "error" && (
              <p className="lookup-error">{lookupError}</p>
            )}

            {snapshot && (
              <div className="snapshot">
                <div className="snap-stats">
                  <div className="stat">
                    <span className="label">Account</span>
                    <a
                      className="mono"
                      href={voyagerContract(snapshot.address)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {short(snapshot.address)} <IonIcon icon={openOutline} />
                    </a>
                  </div>
                  <div className="stat">
                    <span className="label">{symbol} balance</span>
                    <strong>
                      {formatToken(snapshot.tokenBalance, decimals)} {symbol}
                    </strong>
                  </div>
                  <div className="stat">
                    <span className="label">Storage used</span>
                    <strong>
                      {snapshot.filesUsed} / {snapshot.filesAllowed} files
                    </strong>
                    <div className="meter" aria-hidden>
                      <span style={{ width: `${usagePct}%` }} />
                    </div>
                  </div>
                </div>

                {snapshot.records.length === 0 ? (
                  <p className="empty">
                    No invoices anchored by this address yet.
                  </p>
                ) : (
                  <ul className="records">
                    {snapshot.records.map((r, i) => {
                      const valid = looksLikeCid(r.cid);
                      return (
                        <li key={`${r.cid}-${i}`} className="record">
                          <div className="rec-main">
                            <span className="rec-name">{r.fileName}</span>
                            <span className="rec-time">
                              {formatDate(r.timestamp)}
                            </span>
                          </div>
                          <div className="rec-meta">
                            {valid ? (
                              <a
                                className="mono cid"
                                href={getIPFSUrl(r.cid)}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {short(r.cid, 8)} <IonIcon icon={openOutline} />
                              </a>
                            ) : (
                              <span className="mono cid muted">
                                {short(r.cid, 8)}
                              </span>
                            )}
                            <span
                              className={`badge ${valid ? "ok" : "warn"}`}
                              title={
                                valid
                                  ? "Well-formed IPFS content identifier"
                                  : "Not a standard IPFS CID (test data)"
                              }
                            >
                              {valid ? (
                                <>
                                  <IonIcon icon={checkmarkCircle} /> Anchored
                                </>
                              ) : (
                                "Test record"
                              )}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </section>

          {/* Token + contracts */}
          <section className="ex-grid">
            <div className="ex-card token-card">
              <h2>
                <IonIcon icon={cubeOutline} /> Storage token
              </h2>
              {tokenInfo ? (
                <>
                  <div className="token-head">
                    <span className="token-logo">{tokenInfo.symbol}</span>
                    <div>
                      <strong>{tokenInfo.name}</strong>
                      <span className="muted">
                        ERC-20 · {tokenInfo.decimals} decimals
                      </span>
                    </div>
                  </div>
                  <dl className="kv">
                    <dt>Total supply</dt>
                    <dd>
                      {formatToken(tokenInfo.totalSupply, tokenInfo.decimals, 0)}{" "}
                      {tokenInfo.symbol}
                    </dd>
                    <dt>Token contract</dt>
                    <dd>
                      <a
                        className="mono"
                        href={voyagerContract(MED_TOKEN_CONTRACT_ADDRESS)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {short(MED_TOKEN_CONTRACT_ADDRESS)}{" "}
                        <IonIcon icon={openOutline} />
                      </a>
                    </dd>
                    <dt>Invoice contract</dt>
                    <dd>
                      <a
                        className="mono"
                        href={voyagerContract(MED_INVOICE_CONTRACT_ADDRESS)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {short(MED_INVOICE_CONTRACT_ADDRESS)}{" "}
                        <IonIcon icon={openOutline} />
                      </a>
                    </dd>
                  </dl>
                </>
              ) : (
                !loadError && <IonSpinner name="dots" />
              )}
            </div>

            <div className="ex-card plans-card">
              <h2>
                <IonIcon icon={walletOutline} /> Storage plans (on-chain)
              </h2>
              {plans ? (
                <div className="plans">
                  {plans.map((p) => (
                    <div key={p.id} className={`plan plan-${p.id}`}>
                      <span className="plan-name">{p.name}</span>
                      <span className="plan-cost">
                        {formatToken(p.cost, decimals)} <small>{symbol}</small>
                      </span>
                      <span className="plan-files">
                        {p.filesAllowed} invoices
                      </span>
                      <span className="plan-unit muted">
                        {formatToken(p.cost / BigInt(p.filesAllowed || 1), decimals)}{" "}
                        {symbol} / invoice
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                !loadError && <IonSpinner name="dots" />
              )}
              <p className="muted small">
                Plans are read live from the Cairo contract. Subscribing is an
                ERC-20 <code>approve</code> followed by{" "}
                <code>subscribe_to_plan</code> from your wallet.
              </p>
            </div>
          </section>

          {/* How it works */}
          <section className="ex-card how">
            <h2>How Proof-of-Invoice works</h2>
            <ol className="steps">
              <li>
                <IonIcon icon={createOutline} />
                <strong>Create offline</strong>
                <span>
                  Invoices are edited in a spreadsheet engine and autosaved on
                  the device. Works without internet.
                </span>
              </li>
              <li>
                <IonIcon icon={cloudUploadOutline} />
                <strong>Pin to IPFS</strong>
                <span>
                  The invoice is content-addressed: its CID changes if a single
                  byte changes.
                </span>
              </li>
              <li>
                <IonIcon icon={shieldCheckmarkOutline} />
                <strong>Anchor on Starknet</strong>
                <span>
                  <code>save_file</code> records name, CID, owner and timestamp in
                  Cairo. Storage quota is paid in {symbol}.
                </span>
              </li>
            </ol>
          </section>

          <footer className="ex-foot muted small">
            Starknet Sepolia testnet · Read via {network?.rpcHost || "public RPC"}
          </footer>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ExplorerPage;
