import { useEffect, useState, type ReactNode } from "react";
import { useGameSession } from "../net/useGameSession";
import type { RoomMode } from "../net/protocol";
import { DEFAULT_P1, DEFAULT_P2 } from "../data/premadeArmies";
import type { TutorialId } from "../tutorial";
import { ArmyBuilder, type ArmyIntent } from "../ui/ArmyBuilder";
import { LobbyView } from "../ui/LobbyView";
import { MatchView } from "../ui/MatchView";
import { TutorialHub } from "../ui/TutorialHub";
import { TutorialView } from "../ui/TutorialView";
import { BuildGuide } from "../ui/BuildGuide";
import { SgIconImg } from "../ui/UiChrome";
import { MobileAuthView } from "./AuthView";
/**
 * Mobile shell mounted at `/m`.
 * Auth is mobile-specific; other screens temporarily reuse desktop views —
 * replace with `src/mobile/*` copies as you redesign each surface.
 */
export function MobileApp() {
  const session = useGameSession();
  const [intent, setIntent] = useState<ArmyIntent | null>(null);
  const [tutorial, setTutorial] = useState<"hub" | TutorialId | null>(null);
  const [hubTab, setHubTab] = useState<"tutorial" | "codex">("tutorial");
  useEffect(() => {
    if (session.match || session.waitingForPeer) setIntent(null);
  }, [session.match, session.waitingForPeer]);

  // Match + active lesson fill the design canvas — no chrome above the HUD.
  const inPlay =
    Boolean(session.match) ||
    (tutorial !== null && tutorial !== "hub" && tutorial !== "build-army");

  let body: ReactNode;

  if (tutorial === "build-army") {
    body = (
      <BuildGuide
        onExit={() => setTutorial("hub")}
        onPlay={(id) => setTutorial(id)}
        onPlayAi={() => {
          setTutorial(null);
          setIntent({ kind: "create", mode: "ai" });
        }}
      />
    );
  } else if (tutorial && tutorial !== "hub") {
    body = (
      <TutorialView
        key={tutorial}
        lessonId={tutorial}
        onExit={() => setTutorial("hub")}
        onPlay={(id) => setTutorial(id)}
        pointerCardDrag
      />
    );
  } else if (tutorial === "hub") {
    body = (
      <TutorialHub
        tab={hubTab}
        onTabChange={setHubTab}
        onPlay={(id) => setTutorial(id)}
        onBack={() => setTutorial(null)}
        onBattle={() => {
          setTutorial(null);
          setIntent({ kind: "create", mode: "ai" });
          if (!session.username) void session.playAsGuest();
        }}
      />
    );
  } else if (!session.username) {
    body = (
      <MobileAuthView
        busy={session.status === "connecting"}
        error={session.error}
        onLogin={(username, password) => void session.login(username, password)}
        onRegister={(username, password) => void session.register(username, password)}
        onGuest={() => void session.playAsGuest()}
        onTutorial={() => {
          setHubTab("tutorial");
          setTutorial("hub");
        }}
      />
    );
  } else if (session.match) {
    body = (
      <MatchView
        match={session.match}
        you={session.you}
        vsAi={session.mode === "ai"}
        showOwnCardPlays={session.mode === "hotseat"}
        waitingForCombatAck={session.waitingForCombatAck}
        peerConnected={session.peerConnected}
        actionError={session.error}
        onAction={session.sendAction}
        onContinueAi={session.continueAi}
        onClearError={session.clearError}
        onExit={session.exitToLobby}
        onRetry={session.canRetry ? session.retryMatch : undefined}
        onLearnMore={() => {
          session.exitToLobby();
          setHubTab("codex");
          setTutorial("hub");
        }}
        onSurrender={() => session.sendAction({ type: "surrender" })}
        pointerCardDrag
      />
    );
  } else if (session.waitingForPeer && session.roomId) {
    body = (
      <div className="waiting-room">
        <div className="sg-framed waiting-panel">
          <p className="eyebrow">PvP room</p>
          <h1>Waiting for P2</h1>
          <p>Share this code or wait for someone from the lobby:</p>
          <div className="room-code">{session.roomId}</div>
          {session.hostName && <p className="muted">Host: {session.hostName}</p>}
          {session.error && <p className="error">{session.error}</p>}
          <div className="mode-row">
            <button type="button" className="ghost sg-btn-row" onClick={session.exitToLobby}>
              <SgIconImg name="home" tone="gold" size={20} />
              Back to lobby
            </button>
            <button type="button" className="ghost sg-btn-row" onClick={() => session.abandon()}>
              <SgIconImg name="close" tone="cyan" size={20} />
              Cancel room
            </button>
          </div>
        </div>
      </div>
    );
  } else if (intent) {
    body = (
      <ArmyBuilder
        defaultP1={DEFAULT_P1}
        defaultP2={DEFAULT_P2}
        intent={intent}
        busy={session.status === "connecting"}
        error={session.error}
        deckDrawer
        onBack={() => {
          setIntent(null);
          session.clearError();
        }}
        onConfirm={({ p1, p2, aiDifficulty }) => {
          if (intent.kind === "join") {
            session.joinMatch(intent.roomId, p2);
            return;
          }
          session.createMatch(intent.mode, p1, intent.mode === "pvp" ? undefined : p2, aiDifficulty);
        }}
      />
    );
  } else {
    body = (
      <LobbyView
        username={session.username}
        rooms={session.rooms}
        resume={session.resume}
        error={session.error}
        offline={session.status === "offline"}
        onCreate={(mode: RoomMode) => {
          session.clearError();
          setIntent({ kind: "create", mode });
        }}
        onJoin={(room) => {
          session.clearError();
          setIntent({ kind: "join", roomId: room.id, hostName: room.hostName });
        }}
        onResume={() => session.rejoin()}
        onReconnect={() => session.reconnect()}
        onLogout={() => session.logout()}
        onTutorial={() => {
          setHubTab("tutorial");
          setTutorial("hub");
        }}
      />
    );
  }

  return (
    <div className={`mobile-shell${inPlay ? " is-play" : ""}`}>
      {!inPlay ? (
        <div className="mobile-shell-banner">
          <strong>Mythos 2099</strong>
        </div>
      ) : null}
      {body}
    </div>
  );
}
