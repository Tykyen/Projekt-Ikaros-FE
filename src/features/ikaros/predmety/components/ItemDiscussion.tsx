/**
 * 21.5e — dvouúrovňová diskuse komunitního předmětu ('item' = o předmětu,
 * 'statblock' = balanc statů jednoho systému). Vzor: PotionDiscussion (21.5b);
 * CSS modul reuse z kouzel (stejný vzhled, žádná další kopie).
 */
import { useState, type FormEvent } from 'react';
import { useAtomValue } from 'jotai';
import { isAuthenticatedAtom } from '@/shared/store/authStore';
import { useItemComments } from '../hooks/usePredmety';
import { useAddItemComment } from '../hooks/usePredmetyMutations';
import s from '../../kouzla/components/SpellDiscussion.module.css';

interface Props {
  itemId: string;
  targetType: 'item' | 'statblock';
  systemId?: string;
  title: string;
  scopeNote: string;
  placeholder: string;
}

export function ItemDiscussion({
  itemId,
  targetType,
  systemId,
  title,
  scopeNote,
  placeholder,
}: Props) {
  const isAuth = useAtomValue(isAuthenticatedAtom);
  const { data: comments = [], isLoading } = useItemComments(
    itemId,
    targetType,
    systemId,
  );
  const addComment = useAddItemComment();
  const [text, setText] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    addComment.mutate(
      { id: itemId, payload: { targetType, systemId, content } },
      { onSuccess: () => setText('') },
    );
  };

  return (
    <section className={s.discuss} data-discussion="">
      <div className={s.head}>
        <span className={s.title}>{title}</span>
        <span className={s.scope}>{scopeNote}</span>
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
            placeholder={placeholder}
            maxLength={4000}
            aria-label={placeholder}
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
