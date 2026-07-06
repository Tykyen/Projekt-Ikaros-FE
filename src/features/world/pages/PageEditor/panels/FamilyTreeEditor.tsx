import { useState } from 'react';
import { Network } from 'lucide-react';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { HeroUploadCard } from '../components/HeroUploadCard';
import { PagePicker } from '@/features/world/components/PagePicker/PagePicker';
import { FamilyTreeCanvas } from '../../PageViewer/layouts/familyTree/FamilyTreeCanvas';
import { autoLayout } from '../../PageViewer/layouts/familyTree/geometry';
import type {
  FamilyPerson,
  FamilyTree,
  FamilyUnion,
} from '../../api/pages.types';
import s from '../../PageViewer/layouts/familyTree/family-tree.module.css';

interface Props {
  worldId: string;
  familyTree?: FamilyTree;
  onChange: (tree: FamilyTree) => void;
}

const EMPTY: FamilyTree = { people: [], unions: [] };
const uid = () => crypto.randomUUID();

/**
 * 17.7 — editor rodokmenu (typ Rodokmen). Klik na osobu → boční panel s poli;
 * tlačítka příbuzných přidají a propojí uzel; tažení posouvá, „Srovnat" spustí
 * auto-layout. Sdílí render s náhledem přes FamilyTreeCanvas.
 */
export function FamilyTreeEditor({ worldId, familyTree, onChange }: Props) {
  const tree = familyTree ?? EMPTY;
  const [selId, setSelId] = useState<string | null>(null);

  const setPeople = (people: FamilyPerson[]) => onChange({ ...tree, people });
  const updatePerson = (id: string, patch: Partial<FamilyPerson>) =>
    setPeople(tree.people.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const newPerson = (x: number, y: number): FamilyPerson => ({
    id: uid(),
    name: '',
    x,
    y,
  });

  function addRoot() {
    const n = newPerson(400, 80);
    onChange({ people: [...tree.people, n], unions: tree.unions });
    setSelId(n.id);
  }

  function addRelative(id: string, rel: 'partner' | 'child' | 'parent') {
    const p = tree.people.find((x) => x.id === id);
    if (!p) return;
    const nid = uid();
    let people = [...tree.people];
    let unions = [...tree.unions];

    if (rel === 'partner') {
      people.push({ ...newPerson(p.x + 196, p.y), id: nid });
      unions.push({ id: uid(), aId: id, bId: nid, childIds: [] });
    } else if (rel === 'child') {
      const u = unions.find((x) => x.aId === id || x.bId === id);
      const n = u ? u.childIds.length : 0;
      people.push({ ...newPerson(p.x + n * 196 - 40, p.y + 300), id: nid });
      if (u) {
        unions = unions.map((x) =>
          x === u ? { ...x, childIds: [...x.childIds, nid] } : x,
        );
      } else {
        unions.push({ id: uid(), aId: id, childIds: [nid] });
      }
    } else {
      // rodič
      people.push({ ...newPerson(p.x, p.y - 300), id: nid });
      const pu = unions.find((x) => x.childIds.includes(id));
      if (pu && !pu.bId) {
        unions = unions.map((x) => (x === pu ? { ...x, bId: nid } : x));
      } else if (!pu) {
        unions.push({ id: uid(), aId: nid, childIds: [id] });
      }
      // pu má už oba rodiče → dalšího nevěšíme (edge case, v1 ignoruje)
    }
    onChange({ people, unions });
    setSelId(nid);
  }

  function removePerson(id: string) {
    const people = tree.people.filter((p) => p.id !== id);
    const unions: FamilyUnion[] = tree.unions
      // pokud mizí primární partner a je tu druhý → povýšíme ho na aId
      .map((u) => (u.aId === id && u.bId ? { ...u, aId: u.bId, bId: undefined } : u))
      .map((u) => ({
        ...u,
        bId: u.bId === id ? undefined : u.bId,
        childIds: u.childIds.filter((c) => c !== id),
      }))
      .filter((u) => u.aId !== id);
    onChange({ people, unions });
    if (selId === id) setSelId(null);
  }

  function srovnat() {
    const pos = autoLayout(tree.people, tree.unions);
    setPeople(
      tree.people.map((p) =>
        pos[p.id] ? { ...p, x: pos[p.id].x, y: pos[p.id].y } : p,
      ),
    );
  }

  const selected = tree.people.find((p) => p.id === selId) ?? null;

  return (
    <CollapsiblePanel
      title="Rodokmen — osoby a vztahy"
      icon={<Network size={18} aria-hidden />}
      badge={tree.people.length || undefined}
      defaultOpen
    >
      {tree.people.length === 0 ? (
        <div className={s.addFirst}>
          <p>Rodokmen je zatím prázdný.</p>
          <button type="button" onClick={addRoot}>
            + Přidat první osobu
          </button>
        </div>
      ) : (
        <div className={s.editWrap}>
          <FamilyTreeCanvas
            people={tree.people}
            unions={tree.unions}
            mode="edit"
            selectedId={selId}
            onNodeClick={setSelId}
            onNodeDragMove={(id, x, y) => updatePerson(id, { x, y })}
            nodeExtra={(p) => (
              <div
                className={s.ptools}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => addRelative(p.id, 'partner')}
                  title="Přidat partnera"
                  aria-label="Přidat partnera"
                >
                  💍
                </button>
                <button
                  type="button"
                  onClick={() => addRelative(p.id, 'child')}
                  title="Přidat dítě"
                  aria-label="Přidat dítě"
                >
                  👶
                </button>
                <button
                  type="button"
                  onClick={() => addRelative(p.id, 'parent')}
                  title="Přidat rodiče"
                  aria-label="Přidat rodiče"
                >
                  ⬆
                </button>
                <button
                  type="button"
                  onClick={() => setSelId(p.id)}
                  title="Upravit"
                  aria-label="Upravit"
                >
                  ✎
                </button>
                <button
                  type="button"
                  onClick={() => removePerson(p.id)}
                  title="Smazat"
                  aria-label="Smazat"
                >
                  🗑
                </button>
              </div>
            )}
            toolbarExtra={
              <>
                <span className={s.sep} />
                <button
                  type="button"
                  className={s.toolBtn}
                  onClick={srovnat}
                  title="Srovnat generačně (auto-layout)"
                >
                  Srovnat
                </button>
                <button type="button" className={s.toolBtn} onClick={addRoot}>
                  + Osoba
                </button>
              </>
            }
          />

          {selected && (
            <aside className={s.panel}>
              <div className={s.panelHead}>
                <h4>{selected.name || 'Nová osoba'}</h4>
                <button
                  type="button"
                  className={s.panelClose}
                  onClick={() => setSelId(null)}
                  aria-label="Zavřít panel"
                >
                  ✕
                </button>
              </div>

              <label>Foto</label>
              <HeroUploadCard
                compact
                value={selected.imageUrl ?? ''}
                uploadCta="Nahrát foto osoby"
                onChange={(url) =>
                  updatePerson(selected.id, { imageUrl: url || undefined })
                }
              />

              <label>Jméno</label>
              <input
                value={selected.name}
                onChange={(e) =>
                  updatePerson(selected.id, { name: e.target.value })
                }
                placeholder="Např. Aldrich"
              />

              <label>Druhý řádek (příjmení / přezdívka)</label>
              <input
                value={selected.sub ?? ''}
                onChange={(e) =>
                  updatePerson(selected.id, { sub: e.target.value || undefined })
                }
                placeholder="Např. Modregol · roz. Feronská"
              />

              <div className={s.row2}>
                <div>
                  <label>Narození</label>
                  <input
                    value={selected.born ?? ''}
                    onChange={(e) =>
                      updatePerson(selected.id, {
                        born: e.target.value || undefined,
                      })
                    }
                    placeholder="1502"
                  />
                </div>
                <div>
                  <label>Úmrtí</label>
                  <input
                    value={selected.died ?? ''}
                    onChange={(e) =>
                      updatePerson(selected.id, {
                        died: e.target.value || undefined,
                      })
                    }
                    placeholder="1571"
                  />
                </div>
              </div>

              <label>Odkaz na stránku (nepovinné)</label>
              <PagePicker
                worldId={worldId}
                value={selected.pageSlug ?? null}
                onChange={(slug) =>
                  updatePerson(selected.id, { pageSlug: slug || undefined })
                }
                placeholder="Vyber stránku postavy…"
              />

              <label>Přidat příbuzného</label>
              <div className={s.relRow}>
                <button
                  type="button"
                  onClick={() => addRelative(selected.id, 'partner')}
                >
                  💍 Partner
                </button>
                <button
                  type="button"
                  onClick={() => addRelative(selected.id, 'child')}
                >
                  👶 Dítě
                </button>
                <button
                  type="button"
                  onClick={() => addRelative(selected.id, 'parent')}
                >
                  ⬆ Rodič
                </button>
              </div>

              <button
                type="button"
                className={s.delBtn}
                onClick={() => removePerson(selected.id)}
              >
                Smazat osobu
              </button>
            </aside>
          )}
        </div>
      )}
    </CollapsiblePanel>
  );
}
