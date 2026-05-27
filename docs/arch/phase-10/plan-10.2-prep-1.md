# Plan 10.2-prep-1 — BE Operations API + event log

**Spec:** [`Projekt-ikaros/docs/arch/maps/operations/`](../../../../Projekt-ikaros/docs/arch/maps/operations/) (8 souborů per spec-guide konvenci)
**Status:** ✅ **HOTOVO** — všech 11 commitů merge-nuto na main (2026-05-27)
**Velikost:** **L** (cca 35 nových souborů, 8 modifikovaných, 2 nová Mongo schémata, 2 nové kolekce, ~60 unit + e2e testů)
**Cíl:** BE foundation pro celou fázi 10.2 — atomic operations API, server-side event log, per-player scene assignment, WS auth middleware, cascade token cleanup.

---

## 1 — Pořadí změn (commits přímo na `main` dle [[feedback_work_on_main]])

| Commit | Co | Klíčové soubory | Závisí na |
|---|---|---|---|
| **C1** | Schemas + indexy (foundation) | `map-operation.schema.ts`, `world-operation.schema.ts`, ext. `MapScene/World/WorldMembership` | — |
| **C2** | Operations repositories (Mongo atomic primitives) | `map-operations.repository.ts`, `world-operations.repository.ts`, interfaces | C1 |
| **C3** | DTOs + payload validator | `dto/operations/*.dto.ts` (18 souborů), `operation-payload-validator.ts` | — (paralelně s C1-C2) |
| **C4** | Authorization (`assertCanDo` + `assertCanDoWorldOp`) | `operations-authorizer.service.ts` | C3 |
| **C5** | MapOperationsService — apply + inverse (per-scene ops) | `map-operations.service.ts` | C1, C2, C3, C4 |
| **C6** | WorldOperationsService + cascade | `world-operations.service.ts` + cross-module wiring | C5 |
| **C7** | Controllers (POST/GET endpointy) | rozšíření `maps.controller.ts`, nový `world-operations.controller.ts` | C5, C6 |
| **C8** | Gateway WS — auth middleware + emit handlers | rozšíření `maps.gateway.ts`, nový `worlds.gateway.ts` rozšíření | C5, C6 |
| **C9** | `MapsService.findActive` per-user resolution | mod. `maps.service.ts` | C1 (membership field) |
| **C10** | Unit + e2e testy | `*.spec.ts`, `e2e/*.e2e-spec.ts` | C5, C6, C7, C8 |
| **C11** | Swagger annotations, deprecated marks, prettier+lint | swagger metadata, cleanup | C7 |

**Velikostně:** C1, C3 paralelní (lze v 1 sezení). C5+C6 je core (1 dlouhý sezení). C8 je tricky (auth middleware + cross-module emits). C10 je nejdelší časově.

⚠️ **`feedback_be_precommit_prettier`:** před každým commitem `pnpm prettier --write` v backend repu.
⚠️ **`feedback_be_restart_required`:** po každém BE commitu restart `nest --watch` (jinak FE pořád vidí starý bundle, whitelist ValidationPipe tiše drop neznámé fields).
⚠️ **`feedback_no_debt`:** žádný commit nesmí pushnout částečnou implementaci. Pokud op typ není dokončený end-to-end (validator + authorizer + service + test), nepushuj.

---

## 2 — Detail změn

### C1 — Schemas + indexy (foundation)

**Nové soubory:**

**`backend/src/modules/maps/schemas/map-operation.schema.ts`** *(nový)*
```ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MapOperationDocument = HydratedDocument<MapOperationSchemaClass>;

@Schema({ timestamps: false, collection: 'mapOperations' })
export class MapOperationSchemaClass {
  @Prop({ required: true, index: true }) sceneId: string;
  @Prop({ required: true, index: true }) worldId: string;
  @Prop({ required: true }) seqNumber: number;
  @Prop({ type: Object, required: true }) op: Record<string, unknown>;
  @Prop({ type: Object, default: null }) inverse: Record<string, unknown> | null;
  @Prop({ required: true }) byUserId: string;
  @Prop({ type: Number, required: true }) byUserRole: number;
  @Prop({ required: true, expires: 60 * 60 * 24 * 30 }) appliedAt: Date; // TTL 30 dní
}

export const MapOperationSchema = SchemaFactory.createForClass(MapOperationSchemaClass);
MapOperationSchema.index({ sceneId: 1, seqNumber: 1 }, { unique: true });
MapOperationSchema.index({ sceneId: 1, byUserId: 1, seqNumber: -1 });
```

**`backend/src/modules/worlds/schemas/world-operation.schema.ts`** *(nový)*
```ts
@Schema({ timestamps: false, collection: 'worldOperations' })
export class WorldOperationSchemaClass {
  @Prop({ required: true, index: true }) worldId: string;
  @Prop({ required: true }) seqNumber: number;
  @Prop({ type: Object, required: true }) op: Record<string, unknown>;
  @Prop({ type: Object, default: null }) inverse: Record<string, unknown> | null;
  @Prop({ required: true }) byUserId: string;
  @Prop({ type: Number, required: true }) byUserRole: number;
  @Prop({ required: true, expires: 60 * 60 * 24 * 30 }) appliedAt: Date;
  @Prop({ type: [String], default: [] }) cascadeMapOpIds: string[]; // ObjectIds jako strings
}

export const WorldOperationSchema = SchemaFactory.createForClass(WorldOperationSchemaClass);
WorldOperationSchema.index({ worldId: 1, seqNumber: 1 }, { unique: true });
WorldOperationSchema.index({ worldId: 1, byUserId: 1, seqNumber: -1 });
```

**Modifikace stávajících schemas:**

**`backend/src/modules/maps/schemas/map-scene.schema.ts`** — přidat 1 pole:
```ts
@Prop({ default: 0 }) lastSeqNumber: number;
```

**`backend/src/modules/worlds/schemas/world.schema.ts`** — přidat 1 pole:
```ts
@Prop({ default: 0 }) lastSeqNumber: number;
```

**`backend/src/modules/worlds/schemas/world-membership.schema.ts`** — přidat 1 pole:
```ts
@Prop({ default: null }) currentSceneId: string | null;
```
Nový index:
```ts
WorldMembershipSchema.index({ worldId: 1, currentSceneId: 1 });
```

**Acceptance:**
- `pnpm build` projde
- Migration script není potřeba (Mongoose dohydratuje defaulty per-doc)
- Mongo shell: `db.mapOperations.getIndexes()` ukazuje 3 indexy (default `_id`, primární `sceneId+seqNumber`, undo lookup)
- Po spuštění BE: kolekce se vytvoří lazy při prvním insertu

**Commit message:**
```
feat(10.2-prep-1): schemas pro mapOperations + worldOperations + per-scene assignment

- nová kolekce mapOperations (per-scene event log)
- nová kolekce worldOperations (cross-scene log)
- MapScene/World.lastSeqNumber (atomic counter)
- WorldMembership.currentSceneId (per-player scene)
- TTL 30 dní na obou logových kolekcích
```

---

### C2 — Operations repositories

**Nové soubory:**

**`backend/src/modules/maps/interfaces/map-operations-repository.interface.ts`**
```ts
export interface IMapOperationsRepository {
  allocateSeqNumber(sceneId: string): Promise<number>;
  appendOperation(record: Omit<MapOperationRecord, 'seqNumber'>): Promise<MapOperationRecord>;
  findSince(sceneId: string, since: number, limit: number): Promise<MapOperationRecord[]>;
  findLastByUser(sceneId: string, userId: string, limit: number): Promise<MapOperationRecord[]>;
}
```

**`backend/src/modules/maps/repositories/map-operations.repository.ts`**

Klíčová metoda `allocateSeqNumber`:
```ts
async allocateSeqNumber(sceneId: string): Promise<number> {
  const result = await this.sceneModel
    .findByIdAndUpdate(sceneId, { $inc: { lastSeqNumber: 1 } }, { new: true })
    .lean()
    .exec();
  if (!result) throw new NotFoundException({ code: 'MAP_SCENE_NOT_FOUND', message: 'Scéna nenalezena' });
  return result.lastSeqNumber;
}
```

`appendOperation` jen `model.create(record)`. `findSince` standardní `find().sort({seqNumber:1}).limit()`.

**`backend/src/modules/worlds/interfaces/world-operations-repository.interface.ts`** — paralelní.
**`backend/src/modules/worlds/repositories/world-operations.repository.ts`** — paralelní, allocateSeqNumber pracuje s `World` kolekcí.

**`backend/src/modules/maps/maps.module.ts`** — přidat:
- `MongooseModule.forFeature([{ name: MapOperationSchemaClass.name, schema: MapOperationSchema }])`
- Provider `{ provide: 'IMapOperationsRepository', useClass: MongoMapOperationsRepository }`

**`backend/src/modules/worlds/worlds.module.ts`** — analogicky.

**Acceptance:**
- Unit test pro `allocateSeqNumber`: 2 paralelní volání vrátí 2 různá čísla (1, 2)
- Unit test `appendOperation` insert ok
- Unit test `findSince` ascending order

**Commit message:**
```
feat(10.2-prep-1): operations repositories (allocate seqNumber atomic)
```

---

### C3 — DTOs + payload validator

**Adresářová struktura:**
```
backend/src/modules/maps/dto/operations/
├─ base.ts                     (OperationType enum, discriminator helper)
├─ token-add.dto.ts            (TokenAddOpDto)
├─ token-move.dto.ts           (TokenMoveOpDto)
├─ token-remove.dto.ts
├─ token-update.dto.ts
├─ effect-add.dto.ts
├─ effect-remove.dto.ts
├─ effect-update.dto.ts
├─ fog-set.dto.ts
├─ fog-brush.dto.ts
├─ scene-state.dto.ts
├─ scene-config.dto.ts
├─ scene-image.dto.ts
├─ scene-name.dto.ts
├─ scene-folder.dto.ts
├─ sound-playlist.dto.ts
├─ combat-start.dto.ts
├─ combat-turn.dto.ts
├─ combat-end.dto.ts
├─ combat-effect-add.dto.ts
├─ combat-effect-remove.dto.ts
├─ npc-template-add.dto.ts
├─ npc-template-remove.dto.ts
├─ npc-template-update.dto.ts
└─ index.ts                    (MAP_OPERATION_DTOS registry)
```

Příklad `token-move.dto.ts`:
```ts
import { Equals, IsString, IsNotEmpty, IsInt, Min, Max } from 'class-validator';

export class TokenMoveOpDto {
  @Equals('token.move') type!: 'token.move';
  @IsString() @IsNotEmpty() tokenId!: string;
  @IsInt() @Min(-10000) @Max(10000) q!: number;
  @IsInt() @Min(-10000) @Max(10000) r!: number;
}
```

`backend/src/modules/maps/dto/operations/index.ts`:
```ts
export const MAP_OPERATION_DTOS: Record<string, ClassType> = {
  'token.add': TokenAddOpDto,
  'token.move': TokenMoveOpDto,
  // ... všechny per typ z data-models.md
};
```

**`backend/src/modules/worlds/dto/operations/`** — paralelní pro `member.*`:
- `member-assign-to-scene.dto.ts`
- `member-unassign.dto.ts`
- `member-bulk-assign-to-scene.dto.ts`
- `index.ts` → `WORLD_OPERATION_DTOS`

**`backend/src/modules/maps/operations/operation-payload-validator.service.ts`**
```ts
@Injectable()
export class OperationPayloadValidator {
  validateMapOp(input: unknown): MapOperationPayload {
    if (!input || typeof input !== 'object' || !('type' in input)) {
      throw new BadRequestException({ code: 'MAP_OP_INVALID', message: 'Chybí op.type' });
    }
    const dtoClass = MAP_OPERATION_DTOS[(input as { type: string }).type];
    if (!dtoClass) throw new BadRequestException({ code: 'MAP_OP_INVALID', message: `Neznámý typ ${(input as any).type}` });
    const instance = plainToInstance(dtoClass, input);
    const errors = validateSync(instance, { whitelist: true, forbidNonWhitelisted: false });
    if (errors.length > 0) throw new BadRequestException({ code: 'MAP_OP_INVALID', message: formatErrors(errors) });
    return instance as MapOperationPayload;
  }

  validateWorldOp(input: unknown): WorldOperationPayload {
    // analogicky, WORLD_OPERATION_DTOS
  }
}
```

**Acceptance:**
- Per `tests.md` § `OperationPayloadValidator` — 11 scénářů zelené
- `pnpm test maps/operation-payload-validator` projde

**Commit message:**
```
feat(10.2-prep-1): DTOs + payload validator pro 21 typů operací
```

---

### C4 — Authorization

**`backend/src/modules/maps/operations/operations-authorizer.service.ts`**

Plná implementace per `security.md` § `assertCanDo` + `assertCanDoWorldOp`. Volá `IWorldMembershipRepository.findByUserAndWorld`.

⚠️ **Pozor — `feedback_platform_vs_world_roles`:** Sa/Admin = globální role (`UserRole`); PJ = world role (`WorldMembership.role >= WorldRole.PJ`). Mixování zakázané.

**Acceptance:**
- Per `tests.md` § `MapsService.assertCanDo` — 17 scénářů zelené
- Hráč na cizí token → throw `MAP_OP_FORBIDDEN`
- Hráč na vlastní `token.update` patch `currentHp` → ok
- Hráč na vlastní `token.update` patch `armor` → throw
- Hráč self-`member.unassign` → ok
- Hráč cizí-`member.assignToScene` → throw

**Commit message:**
```
feat(10.2-prep-1): operations authorizer (per-op role/ownership matice)
```

---

### C5 — MapOperationsService — apply + inverse (per-scene)

**`backend/src/modules/maps/operations/map-operations.service.ts`** — největší soubor v této spec.

Veřejné API:
```ts
@Injectable()
export class MapOperationsService {
  async apply(sceneId: string, rawOp: unknown, user: RequestUser): Promise<{
    seqNumber: number;
    appliedAt: Date;
    op: MapOperationPayload;
    inverse: MapOperationPayload | null;
  }> {
    // 1. Validate
    const op = this.validator.validateMapOp(rawOp);
    // 2. Load scene snapshot (potřebujeme pro inverse + authorizer)
    const scene = await this.mapsRepo.findById(sceneId);
    if (!scene) throw new NotFoundException({ code: 'MAP_SCENE_NOT_FOUND', ... });
    // 3. Authorize
    await this.authorizer.assertCanDo(user, scene, op);
    // 4. Compute inverse (snapshot relevant state)
    const inverse = this.computeInverse(scene, op);
    // 5. Atomic Mongo update
    await this.applyAtomic(sceneId, op);
    // 6. Allocate seqNumber + append log
    const seqNumber = await this.opsRepo.allocateSeqNumber(sceneId);
    const record = await this.opsRepo.appendOperation({
      sceneId, worldId: scene.worldId, op, inverse,
      byUserId: user.id, byUserRole: user.role, appliedAt: new Date(),
    });
    return { seqNumber, appliedAt: record.appliedAt, op, inverse };
  }

  async findSince(sceneId, since, limit) {
    return this.opsRepo.findSince(sceneId, since, limit);
  }
}
```

**Implementace `applyAtomic` per typ:**

Switch na `op.type`, per case Mongo update operation. Příklad:
```ts
case 'token.move':
  await this.mapsRepo.atomicUpdate(
    { _id: sceneId, 'tokens.id': op.tokenId },
    { $set: { 'tokens.$.q': op.q, 'tokens.$.r': op.r, lastModified: new Date() } },
  );
  // Pokud Mongo vrátí matchedCount=0 → token nenalezen
  break;
case 'token.add':
  await this.mapsRepo.atomicUpdate({ _id: sceneId }, { $push: { tokens: op.token }, $set: { lastModified: new Date() } });
  break;
case 'token.remove':
  await this.mapsRepo.atomicUpdate({ _id: sceneId }, { $pull: { tokens: { id: op.tokenId } } });
  break;
// ... 18 dalších cases
```

`atomicUpdate` přidat do `IMapsRepository`:
```ts
atomicUpdate(filter: FilterQuery<MapScene>, update: UpdateQuery<MapScene>): Promise<{matched: number; modified: number}>;
```

**Implementace `computeInverse` per typ:**

Per case generuj inverse z snapshot scény. Příklad:
```ts
case 'token.move': {
  const token = scene.tokens.find(t => t.id === op.tokenId);
  if (!token) return null; // token zmizel mezi load a inverse compute (race) — explicit no-inverse
  return { type: 'token.move', tokenId: op.tokenId, q: token.q, r: token.r };
}
case 'token.remove': {
  const token = scene.tokens.find(t => t.id === op.tokenId);
  if (!token) return null;
  return { type: 'token.add', token }; // full snapshot
}
// ...
```

**Speciální případy:**
- `combat.effect.tick` → `inverse: null` (interní)
- `npcTemplate.remove` s cascade → inverse je composite (TBD: array nebo single `npcTemplate.addWithRestore`); v MVP — composite array as inverse, doc TODO.

**Acceptance:**
- Per `tests.md` § `MapsService.applyOperation` — 15+ scénářů zelené
- Atomic update test: `tokens.$.q` skutečně updatuje konkrétní subdoc, ne celé `tokens` array
- 2 paralelní `token.move` na různé tokeny současně → oba úspěšné

**Commit message:**
```
feat(10.2-prep-1): MapOperationsService apply + inverse compute (21 typů)
```

---

### C6 — WorldOperationsService + cascade

**`backend/src/modules/worlds/operations/world-operations.service.ts`**

```ts
@Injectable()
export class WorldOperationsService {
  constructor(
    @Inject('IWorldOperationsRepository') private opsRepo: IWorldOperationsRepository,
    @Inject('IWorldMembershipRepository') private membershipRepo: IWorldMembershipRepository,
    @Inject('IMapsRepository') private mapsRepo: IMapsRepository,
    private mapOps: MapOperationsService,  // cross-module dep
    private authorizer: OperationsAuthorizer,
    private validator: OperationPayloadValidator,
  ) {}

  async apply(worldId: string, rawOp: unknown, user: RequestUser): Promise<{...}> {
    const op = this.validator.validateWorldOp(rawOp);
    await this.authorizer.assertCanDoWorldOp(user, worldId, op);

    const cascadeMapOpIds: string[] = [];

    switch (op.type) {
      case 'member.assignToScene':
        cascadeMapOpIds.push(...await this.handleAssignToScene(worldId, op, user));
        break;
      case 'member.unassign':
        cascadeMapOpIds.push(...await this.handleUnassign(worldId, op, user));
        break;
      case 'member.bulkAssignToScene':
        cascadeMapOpIds.push(...await this.handleBulkAssign(worldId, op, user));
        break;
    }

    // Compute inverse (per typ — pro assignToScene drží oldSceneId)
    const inverse = await this.computeInverse(worldId, op);

    // Allocate worldOperations seqNumber + log
    const seqNumber = await this.opsRepo.allocateSeqNumber(worldId);
    const record = await this.opsRepo.appendOperation({
      worldId, op, inverse, byUserId: user.id, byUserRole: user.role,
      appliedAt: new Date(), cascadeMapOpIds,
    });

    return { seqNumber, appliedAt: record.appliedAt, op, inverse, cascadeMapOpIds };
  }

  private async handleAssignToScene(worldId, op, user): Promise<string[]> {
    // 1. validate sceneId ∈ worldId
    const newScene = await this.mapsRepo.findById(op.sceneId);
    if (!newScene || newScene.worldId !== worldId)
      throw new ConflictException({ code: 'MAP_MEMBER_NOT_IN_WORLD', ... });

    // 2. validate userId je member tohoto světa
    const membership = await this.membershipRepo.findByUserAndWorld(op.userId, worldId);
    if (!membership) throw new NotFoundException({ code: 'MAP_MEMBER_NOT_FOUND', ... });

    const oldSceneId = membership.currentSceneId;
    const cascadeIds: string[] = [];

    // 3. cascade token.remove na staré scéně (pokud hráč tam měl token)
    if (oldSceneId) {
      const oldScene = await this.mapsRepo.findById(oldSceneId);
      const oldToken = oldScene?.tokens.find(t => t.characterId === op.userId && !t.isNpc);
      if (oldToken) {
        const cascade = await this.mapOps.apply(
          oldSceneId,
          { type: 'token.remove', tokenId: oldToken.id },
          user,  // PJ context
        );
        cascadeIds.push(cascade.recordId);  // TODO: api.md říká cascadeMapOpIds → ObjectId; přidat recordId return v MapOperationsService.apply
      }
    }

    // 4. atomic update membership
    await this.membershipRepo.atomicUpdate(
      { userId: op.userId, worldId },
      { $set: { currentSceneId: op.sceneId } },
    );

    return cascadeIds;
  }

  private async handleUnassign(...) { /* analogicky bez nového sceneId */ }
  private async handleBulkAssign(...) { /* loop přes userIds + atomic bulkWrite + N cascades */ }
}
```

⚠️ **Cross-module circular dep risk:** `WorldsModule` importuje `MapsModule` (pro `MapOperationsService` + `IMapsRepository`). `MapsModule` NESMÍ importovat `WorldsModule` přímo — pokud potřebuje membership, vystavit `WorldMembershipsModule` jako granulárnější (per `ai-notes.md` § cross-module). Pokud kruh nelze obejít, `forwardRef()` jen pro 1 provider.

**Acceptance:**
- Per `tests.md` § Cross-scene assignment — 9 scénářů zelené
- assignToScene → 1 worldOperation insert + 1 mapOperation insert (cascade) + WorldMembership.currentSceneId updated
- bulkAssign pro 5 hráčů → 1 worldOperation + N cascade mapOperations (per affected old scene)
- Member.unassign self-call → ok (graceful leave)

**Commit message:**
```
feat(10.2-prep-1): WorldOperationsService + cascade token.remove na staré scéně
```

---

### C7 — Controllers (POST/GET endpointy)

**Modifikace `backend/src/modules/maps/maps.controller.ts`:**

Přidat:
```ts
@ApiOperation({ summary: 'Aplikace operace na scénu' })
@ApiResponse({ status: 201, description: 'Operace aplikována' })
@Post(':id/operations')
@UseGuards(JwtAuthGuard)
async applyOperation(
  @Param('id') sceneId: string,
  @Body() op: unknown,
  @CurrentUser() user: RequestUser,
) {
  return this.mapOps.apply(sceneId, op, user);
}

@ApiOperation({ summary: 'Catch-up operations od seqNumber' })
@Get(':id/operations')
@UseGuards(JwtAuthGuard)
async getOperationsSince(
  @Param('id') sceneId: string,
  @Query('since') sinceStr: string = '0',
  @Query('limit') limitStr: string = '500',
  @CurrentUser() user: RequestUser,
) {
  const since = parseInt(sinceStr, 10) || 0;
  const limit = Math.min(parseInt(limitStr, 10) || 500, 1000);
  // Read access check
  await this.mapOps.assertCanRead(sceneId, user);
  const operations = await this.mapOps.findSince(sceneId, since, limit);
  const scene = await this.mapsService.findById(sceneId);
  return { sceneId, lastSeqNumber: scene.lastSeqNumber, operations };
}
```

Mark deprecated:
```ts
@ApiOperation({ summary: 'Přesun tokenu', deprecated: true })
@Patch(':id/move-token')
@UseGuards(JwtAuthGuard)
moveToken(...) { ... }  // zachovat funkčnost
```

Stejně `remove-token` a `PUT /:id`.

**Nový `backend/src/modules/worlds/world-operations.controller.ts`:**
```ts
@ApiTags('WorldOperations')
@ApiBearerAuth()
@Controller('worlds')
export class WorldOperationsController {
  constructor(private worldOps: WorldOperationsService) {}

  @Post(':worldId/operations')
  @UseGuards(JwtAuthGuard)
  async apply(@Param('worldId') worldId: string, @Body() op: unknown, @CurrentUser() user: RequestUser) {
    return this.worldOps.apply(worldId, op, user);
  }

  @Get(':worldId/operations')
  @UseGuards(JwtAuthGuard)
  async getSince(@Param('worldId') worldId: string, @Query('since') since: string = '0',
                 @Query('limit') limit: string = '200', @CurrentUser() user: RequestUser) {
    await this.worldOps.assertCanRead(worldId, user); // PJ-only
    const sinceN = parseInt(since, 10) || 0;
    const limitN = Math.min(parseInt(limit, 10) || 200, 500);
    const operations = await this.worldOps.findSince(worldId, sinceN, limitN);
    const world = await this.worldsService.findById(worldId);
    return { worldId, lastSeqNumber: world.lastSeqNumber, operations };
  }
}
```

Register v `WorldsModule.controllers`.

**Acceptance:**
- `POST /maps/:id/operations` s validní op vrátí 201 + payload se seqNumber, op, inverse
- `GET /maps/:id/operations?since=0&limit=500` vrátí 200 + sorted operations
- `POST /worlds/:id/operations` s member.assignToScene vrátí 201 + cascadeMapOpIds
- `GET /worlds/:id/operations` jako hráč → 403
- Stávající `PATCH /:id/move-token` stále funguje (deprecated)

**Commit message:**
```
feat(10.2-prep-1): controllers — POST/GET /operations endpointy
```

---

### C8 — Gateway WS — auth middleware + emit handlers

Toto je **nejcitlivější commit** — opravujeme bug-A (atomic) plus bug-B (gateway bez auth).

**Modifikace `backend/src/modules/maps/maps.gateway.ts`:**

Přidat Socket.io auth middleware v `afterInit` hook:
```ts
@WebSocketGateway({ cors: { origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' } })
export class MapsGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;
  
  constructor(private jwtService: JwtService) {}

  afterInit(server: Server) {
    server.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token) throw new Error('No token');
        const payload = await this.jwtService.verifyAsync(token);
        socket.data.user = { id: payload.sub, role: payload.role };
        next();
      } catch (err) {
        next(new Error('Unauthorized'));
      }
    });
  }

  @SubscribeMessage('map:join')
  async handleJoin(@MessageBody() sceneId: string, @ConnectedSocket() client: Socket) {
    // Validate user je member daného světa scény
    const scene = await this.mapsService.findById(sceneId);
    if (!scene) { client.emit('error', { code: 'MAP_SCENE_NOT_FOUND' }); return; }
    const membership = await this.membershipRepo.findByUserAndWorld(client.data.user.id, scene.worldId);
    if (!membership) { client.emit('error', { code: 'MAP_FORBIDDEN' }); return; }
    void client.join(sceneId);
  }

  @SubscribeMessage('map:join-world')
  async handleJoinWorld(@MessageBody() worldId: string, @ConnectedSocket() client: Socket) {
    // PJ-only — pro orchestrator panel
    const membership = await this.membershipRepo.findByUserAndWorld(client.data.user.id, worldId);
    if (!membership || membership.role < WorldRole.PJ) {
      client.emit('error', { code: 'MAP_FORBIDDEN' }); return;
    }
    void client.join(`world:${worldId}`);
  }

  // Emit metody volané z MapOperationsService:
  emitMapOperation(sceneId: string, payload: any) {
    this.server.to(sceneId).emit('map:operation', payload);
  }

  emitWorldOperation(worldId: string, payload: any) {
    this.server.to(`world:${worldId}`).emit('world:operation', payload);
  }

  emitMemberJoined(sceneId: string, userId: string, characterName: string) {
    this.server.to(sceneId).emit('map:member-joined', { sceneId, userId, characterName });
  }

  emitMemberLeft(sceneId: string, userId: string) {
    this.server.to(sceneId).emit('map:member-left', { sceneId, userId });
  }

  // Private emit hráči (lookup přes userId → socket)
  emitReassigned(userId: string, newSceneId: string | null) {
    // Najdi socket(s) tohoto usera
    const sockets = [...this.server.sockets.sockets.values()].filter(s => s.data.user?.id === userId);
    for (const s of sockets) s.emit('map:reassigned', { newSceneId });
  }
}
```

Stávající legacy handlery (`map:token-moved`, `map:effect-added`, …) ZACHOVAT s relay; po stabilizaci 10.2 se odstraní.

**`MapOperationsService.apply`** & **`WorldOperationsService.apply`** **konec metody**: volat `this.gateway.emitMapOperation(...)` resp. cascadu eventů.

**Acceptance:**
- WS connection bez JWT → disconnect/error event (per tests.md)
- `map:join` na neznámou scénu → error event
- `map:join` jako non-member → error event
- `POST /maps/:id/operations` → emit `map:operation` na room sceneId (kontrolovat e2e test)
- `POST /worlds/:id/operations member.assignToScene` → 4 paralelní eventy (map:operation cascade, member-left, member-joined, world:operation) + private map:reassigned

**Commit message:**
```
feat(10.2-prep-1): WS gateway — JWT auth middleware + map:operation/world:operation emit
```

---

### C9 — `MapsService.findActive` per-user resolution

**Modifikace `backend/src/modules/maps/maps.service.ts`:**

```ts
async findActive(worldId: string, userId: string): Promise<MapScene> {
  const membership = await this.membershipRepo.findByUserAndWorld(userId, worldId);
  if (!membership?.currentSceneId) {
    throw new NotFoundException({ code: 'MAP_NO_ACTIVE_SCENE', message: 'PJ ti ještě nepřiřadil scénu' });
  }
  const scene = await this.repo.findById(membership.currentSceneId);
  if (!scene) {
    throw new NotFoundException({ code: 'MAP_NO_ACTIVE_SCENE', message: 'Přiřazená scéna byla smazána' });
  }
  return this.enrichTokens(scene);
}
```

**Modifikace `backend/src/modules/maps/maps.controller.ts`:**
```ts
@Get('active')
@UseGuards(JwtAuthGuard)
findActive(@Query('worldId') worldId: string, @CurrentUser() user: RequestUser) {
  return this.service.findActive(worldId, user.id);
}
```

**Modifikace `setActive` semantika:**
Stávající `MapsService.setActive` deaktivoval sourozence; přepsat:
```ts
async setActive(id: string, worldId: string): Promise<void> {
  // Just flip flag; ne-deactivate sourozenců (víc paralelně aktivních je vlastnost)
  await this.repo.atomicUpdate({ _id: id }, { $set: { isActive: true } });
}
```

**Přidat metoda `findActiveScenes`:**
```ts
async findActiveScenes(worldId: string): Promise<MapScene[]> {
  return this.repo.findManyByQuery({ worldId, isActive: true });
}
```

**`GET /maps?worldId=&isActive=true` controller:**
```ts
@Get()
findByWorld(@Query('worldId') worldId: string, @Query('isActive') isActive?: string) {
  if (isActive === 'true') return this.service.findActiveScenes(worldId);
  return this.service.findByWorld(worldId);
}
```

**Acceptance:**
- Per `tests.md` § `GET /maps/active per-user resolution` — 5 scénářů zelené
- Hráč s currentSceneId=A → vrací A
- Hráč bez currentSceneId → 404 MAP_NO_ACTIVE_SCENE
- PJ orchestrator `GET /maps?worldId=&isActive=true` vrací list aktivních

**Commit message:**
```
feat(10.2-prep-1): per-user findActive (přes WorldMembership.currentSceneId)
```

---

### C10 — Unit + e2e testy

**Soubory:**
- `backend/src/modules/maps/operations/operation-payload-validator.service.spec.ts`
- `backend/src/modules/maps/operations/operations-authorizer.service.spec.ts`
- `backend/src/modules/maps/operations/map-operations.service.spec.ts`
- `backend/src/modules/worlds/operations/world-operations.service.spec.ts`
- `backend/src/modules/maps/repositories/map-operations.repository.spec.ts` (s `MongoMemoryServer`)
- `backend/test/maps-operations.e2e-spec.ts` (full stack)

Pokrýt všech ~60 scénářů z `tests.md`. Doporučuju ~70 % unit + 30 % e2e.

**Acceptance:**
- `pnpm test maps` → 100% pass
- `pnpm test:e2e` → 100% pass
- Žádný snapshot ne-updatovaný (verify diff je čistý)
- Race test (50 paralelních clients) → seqNumber unique, žádné gaps

**Commit message:**
```
test(10.2-prep-1): unit + e2e testy operations API (~60 scénářů)
```

---

### C11 — Swagger annotations, deprecated marks, prettier+lint

- Doplnit `@ApiOperation`, `@ApiResponse` na všech nových endpointech
- Označit deprecated endpointy `@ApiOperation({deprecated: true})`
- Aktualizovat `Projekt-ikaros/docs/arch/maps/index.md` (pokud existuje) — link na `operations/`
- `pnpm prettier --write` v BE
- `pnpm lint --fix`
- Verify `pnpm build` projde, `pnpm test` projde, `pnpm test:e2e` projde

**Commit message:**
```
docs(10.2-prep-1): swagger annotations + cleanup
```

---

## 3 — Závěrečný checklist

- [ ] `pnpm build` BE prochází bez warning
- [ ] `pnpm lint` BE prochází bez warning (per [[feedback_preexist_debt_owned]] vyřešit i pre-existující warnings v dotčených souborech)
- [ ] `pnpm test` BE projde, vč. nových testů
- [ ] `pnpm test:e2e` BE projde
- [ ] **Smoke test 1**: REST — POST `/maps/:id/operations` s `token.move` → 201 + log insert + Mongo `tokens.$.q` updated
- [ ] **Smoke test 2**: WS — klient s validním JWT připojí se na `/api/socket.io`, emit `map:join`, dostane confirmaci join; emit `map:operation` jako reakce na druhého klienta posílajícího POST
- [ ] **Smoke test 3**: Cross-scene cascade — `member.assignToScene` z mapa1 → mapa2, token Matrixáře zmizí z mapa1 (verify v DB), WorldMembership.currentSceneId updated, 4 WS eventy emitted
- [ ] **Smoke test 4**: Auth — WS bez JWT odmítnut; REST bez JWT 401
- [ ] **Smoke test 5**: Per-user findActive — hráč A s currentSceneId=mapa1 dostane mapa1, hráč B s currentSceneId=mapa2 dostane mapa2
- [ ] `Projekt-ikaros/docs/arch/maps/operations/index.md` exists (vytvořeno v spec fázi)
- [ ] `Projekt-ikaros-FE/docs/roadmap-fe.md` — odškrtnout `10.2-prep-1` v sekci 10.2 (přidat zaškrtnuté)
- [ ] `dluhy.md` aktualizováno pokud něco zůstalo (legacy endpointy markované jako TODO remove po release 10.2)

---

## 4 — Commit strategie

Per-step samostatný commit (C1..C11). Každý commit:
- Samostatně revertovatelný (build + test pass per commit)
- Commit message: konvence `feat(10.2-prep-1): <stručný popis>` nebo `test(10.2-prep-1): ...` / `docs(10.2-prep-1): ...`
- Body popis: co se mění, proč, závisí na čem (z této tabulky)
- Co-Authored-By per Claude Code konvenci

**Po C7 (controllers ready)** — možná hodnota mid-PR push pro **manuální smoke test PJ-em** přes Postman/Swagger UI, než pokračuji s C8 (WS). Pojistka, že REST cesta je správně před přepojováním klientů.

⚠️ **Rollback strategy:** Pokud po deploy se ukáže že atomic update nepokrývá nějaký edge case, klient FE 10.2 zatím není releaseová verze — uživatelé používají stávající FE (Matrix-style nebo placeholder). Tj. revert per commit je low-risk; ostatní moduly nedotčené.

---

## 5 — Odhad času

| Fáze | Optimistický | Realistický | Riziko |
|---|---|---|---|
| C1 schemas | 30 min | 1 h | low |
| C2 repositories | 1 h | 2 h | low |
| C3 DTOs + validator | 2 h | 3 h | low (mechanická práce) |
| C4 authorizer | 1 h | 2 h | low |
| C5 MapOperationsService | 3 h | 5 h | **medium** — 21 typů, atomic per typ, inverse compute |
| C6 WorldOperationsService + cascade | 2 h | 4 h | **medium** — cross-module dep, race scenarios |
| C7 controllers | 1 h | 2 h | low |
| C8 gateway + WS auth | 2 h | 4 h | **high** — JWT middleware integration, private emit, socket lookup |
| C9 findActive per-user | 30 min | 1 h | low |
| C10 testy | 4 h | 8 h | **medium** — 60 scénářů, e2e setup |
| C11 cleanup | 1 h | 1 h | low |
| **Celkem** | **18 h** | **33 h** | — |

Realistický odhad: **~4 dny soustředěné práce** pro jednu osobu. Lze paralelizovat C1+C3, C2 čeká na C1.

---

## 6 — Otevřené otázky / pre-decisions z spec

Z spec `tests.md` § Open questions:

1. **Counter rollback při op fail po inc:** akceptuji gap v sekvenci (jednodušší). Klient catch-up to ustojí.
2. **Legacy `PUT /maps/:id` bridging:** v MVP **jeden composite op** `scene.legacyReplace { fullScene }` s inverse `{type:'scene.legacyReplace', fullScene:<old>}`. Post-MVP rozložit do diff ops.
3. **`POST /maps/:id/active` přes operations API:** **NE** — zachovat jako samostatný endpoint (cross-scene flip flag, single op model by byl awkward).
4. **`npcTemplate.remove` cascade:** **composite op** `npcTemplate.removeWithCascade { templateId, affectedTokenIds }` s inverse jako array. Implementačně 1 záznam v logu, 1 inverse pole.
5. **`member.bulkAssignToScene` jako 1 op vs N ops:** **1 op s polem userIds**, cascade vyrobí N `token.remove` ops do mapOperations.

Pokud máš jiný názor na 1-5, řekni před startem C1, jinak postupuji per doporučení.

---

> 📝 **Tento plán je živý dokument.** Pokud při impl narazím na neočekávaný blocker, dokumentuji ho zde + řešení. Status header updatuju (`DRAFT` → `IN PROGRESS` → `DONE`).
