import { useState } from "react";
import { PREMADE_ARMIES } from "../data/premadeArmies";
import {
  LESSONS,
  firstIncompleteTutorialId,
  loadCompletedLessons,
  markLessonComplete,
  type TutorialId,
} from "../tutorial";
import { BUILD_GUIDE, BUILD_GUIDE_ID, BUILD_GUIDE_STEPS } from "../tutorial/buildGuide";
import { ArmyBuilder } from "./ArmyBuilder";
import { TutorialSpotlight } from "./TutorialSpotlight";
import { SgIconImg } from "./UiChrome";

export function BuildGuide({
  onExit,
  onPlay,
  onPlayAi,
}: {
  onExit: () => void;
  onPlay: (id: TutorialId) => void;
  onPlayAi?: () => void;
}) {
  const [step, setStep] = useState(0);
  const [complete, setComplete] = useState(false);
  const hint = complete ? null : BUILD_GUIDE_STEPS[step];
  const last = step >= BUILD_GUIDE_STEPS.length - 1;
  const continueId = firstIncompleteTutorialId(loadCompletedLessons());

  function finish() {
    markLessonComplete(BUILD_GUIDE_ID);
    setComplete(true);
  }

  function onNext() {
    if (last) finish();
    else setStep((n) => n + 1);
  }

  return (
    <div className="build-guide">
      <header className="build-guide-bar">
        <p className="eyebrow">
          Lesson {String(BUILD_GUIDE.number).padStart(2, "0")} / {String(LESSONS.length + 1).padStart(2, "0")}
        </p>
        <h1>{BUILD_GUIDE.title}</h1>
        <p>{BUILD_GUIDE.subtitle}</p>
        <button type="button" className="ghost sg-btn-row" onClick={onExit}>
          <SgIconImg name="home" tone="gold" size={20} />
          Lessons
        </button>
      </header>
      <div className="build-guide-stage">
        <ArmyBuilder
          defaultP1={PREMADE_ARMIES.tank_robot.units}
          defaultP2={PREMADE_ARMIES.tank_robot.units}
          intent={{ kind: "create", mode: "hotseat" }}
          guide
          onBack={onExit}
          onConfirm={finish}
        />
        {hint ? <TutorialSpotlight hint={hint} onNext={onNext} /> : null}
      </div>
      {complete ? (
        <div className="tutorial-complete">
          <div className="choice-dialog" role="dialog" aria-label="Build Guide complete">
            <p className="eyebrow">Lesson complete</p>
            <h2>You are ready to dive into battle.</h2>
            <p>{BUILD_GUIDE.success}</p>
            <div className="choice-options">
              <button
                type="button"
                className="primary"
                onClick={() => {
                  if (onPlayAi) onPlayAi();
                }}
              >
                To battle — first AI match
              </button>
              {continueId ? (
                <button type="button" className="secondary" onClick={() => onPlay(continueId)}>
                  Continue training
                </button>
              ) : null}
              <button type="button" className="ghost" onClick={onExit}>
                All lessons
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
