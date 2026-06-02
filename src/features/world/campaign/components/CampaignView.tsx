import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { Spinner, Tabs, type TabItem } from '@/shared/ui';
import { WorldRole } from '@/shared/types';
import { currentUserAtom } from '@/shared/store/authStore';
import { useWorldContext } from '@/features/world/context/WorldContext';
import {
  useCampaignPlayers,
  useCampaignRelationships,
  useCampaignStorylines,
  useCampaignSubjects,
} from '../api';
import type { CampaignRelationship } from '../types';
import { useSubjectImages } from '../useSubjectImages';
import { LayerSwitcher } from './LayerSwitcher';
import { DnesTab } from './DnesTab';
import { SubjektyTab } from './SubjektyTab';
import { LinkyTab } from './LinkyTab';
import { PavucinaGraph } from './PavucinaGraph';
import '../campaign.tokens.css';
import s from './campaign.module.css';

type TabId = 'dnes' | 'subjekty' | 'linky' | 'sit';

/** Orchestrátor Pavučiny — vrstvy, taby, sdílený výběr subjektu/vztahu. */
export function CampaignView() {
  const { worldId, userRole } = useWorldContext();
  const me = useAtomValue(currentUserAtom);
  const myUserId = me?.id ?? '';
  const viewerRole = userRole ?? WorldRole.Zadatel;
  const isPJ = viewerRole >= WorldRole.PJ;

  // 11.2 — příchod ze Storyboardu „Zobrazit v síti": ?storyline=<id> předfiltruje
  // graf a otevře tab Síť.
  const [searchParams] = useSearchParams();
  const initialStoryline = searchParams.get('storyline');

  const [layer, setLayer] = useState('mine');
  const [tab, setTab] = useState<TabId>(initialStoryline ? 'sit' : 'dnes');
  const [selSubjectId, setSelSubjectId] = useState<string | null>(null);
  const [selRelId, setSelRelId] = useState<string | null>(null);
  const [graphStoryline, setGraphStoryline] = useState<string | null>(
    initialStoryline,
  );

  const subjectsQ = useCampaignSubjects(worldId);
  const relsQ = useCampaignRelationships(worldId);
  const storiesQ = useCampaignStorylines(worldId);
  const playersQ = useCampaignPlayers(worldId, isPJ);
  const imageFor = useSubjectImages(worldId);

  const ownerId = layer === 'mine' ? myUserId : layer;
  const readOnly = layer !== 'mine';

  const subjects = useMemo(
    () => (subjectsQ.data ?? []).filter((x) => x.ownerId === ownerId),
    [subjectsQ.data, ownerId],
  );
  const relationships = useMemo(
    () => (relsQ.data ?? []).filter((x) => x.ownerId === ownerId),
    [relsQ.data, ownerId],
  );
  const storylines = useMemo(
    () => (storiesQ.data ?? []).filter((x) => x.ownerId === ownerId),
    [storiesQ.data, ownerId],
  );

  function gotoSubject(id: string) {
    setTab('subjekty');
    setSelSubjectId(id);
    setSelRelId(null);
  }
  function gotoRelationship(rel: CampaignRelationship) {
    setTab('subjekty');
    setSelSubjectId(rel.subjectAId);
    setSelRelId(rel.id);
  }

  const tabs: TabItem[] = [
    { id: 'dnes', label: '◉ Dnes' },
    { id: 'subjekty', label: 'Subjekty' },
    { id: 'linky', label: 'Linky' },
    { id: 'sit', label: 'Síť' },
  ];

  const loading = subjectsQ.isLoading || relsQ.isLoading;

  return (
    <div className={`campaign-root ${s.root}`}>
      <header className={s.topbar}>
        <h1 className={s.pageTitle}>🕸 Pavučina</h1>
        {isPJ && (
          <LayerSwitcher
            layer={layer}
            onChange={(l) => {
              setLayer(l);
              setSelSubjectId(null);
              setSelRelId(null);
            }}
            players={playersQ.data ?? []}
          />
        )}
        {readOnly && <span className={s.readonlyBadge}>jen pro čtení</span>}
      </header>

      <Tabs
        items={tabs}
        activeId={tab}
        onChange={(id) => setTab(id as TabId)}
        orientation="horizontal"
      >
        {loading ? (
          <div className={s.center}>
            <Spinner />
          </div>
        ) : tab === 'dnes' ? (
          <DnesTab
            subjects={subjects}
            relationships={relationships}
            storylines={storylines}
            onGoSubject={gotoSubject}
            onGoRelationship={gotoRelationship}
          />
        ) : tab === 'subjekty' ? (
          <SubjektyTab
            worldId={worldId}
            subjects={subjects}
            relationships={relationships}
            readOnly={readOnly}
            isPJ={isPJ}
            selSubjectId={selSubjectId}
            setSelSubjectId={setSelSubjectId}
            selRelId={selRelId}
            setSelRelId={setSelRelId}
            onSwitchToMine={() => setLayer('mine')}
          />
        ) : tab === 'linky' ? (
          <LinkyTab
            worldId={worldId}
            storylines={storylines}
            subjects={subjects}
            readOnly={readOnly}
            isPJ={isPJ}
            onGoSubject={gotoSubject}
            onShowInGraph={(id) => {
              setGraphStoryline(id);
              setTab('sit');
            }}
          />
        ) : (
          <PavucinaGraph
            subjects={subjects}
            relationships={relationships}
            storylines={storylines}
            storylineFilter={graphStoryline}
            onStorylineFilter={setGraphStoryline}
            imageFor={imageFor}
            onOpenSubject={gotoSubject}
          />
        )}
      </Tabs>
    </div>
  );
}
