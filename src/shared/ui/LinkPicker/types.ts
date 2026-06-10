/**
 * 7.2n — Generický tvar položky pro `LinkPickerPopover`. Záměrně minimální,
 * aby sdílená komponenta v `shared/ui` nezávisela na `features` typech
 * (`PageDirectoryEntry` je strukturální nadmnožina → přiřadí se přímo).
 */
export interface LinkSuggestion {
  id: string;
  title: string;
  slug: string;
}
