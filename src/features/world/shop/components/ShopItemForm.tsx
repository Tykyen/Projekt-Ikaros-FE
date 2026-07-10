import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/shared/ui/Modal/Modal';
import { Button } from '@/shared/ui/Button/Button';
import { Input } from '@/shared/ui/Input/Input';
import { parseApiError } from '@/shared/api/client';
import { CurrencyAmountInput } from '@/features/world/currencies/shared/CurrencyAmountInput';
import type { WorldCurrencyItem } from '@/features/world/currencies/types';
import { PagePicker } from '@/features/world/pages/PageEditor/components/PagePicker';
import { usePagesDirectory } from '@/features/world/pages/api/usePagesDirectory';
import { HeroUploadCard } from '@/features/world/pages/PageEditor/components/HeroUploadCard';
import type { ImageFit } from '@/shared/lib/imageStyle';
import { useCreateShopItem, useUpdateShopItem } from '../api';
import type { ShopItem, ShopGroup, CreateShopItemInput } from '../types';
import s from './shop.module.css';

interface ShopItemFormProps {
  worldId: string;
  mode: 'add' | 'edit';
  initial?: ShopItem;
  groups: ShopGroup[];
  allItems: ShopItem[];
  currencyItems: WorldCurrencyItem[];
  /** PomocnyPJ+ smí sdílet. */
  canShare: boolean;
  onClose: () => void;
}

/** Spec 11.3 §4.2 — modal pro přidání / úpravu položky obchodu. */
export function ShopItemForm({
  worldId,
  mode,
  initial,
  groups,
  allItems,
  currencyItems,
  canShare,
  onClose,
}: ShopItemFormProps) {
  const isEdit = mode === 'edit';
  const createM = useCreateShopItem(worldId);
  const updateM = useUpdateShopItem(worldId);
  const { data: directory = [] } = usePagesDirectory(worldId);

  const topGroups = useMemo(
    () => groups.filter((g) => !g.parentId),
    [groups],
  );

  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [groupId, setGroupId] = useState(initial?.groupId ?? '');
  const [subgroupId, setSubgroupId] = useState(initial?.subgroupId ?? '');
  const [amount, setAmount] = useState<number | ''>(initial?.price ?? '');
  const [currencyCode, setCurrencyCode] = useState(
    initial?.currencyCode || currencyItems[0]?.code || '',
  );
  const [discountPercent, setDiscountPercent] = useState<number | ''>(
    initial?.discountPercent ?? '',
  );
  const [referenceLink, setReferenceLink] = useState(
    initial?.referenceLink ?? '',
  );
  const [isRecommended, setIsRecommended] = useState(
    initial?.isRecommended ?? false,
  );
  const [isShared, setIsShared] = useState(initial?.isShared ?? false);
  const [linkedItemIds, setLinkedItemIds] = useState<string[]>(
    initial?.linkedItemIds ?? [],
  );
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [imageFocalX, setImageFocalX] = useState(initial?.imageFocalX ?? 50);
  const [imageFocalY, setImageFocalY] = useState(initial?.imageFocalY ?? 50);
  const [imageZoom, setImageZoom] = useState<number | null>(
    initial?.imageZoom ?? null,
  );
  const [imageFit, setImageFit] = useState<ImageFit | null>(
    initial?.imageFit ?? null,
  );

  const subgroups = useMemo(
    () => groups.filter((g) => g.parentId === groupId),
    [groups, groupId],
  );

  const nameError = !name.trim() ? 'Název je povinný.' : undefined;
  const discError =
    discountPercent !== '' && (discountPercent < 0 || discountPercent > 100)
      ? 'Sleva musí být 0–100 %.'
      : undefined;
  const isPending = createM.isPending || updateM.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (nameError || discError) return;

    const input: CreateShopItemInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      groupId: groupId || undefined,
      subgroupId: subgroupId || undefined,
      price: amount === '' ? 0 : amount,
      currencyCode,
      discountPercent: discountPercent === '' ? 0 : discountPercent,
      referenceLink: referenceLink || undefined,
      isRecommended,
      isShared: canShare ? isShared : undefined,
      linkedItemIds,
      imageUrl: imageUrl || undefined,
      imageFocalX: imageUrl ? imageFocalX : null,
      imageFocalY: imageUrl ? imageFocalY : null,
      imageZoom: imageUrl ? imageZoom : null,
      imageFit: imageUrl ? imageFit : null,
    };

    const onOk = () => {
      toast.success(isEdit ? `Položka „${input.name}" uložena.` : `Položka „${input.name}" přidána.`);
      onClose();
    };
    const onErr = (err: unknown) => {
      toast.error(parseApiError(err));
    };

    if (isEdit && initial) {
      updateM.mutate({ id: initial.id, input }, { onSuccess: onOk, onError: onErr });
    } else {
      createM.mutate(input, { onSuccess: onOk, onError: onErr });
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? `Upravit: ${initial?.name}` : 'Nová položka'}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Zrušit
          </Button>
          <Button type="submit" form="shop-item-form" loading={isPending}>
            {isEdit ? 'Uložit' : 'Přidat'}
          </Button>
        </>
      }
    >
      <form
        id="shop-item-form"
        className={s.form}
        onSubmit={handleSubmit}
        noValidate
      >
        <Input
          label="Název"
          value={name}
          maxLength={120}
          error={nameError}
          onChange={(e) => setName(e.target.value)}
        />

        <label className={s.fieldLabel}>
          Popis (volitelný)
          <textarea
            className={s.searchInput}
            rows={2}
            value={description}
            maxLength={500}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        {/* HeroUploadCard = vlastní widget → skupinový popisek span, ne label */}
        <span className={s.fieldLabel}>
          Obrázek (volitelný)
          <HeroUploadCard
            value={imageUrl}
            onChange={setImageUrl}
            compact
            uploadCta="Nahrát obrázek zboží"
            focal={{ x: imageFocalX ?? 50, y: imageFocalY ?? 50 }}
            onFocalChange={(f) => {
              setImageFocalX(f.x);
              setImageFocalY(f.y);
            }}
            zoom={imageZoom}
            onZoomChange={setImageZoom}
            fit={imageFit}
            onFitChange={setImageFit}
          />
        </span>

        <div className={s.formRow}>
          <label className={s.fieldLabel}>
            Skupina / typ
            <select
              className={s.select}
              value={groupId}
              onChange={(e) => {
                setGroupId(e.target.value);
                setSubgroupId('');
              }}
            >
              <option value="">— nezařazeno —</option>
              {topGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>

          {subgroups.length > 0 && (
            <label className={s.fieldLabel}>
              Podskupina
              <select
                className={s.select}
                value={subgroupId}
                onChange={(e) => setSubgroupId(e.target.value)}
              >
                <option value="">— žádná —</option>
                {subgroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className={s.formRow}>
          {/* složený widget (částka + měna = víc controlů) → span, ne label */}
          <span className={s.fieldLabel}>
            Cena
            <CurrencyAmountInput
              amount={amount}
              currencyCode={currencyCode}
              onAmountChange={setAmount}
              onCurrencyChange={setCurrencyCode}
              items={currencyItems}
            />
          </span>

          <Input
            label="Sleva %"
            type="number"
            min={0}
            max={100}
            value={discountPercent}
            error={discError}
            onChange={(e) =>
              setDiscountPercent(
                e.target.value === '' ? '' : Number(e.target.value),
              )
            }
          />
        </div>

        <div className={s.pickerRow}>
          <span className={s.fieldLabel}>Odkaz na stránku světa</span>
          <PagePicker
            value={referenceLink}
            onChange={(slug) => setReferenceLink(slug)}
            directory={directory}
          />
        </div>

        {allItems.length > 0 && (
          <label className={s.fieldLabel}>
            Často kupováno s (volitelné)
            <select
              className={s.select}
              multiple
              value={linkedItemIds}
              onChange={(e) =>
                setLinkedItemIds(
                  Array.from(e.target.selectedOptions, (o) => o.value),
                )
              }
            >
              {allItems
                .filter((it) => it.id !== initial?.id)
                .map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name}
                  </option>
                ))}
            </select>
          </label>
        )}

        <label className={s.checkRow}>
          <input
            type="checkbox"
            checked={isRecommended}
            onChange={(e) => setIsRecommended(e.target.checked)}
          />
          ⭐ Doporučeno
        </label>

        {canShare && (
          <label className={s.checkRow}>
            <input
              type="checkbox"
              checked={isShared}
              onChange={(e) => setIsShared(e.target.checked)}
            />
            Sdílet s ostatními (viditelné hráčům)
          </label>
        )}
      </form>
    </Modal>
  );
}
