begin;
create extension if not exists "uuid-ossp";
commit;

-- Users
drop table if exists "users" cascade;
create table if not exists "users"
(
    "id"             uuid primary key not null default uuid_generate_v4(),
    "name"           varchar(50)      not null,
    "email"          varchar(100)     not null unique,
    "phone"          varchar(15)      not null unique,
    "address"        jsonb,
    "company"        jsonb,

    "bsb"            varchar(10)      not null,
    "account_number" varchar(20)      not null,
    "account_name"   varchar(50)      not null,
    "created_at"     timestamp with time zone  default current_timestamp,
    "updated_at"     timestamp with time zone  default current_timestamp
);

create or replace function public.handle_new_user()
    returns trigger
    language plpgsql
    security definer set search_path = ''
as
$$
begin
    insert into public.users (id, name, email, phone, bsb, account_number, account_name)
    values (new.id,
            coalesce(new.raw_user_meta_data ->> 'name', ''),
            new.email,
            coalesce(new.raw_user_meta_data ->> 'phone', ''),
            '',
            '',
            '');
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
    id          UUID PRIMARY KEY,
    user_id     UUID          NULL,
    name        VARCHAR(255)  NOT NULL,
    description TEXT          NULL,
    type        template_type NOT NULL,
    structure   JSONB         NOT NULL,
    is_default  BOOLEAN       NOT NULL   DEFAULT FALSE,
    is_premade  BOOLEAN       NOT NULL   DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_owner FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Clients
drop table if exists "clients" cascade;
create table if not exists "clients"
(
    "id"              uuid primary key not null default uuid_generate_v4(),
    "user_id"         uuid             not null references public.users (id) on delete cascade,
    "name"            varchar(50)      not null,
    "contact_details" jsonb,
    "template_id"     uuid             null references public.report_templates (id) on delete cascade,
    "attributes"      jsonb            not null,
    "created_at"      timestamp with time zone  default current_timestamp,
    "updated_at"      timestamp with time zone  default current_timestamp
);


create index if not exists idx_client_user_id
    on public.clients (user_id);

-- Line Items
CREATE TYPE line_item_type AS ENUM ('SERVICE', 'PRODUCT', 'FEE', 'DISCOUNT');
drop table if exists "line_item" cascade;
create table if not exists "line_item"
(
    "id"          uuid primary key not null default uuid_generate_v4(),
    "user_id"     uuid             not null references public.users (id) on delete cascade,
    "name"        varchar(50)      not null,
    "type"        line_item_type   not null,
    "description" text             not null,
    "charge_rate" DECIMAL(19, 4)   not null,
    "created_at"  timestamp with time zone  default current_timestamp,
    "updated_at"  timestamp with time zone  default current_timestamp
);

ALTER TABLE public.line_item
    ADD CONSTRAINT uq_line_item_name_user UNIQUE (user_id, name);

create index if not exists idx_line_item_user_id
    on public.line_item (user_id);


-- Invoice
drop table if exists "invoice" cascade;
drop type if exists invoice_billing_status cascade;
CREATE TYPE invoice_billing_status AS ENUM ('PENDING', 'PAID' , 'OVERDUE', 'OUTDATED', 'CANCELLED' );

create table if not exists "invoice"
(
    "id"                  uuid primary key         not null default uuid_generate_v4(),
    "user_id"             uuid                     not null references public.users (id) on delete cascade,
    "client_id"           uuid                     not null references public.clients (id) on delete cascade,
    "invoice_number"      TEXT                     not null,
    "invoice_template_id" uuid                     null references public.report_templates (id) on delete cascade,
    "report_template_id"  uuid                     null references public.report_templates (id) on delete cascade,
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

create index if not exists idx_invoice_user_id
    on public.invoice (user_id);


create index if not exists idx_invoice_client_id
    on public.invoice (client_id);

ALTER TABLE public.invoice
    ADD CONSTRAINT uq_invoice_number_user UNIQUE (user_id, invoice_number);




