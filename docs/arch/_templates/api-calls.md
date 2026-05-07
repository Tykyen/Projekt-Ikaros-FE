# API volání

## <NázevVolání>

**Metoda:** `GET | POST | PUT | PATCH | DELETE`
**Cesta:** `/api/<cesta>`
**Hook:** `use<NázevHooku>()` v `src/api/hooks/`

### Kdy se volá

(Trigger — při mountu, při akci uživatele, atd.)

### Vstup

```typescript
// Request body nebo query params
```

### Výstup

```typescript
// Response typ
```

### Chybové stavy které FE ošetřuje

| HTTP kód | Co FE udělá |
|----------|-------------|
| 400 | (popis) |
| 401 | redirect na /login (axios interceptor) |
| 403 | (popis) |

---

(Opakuj sekci pro každé další volání.)
