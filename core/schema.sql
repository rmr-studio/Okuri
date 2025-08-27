begin;
create extension if not exists "uuid-ossp";
commit;

-- Organisations
CREATE TABLE IF NOT EXISTS "organisations"
(
    "id"                UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
    "name"              VARCHAR(100)     NOT NULL UNIQUE,
    "plan"              VARCHAR          NOT NULL DEFAULT 'FREE' CHECK (plan IN ('FREE', 'STARTUP', 'SCALE', 'ENTERPRISE')),
    "default_currency"  VARCHAR(3)       NOT NULL DEFAULT 'AUD',
    "address"           jsonb,
    "avatar_url"        TEXT,
    "business_number"   TEXT,
    "tax_id"            TEXT,
    "payment_details"   jsonb,
    "custom_attributes" jsonb,
    "tile_layout"       jsonb,
    "member_count"      INTEGER          NOT NULL DEFAULT 0,
    "created_at"        TIMESTAMP WITH TIME ZONE  DEFAULT CURRENT_TIMESTAMP,
    "updated_at"        TIMESTAMP WITH TIME ZONE  DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS "organisation_members"
(
    "id"              UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
    "organisation_id" UUID             NOT NULL REFERENCES organisations (id) ON DELETE CASCADE,
    "user_id"         UUID             NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    "role"            VARCHAR          NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
    "member_since"    TIMESTAMP WITH TIME ZONE  DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.organisation_members
    ADD CONSTRAINT ux_organisation_user UNIQUE (organisation_id, user_id);

CREATE INDEX idx_organisation_members_user_id
    ON public.organisation_members (user_id);



-- Function to update member count
CREATE OR REPLACE FUNCTION public.update_org_member_count()
    RETURNS TRIGGER AS
$$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Increment member count on INSERT
        UPDATE public.organisations
        SET member_count = member_count + 1,
            updated_at   = now()
        WHERE id = NEW.organisation_id;
    ELSIF (TG_OP = 'DELETE') THEN
        -- Decrement member count on DELETE
        UPDATE public.organisations
        SET member_count = member_count - 1,
            updated_at   = now()
        WHERE id = OLD.organisation_id;
    END IF;

    RETURN NULL; -- Triggers on INSERT/DELETE do not modify the rows
END;
$$ LANGUAGE plpgsql;

-- Trigger for INSERT and DELETE on org_member
CREATE or replace TRIGGER trg_update_org_member_count
    AFTER INSERT OR DELETE
    ON public.organisation_members
    FOR EACH ROW
EXECUTE FUNCTION public.update_org_member_count();

ALTER TABLE ORGANISATIONS
    ENABLE ROW LEVEL SECURITY;

/* Add restrictions to ensure that only organisation members can view their organisation*/
CREATE POLICY "Users can view their own organisations" on organisations
    FOR SELECT
    TO authenticated
    USING (
    id IN (SELECT organisation_id
           FROM organisation_members
           WHERE user_id = auth.uid())
    );

CREATE TABLE IF NOT EXISTS "organisation_invites"
(
    "id"              UUID PRIMARY KEY           NOT NULL DEFAULT uuid_generate_v4(),
    "organisation_id" UUID                       NOT NULL REFERENCES organisations (id) ON DELETE CASCADE,
    "email"           VARCHAR(100)               NOT NULL,
    "status"          ORGANISATION_INVITE_STATUS NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED')),
    "invite_code"     VARCHAR(12)                NOT NULL CHECK (LENGTH(invite_code) = 12),
    "role"            VARCHAR                    NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
    "invited_by"      UUID                       NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    "created_at"      TIMESTAMP WITH TIME ZONE            DEFAULT CURRENT_TIMESTAMP,
    "expires_at"      TIMESTAMP WITH TIME ZONE            DEFAULT CURRENT_TIMESTAMP + INTERVAL '1 days'
);

CREATE INDEX idx_invite_organisation_id ON public.organisation_invites (organisation_id);
CREATE INDEX idx_invite_email ON public.organisation_invites (email);
CREATE INDEX idx_invite_token ON public.organisation_invites (invite_code);

alter table organisation_invites
    add constraint uq_invite_code unique (invite_code);

-- Users
drop table if exists "users" cascade;
create table if not exists "users"
(
    "id"                      uuid primary key not null default uuid_generate_v4(),
    "name"                    varchar(50)      not null,
    "email"                   varchar(100)     not null unique,
    "phone"                   varchar(15)      null,
    "avatar_url"              TEXT,
    "default_organisation_id" UUID             references public.organisations (id) ON DELETE SET NULL,
    "created_at"              timestamp with time zone  default current_timestamp,
    "updated_at"              timestamp with time zone  default current_timestamp
);

create or replace function public.handle_new_user()
    returns trigger
    language plpgsql
    security definer set search_path = ''
as
$$
begin
    insert into public.users (id, name, email, phone, avatar_url)
    values (new.id,
            coalesce(new.raw_user_meta_data ->> 'name', ''),
            new.email,
            coalesce(new.raw_user_meta_data ->> 'phone', ''),
            avatar_url);
    return new;
end
$$;

-- trigger the function every time a user is created
create or replace trigger on_auth_user_created
    after insert
    on auth.users
    for each row
execute procedure public.handle_new_user();

create or replace function public.handle_phone_confirmation()
    returns trigger
    language plpgsql
    security definer set search_path = ''
as
$$
begin
    if new.phone is not null then
        update public.users
        set phone = new.phone
        where id = new.id;
    end if;
    return new;
end;
$$;

-- Templates
CREATE TYPE template_type AS ENUM ('CLIENT', 'INVOICE', 'REPORT');

CREATE TABLE IF NOT EXISTS template
(
    id              UUID PRIMARY KEY,
    user_id         UUID          NULL,
    organisation_id UUID          NULL,
    name            VARCHAR(255)  NOT NULL,
    description     TEXT          NULL,
    type            template_type NOT NULL,
    structure       JSONB         NOT NULL,
    is_default      BOOLEAN       NOT NULL   DEFAULT FALSE,
    is_premade      BOOLEAN       NOT NULL   DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_owner FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_template_organisation_id ON template (organisation_id);

-- Clients
drop table if exists "clients" cascade;
create table if not exists "clients"
(
    "id"              uuid primary key not null default uuid_generate_v4(),
    "organisation_id" uuid             not null references public.organisations (id) on delete cascade,
    "name"            varchar(50)      not null,
    "contact_details" jsonb,
    "template_id"     uuid             null references public.template (id) on delete cascade,
    "attributes"      jsonb            not null,
    "created_at"      timestamp with time zone  default current_timestamp,
    "updated_at"      timestamp with time zone  default current_timestamp
);

create index if not exists idx_client_organisation_id
    on public.clients (organisation_id);

-- Line Items

create table if not exists "line_item"
(
    "id"              uuid primary key not null default uuid_generate_v4(),
    "organisation_id" uuid             not null references public.organisations (id) on delete cascade,
    "name"            varchar(50)      not null,
    "type"            VARCHAR          not null default 'SERVICE' CHECK (type IN ('SERVICE', 'PRODUCT', 'FEE', 'DISCOUNT')),
    "description"     text             not null,
    "charge_rate"     DECIMAL(19, 4)   not null,
    "created_at"      timestamp with time zone  default current_timestamp,
    "updated_at"      timestamp with time zone  default current_timestamp
);

ALTER TABLE public.line_item
    ADD CONSTRAINT uq_line_item_name_organisation UNIQUE (organisation_id, name);

create index if not exists idx_line_item_organisation_id
    on public.line_item (organisation_id);


-- Invoice

create table if not exists "invoice"
(
    "id"                  uuid primary key         not null default uuid_generate_v4(),
    "organisation_id"     uuid                     not null references public.organisations (id) on delete cascade,
    "client_id"           uuid                     not null references public.clients (id) on delete cascade,
    "invoice_number"      TEXT                     not null,
    "invoice_template_id" uuid                     null references public.template (id) on delete cascade,
    "report_template_id"  uuid                     null references public.template (id) on delete cascade,
    "billable_work"       jsonb                    not null,
    "amount"              DECIMAL(19, 4)           not null default 0.00,
    "custom_fields"       jsonb                    not null default '{}',
    "currency"            varchar(3)               not null default 'AUD',
    "status"              invoice_billing_status   not null default 'PENDING',
    "invoice_start_date"  timestamp with time zone null,
    "invoice_end_date"    timestamp with time zone null,
    "invoice_issue_date"  timestamp with time zone not null,
    "invoice_due_date"    timestamp with time zone null,
    "created_at"          timestamp with time zone          default current_timestamp,
    "updated_at"          timestamp with time zone          default current_timestamp
);

create index if not exists idx_invoice_organisation_id
    on public.invoice (organisation_id);


create index if not exists idx_invoice_client_id
    on public.invoice (client_id);

ALTER TABLE public.invoice
    ADD CONSTRAINT uq_invoice_number_organisation UNIQUE (organisation_id, invoice_number);

/* Add Organisation Roles to Supabase JWT */
CREATE or replace FUNCTION public.custom_access_token_hook(event jsonb)
    RETURNS jsonb
    LANGUAGE plpgsql
    stable
AS
$$
DECLARE
    claims jsonb;
    _roles jsonb;
BEGIN
    SELECT coalesce(
                   jsonb_agg(jsonb_build_object('organisation_id', organisation_id, 'role', role)),
                   '[]'::jsonb)
    INTO _roles
    FROM public.organisation_members
    WHERE user_id = (event ->> 'user_id')::uuid;
    claims := event -> 'claims';
    claims := jsonb_set(claims, '{roles}', _roles, true);
    event := jsonb_set(event, '{claims}', claims, true);
    RETURN event;
END;
$$;

grant usage on schema public to supabase_auth_admin;

grant execute
    on function public.custom_access_token_hook
    to supabase_auth_admin;
revoke execute
    on function public.custom_access_token_hook
    from authenticated, anon, public;

grant all on table public.organisations to supabase_auth_admin;
grant all on table public.users to supabase_auth_admin;
grant all on table public.organisation_members to supabase_auth_admin;

create policy "Allow auth admin to read organisation member roles" ON public.organisation_members
    as permissive for select
    to supabase_auth_admin
    using (true);

