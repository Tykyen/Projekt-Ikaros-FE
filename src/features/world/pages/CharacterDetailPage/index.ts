// 9.1 (cleanup) — CharacterDetailPage rozpadnut: PostavaLayout (PageViewer)
// nahrazuje view, PageEditor nahrazuje edit. Tato složka teď drží jen
// sdílené subdoc tab komponenty (DiaryTab/FinanceTab/InventoryTab/
// CalendarTab/NotesTab) + jejich editory, které PostavaLayout reusuje.
export { default } from './CharacterDetailRoute';
