import { useState } from 'react';
import { PlayCircle, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { parseYouTubeVideoId, buildYouTubeUrl } from '../lib/youtubeParse';
import type { InstructionalVideo } from '../../api/pages.types';
import s from './VideosPanel.module.css';

interface Props {
  videos: InstructionalVideo[];
  onChange: (videos: InstructionalVideo[]) => void;
}

/**
 * 7.2 — Editor `videos[]` pro typ Obrazovka. YouTube URL → parse videoId,
 * title input. Reorder šipkami (jako Galerie).
 */
export function VideosPanel({ videos, onChange }: Props) {
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');

  function addVideo() {
    const id = parseYouTubeVideoId(newUrl);
    if (!id) {
      toast.error('Neplatná YouTube URL nebo ID');
      return;
    }
    if (videos.some((v) => v.youtubeVideoId === id)) {
      toast.error('Toto video už v seznamu je');
      return;
    }
    onChange([
      ...videos,
      {
        id: crypto.randomUUID(),
        title: newTitle.trim() || 'Bez názvu',
        youtubeUrl: buildYouTubeUrl(id),
        youtubeVideoId: id,
      },
    ]);
    setNewUrl('');
    setNewTitle('');
  }

  function updateVideo(id: string, patch: Partial<InstructionalVideo>) {
    onChange(videos.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }

  function removeVideo(id: string) {
    onChange(videos.filter((v) => v.id !== id));
  }

  function moveVideo(id: string, direction: 'up' | 'down') {
    const idx = videos.findIndex((v) => v.id === id);
    if (idx < 0) return;
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= videos.length) return;
    const next = [...videos];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  return (
    <CollapsiblePanel
      title="Videa (Obrazovka)"
      icon={<PlayCircle size={18} aria-hidden />}
      badge={videos.length > 0 ? `${videos.length}` : undefined}
    >
      <div className={s.addRow}>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Název videa"
          className={s.input}
        />
        <input
          type="url"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="YouTube URL nebo ID"
          className={s.input}
        />
        <button
          type="button"
          onClick={addVideo}
          disabled={!newUrl.trim()}
          className={s.addBtn}
        >
          <Plus size={14} aria-hidden /> Přidat
        </button>
      </div>

      {videos.length === 0 ? (
        <div className={s.empty}>
          <p>Žádná videa. Vlož YouTube URL nebo holé ID.</p>
        </div>
      ) : (
        <ul className={s.list}>
          {videos.map((v, idx) => (
            <li key={v.id} className={s.card}>
              <div className={s.thumb}>
                <img
                  src={`https://img.youtube.com/vi/${v.youtubeVideoId}/mqdefault.jpg`}
                  alt={v.title}
                  loading="lazy"
                />
              </div>
              <div className={s.fields}>
                <input
                  type="text"
                  value={v.title}
                  onChange={(e) => updateVideo(v.id, { title: e.target.value })}
                  placeholder="Název"
                  className={s.titleInput}
                />
                <code className={s.videoId}>{v.youtubeVideoId}</code>
              </div>
              <div className={s.actions}>
                <button
                  type="button"
                  onClick={() => moveVideo(v.id, 'up')}
                  disabled={idx === 0}
                  aria-label="Nahoru"
                  className={s.iconBtn}
                >
                  <ArrowUp size={14} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => moveVideo(v.id, 'down')}
                  disabled={idx === videos.length - 1}
                  aria-label="Dolů"
                  className={s.iconBtn}
                >
                  <ArrowDown size={14} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => removeVideo(v.id)}
                  aria-label="Smazat"
                  className={s.iconBtn}
                >
                  <Trash2 size={14} aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </CollapsiblePanel>
  );
}
