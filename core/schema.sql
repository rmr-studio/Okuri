begin;
create extension if not exists "uuid-ossp";
commit;

-- Users

create table if not exists "users"
(
    "id"             uuid primary key not null default uuid_generate_v4(),
    "name"           varchar(50)      not null,
    "email"          varchar(100)     not null unique,
    "phone"          varchar(15)      not null unique,
    "address"        jsonb,
    "company"        jsonb,
    "charge_rate"    jsonb,
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

-- Clients

create table if not exists "clients"
(
    "id"          uuid primary key not null default uuid_generate_v4(),
    "user_id"     uuid             not null references public.users (id) on delete cascade,
    "name"        varchar(50)      not null,
    "phone"       varchar(15)      not null,
    "address"     jsonb            not null,
    "ndis_number" varchar(20)      not null,
    "created_at"  timestamp with time zone  default current_timestamp,
    "updated_at"  timestamp with time zone  default current_timestamp
);

ALTER TABLE public.clients
    ADD CONSTRAINT uq_client_phone_user UNIQUE (user_id, phone);


ALTER TABLE public.clients
    ADD CONSTRAINT uq_client_ndis_user UNIQUE (user_id, ndis_number);

create index if not exists idx_client_user_id
    on public.clients (user_id);

-- Line Items

create table if not exists "line_item"
(
    "id"          uuid primary key not null default uuid_generate_v4(),
    "user_id"     uuid             not null references public.users (id) on delete cascade,
    "name"        varchar(50)      not null,
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

CREATE TYPE invoice_billing_status AS ENUM ('PENDING', 'PAID' , 'OVERDUE', 'OUTDATED', 'CANCELLED' );

create table if not exists "invoice"
(
    "id"                 uuid primary key         not null default uuid_generate_v4(),
    "user_id"            uuid                     not null references public.users (id) on delete cascade,
    "client_id"          uuid                     not null references public.clients (id) on delete cascade,
    "invoice_number"     INTEGER                  not null,
    "billable_work"      jsonb                    not null,
    "amount"             DECIMAL(19, 4)           not null default 0.00,
    "currency"           varchar(3)               not null default 'AUD',
    "status"             invoice_billing_status   not null default 'PENDING',
    "invoice_start_date" timestamp with time zone not null,
    "invoice_end_date"   timestamp with time zone not null,
    "invoice_due_date"   timestamp with time zone not null,
    "created_at"         timestamp with time zone          default current_timestamp,
    "updated_at"         timestamp with time zone          default current_timestamp
);

create index if not exists idx_invoice_user_id
    on public.invoice (user_id);


create index if not exists idx_invoice_client_id
    on public.invoice (client_id);

ALTER TABLE public.invoice
    ADD CONSTRAINT uq_invoice_number_user UNIQUE (user_id, invoice_number);


