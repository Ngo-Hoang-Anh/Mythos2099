import type { ResumeInfo, RoomMode, RoomSummary } from "../net/protocol";
import { SgIconImg } from "./UiChrome";

const MODE_LABEL: Record<RoomMode, string> = {
  ai: "vs AI",
  hotseat: "Hotseat",
  pvp: "PvP",
};

export function LobbyView({
  username,
  rooms,
  resume,
  error,
  offline,
  onCreate,
  onJoin,
  onResume,
  onReconnect,
  onLogout,
  onTutorial,
}: {
  username: string;
  rooms: RoomSummary[];
  resume: ResumeInfo | null;
  error: string | null;
  offline: boolean;
  onCreate: (mode: RoomMode) => void;
  onJoin: (room: RoomSummary) => void;
  onResume: () => void;
  onReconnect: () => void;
  onLogout: () => void;
  onTutorial: () => void;
}) {
  const mine = rooms.filter((room) => room.youSeated);
  const open = rooms.filter((room) => !room.youSeated && room.status === "waiting");

  return (
    <div className="lobby">
      <header className="lobby-hero">
        <div>
          <p className="eyebrow">Lobby</p>
          <h1>Mythos2099</h1>
          <p className="muted">Signed in as {username}</p>
        </div>
        <button type="button" className="ghost" onClick={onLogout}>
          Log out
        </button>
      </header>

      {offline && (
        <div className="lobby-banner">
          <span>Disconnected from the server.</span>
          <button type="button" className="primary" onClick={onReconnect}>
            Reconnect
          </button>
        </div>
      )}

      {resume && (
        <div className="lobby-resume">
          <div>
            <p className="eyebrow">Resume</p>
            <h2>
              {MODE_LABEL[resume.mode]} · {resume.roomId}
              {resume.waitingForPeer ? " · waiting for P2" : ""}
            </h2>
          </div>
          <button type="button" className="primary" onClick={onResume}>
            Rejoin match
          </button>
        </div>
      )}

      <section className="lobby-create">
        <span className="sg-tab">Create</span>
        <h2>Create a room</h2>
        <div className="mode-row">
          <button type="button" className="primary sg-btn-row" onClick={onTutorial}>
            <SgIconImg name="help" tone="gold" size={20} />
            Tutorial
          </button>
          <button type="button" className="primary" onClick={() => onCreate("pvp")}>
            Host PvP
          </button>
          <button type="button" onClick={() => onCreate("ai")}>
            vs AI
          </button>
          <button type="button" onClick={() => onCreate("hotseat")}>
            Hotseat
          </button>
        </div>
      </section>

      {error && <p className="error">{error}</p>}

      {mine.length > 0 && (
        <section>
          <h2>Your matches</h2>
          <ul className="room-list">
            {mine.map((room) => (
              <RoomRow key={room.id} room={room} actionLabel="Resume" onAction={() => onResume()} />
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2>Open PvP rooms</h2>
        {open.length === 0 ? (
          <p className="muted">No rooms waiting for a second player.</p>
        ) : (
          <ul className="room-list">
            {open.map((room) => (
              <RoomRow key={room.id} room={room} actionLabel="Join" onAction={() => onJoin(room)} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function RoomRow({
  room,
  actionLabel,
  onAction,
}: {
  room: RoomSummary;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <li className="room-row">
      <div>
        <strong>{room.id}</strong>
        <span>
          {MODE_LABEL[room.mode]} · {room.hostName}
          {room.guestName ? ` vs ${room.guestName}` : ""}
        </span>
        <small>
          {room.status}
          {room.phase ? ` · ${room.phase}` : ""}
          {room.turn ? ` · turn ${room.turn}` : ""}
        </small>
      </div>
      <button type="button" className="primary" onClick={onAction}>
        {actionLabel}
      </button>
    </li>
  );
}
