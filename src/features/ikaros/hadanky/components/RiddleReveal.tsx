/**
 * 21.5d — spoiler blok hádanky (spec R3): nápovědy se odkrývají postupně
 * po jedné, odpověď zvlášť za vlastní klik. Chrání PJ před omylem, ne před
 * zlým úmyslem (žádný role-gate).
 */
import { useState } from 'react';
import s from './RiddleReveal.module.css';

interface Props {
  answer: string;
  hints: string[];
}

export function RiddleReveal({ answer, hints }: Props) {
  const [shownHints, setShownHints] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className={s.reveal} data-riddle-reveal="">
      {hints.length > 0 ? (
        <div className={s.hints}>
          {hints.slice(0, shownHints).map((h, i) => (
            <p className={s.hint} key={i}>
              <span className={s.hintLabel}>Nápověda {i + 1}:</span> {h}
            </p>
          ))}
          {shownHints < hints.length ? (
            <button
              type="button"
              className={s.hintBtn}
              onClick={() => setShownHints((n) => n + 1)}
            >
              💡 Zobrazit nápovědu ({shownHints + 1}/{hints.length})
            </button>
          ) : null}
        </div>
      ) : null}

      {showAnswer ? (
        <div className={s.answer} data-riddle-answer="">
          <span className={s.answerLabel}>Odpověď</span>
          <p className={s.answerText}>{answer}</p>
        </div>
      ) : (
        <button
          type="button"
          className={s.answerBtn}
          onClick={() => setShowAnswer(true)}
        >
          🔮 Odhalit odpověď
        </button>
      )}
    </div>
  );
}
