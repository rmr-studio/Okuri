# Copilot Instructions for Okuri Core Service

Concise, project-specific guidance for AI coding agents working in this Kotlin/Spring Boot monolith. Focus on existing patterns—avoid speculative architectures.

## Architecture Overview
- Single Spring Boot service (`CoreApplication.kt`) implementing domain-centric modular packages: `entity/`, `models/` (API/domain), `repository/` (Spring Data JPA), `service/` (business logic + security guards), `controller/` (REST), `configuration/` (security, audit, properties, storage), `util/` (helpers).
- Clear separation: persistence entities (`entity/...Entity.kt`) vs domain/API models (`models/...`). Conversion helpers named `toModel()` / `toEntity()` colocated with entities.
- Security enforced primarily at service layer via method annotations (`@PreAuthorize` / `@PostAuthorize`) with a SpEL bean `@organisationSecurity.hasOrg(#...)` guarding organisation context.
- JSON-rich attributes stored using `JsonBinaryType` (Hypersistence) for flexible structures (`customAttributes`, `tileLayout`, payment details, addresses). Avoid schema changes for optional structured fields.

## Dependency & Tech Stack
- Kotlin 2.1.x, Spring Boot 3.5.x (Java 21 toolchain), Spring Data JPA, Spring Security (resource server JWT), Hypersistence Utils, Supabase (auth + storage), OpenPDF (PDF gen), Springdoc OpenAPI, Kotlin Logging.
- Postgres in prod; H2 in tests. Flyway-style migrations under `src/main/resources/db/migration/` (files named `V#__*.sql`). Do not modify historical migrations—add new versioned files.

## Domain & Data Patterns
- Entities extend `AuditableEntity` (created/updated timestamps). Do not set audit fields manually.
- Collections (`members`, `invites`) are lazily loaded; service methods decide when to expose them using `includeMetadata` flag (e.g., `OrganisationService.getOrganisation(..., includeMetadata=true)`). Preserve this performance-oriented toggle when adding similar fetch options.
- Currency stored as `java.util.Currency`; default often `AUD`—respect existing defaults unless feature dictates otherwise.
- Enum plans & roles: `OrganisationPlan`, `OrganisationRoles`. Enforce role checks through existing security bean rather than manual conditionals where possible.

## Service Layer Conventions
- Services are thin orchestrators + authorization gates. Example: `OrganisationService` uses repositories, `UserService`, `ActivityService`, and `AuthTokenService`.
- Use `ServiceUtil.findOrThrow` pattern for repository lookups – it centralises NotFound handling.
- Mutating methods typically return updated domain model, not entity.
- Maintain transactional boundaries with `@Transactional` where multi-step persistence occurs.

## Security & Testing
- Security context in tests established with custom annotation `@WithUserPersona` + roles (`OrganisationRole`). Reuse this for any test needing authenticated context instead of recreating JWT logic.
- Do not bypass `@PreAuthorize`—add corresponding expressions when introducing new organisation-scoped service methods.
- JWT claim mapping centralised in `CustomAuthenticationTokenConverter` (see `configuration/auth/`). Extend there rather than duplicating parsing.

## Controller Layer
- REST endpoints grouped under resource-focused controllers in `controller/<domain>/`. Base path example: `@RequestMapping("/api/v1/organisation")`.
- Controllers delegate directly to services and return domain models (serialised via Jackson Kotlin module). Avoid leaking JPA entities.
- For create/update, DTO requests live under `models/<domain>/request/`—follow that naming when adding new request types.

## Persistence & Repositories
- Repository interfaces in `repository/<domain>/` follow Spring Data naming. Prefer derived queries; add explicit methods only when necessary.
- When adding JSONB fields, annotate with `@Type(JsonBinaryType::class)` and mark columnDefinition = "jsonb" to stay consistent.

## Migrations
- Add new file `V<next>__<snake_case_description>.sql` under `resources/db/migration/`. Do not edit prior versions. Keep idempotent assumptions minimal (Flyway standard).

## Logging & Observability
- Use injected `KLogger` (kotlin-logging). Avoid `println`. Use meaningful context keys (organisationId, entityId) at info/debug.
- Actuator present—prefer leveraging existing health/info endpoints rather than adding custom system status endpoints unless necessary.

## Build & Run
- Build jar: `./gradlew clean build` (produces `build/libs/core-<version>.jar`).
- Run locally (requires env vars defined in `application.yml` placeholders): `./gradlew bootRun`.
- Tests: `./gradlew test` (JUnit5 + Spring Boot). H2 and security persona utilities auto-configure environment.

## Adding Features – Example Flow
1. Create / update JPA Entity (`entity/<domain>/...Entity.kt`) + migration if schema change.
2. Add / adjust domain model (`models/<domain>/...`), plus converters if new.
3. Expose repository method if needed.
4. Add service method with `@PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")` style guard.
5. Add controller endpoint returning domain model/DTO.
6. Write test using `@WithUserPersona` + factory (`service.util.factory.*`).

## Common Pitfalls to Avoid
- Returning entities directly (breaks layering & lazy init). Always convert.
- Forgetting security annotations – leads to unauthorised access paths.
- Eagerly populating heavy collections when `includeMetadata` flag pattern exists.
- Editing old migration files—always append.

## When Unsure
Inspect analogous implementation in same domain first (e.g., see `ClientService` vs `CompanyService`). Mirror patterns for consistency.

---
If any area (e.g., storage, PDF generation, Supabase usage) needs deeper coverage, request follow-up clarification. Provide concrete file refs when asking.
