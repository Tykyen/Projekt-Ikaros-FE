/**
 * 21.5f — jednoúrovňová diskuse komunitního ceníku. Vzor: ItemDiscussion
 * (21.5e); CSS modul reuse z kouzel (stejný vzhled, žádná další kopie).
 */
import { useState, type FormEvent } from 'react';
import { useAtomValue } from 'jotai';
import { isAuthenticatedAtom } from '@/shared/store/authStore';
import { useCenikComments } from '../hooks/useKomunitniCeniky';
import { useAddCenikComment } from '../hooks/useKomunitniCenikyMutations';
import s from '../../kouzla/components/SpellDiscussion.module.css';

interface Props {
  priceListId: string;
}

export function CenikDiscussion({ priceListId }: Props) {
  const isAuth = useAtomValue(isAuthenticatedAtom);
  const { data: comments = [], isLoading } = useCenikComments(priceListId);
  const addComment = useAddCenikComment();
  const [text, setText] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    addComment.mutate(
      { id: priceListId, payload: { content } },
      { onSuccess: () => setText('') },
    );
  };

  return (
    <section className={s.discuss} data-discussion="">
      <div className={s.head}>
        <span className={s.title}>Diskuse</span>
        <span className={s.scope}>o ceníku a jeho cenách</span>
        <span className={s.count}>· {comments.length}</span>
      </div>

      {isLoading ? (
        <p className={s.loading}>Načítám…</p>
      ) : comments.length === 0 ? (
        <p className={s.loading}>Zatím bez příspěvků.</p>
      ) : (
        <ul className={s.list}>
          {comments.map((c) => (
            <li key={c.id} className={s.comment}>
              <span className={s.avatar} aria-hidden="true">
                {c.authorName.charAt(0).toUpperCase()}
              </span>
              <div className={s.body}>
                <div className={s.meta}>
                  <span className={s.who}>{c.authorName}</span>
                  <span className={s.when}>
                    {new Date(c.createdAt).toLocaleDateString('cs')}
                  </span>
                </div>
                <p className={s.text}>{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {isAuth ? (
        <form className={s.replyBox} onSubmit={submit}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Napiš poznámku k ceníku…"
            maxLength={4000}
            aria-label="Napiš poznámku k ceníku…"
          />
          <button type="submit" disabled={addComment.isPending || !text.trim()}>
            Odeslat
          </button>
        </form>
      ) : (
        <p className={s.loginHint}>Pro příspěvek se přihlas.</p>
      )}
    </section>
  );
}
