import { useEffect, useState } from "react";
import { useGameSession } from "../net/useGameSession";
import type { RoomMode } from "../net/protocol";
import { DEFAULT_P1, DEFAULT_P2 } from "../data/premadeArmies";
import type { TutorialId } from "../tutorial";
import { ArmyBuilder, type ArmyIntent } from "./ArmyBuilder";
import { AuthView } from "./AuthView";
import { LobbyView } from "./LobbyView";
import { MatchView } from "./MatchView";
import { TutorialHub } from "./TutorialHub";
import { TutorialView } from "./TutorialView";
import { BuildGuide } from "./BuildGuide";
import { SgIconImg } from "./UiChrome";

export function App() {
  const session = useGameSession();
  const [intent, setIntent] = useState<ArmyIntent | null>(null);
  const [tutorial, setTutorial] = useState<"hub" | TutorialId | null>(null);
  const [hubTab, setHubTab] = useState<"tutorial" | "codex">("tutorial");

  useEffect(() => {
    if (session.match || session.waitingForPeer) setIntent(null);
  }, [session.match, session.waitingForPeer]);

  if (tutorial === "build-army") {
    return (
      <BuildGuide
        onExit={() => setTutorial("hub")}
        onPlay={(id) => setTutorial(id)}
        onPlayAi={() => {
          setTutorial(null);
          setIntent({ kind: "create", mode: "ai" });
        }}
      />
    );
  }

  if (tutorial && tutorial !== "hub") {
    return (
      <TutorialView
        key={tutorial}
        lessonId={tutorial}
        onExit={() => setTutorial("hub")}
        onPlay={(id) => setTutorial(id)}
      />
    );
  }

  if (tutorial === "hub") {
    return (
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
  }

  if (!session.username) {
    return (
      <AuthView
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
  }

  if (session.match) {
    return (
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
      />
    );
  }

  if (session.waitingForPeer && session.roomId) {
    return (
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
  }

  if (intent) {
    return (
      <ArmyBuilder
        defaultP1={DEFAULT_P1}
        defaultP2={DEFAULT_P2}
        intent={intent}
        busy={session.status === "connecting"}
        error={session.error}
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
  }

  return (
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
