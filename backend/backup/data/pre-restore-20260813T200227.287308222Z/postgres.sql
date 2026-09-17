--
-- PostgreSQL database dump
--

\restrict i0MgoP0yW13KrNCVWrfiitx7TwyfNVyAU3RLdpKUhReOamCZChjczNG3SJhOM7V

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: citext; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;


--
-- Name: EXTENSION citext; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: api_idempotency_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_idempotency_keys (
    idempotency_key text NOT NULL,
    entity_name text NOT NULL,
    entity_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: auth_audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_audit_logs (
    id text NOT NULL,
    user_id text,
    tenant_id text,
    email text,
    action text NOT NULL,
    details text,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: auth_password_reset_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_password_reset_requests (
    id text NOT NULL,
    user_id text NOT NULL,
    tenant_id text,
    email text NOT NULL,
    token_hash text NOT NULL,
    created_by text,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: auth_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_sessions (
    id text NOT NULL,
    user_id text NOT NULL,
    session_hash text NOT NULL,
    ip_address text,
    user_agent text,
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: auth_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_users (
    id text NOT NULL,
    tenant_id text,
    email text NOT NULL,
    password_hash text NOT NULL,
    role text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    failed_login_count integer DEFAULT 0 NOT NULL,
    locked_until timestamp with time zone,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    must_change_password boolean DEFAULT false NOT NULL,
    CONSTRAINT auth_users_role_check CHECK ((role = ANY (ARRAY['super_admin'::text, 'client_admin'::text, 'client_user'::text, 'support'::text]))),
    CONSTRAINT auth_users_status_check CHECK ((status = ANY (ARRAY['active'::text, 'pending'::text, 'suspended'::text, 'deleted'::text])))
);


--
-- Name: backup_business_plan_matrix_20260616_215352; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backup_business_plan_matrix_20260616_215352 (
    business_type text,
    plan_id text,
    monthly_price numeric(12,2),
    yearly_price numeric(12,2),
    status text,
    sort_order integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: backup_business_plan_matrix_official_20260616_222612; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backup_business_plan_matrix_official_20260616_222612 (
    business_type text,
    plan_id text,
    monthly_price numeric(12,2),
    yearly_price numeric(12,2),
    status text,
    sort_order integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: backup_business_plan_modules_20260616_215352; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backup_business_plan_modules_20260616_215352 (
    business_type text,
    plan_id text,
    module_id text,
    created_at timestamp with time zone
);


--
-- Name: backup_business_plan_modules_official_20260616_222612; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backup_business_plan_modules_official_20260616_222612 (
    business_type text,
    plan_id text,
    module_id text,
    created_at timestamp with time zone
);


--
-- Name: backup_business_type_aliases_20260616_222209; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backup_business_type_aliases_20260616_222209 (
    alias text,
    business_type_id text,
    created_at timestamp with time zone
);


--
-- Name: backup_business_types_20260616_222209; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backup_business_types_20260616_222209 (
    id text,
    name text,
    module_category text,
    pricing_weight numeric(6,2),
    status text,
    sort_order integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: backup_plan_modules_after_global_20260616_210346; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backup_plan_modules_after_global_20260616_210346 (
    plan_id text,
    module_id text,
    created_at timestamp with time zone
);


--
-- Name: backup_plans_after_global_20260616_210346; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backup_plans_after_global_20260616_210346 (
    id text,
    name text,
    monthly_price numeric(12,2),
    yearly_price numeric(12,2),
    status text,
    sort_order integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: backup_tenant_modules_business_v1_20260617_072332; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backup_tenant_modules_business_v1_20260617_072332 (
    tenant_id text,
    module_id text,
    enabled boolean,
    source text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    monthly_price_snapshot numeric,
    yearly_price_snapshot numeric,
    price_override boolean
);


--
-- Name: backup_tenant_modules_business_v2_20260617_073934; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backup_tenant_modules_business_v2_20260617_073934 (
    tenant_id text,
    module_id text,
    enabled boolean,
    source text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    monthly_price_snapshot numeric,
    yearly_price_snapshot numeric,
    price_override boolean
);


--
-- Name: backup_tenant_modules_cleanup_20260617_105755; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backup_tenant_modules_cleanup_20260617_105755 (
    tenant_id text,
    module_id text,
    enabled boolean,
    source text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    monthly_price_snapshot numeric,
    yearly_price_snapshot numeric,
    price_override boolean
);


--
-- Name: backup_tenant_modules_switch_20260617_110635; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backup_tenant_modules_switch_20260617_110635 (
    tenant_id text,
    module_id text,
    enabled boolean,
    source text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    monthly_price_snapshot numeric,
    yearly_price_snapshot numeric,
    price_override boolean
);


--
-- Name: backup_tenant_subscriptions_business_v1_20260617_072332; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backup_tenant_subscriptions_business_v1_20260617_072332 (
    tenant_id text,
    plan_id text,
    status text,
    billing_cycle text,
    amount numeric(12,2),
    started_at timestamp with time zone,
    updated_at timestamp with time zone,
    plan_base_amount numeric,
    module_addons_amount numeric
);


--
-- Name: backup_tenant_subscriptions_business_v2_20260617_073934; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backup_tenant_subscriptions_business_v2_20260617_073934 (
    tenant_id text,
    plan_id text,
    status text,
    billing_cycle text,
    amount numeric(12,2),
    started_at timestamp with time zone,
    updated_at timestamp with time zone,
    plan_base_amount numeric,
    module_addons_amount numeric
);


--
-- Name: backup_tenant_subscriptions_cleanup_20260617_105755; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backup_tenant_subscriptions_cleanup_20260617_105755 (
    tenant_id text,
    plan_id text,
    status text,
    billing_cycle text,
    amount numeric(12,2),
    started_at timestamp with time zone,
    updated_at timestamp with time zone,
    plan_base_amount numeric,
    module_addons_amount numeric
);


--
-- Name: backup_tenant_subscriptions_switch_20260617_110635; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backup_tenant_subscriptions_switch_20260617_110635 (
    tenant_id text,
    plan_id text,
    status text,
    billing_cycle text,
    amount numeric(12,2),
    started_at timestamp with time zone,
    updated_at timestamp with time zone,
    plan_base_amount numeric,
    module_addons_amount numeric
);


--
-- Name: business_plan_matrix; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_plan_matrix (
    business_type text NOT NULL,
    plan_id text NOT NULL,
    monthly_price numeric(12,2) DEFAULT 0 NOT NULL,
    yearly_price numeric(12,2) DEFAULT 0 NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT business_plan_matrix_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'archived'::text])))
);


--
-- Name: business_plan_modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_plan_modules (
    business_type text NOT NULL,
    plan_id text NOT NULL,
    module_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: business_type_aliases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_type_aliases (
    alias text NOT NULL,
    business_type_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: business_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_types (
    id text NOT NULL,
    name text NOT NULL,
    module_category text NOT NULL,
    pricing_weight numeric(6,2) DEFAULT 1.00 NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT business_types_pricing_weight_check CHECK ((pricing_weight > (0)::numeric)),
    CONSTRAINT business_types_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'archived'::text])))
);


--
-- Name: client_business_register; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_business_register (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name character varying(150) NOT NULL,
    email public.citext NOT NULL,
    country_code character varying(50) DEFAULT '+92'::character varying NOT NULL,
    phone character varying(100) NOT NULL,
    company_name character varying(150) NOT NULL,
    business_reg_no character varying(100),
    business_type character varying(255) NOT NULL,
    business_size character varying(255) NOT NULL,
    country character varying(255) NOT NULL,
    city character varying(255) NOT NULL,
    state character varying(255) NOT NULL,
    postal_code character varying(100),
    address text NOT NULL,
    password_hash text NOT NULL,
    custom_domain character varying(150),
    hear_about_us character varying(100),
    terms_accepted boolean DEFAULT false NOT NULL,
    role character varying(50) DEFAULT 'client_admin'::character varying NOT NULL,
    status character varying(100) DEFAULT 'pending_verification'::character varying NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    phone_verified boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    failed_login_count integer DEFAULT 0 NOT NULL,
    locked_until timestamp without time zone,
    last_login_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT client_business_register_company_name_check CHECK ((length(TRIM(BOTH FROM company_name)) >= 2)),
    CONSTRAINT client_business_register_full_name_check CHECK ((length(TRIM(BOTH FROM full_name)) >= 3)),
    CONSTRAINT client_business_register_terms_accepted_check CHECK ((terms_accepted = true))
);


--
-- Name: modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modules (
    id text NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    price_monthly numeric(12,2) DEFAULT 0 NOT NULL,
    price_yearly numeric(12,2) DEFAULT 0 NOT NULL,
    route text DEFAULT ''::text NOT NULL,
    icon text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT modules_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'archived'::text])))
);


--
-- Name: plan_modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plan_modules (
    plan_id text NOT NULL,
    module_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plans (
    id text NOT NULL,
    name text NOT NULL,
    monthly_price numeric(12,2) DEFAULT 0 NOT NULL,
    yearly_price numeric(12,2) DEFAULT 0 NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT plans_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'archived'::text])))
);


--
-- Name: rbac_audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rbac_audit_logs (
    id bigint NOT NULL,
    actor_user_id text,
    role_id text,
    tenant_id text,
    action text NOT NULL,
    detail text DEFAULT ''::text NOT NULL,
    ip_address text DEFAULT ''::text NOT NULL,
    user_agent text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: rbac_audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rbac_audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rbac_audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rbac_audit_logs_id_seq OWNED BY public.rbac_audit_logs.id;


--
-- Name: rbac_role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rbac_role_permissions (
    role_id text NOT NULL,
    module_code text NOT NULL,
    action_key text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT rbac_role_permissions_action_key_check CHECK ((action_key = ANY (ARRAY['view'::text, 'create'::text, 'edit'::text, 'delete'::text, 'approve'::text, 'export'::text, 'manage'::text])))
);


--
-- Name: rbac_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rbac_roles (
    id text NOT NULL,
    name text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    is_system boolean DEFAULT false NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    scope text DEFAULT 'tenant'::text NOT NULL,
    inherits_from text,
    created_by text DEFAULT ''::text NOT NULL,
    updated_by text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT rbac_roles_status_check CHECK ((status = ANY (ARRAY['active'::text, 'disabled'::text])))
);


--
-- Name: rbac_user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rbac_user_roles (
    user_id text NOT NULL,
    role_id text NOT NULL,
    scope text DEFAULT 'tenant'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tenant_modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_modules (
    tenant_id text NOT NULL,
    module_id text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    source text DEFAULT 'manual'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    monthly_price_snapshot numeric DEFAULT 0,
    yearly_price_snapshot numeric DEFAULT 0,
    price_override boolean DEFAULT false,
    CONSTRAINT tenant_modules_source_check CHECK ((source = ANY (ARRAY['plan'::text, 'manual'::text, 'upgrade'::text])))
);


--
-- Name: tenant_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_subscriptions (
    tenant_id text NOT NULL,
    plan_id text,
    status text DEFAULT 'trial'::text NOT NULL,
    billing_cycle text DEFAULT 'monthly'::text NOT NULL,
    amount numeric(12,2) DEFAULT 0 NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    plan_base_amount numeric DEFAULT 0,
    module_addons_amount numeric DEFAULT 0,
    CONSTRAINT tenant_subscriptions_billing_cycle_check CHECK ((billing_cycle = ANY (ARRAY['monthly'::text, 'yearly'::text, 'manual'::text]))),
    CONSTRAINT tenant_subscriptions_status_check CHECK ((status = ANY (ARRAY['trial'::text, 'active'::text, 'past_due'::text, 'cancelled'::text, 'expired'::text, 'manual'::text])))
);


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenants (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    idempotency_key character varying(255) NOT NULL,
    tenant_id character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    country_code character varying(10) NOT NULL,
    phone character varying(50) NOT NULL,
    company_name character varying(255) NOT NULL,
    business_reg_no character varying(100),
    business_type character varying(100) NOT NULL,
    business_size character varying(50) NOT NULL,
    country character varying(100) NOT NULL,
    city character varying(100) NOT NULL,
    state character varying(100) NOT NULL,
    postal_code character varying(50),
    address text NOT NULL,
    custom_domain character varying(255),
    hear_about_us character varying(100),
    password_hash character varying(255) NOT NULL,
    enable_passkey boolean DEFAULT false,
    biometric_hash text,
    terms_accepted boolean DEFAULT true,
    version integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: rbac_audit_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_audit_logs ALTER COLUMN id SET DEFAULT nextval('public.rbac_audit_logs_id_seq'::regclass);


--
-- Data for Name: api_idempotency_keys; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.api_idempotency_keys (idempotency_key, entity_name, entity_id, created_at) FROM stdin;
reg-test-004	client_business_register	b9016af3-780a-4612-8892-124efda813b5	2026-06-04 09:01:47.46618+00
final-extra-field-test-002	client_business_register	7b2343fc-0a4f-45ae-86a0-b94a13e018f9	2026-06-05 06:52:25.795825+00
2ebeda3b-437f-47dc-960e-bfa0c9cc0e95	client_business_register	88945d26-0e01-40c9-b594-abf69ed3ca8b	2026-06-05 07:08:55.214178+00
ddf9aff8-1add-4a44-93ca-dcd1e2b21a69	client_business_register	bb3ab721-27d7-4680-ab1f-e0cf1aaf6b41	2026-06-05 07:34:51.742904+00
3b4c960d-38ea-4ae3-84f7-30afc4592014	client_business_register	369ec8dd-ce04-4a5f-91e4-8a2620bc331a	2026-06-05 21:02:47.569369+00
d966c24a-fb9f-47d0-a86f-2417d49a96f9	client_business_register	30edd826-5c7a-4f2f-a277-9b74d254882b	2026-06-05 21:19:44.393216+00
sqlite-proof-now-001	client_business_register	f888c57c-6e96-4f78-815f-744b63bd1ab0	2026-06-06 08:52:10.968132+00
00e63b34-3f30-4ea9-a378-fdf04b0bb424	client_business_register	3d05fcd5-afba-4331-97fe-e09d77cd89ea	2026-06-06 15:17:32.517004+00
f33f1ebc-2979-4411-a3ac-4b8a7866eb26	client_business_register	238f2ea4-4f91-41f4-8b3c-a70bc632890b	2026-06-06 19:22:44.260734+00
argon2-live-1780776725	client_business_register	37b3779b-a56d-46bd-8c74-105497ad5d45	2026-06-06 20:12:08.872302+00
80aca5a7-0f5d-4e29-9994-aebb3689f314	client_business_register	86d7e32b-4472-4dac-9646-428a08090da6	2026-06-06 20:35:17.197729+00
6e71d590-cd45-42c5-8cbb-8484375d5c6a	client_business_register	1c180306-d507-4af8-819d-dfd5ff9a613f	2026-06-06 20:50:45.036001+00
6d21b95d-4e87-4047-855b-b35f11b692f0	client_business_register	2e0168de-ffa4-41b3-be1a-ac8c13171b05	2026-06-07 06:23:22.709487+00
d4399068-5b1a-40be-903f-de9275f9777f	client_business_register	7683fd87-bd0a-4f4c-a697-68c51aa7a6ee	2026-06-08 08:05:19.832361+00
client-login-test-1780931800	client_business_register	7d8ca367-74ec-47eb-9d27-fe5efbdea672	2026-06-08 15:16:41.655257+00
de6a3a8f-cb8a-43fb-a8ec-514194828ad6	client_business_register	4f049da4-cac7-4598-8b96-821d9e0051b3	2026-06-08 18:35:22.927688+00
\.


--
-- Data for Name: auth_audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.auth_audit_logs (id, user_id, tenant_id, email, action, details, ip_address, user_agent, created_at) FROM stdin;
0a629e99-7d2e-46e7-aeb5-6cafbb2fb2f2	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:46758	curl/8.17.0	2026-06-07 09:53:15.205223+00
05c8262f-d79e-46fc-91d8-963078ac5a48	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:48842	curl/8.17.0	2026-06-08 08:17:08.264183+00
fdbea1c1-baa0-43ff-9f9f-4d1538823e54	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:49340	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 08:21:33.523459+00
092f3482-94c0-4510-8e71-4f0927f28afe	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:46458	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 12:54:00.760825+00
a60bdbe0-1db4-49cb-a01a-921cb2bb8838	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:33880	curl/8.17.0	2026-06-08 13:02:19.000505+00
68a3bc68-9345-443a-b1aa-eafd7a007f75	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:41242	curl/8.17.0	2026-06-08 15:10:42.850825+00
51a4c9e7-c8e4-45f0-a807-70d670fe4050	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:58804	curl/8.17.0	2026-06-08 15:11:05.965184+00
eadd508d-220d-4cc3-9aae-d54b01bb32d0	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	client_approved	nanaononoasi2@gmail.com	127.0.0.1:33330	curl/8.17.0	2026-06-08 15:12:56.565162+00
8a3e870a-d806-47ff-9fcb-03f8355c640d	4ce6f50e-a5cd-4d11-bb3a-194687c63550	tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	nanaononoasi2@gmail.com	login_failed	bad_password	127.0.0.1:52050	curl/8.17.0	2026-06-08 15:15:06.016191+00
9a5dc7bd-c192-4745-ab09-7d2b799f7276	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	client_approved	client-login-test-1780931800@example.com	127.0.0.1:36808	curl/8.17.0	2026-06-08 15:18:09.42588+00
b7c546ba-afb4-4f30-b3a0-68aed9315398	5cc47739-5212-48ff-ad30-f6dffa708d03	tenant_7d8ca36774ec47eb9d27fe5efbdea672	client-login-test-1780931800@example.com	login_success	role=client_admin	127.0.0.1:36814	curl/8.17.0	2026-06-08 15:18:10.672515+00
ac849d07-06fa-4d2b-8cad-9f6cf584b104	5cc47739-5212-48ff-ad30-f6dffa708d03	tenant_7d8ca36774ec47eb9d27fe5efbdea672	client-login-test-1780931800@example.com	login_success	role=client_admin	127.0.0.1:56172	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 17:44:04.809444+00
f19f1dd7-1388-40a5-868d-aa1016c3287e	5cc47739-5212-48ff-ad30-f6dffa708d03	tenant_7d8ca36774ec47eb9d27fe5efbdea672	client-login-test-1780931800@example.com	login_success	role=client_admin	127.0.0.1:36786	curl/8.17.0	2026-06-08 17:50:09.334943+00
c8ee499e-4c48-447e-87ee-5e749ede3d3d	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:40876	curl/8.17.0	2026-06-08 17:52:28.383972+00
4973e3b7-f7b7-4a30-8285-14c5337c5432	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:43510	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 18:25:30.536876+00
8ee1974c-8ce8-4150-b159-affebce311ee	\N	\N	shahnaz@gmail.com	login_failed	user_not_found	127.0.0.1:52366	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 18:36:18.996977+00
1a59922c-a5ce-4ce9-b538-fd361a6cb443	\N	\N	shahnaz@gmail.com	login_failed	user_not_found	127.0.0.1:51806	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 18:36:53.470619+00
60cedf45-dd0a-4c81-b320-770873307412	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_failed	bad_password	127.0.0.1:43034	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 18:38:28.790345+00
214d035f-9e6d-4f43-b897-ed0b93021134	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_failed	bad_password	127.0.0.1:34876	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 18:38:50.922357+00
fa8215d7-43f4-4691-a906-757e7839e7d1	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:40422	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 18:40:34.133275+00
a8bd8880-a3ed-4c49-aa07-190d31754817	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:38298	curl/8.17.0	2026-06-08 18:43:43.655161+00
6823e067-fc56-4d28-aeab-7f8866d410ac	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:34074	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 20:08:41.697321+00
eaeb0102-251a-4506-b6b6-608205b530b6	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:47400	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 20:54:49.092783+00
3c21f594-e919-47dc-95e4-66e136a2279d	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:34740	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 22:31:24.319714+00
42768bde-3def-4e56-91d6-7d112c24f1fc	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:59996	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 23:24:03.921482+00
6a21599a-64de-4533-b2c9-a06be88320b2	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:54036	curl/8.17.0	2026-06-09 07:36:38.73688+00
d8ea1420-f8af-49f6-91d9-75d307c20f1b	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:54146	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-09 07:37:19.689787+00
2b55d706-60a5-4196-8c77-bf9a88143bbb	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:38984	curl/8.17.0	2026-06-09 08:00:20.227069+00
981ac695-e5a0-4766-9256-813ff98407e7	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:58804	curl/8.17.0	2026-06-09 08:07:54.437563+00
49878141-4883-427f-87a3-4884616b5c77	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:44124	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-09 08:11:08.946759+00
6c119183-e95c-42b0-8cf8-3643fb3d82bd	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:51690	curl/8.17.0	2026-06-09 09:31:25.03507+00
96b36fe1-df7e-4e80-83c9-54ea2cd2843c	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:37050	curl/8.17.0	2026-06-09 13:46:59.895773+00
64979216-22ab-4bf2-963c-e40e8b8435d6	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:39098	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-09 13:53:55.724109+00
106ef326-4d91-4631-844f-a0c29451be34	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:42918	curl/8.17.0	2026-06-09 17:28:42.744204+00
fc86e7a7-aaf2-4549-aa27-73c835fc99d6	41d17ca8-21b2-4928-9156-1d9218b2d2a6	tenant_4f049da4cac745988b96821d9e0051b3	shahnaz@gmail.com	login_failed	bad_password	127.0.0.1:35076	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-09 20:20:18.299672+00
42d1ec23-eceb-4523-a981-22f463a3c410	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:58458	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-09 20:31:03.50361+00
e44dd2b4-4b95-4bf7-bfdb-08e59afec6bd	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:52086	curl/8.17.0	2026-06-09 21:27:22.485734+00
649e445b-34d5-4e07-8c1a-17df28b7bd8d	41d17ca8-21b2-4928-9156-1d9218b2d2a6	tenant_4f049da4cac745988b96821d9e0051b3	shahnaz@gmail.com	login_failed	bad_password	127.0.0.1:32952	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-09 23:04:22.534979+00
72aeb55d-cb85-45ea-a922-236b224997f9	41d17ca8-21b2-4928-9156-1d9218b2d2a6	tenant_4f049da4cac745988b96821d9e0051b3	shahnaz@gmail.com	login_failed	bad_password	127.0.0.1:55546	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-09 23:04:41.539745+00
abda1693-d3e3-41aa-8bce-1607e72ef796	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:45864	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-09 23:06:20.740114+00
51114869-7405-4eac-b129-313c5fec9f5f	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	client_approve_failed	client password hash is not Argon2id	127.0.0.1:34298	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-09 23:06:53.08758+00
408fa092-639f-482d-91a5-a77867ef4572	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_failed	bad_password	127.0.0.1:50860	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-10 16:38:15.858801+00
4c7302e6-6aee-48c2-a660-68d9c671a9f2	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:51150	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-10 16:39:06.00137+00
a53d21b9-fd44-4aca-b04f-ad9b3ec73740	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	client_approve_failed	client password hash is not Argon2id	127.0.0.1:35980	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-10 19:03:25.475762+00
8d71b60b-e966-42e2-a474-44ba3404e92c	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	client_approve_failed	client password hash is not Argon2id	127.0.0.1:44854	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-10 19:03:59.132052+00
a2d38203-1f12-47d1-8410-405c4b6674bc	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	client_approve_failed	client password hash is not Argon2id	127.0.0.1:57104	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-10 19:20:55.568225+00
f8cae164-40e8-452b-91fd-fd91d9eb45c4	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	client_approve_failed	client password hash is not Argon2id	127.0.0.1:35674	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-10 19:22:01.076095+00
5a11d262-ff81-4e40-b5a8-dd26670f9745	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:58026	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-06-12 14:43:54.61815+00
067700d4-0f27-412a-9e11-094afe4b9927	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_failed	bad_password	127.0.0.1:58916	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-06-12 14:50:10.178062+00
1e10d09d-8970-4098-8cc3-6e4562326505	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:35162	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-06-12 14:50:51.912289+00
048455c6-f12b-4304-8725-0fe900239302	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:54160	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-12 16:29:43.784273+00
fe67233d-d3fa-4a77-9624-ca45c9a37ef0	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:42862	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-12 21:12:36.372848+00
d7478c2a-17cb-4502-8b6d-bfe678ea37b0	\N	\N	superadmin@softcodessolution.local	login_failed	user_not_found	127.0.0.1:50764	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-13 07:30:44.398595+00
d1d90684-a1ee-428e-a6a1-485fb4813074	\N	\N	superadmin@softcodessolution.local	login_failed	user_not_found	127.0.0.1:41404	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-13 07:33:32.678509+00
6656be86-d59c-4fc8-9428-80161a1540c6	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:50222	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-13 07:38:23.572517+00
573bb7eb-c81a-4b1b-8de7-5af657cd83c1	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:58002	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-13 07:42:45.575246+00
9d1d2ba8-0a42-4fbc-8ec4-4b605da05b6a	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	client_temp_password_generated	shahnaz@gmail.com	127.0.0.1:59446	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-13 23:00:39.61278+00
8c354449-84ff-409d-9ace-953e73f32d96	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	client_password_reset_link_created	shahnaz@gmail.com	127.0.0.1:48780	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-13 23:01:06.904231+00
325009ab-64e8-46ab-868c-8e69f84696f1	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	client_unlock	shahnaz@gmail.com	127.0.0.1:48784	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-13 23:01:13.327672+00
9f20b563-29fd-4294-b992-e3ed5fb88a76	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	client_login_enabled	shahnaz@gmail.com	127.0.0.1:49916	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-13 23:01:18.247105+00
4a1e9f73-cebc-40ea-be9c-8c550c0beabd	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:38672	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-14 09:17:52.33116+00
3f9c30af-fbfb-435f-8786-e50682abfc1f	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	client_force_logout	shahnaz@gmail.com	127.0.0.1:48864	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-14 09:24:35.115901+00
ae62858e-2962-4abe-841c-e5ce161042a7	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	client_login_enabled	shahnaz@gmail.com	127.0.0.1:52676	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-15 20:28:10.063045+00
1253b658-78ae-4a5d-a4f9-ef43695cd332	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	client_unlock	shahnaz@gmail.com	127.0.0.1:52698	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-15 20:28:13.11233+00
88ab440e-c56d-426e-8b46-47645ffd3995	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	client_temp_password_generated	shahnaz@gmail.com	127.0.0.1:52708	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-15 20:28:17.002024+00
a00742bf-199c-4a2f-940a-c9d1b26d8b76	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	client_password_reset_link_created	shahnaz@gmail.com	127.0.0.1:52710	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-15 20:28:19.607388+00
aa9901e3-681d-49e3-90a0-26965d92576a	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	client_approve_failed	client password hash is not Argon2id	127.0.0.1:33664	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-15 20:36:13.017297+00
1a5b0f0c-425f-415a-9719-44369f90e120	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	client_approve_failed	client password hash is not Argon2id	127.0.0.1:43904	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-15 20:36:25.886538+00
0e9e5f0b-f5c5-4dcb-8f4e-7fbbe53bb532	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	client_approve_failed	client password hash is not Argon2id	127.0.0.1:43626	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-15 20:36:45.540172+00
53872c64-a355-4066-96f3-6b27184c8670	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:54916	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-15 21:42:41.620651+00
2dab9850-b7a2-407c-ae5a-13d8a2d87f5e	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:52232	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-15 22:15:42.500854+00
6a555baf-baf9-4d8d-9cc1-cdd9c2b1517c	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:50934	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-06-16 06:44:41.47647+00
d1adb2c5-a271-417b-978c-54fa89a6bfbe	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:55374	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-06-16 08:45:24.265026+00
a2748152-ff62-4907-9e24-863d05e21fea	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:45154	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-06-16 13:31:21.017575+00
59d88c92-93c3-4e42-b9bd-51086c3af9c5	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:52236	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-16 17:04:13.796599+00
0c9c0f01-2d58-4223-b5f1-01b648a96b38	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:55750	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-16 22:55:08.523124+00
5c7b8ac1-9e1d-451e-b6fb-eb8df315cd06	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:48544	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-17 22:18:56.717435+00
c3e19bd7-eaac-45c5-8655-263e97c03ea0	\N	\N	superadmin@sofcodesolution.local	login_failed	user_not_found	127.0.0.1:45334	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-21 21:28:58.52817+00
eabf9d8e-facf-491f-9880-a3d9e2bad7aa	\N	\N	superadmin@sofcodesolution.local	login_failed	user_not_found	127.0.0.1:33148	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-21 21:29:47.010632+00
272cec6f-d83e-4365-9bfd-d294bd09f037	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:47562	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-21 21:37:20.976856+00
788fc1ea-613c-4509-86e5-7509e82552a2	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:34148	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-06-21 21:42:44.740444+00
2f651353-d3d6-49b4-9982-09fcc0c1a4f9	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_failed	bad_password	127.0.0.1:43904	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-23 14:33:31.975179+00
e15c35ed-8905-41b4-bb61-c9db09e82539	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_failed	bad_password	127.0.0.1:47072	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-23 14:33:58.309597+00
5cb46ab0-03de-4687-93b1-bc0a298d6286	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	127.0.0.1:54430	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-23 14:36:37.661038+00
6c7229f2-4c79-4e65-985b-a607087b5e51	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	154.198.102.75	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-27 23:41:43.068087+00
c9b53c99-062f-4dc5-a9fa-d6c6e8440f4f	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	117.134.200.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-29 07:14:37.823231+00
5b715041-6fb2-497f-8362-bd87c9c1c5d7	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	117.134.200.154	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-06-29 07:45:45.828488+00
7c491df4-5a8d-4cd8-9ed9-f872d82eaa87	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	client_approve_failed	client password hash is not Argon2id	117.134.200.154	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-06-29 07:46:18.066069+00
253e7ee5-5c07-4c41-a012-37b3fda2dc1a	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	client_approve_failed	client password hash is not Argon2id	117.134.200.154	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-06-29 07:46:46.17131+00
f42af5ab-5afa-4a14-bba6-e664c4bd860a	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	client_approve_failed	client password hash is not Argon2id	117.134.200.154	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-06-29 07:46:54.306491+00
8593dbd9-1d29-46f2-afe8-44d842c84433	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	154.198.100.213	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-03 16:20:48.968551+00
9832cf70-ee54-4cd1-b828-3cc91a90b22e	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	154.81.248.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-04 08:51:50.436183+00
b2d1f704-ee92-44d7-b392-f541267b7b87	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	154.81.250.200	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-04 14:12:12.494464+00
396e6e5a-133c-43c9-97b5-1eb28279dc28	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	154.198.113.80	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-05 19:05:25.363918+00
8db114b2-44af-41f3-a1d7-220dddc71ce0	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	154.198.113.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-06 08:58:11.63476+00
bf317600-75c3-46f2-a28f-035aee056f60	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	119.160.2.1	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36	2026-07-17 16:05:24.638953+00
4f759a0e-c155-45ba-81fd-30102d61ee3b	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_failed	bad_password	119.160.2.1	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36	2026-07-17 16:07:14.834035+00
165e2b9e-bc81-4db7-8e52-f7a903785057	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	119.160.2.1	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36	2026-07-17 16:07:36.663326+00
2351cb52-cbe4-4b10-9645-bdd1889ab41b	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	117.134.200.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-18 22:05:24.880734+00
9d67fd4a-29b2-49c0-b9e5-9e276d154697	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	154.81.255.145	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36	2026-07-23 17:22:16.16186+00
b1544e66-871d-4505-b82b-9908bfc95ade	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	154.91.163.181	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-24 09:09:16.077989+00
656b832c-ed3f-47e8-988e-384c40f82b42	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	154.81.251.140	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-25 07:53:31.052453+00
23f2efde-c575-4e3c-b467-8a0b4dd55c4e	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	154.198.121.242	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-25 17:45:13.115451+00
bdd61fe0-cf2d-48be-b88c-3de061c28556	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	154.91.161.238	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-25 21:34:32.131624+00
0b0722c9-df84-4105-a68c-6828eaddcb04	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	154.91.163.238	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-26 13:06:52.219571+00
b4005c82-d20f-4a71-a167-81c8db211ea1	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	154.198.118.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-27 07:37:49.158432+00
c305f8db-9044-4bca-aa3a-001580617dad	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_failed	bad_password	117.134.200.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-28 17:56:48.09703+00
c84a30e1-3304-46d6-a702-e791cffc134f	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	117.134.200.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-28 17:57:29.12303+00
6853abc5-37ce-4ac5-b6ce-06d9916a2c3f	\N	\N	superadmin@softcodsolution.local	login_failed	user_not_found	39.34.189.67	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-31 11:17:03.105101+00
ae444bcd-11cf-450d-9fe3-0c9e9e2cd6ef	\N	\N	superadmin@softcodsolution.local	login_failed	user_not_found	39.34.189.67	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-31 11:17:39.801701+00
c887fbad-fbff-4843-a11c-0124e44b4fb3	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	39.34.189.67	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-31 12:05:07.067842+00
367d8fcc-99a0-4f6c-90c5-e420a76d7d95	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	39.34.189.67	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-31 13:26:05.250092+00
b10dfaef-282b-41c3-84eb-fbffa391d113	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	39.34.189.51	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-01 23:22:40.785918+00
ca86544f-534e-4bc0-8429-eed094c1e82d	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	39.34.187.133	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-02 11:23:09.00348+00
034469a5-542f-48d6-9801-09883d4c71b2	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	39.34.187.124	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-02 16:40:57.598799+00
d8436b21-97a2-41ee-84fa-f0c5f1274f99	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	39.34.187.124	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-02 18:10:22.140415+00
c89adcd0-552d-45b2-a5c8-a46348aca53f	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	39.34.187.124	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-02 20:39:02.442103+00
145d8856-565a-4e3e-b09f-d74d6b1e3244	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	39.34.187.133	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-03 13:01:35.731733+00
68884014-c8c5-48a6-9133-d754f15b14b4	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	39.34.186.177	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-03 19:20:38.41623+00
eebfc22f-f277-4400-bfce-683ea17cc5ab	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	39.34.190.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-04 07:09:04.070288+00
86eb5008-1abb-4570-8921-6e8f342b2667	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	39.34.191.21	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-04 19:21:57.584695+00
ac22f87b-9dc8-432e-8705-745b2ca8f431	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_failed	bad_password	39.34.191.21	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-04 20:30:43.374296+00
333384c5-038f-4ea1-87a0-c78de83a000a	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_failed	bad_password	39.34.191.21	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-04 20:31:34.849089+00
030549bc-b7f3-4cea-9643-04f34981eb16	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	39.34.191.21	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-04 20:32:14.038639+00
b5b60e04-8b0c-47a1-ba3a-057c6940a913	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	39.34.190.169	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-05 18:44:55.82274+00
a73b66be-8f49-4d1a-a5cd-5da0e55b7852	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	39.34.187.246	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-05 21:37:25.207441+00
cd8e2bd2-1121-4445-a9ec-6b1056826790	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	39.34.189.196	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-07 08:38:25.635421+00
587dd727-3edb-4e45-bf27-5fbc8786900b	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	39.34.186.19	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-07 17:59:34.851892+00
b503fdce-046c-4abb-a40e-5c3e208f5900	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	39.34.186.19	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-07 18:54:17.774542+00
80776bbe-0581-45b4-a04c-785ce9225a0b	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	39.34.186.19	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-07 19:52:28.341566+00
921618fe-ba69-4aac-bfe5-9eeb0b8274f0	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	39.34.190.132	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-08 10:42:06.135757+00
db68e509-22f6-480e-b438-d6f00647df5a	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	39.34.191.179	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-08 17:34:40.153651+00
8b760ca3-e8cb-45f5-9c02-0e2fb2837afc	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	39.34.186.159	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-09 16:03:36.455871+00
6cb0e2eb-0ba5-46e5-bdf9-1f8825934a22	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	39.34.189.9	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-10 10:23:31.289513+00
12e988be-dfe2-49ac-ac85-cc2324d10214	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	39.34.191.149	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-11 18:12:55.526925+00
d0c1fc79-fb57-4216-af16-94853d745ad5	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	39.34.187.42	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-11 19:12:51.11607+00
a89727ed-04ab-4992-b7c3-b2279d506eeb	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	39.34.191.101	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-12 07:09:48.756026+00
da275b4d-c8c4-452b-9c83-86af71136394	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	39.34.187.173	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-12 17:51:39.333963+00
5349c037-e5ff-4f73-80ba-a4108446a0c2	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	39.34.187.173	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-12 20:15:54.999805+00
1e5aea37-be7f-423e-b938-2c12c2fdbb7b	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	39.34.188.60	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-13 19:33:37.35627+00
8394b29e-759f-4f32-885d-428b27986fc1	adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	login_success	role=super_admin	39.34.188.60	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-13 19:55:27.270014+00
\.


--
-- Data for Name: auth_password_reset_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.auth_password_reset_requests (id, user_id, tenant_id, email, token_hash, created_by, expires_at, used_at, created_at) FROM stdin;
17280889-3705-4875-a815-cb8c13b14c7c	41d17ca8-21b2-4928-9156-1d9218b2d2a6	tenant_4f049da4cac745988b96821d9e0051b3	shahnaz@gmail.com	$argon2id$v=19$m=65536,t=3,p=2$4qmwL+UjSIylz5GHh3LZ0A$Ot7Hj+S+1t5F7ssumVa5WnECbGvknbNfb6UEHSdWmoI	adb6bf84-0d87-4ffc-a571-49dca2d19c70	2026-06-13 23:31:06.869701+00	\N	2026-06-13 23:01:06.870211+00
de9289ce-8468-4e3d-86e8-9d2be801d740	41d17ca8-21b2-4928-9156-1d9218b2d2a6	tenant_4f049da4cac745988b96821d9e0051b3	shahnaz@gmail.com	$argon2id$v=19$m=65536,t=3,p=2$Ctf43QGKq8afZJSGxya0IA$RLC/4hLFKxutPi31YH1YXAMEzTBzrsSRZJsT0kyBm8U	adb6bf84-0d87-4ffc-a571-49dca2d19c70	2026-06-15 20:58:19.595388+00	\N	2026-06-15 20:28:19.597176+00
\.


--
-- Data for Name: auth_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.auth_sessions (id, user_id, session_hash, ip_address, user_agent, expires_at, revoked_at, created_at, updated_at) FROM stdin;
012c2db6-e823-46bc-80d2-31760a76df24	5cc47739-5212-48ff-ad30-f6dffa708d03	e66950116b21f93f11b2815034ba4fb151cac6035006e76c8ed3eb09dcac91ef	127.0.0.1:36814	curl/8.17.0	2026-07-08 15:18:10.654033+00	\N	2026-06-08 15:18:10.656504+00	2026-06-08 15:18:10.656504+00
46229ee1-1939-47d8-9767-9f0f017748ae	5cc47739-5212-48ff-ad30-f6dffa708d03	7eccba5107725f218268124ef299f1df94b23059b17bc3028b84dfd475962971	127.0.0.1:36786	curl/8.17.0	2026-07-08 17:50:09.325526+00	\N	2026-06-08 17:50:09.32781+00	2026-06-08 17:50:09.32781+00
42f3d8a0-8fd1-46d9-a789-d99e5e3fc7d2	5cc47739-5212-48ff-ad30-f6dffa708d03	dbb1035a2af09073b65989da2508cf68180636e4ec81e086ab636b9ed68bacc6	127.0.0.1:56172	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-08 17:44:04.740079+00	2026-06-08 18:24:57.096318+00	2026-06-08 17:44:04.742985+00	2026-06-08 18:24:57.096318+00
e8b44cf6-d474-4ddf-b923-0df130030f82	adb6bf84-0d87-4ffc-a571-49dca2d19c70	521ec5f8a9c4437fed602eef23e58f5813d4babb135e24d4998540db9fc7f3be	127.0.0.1:37050	curl/8.17.0	2026-07-09 13:46:59.8849+00	\N	2026-06-09 13:46:59.885341+00	2026-06-09 13:46:59.885341+00
b47e1e9b-bc1c-41e2-b0e9-526ded2ff99a	adb6bf84-0d87-4ffc-a571-49dca2d19c70	0479a1e1a8cf660a68e0bcaa898e1c7b0f54ae5e2621ef9f1e281e2d3045a5c4	127.0.0.1:42918	curl/8.17.0	2026-07-09 17:28:42.64864+00	\N	2026-06-09 17:28:42.649232+00	2026-06-09 17:28:42.649232+00
13c4cde8-113a-47ba-be10-21b1e48a93df	adb6bf84-0d87-4ffc-a571-49dca2d19c70	6883f1e19fcc3bc15491efc609d0c8f7bc36e10c14e817c3457bdf08fff6da50	127.0.0.1:39098	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-09 13:53:55.716958+00	2026-06-09 20:17:00.426107+00	2026-06-09 13:53:55.717469+00	2026-06-09 20:17:00.426107+00
927e13fc-6086-4601-ace8-3eb9ee95ac81	adb6bf84-0d87-4ffc-a571-49dca2d19c70	fa990a34b65ab8ea373bdfda228bc67498edb83869b9da146e33b8513b8497e2	127.0.0.1:52086	curl/8.17.0	2026-07-09 21:27:22.480314+00	\N	2026-06-09 21:27:22.480706+00	2026-06-09 21:27:22.480706+00
190c78db-f8e7-45f1-875c-398c2d2f7df3	adb6bf84-0d87-4ffc-a571-49dca2d19c70	8ab0f978cf0273cc6a602d89ef6f7593ec999a7a2a3d850979a4f015641308d6	127.0.0.1:58458	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-09 20:31:03.496044+00	2026-06-09 23:03:59.66766+00	2026-06-09 20:31:03.496521+00	2026-06-09 23:03:59.66766+00
6bb735cc-5329-4e80-ac84-9fea4cbd3dff	adb6bf84-0d87-4ffc-a571-49dca2d19c70	487df617bdc02c1c5fed182092af7c1fef9e7f6f407b844d344d45ad2393faed	127.0.0.1:45864	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-09 23:06:20.733783+00	\N	2026-06-09 23:06:20.734303+00	2026-06-09 23:06:20.734303+00
2dad9f05-15eb-416f-85e1-b0d18564c9a0	adb6bf84-0d87-4ffc-a571-49dca2d19c70	e3e609e7b6a5936d9f10d94f099a5d9d44a7a6ed523b620a5d26f4d8cdcc5e30	127.0.0.1:51150	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-10 16:39:05.901906+00	\N	2026-06-10 16:39:05.902925+00	2026-06-10 16:39:05.902925+00
5576e2f4-8c66-41ab-954a-36d9f09b38a2	adb6bf84-0d87-4ffc-a571-49dca2d19c70	6bb34f2b10342222959549c78a092595656198d8b97cd338877827bd48ad2d4a	127.0.0.1:58026	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-07-12 14:43:54.559002+00	\N	2026-06-12 14:43:54.560218+00	2026-06-12 14:43:54.560218+00
a841d5de-5274-4fbf-a6c0-dfcdb7af4ab7	adb6bf84-0d87-4ffc-a571-49dca2d19c70	24636b57f6010aa25e16160a2b59057e4f159be9a68c3d56df135c2f424ebe06	127.0.0.1:35162	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-07-12 14:50:51.888559+00	\N	2026-06-12 14:50:51.889227+00	2026-06-12 14:50:51.889227+00
ea2035c9-5ee5-48fd-99ee-a7ae87813f72	adb6bf84-0d87-4ffc-a571-49dca2d19c70	a59c1704d82a480f9bb2dfbf465346d30c0131bf20a074696d7481265b97eed8	127.0.0.1:54160	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-12 16:29:43.68033+00	\N	2026-06-12 16:29:43.680806+00	2026-06-12 16:29:43.680806+00
437fd967-9d66-4d99-96ba-51619ba03db3	adb6bf84-0d87-4ffc-a571-49dca2d19c70	1032b72eaadeb7cccd273c5c43dc227ea3d564d5d4348e81b967b1245a68749a	127.0.0.1:42862	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-12 21:12:36.293893+00	\N	2026-06-12 21:12:36.294342+00	2026-06-12 21:12:36.294342+00
de98f40d-d973-4894-a769-d586a1b994c2	adb6bf84-0d87-4ffc-a571-49dca2d19c70	2eed349ac8a3cfe959510025160e98ed74e2a5e48808ad9f997dc0d67ad70f5c	127.0.0.1:50222	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 07:38:23.435831+00	\N	2026-06-13 07:38:23.436596+00	2026-06-13 07:38:23.436596+00
51dd4551-7217-448c-ba5b-41fc3d4bf5bc	adb6bf84-0d87-4ffc-a571-49dca2d19c70	92e862b1460f1566ada3aa5b70cafcb84b006063777509f07cfb01e435bde76e	127.0.0.1:58002	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-13 07:42:45.568496+00	\N	2026-06-13 07:42:45.569832+00	2026-06-13 07:42:45.569832+00
734960d9-7eec-4a6d-ba65-6f0d7c49369b	adb6bf84-0d87-4ffc-a571-49dca2d19c70	7e570b16649364e218ae0506bc27a4d578f3f523c7f1f67ce0af3ff244d96517	127.0.0.1:38672	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-14 09:17:52.142105+00	\N	2026-06-14 09:17:52.142714+00	2026-06-14 09:17:52.142714+00
a9b6c191-b1ea-4bf7-823d-fea15347d44a	adb6bf84-0d87-4ffc-a571-49dca2d19c70	4c33a29dee645d1edfb8426cc511a21cafd722d2652b2ed3f1ee86835c3827e4	127.0.0.1:54916	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-15 21:42:41.499614+00	\N	2026-06-15 21:42:41.526514+00	2026-06-15 21:42:41.526514+00
fdc1f1a4-4373-4ad1-ae1b-e32dfb1fccef	adb6bf84-0d87-4ffc-a571-49dca2d19c70	71b1831ae94840921150d15a17add7dcf6d0ee11e4e64f06d78a47c0375497c0	127.0.0.1:52232	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-15 22:15:42.464525+00	\N	2026-06-15 22:15:42.46718+00	2026-06-15 22:15:42.46718+00
b22ced3e-16f5-4bc7-ae46-64701d31fe29	adb6bf84-0d87-4ffc-a571-49dca2d19c70	e9a9ad9967a6b4f26ef3afbe8b58cdaeee50817c5cf6f149518c57e61e869960	127.0.0.1:50934	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-07-16 06:44:41.423586+00	\N	2026-06-16 06:44:41.424017+00	2026-06-16 06:44:41.424017+00
51871211-1434-46e0-b7b7-432b4acf728d	adb6bf84-0d87-4ffc-a571-49dca2d19c70	1350ee614ef7a9164292ee883d5afef43e4d41d6b83ea9cea3186956f51ecd45	127.0.0.1:55374	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-07-16 08:45:24.225584+00	\N	2026-06-16 08:45:24.226418+00	2026-06-16 08:45:24.226418+00
97dafcee-aca5-4310-852d-0d9b1ecf1d3c	adb6bf84-0d87-4ffc-a571-49dca2d19c70	5089da96b56bf3cf2c7d6e2c9e9d1bb45562eb3007954f44249ef14878eca157	127.0.0.1:45154	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-07-16 13:31:20.969064+00	\N	2026-06-16 13:31:20.971462+00	2026-06-16 13:31:20.971462+00
fd43e364-3b5d-4592-ad7e-697b549f9289	adb6bf84-0d87-4ffc-a571-49dca2d19c70	f887b6f69d5a8f4fc8174dad961efc4ebca79af6c1d110ef09e559371bd98f1a	127.0.0.1:52236	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-16 17:04:13.743717+00	2026-06-16 22:24:34.364321+00	2026-06-16 17:04:13.748078+00	2026-06-16 22:24:34.364321+00
5d1e3232-909a-499d-bb9a-71bc59767ae2	adb6bf84-0d87-4ffc-a571-49dca2d19c70	90132c365c27ae819786d8fa5cf6413ee23b874e5cf424d07c4c4160db2c6694	127.0.0.1:55750	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-16 22:55:08.475825+00	2026-06-17 22:17:51.836628+00	2026-06-16 22:55:08.476282+00	2026-06-17 22:17:51.836628+00
2a8fd69e-f15c-4a6d-b39c-83c9f3d96fbb	adb6bf84-0d87-4ffc-a571-49dca2d19c70	97788cf7f8feb8b9c97159e57e574c788b45ebb5801706d0c5dd0c3c9371400f	127.0.0.1:48544	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-17 22:18:56.659404+00	\N	2026-06-17 22:18:56.659799+00	2026-06-17 22:18:56.659799+00
985c0193-f953-4048-9aca-6c0506e3816d	adb6bf84-0d87-4ffc-a571-49dca2d19c70	4ef0d35fb8fc46a568a8dc0f927c4fa714cbd6c8e4975f1689fc8c339745334b	127.0.0.1:47562	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-21 21:37:20.865037+00	\N	2026-06-21 21:37:20.86545+00	2026-06-21 21:37:20.86545+00
1c7c0e94-2695-489f-badf-ff716689a90f	adb6bf84-0d87-4ffc-a571-49dca2d19c70	beaa320c3d48144e04c40cde3594491c81891a9c2d1a8024efcd39c78298ff1b	127.0.0.1:34148	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-07-21 21:42:44.734198+00	\N	2026-06-21 21:42:44.734858+00	2026-06-21 21:42:44.734858+00
9aa97695-8b7a-42d9-b79f-24ccdc84f629	adb6bf84-0d87-4ffc-a571-49dca2d19c70	f4ce4f7a9c99dc8a09bb8bc819d7bd210f706e2a277ea2de9b0070959d4a4d03	127.0.0.1:54430	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-23 14:36:37.552655+00	\N	2026-06-23 14:36:37.565471+00	2026-06-23 14:36:37.565471+00
744e8bfc-c980-4eee-b020-508d3acfc22c	adb6bf84-0d87-4ffc-a571-49dca2d19c70	d580aa612eed7868a08a13683e3485617ee06b80031d4655a9216967c099580c	154.198.102.75	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-27 23:41:42.928855+00	\N	2026-06-27 23:41:42.931767+00	2026-06-27 23:41:42.931767+00
656720e1-4e42-4fe5-99d0-0db05208a5d6	adb6bf84-0d87-4ffc-a571-49dca2d19c70	a2dfa66a45b58df37023ac5a6c43664e3fbdee710814b7aa15c004342e1a4518	117.134.200.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-29 07:14:37.6972+00	\N	2026-06-29 07:14:37.697762+00	2026-06-29 07:14:37.697762+00
7b998c77-1700-42ce-869a-487798bd3fef	adb6bf84-0d87-4ffc-a571-49dca2d19c70	4771b4112639bbc4bd8a43ba42a96e81670c9beddd17ca09d9c3e11f163bd09b	117.134.200.154	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	2026-07-29 07:45:45.823742+00	\N	2026-06-29 07:45:45.824107+00	2026-06-29 07:45:45.824107+00
1ad16926-4c66-4c18-b57a-70c1b25af3c1	adb6bf84-0d87-4ffc-a571-49dca2d19c70	066fd0834debc01e0326fb82377525940ef11a38667cf49aee7c9629f9feaa89	154.198.100.213	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-08-02 16:20:48.792367+00	\N	2026-07-03 16:20:48.794725+00	2026-07-03 16:20:48.794725+00
b8743556-c9d9-4baa-a69d-3c2479bf4f18	adb6bf84-0d87-4ffc-a571-49dca2d19c70	c6b86dcb6b22e8f111c87302db5a62ee56eeea19279378ec567fa22f9bb8945b	154.81.248.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-08-03 08:51:50.279265+00	\N	2026-07-04 08:51:50.279666+00	2026-07-04 08:51:50.279666+00
9555c75e-3c3d-45a9-9e95-f46b76d0f41b	adb6bf84-0d87-4ffc-a571-49dca2d19c70	ddc92f22ef96371814552b9d9fb7a19413a8b0a7b729e2613d1903027b19740a	154.81.250.200	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-05 02:12:12.376253+00	\N	2026-07-04 14:12:12.37668+00	2026-07-04 14:12:12.37668+00
1f845793-caef-4b00-b3cb-564560fc5f83	adb6bf84-0d87-4ffc-a571-49dca2d19c70	b780c7c17d98d34f4e5b1210d771b95ea7abfbf75364571d90fd8975c2e171fb	154.198.113.80	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-06 07:05:25.111849+00	\N	2026-07-05 19:05:25.115072+00	2026-07-05 19:05:25.115072+00
15d08e34-dfcb-47ec-9685-b4d1ff96c6eb	adb6bf84-0d87-4ffc-a571-49dca2d19c70	9921d9aaaeef175a98951192fc1e4f9ae6b4314d2ae8086910e398d7f4fdba53	154.198.113.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-07-06 20:58:11.518269+00	\N	2026-07-06 08:58:11.520633+00	2026-07-06 08:58:11.520633+00
bee09925-9142-40f7-82c2-241ee045925c	adb6bf84-0d87-4ffc-a571-49dca2d19c70	60762dac10f0b908ecf3ac3ab77a7bf106fe18549604876f64db4e53afe85299	119.160.2.1	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36	2026-08-16 16:05:24.591508+00	\N	2026-07-17 16:05:24.594171+00	2026-07-17 16:05:24.594171+00
55378526-3eb8-4101-a87f-266b666c2f4d	adb6bf84-0d87-4ffc-a571-49dca2d19c70	3060b05fc0016a8f42bb264f02b325e8d75b984fc9d9c705b101edcaeced3f7b	119.160.2.1	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36	2026-08-16 16:07:36.656169+00	\N	2026-07-17 16:07:36.65675+00	2026-07-17 16:07:36.65675+00
f28c408d-5a98-4691-a985-7f0b5a6591d5	adb6bf84-0d87-4ffc-a571-49dca2d19c70	4ff7c4f05a313dc21a707e09226966d97ab0947b65416c9c0792933db3241e21	117.134.200.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-17 22:05:24.781096+00	\N	2026-07-18 22:05:24.783286+00	2026-07-18 22:05:24.783286+00
ea820319-2674-461c-a57f-91e3c3dfe02d	adb6bf84-0d87-4ffc-a571-49dca2d19c70	0a556dec3f051a2ad28d5db6f00a390e5b60fbe622e41f6dc46ece258e1ab43f	154.81.255.145	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36	2026-08-22 17:22:16.061321+00	\N	2026-07-23 17:22:16.063375+00	2026-07-23 17:22:16.063375+00
3947f002-c842-4660-ac69-6c806355197b	adb6bf84-0d87-4ffc-a571-49dca2d19c70	be52d8566f3ef2d99b8ccaf1103bd8e581d0910387e28c985ab7bc175a08cf7f	154.91.163.181	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-24 21:09:15.941323+00	\N	2026-07-24 09:09:15.943872+00	2026-07-24 09:09:15.943872+00
3e97ad61-a570-4bba-8884-17469920e288	adb6bf84-0d87-4ffc-a571-49dca2d19c70	0d3334f360d73943778279d5db0ac39c006c9e3c290e694a9711c3a0d40609fe	154.81.251.140	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-25 19:53:30.913476+00	\N	2026-07-25 07:53:30.915879+00	2026-07-25 07:53:30.915879+00
3b5c943f-db1a-4beb-bdca-6bb4de74e1b6	adb6bf84-0d87-4ffc-a571-49dca2d19c70	205bc61c3fab732c43ca0527bf3a677223cea4ad998ccafbe4e34845e36cebac	154.198.121.242	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-26 05:45:12.99157+00	\N	2026-07-25 17:45:12.993904+00	2026-07-25 17:45:12.993904+00
f05f6e2b-444c-4aaa-9d35-ce636961db3c	adb6bf84-0d87-4ffc-a571-49dca2d19c70	814330593d39991b764f7d3085f041d5475fd12964771187406c31e4f580b567	154.91.161.238	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-26 09:34:32.093682+00	\N	2026-07-25 21:34:32.098025+00	2026-07-25 21:34:32.098025+00
232475f8-996c-4067-ad7c-34f1082d8505	adb6bf84-0d87-4ffc-a571-49dca2d19c70	b1f8102d985bbda47fade4ec98f0014da78f1be4aa9fee841f9f20a0a0c584e3	154.91.163.238	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-27 01:06:52.08195+00	\N	2026-07-26 13:06:52.083999+00	2026-07-26 13:06:52.083999+00
72041353-e25f-41d6-b5c3-a34fe71729c9	adb6bf84-0d87-4ffc-a571-49dca2d19c70	65fd4a6c7afde6aceb1d273ed0295421ac42726ed8863d39842309894a00f0d0	154.198.118.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-27 19:37:48.977932+00	\N	2026-07-27 07:37:48.981021+00	2026-07-27 07:37:48.981021+00
6a907bb0-09a3-4f8e-a3ac-75d6de776546	adb6bf84-0d87-4ffc-a571-49dca2d19c70	07635303cbb032686d41c4cffa1e6103e99c5cb0f962590a055db3659a17ca12	117.134.200.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-27 17:57:28.976073+00	\N	2026-07-28 17:57:28.976461+00	2026-07-28 17:57:28.976461+00
5ef623eb-7427-4446-a719-79c0e862a90e	adb6bf84-0d87-4ffc-a571-49dca2d19c70	bd25fecb27195a18c6d4f76c3c58bf5b478e1269bd6016b0529aa8e3edcfe7b9	39.34.189.67	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-30 12:05:06.901916+00	\N	2026-07-31 12:05:06.902497+00	2026-07-31 12:05:06.902497+00
ba188b22-c81d-4a3e-9cee-3767f3e61f12	adb6bf84-0d87-4ffc-a571-49dca2d19c70	954d765ccb6ce919b455fca3244f77c30e40a61ef977257a5671eed897005c33	39.34.189.67	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-30 13:26:05.186979+00	\N	2026-07-31 13:26:05.188724+00	2026-07-31 13:26:05.188724+00
44ac65ab-7ae7-414a-9630-19cd0d5fc5a2	adb6bf84-0d87-4ffc-a571-49dca2d19c70	e15ced93a5927e9c1f9b9e7fdb4871d8e3cfc7b7453fbc8f6e10fcef39a6bfd7	39.34.189.51	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-31 23:22:40.664841+00	\N	2026-08-01 23:22:40.666872+00	2026-08-01 23:22:40.666872+00
493c87cd-2694-4c53-9161-406d90e5ee75	adb6bf84-0d87-4ffc-a571-49dca2d19c70	b60856954b8f33c73d9913ab6f8517ad97c2ebe86770371249d6c448ee653ea6	39.34.187.133	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-09-01 11:23:08.907442+00	\N	2026-08-02 11:23:08.909288+00	2026-08-02 11:23:08.909288+00
deaa17cb-5f36-43e4-9ce7-22298b5ac541	adb6bf84-0d87-4ffc-a571-49dca2d19c70	cdbe51b36d21014194b973607ce030ba6be55a48575b67167d4a0ef69fec5513	39.34.187.124	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-09-01 16:40:57.502676+00	\N	2026-08-02 16:40:57.504403+00	2026-08-02 16:40:57.504403+00
798b39ec-2717-4155-91ef-f9617b32322b	adb6bf84-0d87-4ffc-a571-49dca2d19c70	cb1f0a2a1a8b1d580cb4c94fc622fde08fa928db15597c9a49fbeebe19851c63	39.34.187.124	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-09-01 18:10:22.082267+00	\N	2026-08-02 18:10:22.085353+00	2026-08-02 18:10:22.085353+00
63522b90-dce2-4ade-b0d0-e843758bb597	adb6bf84-0d87-4ffc-a571-49dca2d19c70	371fdf4f3333c489d64885334dde27dbebb052a86b2acba17a56a39b9031d785	39.34.187.124	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-09-01 20:39:02.43235+00	\N	2026-08-02 20:39:02.432979+00	2026-08-02 20:39:02.432979+00
80887901-f8a2-46a7-9427-7c5fcc243255	adb6bf84-0d87-4ffc-a571-49dca2d19c70	4a23641f901ca21c41ef4f18bf0fa772e1a0cf9a9da1677c85a8144651d77d39	39.34.187.133	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-09-02 13:01:35.556517+00	\N	2026-08-03 13:01:35.558692+00	2026-08-03 13:01:35.558692+00
aed77bd5-1c4a-4647-8729-dd4706a71f3e	adb6bf84-0d87-4ffc-a571-49dca2d19c70	98fa45836bfc2e3ff0a2d190ea5e1cef3175c4c853dac255408690c26cc245a7	39.34.186.177	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-09-02 19:20:38.27199+00	\N	2026-08-03 19:20:38.274354+00	2026-08-03 19:20:38.274354+00
49433197-be4a-4ff7-ac53-b7c0110db961	adb6bf84-0d87-4ffc-a571-49dca2d19c70	88bf237a8f73236626cf4a578f9e64fb620b593a60820acda043cf296526eedd	39.34.190.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-09-03 07:09:04.04719+00	\N	2026-08-04 07:09:04.047665+00	2026-08-04 07:09:04.047665+00
2b34310d-abbc-430d-bf14-0415c2fa2e31	adb6bf84-0d87-4ffc-a571-49dca2d19c70	9927d77cde9e1ca8c205650bc60af1ac91bd0bd12a2412b501569a8abedf7539	39.34.191.21	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-09-03 19:21:57.486602+00	\N	2026-08-04 19:21:57.487142+00	2026-08-04 19:21:57.487142+00
941b0d44-665d-4fd2-9975-926b28c134e3	adb6bf84-0d87-4ffc-a571-49dca2d19c70	a6bd64237ae93fd6e36ef04abe41897b945d885755c8ffdfc906dec16bd4a558	39.34.191.21	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-09-03 20:32:14.03325+00	\N	2026-08-04 20:32:14.033676+00	2026-08-04 20:32:14.033676+00
3e3729a9-5d43-40c3-a565-9c2b2991eee6	adb6bf84-0d87-4ffc-a571-49dca2d19c70	e8a75dceff9814d39ad18c78bda7411a1e7017ed1c06d6ff6d3b402bc0555f8b	39.34.190.169	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-09-04 18:44:55.709016+00	\N	2026-08-05 18:44:55.710877+00	2026-08-05 18:44:55.710877+00
1c36271e-ed70-48cf-82e0-6d8e60aa6752	adb6bf84-0d87-4ffc-a571-49dca2d19c70	5e2becc4862adbe8379a57b6fcf90be2cd98169a33231cd123c543af1de12d37	39.34.187.246	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-09-04 21:37:25.185494+00	\N	2026-08-05 21:37:25.187871+00	2026-08-05 21:37:25.187871+00
e1b9f173-48b4-4ec6-bf89-4b9eee277e7b	adb6bf84-0d87-4ffc-a571-49dca2d19c70	b2c6feec658529e0271066847e369d9486b3c3b1cc4348f0cc8f6d5d4f9140c9	39.34.189.196	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-09-06 08:38:25.512467+00	\N	2026-08-07 08:38:25.514657+00	2026-08-07 08:38:25.514657+00
ecd41bcf-a69e-48ff-b5c4-161845041310	adb6bf84-0d87-4ffc-a571-49dca2d19c70	8da807c64d429eb5ef8c8976576705d2054e9a862e14c3be7bef6a285ac7f08b	39.34.186.19	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-09-06 17:59:34.636432+00	\N	2026-08-07 17:59:34.638483+00	2026-08-07 17:59:34.638483+00
1e2edc83-b735-4ce1-b49d-3a22694f5c83	adb6bf84-0d87-4ffc-a571-49dca2d19c70	363acff23b1d0d78f95c5d2b0c70193d5959e0a26df2fe031f98201bc6c15062	39.34.186.19	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-09-06 18:54:17.766477+00	\N	2026-08-07 18:54:17.76695+00	2026-08-07 18:54:17.76695+00
a723fc0b-a886-4a0b-b999-c2ceead3592e	adb6bf84-0d87-4ffc-a571-49dca2d19c70	e6b9ca5873d462544b1dd31c0d256fb007fc0c17f9a8231198e495760d708aef	39.34.186.19	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-09-06 19:52:28.335243+00	\N	2026-08-07 19:52:28.335633+00	2026-08-07 19:52:28.335633+00
4bdaec78-5be6-411a-9ebf-4b4b00a1e1ce	adb6bf84-0d87-4ffc-a571-49dca2d19c70	1bf9fab15106ab3e3d78fe398dd4996fb6acb9b0137a9d7c0f67b6b4904d2f62	39.34.190.132	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-09-07 10:42:05.99161+00	\N	2026-08-08 10:42:05.994101+00	2026-08-08 10:42:05.994101+00
6d44ac78-0bea-490c-b69d-e5f5e07b3355	adb6bf84-0d87-4ffc-a571-49dca2d19c70	b20c13543b6071414eacb6fd26475aa2f2e6e40a8bbdfd28d267ad833a22d720	39.34.191.179	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-09-07 17:34:40.04778+00	\N	2026-08-08 17:34:40.048238+00	2026-08-08 17:34:40.048238+00
aa2311b7-cbfe-443e-99ec-7132fae2bb41	adb6bf84-0d87-4ffc-a571-49dca2d19c70	b2c7d44357a1a12717d5aa29a7958724b1adbd12e5dbbee8b17e5cbaad850674	39.34.186.159	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-09-08 16:03:36.229871+00	\N	2026-08-09 16:03:36.2306+00	2026-08-09 16:03:36.2306+00
93f38765-fd41-46aa-a485-25c0a39e71d9	adb6bf84-0d87-4ffc-a571-49dca2d19c70	93490a49558f6bc92181a5cb477f07a174f4283c6fc951469dc8a56cd6a03e91	39.34.189.9	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-09-09 10:23:31.096796+00	\N	2026-08-10 10:23:31.09967+00	2026-08-10 10:23:31.09967+00
606a31f5-51c6-4790-83cc-8677398c6545	adb6bf84-0d87-4ffc-a571-49dca2d19c70	581424ae5101910a5ed1222eb2b2d50ce0b66e2c7798b664c534e820c668aa09	39.34.191.149	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-09-10 18:12:55.35919+00	\N	2026-08-11 18:12:55.361162+00	2026-08-11 18:12:55.361162+00
b3bef1fa-a533-4b5a-b86d-a686a777eb01	adb6bf84-0d87-4ffc-a571-49dca2d19c70	d41742fb2f2382f40b3c4652be56bcc8099899f349becd37839463ac56fe2cfc	39.34.187.42	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-09-10 19:12:51.107525+00	\N	2026-08-11 19:12:51.109771+00	2026-08-11 19:12:51.109771+00
604d619c-662b-4004-aa90-ed70e0561d18	adb6bf84-0d87-4ffc-a571-49dca2d19c70	f7c7f0c2fd95330d4b1db8a5b4e7f30e600fe92c83dc362e5fc45052a5e5b623	39.34.191.101	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-09-11 07:09:48.50335+00	\N	2026-08-12 07:09:48.506411+00	2026-08-12 07:09:48.506411+00
cbe31b83-dde9-467b-be24-7d49dadd30c6	adb6bf84-0d87-4ffc-a571-49dca2d19c70	891f421216db5b528b67228befd6b6aaa13113e574cdcf8010067bd675cff4d2	39.34.187.173	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-09-11 17:51:39.162077+00	\N	2026-08-12 17:51:39.16439+00	2026-08-12 17:51:39.16439+00
862b0b61-2216-4a81-897b-6ab56070bd84	adb6bf84-0d87-4ffc-a571-49dca2d19c70	6e80094e55b20226416bdca080911c05d7baec0df5aef8a9caeb1972067fb596	39.34.187.173	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-09-11 20:15:54.994548+00	\N	2026-08-12 20:15:54.995941+00	2026-08-12 20:15:54.995941+00
b070eb5b-6be8-4f16-89fa-c078b55c5696	adb6bf84-0d87-4ffc-a571-49dca2d19c70	65175191ea04f466b845d6ef9aedb77fe50143aa3b2664df1fa77a7acdbe88c5	39.34.188.60	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-09-12 19:33:37.239708+00	\N	2026-08-13 19:33:37.242859+00	2026-08-13 19:33:37.242859+00
86a7843e-812b-487a-b80e-dc37146b93ba	adb6bf84-0d87-4ffc-a571-49dca2d19c70	1715036568faeab7ae3ceeacec177e889a6007ca13d92fe68a113660476eaed7	39.34.188.60	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-14 07:55:27.264114+00	\N	2026-08-13 19:55:27.26459+00	2026-08-13 19:55:27.26459+00
\.


--
-- Data for Name: auth_users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.auth_users (id, tenant_id, email, password_hash, role, status, failed_login_count, locked_until, last_login_at, created_at, updated_at, must_change_password) FROM stdin;
41d17ca8-21b2-4928-9156-1d9218b2d2a6	tenant_4f049da4cac745988b96821d9e0051b3	shahnaz@gmail.com	$argon2id$v=19$m=65536,t=3,p=2$eXZ9XKeymvpugcYSbio72g$XcjQ4gdxmI3/6s3+jft8jE44f4PPdjzOP1Gaa22CET8	client_admin	active	0	\N	\N	2026-06-09 18:49:36.152423+00	2026-07-17 16:08:42.998721+00	t
5cc47739-5212-48ff-ad30-f6dffa708d03	tenant_7d8ca36774ec47eb9d27fe5efbdea672	client-login-test-1780931800@example.com	$argon2id$v=19$m=65536,t=3,p=2$zc7HC4HWNlQAtH+C94pITg$yyZPodDmnjUV0dYN3QOeRvHiT/1Aj/91y4WY3PWm+pA	client_admin	active	0	\N	2026-06-08 17:50:09.333287+00	2026-06-08 15:18:09.399556+00	2026-06-12 14:51:32.828741+00	f
9d735fb3-ef34-47c3-add7-75c17bd0a583	tenant_2e0168deffa441b3be1aac8c13171b05	humaya@gmail.com	$argon2id$v=19$m=65536,t=3,p=2$zlElmf/5mxUpWFFFHkO+/Q$sPbuKX4RK7DKktb4bpgxT9qp1HhE7+VFA19t6RmeEp8	client_admin	active	0	\N	\N	2026-06-09 18:15:29.595955+00	2026-06-09 18:15:29.595955+00	f
4ce6f50e-a5cd-4d11-bb3a-194687c63550	tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	nanaononoasi2@gmail.com	$argon2id$v=19$m=65536,t=3,p=2$TCZ0DzAkYCKK/gJe+bu7Xw$3ebD6Kul8eiQDgm6pvWySxgQJGZYzIxz0822FwhJ6WY	client_admin	active	0	\N	\N	2026-06-08 15:12:56.339631+00	2026-06-10 19:05:19.066497+00	f
adb6bf84-0d87-4ffc-a571-49dca2d19c70	system	superadmin@softcodesolution.local	$argon2id$v=19$m=65536,t=3,p=2$V/C2ml7LUKexNVy/xKJikw$B+bt8pSq+zmrFeEOitT5bn6ne6z4IghSfqqREjFNYEc	super_admin	active	0	\N	2026-08-13 19:55:27.267786+00	2026-06-07 09:52:43.358137+00	2026-08-13 19:55:27.267786+00	f
\.


--
-- Data for Name: backup_business_plan_matrix_20260616_215352; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.backup_business_plan_matrix_20260616_215352 (business_type, plan_id, monthly_price, yearly_price, status, sort_order, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: backup_business_plan_matrix_official_20260616_222612; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.backup_business_plan_matrix_official_20260616_222612 (business_type, plan_id, monthly_price, yearly_price, status, sort_order, created_at, updated_at) FROM stdin;
pharmacy	starter	2000.00	20000.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
pharmacy	pro	4000.00	40000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
pharmacy	enterprise	7200.00	72000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
pharmacy	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
law_firm	starter	2000.00	20000.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
law_firm	pro	4000.00	40000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
law_firm	enterprise	7200.00	72000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
law_firm	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
store	starter	5250.00	52500.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
store	pro	10500.00	105000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
store	enterprise	18900.00	189000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
store	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
agriculture	starter	2000.00	20000.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
agriculture	pro	4000.00	40000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
agriculture	enterprise	7200.00	72000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
agriculture	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
hr_recruitment	starter	2000.00	20000.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
hr_recruitment	pro	4000.00	40000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
hr_recruitment	enterprise	7200.00	72000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
hr_recruitment	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
automation	starter	1500.00	15000.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
automation	pro	3500.00	35000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
automation	enterprise	7000.00	70000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
automation	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
communication	starter	1500.00	15000.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
communication	pro	3500.00	35000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
communication	enterprise	7000.00	70000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
communication	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
license	starter	1500.00	15000.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
license	pro	3500.00	35000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
license	enterprise	7000.00	70000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
license	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
dental	starter	2250.00	22500.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
dental	pro	4500.00	45000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
dental	enterprise	8100.00	81000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
dental	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
manufacturing	starter	2750.00	27500.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
manufacturing	pro	5500.00	55000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
manufacturing	enterprise	9900.00	99000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
manufacturing	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
restaurant	starter	4500.00	45000.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
restaurant	pro	9000.00	90000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
restaurant	enterprise	16200.00	162000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
restaurant	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
services	starter	1500.00	15000.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
services	pro	3500.00	35000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
services	enterprise	7000.00	70000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
services	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
logistics	starter	2000.00	20000.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
logistics	pro	4000.00	40000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
logistics	enterprise	7200.00	72000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
logistics	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
security	starter	1500.00	15000.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
security	pro	3500.00	35000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
security	enterprise	7000.00	70000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
security	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
construction	starter	2000.00	20000.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
construction	pro	4000.00	40000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
construction	enterprise	7200.00	72000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
construction	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
hotel	starter	2750.00	27500.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
hotel	pro	5500.00	55000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
hotel	enterprise	9900.00	99000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
hotel	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
travel	starter	2000.00	20000.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
travel	pro	4000.00	40000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
travel	enterprise	7200.00	72000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
travel	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
business	starter	1500.00	15000.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
business	pro	3500.00	35000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
business	enterprise	7000.00	70000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
business	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
clinic	starter	4750.00	47500.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
clinic	pro	9500.00	95000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
clinic	enterprise	17100.00	171000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
clinic	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
ai	starter	1500.00	15000.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
ai	pro	3500.00	35000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
ai	enterprise	7000.00	70000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
ai	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
salon	starter	3000.00	30000.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
salon	pro	6000.00	60000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
salon	enterprise	10800.00	108000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
salon	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
test	starter	1500.00	15000.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
test	pro	3500.00	35000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
test	enterprise	7000.00	70000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
test	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
event_management	starter	2000.00	20000.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
event_management	pro	4000.00	40000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
event_management	enterprise	7200.00	72000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
event_management	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
payments	starter	1500.00	15000.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
payments	pro	3500.00	35000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
payments	enterprise	7000.00	70000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
payments	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
gym	starter	1500.00	15000.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
gym	pro	3500.00	35000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
gym	enterprise	7000.00	70000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
gym	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
ecommerce	starter	3000.00	30000.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
ecommerce	pro	6000.00	60000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
ecommerce	enterprise	10800.00	108000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
ecommerce	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
ngo	starter	2000.00	20000.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
ngo	pro	4000.00	40000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
ngo	enterprise	7200.00	72000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
ngo	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
accounting_tax	starter	2000.00	20000.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
accounting_tax	pro	4000.00	40000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
accounting_tax	enterprise	7200.00	72000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
accounting_tax	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
integrations	starter	1500.00	15000.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
integrations	pro	3500.00	35000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
integrations	enterprise	7000.00	70000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
integrations	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
auto_workshop	starter	2000.00	20000.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
auto_workshop	pro	4000.00	40000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
auto_workshop	enterprise	7200.00	72000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
auto_workshop	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
school	starter	5750.00	57500.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
school	pro	11500.00	115000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
school	enterprise	20700.00	207000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
school	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
finance	starter	1500.00	15000.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
finance	pro	3500.00	35000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
finance	enterprise	7000.00	70000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
finance	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
professional_services	starter	2000.00	20000.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
professional_services	pro	4000.00	40000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
professional_services	enterprise	7200.00	72000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
professional_services	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
analytics	starter	1500.00	15000.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
analytics	pro	3500.00	35000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
analytics	enterprise	7000.00	70000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
analytics	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
real_estate	starter	2750.00	27500.00	active	10	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
real_estate	pro	5500.00	55000.00	active	20	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
real_estate	enterprise	9900.00	99000.00	active	30	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
real_estate	custom	0.00	0.00	active	40	2026-06-16 21:53:53.209687+00	2026-06-16 21:53:53.209687+00
\.


--
-- Data for Name: backup_business_plan_modules_20260616_215352; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.backup_business_plan_modules_20260616_215352 (business_type, plan_id, module_id, created_at) FROM stdin;
\.


--
-- Data for Name: backup_business_plan_modules_official_20260616_222612; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.backup_business_plan_modules_official_20260616_222612 (business_type, plan_id, module_id, created_at) FROM stdin;
pharmacy	starter	core_dashboard	2026-06-16 21:53:53.209687+00
pharmacy	pro	core_dashboard	2026-06-16 21:53:53.209687+00
pharmacy	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
law_firm	starter	core_dashboard	2026-06-16 21:53:53.209687+00
law_firm	pro	core_dashboard	2026-06-16 21:53:53.209687+00
law_firm	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
store	starter	core_dashboard	2026-06-16 21:53:53.209687+00
store	pro	core_dashboard	2026-06-16 21:53:53.209687+00
store	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
agriculture	starter	core_dashboard	2026-06-16 21:53:53.209687+00
agriculture	pro	core_dashboard	2026-06-16 21:53:53.209687+00
agriculture	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
hr_recruitment	starter	core_dashboard	2026-06-16 21:53:53.209687+00
hr_recruitment	pro	core_dashboard	2026-06-16 21:53:53.209687+00
hr_recruitment	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
automation	starter	core_dashboard	2026-06-16 21:53:53.209687+00
automation	pro	core_dashboard	2026-06-16 21:53:53.209687+00
automation	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
communication	starter	core_dashboard	2026-06-16 21:53:53.209687+00
communication	pro	core_dashboard	2026-06-16 21:53:53.209687+00
communication	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
license	starter	core_dashboard	2026-06-16 21:53:53.209687+00
license	pro	core_dashboard	2026-06-16 21:53:53.209687+00
license	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
dental	starter	core_dashboard	2026-06-16 21:53:53.209687+00
dental	pro	core_dashboard	2026-06-16 21:53:53.209687+00
dental	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
manufacturing	starter	core_dashboard	2026-06-16 21:53:53.209687+00
manufacturing	pro	core_dashboard	2026-06-16 21:53:53.209687+00
manufacturing	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
restaurant	starter	core_dashboard	2026-06-16 21:53:53.209687+00
restaurant	pro	core_dashboard	2026-06-16 21:53:53.209687+00
restaurant	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
services	starter	core_dashboard	2026-06-16 21:53:53.209687+00
services	pro	core_dashboard	2026-06-16 21:53:53.209687+00
services	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
logistics	starter	core_dashboard	2026-06-16 21:53:53.209687+00
logistics	pro	core_dashboard	2026-06-16 21:53:53.209687+00
logistics	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
security	starter	core_dashboard	2026-06-16 21:53:53.209687+00
security	pro	core_dashboard	2026-06-16 21:53:53.209687+00
security	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
construction	starter	core_dashboard	2026-06-16 21:53:53.209687+00
construction	pro	core_dashboard	2026-06-16 21:53:53.209687+00
construction	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
hotel	starter	core_dashboard	2026-06-16 21:53:53.209687+00
hotel	pro	core_dashboard	2026-06-16 21:53:53.209687+00
hotel	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
travel	starter	core_dashboard	2026-06-16 21:53:53.209687+00
travel	pro	core_dashboard	2026-06-16 21:53:53.209687+00
travel	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
business	starter	core_dashboard	2026-06-16 21:53:53.209687+00
business	pro	core_dashboard	2026-06-16 21:53:53.209687+00
business	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
clinic	starter	core_dashboard	2026-06-16 21:53:53.209687+00
clinic	pro	core_dashboard	2026-06-16 21:53:53.209687+00
clinic	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
ai	starter	core_dashboard	2026-06-16 21:53:53.209687+00
ai	pro	core_dashboard	2026-06-16 21:53:53.209687+00
ai	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
salon	starter	core_dashboard	2026-06-16 21:53:53.209687+00
salon	pro	core_dashboard	2026-06-16 21:53:53.209687+00
salon	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
test	starter	core_dashboard	2026-06-16 21:53:53.209687+00
test	pro	core_dashboard	2026-06-16 21:53:53.209687+00
test	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
event_management	starter	core_dashboard	2026-06-16 21:53:53.209687+00
event_management	pro	core_dashboard	2026-06-16 21:53:53.209687+00
event_management	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
payments	starter	core_dashboard	2026-06-16 21:53:53.209687+00
payments	pro	core_dashboard	2026-06-16 21:53:53.209687+00
payments	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
gym	starter	core_dashboard	2026-06-16 21:53:53.209687+00
gym	pro	core_dashboard	2026-06-16 21:53:53.209687+00
gym	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
ecommerce	starter	core_dashboard	2026-06-16 21:53:53.209687+00
ecommerce	pro	core_dashboard	2026-06-16 21:53:53.209687+00
ecommerce	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
ngo	starter	core_dashboard	2026-06-16 21:53:53.209687+00
ngo	pro	core_dashboard	2026-06-16 21:53:53.209687+00
ngo	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
accounting_tax	starter	core_dashboard	2026-06-16 21:53:53.209687+00
accounting_tax	pro	core_dashboard	2026-06-16 21:53:53.209687+00
accounting_tax	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
integrations	starter	core_dashboard	2026-06-16 21:53:53.209687+00
integrations	pro	core_dashboard	2026-06-16 21:53:53.209687+00
integrations	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
auto_workshop	starter	core_dashboard	2026-06-16 21:53:53.209687+00
auto_workshop	pro	core_dashboard	2026-06-16 21:53:53.209687+00
auto_workshop	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
school	starter	core_dashboard	2026-06-16 21:53:53.209687+00
school	pro	core_dashboard	2026-06-16 21:53:53.209687+00
school	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
finance	starter	core_dashboard	2026-06-16 21:53:53.209687+00
finance	pro	core_dashboard	2026-06-16 21:53:53.209687+00
finance	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
professional_services	starter	core_dashboard	2026-06-16 21:53:53.209687+00
professional_services	pro	core_dashboard	2026-06-16 21:53:53.209687+00
professional_services	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
analytics	starter	core_dashboard	2026-06-16 21:53:53.209687+00
analytics	pro	core_dashboard	2026-06-16 21:53:53.209687+00
analytics	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
real_estate	starter	core_dashboard	2026-06-16 21:53:53.209687+00
real_estate	pro	core_dashboard	2026-06-16 21:53:53.209687+00
real_estate	enterprise	core_dashboard	2026-06-16 21:53:53.209687+00
pharmacy	starter	core_branches	2026-06-16 21:53:53.209687+00
pharmacy	pro	core_branches	2026-06-16 21:53:53.209687+00
pharmacy	enterprise	core_branches	2026-06-16 21:53:53.209687+00
law_firm	starter	core_branches	2026-06-16 21:53:53.209687+00
law_firm	pro	core_branches	2026-06-16 21:53:53.209687+00
law_firm	enterprise	core_branches	2026-06-16 21:53:53.209687+00
store	starter	core_branches	2026-06-16 21:53:53.209687+00
store	pro	core_branches	2026-06-16 21:53:53.209687+00
store	enterprise	core_branches	2026-06-16 21:53:53.209687+00
agriculture	starter	core_branches	2026-06-16 21:53:53.209687+00
agriculture	pro	core_branches	2026-06-16 21:53:53.209687+00
agriculture	enterprise	core_branches	2026-06-16 21:53:53.209687+00
hr_recruitment	starter	core_branches	2026-06-16 21:53:53.209687+00
hr_recruitment	pro	core_branches	2026-06-16 21:53:53.209687+00
hr_recruitment	enterprise	core_branches	2026-06-16 21:53:53.209687+00
automation	starter	core_branches	2026-06-16 21:53:53.209687+00
automation	pro	core_branches	2026-06-16 21:53:53.209687+00
automation	enterprise	core_branches	2026-06-16 21:53:53.209687+00
communication	starter	core_branches	2026-06-16 21:53:53.209687+00
communication	pro	core_branches	2026-06-16 21:53:53.209687+00
communication	enterprise	core_branches	2026-06-16 21:53:53.209687+00
license	starter	core_branches	2026-06-16 21:53:53.209687+00
license	pro	core_branches	2026-06-16 21:53:53.209687+00
license	enterprise	core_branches	2026-06-16 21:53:53.209687+00
dental	starter	core_branches	2026-06-16 21:53:53.209687+00
dental	pro	core_branches	2026-06-16 21:53:53.209687+00
dental	enterprise	core_branches	2026-06-16 21:53:53.209687+00
manufacturing	starter	core_branches	2026-06-16 21:53:53.209687+00
manufacturing	pro	core_branches	2026-06-16 21:53:53.209687+00
manufacturing	enterprise	core_branches	2026-06-16 21:53:53.209687+00
restaurant	starter	core_branches	2026-06-16 21:53:53.209687+00
restaurant	pro	core_branches	2026-06-16 21:53:53.209687+00
restaurant	enterprise	core_branches	2026-06-16 21:53:53.209687+00
services	starter	core_branches	2026-06-16 21:53:53.209687+00
services	pro	core_branches	2026-06-16 21:53:53.209687+00
services	enterprise	core_branches	2026-06-16 21:53:53.209687+00
logistics	starter	core_branches	2026-06-16 21:53:53.209687+00
logistics	pro	core_branches	2026-06-16 21:53:53.209687+00
logistics	enterprise	core_branches	2026-06-16 21:53:53.209687+00
security	starter	core_branches	2026-06-16 21:53:53.209687+00
security	pro	core_branches	2026-06-16 21:53:53.209687+00
security	enterprise	core_branches	2026-06-16 21:53:53.209687+00
construction	starter	core_branches	2026-06-16 21:53:53.209687+00
construction	pro	core_branches	2026-06-16 21:53:53.209687+00
construction	enterprise	core_branches	2026-06-16 21:53:53.209687+00
hotel	starter	core_branches	2026-06-16 21:53:53.209687+00
hotel	pro	core_branches	2026-06-16 21:53:53.209687+00
hotel	enterprise	core_branches	2026-06-16 21:53:53.209687+00
travel	starter	core_branches	2026-06-16 21:53:53.209687+00
travel	pro	core_branches	2026-06-16 21:53:53.209687+00
travel	enterprise	core_branches	2026-06-16 21:53:53.209687+00
business	starter	core_branches	2026-06-16 21:53:53.209687+00
business	pro	core_branches	2026-06-16 21:53:53.209687+00
business	enterprise	core_branches	2026-06-16 21:53:53.209687+00
clinic	starter	core_branches	2026-06-16 21:53:53.209687+00
clinic	pro	core_branches	2026-06-16 21:53:53.209687+00
clinic	enterprise	core_branches	2026-06-16 21:53:53.209687+00
ai	starter	core_branches	2026-06-16 21:53:53.209687+00
ai	pro	core_branches	2026-06-16 21:53:53.209687+00
ai	enterprise	core_branches	2026-06-16 21:53:53.209687+00
salon	starter	core_branches	2026-06-16 21:53:53.209687+00
salon	pro	core_branches	2026-06-16 21:53:53.209687+00
salon	enterprise	core_branches	2026-06-16 21:53:53.209687+00
test	starter	core_branches	2026-06-16 21:53:53.209687+00
test	pro	core_branches	2026-06-16 21:53:53.209687+00
test	enterprise	core_branches	2026-06-16 21:53:53.209687+00
event_management	starter	core_branches	2026-06-16 21:53:53.209687+00
event_management	pro	core_branches	2026-06-16 21:53:53.209687+00
event_management	enterprise	core_branches	2026-06-16 21:53:53.209687+00
payments	starter	core_branches	2026-06-16 21:53:53.209687+00
payments	pro	core_branches	2026-06-16 21:53:53.209687+00
payments	enterprise	core_branches	2026-06-16 21:53:53.209687+00
gym	starter	core_branches	2026-06-16 21:53:53.209687+00
gym	pro	core_branches	2026-06-16 21:53:53.209687+00
gym	enterprise	core_branches	2026-06-16 21:53:53.209687+00
ecommerce	starter	core_branches	2026-06-16 21:53:53.209687+00
ecommerce	pro	core_branches	2026-06-16 21:53:53.209687+00
ecommerce	enterprise	core_branches	2026-06-16 21:53:53.209687+00
ngo	starter	core_branches	2026-06-16 21:53:53.209687+00
ngo	pro	core_branches	2026-06-16 21:53:53.209687+00
ngo	enterprise	core_branches	2026-06-16 21:53:53.209687+00
accounting_tax	starter	core_branches	2026-06-16 21:53:53.209687+00
accounting_tax	pro	core_branches	2026-06-16 21:53:53.209687+00
accounting_tax	enterprise	core_branches	2026-06-16 21:53:53.209687+00
integrations	starter	core_branches	2026-06-16 21:53:53.209687+00
integrations	pro	core_branches	2026-06-16 21:53:53.209687+00
integrations	enterprise	core_branches	2026-06-16 21:53:53.209687+00
auto_workshop	starter	core_branches	2026-06-16 21:53:53.209687+00
auto_workshop	pro	core_branches	2026-06-16 21:53:53.209687+00
auto_workshop	enterprise	core_branches	2026-06-16 21:53:53.209687+00
school	starter	core_branches	2026-06-16 21:53:53.209687+00
school	pro	core_branches	2026-06-16 21:53:53.209687+00
school	enterprise	core_branches	2026-06-16 21:53:53.209687+00
finance	starter	core_branches	2026-06-16 21:53:53.209687+00
finance	pro	core_branches	2026-06-16 21:53:53.209687+00
finance	enterprise	core_branches	2026-06-16 21:53:53.209687+00
professional_services	starter	core_branches	2026-06-16 21:53:53.209687+00
professional_services	pro	core_branches	2026-06-16 21:53:53.209687+00
professional_services	enterprise	core_branches	2026-06-16 21:53:53.209687+00
analytics	starter	core_branches	2026-06-16 21:53:53.209687+00
analytics	pro	core_branches	2026-06-16 21:53:53.209687+00
analytics	enterprise	core_branches	2026-06-16 21:53:53.209687+00
real_estate	starter	core_branches	2026-06-16 21:53:53.209687+00
real_estate	pro	core_branches	2026-06-16 21:53:53.209687+00
real_estate	enterprise	core_branches	2026-06-16 21:53:53.209687+00
pharmacy	starter	core_company_profile	2026-06-16 21:53:53.209687+00
pharmacy	pro	core_company_profile	2026-06-16 21:53:53.209687+00
pharmacy	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
law_firm	starter	core_company_profile	2026-06-16 21:53:53.209687+00
law_firm	pro	core_company_profile	2026-06-16 21:53:53.209687+00
law_firm	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
store	starter	core_company_profile	2026-06-16 21:53:53.209687+00
store	pro	core_company_profile	2026-06-16 21:53:53.209687+00
store	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
agriculture	starter	core_company_profile	2026-06-16 21:53:53.209687+00
agriculture	pro	core_company_profile	2026-06-16 21:53:53.209687+00
agriculture	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
hr_recruitment	starter	core_company_profile	2026-06-16 21:53:53.209687+00
hr_recruitment	pro	core_company_profile	2026-06-16 21:53:53.209687+00
hr_recruitment	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
automation	starter	core_company_profile	2026-06-16 21:53:53.209687+00
automation	pro	core_company_profile	2026-06-16 21:53:53.209687+00
automation	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
communication	starter	core_company_profile	2026-06-16 21:53:53.209687+00
communication	pro	core_company_profile	2026-06-16 21:53:53.209687+00
communication	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
license	starter	core_company_profile	2026-06-16 21:53:53.209687+00
license	pro	core_company_profile	2026-06-16 21:53:53.209687+00
license	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
dental	starter	core_company_profile	2026-06-16 21:53:53.209687+00
dental	pro	core_company_profile	2026-06-16 21:53:53.209687+00
dental	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
manufacturing	starter	core_company_profile	2026-06-16 21:53:53.209687+00
manufacturing	pro	core_company_profile	2026-06-16 21:53:53.209687+00
manufacturing	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
restaurant	starter	core_company_profile	2026-06-16 21:53:53.209687+00
restaurant	pro	core_company_profile	2026-06-16 21:53:53.209687+00
restaurant	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
services	starter	core_company_profile	2026-06-16 21:53:53.209687+00
services	pro	core_company_profile	2026-06-16 21:53:53.209687+00
services	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
logistics	starter	core_company_profile	2026-06-16 21:53:53.209687+00
logistics	pro	core_company_profile	2026-06-16 21:53:53.209687+00
logistics	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
security	starter	core_company_profile	2026-06-16 21:53:53.209687+00
security	pro	core_company_profile	2026-06-16 21:53:53.209687+00
security	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
construction	starter	core_company_profile	2026-06-16 21:53:53.209687+00
construction	pro	core_company_profile	2026-06-16 21:53:53.209687+00
construction	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
hotel	starter	core_company_profile	2026-06-16 21:53:53.209687+00
hotel	pro	core_company_profile	2026-06-16 21:53:53.209687+00
hotel	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
travel	starter	core_company_profile	2026-06-16 21:53:53.209687+00
travel	pro	core_company_profile	2026-06-16 21:53:53.209687+00
travel	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
business	starter	core_company_profile	2026-06-16 21:53:53.209687+00
business	pro	core_company_profile	2026-06-16 21:53:53.209687+00
business	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
clinic	starter	core_company_profile	2026-06-16 21:53:53.209687+00
clinic	pro	core_company_profile	2026-06-16 21:53:53.209687+00
clinic	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
ai	starter	core_company_profile	2026-06-16 21:53:53.209687+00
ai	pro	core_company_profile	2026-06-16 21:53:53.209687+00
ai	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
salon	starter	core_company_profile	2026-06-16 21:53:53.209687+00
salon	pro	core_company_profile	2026-06-16 21:53:53.209687+00
salon	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
test	starter	core_company_profile	2026-06-16 21:53:53.209687+00
test	pro	core_company_profile	2026-06-16 21:53:53.209687+00
test	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
event_management	starter	core_company_profile	2026-06-16 21:53:53.209687+00
event_management	pro	core_company_profile	2026-06-16 21:53:53.209687+00
event_management	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
payments	starter	core_company_profile	2026-06-16 21:53:53.209687+00
payments	pro	core_company_profile	2026-06-16 21:53:53.209687+00
payments	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
gym	starter	core_company_profile	2026-06-16 21:53:53.209687+00
gym	pro	core_company_profile	2026-06-16 21:53:53.209687+00
gym	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
ecommerce	starter	core_company_profile	2026-06-16 21:53:53.209687+00
ecommerce	pro	core_company_profile	2026-06-16 21:53:53.209687+00
ecommerce	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
ngo	starter	core_company_profile	2026-06-16 21:53:53.209687+00
ngo	pro	core_company_profile	2026-06-16 21:53:53.209687+00
ngo	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
accounting_tax	starter	core_company_profile	2026-06-16 21:53:53.209687+00
accounting_tax	pro	core_company_profile	2026-06-16 21:53:53.209687+00
accounting_tax	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
integrations	starter	core_company_profile	2026-06-16 21:53:53.209687+00
integrations	pro	core_company_profile	2026-06-16 21:53:53.209687+00
integrations	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
auto_workshop	starter	core_company_profile	2026-06-16 21:53:53.209687+00
auto_workshop	pro	core_company_profile	2026-06-16 21:53:53.209687+00
auto_workshop	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
school	starter	core_company_profile	2026-06-16 21:53:53.209687+00
school	pro	core_company_profile	2026-06-16 21:53:53.209687+00
school	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
finance	starter	core_company_profile	2026-06-16 21:53:53.209687+00
finance	pro	core_company_profile	2026-06-16 21:53:53.209687+00
finance	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
professional_services	starter	core_company_profile	2026-06-16 21:53:53.209687+00
professional_services	pro	core_company_profile	2026-06-16 21:53:53.209687+00
professional_services	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
analytics	starter	core_company_profile	2026-06-16 21:53:53.209687+00
analytics	pro	core_company_profile	2026-06-16 21:53:53.209687+00
analytics	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
real_estate	starter	core_company_profile	2026-06-16 21:53:53.209687+00
real_estate	pro	core_company_profile	2026-06-16 21:53:53.209687+00
real_estate	enterprise	core_company_profile	2026-06-16 21:53:53.209687+00
pharmacy	starter	core_users	2026-06-16 21:53:53.209687+00
pharmacy	pro	core_users	2026-06-16 21:53:53.209687+00
pharmacy	enterprise	core_users	2026-06-16 21:53:53.209687+00
law_firm	starter	core_users	2026-06-16 21:53:53.209687+00
law_firm	pro	core_users	2026-06-16 21:53:53.209687+00
law_firm	enterprise	core_users	2026-06-16 21:53:53.209687+00
store	starter	core_users	2026-06-16 21:53:53.209687+00
store	pro	core_users	2026-06-16 21:53:53.209687+00
store	enterprise	core_users	2026-06-16 21:53:53.209687+00
agriculture	starter	core_users	2026-06-16 21:53:53.209687+00
agriculture	pro	core_users	2026-06-16 21:53:53.209687+00
agriculture	enterprise	core_users	2026-06-16 21:53:53.209687+00
hr_recruitment	starter	core_users	2026-06-16 21:53:53.209687+00
hr_recruitment	pro	core_users	2026-06-16 21:53:53.209687+00
hr_recruitment	enterprise	core_users	2026-06-16 21:53:53.209687+00
automation	starter	core_users	2026-06-16 21:53:53.209687+00
automation	pro	core_users	2026-06-16 21:53:53.209687+00
automation	enterprise	core_users	2026-06-16 21:53:53.209687+00
communication	starter	core_users	2026-06-16 21:53:53.209687+00
communication	pro	core_users	2026-06-16 21:53:53.209687+00
communication	enterprise	core_users	2026-06-16 21:53:53.209687+00
license	starter	core_users	2026-06-16 21:53:53.209687+00
license	pro	core_users	2026-06-16 21:53:53.209687+00
license	enterprise	core_users	2026-06-16 21:53:53.209687+00
dental	starter	core_users	2026-06-16 21:53:53.209687+00
dental	pro	core_users	2026-06-16 21:53:53.209687+00
dental	enterprise	core_users	2026-06-16 21:53:53.209687+00
manufacturing	starter	core_users	2026-06-16 21:53:53.209687+00
manufacturing	pro	core_users	2026-06-16 21:53:53.209687+00
manufacturing	enterprise	core_users	2026-06-16 21:53:53.209687+00
restaurant	starter	core_users	2026-06-16 21:53:53.209687+00
restaurant	pro	core_users	2026-06-16 21:53:53.209687+00
restaurant	enterprise	core_users	2026-06-16 21:53:53.209687+00
services	starter	core_users	2026-06-16 21:53:53.209687+00
services	pro	core_users	2026-06-16 21:53:53.209687+00
services	enterprise	core_users	2026-06-16 21:53:53.209687+00
logistics	starter	core_users	2026-06-16 21:53:53.209687+00
logistics	pro	core_users	2026-06-16 21:53:53.209687+00
logistics	enterprise	core_users	2026-06-16 21:53:53.209687+00
security	starter	core_users	2026-06-16 21:53:53.209687+00
security	pro	core_users	2026-06-16 21:53:53.209687+00
security	enterprise	core_users	2026-06-16 21:53:53.209687+00
construction	starter	core_users	2026-06-16 21:53:53.209687+00
construction	pro	core_users	2026-06-16 21:53:53.209687+00
construction	enterprise	core_users	2026-06-16 21:53:53.209687+00
hotel	starter	core_users	2026-06-16 21:53:53.209687+00
hotel	pro	core_users	2026-06-16 21:53:53.209687+00
hotel	enterprise	core_users	2026-06-16 21:53:53.209687+00
travel	starter	core_users	2026-06-16 21:53:53.209687+00
travel	pro	core_users	2026-06-16 21:53:53.209687+00
travel	enterprise	core_users	2026-06-16 21:53:53.209687+00
business	starter	core_users	2026-06-16 21:53:53.209687+00
business	pro	core_users	2026-06-16 21:53:53.209687+00
business	enterprise	core_users	2026-06-16 21:53:53.209687+00
clinic	starter	core_users	2026-06-16 21:53:53.209687+00
clinic	pro	core_users	2026-06-16 21:53:53.209687+00
clinic	enterprise	core_users	2026-06-16 21:53:53.209687+00
ai	starter	core_users	2026-06-16 21:53:53.209687+00
ai	pro	core_users	2026-06-16 21:53:53.209687+00
ai	enterprise	core_users	2026-06-16 21:53:53.209687+00
salon	starter	core_users	2026-06-16 21:53:53.209687+00
salon	pro	core_users	2026-06-16 21:53:53.209687+00
salon	enterprise	core_users	2026-06-16 21:53:53.209687+00
test	starter	core_users	2026-06-16 21:53:53.209687+00
test	pro	core_users	2026-06-16 21:53:53.209687+00
test	enterprise	core_users	2026-06-16 21:53:53.209687+00
event_management	starter	core_users	2026-06-16 21:53:53.209687+00
event_management	pro	core_users	2026-06-16 21:53:53.209687+00
event_management	enterprise	core_users	2026-06-16 21:53:53.209687+00
payments	starter	core_users	2026-06-16 21:53:53.209687+00
payments	pro	core_users	2026-06-16 21:53:53.209687+00
payments	enterprise	core_users	2026-06-16 21:53:53.209687+00
gym	starter	core_users	2026-06-16 21:53:53.209687+00
gym	pro	core_users	2026-06-16 21:53:53.209687+00
gym	enterprise	core_users	2026-06-16 21:53:53.209687+00
ecommerce	starter	core_users	2026-06-16 21:53:53.209687+00
ecommerce	pro	core_users	2026-06-16 21:53:53.209687+00
ecommerce	enterprise	core_users	2026-06-16 21:53:53.209687+00
ngo	starter	core_users	2026-06-16 21:53:53.209687+00
ngo	pro	core_users	2026-06-16 21:53:53.209687+00
ngo	enterprise	core_users	2026-06-16 21:53:53.209687+00
accounting_tax	starter	core_users	2026-06-16 21:53:53.209687+00
accounting_tax	pro	core_users	2026-06-16 21:53:53.209687+00
accounting_tax	enterprise	core_users	2026-06-16 21:53:53.209687+00
integrations	starter	core_users	2026-06-16 21:53:53.209687+00
integrations	pro	core_users	2026-06-16 21:53:53.209687+00
integrations	enterprise	core_users	2026-06-16 21:53:53.209687+00
auto_workshop	starter	core_users	2026-06-16 21:53:53.209687+00
auto_workshop	pro	core_users	2026-06-16 21:53:53.209687+00
auto_workshop	enterprise	core_users	2026-06-16 21:53:53.209687+00
school	starter	core_users	2026-06-16 21:53:53.209687+00
school	pro	core_users	2026-06-16 21:53:53.209687+00
school	enterprise	core_users	2026-06-16 21:53:53.209687+00
finance	starter	core_users	2026-06-16 21:53:53.209687+00
finance	pro	core_users	2026-06-16 21:53:53.209687+00
finance	enterprise	core_users	2026-06-16 21:53:53.209687+00
professional_services	starter	core_users	2026-06-16 21:53:53.209687+00
professional_services	pro	core_users	2026-06-16 21:53:53.209687+00
professional_services	enterprise	core_users	2026-06-16 21:53:53.209687+00
analytics	starter	core_users	2026-06-16 21:53:53.209687+00
analytics	pro	core_users	2026-06-16 21:53:53.209687+00
analytics	enterprise	core_users	2026-06-16 21:53:53.209687+00
real_estate	starter	core_users	2026-06-16 21:53:53.209687+00
real_estate	pro	core_users	2026-06-16 21:53:53.209687+00
real_estate	enterprise	core_users	2026-06-16 21:53:53.209687+00
pharmacy	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
pharmacy	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
pharmacy	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
law_firm	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
law_firm	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
law_firm	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
store	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
store	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
store	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
agriculture	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
agriculture	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
agriculture	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
hr_recruitment	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
hr_recruitment	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
hr_recruitment	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
automation	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
automation	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
automation	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
communication	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
communication	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
communication	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
license	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
license	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
license	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
dental	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
dental	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
dental	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
manufacturing	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
manufacturing	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
manufacturing	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
restaurant	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
restaurant	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
restaurant	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
services	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
services	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
services	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
logistics	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
logistics	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
logistics	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
security	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
security	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
security	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
construction	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
construction	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
construction	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
hotel	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
hotel	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
hotel	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
travel	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
travel	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
travel	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
business	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
business	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
business	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
clinic	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
clinic	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
clinic	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
ai	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
ai	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
ai	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
salon	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
salon	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
salon	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
test	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
test	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
test	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
event_management	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
event_management	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
event_management	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
payments	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
payments	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
payments	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
gym	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
gym	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
gym	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
ecommerce	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
ecommerce	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
ecommerce	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
ngo	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
ngo	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
ngo	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
accounting_tax	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
accounting_tax	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
accounting_tax	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
integrations	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
integrations	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
integrations	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
auto_workshop	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
auto_workshop	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
auto_workshop	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
school	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
school	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
school	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
finance	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
finance	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
finance	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
professional_services	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
professional_services	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
professional_services	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
analytics	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
analytics	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
analytics	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
real_estate	starter	core_roles_permissions	2026-06-16 21:53:53.209687+00
real_estate	pro	core_roles_permissions	2026-06-16 21:53:53.209687+00
real_estate	enterprise	core_roles_permissions	2026-06-16 21:53:53.209687+00
pharmacy	starter	core_files	2026-06-16 21:53:53.209687+00
pharmacy	pro	core_files	2026-06-16 21:53:53.209687+00
pharmacy	enterprise	core_files	2026-06-16 21:53:53.209687+00
law_firm	starter	core_files	2026-06-16 21:53:53.209687+00
law_firm	pro	core_files	2026-06-16 21:53:53.209687+00
law_firm	enterprise	core_files	2026-06-16 21:53:53.209687+00
store	starter	core_files	2026-06-16 21:53:53.209687+00
store	pro	core_files	2026-06-16 21:53:53.209687+00
store	enterprise	core_files	2026-06-16 21:53:53.209687+00
agriculture	starter	core_files	2026-06-16 21:53:53.209687+00
agriculture	pro	core_files	2026-06-16 21:53:53.209687+00
agriculture	enterprise	core_files	2026-06-16 21:53:53.209687+00
hr_recruitment	starter	core_files	2026-06-16 21:53:53.209687+00
hr_recruitment	pro	core_files	2026-06-16 21:53:53.209687+00
hr_recruitment	enterprise	core_files	2026-06-16 21:53:53.209687+00
automation	starter	core_files	2026-06-16 21:53:53.209687+00
automation	pro	core_files	2026-06-16 21:53:53.209687+00
automation	enterprise	core_files	2026-06-16 21:53:53.209687+00
communication	starter	core_files	2026-06-16 21:53:53.209687+00
communication	pro	core_files	2026-06-16 21:53:53.209687+00
communication	enterprise	core_files	2026-06-16 21:53:53.209687+00
license	starter	core_files	2026-06-16 21:53:53.209687+00
license	pro	core_files	2026-06-16 21:53:53.209687+00
license	enterprise	core_files	2026-06-16 21:53:53.209687+00
dental	starter	core_files	2026-06-16 21:53:53.209687+00
dental	pro	core_files	2026-06-16 21:53:53.209687+00
dental	enterprise	core_files	2026-06-16 21:53:53.209687+00
manufacturing	starter	core_files	2026-06-16 21:53:53.209687+00
manufacturing	pro	core_files	2026-06-16 21:53:53.209687+00
manufacturing	enterprise	core_files	2026-06-16 21:53:53.209687+00
restaurant	starter	core_files	2026-06-16 21:53:53.209687+00
restaurant	pro	core_files	2026-06-16 21:53:53.209687+00
restaurant	enterprise	core_files	2026-06-16 21:53:53.209687+00
services	starter	core_files	2026-06-16 21:53:53.209687+00
services	pro	core_files	2026-06-16 21:53:53.209687+00
services	enterprise	core_files	2026-06-16 21:53:53.209687+00
logistics	starter	core_files	2026-06-16 21:53:53.209687+00
logistics	pro	core_files	2026-06-16 21:53:53.209687+00
logistics	enterprise	core_files	2026-06-16 21:53:53.209687+00
security	starter	core_files	2026-06-16 21:53:53.209687+00
security	pro	core_files	2026-06-16 21:53:53.209687+00
security	enterprise	core_files	2026-06-16 21:53:53.209687+00
construction	starter	core_files	2026-06-16 21:53:53.209687+00
construction	pro	core_files	2026-06-16 21:53:53.209687+00
construction	enterprise	core_files	2026-06-16 21:53:53.209687+00
hotel	starter	core_files	2026-06-16 21:53:53.209687+00
hotel	pro	core_files	2026-06-16 21:53:53.209687+00
hotel	enterprise	core_files	2026-06-16 21:53:53.209687+00
travel	starter	core_files	2026-06-16 21:53:53.209687+00
travel	pro	core_files	2026-06-16 21:53:53.209687+00
travel	enterprise	core_files	2026-06-16 21:53:53.209687+00
business	starter	core_files	2026-06-16 21:53:53.209687+00
business	pro	core_files	2026-06-16 21:53:53.209687+00
business	enterprise	core_files	2026-06-16 21:53:53.209687+00
clinic	starter	core_files	2026-06-16 21:53:53.209687+00
clinic	pro	core_files	2026-06-16 21:53:53.209687+00
clinic	enterprise	core_files	2026-06-16 21:53:53.209687+00
ai	starter	core_files	2026-06-16 21:53:53.209687+00
ai	pro	core_files	2026-06-16 21:53:53.209687+00
ai	enterprise	core_files	2026-06-16 21:53:53.209687+00
salon	starter	core_files	2026-06-16 21:53:53.209687+00
salon	pro	core_files	2026-06-16 21:53:53.209687+00
salon	enterprise	core_files	2026-06-16 21:53:53.209687+00
test	starter	core_files	2026-06-16 21:53:53.209687+00
test	pro	core_files	2026-06-16 21:53:53.209687+00
test	enterprise	core_files	2026-06-16 21:53:53.209687+00
event_management	starter	core_files	2026-06-16 21:53:53.209687+00
event_management	pro	core_files	2026-06-16 21:53:53.209687+00
event_management	enterprise	core_files	2026-06-16 21:53:53.209687+00
payments	starter	core_files	2026-06-16 21:53:53.209687+00
payments	pro	core_files	2026-06-16 21:53:53.209687+00
payments	enterprise	core_files	2026-06-16 21:53:53.209687+00
gym	starter	core_files	2026-06-16 21:53:53.209687+00
gym	pro	core_files	2026-06-16 21:53:53.209687+00
gym	enterprise	core_files	2026-06-16 21:53:53.209687+00
ecommerce	starter	core_files	2026-06-16 21:53:53.209687+00
ecommerce	pro	core_files	2026-06-16 21:53:53.209687+00
ecommerce	enterprise	core_files	2026-06-16 21:53:53.209687+00
ngo	starter	core_files	2026-06-16 21:53:53.209687+00
ngo	pro	core_files	2026-06-16 21:53:53.209687+00
ngo	enterprise	core_files	2026-06-16 21:53:53.209687+00
accounting_tax	starter	core_files	2026-06-16 21:53:53.209687+00
accounting_tax	pro	core_files	2026-06-16 21:53:53.209687+00
accounting_tax	enterprise	core_files	2026-06-16 21:53:53.209687+00
integrations	starter	core_files	2026-06-16 21:53:53.209687+00
integrations	pro	core_files	2026-06-16 21:53:53.209687+00
integrations	enterprise	core_files	2026-06-16 21:53:53.209687+00
auto_workshop	starter	core_files	2026-06-16 21:53:53.209687+00
auto_workshop	pro	core_files	2026-06-16 21:53:53.209687+00
auto_workshop	enterprise	core_files	2026-06-16 21:53:53.209687+00
school	starter	core_files	2026-06-16 21:53:53.209687+00
school	pro	core_files	2026-06-16 21:53:53.209687+00
school	enterprise	core_files	2026-06-16 21:53:53.209687+00
finance	starter	core_files	2026-06-16 21:53:53.209687+00
finance	pro	core_files	2026-06-16 21:53:53.209687+00
finance	enterprise	core_files	2026-06-16 21:53:53.209687+00
professional_services	starter	core_files	2026-06-16 21:53:53.209687+00
professional_services	pro	core_files	2026-06-16 21:53:53.209687+00
professional_services	enterprise	core_files	2026-06-16 21:53:53.209687+00
analytics	starter	core_files	2026-06-16 21:53:53.209687+00
analytics	pro	core_files	2026-06-16 21:53:53.209687+00
analytics	enterprise	core_files	2026-06-16 21:53:53.209687+00
real_estate	starter	core_files	2026-06-16 21:53:53.209687+00
real_estate	pro	core_files	2026-06-16 21:53:53.209687+00
real_estate	enterprise	core_files	2026-06-16 21:53:53.209687+00
pharmacy	starter	core_calendar	2026-06-16 21:53:53.209687+00
pharmacy	pro	core_calendar	2026-06-16 21:53:53.209687+00
pharmacy	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
law_firm	starter	core_calendar	2026-06-16 21:53:53.209687+00
law_firm	pro	core_calendar	2026-06-16 21:53:53.209687+00
law_firm	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
store	starter	core_calendar	2026-06-16 21:53:53.209687+00
store	pro	core_calendar	2026-06-16 21:53:53.209687+00
store	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
agriculture	starter	core_calendar	2026-06-16 21:53:53.209687+00
agriculture	pro	core_calendar	2026-06-16 21:53:53.209687+00
agriculture	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
hr_recruitment	starter	core_calendar	2026-06-16 21:53:53.209687+00
hr_recruitment	pro	core_calendar	2026-06-16 21:53:53.209687+00
hr_recruitment	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
automation	starter	core_calendar	2026-06-16 21:53:53.209687+00
automation	pro	core_calendar	2026-06-16 21:53:53.209687+00
automation	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
communication	starter	core_calendar	2026-06-16 21:53:53.209687+00
communication	pro	core_calendar	2026-06-16 21:53:53.209687+00
communication	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
license	starter	core_calendar	2026-06-16 21:53:53.209687+00
license	pro	core_calendar	2026-06-16 21:53:53.209687+00
license	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
dental	starter	core_calendar	2026-06-16 21:53:53.209687+00
dental	pro	core_calendar	2026-06-16 21:53:53.209687+00
dental	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
manufacturing	starter	core_calendar	2026-06-16 21:53:53.209687+00
manufacturing	pro	core_calendar	2026-06-16 21:53:53.209687+00
manufacturing	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
restaurant	starter	core_calendar	2026-06-16 21:53:53.209687+00
restaurant	pro	core_calendar	2026-06-16 21:53:53.209687+00
restaurant	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
services	starter	core_calendar	2026-06-16 21:53:53.209687+00
services	pro	core_calendar	2026-06-16 21:53:53.209687+00
services	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
logistics	starter	core_calendar	2026-06-16 21:53:53.209687+00
logistics	pro	core_calendar	2026-06-16 21:53:53.209687+00
logistics	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
security	starter	core_calendar	2026-06-16 21:53:53.209687+00
security	pro	core_calendar	2026-06-16 21:53:53.209687+00
security	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
construction	starter	core_calendar	2026-06-16 21:53:53.209687+00
construction	pro	core_calendar	2026-06-16 21:53:53.209687+00
construction	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
hotel	starter	core_calendar	2026-06-16 21:53:53.209687+00
hotel	pro	core_calendar	2026-06-16 21:53:53.209687+00
hotel	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
travel	starter	core_calendar	2026-06-16 21:53:53.209687+00
travel	pro	core_calendar	2026-06-16 21:53:53.209687+00
travel	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
business	starter	core_calendar	2026-06-16 21:53:53.209687+00
business	pro	core_calendar	2026-06-16 21:53:53.209687+00
business	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
clinic	starter	core_calendar	2026-06-16 21:53:53.209687+00
clinic	pro	core_calendar	2026-06-16 21:53:53.209687+00
clinic	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
ai	starter	core_calendar	2026-06-16 21:53:53.209687+00
ai	pro	core_calendar	2026-06-16 21:53:53.209687+00
ai	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
salon	starter	core_calendar	2026-06-16 21:53:53.209687+00
salon	pro	core_calendar	2026-06-16 21:53:53.209687+00
salon	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
test	starter	core_calendar	2026-06-16 21:53:53.209687+00
test	pro	core_calendar	2026-06-16 21:53:53.209687+00
test	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
event_management	starter	core_calendar	2026-06-16 21:53:53.209687+00
event_management	pro	core_calendar	2026-06-16 21:53:53.209687+00
event_management	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
payments	starter	core_calendar	2026-06-16 21:53:53.209687+00
payments	pro	core_calendar	2026-06-16 21:53:53.209687+00
payments	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
gym	starter	core_calendar	2026-06-16 21:53:53.209687+00
gym	pro	core_calendar	2026-06-16 21:53:53.209687+00
gym	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
ecommerce	starter	core_calendar	2026-06-16 21:53:53.209687+00
ecommerce	pro	core_calendar	2026-06-16 21:53:53.209687+00
ecommerce	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
ngo	starter	core_calendar	2026-06-16 21:53:53.209687+00
ngo	pro	core_calendar	2026-06-16 21:53:53.209687+00
ngo	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
accounting_tax	starter	core_calendar	2026-06-16 21:53:53.209687+00
accounting_tax	pro	core_calendar	2026-06-16 21:53:53.209687+00
accounting_tax	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
integrations	starter	core_calendar	2026-06-16 21:53:53.209687+00
integrations	pro	core_calendar	2026-06-16 21:53:53.209687+00
integrations	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
auto_workshop	starter	core_calendar	2026-06-16 21:53:53.209687+00
auto_workshop	pro	core_calendar	2026-06-16 21:53:53.209687+00
auto_workshop	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
school	starter	core_calendar	2026-06-16 21:53:53.209687+00
school	pro	core_calendar	2026-06-16 21:53:53.209687+00
school	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
finance	starter	core_calendar	2026-06-16 21:53:53.209687+00
finance	pro	core_calendar	2026-06-16 21:53:53.209687+00
finance	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
professional_services	starter	core_calendar	2026-06-16 21:53:53.209687+00
professional_services	pro	core_calendar	2026-06-16 21:53:53.209687+00
professional_services	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
analytics	starter	core_calendar	2026-06-16 21:53:53.209687+00
analytics	pro	core_calendar	2026-06-16 21:53:53.209687+00
analytics	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
real_estate	starter	core_calendar	2026-06-16 21:53:53.209687+00
real_estate	pro	core_calendar	2026-06-16 21:53:53.209687+00
real_estate	enterprise	core_calendar	2026-06-16 21:53:53.209687+00
pharmacy	starter	core_notifications	2026-06-16 21:53:53.209687+00
pharmacy	pro	core_notifications	2026-06-16 21:53:53.209687+00
pharmacy	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
law_firm	starter	core_notifications	2026-06-16 21:53:53.209687+00
law_firm	pro	core_notifications	2026-06-16 21:53:53.209687+00
law_firm	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
store	starter	core_notifications	2026-06-16 21:53:53.209687+00
store	pro	core_notifications	2026-06-16 21:53:53.209687+00
store	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
agriculture	starter	core_notifications	2026-06-16 21:53:53.209687+00
agriculture	pro	core_notifications	2026-06-16 21:53:53.209687+00
agriculture	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
hr_recruitment	starter	core_notifications	2026-06-16 21:53:53.209687+00
hr_recruitment	pro	core_notifications	2026-06-16 21:53:53.209687+00
hr_recruitment	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
automation	starter	core_notifications	2026-06-16 21:53:53.209687+00
automation	pro	core_notifications	2026-06-16 21:53:53.209687+00
automation	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
communication	starter	core_notifications	2026-06-16 21:53:53.209687+00
communication	pro	core_notifications	2026-06-16 21:53:53.209687+00
communication	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
license	starter	core_notifications	2026-06-16 21:53:53.209687+00
license	pro	core_notifications	2026-06-16 21:53:53.209687+00
license	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
dental	starter	core_notifications	2026-06-16 21:53:53.209687+00
dental	pro	core_notifications	2026-06-16 21:53:53.209687+00
dental	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
manufacturing	starter	core_notifications	2026-06-16 21:53:53.209687+00
manufacturing	pro	core_notifications	2026-06-16 21:53:53.209687+00
manufacturing	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
restaurant	starter	core_notifications	2026-06-16 21:53:53.209687+00
restaurant	pro	core_notifications	2026-06-16 21:53:53.209687+00
restaurant	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
services	starter	core_notifications	2026-06-16 21:53:53.209687+00
services	pro	core_notifications	2026-06-16 21:53:53.209687+00
services	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
logistics	starter	core_notifications	2026-06-16 21:53:53.209687+00
logistics	pro	core_notifications	2026-06-16 21:53:53.209687+00
logistics	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
security	starter	core_notifications	2026-06-16 21:53:53.209687+00
security	pro	core_notifications	2026-06-16 21:53:53.209687+00
security	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
construction	starter	core_notifications	2026-06-16 21:53:53.209687+00
construction	pro	core_notifications	2026-06-16 21:53:53.209687+00
construction	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
hotel	starter	core_notifications	2026-06-16 21:53:53.209687+00
hotel	pro	core_notifications	2026-06-16 21:53:53.209687+00
hotel	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
business	pro	core_import_export	2026-06-16 21:53:53.209687+00
travel	starter	core_notifications	2026-06-16 21:53:53.209687+00
travel	pro	core_notifications	2026-06-16 21:53:53.209687+00
travel	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
business	starter	core_notifications	2026-06-16 21:53:53.209687+00
business	pro	core_notifications	2026-06-16 21:53:53.209687+00
business	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
clinic	starter	core_notifications	2026-06-16 21:53:53.209687+00
clinic	pro	core_notifications	2026-06-16 21:53:53.209687+00
clinic	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
ai	starter	core_notifications	2026-06-16 21:53:53.209687+00
ai	pro	core_notifications	2026-06-16 21:53:53.209687+00
ai	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
salon	starter	core_notifications	2026-06-16 21:53:53.209687+00
salon	pro	core_notifications	2026-06-16 21:53:53.209687+00
salon	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
test	starter	core_notifications	2026-06-16 21:53:53.209687+00
test	pro	core_notifications	2026-06-16 21:53:53.209687+00
test	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
event_management	starter	core_notifications	2026-06-16 21:53:53.209687+00
event_management	pro	core_notifications	2026-06-16 21:53:53.209687+00
event_management	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
payments	starter	core_notifications	2026-06-16 21:53:53.209687+00
payments	pro	core_notifications	2026-06-16 21:53:53.209687+00
payments	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
gym	starter	core_notifications	2026-06-16 21:53:53.209687+00
gym	pro	core_notifications	2026-06-16 21:53:53.209687+00
gym	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
ecommerce	starter	core_notifications	2026-06-16 21:53:53.209687+00
ecommerce	pro	core_notifications	2026-06-16 21:53:53.209687+00
ecommerce	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
ngo	starter	core_notifications	2026-06-16 21:53:53.209687+00
ngo	pro	core_notifications	2026-06-16 21:53:53.209687+00
ngo	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
accounting_tax	starter	core_notifications	2026-06-16 21:53:53.209687+00
accounting_tax	pro	core_notifications	2026-06-16 21:53:53.209687+00
accounting_tax	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
integrations	starter	core_notifications	2026-06-16 21:53:53.209687+00
integrations	pro	core_notifications	2026-06-16 21:53:53.209687+00
integrations	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
auto_workshop	starter	core_notifications	2026-06-16 21:53:53.209687+00
auto_workshop	pro	core_notifications	2026-06-16 21:53:53.209687+00
auto_workshop	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
school	starter	core_notifications	2026-06-16 21:53:53.209687+00
school	pro	core_notifications	2026-06-16 21:53:53.209687+00
school	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
finance	starter	core_notifications	2026-06-16 21:53:53.209687+00
finance	pro	core_notifications	2026-06-16 21:53:53.209687+00
finance	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
professional_services	starter	core_notifications	2026-06-16 21:53:53.209687+00
professional_services	pro	core_notifications	2026-06-16 21:53:53.209687+00
professional_services	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
analytics	starter	core_notifications	2026-06-16 21:53:53.209687+00
analytics	pro	core_notifications	2026-06-16 21:53:53.209687+00
analytics	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
real_estate	starter	core_notifications	2026-06-16 21:53:53.209687+00
real_estate	pro	core_notifications	2026-06-16 21:53:53.209687+00
real_estate	enterprise	core_notifications	2026-06-16 21:53:53.209687+00
pharmacy	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
pharmacy	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
pharmacy	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
law_firm	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
law_firm	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
law_firm	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
store	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
store	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
store	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
agriculture	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
agriculture	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
agriculture	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
hr_recruitment	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
hr_recruitment	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
hr_recruitment	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
automation	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
automation	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
automation	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
communication	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
communication	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
communication	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
license	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
license	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
license	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
dental	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
dental	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
dental	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
manufacturing	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
manufacturing	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
manufacturing	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
restaurant	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
restaurant	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
restaurant	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
services	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
services	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
services	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
logistics	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
logistics	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
logistics	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
security	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
security	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
security	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
construction	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
construction	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
construction	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
hotel	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
hotel	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
hotel	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
travel	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
travel	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
travel	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
business	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
business	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
business	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
clinic	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
clinic	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
clinic	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
ai	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
ai	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
ai	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
salon	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
salon	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
salon	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
test	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
test	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
test	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
event_management	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
event_management	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
event_management	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
payments	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
payments	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
payments	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
gym	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
gym	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
gym	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
ecommerce	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
ecommerce	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
ecommerce	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
ngo	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
ngo	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
ngo	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
accounting_tax	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
accounting_tax	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
accounting_tax	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
integrations	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
integrations	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
integrations	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
auto_workshop	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
auto_workshop	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
auto_workshop	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
school	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
school	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
school	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
finance	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
finance	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
finance	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
professional_services	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
professional_services	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
professional_services	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
analytics	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
analytics	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
analytics	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
real_estate	starter	core_activity_logs	2026-06-16 21:53:53.209687+00
real_estate	pro	core_activity_logs	2026-06-16 21:53:53.209687+00
real_estate	enterprise	core_activity_logs	2026-06-16 21:53:53.209687+00
pharmacy	starter	core_import_export	2026-06-16 21:53:53.209687+00
pharmacy	pro	core_import_export	2026-06-16 21:53:53.209687+00
pharmacy	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
law_firm	starter	core_import_export	2026-06-16 21:53:53.209687+00
law_firm	pro	core_import_export	2026-06-16 21:53:53.209687+00
law_firm	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
store	starter	core_import_export	2026-06-16 21:53:53.209687+00
store	pro	core_import_export	2026-06-16 21:53:53.209687+00
store	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
agriculture	starter	core_import_export	2026-06-16 21:53:53.209687+00
agriculture	pro	core_import_export	2026-06-16 21:53:53.209687+00
agriculture	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
hr_recruitment	starter	core_import_export	2026-06-16 21:53:53.209687+00
hr_recruitment	pro	core_import_export	2026-06-16 21:53:53.209687+00
hr_recruitment	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
automation	starter	core_import_export	2026-06-16 21:53:53.209687+00
automation	pro	core_import_export	2026-06-16 21:53:53.209687+00
automation	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
communication	starter	core_import_export	2026-06-16 21:53:53.209687+00
communication	pro	core_import_export	2026-06-16 21:53:53.209687+00
communication	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
license	starter	core_import_export	2026-06-16 21:53:53.209687+00
license	pro	core_import_export	2026-06-16 21:53:53.209687+00
license	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
dental	starter	core_import_export	2026-06-16 21:53:53.209687+00
dental	pro	core_import_export	2026-06-16 21:53:53.209687+00
dental	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
manufacturing	starter	core_import_export	2026-06-16 21:53:53.209687+00
manufacturing	pro	core_import_export	2026-06-16 21:53:53.209687+00
manufacturing	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
restaurant	starter	core_import_export	2026-06-16 21:53:53.209687+00
restaurant	pro	core_import_export	2026-06-16 21:53:53.209687+00
restaurant	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
services	starter	core_import_export	2026-06-16 21:53:53.209687+00
services	pro	core_import_export	2026-06-16 21:53:53.209687+00
services	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
logistics	starter	core_import_export	2026-06-16 21:53:53.209687+00
logistics	pro	core_import_export	2026-06-16 21:53:53.209687+00
logistics	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
security	starter	core_import_export	2026-06-16 21:53:53.209687+00
security	pro	core_import_export	2026-06-16 21:53:53.209687+00
security	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
construction	starter	core_import_export	2026-06-16 21:53:53.209687+00
construction	pro	core_import_export	2026-06-16 21:53:53.209687+00
construction	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
hotel	starter	core_import_export	2026-06-16 21:53:53.209687+00
hotel	pro	core_import_export	2026-06-16 21:53:53.209687+00
hotel	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
travel	starter	core_import_export	2026-06-16 21:53:53.209687+00
travel	pro	core_import_export	2026-06-16 21:53:53.209687+00
travel	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
business	starter	core_import_export	2026-06-16 21:53:53.209687+00
business	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
clinic	starter	core_import_export	2026-06-16 21:53:53.209687+00
clinic	pro	core_import_export	2026-06-16 21:53:53.209687+00
clinic	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
ai	starter	core_import_export	2026-06-16 21:53:53.209687+00
ai	pro	core_import_export	2026-06-16 21:53:53.209687+00
ai	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
salon	starter	core_import_export	2026-06-16 21:53:53.209687+00
salon	pro	core_import_export	2026-06-16 21:53:53.209687+00
salon	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
test	starter	core_import_export	2026-06-16 21:53:53.209687+00
test	pro	core_import_export	2026-06-16 21:53:53.209687+00
test	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
event_management	starter	core_import_export	2026-06-16 21:53:53.209687+00
event_management	pro	core_import_export	2026-06-16 21:53:53.209687+00
event_management	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
payments	starter	core_import_export	2026-06-16 21:53:53.209687+00
payments	pro	core_import_export	2026-06-16 21:53:53.209687+00
payments	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
gym	starter	core_import_export	2026-06-16 21:53:53.209687+00
gym	pro	core_import_export	2026-06-16 21:53:53.209687+00
gym	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
ecommerce	starter	core_import_export	2026-06-16 21:53:53.209687+00
ecommerce	pro	core_import_export	2026-06-16 21:53:53.209687+00
ecommerce	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
ngo	starter	core_import_export	2026-06-16 21:53:53.209687+00
ngo	pro	core_import_export	2026-06-16 21:53:53.209687+00
ngo	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
accounting_tax	starter	core_import_export	2026-06-16 21:53:53.209687+00
accounting_tax	pro	core_import_export	2026-06-16 21:53:53.209687+00
accounting_tax	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
integrations	starter	core_import_export	2026-06-16 21:53:53.209687+00
integrations	pro	core_import_export	2026-06-16 21:53:53.209687+00
integrations	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
auto_workshop	starter	core_import_export	2026-06-16 21:53:53.209687+00
auto_workshop	pro	core_import_export	2026-06-16 21:53:53.209687+00
auto_workshop	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
school	starter	core_import_export	2026-06-16 21:53:53.209687+00
school	pro	core_import_export	2026-06-16 21:53:53.209687+00
school	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
finance	starter	core_import_export	2026-06-16 21:53:53.209687+00
finance	pro	core_import_export	2026-06-16 21:53:53.209687+00
finance	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
professional_services	starter	core_import_export	2026-06-16 21:53:53.209687+00
professional_services	pro	core_import_export	2026-06-16 21:53:53.209687+00
professional_services	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
analytics	starter	core_import_export	2026-06-16 21:53:53.209687+00
analytics	pro	core_import_export	2026-06-16 21:53:53.209687+00
analytics	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
real_estate	starter	core_import_export	2026-06-16 21:53:53.209687+00
real_estate	pro	core_import_export	2026-06-16 21:53:53.209687+00
real_estate	enterprise	core_import_export	2026-06-16 21:53:53.209687+00
pharmacy	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
pharmacy	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
pharmacy	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
law_firm	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
law_firm	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
law_firm	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
store	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
store	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
store	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
agriculture	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
agriculture	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
agriculture	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
hr_recruitment	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
hr_recruitment	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
hr_recruitment	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
automation	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
automation	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
automation	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
communication	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
communication	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
communication	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
license	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
license	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
license	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
dental	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
dental	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
dental	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
manufacturing	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
manufacturing	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
manufacturing	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
restaurant	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
restaurant	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
restaurant	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
services	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
services	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
services	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
logistics	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
logistics	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
logistics	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
security	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
security	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
security	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
construction	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
construction	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
construction	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
hotel	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
hotel	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
hotel	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
travel	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
travel	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
travel	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
business	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
business	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
business	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
clinic	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
clinic	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
clinic	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
ai	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
ai	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
ai	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
salon	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
salon	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
salon	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
test	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
test	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
test	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
event_management	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
event_management	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
event_management	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
payments	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
payments	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
payments	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
gym	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
gym	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
gym	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
ecommerce	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
ecommerce	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
ecommerce	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
ngo	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
ngo	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
ngo	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
accounting_tax	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
accounting_tax	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
accounting_tax	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
integrations	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
integrations	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
integrations	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
auto_workshop	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
auto_workshop	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
auto_workshop	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
school	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
school	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
school	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
finance	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
finance	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
finance	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
professional_services	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
professional_services	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
professional_services	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
analytics	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
analytics	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
analytics	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
real_estate	starter	core_custom_fields	2026-06-16 21:53:53.209687+00
real_estate	pro	core_custom_fields	2026-06-16 21:53:53.209687+00
real_estate	enterprise	core_custom_fields	2026-06-16 21:53:53.209687+00
pharmacy	starter	core_tasks	2026-06-16 21:53:53.209687+00
pharmacy	pro	core_tasks	2026-06-16 21:53:53.209687+00
pharmacy	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
law_firm	starter	core_tasks	2026-06-16 21:53:53.209687+00
law_firm	pro	core_tasks	2026-06-16 21:53:53.209687+00
law_firm	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
store	starter	core_tasks	2026-06-16 21:53:53.209687+00
store	pro	core_tasks	2026-06-16 21:53:53.209687+00
store	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
agriculture	starter	core_tasks	2026-06-16 21:53:53.209687+00
agriculture	pro	core_tasks	2026-06-16 21:53:53.209687+00
agriculture	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
hr_recruitment	starter	core_tasks	2026-06-16 21:53:53.209687+00
hr_recruitment	pro	core_tasks	2026-06-16 21:53:53.209687+00
hr_recruitment	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
automation	starter	core_tasks	2026-06-16 21:53:53.209687+00
automation	pro	core_tasks	2026-06-16 21:53:53.209687+00
automation	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
communication	starter	core_tasks	2026-06-16 21:53:53.209687+00
communication	pro	core_tasks	2026-06-16 21:53:53.209687+00
communication	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
license	starter	core_tasks	2026-06-16 21:53:53.209687+00
license	pro	core_tasks	2026-06-16 21:53:53.209687+00
license	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
dental	starter	core_tasks	2026-06-16 21:53:53.209687+00
dental	pro	core_tasks	2026-06-16 21:53:53.209687+00
dental	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
manufacturing	starter	core_tasks	2026-06-16 21:53:53.209687+00
manufacturing	pro	core_tasks	2026-06-16 21:53:53.209687+00
manufacturing	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
restaurant	starter	core_tasks	2026-06-16 21:53:53.209687+00
restaurant	pro	core_tasks	2026-06-16 21:53:53.209687+00
restaurant	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
services	starter	core_tasks	2026-06-16 21:53:53.209687+00
services	pro	core_tasks	2026-06-16 21:53:53.209687+00
services	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
logistics	starter	core_tasks	2026-06-16 21:53:53.209687+00
logistics	pro	core_tasks	2026-06-16 21:53:53.209687+00
logistics	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
security	starter	core_tasks	2026-06-16 21:53:53.209687+00
security	pro	core_tasks	2026-06-16 21:53:53.209687+00
security	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
construction	starter	core_tasks	2026-06-16 21:53:53.209687+00
construction	pro	core_tasks	2026-06-16 21:53:53.209687+00
construction	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
hotel	starter	core_tasks	2026-06-16 21:53:53.209687+00
hotel	pro	core_tasks	2026-06-16 21:53:53.209687+00
hotel	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
travel	starter	core_tasks	2026-06-16 21:53:53.209687+00
travel	pro	core_tasks	2026-06-16 21:53:53.209687+00
travel	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
business	starter	core_tasks	2026-06-16 21:53:53.209687+00
business	pro	core_tasks	2026-06-16 21:53:53.209687+00
business	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
clinic	starter	core_tasks	2026-06-16 21:53:53.209687+00
clinic	pro	core_tasks	2026-06-16 21:53:53.209687+00
clinic	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
ai	starter	core_tasks	2026-06-16 21:53:53.209687+00
ai	pro	core_tasks	2026-06-16 21:53:53.209687+00
ai	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
salon	starter	core_tasks	2026-06-16 21:53:53.209687+00
salon	pro	core_tasks	2026-06-16 21:53:53.209687+00
salon	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
test	starter	core_tasks	2026-06-16 21:53:53.209687+00
test	pro	core_tasks	2026-06-16 21:53:53.209687+00
test	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
event_management	starter	core_tasks	2026-06-16 21:53:53.209687+00
event_management	pro	core_tasks	2026-06-16 21:53:53.209687+00
event_management	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
payments	starter	core_tasks	2026-06-16 21:53:53.209687+00
payments	pro	core_tasks	2026-06-16 21:53:53.209687+00
payments	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
gym	starter	core_tasks	2026-06-16 21:53:53.209687+00
gym	pro	core_tasks	2026-06-16 21:53:53.209687+00
gym	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
ecommerce	starter	core_tasks	2026-06-16 21:53:53.209687+00
ecommerce	pro	core_tasks	2026-06-16 21:53:53.209687+00
ecommerce	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
ngo	starter	core_tasks	2026-06-16 21:53:53.209687+00
ngo	pro	core_tasks	2026-06-16 21:53:53.209687+00
ngo	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
accounting_tax	starter	core_tasks	2026-06-16 21:53:53.209687+00
accounting_tax	pro	core_tasks	2026-06-16 21:53:53.209687+00
accounting_tax	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
integrations	starter	core_tasks	2026-06-16 21:53:53.209687+00
integrations	pro	core_tasks	2026-06-16 21:53:53.209687+00
integrations	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
auto_workshop	starter	core_tasks	2026-06-16 21:53:53.209687+00
auto_workshop	pro	core_tasks	2026-06-16 21:53:53.209687+00
auto_workshop	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
school	starter	core_tasks	2026-06-16 21:53:53.209687+00
school	pro	core_tasks	2026-06-16 21:53:53.209687+00
school	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
finance	starter	core_tasks	2026-06-16 21:53:53.209687+00
finance	pro	core_tasks	2026-06-16 21:53:53.209687+00
finance	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
professional_services	starter	core_tasks	2026-06-16 21:53:53.209687+00
professional_services	pro	core_tasks	2026-06-16 21:53:53.209687+00
professional_services	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
analytics	starter	core_tasks	2026-06-16 21:53:53.209687+00
analytics	pro	core_tasks	2026-06-16 21:53:53.209687+00
analytics	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
real_estate	starter	core_tasks	2026-06-16 21:53:53.209687+00
real_estate	pro	core_tasks	2026-06-16 21:53:53.209687+00
real_estate	enterprise	core_tasks	2026-06-16 21:53:53.209687+00
accounting_tax	starter	accounting_tax_management	2026-06-16 21:53:53.209687+00
accounting_tax	starter	accounting_clients	2026-06-16 21:53:53.209687+00
accounting_tax	starter	accounting_bookkeeping	2026-06-16 21:53:53.209687+00
agriculture	starter	agriculture_management	2026-06-16 21:53:53.209687+00
agriculture	starter	agriculture_fields	2026-06-16 21:53:53.209687+00
agriculture	starter	agriculture_crops	2026-06-16 21:53:53.209687+00
ai	starter	ai_assistant	2026-06-16 21:53:53.209687+00
analytics	starter	analytics_dashboard	2026-06-16 21:53:53.209687+00
automation	starter	workflow_automation	2026-06-16 21:53:53.209687+00
auto_workshop	starter	auto_workshop_management	2026-06-16 21:53:53.209687+00
auto_workshop	starter	auto_workshop_jobs	2026-06-16 21:53:53.209687+00
auto_workshop	starter	auto_workshop_vehicles	2026-06-16 21:53:53.209687+00
business	starter	crm	2026-06-16 21:53:53.209687+00
clinic	starter	clinic_management	2026-06-16 21:53:53.209687+00
clinic	starter	patients	2026-06-16 21:53:53.209687+00
clinic	starter	appointments	2026-06-16 21:53:53.209687+00
clinic	starter	doctors	2026-06-16 21:53:53.209687+00
clinic	starter	prescriptions	2026-06-16 21:53:53.209687+00
clinic	starter	clinic_billing	2026-06-16 21:53:53.209687+00
clinic	starter	medical_records	2026-06-16 21:53:53.209687+00
communication	starter	email_sms	2026-06-16 21:53:53.209687+00
construction	starter	construction_management	2026-06-16 21:53:53.209687+00
construction	starter	construction_projects	2026-06-16 21:53:53.209687+00
construction	starter	construction_materials	2026-06-16 21:53:53.209687+00
dental	starter	treatment_plans	2026-06-16 21:53:53.209687+00
dental	starter	dental_management	2026-06-16 21:53:53.209687+00
dental	starter	dental_charting	2026-06-16 21:53:53.209687+00
dental	starter	dental_treatment_plans	2026-06-16 21:53:53.209687+00
ecommerce	starter	online_storefront	2026-06-16 21:53:53.209687+00
ecommerce	starter	shipping_delivery	2026-06-16 21:53:53.209687+00
ecommerce	starter	ecommerce_management	2026-06-16 21:53:53.209687+00
ecommerce	starter	ecommerce_storefront	2026-06-16 21:53:53.209687+00
ecommerce	starter	ecommerce_orders	2026-06-16 21:53:53.209687+00
event_management	starter	event_management	2026-06-16 21:53:53.209687+00
event_management	starter	event_clients	2026-06-16 21:53:53.209687+00
event_management	starter	event_bookings	2026-06-16 21:53:53.209687+00
finance	starter	accounting	2026-06-16 21:53:53.209687+00
finance	starter	expenses	2026-06-16 21:53:53.209687+00
gym	starter	gym_management	2026-06-16 21:53:53.209687+00
gym	starter	trainer_schedule	2026-06-16 21:53:53.209687+00
hotel	starter	room_booking	2026-06-16 21:53:53.209687+00
hotel	starter	housekeeping	2026-06-16 21:53:53.209687+00
hotel	starter	checkin_checkout	2026-06-16 21:53:53.209687+00
hotel	starter	hotel_management	2026-06-16 21:53:53.209687+00
hr_recruitment	starter	hr_recruitment_management	2026-06-16 21:53:53.209687+00
hr_recruitment	starter	hr_candidates	2026-06-16 21:53:53.209687+00
hr_recruitment	starter	hr_jobs	2026-06-16 21:53:53.209687+00
integrations	starter	api_keys	2026-06-16 21:53:53.209687+00
law_firm	starter	law_firm_management	2026-06-16 21:53:53.209687+00
law_firm	starter	law_clients	2026-06-16 21:53:53.209687+00
law_firm	starter	law_cases	2026-06-16 21:53:53.209687+00
license	starter	license_keys	2026-06-16 21:53:53.209687+00
logistics	starter	logistics_management	2026-06-16 21:53:53.209687+00
logistics	starter	logistics_shipments	2026-06-16 21:53:53.209687+00
logistics	starter	logistics_pickups	2026-06-16 21:53:53.209687+00
manufacturing	starter	bom	2026-06-16 21:53:53.209687+00
manufacturing	starter	production_orders	2026-06-16 21:53:53.209687+00
manufacturing	starter	quality_control	2026-06-16 21:53:53.209687+00
manufacturing	starter	manufacturing_management	2026-06-16 21:53:53.209687+00
ngo	starter	ngo_management	2026-06-16 21:53:53.209687+00
ngo	starter	ngo_donors	2026-06-16 21:53:53.209687+00
ngo	starter	ngo_donations	2026-06-16 21:53:53.209687+00
payments	starter	payment_records	2026-06-16 21:53:53.209687+00
pharmacy	starter	pharmacy_management	2026-06-16 21:53:53.209687+00
pharmacy	starter	pharmacy_medicine_catalog	2026-06-16 21:53:53.209687+00
pharmacy	starter	pharmacy_inventory	2026-06-16 21:53:53.209687+00
professional_services	starter	professional_services_management	2026-06-16 21:53:53.209687+00
professional_services	starter	professional_services_clients	2026-06-16 21:53:53.209687+00
professional_services	starter	professional_services_projects	2026-06-16 21:53:53.209687+00
real_estate	starter	properties	2026-06-16 21:53:53.209687+00
real_estate	starter	leads_pipeline	2026-06-16 21:53:53.209687+00
real_estate	starter	rentals	2026-06-16 21:53:53.209687+00
real_estate	starter	real_estate_management	2026-06-16 21:53:53.209687+00
restaurant	starter	restaurant_management	2026-06-16 21:53:53.209687+00
restaurant	starter	menu_items	2026-06-16 21:53:53.209687+00
restaurant	starter	tables_orders	2026-06-16 21:53:53.209687+00
restaurant	starter	kitchen_display	2026-06-16 21:53:53.209687+00
restaurant	starter	restaurant_billing	2026-06-16 21:53:53.209687+00
restaurant	starter	reservations	2026-06-16 21:53:53.209687+00
restaurant	starter	delivery_orders	2026-06-16 21:53:53.209687+00
salon	starter	service_menu	2026-06-16 21:53:53.209687+00
salon	starter	staff_scheduling	2026-06-16 21:53:53.209687+00
salon	starter	memberships	2026-06-16 21:53:53.209687+00
salon	starter	commission	2026-06-16 21:53:53.209687+00
salon	starter	salon_management	2026-06-16 21:53:53.209687+00
school	starter	school_management	2026-06-16 21:53:53.209687+00
school	starter	students	2026-06-16 21:53:53.209687+00
school	starter	teachers	2026-06-16 21:53:53.209687+00
school	starter	classes_sections	2026-06-16 21:53:53.209687+00
school	starter	attendance	2026-06-16 21:53:53.209687+00
school	starter	fees	2026-06-16 21:53:53.209687+00
school	starter	exams_results	2026-06-16 21:53:53.209687+00
school	starter	timetable	2026-06-16 21:53:53.209687+00
school	starter	parents_portal	2026-06-16 21:53:53.209687+00
security	starter	rbac_roles	2026-06-16 21:53:53.209687+00
services	starter	repair_management	2026-06-16 21:53:53.209687+00
services	starter	tickets	2026-06-16 21:53:53.209687+00
store	starter	store_management	2026-06-16 21:53:53.209687+00
store	starter	products	2026-06-16 21:53:53.209687+00
store	starter	inventory	2026-06-16 21:53:53.209687+00
store	starter	sales_orders	2026-06-16 21:53:53.209687+00
store	starter	customers	2026-06-16 21:53:53.209687+00
store	starter	suppliers	2026-06-16 21:53:53.209687+00
store	starter	billing	2026-06-16 21:53:53.209687+00
store	starter	reports	2026-06-16 21:53:53.209687+00
test	starter	test	2026-06-16 21:53:53.209687+00
travel	starter	travel_management	2026-06-16 21:53:53.209687+00
travel	starter	travel_packages	2026-06-16 21:53:53.209687+00
travel	starter	travel_bookings	2026-06-16 21:53:53.209687+00
accounting_tax	pro	accounting_tax_management	2026-06-16 21:53:53.209687+00
accounting_tax	pro	accounting_clients	2026-06-16 21:53:53.209687+00
accounting_tax	pro	accounting_bookkeeping	2026-06-16 21:53:53.209687+00
accounting_tax	pro	accounting_tax_returns	2026-06-16 21:53:53.209687+00
accounting_tax	pro	accounting_expenses	2026-06-16 21:53:53.209687+00
accounting_tax	pro	accounting_reports	2026-06-16 21:53:53.209687+00
agriculture	pro	agriculture_management	2026-06-16 21:53:53.209687+00
agriculture	pro	agriculture_fields	2026-06-16 21:53:53.209687+00
agriculture	pro	agriculture_crops	2026-06-16 21:53:53.209687+00
agriculture	pro	agriculture_livestock	2026-06-16 21:53:53.209687+00
agriculture	pro	agriculture_inputs	2026-06-16 21:53:53.209687+00
agriculture	pro	agriculture_harvest	2026-06-16 21:53:53.209687+00
ai	pro	ai_assistant	2026-06-16 21:53:53.209687+00
ai	pro	ai_forecasting	2026-06-16 21:53:53.209687+00
analytics	pro	analytics_dashboard	2026-06-16 21:53:53.209687+00
analytics	pro	custom_reports	2026-06-16 21:53:53.209687+00
automation	pro	workflow_automation	2026-06-16 21:53:53.209687+00
auto_workshop	pro	auto_workshop_management	2026-06-16 21:53:53.209687+00
auto_workshop	pro	auto_workshop_jobs	2026-06-16 21:53:53.209687+00
auto_workshop	pro	auto_workshop_vehicles	2026-06-16 21:53:53.209687+00
auto_workshop	pro	auto_workshop_parts_inventory	2026-06-16 21:53:53.209687+00
auto_workshop	pro	auto_workshop_service_history	2026-06-16 21:53:53.209687+00
auto_workshop	pro	auto_workshop_estimates	2026-06-16 21:53:53.209687+00
business	pro	crm	2026-06-16 21:53:53.209687+00
business	pro	website	2026-06-16 21:53:53.209687+00
clinic	pro	clinic_management	2026-06-16 21:53:53.209687+00
clinic	pro	patients	2026-06-16 21:53:53.209687+00
clinic	pro	appointments	2026-06-16 21:53:53.209687+00
clinic	pro	doctors	2026-06-16 21:53:53.209687+00
clinic	pro	prescriptions	2026-06-16 21:53:53.209687+00
clinic	pro	clinic_billing	2026-06-16 21:53:53.209687+00
clinic	pro	medical_records	2026-06-16 21:53:53.209687+00
clinic	pro	lab_reports	2026-06-16 21:53:53.209687+00
clinic	pro	pharmacy_stock	2026-06-16 21:53:53.209687+00
clinic	pro	patient_portal	2026-06-16 21:53:53.209687+00
clinic	pro	queue_management	2026-06-16 21:53:53.209687+00
clinic	pro	clinic_medical_records	2026-06-16 21:53:53.209687+00
clinic	pro	clinic_lab_reports	2026-06-16 21:53:53.209687+00
clinic	pro	clinic_pharmacy_stock	2026-06-16 21:53:53.209687+00
communication	pro	email_sms	2026-06-16 21:53:53.209687+00
communication	pro	whatsapp	2026-06-16 21:53:53.209687+00
construction	pro	construction_management	2026-06-16 21:53:53.209687+00
construction	pro	construction_projects	2026-06-16 21:53:53.209687+00
construction	pro	construction_materials	2026-06-16 21:53:53.209687+00
construction	pro	construction_estimates	2026-06-16 21:53:53.209687+00
construction	pro	construction_work_orders	2026-06-16 21:53:53.209687+00
construction	pro	construction_contractors	2026-06-16 21:53:53.209687+00
dental	pro	treatment_plans	2026-06-16 21:53:53.209687+00
dental	pro	dental_management	2026-06-16 21:53:53.209687+00
dental	pro	dental_charting	2026-06-16 21:53:53.209687+00
dental	pro	dental_treatment_plans	2026-06-16 21:53:53.209687+00
dental	pro	dental_billing	2026-06-16 21:53:53.209687+00
dental	pro	dental_lab_cases	2026-06-16 21:53:53.209687+00
dental	pro	dental_xray_records	2026-06-16 21:53:53.209687+00
ecommerce	pro	online_storefront	2026-06-16 21:53:53.209687+00
ecommerce	pro	shipping_delivery	2026-06-16 21:53:53.209687+00
ecommerce	pro	ecommerce_management	2026-06-16 21:53:53.209687+00
ecommerce	pro	ecommerce_storefront	2026-06-16 21:53:53.209687+00
ecommerce	pro	ecommerce_orders	2026-06-16 21:53:53.209687+00
ecommerce	pro	ecommerce_products	2026-06-16 21:53:53.209687+00
ecommerce	pro	ecommerce_cart_checkout	2026-06-16 21:53:53.209687+00
ecommerce	pro	ecommerce_shipping	2026-06-16 21:53:53.209687+00
ecommerce	pro	ecommerce_coupons	2026-06-16 21:53:53.209687+00
event_management	pro	event_management	2026-06-16 21:53:53.209687+00
event_management	pro	event_clients	2026-06-16 21:53:53.209687+00
event_management	pro	event_bookings	2026-06-16 21:53:53.209687+00
event_management	pro	event_venues	2026-06-16 21:53:53.209687+00
event_management	pro	event_vendor_management	2026-06-16 21:53:53.209687+00
event_management	pro	event_budgeting	2026-06-16 21:53:53.209687+00
finance	pro	accounting	2026-06-16 21:53:53.209687+00
finance	pro	expenses	2026-06-16 21:53:53.209687+00
finance	pro	ledger	2026-06-16 21:53:53.209687+00
gym	pro	gym_management	2026-06-16 21:53:53.209687+00
gym	pro	trainer_schedule	2026-06-16 21:53:53.209687+00
gym	pro	fitness_memberships	2026-06-16 21:53:53.209687+00
hotel	pro	room_booking	2026-06-16 21:53:53.209687+00
hotel	pro	housekeeping	2026-06-16 21:53:53.209687+00
hotel	pro	checkin_checkout	2026-06-16 21:53:53.209687+00
hotel	pro	hotel_management	2026-06-16 21:53:53.209687+00
hotel	pro	hotel_room_booking	2026-06-16 21:53:53.209687+00
hotel	pro	hotel_checkin_checkout	2026-06-16 21:53:53.209687+00
hotel	pro	hotel_room_status	2026-06-16 21:53:53.209687+00
hotel	pro	hotel_housekeeping	2026-06-16 21:53:53.209687+00
hr_recruitment	pro	hr_recruitment_management	2026-06-16 21:53:53.209687+00
hr_recruitment	pro	hr_candidates	2026-06-16 21:53:53.209687+00
hr_recruitment	pro	hr_jobs	2026-06-16 21:53:53.209687+00
hr_recruitment	pro	hr_applications	2026-06-16 21:53:53.209687+00
hr_recruitment	pro	hr_interviews	2026-06-16 21:53:53.209687+00
hr_recruitment	pro	hr_clients	2026-06-16 21:53:53.209687+00
integrations	pro	api_keys	2026-06-16 21:53:53.209687+00
integrations	pro	webhooks	2026-06-16 21:53:53.209687+00
law_firm	pro	law_firm_management	2026-06-16 21:53:53.209687+00
law_firm	pro	law_clients	2026-06-16 21:53:53.209687+00
law_firm	pro	law_cases	2026-06-16 21:53:53.209687+00
law_firm	pro	law_hearings	2026-06-16 21:53:53.209687+00
law_firm	pro	law_documents	2026-06-16 21:53:53.209687+00
law_firm	pro	law_billing	2026-06-16 21:53:53.209687+00
license	pro	license_keys	2026-06-16 21:53:53.209687+00
logistics	pro	logistics_management	2026-06-16 21:53:53.209687+00
logistics	pro	logistics_shipments	2026-06-16 21:53:53.209687+00
logistics	pro	logistics_pickups	2026-06-16 21:53:53.209687+00
logistics	pro	logistics_delivery_tracking	2026-06-16 21:53:53.209687+00
logistics	pro	logistics_driver_management	2026-06-16 21:53:53.209687+00
logistics	pro	logistics_vehicle_fleet	2026-06-16 21:53:53.209687+00
manufacturing	pro	bom	2026-06-16 21:53:53.209687+00
manufacturing	pro	production_orders	2026-06-16 21:53:53.209687+00
manufacturing	pro	quality_control	2026-06-16 21:53:53.209687+00
manufacturing	pro	manufacturing_management	2026-06-16 21:53:53.209687+00
manufacturing	pro	manufacturing_bom	2026-06-16 21:53:53.209687+00
manufacturing	pro	manufacturing_production_orders	2026-06-16 21:53:53.209687+00
manufacturing	pro	manufacturing_workstations	2026-06-16 21:53:53.209687+00
manufacturing	pro	manufacturing_quality_control	2026-06-16 21:53:53.209687+00
ngo	pro	ngo_management	2026-06-16 21:53:53.209687+00
ngo	pro	ngo_donors	2026-06-16 21:53:53.209687+00
ngo	pro	ngo_donations	2026-06-16 21:53:53.209687+00
ngo	pro	ngo_campaigns	2026-06-16 21:53:53.209687+00
ngo	pro	ngo_beneficiaries	2026-06-16 21:53:53.209687+00
ngo	pro	ngo_volunteers	2026-06-16 21:53:53.209687+00
payments	pro	payment_records	2026-06-16 21:53:53.209687+00
payments	pro	subscription_billing	2026-06-16 21:53:53.209687+00
pharmacy	pro	pharmacy_management	2026-06-16 21:53:53.209687+00
pharmacy	pro	pharmacy_medicine_catalog	2026-06-16 21:53:53.209687+00
pharmacy	pro	pharmacy_inventory	2026-06-16 21:53:53.209687+00
pharmacy	pro	pharmacy_batch_expiry	2026-06-16 21:53:53.209687+00
pharmacy	pro	pharmacy_prescription_sales	2026-06-16 21:53:53.209687+00
pharmacy	pro	pharmacy_supplier_orders	2026-06-16 21:53:53.209687+00
professional_services	pro	professional_services_management	2026-06-16 21:53:53.209687+00
professional_services	pro	professional_services_clients	2026-06-16 21:53:53.209687+00
professional_services	pro	professional_services_projects	2026-06-16 21:53:53.209687+00
professional_services	pro	professional_services_proposals	2026-06-16 21:53:53.209687+00
professional_services	pro	professional_services_contracts	2026-06-16 21:53:53.209687+00
professional_services	pro	professional_services_time_tracking	2026-06-16 21:53:53.209687+00
real_estate	pro	properties	2026-06-16 21:53:53.209687+00
real_estate	pro	leads_pipeline	2026-06-16 21:53:53.209687+00
real_estate	pro	rentals	2026-06-16 21:53:53.209687+00
real_estate	pro	real_estate_management	2026-06-16 21:53:53.209687+00
real_estate	pro	real_estate_properties	2026-06-16 21:53:53.209687+00
real_estate	pro	real_estate_leads	2026-06-16 21:53:53.209687+00
real_estate	pro	real_estate_rentals	2026-06-16 21:53:53.209687+00
real_estate	pro	real_estate_sales	2026-06-16 21:53:53.209687+00
restaurant	pro	restaurant_management	2026-06-16 21:53:53.209687+00
restaurant	pro	menu_items	2026-06-16 21:53:53.209687+00
restaurant	pro	tables_orders	2026-06-16 21:53:53.209687+00
restaurant	pro	kitchen_display	2026-06-16 21:53:53.209687+00
restaurant	pro	restaurant_billing	2026-06-16 21:53:53.209687+00
restaurant	pro	reservations	2026-06-16 21:53:53.209687+00
restaurant	pro	delivery_orders	2026-06-16 21:53:53.209687+00
restaurant	pro	food_inventory	2026-06-16 21:53:53.209687+00
restaurant	pro	waiter_app	2026-06-16 21:53:53.209687+00
restaurant	pro	recipe_costing	2026-06-16 21:53:53.209687+00
restaurant	pro	restaurant_reservations	2026-06-16 21:53:53.209687+00
restaurant	pro	restaurant_delivery_orders	2026-06-16 21:53:53.209687+00
restaurant	pro	restaurant_food_inventory	2026-06-16 21:53:53.209687+00
salon	pro	service_menu	2026-06-16 21:53:53.209687+00
salon	pro	staff_scheduling	2026-06-16 21:53:53.209687+00
salon	pro	memberships	2026-06-16 21:53:53.209687+00
salon	pro	commission	2026-06-16 21:53:53.209687+00
salon	pro	salon_management	2026-06-16 21:53:53.209687+00
salon	pro	salon_service_menu	2026-06-16 21:53:53.209687+00
salon	pro	salon_booking	2026-06-16 21:53:53.209687+00
salon	pro	salon_staff_scheduling	2026-06-16 21:53:53.209687+00
salon	pro	salon_memberships	2026-06-16 21:53:53.209687+00
school	pro	school_management	2026-06-16 21:53:53.209687+00
school	pro	students	2026-06-16 21:53:53.209687+00
school	pro	teachers	2026-06-16 21:53:53.209687+00
school	pro	classes_sections	2026-06-16 21:53:53.209687+00
school	pro	attendance	2026-06-16 21:53:53.209687+00
school	pro	fees	2026-06-16 21:53:53.209687+00
school	pro	exams_results	2026-06-16 21:53:53.209687+00
school	pro	timetable	2026-06-16 21:53:53.209687+00
school	pro	parents_portal	2026-06-16 21:53:53.209687+00
school	pro	library	2026-06-16 21:53:53.209687+00
school	pro	admissions	2026-06-16 21:53:53.209687+00
school	pro	grades	2026-06-16 21:53:53.209687+00
school	pro	transport	2026-06-16 21:53:53.209687+00
school	pro	hostel	2026-06-16 21:53:53.209687+00
school	pro	lms	2026-06-16 21:53:53.209687+00
school	pro	school_admissions	2026-06-16 21:53:53.209687+00
school	pro	school_grades	2026-06-16 21:53:53.209687+00
security	pro	rbac_roles	2026-06-16 21:53:53.209687+00
security	pro	audit_logs	2026-06-16 21:53:53.209687+00
services	pro	repair_management	2026-06-16 21:53:53.209687+00
services	pro	tickets	2026-06-16 21:53:53.209687+00
services	pro	job_cards	2026-06-16 21:53:53.209687+00
services	pro	field_staff	2026-06-16 21:53:53.209687+00
store	pro	store_management	2026-06-16 21:53:53.209687+00
store	pro	products	2026-06-16 21:53:53.209687+00
store	pro	inventory	2026-06-16 21:53:53.209687+00
store	pro	sales_orders	2026-06-16 21:53:53.209687+00
store	pro	customers	2026-06-16 21:53:53.209687+00
store	pro	suppliers	2026-06-16 21:53:53.209687+00
store	pro	billing	2026-06-16 21:53:53.209687+00
store	pro	reports	2026-06-16 21:53:53.209687+00
store	pro	pos_terminal	2026-06-16 21:53:53.209687+00
store	pro	barcode_labeling	2026-06-16 21:53:53.209687+00
store	pro	stock_transfer	2026-06-16 21:53:53.209687+00
store	pro	purchase_orders	2026-06-16 21:53:53.209687+00
store	pro	customer_loyalty	2026-06-16 21:53:53.209687+00
store	pro	store_pos_terminal	2026-06-16 21:53:53.209687+00
store	pro	store_barcode_labeling	2026-06-16 21:53:53.209687+00
test	pro	test	2026-06-16 21:53:53.209687+00
test	pro	test1	2026-06-16 21:53:53.209687+00
travel	pro	travel_management	2026-06-16 21:53:53.209687+00
travel	pro	travel_packages	2026-06-16 21:53:53.209687+00
travel	pro	travel_bookings	2026-06-16 21:53:53.209687+00
travel	pro	travel_customers	2026-06-16 21:53:53.209687+00
travel	pro	travel_visa_documents	2026-06-16 21:53:53.209687+00
travel	pro	travel_flight_records	2026-06-16 21:53:53.209687+00
store	enterprise	pos_terminal	2026-06-16 21:53:53.209687+00
store	enterprise	barcode_labeling	2026-06-16 21:53:53.209687+00
store	enterprise	stock_transfer	2026-06-16 21:53:53.209687+00
store	enterprise	purchase_orders	2026-06-16 21:53:53.209687+00
store	enterprise	customer_loyalty	2026-06-16 21:53:53.209687+00
ecommerce	enterprise	online_storefront	2026-06-16 21:53:53.209687+00
ecommerce	enterprise	shipping_delivery	2026-06-16 21:53:53.209687+00
restaurant	enterprise	reservations	2026-06-16 21:53:53.209687+00
restaurant	enterprise	delivery_orders	2026-06-16 21:53:53.209687+00
restaurant	enterprise	food_inventory	2026-06-16 21:53:53.209687+00
restaurant	enterprise	waiter_app	2026-06-16 21:53:53.209687+00
restaurant	enterprise	recipe_costing	2026-06-16 21:53:53.209687+00
school	enterprise	school_management	2026-06-16 21:53:53.209687+00
school	enterprise	students	2026-06-16 21:53:53.209687+00
clinic	enterprise	clinic_medical_records	2026-06-16 21:53:53.209687+00
ecommerce	enterprise	ecommerce_cart_checkout	2026-06-16 21:53:53.209687+00
ecommerce	enterprise	ecommerce_shipping	2026-06-16 21:53:53.209687+00
ecommerce	enterprise	ecommerce_coupons	2026-06-16 21:53:53.209687+00
ecommerce	enterprise	ecommerce_reviews	2026-06-16 21:53:53.209687+00
ecommerce	enterprise	ecommerce_marketplace	2026-06-16 21:53:53.209687+00
ecommerce	enterprise	ecommerce_abandoned_cart	2026-06-16 21:53:53.209687+00
manufacturing	enterprise	manufacturing_material_planning	2026-06-16 21:53:53.209687+00
manufacturing	enterprise	manufacturing_costing	2026-06-16 21:53:53.209687+00
manufacturing	enterprise	manufacturing_maintenance	2026-06-16 21:53:53.209687+00
real_estate	enterprise	real_estate_sales	2026-06-16 21:53:53.209687+00
professional_services	enterprise	professional_services_management	2026-06-16 21:53:53.209687+00
test	enterprise	test	2026-06-16 21:53:53.209687+00
school	enterprise	teachers	2026-06-16 21:53:53.209687+00
school	enterprise	classes_sections	2026-06-16 21:53:53.209687+00
school	enterprise	attendance	2026-06-16 21:53:53.209687+00
school	enterprise	fees	2026-06-16 21:53:53.209687+00
school	enterprise	exams_results	2026-06-16 21:53:53.209687+00
test	enterprise	test1	2026-06-16 21:53:53.209687+00
school	enterprise	grades	2026-06-16 21:53:53.209687+00
school	enterprise	transport	2026-06-16 21:53:53.209687+00
clinic	enterprise	clinic_doctor_schedule	2026-06-16 21:53:53.209687+00
clinic	enterprise	clinic_vitals	2026-06-16 21:53:53.209687+00
clinic	enterprise	clinic_insurance_claims	2026-06-16 21:53:53.209687+00
school	enterprise	lms	2026-06-16 21:53:53.209687+00
clinic	enterprise	medical_records	2026-06-16 21:53:53.209687+00
clinic	enterprise	lab_reports	2026-06-16 21:53:53.209687+00
dental	enterprise	dental_management	2026-06-16 21:53:53.209687+00
clinic	enterprise	patient_portal	2026-06-16 21:53:53.209687+00
dental	enterprise	dental_charting	2026-06-16 21:53:53.209687+00
dental	enterprise	dental_treatment_plans	2026-06-16 21:53:53.209687+00
restaurant	enterprise	restaurant_recipe_costing	2026-06-16 21:53:53.209687+00
restaurant	enterprise	restaurant_floor_plan	2026-06-16 21:53:53.209687+00
restaurant	enterprise	restaurant_modifiers_addons	2026-06-16 21:53:53.209687+00
restaurant	enterprise	restaurant_shift_cash	2026-06-16 21:53:53.209687+00
school	enterprise	school_admissions	2026-06-16 21:53:53.209687+00
school	enterprise	school_grades	2026-06-16 21:53:53.209687+00
school	enterprise	school_transport	2026-06-16 21:53:53.209687+00
school	enterprise	school_hostel	2026-06-16 21:53:53.209687+00
dental	enterprise	dental_lab_cases	2026-06-16 21:53:53.209687+00
dental	enterprise	dental_xray_records	2026-06-16 21:53:53.209687+00
clinic	enterprise	queue_management	2026-06-16 21:53:53.209687+00
school	enterprise	timetable	2026-06-16 21:53:53.209687+00
store	enterprise	store_pos_terminal	2026-06-16 21:53:53.209687+00
real_estate	enterprise	real_estate_properties	2026-06-16 21:53:53.209687+00
real_estate	enterprise	real_estate_leads	2026-06-16 21:53:53.209687+00
real_estate	enterprise	real_estate_rentals	2026-06-16 21:53:53.209687+00
pharmacy	enterprise	pharmacy_compliance_reports	2026-06-16 21:53:53.209687+00
logistics	enterprise	logistics_management	2026-06-16 21:53:53.209687+00
logistics	enterprise	logistics_shipments	2026-06-16 21:53:53.209687+00
logistics	enterprise	logistics_pickups	2026-06-16 21:53:53.209687+00
professional_services	enterprise	professional_services_clients	2026-06-16 21:53:53.209687+00
auto_workshop	enterprise	auto_workshop_mechanics	2026-06-16 21:53:53.209687+00
auto_workshop	enterprise	auto_workshop_billing	2026-06-16 21:53:53.209687+00
professional_services	enterprise	professional_services_time_tracking	2026-06-16 21:53:53.209687+00
professional_services	enterprise	professional_services_invoicing	2026-06-16 21:53:53.209687+00
dental	enterprise	treatment_plans	2026-06-16 21:53:53.209687+00
payments	enterprise	payment_records	2026-06-16 21:53:53.209687+00
ngo	enterprise	ngo_management	2026-06-16 21:53:53.209687+00
payments	enterprise	subscription_billing	2026-06-16 21:53:53.209687+00
license	enterprise	license_keys	2026-06-16 21:53:53.209687+00
security	enterprise	rbac_roles	2026-06-16 21:53:53.209687+00
security	enterprise	audit_logs	2026-06-16 21:53:53.209687+00
store	enterprise	store_management	2026-06-16 21:53:53.209687+00
salon	enterprise	salon_management	2026-06-16 21:53:53.209687+00
hotel	enterprise	hotel_deposits	2026-06-16 21:53:53.209687+00
pharmacy	enterprise	pharmacy_supplier_orders	2026-06-16 21:53:53.209687+00
pharmacy	enterprise	pharmacy_low_stock_alerts	2026-06-16 21:53:53.209687+00
logistics	enterprise	logistics_delivery_tracking	2026-06-16 21:53:53.209687+00
logistics	enterprise	logistics_driver_management	2026-06-16 21:53:53.209687+00
logistics	enterprise	logistics_vehicle_fleet	2026-06-16 21:53:53.209687+00
logistics	enterprise	logistics_cod_collection	2026-06-16 21:53:53.209687+00
logistics	enterprise	logistics_route_planning	2026-06-16 21:53:53.209687+00
construction	enterprise	construction_management	2026-06-16 21:53:53.209687+00
construction	enterprise	construction_projects	2026-06-16 21:53:53.209687+00
construction	enterprise	construction_materials	2026-06-16 21:53:53.209687+00
construction	enterprise	construction_estimates	2026-06-16 21:53:53.209687+00
construction	enterprise	construction_work_orders	2026-06-16 21:53:53.209687+00
construction	enterprise	construction_contractors	2026-06-16 21:53:53.209687+00
construction	enterprise	construction_site_attendance	2026-06-16 21:53:53.209687+00
construction	enterprise	construction_progress_reports	2026-06-16 21:53:53.209687+00
school	enterprise	parents_portal	2026-06-16 21:53:53.209687+00
school	enterprise	library	2026-06-16 21:53:53.209687+00
restaurant	enterprise	menu_items	2026-06-16 21:53:53.209687+00
restaurant	enterprise	tables_orders	2026-06-16 21:53:53.209687+00
restaurant	enterprise	kitchen_display	2026-06-16 21:53:53.209687+00
restaurant	enterprise	restaurant_billing	2026-06-16 21:53:53.209687+00
clinic	enterprise	patients	2026-06-16 21:53:53.209687+00
clinic	enterprise	appointments	2026-06-16 21:53:53.209687+00
business	enterprise	crm	2026-06-16 21:53:53.209687+00
business	enterprise	website	2026-06-16 21:53:53.209687+00
school	enterprise	hostel	2026-06-16 21:53:53.209687+00
finance	enterprise	tax_management	2026-06-16 21:53:53.209687+00
store	enterprise	store_barcode_labeling	2026-06-16 21:53:53.209687+00
store	enterprise	store_stock_transfer	2026-06-16 21:53:53.209687+00
store	enterprise	store_purchase_orders	2026-06-16 21:53:53.209687+00
store	enterprise	store_customer_loyalty	2026-06-16 21:53:53.209687+00
store	enterprise	store_returns_refunds	2026-06-16 21:53:53.209687+00
store	enterprise	store_price_lists	2026-06-16 21:53:53.209687+00
integrations	enterprise	api_keys	2026-06-16 21:53:53.209687+00
integrations	enterprise	webhooks	2026-06-16 21:53:53.209687+00
communication	enterprise	email_sms	2026-06-16 21:53:53.209687+00
communication	enterprise	whatsapp	2026-06-16 21:53:53.209687+00
analytics	enterprise	analytics_dashboard	2026-06-16 21:53:53.209687+00
analytics	enterprise	custom_reports	2026-06-16 21:53:53.209687+00
ai	enterprise	ai_assistant	2026-06-16 21:53:53.209687+00
store	enterprise	store_low_stock_alerts	2026-06-16 21:53:53.209687+00
restaurant	enterprise	restaurant_reservations	2026-06-16 21:53:53.209687+00
restaurant	enterprise	restaurant_delivery_orders	2026-06-16 21:53:53.209687+00
ai	enterprise	ai_forecasting	2026-06-16 21:53:53.209687+00
automation	enterprise	workflow_automation	2026-06-16 21:53:53.209687+00
restaurant	enterprise	restaurant_food_inventory	2026-06-16 21:53:53.209687+00
restaurant	enterprise	restaurant_waiter_app	2026-06-16 21:53:53.209687+00
school	enterprise	school_lms	2026-06-16 21:53:53.209687+00
school	enterprise	school_homework	2026-06-16 21:53:53.209687+00
school	enterprise	school_online_classes	2026-06-16 21:53:53.209687+00
clinic	enterprise	doctors	2026-06-16 21:53:53.209687+00
clinic	enterprise	prescriptions	2026-06-16 21:53:53.209687+00
clinic	enterprise	clinic_billing	2026-06-16 21:53:53.209687+00
clinic	enterprise	clinic_lab_reports	2026-06-16 21:53:53.209687+00
clinic	enterprise	clinic_pharmacy_stock	2026-06-16 21:53:53.209687+00
clinic	enterprise	clinic_patient_portal	2026-06-16 21:53:53.209687+00
dental	enterprise	dental_patient_recall	2026-06-16 21:53:53.209687+00
dental	enterprise	dental_orthodontics	2026-06-16 21:53:53.209687+00
store	enterprise	products	2026-06-16 21:53:53.209687+00
store	enterprise	inventory	2026-06-16 21:53:53.209687+00
store	enterprise	sales_orders	2026-06-16 21:53:53.209687+00
store	enterprise	customers	2026-06-16 21:53:53.209687+00
store	enterprise	suppliers	2026-06-16 21:53:53.209687+00
store	enterprise	billing	2026-06-16 21:53:53.209687+00
store	enterprise	reports	2026-06-16 21:53:53.209687+00
restaurant	enterprise	restaurant_management	2026-06-16 21:53:53.209687+00
salon	enterprise	salon_service_menu	2026-06-16 21:53:53.209687+00
clinic	enterprise	clinic_management	2026-06-16 21:53:53.209687+00
salon	enterprise	salon_booking	2026-06-16 21:53:53.209687+00
salon	enterprise	salon_staff_scheduling	2026-06-16 21:53:53.209687+00
salon	enterprise	salon_memberships	2026-06-16 21:53:53.209687+00
salon	enterprise	salon_packages	2026-06-16 21:53:53.209687+00
salon	enterprise	salon_products	2026-06-16 21:53:53.209687+00
salon	enterprise	salon_commission	2026-06-16 21:53:53.209687+00
hotel	enterprise	hotel_room_booking	2026-06-16 21:53:53.209687+00
hotel	enterprise	hotel_checkin_checkout	2026-06-16 21:53:53.209687+00
hotel	enterprise	hotel_room_status	2026-06-16 21:53:53.209687+00
hotel	enterprise	hotel_housekeeping	2026-06-16 21:53:53.209687+00
hotel	enterprise	hotel_guest_records	2026-06-16 21:53:53.209687+00
clinic	enterprise	pharmacy_stock	2026-06-16 21:53:53.209687+00
clinic	enterprise	clinic_queue_management	2026-06-16 21:53:53.209687+00
dental	enterprise	dental_billing	2026-06-16 21:53:53.209687+00
hotel	enterprise	hotel_management	2026-06-16 21:53:53.209687+00
travel	enterprise	travel_management	2026-06-16 21:53:53.209687+00
travel	enterprise	travel_packages	2026-06-16 21:53:53.209687+00
travel	enterprise	travel_bookings	2026-06-16 21:53:53.209687+00
travel	enterprise	travel_customers	2026-06-16 21:53:53.209687+00
travel	enterprise	travel_visa_documents	2026-06-16 21:53:53.209687+00
travel	enterprise	travel_flight_records	2026-06-16 21:53:53.209687+00
travel	enterprise	travel_hotel_reservations	2026-06-16 21:53:53.209687+00
travel	enterprise	travel_commission	2026-06-16 21:53:53.209687+00
ecommerce	enterprise	ecommerce_management	2026-06-16 21:53:53.209687+00
ecommerce	enterprise	ecommerce_storefront	2026-06-16 21:53:53.209687+00
ecommerce	enterprise	ecommerce_orders	2026-06-16 21:53:53.209687+00
ecommerce	enterprise	ecommerce_products	2026-06-16 21:53:53.209687+00
manufacturing	enterprise	manufacturing_bom	2026-06-16 21:53:53.209687+00
manufacturing	enterprise	manufacturing_production_orders	2026-06-16 21:53:53.209687+00
manufacturing	enterprise	manufacturing_workstations	2026-06-16 21:53:53.209687+00
manufacturing	enterprise	manufacturing_quality_control	2026-06-16 21:53:53.209687+00
professional_services	enterprise	professional_services_contracts	2026-06-16 21:53:53.209687+00
professional_services	enterprise	professional_services_retainer_billing	2026-06-16 21:53:53.209687+00
ngo	enterprise	ngo_donors	2026-06-16 21:53:53.209687+00
ngo	enterprise	ngo_donations	2026-06-16 21:53:53.209687+00
school	enterprise	admissions	2026-06-16 21:53:53.209687+00
salon	enterprise	service_menu	2026-06-16 21:53:53.209687+00
salon	enterprise	staff_scheduling	2026-06-16 21:53:53.209687+00
real_estate	enterprise	real_estate_management	2026-06-16 21:53:53.209687+00
real_estate	enterprise	real_estate_visits	2026-06-16 21:53:53.209687+00
salon	enterprise	memberships	2026-06-16 21:53:53.209687+00
real_estate	enterprise	real_estate_commission	2026-06-16 21:53:53.209687+00
salon	enterprise	commission	2026-06-16 21:53:53.209687+00
hotel	enterprise	room_booking	2026-06-16 21:53:53.209687+00
hotel	enterprise	housekeeping	2026-06-16 21:53:53.209687+00
hotel	enterprise	checkin_checkout	2026-06-16 21:53:53.209687+00
services	enterprise	repair_management	2026-06-16 21:53:53.209687+00
services	enterprise	tickets	2026-06-16 21:53:53.209687+00
services	enterprise	job_cards	2026-06-16 21:53:53.209687+00
services	enterprise	field_staff	2026-06-16 21:53:53.209687+00
services	enterprise	warranty	2026-06-16 21:53:53.209687+00
manufacturing	enterprise	bom	2026-06-16 21:53:53.209687+00
manufacturing	enterprise	production_orders	2026-06-16 21:53:53.209687+00
manufacturing	enterprise	quality_control	2026-06-16 21:53:53.209687+00
real_estate	enterprise	properties	2026-06-16 21:53:53.209687+00
real_estate	enterprise	leads_pipeline	2026-06-16 21:53:53.209687+00
real_estate	enterprise	rentals	2026-06-16 21:53:53.209687+00
gym	enterprise	gym_management	2026-06-16 21:53:53.209687+00
gym	enterprise	trainer_schedule	2026-06-16 21:53:53.209687+00
gym	enterprise	fitness_memberships	2026-06-16 21:53:53.209687+00
finance	enterprise	accounting	2026-06-16 21:53:53.209687+00
finance	enterprise	expenses	2026-06-16 21:53:53.209687+00
finance	enterprise	ledger	2026-06-16 21:53:53.209687+00
manufacturing	enterprise	manufacturing_management	2026-06-16 21:53:53.209687+00
real_estate	enterprise	real_estate_documents	2026-06-16 21:53:53.209687+00
pharmacy	enterprise	pharmacy_management	2026-06-16 21:53:53.209687+00
pharmacy	enterprise	pharmacy_medicine_catalog	2026-06-16 21:53:53.209687+00
pharmacy	enterprise	pharmacy_inventory	2026-06-16 21:53:53.209687+00
pharmacy	enterprise	pharmacy_batch_expiry	2026-06-16 21:53:53.209687+00
pharmacy	enterprise	pharmacy_prescription_sales	2026-06-16 21:53:53.209687+00
agriculture	enterprise	agriculture_fields	2026-06-16 21:53:53.209687+00
agriculture	enterprise	agriculture_crops	2026-06-16 21:53:53.209687+00
law_firm	enterprise	law_documents	2026-06-16 21:53:53.209687+00
law_firm	enterprise	law_billing	2026-06-16 21:53:53.209687+00
law_firm	enterprise	law_time_tracking	2026-06-16 21:53:53.209687+00
law_firm	enterprise	law_compliance	2026-06-16 21:53:53.209687+00
accounting_tax	enterprise	accounting_tax_management	2026-06-16 21:53:53.209687+00
accounting_tax	enterprise	accounting_clients	2026-06-16 21:53:53.209687+00
accounting_tax	enterprise	accounting_bookkeeping	2026-06-16 21:53:53.209687+00
accounting_tax	enterprise	accounting_tax_returns	2026-06-16 21:53:53.209687+00
accounting_tax	enterprise	accounting_expenses	2026-06-16 21:53:53.209687+00
accounting_tax	enterprise	accounting_reports	2026-06-16 21:53:53.209687+00
accounting_tax	enterprise	accounting_payroll	2026-06-16 21:53:53.209687+00
accounting_tax	enterprise	accounting_audit_files	2026-06-16 21:53:53.209687+00
agriculture	enterprise	agriculture_livestock	2026-06-16 21:53:53.209687+00
agriculture	enterprise	agriculture_inputs	2026-06-16 21:53:53.209687+00
agriculture	enterprise	agriculture_harvest	2026-06-16 21:53:53.209687+00
agriculture	enterprise	agriculture_expenses	2026-06-16 21:53:53.209687+00
agriculture	enterprise	agriculture_sales	2026-06-16 21:53:53.209687+00
auto_workshop	enterprise	auto_workshop_management	2026-06-16 21:53:53.209687+00
auto_workshop	enterprise	auto_workshop_jobs	2026-06-16 21:53:53.209687+00
auto_workshop	enterprise	auto_workshop_vehicles	2026-06-16 21:53:53.209687+00
auto_workshop	enterprise	auto_workshop_parts_inventory	2026-06-16 21:53:53.209687+00
auto_workshop	enterprise	auto_workshop_service_history	2026-06-16 21:53:53.209687+00
auto_workshop	enterprise	auto_workshop_estimates	2026-06-16 21:53:53.209687+00
event_management	enterprise	event_venues	2026-06-16 21:53:53.209687+00
event_management	enterprise	event_vendor_management	2026-06-16 21:53:53.209687+00
event_management	enterprise	event_budgeting	2026-06-16 21:53:53.209687+00
event_management	enterprise	event_tasks	2026-06-16 21:53:53.209687+00
event_management	enterprise	event_invoicing	2026-06-16 21:53:53.209687+00
law_firm	enterprise	law_firm_management	2026-06-16 21:53:53.209687+00
law_firm	enterprise	law_clients	2026-06-16 21:53:53.209687+00
law_firm	enterprise	law_cases	2026-06-16 21:53:53.209687+00
law_firm	enterprise	law_hearings	2026-06-16 21:53:53.209687+00
school	enterprise	school_certificates	2026-06-16 21:53:53.209687+00
hotel	enterprise	hotel_rental_items	2026-06-16 21:53:53.209687+00
professional_services	enterprise	professional_services_projects	2026-06-16 21:53:53.209687+00
professional_services	enterprise	professional_services_proposals	2026-06-16 21:53:53.209687+00
ngo	enterprise	ngo_campaigns	2026-06-16 21:53:53.209687+00
ngo	enterprise	ngo_beneficiaries	2026-06-16 21:53:53.209687+00
ngo	enterprise	ngo_volunteers	2026-06-16 21:53:53.209687+00
ngo	enterprise	ngo_grants	2026-06-16 21:53:53.209687+00
ngo	enterprise	ngo_impact_reports	2026-06-16 21:53:53.209687+00
agriculture	enterprise	agriculture_management	2026-06-16 21:53:53.209687+00
event_management	enterprise	event_management	2026-06-16 21:53:53.209687+00
event_management	enterprise	event_clients	2026-06-16 21:53:53.209687+00
event_management	enterprise	event_bookings	2026-06-16 21:53:53.209687+00
hr_recruitment	enterprise	hr_recruitment_management	2026-06-16 21:53:53.209687+00
hr_recruitment	enterprise	hr_candidates	2026-06-16 21:53:53.209687+00
hr_recruitment	enterprise	hr_jobs	2026-06-16 21:53:53.209687+00
hr_recruitment	enterprise	hr_applications	2026-06-16 21:53:53.209687+00
hr_recruitment	enterprise	hr_interviews	2026-06-16 21:53:53.209687+00
hr_recruitment	enterprise	hr_clients	2026-06-16 21:53:53.209687+00
hr_recruitment	enterprise	hr_offer_letters	2026-06-16 21:53:53.209687+00
hr_recruitment	enterprise	hr_onboarding	2026-06-16 21:53:53.209687+00
\.


--
-- Data for Name: backup_business_type_aliases_20260616_222209; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.backup_business_type_aliases_20260616_222209 (alias, business_type_id, created_at) FROM stdin;
\.


--
-- Data for Name: backup_business_types_20260616_222209; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.backup_business_types_20260616_222209 (id, name, module_category, pricing_weight, status, sort_order, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: backup_plan_modules_after_global_20260616_210346; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.backup_plan_modules_after_global_20260616_210346 (plan_id, module_id, created_at) FROM stdin;
store_pro	store_management	2026-06-09 21:27:23.00887+00
store_pro	products	2026-06-09 21:27:23.00887+00
store_pro	inventory	2026-06-09 21:27:23.00887+00
store_pro	sales_orders	2026-06-09 21:27:23.00887+00
store_pro	customers	2026-06-09 21:27:23.00887+00
store_pro	suppliers	2026-06-09 21:27:23.00887+00
store_pro	reports	2026-06-09 21:27:23.00887+00
store_pro	billing	2026-06-10 09:34:21.634902+00
school_pro	school_management	2026-06-10 09:34:21.634902+00
school_pro	students	2026-06-10 09:34:21.634902+00
school_pro	teachers	2026-06-10 09:34:21.634902+00
school_pro	classes_sections	2026-06-10 09:34:21.634902+00
school_pro	attendance	2026-06-10 09:34:21.634902+00
school_pro	fees	2026-06-10 09:34:21.634902+00
school_pro	exams_results	2026-06-10 09:34:21.634902+00
school_pro	timetable	2026-06-10 09:34:21.634902+00
school_pro	parents_portal	2026-06-10 09:34:21.634902+00
school_pro	library	2026-06-10 09:34:21.634902+00
restaurant_pro	restaurant_management	2026-06-10 09:34:21.634902+00
restaurant_pro	menu_items	2026-06-10 09:34:21.634902+00
restaurant_pro	tables_orders	2026-06-10 09:34:21.634902+00
restaurant_pro	kitchen_display	2026-06-10 09:34:21.634902+00
restaurant_pro	restaurant_billing	2026-06-10 09:34:21.634902+00
restaurant_pro	reports	2026-06-10 09:34:21.634902+00
clinic_pro	clinic_management	2026-06-10 09:34:21.634902+00
clinic_pro	patients	2026-06-10 09:34:21.634902+00
clinic_pro	appointments	2026-06-10 09:34:21.634902+00
clinic_pro	doctors	2026-06-10 09:34:21.634902+00
clinic_pro	prescriptions	2026-06-10 09:34:21.634902+00
clinic_pro	clinic_billing	2026-06-10 09:34:21.634902+00
clinic_pro	reports	2026-06-10 09:34:21.634902+00
store_start	store_management	2026-06-11 23:52:01.788235+00
store_start	products	2026-06-11 23:52:01.788235+00
store_start	inventory	2026-06-11 23:52:01.788235+00
store_start	sales_orders	2026-06-11 23:52:01.788235+00
store_start	customers	2026-06-11 23:52:01.788235+00
store_start	suppliers	2026-06-11 23:52:01.788235+00
store_start	billing	2026-06-11 23:52:01.788235+00
store_start	reports	2026-06-11 23:52:01.788235+00
restaurant_start	restaurant_management	2026-06-11 23:52:01.788235+00
restaurant_start	products	2026-06-11 23:52:01.788235+00
restaurant_start	inventory	2026-06-11 23:52:01.788235+00
restaurant_start	sales_orders	2026-06-11 23:52:01.788235+00
restaurant_start	customers	2026-06-11 23:52:01.788235+00
restaurant_start	suppliers	2026-06-11 23:52:01.788235+00
restaurant_start	billing	2026-06-11 23:52:01.788235+00
restaurant_start	reports	2026-06-11 23:52:01.788235+00
school_start	school_management	2026-06-11 23:52:01.788235+00
school_start	customers	2026-06-11 23:52:01.788235+00
school_start	billing	2026-06-11 23:52:01.788235+00
school_start	reports	2026-06-11 23:52:01.788235+00
school_start	website	2026-06-11 23:52:01.788235+00
clinic_start	clinic_management	2026-06-11 23:52:01.788235+00
clinic_start	customers	2026-06-11 23:52:01.788235+00
clinic_start	billing	2026-06-11 23:52:01.788235+00
clinic_start	reports	2026-06-11 23:52:01.788235+00
clinic_start	crm	2026-06-11 23:52:01.788235+00
school_start	students	2026-06-11 23:53:07.274937+00
school_start	teachers	2026-06-11 23:53:07.274937+00
school_start	classes_sections	2026-06-11 23:53:07.274937+00
school_start	attendance	2026-06-11 23:53:07.274937+00
restaurant_start	menu_items	2026-06-11 23:53:07.274937+00
restaurant_start	tables_orders	2026-06-11 23:53:07.274937+00
clinic_start	patients	2026-06-11 23:53:07.274937+00
clinic_start	appointments	2026-06-11 23:53:07.274937+00
clinic_start	doctors	2026-06-11 23:53:07.274937+00
business_plus	store_management	2026-06-16 20:57:02.931952+00
business_plus	inventory	2026-06-16 20:57:02.931952+00
business_plus	sales_orders	2026-06-16 20:57:02.931952+00
business_plus	customers	2026-06-16 20:57:02.931952+00
business_plus	suppliers	2026-06-16 20:57:02.931952+00
business_plus	billing	2026-06-16 20:57:02.931952+00
business_plus	reports	2026-06-16 20:57:02.931952+00
business_plus	crm	2026-06-16 20:57:02.931952+00
business_plus	website	2026-06-16 20:57:02.931952+00
business_plus	products	2026-06-16 20:57:02.931952+00
starter	core_dashboard	2026-06-16 21:00:35.999748+00
starter	core_branches	2026-06-16 21:00:35.999748+00
starter	core_company_profile	2026-06-16 21:00:35.999748+00
starter	core_users	2026-06-16 21:00:35.999748+00
starter	core_roles_permissions	2026-06-16 21:00:35.999748+00
starter	core_files	2026-06-16 21:00:35.999748+00
starter	core_calendar	2026-06-16 21:00:35.999748+00
starter	core_notifications	2026-06-16 21:00:35.999748+00
starter	core_activity_logs	2026-06-16 21:00:35.999748+00
starter	core_import_export	2026-06-16 21:00:35.999748+00
starter	core_custom_fields	2026-06-16 21:00:35.999748+00
starter	core_tasks	2026-06-16 21:00:35.999748+00
pro	core_dashboard	2026-06-16 21:00:35.999748+00
pro	core_branches	2026-06-16 21:00:35.999748+00
pro	online_storefront	2026-06-16 21:00:35.999748+00
pro	shipping_delivery	2026-06-16 21:00:35.999748+00
pro	reservations	2026-06-16 21:00:35.999748+00
pro	clinic_medical_records	2026-06-16 21:00:35.999748+00
pro	ecommerce_cart_checkout	2026-06-16 21:00:35.999748+00
pro	ecommerce_shipping	2026-06-16 21:00:35.999748+00
pro	ecommerce_coupons	2026-06-16 21:00:35.999748+00
pro	ecommerce_reviews	2026-06-16 21:00:35.999748+00
pro	ecommerce_marketplace	2026-06-16 21:00:35.999748+00
pro	delivery_orders	2026-06-16 21:00:35.999748+00
pro	ecommerce_abandoned_cart	2026-06-16 21:00:35.999748+00
pro	food_inventory	2026-06-16 21:00:35.999748+00
pro	waiter_app	2026-06-16 21:00:35.999748+00
pro	recipe_costing	2026-06-16 21:00:35.999748+00
pro	school_management	2026-06-16 21:00:35.999748+00
pro	students	2026-06-16 21:00:35.999748+00
pro	teachers	2026-06-16 21:00:35.999748+00
pro	classes_sections	2026-06-16 21:00:35.999748+00
pro	attendance	2026-06-16 21:00:35.999748+00
pro	fees	2026-06-16 21:00:35.999748+00
pro	exams_results	2026-06-16 21:00:35.999748+00
pro	clinic_doctor_schedule	2026-06-16 21:00:35.999748+00
pro	clinic_vitals	2026-06-16 21:00:35.999748+00
pro	clinic_insurance_claims	2026-06-16 21:00:35.999748+00
pro	grades	2026-06-16 21:00:35.999748+00
pro	transport	2026-06-16 21:00:35.999748+00
pro	lms	2026-06-16 21:00:35.999748+00
pro	medical_records	2026-06-16 21:00:35.999748+00
pro	lab_reports	2026-06-16 21:00:35.999748+00
pro	patient_portal	2026-06-16 21:00:35.999748+00
pro	core_company_profile	2026-06-16 21:00:35.999748+00
pro	core_users	2026-06-16 21:00:35.999748+00
pro	core_roles_permissions	2026-06-16 21:00:35.999748+00
pro	core_files	2026-06-16 21:00:35.999748+00
pro	core_calendar	2026-06-16 21:00:35.999748+00
pro	core_notifications	2026-06-16 21:00:35.999748+00
pro	core_activity_logs	2026-06-16 21:00:35.999748+00
pro	core_import_export	2026-06-16 21:00:35.999748+00
pro	core_custom_fields	2026-06-16 21:00:35.999748+00
pro	core_tasks	2026-06-16 21:00:35.999748+00
pro	restaurant_recipe_costing	2026-06-16 21:00:35.999748+00
pro	restaurant_floor_plan	2026-06-16 21:00:35.999748+00
pro	restaurant_modifiers_addons	2026-06-16 21:00:35.999748+00
pro	restaurant_shift_cash	2026-06-16 21:00:35.999748+00
pro	school_admissions	2026-06-16 21:00:35.999748+00
pro	school_grades	2026-06-16 21:00:35.999748+00
pro	school_transport	2026-06-16 21:00:35.999748+00
pro	school_hostel	2026-06-16 21:00:35.999748+00
pro	queue_management	2026-06-16 21:00:35.999748+00
pro	timetable	2026-06-16 21:00:35.999748+00
pro	parents_portal	2026-06-16 21:00:35.999748+00
pro	library	2026-06-16 21:00:35.999748+00
pro	menu_items	2026-06-16 21:00:35.999748+00
pro	tables_orders	2026-06-16 21:00:35.999748+00
pro	kitchen_display	2026-06-16 21:00:35.999748+00
pro	restaurant_billing	2026-06-16 21:00:35.999748+00
pro	patients	2026-06-16 21:00:35.999748+00
pro	appointments	2026-06-16 21:00:35.999748+00
pro	hostel	2026-06-16 21:00:35.999748+00
pro	restaurant_reservations	2026-06-16 21:00:35.999748+00
pro	restaurant_delivery_orders	2026-06-16 21:00:35.999748+00
pro	restaurant_food_inventory	2026-06-16 21:00:35.999748+00
pro	restaurant_waiter_app	2026-06-16 21:00:35.999748+00
pro	school_lms	2026-06-16 21:00:35.999748+00
pro	school_homework	2026-06-16 21:00:35.999748+00
pro	school_online_classes	2026-06-16 21:00:35.999748+00
pro	clinic_management	2026-06-16 21:00:35.999748+00
pro	doctors	2026-06-16 21:00:35.999748+00
pro	prescriptions	2026-06-16 21:00:35.999748+00
pro	clinic_billing	2026-06-16 21:00:35.999748+00
pro	clinic_lab_reports	2026-06-16 21:00:35.999748+00
pro	clinic_pharmacy_stock	2026-06-16 21:00:35.999748+00
pro	clinic_patient_portal	2026-06-16 21:00:35.999748+00
pro	restaurant_management	2026-06-16 21:00:35.999748+00
pro	pharmacy_stock	2026-06-16 21:00:35.999748+00
pro	clinic_queue_management	2026-06-16 21:00:35.999748+00
pro	ecommerce_management	2026-06-16 21:00:35.999748+00
pro	ecommerce_storefront	2026-06-16 21:00:35.999748+00
pro	ecommerce_orders	2026-06-16 21:00:35.999748+00
pro	ecommerce_products	2026-06-16 21:00:35.999748+00
pro	admissions	2026-06-16 21:00:35.999748+00
pro	school_certificates	2026-06-16 21:00:35.999748+00
enterprise	pos_terminal	2026-06-16 21:00:35.999748+00
enterprise	core_dashboard	2026-06-16 21:00:35.999748+00
enterprise	core_branches	2026-06-16 21:00:35.999748+00
enterprise	barcode_labeling	2026-06-16 21:00:35.999748+00
enterprise	stock_transfer	2026-06-16 21:00:35.999748+00
enterprise	purchase_orders	2026-06-16 21:00:35.999748+00
enterprise	customer_loyalty	2026-06-16 21:00:35.999748+00
enterprise	online_storefront	2026-06-16 21:00:35.999748+00
enterprise	shipping_delivery	2026-06-16 21:00:35.999748+00
enterprise	reservations	2026-06-16 21:00:35.999748+00
enterprise	clinic_medical_records	2026-06-16 21:00:35.999748+00
enterprise	ecommerce_cart_checkout	2026-06-16 21:00:35.999748+00
enterprise	ecommerce_shipping	2026-06-16 21:00:35.999748+00
enterprise	ecommerce_coupons	2026-06-16 21:00:35.999748+00
enterprise	ecommerce_reviews	2026-06-16 21:00:35.999748+00
enterprise	ecommerce_marketplace	2026-06-16 21:00:35.999748+00
enterprise	delivery_orders	2026-06-16 21:00:35.999748+00
enterprise	ecommerce_abandoned_cart	2026-06-16 21:00:35.999748+00
enterprise	manufacturing_material_planning	2026-06-16 21:00:35.999748+00
enterprise	manufacturing_costing	2026-06-16 21:00:35.999748+00
enterprise	food_inventory	2026-06-16 21:00:35.999748+00
enterprise	waiter_app	2026-06-16 21:00:35.999748+00
enterprise	recipe_costing	2026-06-16 21:00:35.999748+00
enterprise	school_management	2026-06-16 21:00:35.999748+00
enterprise	students	2026-06-16 21:00:35.999748+00
enterprise	manufacturing_maintenance	2026-06-16 21:00:35.999748+00
enterprise	real_estate_sales	2026-06-16 21:00:35.999748+00
enterprise	professional_services_management	2026-06-16 21:00:35.999748+00
enterprise	test	2026-06-16 21:00:35.999748+00
enterprise	teachers	2026-06-16 21:00:35.999748+00
enterprise	classes_sections	2026-06-16 21:00:35.999748+00
enterprise	attendance	2026-06-16 21:00:35.999748+00
enterprise	fees	2026-06-16 21:00:35.999748+00
enterprise	exams_results	2026-06-16 21:00:35.999748+00
enterprise	test1	2026-06-16 21:00:35.999748+00
enterprise	clinic_doctor_schedule	2026-06-16 21:00:35.999748+00
enterprise	clinic_vitals	2026-06-16 21:00:35.999748+00
enterprise	clinic_insurance_claims	2026-06-16 21:00:35.999748+00
enterprise	grades	2026-06-16 21:00:35.999748+00
enterprise	transport	2026-06-16 21:00:35.999748+00
enterprise	lms	2026-06-16 21:00:35.999748+00
enterprise	medical_records	2026-06-16 21:00:35.999748+00
enterprise	dental_management	2026-06-16 21:00:35.999748+00
enterprise	dental_charting	2026-06-16 21:00:35.999748+00
enterprise	dental_treatment_plans	2026-06-16 21:00:35.999748+00
enterprise	lab_reports	2026-06-16 21:00:35.999748+00
enterprise	patient_portal	2026-06-16 21:00:35.999748+00
enterprise	core_company_profile	2026-06-16 21:00:35.999748+00
enterprise	core_users	2026-06-16 21:00:35.999748+00
enterprise	core_roles_permissions	2026-06-16 21:00:35.999748+00
enterprise	core_files	2026-06-16 21:00:35.999748+00
enterprise	core_calendar	2026-06-16 21:00:35.999748+00
enterprise	core_notifications	2026-06-16 21:00:35.999748+00
enterprise	core_activity_logs	2026-06-16 21:00:35.999748+00
enterprise	core_import_export	2026-06-16 21:00:35.999748+00
enterprise	core_custom_fields	2026-06-16 21:00:35.999748+00
enterprise	core_tasks	2026-06-16 21:00:35.999748+00
enterprise	restaurant_recipe_costing	2026-06-16 21:00:35.999748+00
enterprise	restaurant_floor_plan	2026-06-16 21:00:35.999748+00
enterprise	restaurant_modifiers_addons	2026-06-16 21:00:35.999748+00
enterprise	restaurant_shift_cash	2026-06-16 21:00:35.999748+00
enterprise	school_admissions	2026-06-16 21:00:35.999748+00
enterprise	school_grades	2026-06-16 21:00:35.999748+00
enterprise	school_transport	2026-06-16 21:00:35.999748+00
enterprise	school_hostel	2026-06-16 21:00:35.999748+00
enterprise	dental_lab_cases	2026-06-16 21:00:35.999748+00
enterprise	dental_xray_records	2026-06-16 21:00:35.999748+00
enterprise	queue_management	2026-06-16 21:00:35.999748+00
enterprise	timetable	2026-06-16 21:00:35.999748+00
enterprise	store_pos_terminal	2026-06-16 21:00:35.999748+00
enterprise	real_estate_properties	2026-06-16 21:00:35.999748+00
enterprise	real_estate_leads	2026-06-16 21:00:35.999748+00
enterprise	real_estate_rentals	2026-06-16 21:00:35.999748+00
enterprise	pharmacy_compliance_reports	2026-06-16 21:00:35.999748+00
enterprise	logistics_management	2026-06-16 21:00:35.999748+00
enterprise	logistics_shipments	2026-06-16 21:00:35.999748+00
enterprise	logistics_pickups	2026-06-16 21:00:35.999748+00
enterprise	professional_services_clients	2026-06-16 21:00:35.999748+00
enterprise	auto_workshop_mechanics	2026-06-16 21:00:35.999748+00
enterprise	auto_workshop_billing	2026-06-16 21:00:35.999748+00
enterprise	treatment_plans	2026-06-16 21:00:35.999748+00
enterprise	professional_services_time_tracking	2026-06-16 21:00:35.999748+00
enterprise	payment_records	2026-06-16 21:00:35.999748+00
enterprise	professional_services_invoicing	2026-06-16 21:00:35.999748+00
enterprise	ngo_management	2026-06-16 21:00:35.999748+00
enterprise	subscription_billing	2026-06-16 21:00:35.999748+00
enterprise	license_keys	2026-06-16 21:00:35.999748+00
enterprise	rbac_roles	2026-06-16 21:00:35.999748+00
enterprise	audit_logs	2026-06-16 21:00:35.999748+00
enterprise	store_management	2026-06-16 21:00:35.999748+00
enterprise	salon_management	2026-06-16 21:00:35.999748+00
enterprise	hotel_deposits	2026-06-16 21:00:35.999748+00
enterprise	pharmacy_supplier_orders	2026-06-16 21:00:35.999748+00
enterprise	pharmacy_low_stock_alerts	2026-06-16 21:00:35.999748+00
enterprise	logistics_delivery_tracking	2026-06-16 21:00:35.999748+00
enterprise	logistics_driver_management	2026-06-16 21:00:35.999748+00
enterprise	logistics_vehicle_fleet	2026-06-16 21:00:35.999748+00
enterprise	logistics_cod_collection	2026-06-16 21:00:35.999748+00
enterprise	logistics_route_planning	2026-06-16 21:00:35.999748+00
enterprise	construction_management	2026-06-16 21:00:35.999748+00
enterprise	construction_projects	2026-06-16 21:00:35.999748+00
enterprise	construction_materials	2026-06-16 21:00:35.999748+00
enterprise	construction_estimates	2026-06-16 21:00:35.999748+00
enterprise	construction_work_orders	2026-06-16 21:00:35.999748+00
enterprise	construction_contractors	2026-06-16 21:00:35.999748+00
enterprise	construction_site_attendance	2026-06-16 21:00:35.999748+00
enterprise	construction_progress_reports	2026-06-16 21:00:35.999748+00
enterprise	parents_portal	2026-06-16 21:00:35.999748+00
enterprise	library	2026-06-16 21:00:35.999748+00
enterprise	menu_items	2026-06-16 21:00:35.999748+00
enterprise	tables_orders	2026-06-16 21:00:35.999748+00
enterprise	kitchen_display	2026-06-16 21:00:35.999748+00
enterprise	restaurant_billing	2026-06-16 21:00:35.999748+00
enterprise	patients	2026-06-16 21:00:35.999748+00
enterprise	appointments	2026-06-16 21:00:35.999748+00
enterprise	crm	2026-06-16 21:00:35.999748+00
enterprise	website	2026-06-16 21:00:35.999748+00
enterprise	hostel	2026-06-16 21:00:35.999748+00
enterprise	tax_management	2026-06-16 21:00:35.999748+00
enterprise	api_keys	2026-06-16 21:00:35.999748+00
enterprise	webhooks	2026-06-16 21:00:35.999748+00
enterprise	email_sms	2026-06-16 21:00:35.999748+00
enterprise	whatsapp	2026-06-16 21:00:35.999748+00
enterprise	store_barcode_labeling	2026-06-16 21:00:35.999748+00
enterprise	store_stock_transfer	2026-06-16 21:00:35.999748+00
enterprise	store_purchase_orders	2026-06-16 21:00:35.999748+00
enterprise	store_customer_loyalty	2026-06-16 21:00:35.999748+00
enterprise	store_returns_refunds	2026-06-16 21:00:35.999748+00
enterprise	analytics_dashboard	2026-06-16 21:00:35.999748+00
enterprise	custom_reports	2026-06-16 21:00:35.999748+00
enterprise	ai_assistant	2026-06-16 21:00:35.999748+00
enterprise	store_price_lists	2026-06-16 21:00:35.999748+00
enterprise	store_low_stock_alerts	2026-06-16 21:00:35.999748+00
enterprise	restaurant_reservations	2026-06-16 21:00:35.999748+00
enterprise	restaurant_delivery_orders	2026-06-16 21:00:35.999748+00
enterprise	restaurant_food_inventory	2026-06-16 21:00:35.999748+00
enterprise	restaurant_waiter_app	2026-06-16 21:00:35.999748+00
enterprise	ai_forecasting	2026-06-16 21:00:35.999748+00
enterprise	workflow_automation	2026-06-16 21:00:35.999748+00
enterprise	school_lms	2026-06-16 21:00:35.999748+00
enterprise	school_homework	2026-06-16 21:00:35.999748+00
enterprise	school_online_classes	2026-06-16 21:00:35.999748+00
enterprise	clinic_management	2026-06-16 21:00:35.999748+00
enterprise	doctors	2026-06-16 21:00:35.999748+00
enterprise	prescriptions	2026-06-16 21:00:35.999748+00
enterprise	clinic_billing	2026-06-16 21:00:35.999748+00
enterprise	clinic_lab_reports	2026-06-16 21:00:35.999748+00
enterprise	clinic_pharmacy_stock	2026-06-16 21:00:35.999748+00
enterprise	clinic_patient_portal	2026-06-16 21:00:35.999748+00
enterprise	dental_patient_recall	2026-06-16 21:00:35.999748+00
enterprise	products	2026-06-16 21:00:35.999748+00
enterprise	dental_orthodontics	2026-06-16 21:00:35.999748+00
enterprise	salon_service_menu	2026-06-16 21:00:35.999748+00
enterprise	salon_booking	2026-06-16 21:00:35.999748+00
enterprise	salon_staff_scheduling	2026-06-16 21:00:35.999748+00
enterprise	salon_memberships	2026-06-16 21:00:35.999748+00
enterprise	salon_packages	2026-06-16 21:00:35.999748+00
enterprise	salon_products	2026-06-16 21:00:35.999748+00
enterprise	salon_commission	2026-06-16 21:00:35.999748+00
enterprise	hotel_room_booking	2026-06-16 21:00:35.999748+00
enterprise	inventory	2026-06-16 21:00:35.999748+00
enterprise	sales_orders	2026-06-16 21:00:35.999748+00
enterprise	customers	2026-06-16 21:00:35.999748+00
enterprise	suppliers	2026-06-16 21:00:35.999748+00
enterprise	billing	2026-06-16 21:00:35.999748+00
enterprise	reports	2026-06-16 21:00:35.999748+00
enterprise	restaurant_management	2026-06-16 21:00:35.999748+00
enterprise	hotel_checkin_checkout	2026-06-16 21:00:35.999748+00
enterprise	hotel_room_status	2026-06-16 21:00:35.999748+00
enterprise	hotel_housekeeping	2026-06-16 21:00:35.999748+00
enterprise	hotel_guest_records	2026-06-16 21:00:35.999748+00
enterprise	pharmacy_stock	2026-06-16 21:00:35.999748+00
enterprise	clinic_queue_management	2026-06-16 21:00:35.999748+00
enterprise	dental_billing	2026-06-16 21:00:35.999748+00
enterprise	hotel_management	2026-06-16 21:00:35.999748+00
enterprise	travel_management	2026-06-16 21:00:35.999748+00
enterprise	travel_packages	2026-06-16 21:00:35.999748+00
enterprise	travel_bookings	2026-06-16 21:00:35.999748+00
enterprise	travel_customers	2026-06-16 21:00:35.999748+00
enterprise	travel_visa_documents	2026-06-16 21:00:35.999748+00
enterprise	travel_flight_records	2026-06-16 21:00:35.999748+00
enterprise	travel_hotel_reservations	2026-06-16 21:00:35.999748+00
enterprise	travel_commission	2026-06-16 21:00:35.999748+00
enterprise	ecommerce_management	2026-06-16 21:00:35.999748+00
enterprise	ecommerce_storefront	2026-06-16 21:00:35.999748+00
enterprise	ecommerce_orders	2026-06-16 21:00:35.999748+00
enterprise	ecommerce_products	2026-06-16 21:00:35.999748+00
enterprise	manufacturing_bom	2026-06-16 21:00:35.999748+00
enterprise	manufacturing_production_orders	2026-06-16 21:00:35.999748+00
enterprise	manufacturing_workstations	2026-06-16 21:00:35.999748+00
enterprise	manufacturing_quality_control	2026-06-16 21:00:35.999748+00
enterprise	professional_services_contracts	2026-06-16 21:00:35.999748+00
enterprise	professional_services_retainer_billing	2026-06-16 21:00:35.999748+00
enterprise	ngo_donors	2026-06-16 21:00:35.999748+00
enterprise	ngo_donations	2026-06-16 21:00:35.999748+00
enterprise	manufacturing_management	2026-06-16 21:00:35.999748+00
enterprise	real_estate_management	2026-06-16 21:00:35.999748+00
enterprise	real_estate_visits	2026-06-16 21:00:35.999748+00
enterprise	admissions	2026-06-16 21:00:35.999748+00
enterprise	real_estate_commission	2026-06-16 21:00:35.999748+00
enterprise	service_menu	2026-06-16 21:00:35.999748+00
enterprise	staff_scheduling	2026-06-16 21:00:35.999748+00
enterprise	memberships	2026-06-16 21:00:35.999748+00
enterprise	commission	2026-06-16 21:00:35.999748+00
enterprise	room_booking	2026-06-16 21:00:35.999748+00
enterprise	housekeeping	2026-06-16 21:00:35.999748+00
enterprise	checkin_checkout	2026-06-16 21:00:35.999748+00
enterprise	repair_management	2026-06-16 21:00:35.999748+00
enterprise	tickets	2026-06-16 21:00:35.999748+00
enterprise	job_cards	2026-06-16 21:00:35.999748+00
enterprise	field_staff	2026-06-16 21:00:35.999748+00
enterprise	warranty	2026-06-16 21:00:35.999748+00
enterprise	bom	2026-06-16 21:00:35.999748+00
enterprise	production_orders	2026-06-16 21:00:35.999748+00
enterprise	quality_control	2026-06-16 21:00:35.999748+00
enterprise	properties	2026-06-16 21:00:35.999748+00
enterprise	leads_pipeline	2026-06-16 21:00:35.999748+00
enterprise	rentals	2026-06-16 21:00:35.999748+00
enterprise	gym_management	2026-06-16 21:00:35.999748+00
enterprise	trainer_schedule	2026-06-16 21:00:35.999748+00
enterprise	fitness_memberships	2026-06-16 21:00:35.999748+00
enterprise	accounting	2026-06-16 21:00:35.999748+00
enterprise	expenses	2026-06-16 21:00:35.999748+00
enterprise	ledger	2026-06-16 21:00:35.999748+00
enterprise	real_estate_documents	2026-06-16 21:00:35.999748+00
enterprise	pharmacy_management	2026-06-16 21:00:35.999748+00
enterprise	pharmacy_medicine_catalog	2026-06-16 21:00:35.999748+00
enterprise	pharmacy_inventory	2026-06-16 21:00:35.999748+00
enterprise	pharmacy_batch_expiry	2026-06-16 21:00:35.999748+00
enterprise	pharmacy_prescription_sales	2026-06-16 21:00:35.999748+00
enterprise	agriculture_fields	2026-06-16 21:00:35.999748+00
enterprise	agriculture_crops	2026-06-16 21:00:35.999748+00
enterprise	law_documents	2026-06-16 21:00:35.999748+00
enterprise	law_billing	2026-06-16 21:00:35.999748+00
enterprise	law_time_tracking	2026-06-16 21:00:35.999748+00
enterprise	law_compliance	2026-06-16 21:00:35.999748+00
enterprise	accounting_tax_management	2026-06-16 21:00:35.999748+00
enterprise	accounting_clients	2026-06-16 21:00:35.999748+00
enterprise	accounting_bookkeeping	2026-06-16 21:00:35.999748+00
enterprise	accounting_tax_returns	2026-06-16 21:00:35.999748+00
enterprise	accounting_expenses	2026-06-16 21:00:35.999748+00
enterprise	accounting_reports	2026-06-16 21:00:35.999748+00
enterprise	accounting_payroll	2026-06-16 21:00:35.999748+00
enterprise	accounting_audit_files	2026-06-16 21:00:35.999748+00
enterprise	event_venues	2026-06-16 21:00:35.999748+00
enterprise	event_vendor_management	2026-06-16 21:00:35.999748+00
enterprise	event_budgeting	2026-06-16 21:00:35.999748+00
enterprise	event_tasks	2026-06-16 21:00:35.999748+00
enterprise	event_invoicing	2026-06-16 21:00:35.999748+00
enterprise	law_firm_management	2026-06-16 21:00:35.999748+00
enterprise	law_clients	2026-06-16 21:00:35.999748+00
enterprise	law_cases	2026-06-16 21:00:35.999748+00
enterprise	law_hearings	2026-06-16 21:00:35.999748+00
enterprise	agriculture_livestock	2026-06-16 21:00:35.999748+00
enterprise	agriculture_inputs	2026-06-16 21:00:35.999748+00
enterprise	agriculture_harvest	2026-06-16 21:00:35.999748+00
enterprise	agriculture_expenses	2026-06-16 21:00:35.999748+00
enterprise	agriculture_sales	2026-06-16 21:00:35.999748+00
enterprise	auto_workshop_management	2026-06-16 21:00:35.999748+00
enterprise	auto_workshop_jobs	2026-06-16 21:00:35.999748+00
enterprise	auto_workshop_vehicles	2026-06-16 21:00:35.999748+00
enterprise	auto_workshop_parts_inventory	2026-06-16 21:00:35.999748+00
enterprise	auto_workshop_service_history	2026-06-16 21:00:35.999748+00
enterprise	auto_workshop_estimates	2026-06-16 21:00:35.999748+00
enterprise	event_management	2026-06-16 21:00:35.999748+00
enterprise	event_clients	2026-06-16 21:00:35.999748+00
enterprise	event_bookings	2026-06-16 21:00:35.999748+00
enterprise	hr_recruitment_management	2026-06-16 21:00:35.999748+00
enterprise	hr_candidates	2026-06-16 21:00:35.999748+00
enterprise	hr_jobs	2026-06-16 21:00:35.999748+00
enterprise	hr_applications	2026-06-16 21:00:35.999748+00
enterprise	hr_interviews	2026-06-16 21:00:35.999748+00
enterprise	hr_clients	2026-06-16 21:00:35.999748+00
enterprise	hr_offer_letters	2026-06-16 21:00:35.999748+00
enterprise	hr_onboarding	2026-06-16 21:00:35.999748+00
enterprise	school_certificates	2026-06-16 21:00:35.999748+00
enterprise	hotel_rental_items	2026-06-16 21:00:35.999748+00
enterprise	professional_services_projects	2026-06-16 21:00:35.999748+00
enterprise	professional_services_proposals	2026-06-16 21:00:35.999748+00
enterprise	ngo_campaigns	2026-06-16 21:00:35.999748+00
enterprise	ngo_beneficiaries	2026-06-16 21:00:35.999748+00
enterprise	ngo_volunteers	2026-06-16 21:00:35.999748+00
enterprise	ngo_grants	2026-06-16 21:00:35.999748+00
enterprise	ngo_impact_reports	2026-06-16 21:00:35.999748+00
enterprise	agriculture_management	2026-06-16 21:00:35.999748+00
\.


--
-- Data for Name: backup_plans_after_global_20260616_210346; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.backup_plans_after_global_20260616_210346 (id, name, monthly_price, yearly_price, status, sort_order, created_at, updated_at) FROM stdin;
starter	Starter	2500.00	25000.00	active	10	2026-06-16 21:00:35.999748+00	2026-06-16 21:00:35.999748+00
pro	Pro	7500.00	75000.00	active	20	2026-06-16 21:00:35.999748+00	2026-06-16 21:00:35.999748+00
enterprise	Enterprise	15000.00	150000.00	active	30	2026-06-16 21:00:35.999748+00	2026-06-16 21:00:35.999748+00
custom	Custom	0.00	0.00	active	40	2026-06-16 21:00:35.999748+00	2026-06-16 21:00:35.999748+00
store_start	Store Start	2500.00	25000.00	active	10	2026-06-09 21:27:23.00887+00	2026-06-16 21:02:21.967717+00
store_pro	Store Pro	5500.00	55000.00	active	20	2026-06-09 21:27:23.00887+00	2026-06-16 21:02:21.967717+00
school_start	School Start	4500.00	45000.00	active	30	2026-06-10 09:34:21.634902+00	2026-06-16 21:02:21.967717+00
school_pro	School Pro	9500.00	95000.00	active	40	2026-06-10 09:34:21.634902+00	2026-06-16 21:02:21.967717+00
restaurant_start	Restaurant Start	3500.00	35000.00	active	50	2026-06-10 09:34:21.634902+00	2026-06-16 21:02:21.967717+00
restaurant_pro	Restaurant Pro	7500.00	75000.00	active	60	2026-06-10 09:34:21.634902+00	2026-06-16 21:02:21.967717+00
clinic_start	Clinic Start	4500.00	45000.00	active	70	2026-06-10 09:34:21.634902+00	2026-06-16 21:02:21.967717+00
clinic_pro	Clinic Pro	8500.00	85000.00	active	80	2026-06-10 09:34:21.634902+00	2026-06-16 21:02:21.967717+00
business_plus	Business Plus	12000.00	120000.00	active	90	2026-06-09 21:27:23.00887+00	2026-06-16 21:02:21.967717+00
enterprise_manual	Enterprise Manual	0.00	0.00	active	100	2026-06-09 21:27:23.00887+00	2026-06-16 21:02:21.967717+00
\.


--
-- Data for Name: backup_tenant_modules_business_v1_20260617_072332; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.backup_tenant_modules_business_v1_20260617_072332 (tenant_id, module_id, enabled, source, created_at, updated_at, monthly_price_snapshot, yearly_price_snapshot, price_override) FROM stdin;
tenant_4f049da4cac745988b96821d9e0051b3	travel_bookings	t	manual	2026-06-15 09:23:20.584551+00	2026-06-15 09:23:20.584551+00	1400.00	14000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	students	f	manual	2026-06-11 08:43:04.421317+00	2026-06-15 10:45:30.685062+00	1000.00	10000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	school_management	t	plan	2026-06-10 12:52:19.587481+00	2026-06-12 19:44:18.830869+00	3500.00	35000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	teachers	t	plan	2026-06-11 22:33:04.488557+00	2026-06-12 19:44:18.830869+00	1000.00	10000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	classes_sections	t	plan	2026-06-11 22:33:02.089447+00	2026-06-12 19:44:18.830869+00	900.00	9000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	attendance	t	plan	2026-06-11 22:33:07.442218+00	2026-06-12 19:44:18.830869+00	1200.00	12000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	website	t	plan	2026-06-12 19:44:15.212838+00	2026-06-12 19:44:18.830869+00	1800.00	18000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	patient_portal	t	manual	2026-06-15 11:10:09.544706+00	2026-06-15 11:10:09.544706+00	1600.00	16000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	treatment_plans	t	manual	2026-06-15 11:10:28.157481+00	2026-06-15 11:10:28.157481+00	1400.00	14000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	test1	f	manual	2026-06-16 20:01:38.70609+00	2026-06-16 20:01:45.348943+00	252.00	230.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	store_management	t	plan	2026-06-10 21:45:16.991791+00	2026-06-12 19:25:39.449423+00	2500.00	25000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	products	t	plan	2026-06-10 21:45:16.991791+00	2026-06-12 19:25:39.449423+00	800.00	8000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	inventory	t	plan	2026-06-10 21:44:47.050432+00	2026-06-12 19:25:39.449423+00	1200.00	12000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	customers	t	plan	2026-06-10 21:44:55.89796+00	2026-06-12 19:25:39.449423+00	1000.00	10000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	suppliers	t	plan	2026-06-10 21:44:53.850162+00	2026-06-12 19:25:39.449423+00	800.00	8000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	billing	t	plan	2026-06-11 23:52:01.79975+00	2026-06-12 19:25:39.449423+00	1500.00	15000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	reports	t	plan	2026-06-11 23:52:01.79975+00	2026-06-12 19:25:39.449423+00	1000.00	10000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	fees	f	manual	2026-06-10 12:52:58.617646+00	2026-06-12 19:25:39.449423+00	1500.00	15000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	timetable	f	manual	2026-06-10 19:05:51.254873+00	2026-06-12 19:25:39.449423+00	900.00	9000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	crm	f	manual	2026-06-09 22:39:07.671601+00	2026-06-12 19:25:39.449423+00	2000.00	20000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	exams_results	f	manual	2026-06-10 19:05:59.638158+00	2026-06-12 19:25:39.449423+00	1400.00	14000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	store_management	t	manual	2026-06-09 22:00:06.74443+00	2026-06-15 11:00:04.971701+00	2500.00	25000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	store_management	t	manual	2026-06-15 11:02:49.368133+00	2026-06-15 11:02:49.368133+00	2500.00	25000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	queue_management	t	manual	2026-06-15 11:10:18.369552+00	2026-06-15 11:10:18.369552+00	900.00	9000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	products	f	manual	2026-06-09 23:03:12.844352+00	2026-06-15 20:35:14.005084+00	803	8000	t
tenant_4f049da4cac745988b96821d9e0051b3	inventory	t	manual	2026-06-09 22:00:26.085447+00	2026-06-16 13:34:07.858265+00	1200.00	12000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	sales_orders	t	manual	2026-06-09 23:03:12.844352+00	2026-06-15 09:56:03.533256+00	1500.00	15000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	sales_orders	t	plan	2026-06-10 21:44:51.933414+00	2026-06-12 19:25:39.449423+00	1500.00	15000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	test	f	manual	2026-06-16 20:01:47.398617+00	2026-06-16 20:01:48.144855+00	10.00	25.00	f
tenant_4f049da4cac745988b96821d9e0051b3	customers	t	plan	2026-06-09 23:23:33.752558+00	2026-06-12 21:32:57.918862+00	1000.00	10000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	suppliers	t	plan	2026-06-09 23:23:33.752558+00	2026-06-12 21:32:57.918862+00	800.00	8000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	menu_items	f	manual	2026-06-10 22:27:13.510477+00	2026-06-12 19:25:39.449423+00	900.00	9000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	parents_portal	f	manual	2026-06-11 18:58:25.771583+00	2026-06-12 19:25:39.449423+00	1200.00	12000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	restaurant_management	f	manual	2026-06-11 18:58:27.907643+00	2026-06-12 19:25:39.449423+00	3000.00	30000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	library	f	manual	2026-06-11 18:58:23.568219+00	2026-06-12 19:25:39.449423+00	800.00	8000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	billing	t	plan	2026-06-10 12:52:01.846218+00	2026-06-12 21:32:57.918862+00	1500.00	15000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	reports	t	plan	2026-06-09 23:23:33.752558+00	2026-06-12 21:32:57.918862+00	100	10000	t
\.


--
-- Data for Name: backup_tenant_modules_business_v2_20260617_073934; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.backup_tenant_modules_business_v2_20260617_073934 (tenant_id, module_id, enabled, source, created_at, updated_at, monthly_price_snapshot, yearly_price_snapshot, price_override) FROM stdin;
tenant_4f049da4cac745988b96821d9e0051b3	travel_bookings	t	manual	2026-06-15 09:23:20.584551+00	2026-06-15 09:23:20.584551+00	1400.00	14000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	students	f	manual	2026-06-11 08:43:04.421317+00	2026-06-15 10:45:30.685062+00	1000.00	10000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	school_management	t	plan	2026-06-10 12:52:19.587481+00	2026-06-12 19:44:18.830869+00	3500.00	35000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	teachers	t	plan	2026-06-11 22:33:04.488557+00	2026-06-12 19:44:18.830869+00	1000.00	10000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	classes_sections	t	plan	2026-06-11 22:33:02.089447+00	2026-06-12 19:44:18.830869+00	900.00	9000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	attendance	t	plan	2026-06-11 22:33:07.442218+00	2026-06-12 19:44:18.830869+00	1200.00	12000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	website	t	plan	2026-06-12 19:44:15.212838+00	2026-06-12 19:44:18.830869+00	1800.00	18000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	patient_portal	t	manual	2026-06-15 11:10:09.544706+00	2026-06-15 11:10:09.544706+00	1600.00	16000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	treatment_plans	t	manual	2026-06-15 11:10:28.157481+00	2026-06-15 11:10:28.157481+00	1400.00	14000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	test1	f	manual	2026-06-16 20:01:38.70609+00	2026-06-16 20:01:45.348943+00	252.00	230.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	store_management	t	plan	2026-06-10 21:45:16.991791+00	2026-06-12 19:25:39.449423+00	2500.00	25000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	products	t	plan	2026-06-10 21:45:16.991791+00	2026-06-12 19:25:39.449423+00	800.00	8000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	inventory	t	plan	2026-06-10 21:44:47.050432+00	2026-06-12 19:25:39.449423+00	1200.00	12000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	customers	t	plan	2026-06-10 21:44:55.89796+00	2026-06-12 19:25:39.449423+00	1000.00	10000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	suppliers	t	plan	2026-06-10 21:44:53.850162+00	2026-06-12 19:25:39.449423+00	800.00	8000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	billing	t	plan	2026-06-11 23:52:01.79975+00	2026-06-12 19:25:39.449423+00	1500.00	15000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	reports	t	plan	2026-06-11 23:52:01.79975+00	2026-06-12 19:25:39.449423+00	1000.00	10000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	fees	f	manual	2026-06-10 12:52:58.617646+00	2026-06-12 19:25:39.449423+00	1500.00	15000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	timetable	f	manual	2026-06-10 19:05:51.254873+00	2026-06-12 19:25:39.449423+00	900.00	9000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	crm	f	manual	2026-06-09 22:39:07.671601+00	2026-06-12 19:25:39.449423+00	2000.00	20000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	exams_results	f	manual	2026-06-10 19:05:59.638158+00	2026-06-12 19:25:39.449423+00	1400.00	14000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	store_management	t	manual	2026-06-09 22:00:06.74443+00	2026-06-15 11:00:04.971701+00	2500.00	25000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	store_management	t	manual	2026-06-15 11:02:49.368133+00	2026-06-15 11:02:49.368133+00	2500.00	25000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	queue_management	t	manual	2026-06-15 11:10:18.369552+00	2026-06-15 11:10:18.369552+00	900.00	9000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	products	f	manual	2026-06-09 23:03:12.844352+00	2026-06-15 20:35:14.005084+00	803	8000	t
tenant_4f049da4cac745988b96821d9e0051b3	inventory	t	manual	2026-06-09 22:00:26.085447+00	2026-06-16 13:34:07.858265+00	1200.00	12000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	sales_orders	t	manual	2026-06-09 23:03:12.844352+00	2026-06-15 09:56:03.533256+00	1500.00	15000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	sales_orders	t	plan	2026-06-10 21:44:51.933414+00	2026-06-12 19:25:39.449423+00	1500.00	15000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	test	f	manual	2026-06-16 20:01:47.398617+00	2026-06-16 20:01:48.144855+00	10.00	25.00	f
tenant_4f049da4cac745988b96821d9e0051b3	customers	t	plan	2026-06-09 23:23:33.752558+00	2026-06-12 21:32:57.918862+00	1000.00	10000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	suppliers	t	plan	2026-06-09 23:23:33.752558+00	2026-06-12 21:32:57.918862+00	800.00	8000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	menu_items	f	manual	2026-06-10 22:27:13.510477+00	2026-06-12 19:25:39.449423+00	900.00	9000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	parents_portal	f	manual	2026-06-11 18:58:25.771583+00	2026-06-12 19:25:39.449423+00	1200.00	12000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	restaurant_management	f	manual	2026-06-11 18:58:27.907643+00	2026-06-12 19:25:39.449423+00	3000.00	30000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	library	f	manual	2026-06-11 18:58:23.568219+00	2026-06-12 19:25:39.449423+00	800.00	8000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	billing	t	plan	2026-06-10 12:52:01.846218+00	2026-06-12 21:32:57.918862+00	1500.00	15000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	reports	t	plan	2026-06-09 23:23:33.752558+00	2026-06-12 21:32:57.918862+00	100	10000	t
\.


--
-- Data for Name: backup_tenant_modules_cleanup_20260617_105755; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.backup_tenant_modules_cleanup_20260617_105755 (tenant_id, module_id, enabled, source, created_at, updated_at, monthly_price_snapshot, yearly_price_snapshot, price_override) FROM stdin;
tenant_4f049da4cac745988b96821d9e0051b3	travel_bookings	t	manual	2026-06-15 09:23:20.584551+00	2026-06-15 09:23:20.584551+00	1400.00	14000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	students	f	manual	2026-06-11 08:43:04.421317+00	2026-06-15 10:45:30.685062+00	1000.00	10000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	patient_portal	t	manual	2026-06-15 11:10:09.544706+00	2026-06-15 11:10:09.544706+00	1600.00	16000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	treatment_plans	t	manual	2026-06-15 11:10:28.157481+00	2026-06-15 11:10:28.157481+00	1400.00	14000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	test1	f	manual	2026-06-16 20:01:38.70609+00	2026-06-16 20:01:45.348943+00	252.00	230.00	f
tenant_4f049da4cac745988b96821d9e0051b3	website	f	manual	2026-06-12 19:44:15.212838+00	2026-06-17 09:41:31.424122+00	1800.00	18000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	attendance	t	manual	2026-06-11 22:33:07.442218+00	2026-06-17 09:41:46.576031+00	1200.00	12000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	classes_sections	t	manual	2026-06-11 22:33:02.089447+00	2026-06-17 09:41:51.271499+00	900.00	9000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	school_management	f	plan	2026-06-10 12:52:19.587481+00	2026-06-17 09:42:18.477838+00	3500.00	35000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	store_management	t	plan	2026-06-10 21:45:16.991791+00	2026-06-12 19:25:39.449423+00	2500.00	25000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	products	t	plan	2026-06-10 21:45:16.991791+00	2026-06-12 19:25:39.449423+00	800.00	8000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	inventory	t	plan	2026-06-10 21:44:47.050432+00	2026-06-12 19:25:39.449423+00	1200.00	12000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	teachers	f	plan	2026-06-11 22:33:04.488557+00	2026-06-17 09:42:18.477838+00	1000.00	10000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_dashboard	t	plan	2026-06-17 09:42:18.477838+00	2026-06-17 09:42:18.477838+00	0.00	0.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	customers	t	plan	2026-06-10 21:44:55.89796+00	2026-06-12 19:25:39.449423+00	1000.00	10000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	suppliers	t	plan	2026-06-10 21:44:53.850162+00	2026-06-12 19:25:39.449423+00	800.00	8000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	billing	t	plan	2026-06-11 23:52:01.79975+00	2026-06-12 19:25:39.449423+00	1500.00	15000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_branches	t	plan	2026-06-17 09:42:18.477838+00	2026-06-17 09:42:18.477838+00	800.00	8000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	reports	t	plan	2026-06-11 23:52:01.79975+00	2026-06-12 19:25:39.449423+00	1000.00	10000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_company_profile	t	plan	2026-06-17 09:42:18.477838+00	2026-06-17 09:42:18.477838+00	500.00	5000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_users	t	plan	2026-06-17 09:42:18.477838+00	2026-06-17 09:42:18.477838+00	1000.00	10000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_roles_permissions	t	plan	2026-06-17 09:42:18.477838+00	2026-06-17 09:42:18.477838+00	1200.00	12000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	fees	f	manual	2026-06-10 12:52:58.617646+00	2026-06-12 19:25:39.449423+00	1500.00	15000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	timetable	f	manual	2026-06-10 19:05:51.254873+00	2026-06-12 19:25:39.449423+00	900.00	9000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_files	t	plan	2026-06-17 09:42:18.477838+00	2026-06-17 09:42:18.477838+00	800.00	8000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_calendar	t	plan	2026-06-17 09:42:18.477838+00	2026-06-17 09:42:18.477838+00	700.00	7000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	crm	f	manual	2026-06-09 22:39:07.671601+00	2026-06-12 19:25:39.449423+00	2000.00	20000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_notifications	t	plan	2026-06-17 09:42:18.477838+00	2026-06-17 09:42:18.477838+00	700.00	7000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	exams_results	f	manual	2026-06-10 19:05:59.638158+00	2026-06-12 19:25:39.449423+00	1400.00	14000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_activity_logs	t	plan	2026-06-17 09:42:18.477838+00	2026-06-17 09:42:18.477838+00	900.00	9000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_import_export	t	plan	2026-06-17 09:42:18.477838+00	2026-06-17 09:42:18.477838+00	1000.00	10000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_custom_fields	t	plan	2026-06-17 09:42:18.477838+00	2026-06-17 09:42:18.477838+00	900.00	9000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_tasks	t	plan	2026-06-17 09:42:18.477838+00	2026-06-17 09:42:18.477838+00	900.00	9000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	hotel_management	t	plan	2026-06-17 09:42:18.477838+00	2026-06-17 09:42:18.477838+00	3500.00	35000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	room_booking	t	plan	2026-06-17 09:42:18.477838+00	2026-06-17 09:42:18.477838+00	1600.00	16000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	housekeeping	t	plan	2026-06-17 09:42:18.477838+00	2026-06-17 09:42:18.477838+00	1000.00	10000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	checkin_checkout	t	plan	2026-06-17 09:42:18.477838+00	2026-06-17 09:42:18.477838+00	1200.00	12000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	store_management	t	manual	2026-06-09 22:00:06.74443+00	2026-06-15 11:00:04.971701+00	2500.00	25000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	store_management	t	manual	2026-06-15 11:02:49.368133+00	2026-06-15 11:02:49.368133+00	2500.00	25000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	queue_management	t	manual	2026-06-15 11:10:18.369552+00	2026-06-15 11:10:18.369552+00	900.00	9000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	products	f	manual	2026-06-09 23:03:12.844352+00	2026-06-15 20:35:14.005084+00	803	8000	t
tenant_4f049da4cac745988b96821d9e0051b3	inventory	t	manual	2026-06-09 22:00:26.085447+00	2026-06-16 13:34:07.858265+00	1200.00	12000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	sales_orders	t	manual	2026-06-09 23:03:12.844352+00	2026-06-15 09:56:03.533256+00	1500.00	15000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	sales_orders	t	plan	2026-06-10 21:44:51.933414+00	2026-06-12 19:25:39.449423+00	1500.00	15000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	test	f	manual	2026-06-16 20:01:47.398617+00	2026-06-16 20:01:48.144855+00	10.00	25.00	f
tenant_4f049da4cac745988b96821d9e0051b3	customers	f	plan	2026-06-09 23:23:33.752558+00	2026-06-17 09:42:18.477838+00	1000.00	10000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	menu_items	f	manual	2026-06-10 22:27:13.510477+00	2026-06-12 19:25:39.449423+00	900.00	9000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	parents_portal	f	manual	2026-06-11 18:58:25.771583+00	2026-06-12 19:25:39.449423+00	1200.00	12000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	restaurant_management	f	manual	2026-06-11 18:58:27.907643+00	2026-06-12 19:25:39.449423+00	3000.00	30000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	library	f	manual	2026-06-11 18:58:23.568219+00	2026-06-12 19:25:39.449423+00	800.00	8000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	suppliers	f	plan	2026-06-09 23:23:33.752558+00	2026-06-17 09:42:18.477838+00	800.00	8000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	billing	f	plan	2026-06-10 12:52:01.846218+00	2026-06-17 09:42:18.477838+00	1500.00	15000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	reports	f	plan	2026-06-09 23:23:33.752558+00	2026-06-17 09:42:18.477838+00	100	10000	t
\.


--
-- Data for Name: backup_tenant_modules_switch_20260617_110635; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.backup_tenant_modules_switch_20260617_110635 (tenant_id, module_id, enabled, source, created_at, updated_at, monthly_price_snapshot, yearly_price_snapshot, price_override) FROM stdin;
tenant_4f049da4cac745988b96821d9e0051b3	students	f	manual	2026-06-11 08:43:04.421317+00	2026-06-15 10:45:30.685062+00	1000.00	10000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	test1	f	manual	2026-06-16 20:01:38.70609+00	2026-06-16 20:01:45.348943+00	252.00	230.00	f
tenant_4f049da4cac745988b96821d9e0051b3	website	f	manual	2026-06-12 19:44:15.212838+00	2026-06-17 09:41:31.424122+00	1800.00	18000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	school_management	f	plan	2026-06-10 12:52:19.587481+00	2026-06-17 09:42:18.477838+00	3500.00	35000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	teachers	f	plan	2026-06-11 22:33:04.488557+00	2026-06-17 09:42:18.477838+00	1000.00	10000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_dashboard	t	plan	2026-06-17 09:42:18.477838+00	2026-06-17 09:42:18.477838+00	0.00	0.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_branches	t	plan	2026-06-17 09:42:18.477838+00	2026-06-17 09:42:18.477838+00	800.00	8000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_company_profile	t	plan	2026-06-17 09:42:18.477838+00	2026-06-17 09:42:18.477838+00	500.00	5000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_users	t	plan	2026-06-17 09:42:18.477838+00	2026-06-17 09:42:18.477838+00	1000.00	10000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_roles_permissions	t	plan	2026-06-17 09:42:18.477838+00	2026-06-17 09:42:18.477838+00	1200.00	12000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	fees	f	manual	2026-06-10 12:52:58.617646+00	2026-06-12 19:25:39.449423+00	1500.00	15000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	timetable	f	manual	2026-06-10 19:05:51.254873+00	2026-06-12 19:25:39.449423+00	900.00	9000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_files	t	plan	2026-06-17 09:42:18.477838+00	2026-06-17 09:42:18.477838+00	800.00	8000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_calendar	t	plan	2026-06-17 09:42:18.477838+00	2026-06-17 09:42:18.477838+00	700.00	7000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	crm	f	manual	2026-06-09 22:39:07.671601+00	2026-06-12 19:25:39.449423+00	2000.00	20000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_notifications	t	plan	2026-06-17 09:42:18.477838+00	2026-06-17 09:42:18.477838+00	700.00	7000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	exams_results	f	manual	2026-06-10 19:05:59.638158+00	2026-06-12 19:25:39.449423+00	1400.00	14000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_activity_logs	t	plan	2026-06-17 09:42:18.477838+00	2026-06-17 09:42:18.477838+00	900.00	9000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_import_export	t	plan	2026-06-17 09:42:18.477838+00	2026-06-17 09:42:18.477838+00	1000.00	10000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_custom_fields	t	plan	2026-06-17 09:42:18.477838+00	2026-06-17 09:42:18.477838+00	900.00	9000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_tasks	t	plan	2026-06-17 09:42:18.477838+00	2026-06-17 09:42:18.477838+00	900.00	9000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	hotel_management	t	plan	2026-06-17 09:42:18.477838+00	2026-06-17 09:42:18.477838+00	3500.00	35000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	room_booking	t	plan	2026-06-17 09:42:18.477838+00	2026-06-17 09:42:18.477838+00	1600.00	16000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	housekeeping	t	plan	2026-06-17 09:42:18.477838+00	2026-06-17 09:42:18.477838+00	1000.00	10000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	checkin_checkout	t	plan	2026-06-17 09:42:18.477838+00	2026-06-17 09:42:18.477838+00	1200.00	12000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	treatment_plans	f	manual	2026-06-15 11:10:28.157481+00	2026-06-17 10:57:59.024081+00	1400.00	14000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	attendance	f	manual	2026-06-11 22:33:07.442218+00	2026-06-17 10:57:59.024081+00	1200.00	12000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	patient_portal	f	manual	2026-06-15 11:10:09.544706+00	2026-06-17 10:57:59.024081+00	1600.00	16000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	travel_bookings	f	manual	2026-06-15 09:23:20.584551+00	2026-06-17 10:57:59.024081+00	1400.00	14000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	classes_sections	f	manual	2026-06-11 22:33:02.089447+00	2026-06-17 10:57:59.024081+00	900.00	9000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	store_management	f	plan	2026-06-10 21:45:16.991791+00	2026-06-17 10:57:59.024081+00	2500.00	25000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	products	f	plan	2026-06-10 21:45:16.991791+00	2026-06-17 10:57:59.024081+00	800.00	8000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	inventory	f	plan	2026-06-10 21:44:47.050432+00	2026-06-17 10:57:59.024081+00	1200.00	12000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	customers	f	plan	2026-06-10 21:44:55.89796+00	2026-06-17 10:57:59.024081+00	1000.00	10000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	suppliers	f	plan	2026-06-10 21:44:53.850162+00	2026-06-17 10:57:59.024081+00	800.00	8000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	billing	f	plan	2026-06-11 23:52:01.79975+00	2026-06-17 10:57:59.024081+00	1500.00	15000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	reports	f	plan	2026-06-11 23:52:01.79975+00	2026-06-17 10:57:59.024081+00	1000.00	10000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	core_dashboard	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	0.00	0.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	core_branches	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	800.00	8000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	core_company_profile	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	500.00	5000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	products	f	manual	2026-06-09 23:03:12.844352+00	2026-06-15 20:35:14.005084+00	803	8000	t
tenant_4f049da4cac745988b96821d9e0051b3	test	f	manual	2026-06-16 20:01:47.398617+00	2026-06-16 20:01:48.144855+00	10.00	25.00	f
tenant_4f049da4cac745988b96821d9e0051b3	customers	f	plan	2026-06-09 23:23:33.752558+00	2026-06-17 09:42:18.477838+00	1000.00	10000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	core_users	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	1000.00	10000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	menu_items	f	manual	2026-06-10 22:27:13.510477+00	2026-06-12 19:25:39.449423+00	900.00	9000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	parents_portal	f	manual	2026-06-11 18:58:25.771583+00	2026-06-12 19:25:39.449423+00	1200.00	12000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	restaurant_management	f	manual	2026-06-11 18:58:27.907643+00	2026-06-12 19:25:39.449423+00	3000.00	30000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	library	f	manual	2026-06-11 18:58:23.568219+00	2026-06-12 19:25:39.449423+00	800.00	8000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	suppliers	f	plan	2026-06-09 23:23:33.752558+00	2026-06-17 09:42:18.477838+00	800.00	8000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	billing	f	plan	2026-06-10 12:52:01.846218+00	2026-06-17 09:42:18.477838+00	1500.00	15000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	reports	f	plan	2026-06-09 23:23:33.752558+00	2026-06-17 09:42:18.477838+00	100	10000	t
tenant_4f049da4cac745988b96821d9e0051b3	inventory	f	manual	2026-06-09 22:00:26.085447+00	2026-06-17 10:57:59.024081+00	1200.00	12000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	core_roles_permissions	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	1200.00	12000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	queue_management	f	manual	2026-06-15 11:10:18.369552+00	2026-06-17 10:57:59.024081+00	900.00	9000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	store_management	f	manual	2026-06-09 22:00:06.74443+00	2026-06-17 10:57:59.024081+00	2500.00	25000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	sales_orders	f	manual	2026-06-09 23:03:12.844352+00	2026-06-17 10:57:59.024081+00	1500.00	15000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	sales_orders	f	plan	2026-06-10 21:44:51.933414+00	2026-06-17 10:57:59.024081+00	1500.00	15000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	core_dashboard	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	0.00	0.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	core_branches	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	800.00	8000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	core_company_profile	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	500.00	5000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	core_users	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	1000.00	10000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	core_roles_permissions	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	1200.00	12000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	core_files	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	800.00	8000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	core_calendar	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	700.00	7000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	core_notifications	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	700.00	7000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	core_activity_logs	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	900.00	9000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	core_import_export	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	1000.00	10000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	core_custom_fields	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	900.00	9000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	core_tasks	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	900.00	9000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	hotel_management	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	3500.00	35000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	room_booking	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	1600.00	16000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	housekeeping	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	1000.00	10000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	checkin_checkout	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	1200.00	12000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	core_files	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	800.00	8000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	core_calendar	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	700.00	7000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	core_notifications	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	700.00	7000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	core_activity_logs	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	900.00	9000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	core_import_export	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	1000.00	10000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	core_custom_fields	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	900.00	9000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	core_tasks	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	900.00	9000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	store_management	t	plan	2026-06-15 11:02:49.368133+00	2026-06-17 10:57:59.024081+00	2500.00	25000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	products	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	800.00	8000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	inventory	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	1200.00	12000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	sales_orders	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	1500.00	15000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	customers	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	1000.00	10000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	suppliers	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	800.00	8000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	billing	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	1500.00	15000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	reports	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	1000.00	10000.00	f
\.


--
-- Data for Name: backup_tenant_subscriptions_business_v1_20260617_072332; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.backup_tenant_subscriptions_business_v1_20260617_072332 (tenant_id, plan_id, status, billing_cycle, amount, started_at, updated_at, plan_base_amount, module_addons_amount) FROM stdin;
tenant_4f049da4cac745988b96821d9e0051b3	store_start	active	monthly	2500.00	2026-06-09 23:03:12.844352+00	2026-06-12 21:32:57.918862+00	2500.00	13100.00
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	store_start	active	monthly	12800.00	2026-06-10 21:45:16.991791+00	2026-06-12 19:25:39.453187+00	2500.00	10300.00
\.


--
-- Data for Name: backup_tenant_subscriptions_business_v2_20260617_073934; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.backup_tenant_subscriptions_business_v2_20260617_073934 (tenant_id, plan_id, status, billing_cycle, amount, started_at, updated_at, plan_base_amount, module_addons_amount) FROM stdin;
tenant_4f049da4cac745988b96821d9e0051b3	store_start	active	monthly	2500.00	2026-06-09 23:03:12.844352+00	2026-06-12 21:32:57.918862+00	2500.00	13100.00
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	store_start	active	monthly	12800.00	2026-06-10 21:45:16.991791+00	2026-06-12 19:25:39.453187+00	2500.00	10300.00
\.


--
-- Data for Name: backup_tenant_subscriptions_cleanup_20260617_105755; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.backup_tenant_subscriptions_cleanup_20260617_105755 (tenant_id, plan_id, status, billing_cycle, amount, started_at, updated_at, plan_base_amount, module_addons_amount) FROM stdin;
tenant_4f049da4cac745988b96821d9e0051b3	starter	active	yearly	161000.00	2026-06-09 23:03:12.844352+00	2026-06-17 09:42:18.509668+00	35000	126000
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	store_start	active	monthly	12800.00	2026-06-10 21:45:16.991791+00	2026-06-12 19:25:39.453187+00	2500.00	10300.00
\.


--
-- Data for Name: backup_tenant_subscriptions_switch_20260617_110635; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.backup_tenant_subscriptions_switch_20260617_110635 (tenant_id, plan_id, status, billing_cycle, amount, started_at, updated_at, plan_base_amount, module_addons_amount) FROM stdin;
tenant_4f049da4cac745988b96821d9e0051b3	starter	active	yearly	35000.00	2026-06-09 23:03:12.844352+00	2026-06-17 10:57:59.024081+00	35000.00	0
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	starter	active	monthly	3500.00	2026-06-10 21:45:16.991791+00	2026-06-17 10:57:59.024081+00	3500.00	0
tenant_7d8ca36774ec47eb9d27fe5efbdea672	starter	active	monthly	5500.00	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	5500.00	0
\.


--
-- Data for Name: business_plan_matrix; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.business_plan_matrix (business_type, plan_id, monthly_price, yearly_price, status, sort_order, created_at, updated_at) FROM stdin;
clinic	starter	5500.00	55000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-16 23:10:39.728006+00
accounting_tax	starter	2000.00	20000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-21 21:45:51.436695+00
agriculture	starter	2000.00	20000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-29 07:48:23.19777+00
auto_workshop	starter	2000.00	20000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
cleaning_services	starter	1500.00	15000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
coaching_center	starter	5500.00	55000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
construction	starter	2500.00	25000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
dental	starter	2500.00	25000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
ecommerce	starter	3500.00	35000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
event_management	starter	2000.00	20000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
gym_fitness	starter	1500.00	15000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
home_services	starter	1500.00	15000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
hospital	starter	6500.00	65000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
hotel_hospitality	starter	3500.00	35000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
hr_payroll	starter	2000.00	20000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
law_firm	starter	2000.00	20000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
logistics_transport	starter	2500.00	25000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
manufacturing	starter	3500.00	35000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
media_marketing	starter	1500.00	15000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
ngo_nonprofit	starter	2000.00	20000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
other_business	starter	1500.00	15000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
pharmacy	starter	2500.00	25000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
professional_services	starter	2000.00	20000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
real_estate	starter	3500.00	35000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
recruitment_agency	starter	2000.00	20000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
restaurant_cafe	starter	5000.00	50000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
retail_shop	starter	5500.00	55000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
salon_spa	starter	3000.00	30000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
school_college	starter	7000.00	70000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
security_services	starter	1500.00	15000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
software_it	starter	2500.00	25000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
super_mart	starter	6000.00	60000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
telecom_communication	starter	2000.00	20000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
travel_tourism	starter	2500.00	25000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
wholesale_distribution	starter	6000.00	60000.00	active	10	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
accounting_tax	pro	4000.00	40000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
agriculture	pro	4000.00	40000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
auto_workshop	pro	4000.00	40000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
cleaning_services	pro	3500.00	35000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
clinic	pro	10500.00	105000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
coaching_center	pro	11000.00	110000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
construction	pro	4500.00	45000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
dental	pro	5000.00	50000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
ecommerce	pro	6500.00	65000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
event_management	pro	4000.00	40000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
gym_fitness	pro	3500.00	35000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
home_services	pro	3500.00	35000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
hospital	pro	12500.00	125000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
hotel_hospitality	pro	6500.00	65000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
hr_payroll	pro	4000.00	40000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
law_firm	pro	4000.00	40000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
logistics_transport	pro	4500.00	45000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
manufacturing	pro	7000.00	70000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
media_marketing	pro	3500.00	35000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
ngo_nonprofit	pro	4000.00	40000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
other_business	pro	3500.00	35000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
pharmacy	pro	4500.00	45000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
professional_services	pro	4000.00	40000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
real_estate	pro	6500.00	65000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
recruitment_agency	pro	4000.00	40000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
restaurant_cafe	pro	10000.00	100000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
retail_shop	pro	10500.00	105000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
salon_spa	pro	6000.00	60000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
school_college	pro	13500.00	135000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
security_services	pro	3500.00	35000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
software_it	pro	4500.00	45000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
super_mart	pro	12000.00	120000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
telecom_communication	pro	4000.00	40000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
travel_tourism	pro	5000.00	50000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
wholesale_distribution	pro	12000.00	120000.00	active	20	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
accounting_tax	enterprise	7500.00	75000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
agriculture	enterprise	7500.00	75000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
auto_workshop	enterprise	7500.00	75000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
cleaning_services	enterprise	7000.00	70000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
clinic	enterprise	19000.00	190000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	20000.00	200000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
construction	enterprise	8000.00	80000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
dental	enterprise	9000.00	90000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
ecommerce	enterprise	11500.00	115000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
event_management	enterprise	7500.00	75000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
gym_fitness	enterprise	7000.00	70000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
home_services	enterprise	7000.00	70000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
hospital	enterprise	22500.00	225000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
hotel_hospitality	enterprise	11500.00	115000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
hr_payroll	enterprise	7500.00	75000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
law_firm	enterprise	7500.00	75000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
logistics_transport	enterprise	8000.00	80000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
manufacturing	enterprise	12000.00	120000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
media_marketing	enterprise	7000.00	70000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
ngo_nonprofit	enterprise	7000.00	70000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
other_business	enterprise	7000.00	70000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
pharmacy	enterprise	8000.00	80000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
professional_services	enterprise	7500.00	75000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
real_estate	enterprise	11000.00	110000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
recruitment_agency	enterprise	7500.00	75000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
restaurant_cafe	enterprise	18000.00	180000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
retail_shop	enterprise	19000.00	190000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
salon_spa	enterprise	11000.00	110000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
school_college	enterprise	24000.00	240000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
security_services	enterprise	7000.00	70000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
software_it	enterprise	8000.00	80000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
super_mart	enterprise	21000.00	210000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
telecom_communication	enterprise	7500.00	75000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
travel_tourism	enterprise	8500.00	85000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
wholesale_distribution	enterprise	21000.00	210000.00	active	30	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
accounting_tax	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
agriculture	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
auto_workshop	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
cleaning_services	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
clinic	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
coaching_center	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
construction	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
dental	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
ecommerce	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
event_management	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
gym_fitness	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
home_services	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
hospital	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
hotel_hospitality	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
hr_payroll	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
law_firm	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
logistics_transport	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
manufacturing	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
media_marketing	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
ngo_nonprofit	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
other_business	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
pharmacy	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
professional_services	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
real_estate	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
recruitment_agency	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
restaurant_cafe	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
retail_shop	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
salon_spa	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
school_college	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
security_services	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
software_it	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
super_mart	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
telecom_communication	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
travel_tourism	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
wholesale_distribution	custom	0.00	0.00	active	40	2026-06-16 22:26:13.015057+00	2026-06-16 22:26:13.015057+00
\.


--
-- Data for Name: business_plan_modules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.business_plan_modules (business_type, plan_id, module_id, created_at) FROM stdin;
clinic	starter	clinic_management	2026-06-16 23:10:39.728006+00
clinic	starter	patients	2026-06-16 23:10:39.728006+00
clinic	starter	appointments	2026-06-16 23:10:39.728006+00
clinic	starter	doctors	2026-06-16 23:10:39.728006+00
clinic	starter	prescriptions	2026-06-16 23:10:39.728006+00
clinic	starter	clinic_billing	2026-06-16 23:10:39.728006+00
clinic	starter	medical_records	2026-06-16 23:10:39.728006+00
clinic	starter	core_dashboard	2026-06-16 23:10:39.728006+00
clinic	starter	core_company_profile	2026-06-16 23:10:39.728006+00
clinic	starter	core_branches	2026-06-16 23:10:39.728006+00
clinic	starter	core_users	2026-06-16 23:10:39.728006+00
clinic	starter	core_roles_permissions	2026-06-16 23:10:39.728006+00
clinic	starter	core_files	2026-06-16 23:10:39.728006+00
clinic	starter	core_calendar	2026-06-16 23:10:39.728006+00
clinic	starter	core_notifications	2026-06-16 23:10:39.728006+00
clinic	starter	core_activity_logs	2026-06-16 23:10:39.728006+00
clinic	starter	core_import_export	2026-06-16 23:10:39.728006+00
clinic	starter	core_custom_fields	2026-06-16 23:10:39.728006+00
clinic	starter	core_tasks	2026-06-16 23:10:39.728006+00
accounting_tax	starter	core_dashboard	2026-06-21 21:45:51.436695+00
accounting_tax	starter	core_company_profile	2026-06-21 21:45:51.436695+00
accounting_tax	starter	core_users	2026-06-21 21:45:51.436695+00
accounting_tax	starter	core_roles_permissions	2026-06-21 21:45:51.436695+00
accounting_tax	starter	core_files	2026-06-21 21:45:51.436695+00
accounting_tax	starter	core_notifications	2026-06-21 21:45:51.436695+00
accounting_tax	starter	core_import_export	2026-06-21 21:45:51.436695+00
accounting_tax	starter	core_custom_fields	2026-06-21 21:45:51.436695+00
accounting_tax	starter	core_tasks	2026-06-21 21:45:51.436695+00
accounting_tax	starter	accounting_tax_management	2026-06-21 21:45:51.436695+00
accounting_tax	starter	accounting_clients	2026-06-21 21:45:51.436695+00
accounting_tax	starter	accounting_bookkeeping	2026-06-21 21:45:51.436695+00
accounting_tax	starter	core_calendar	2026-06-21 21:45:51.436695+00
accounting_tax	starter	core_branches	2026-06-21 21:45:51.436695+00
accounting_tax	starter	core_activity_logs	2026-06-21 21:45:51.436695+00
agriculture	starter	core_dashboard	2026-06-29 07:48:23.19777+00
agriculture	starter	core_company_profile	2026-06-29 07:48:23.19777+00
agriculture	starter	core_branches	2026-06-29 07:48:23.19777+00
agriculture	starter	core_users	2026-06-29 07:48:23.19777+00
agriculture	starter	core_roles_permissions	2026-06-29 07:48:23.19777+00
agriculture	starter	core_files	2026-06-29 07:48:23.19777+00
agriculture	starter	core_calendar	2026-06-29 07:48:23.19777+00
agriculture	starter	core_notifications	2026-06-29 07:48:23.19777+00
agriculture	starter	core_activity_logs	2026-06-29 07:48:23.19777+00
agriculture	starter	core_import_export	2026-06-29 07:48:23.19777+00
agriculture	starter	core_custom_fields	2026-06-29 07:48:23.19777+00
agriculture	starter	core_tasks	2026-06-29 07:48:23.19777+00
agriculture	starter	agriculture_management	2026-06-29 07:48:23.19777+00
agriculture	starter	agriculture_fields	2026-06-29 07:48:23.19777+00
agriculture	starter	agriculture_crops	2026-06-29 07:48:23.19777+00
auto_workshop	starter	core_dashboard	2026-06-16 22:26:13.015057+00
hospital	starter	core_dashboard	2026-06-16 22:26:13.015057+00
dental	starter	core_dashboard	2026-06-16 22:26:13.015057+00
pharmacy	starter	core_dashboard	2026-06-16 22:26:13.015057+00
school_college	starter	core_dashboard	2026-06-16 22:26:13.015057+00
coaching_center	starter	core_dashboard	2026-06-16 22:26:13.015057+00
ecommerce	starter	core_dashboard	2026-06-16 22:26:13.015057+00
retail_shop	starter	core_dashboard	2026-06-16 22:26:13.015057+00
super_mart	starter	core_dashboard	2026-06-16 22:26:13.015057+00
wholesale_distribution	starter	core_dashboard	2026-06-16 22:26:13.015057+00
restaurant_cafe	starter	core_dashboard	2026-06-16 22:26:13.015057+00
hotel_hospitality	starter	core_dashboard	2026-06-16 22:26:13.015057+00
travel_tourism	starter	core_dashboard	2026-06-16 22:26:13.015057+00
salon_spa	starter	core_dashboard	2026-06-16 22:26:13.015057+00
gym_fitness	starter	core_dashboard	2026-06-16 22:26:13.015057+00
real_estate	starter	core_dashboard	2026-06-16 22:26:13.015057+00
construction	starter	core_dashboard	2026-06-16 22:26:13.015057+00
manufacturing	starter	core_dashboard	2026-06-16 22:26:13.015057+00
logistics_transport	starter	core_dashboard	2026-06-16 22:26:13.015057+00
event_management	starter	core_dashboard	2026-06-16 22:26:13.015057+00
hr_payroll	starter	core_dashboard	2026-06-16 22:26:13.015057+00
recruitment_agency	starter	core_dashboard	2026-06-16 22:26:13.015057+00
law_firm	starter	core_dashboard	2026-06-16 22:26:13.015057+00
ngo_nonprofit	starter	core_dashboard	2026-06-16 22:26:13.015057+00
professional_services	starter	core_dashboard	2026-06-16 22:26:13.015057+00
software_it	starter	core_dashboard	2026-06-16 22:26:13.015057+00
home_services	starter	core_dashboard	2026-06-16 22:26:13.015057+00
security_services	starter	core_dashboard	2026-06-16 22:26:13.015057+00
cleaning_services	starter	core_dashboard	2026-06-16 22:26:13.015057+00
media_marketing	starter	core_dashboard	2026-06-16 22:26:13.015057+00
telecom_communication	starter	core_dashboard	2026-06-16 22:26:13.015057+00
other_business	starter	core_dashboard	2026-06-16 22:26:13.015057+00
accounting_tax	pro	core_dashboard	2026-06-16 22:26:13.015057+00
agriculture	pro	core_dashboard	2026-06-16 22:26:13.015057+00
auto_workshop	pro	core_dashboard	2026-06-16 22:26:13.015057+00
clinic	pro	core_dashboard	2026-06-16 22:26:13.015057+00
hospital	pro	core_dashboard	2026-06-16 22:26:13.015057+00
dental	pro	core_dashboard	2026-06-16 22:26:13.015057+00
pharmacy	pro	core_dashboard	2026-06-16 22:26:13.015057+00
school_college	pro	core_dashboard	2026-06-16 22:26:13.015057+00
coaching_center	pro	core_dashboard	2026-06-16 22:26:13.015057+00
ecommerce	pro	core_dashboard	2026-06-16 22:26:13.015057+00
retail_shop	pro	core_dashboard	2026-06-16 22:26:13.015057+00
super_mart	pro	core_dashboard	2026-06-16 22:26:13.015057+00
wholesale_distribution	pro	core_dashboard	2026-06-16 22:26:13.015057+00
restaurant_cafe	pro	core_dashboard	2026-06-16 22:26:13.015057+00
hotel_hospitality	pro	core_dashboard	2026-06-16 22:26:13.015057+00
travel_tourism	pro	core_dashboard	2026-06-16 22:26:13.015057+00
salon_spa	pro	core_dashboard	2026-06-16 22:26:13.015057+00
gym_fitness	pro	core_dashboard	2026-06-16 22:26:13.015057+00
real_estate	pro	core_dashboard	2026-06-16 22:26:13.015057+00
construction	pro	core_dashboard	2026-06-16 22:26:13.015057+00
manufacturing	pro	core_dashboard	2026-06-16 22:26:13.015057+00
logistics_transport	pro	core_dashboard	2026-06-16 22:26:13.015057+00
event_management	pro	core_dashboard	2026-06-16 22:26:13.015057+00
hr_payroll	pro	core_dashboard	2026-06-16 22:26:13.015057+00
recruitment_agency	pro	core_dashboard	2026-06-16 22:26:13.015057+00
law_firm	pro	core_dashboard	2026-06-16 22:26:13.015057+00
ngo_nonprofit	pro	core_dashboard	2026-06-16 22:26:13.015057+00
professional_services	pro	core_dashboard	2026-06-16 22:26:13.015057+00
software_it	pro	core_dashboard	2026-06-16 22:26:13.015057+00
home_services	pro	core_dashboard	2026-06-16 22:26:13.015057+00
security_services	pro	core_dashboard	2026-06-16 22:26:13.015057+00
cleaning_services	pro	core_dashboard	2026-06-16 22:26:13.015057+00
media_marketing	pro	core_dashboard	2026-06-16 22:26:13.015057+00
telecom_communication	pro	core_dashboard	2026-06-16 22:26:13.015057+00
other_business	pro	core_dashboard	2026-06-16 22:26:13.015057+00
accounting_tax	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
agriculture	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
auto_workshop	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
clinic	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
hospital	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
dental	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
pharmacy	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
school_college	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
ecommerce	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
retail_shop	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
super_mart	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
wholesale_distribution	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
restaurant_cafe	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
hotel_hospitality	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
travel_tourism	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
salon_spa	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
gym_fitness	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
real_estate	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
construction	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
manufacturing	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
logistics_transport	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
event_management	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
hr_payroll	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
recruitment_agency	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
law_firm	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
ngo_nonprofit	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
professional_services	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
software_it	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
home_services	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
security_services	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
cleaning_services	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
media_marketing	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
telecom_communication	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
other_business	enterprise	core_dashboard	2026-06-16 22:26:13.015057+00
auto_workshop	starter	core_branches	2026-06-16 22:26:13.015057+00
hospital	starter	core_branches	2026-06-16 22:26:13.015057+00
dental	starter	core_branches	2026-06-16 22:26:13.015057+00
pharmacy	starter	core_branches	2026-06-16 22:26:13.015057+00
school_college	starter	core_branches	2026-06-16 22:26:13.015057+00
coaching_center	starter	core_branches	2026-06-16 22:26:13.015057+00
ecommerce	starter	core_branches	2026-06-16 22:26:13.015057+00
retail_shop	starter	core_branches	2026-06-16 22:26:13.015057+00
super_mart	starter	core_branches	2026-06-16 22:26:13.015057+00
wholesale_distribution	starter	core_branches	2026-06-16 22:26:13.015057+00
restaurant_cafe	starter	core_branches	2026-06-16 22:26:13.015057+00
hotel_hospitality	starter	core_branches	2026-06-16 22:26:13.015057+00
travel_tourism	starter	core_branches	2026-06-16 22:26:13.015057+00
salon_spa	starter	core_branches	2026-06-16 22:26:13.015057+00
gym_fitness	starter	core_branches	2026-06-16 22:26:13.015057+00
real_estate	starter	core_branches	2026-06-16 22:26:13.015057+00
construction	starter	core_branches	2026-06-16 22:26:13.015057+00
manufacturing	starter	core_branches	2026-06-16 22:26:13.015057+00
logistics_transport	starter	core_branches	2026-06-16 22:26:13.015057+00
event_management	starter	core_branches	2026-06-16 22:26:13.015057+00
hr_payroll	starter	core_branches	2026-06-16 22:26:13.015057+00
recruitment_agency	starter	core_branches	2026-06-16 22:26:13.015057+00
law_firm	starter	core_branches	2026-06-16 22:26:13.015057+00
ngo_nonprofit	starter	core_branches	2026-06-16 22:26:13.015057+00
professional_services	starter	core_branches	2026-06-16 22:26:13.015057+00
software_it	starter	core_branches	2026-06-16 22:26:13.015057+00
home_services	starter	core_branches	2026-06-16 22:26:13.015057+00
security_services	starter	core_branches	2026-06-16 22:26:13.015057+00
cleaning_services	starter	core_branches	2026-06-16 22:26:13.015057+00
media_marketing	starter	core_branches	2026-06-16 22:26:13.015057+00
telecom_communication	starter	core_branches	2026-06-16 22:26:13.015057+00
other_business	starter	core_branches	2026-06-16 22:26:13.015057+00
accounting_tax	pro	core_branches	2026-06-16 22:26:13.015057+00
agriculture	pro	core_branches	2026-06-16 22:26:13.015057+00
auto_workshop	pro	core_branches	2026-06-16 22:26:13.015057+00
clinic	pro	core_branches	2026-06-16 22:26:13.015057+00
hospital	pro	core_branches	2026-06-16 22:26:13.015057+00
dental	pro	core_branches	2026-06-16 22:26:13.015057+00
pharmacy	pro	core_branches	2026-06-16 22:26:13.015057+00
school_college	pro	core_branches	2026-06-16 22:26:13.015057+00
coaching_center	pro	core_branches	2026-06-16 22:26:13.015057+00
ecommerce	pro	core_branches	2026-06-16 22:26:13.015057+00
retail_shop	pro	core_branches	2026-06-16 22:26:13.015057+00
super_mart	pro	core_branches	2026-06-16 22:26:13.015057+00
wholesale_distribution	pro	core_branches	2026-06-16 22:26:13.015057+00
restaurant_cafe	pro	core_branches	2026-06-16 22:26:13.015057+00
hotel_hospitality	pro	core_branches	2026-06-16 22:26:13.015057+00
travel_tourism	pro	core_branches	2026-06-16 22:26:13.015057+00
salon_spa	pro	core_branches	2026-06-16 22:26:13.015057+00
gym_fitness	pro	core_branches	2026-06-16 22:26:13.015057+00
real_estate	pro	core_branches	2026-06-16 22:26:13.015057+00
construction	pro	core_branches	2026-06-16 22:26:13.015057+00
manufacturing	pro	core_branches	2026-06-16 22:26:13.015057+00
logistics_transport	pro	core_branches	2026-06-16 22:26:13.015057+00
event_management	pro	core_branches	2026-06-16 22:26:13.015057+00
hr_payroll	pro	core_branches	2026-06-16 22:26:13.015057+00
recruitment_agency	pro	core_branches	2026-06-16 22:26:13.015057+00
law_firm	pro	core_branches	2026-06-16 22:26:13.015057+00
ngo_nonprofit	pro	core_branches	2026-06-16 22:26:13.015057+00
professional_services	pro	core_branches	2026-06-16 22:26:13.015057+00
software_it	pro	core_branches	2026-06-16 22:26:13.015057+00
home_services	pro	core_branches	2026-06-16 22:26:13.015057+00
security_services	pro	core_branches	2026-06-16 22:26:13.015057+00
cleaning_services	pro	core_branches	2026-06-16 22:26:13.015057+00
media_marketing	pro	core_branches	2026-06-16 22:26:13.015057+00
telecom_communication	pro	core_branches	2026-06-16 22:26:13.015057+00
other_business	pro	core_branches	2026-06-16 22:26:13.015057+00
accounting_tax	enterprise	core_branches	2026-06-16 22:26:13.015057+00
agriculture	enterprise	core_branches	2026-06-16 22:26:13.015057+00
auto_workshop	enterprise	core_branches	2026-06-16 22:26:13.015057+00
clinic	enterprise	core_branches	2026-06-16 22:26:13.015057+00
hospital	enterprise	core_branches	2026-06-16 22:26:13.015057+00
dental	enterprise	core_branches	2026-06-16 22:26:13.015057+00
pharmacy	enterprise	core_branches	2026-06-16 22:26:13.015057+00
school_college	enterprise	core_branches	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	core_branches	2026-06-16 22:26:13.015057+00
ecommerce	enterprise	core_branches	2026-06-16 22:26:13.015057+00
retail_shop	enterprise	core_branches	2026-06-16 22:26:13.015057+00
super_mart	enterprise	core_branches	2026-06-16 22:26:13.015057+00
wholesale_distribution	enterprise	core_branches	2026-06-16 22:26:13.015057+00
restaurant_cafe	enterprise	core_branches	2026-06-16 22:26:13.015057+00
hotel_hospitality	enterprise	core_branches	2026-06-16 22:26:13.015057+00
travel_tourism	enterprise	core_branches	2026-06-16 22:26:13.015057+00
salon_spa	enterprise	core_branches	2026-06-16 22:26:13.015057+00
gym_fitness	enterprise	core_branches	2026-06-16 22:26:13.015057+00
real_estate	enterprise	core_branches	2026-06-16 22:26:13.015057+00
construction	enterprise	core_branches	2026-06-16 22:26:13.015057+00
manufacturing	enterprise	core_branches	2026-06-16 22:26:13.015057+00
logistics_transport	enterprise	core_branches	2026-06-16 22:26:13.015057+00
event_management	enterprise	core_branches	2026-06-16 22:26:13.015057+00
hr_payroll	enterprise	core_branches	2026-06-16 22:26:13.015057+00
recruitment_agency	enterprise	core_branches	2026-06-16 22:26:13.015057+00
law_firm	enterprise	core_branches	2026-06-16 22:26:13.015057+00
ngo_nonprofit	enterprise	core_branches	2026-06-16 22:26:13.015057+00
professional_services	enterprise	core_branches	2026-06-16 22:26:13.015057+00
software_it	enterprise	core_branches	2026-06-16 22:26:13.015057+00
home_services	enterprise	core_branches	2026-06-16 22:26:13.015057+00
security_services	enterprise	core_branches	2026-06-16 22:26:13.015057+00
cleaning_services	enterprise	core_branches	2026-06-16 22:26:13.015057+00
media_marketing	enterprise	core_branches	2026-06-16 22:26:13.015057+00
telecom_communication	enterprise	core_branches	2026-06-16 22:26:13.015057+00
other_business	enterprise	core_branches	2026-06-16 22:26:13.015057+00
auto_workshop	starter	core_company_profile	2026-06-16 22:26:13.015057+00
hospital	starter	core_company_profile	2026-06-16 22:26:13.015057+00
dental	starter	core_company_profile	2026-06-16 22:26:13.015057+00
pharmacy	starter	core_company_profile	2026-06-16 22:26:13.015057+00
school_college	starter	core_company_profile	2026-06-16 22:26:13.015057+00
coaching_center	starter	core_company_profile	2026-06-16 22:26:13.015057+00
ecommerce	starter	core_company_profile	2026-06-16 22:26:13.015057+00
retail_shop	starter	core_company_profile	2026-06-16 22:26:13.015057+00
super_mart	starter	core_company_profile	2026-06-16 22:26:13.015057+00
wholesale_distribution	starter	core_company_profile	2026-06-16 22:26:13.015057+00
restaurant_cafe	starter	core_company_profile	2026-06-16 22:26:13.015057+00
hotel_hospitality	starter	core_company_profile	2026-06-16 22:26:13.015057+00
travel_tourism	starter	core_company_profile	2026-06-16 22:26:13.015057+00
salon_spa	starter	core_company_profile	2026-06-16 22:26:13.015057+00
gym_fitness	starter	core_company_profile	2026-06-16 22:26:13.015057+00
real_estate	starter	core_company_profile	2026-06-16 22:26:13.015057+00
construction	starter	core_company_profile	2026-06-16 22:26:13.015057+00
manufacturing	starter	core_company_profile	2026-06-16 22:26:13.015057+00
logistics_transport	starter	core_company_profile	2026-06-16 22:26:13.015057+00
event_management	starter	core_company_profile	2026-06-16 22:26:13.015057+00
hr_payroll	starter	core_company_profile	2026-06-16 22:26:13.015057+00
recruitment_agency	starter	core_company_profile	2026-06-16 22:26:13.015057+00
law_firm	starter	core_company_profile	2026-06-16 22:26:13.015057+00
ngo_nonprofit	starter	core_company_profile	2026-06-16 22:26:13.015057+00
professional_services	starter	core_company_profile	2026-06-16 22:26:13.015057+00
law_firm	starter	core_users	2026-06-16 22:26:13.015057+00
software_it	starter	core_company_profile	2026-06-16 22:26:13.015057+00
home_services	starter	core_company_profile	2026-06-16 22:26:13.015057+00
security_services	starter	core_company_profile	2026-06-16 22:26:13.015057+00
cleaning_services	starter	core_company_profile	2026-06-16 22:26:13.015057+00
media_marketing	starter	core_company_profile	2026-06-16 22:26:13.015057+00
telecom_communication	starter	core_company_profile	2026-06-16 22:26:13.015057+00
other_business	starter	core_company_profile	2026-06-16 22:26:13.015057+00
accounting_tax	pro	core_company_profile	2026-06-16 22:26:13.015057+00
agriculture	pro	core_company_profile	2026-06-16 22:26:13.015057+00
auto_workshop	pro	core_company_profile	2026-06-16 22:26:13.015057+00
clinic	pro	core_company_profile	2026-06-16 22:26:13.015057+00
hospital	pro	core_company_profile	2026-06-16 22:26:13.015057+00
dental	pro	core_company_profile	2026-06-16 22:26:13.015057+00
pharmacy	pro	core_company_profile	2026-06-16 22:26:13.015057+00
school_college	pro	core_company_profile	2026-06-16 22:26:13.015057+00
coaching_center	pro	core_company_profile	2026-06-16 22:26:13.015057+00
ecommerce	pro	core_company_profile	2026-06-16 22:26:13.015057+00
retail_shop	pro	core_company_profile	2026-06-16 22:26:13.015057+00
super_mart	pro	core_company_profile	2026-06-16 22:26:13.015057+00
wholesale_distribution	pro	core_company_profile	2026-06-16 22:26:13.015057+00
restaurant_cafe	pro	core_company_profile	2026-06-16 22:26:13.015057+00
hotel_hospitality	pro	core_company_profile	2026-06-16 22:26:13.015057+00
travel_tourism	pro	core_company_profile	2026-06-16 22:26:13.015057+00
salon_spa	pro	core_company_profile	2026-06-16 22:26:13.015057+00
gym_fitness	pro	core_company_profile	2026-06-16 22:26:13.015057+00
real_estate	pro	core_company_profile	2026-06-16 22:26:13.015057+00
construction	pro	core_company_profile	2026-06-16 22:26:13.015057+00
manufacturing	pro	core_company_profile	2026-06-16 22:26:13.015057+00
logistics_transport	pro	core_company_profile	2026-06-16 22:26:13.015057+00
event_management	pro	core_company_profile	2026-06-16 22:26:13.015057+00
hr_payroll	pro	core_company_profile	2026-06-16 22:26:13.015057+00
recruitment_agency	pro	core_company_profile	2026-06-16 22:26:13.015057+00
law_firm	pro	core_company_profile	2026-06-16 22:26:13.015057+00
ngo_nonprofit	pro	core_company_profile	2026-06-16 22:26:13.015057+00
professional_services	pro	core_company_profile	2026-06-16 22:26:13.015057+00
software_it	pro	core_company_profile	2026-06-16 22:26:13.015057+00
home_services	pro	core_company_profile	2026-06-16 22:26:13.015057+00
security_services	pro	core_company_profile	2026-06-16 22:26:13.015057+00
cleaning_services	pro	core_company_profile	2026-06-16 22:26:13.015057+00
media_marketing	pro	core_company_profile	2026-06-16 22:26:13.015057+00
telecom_communication	pro	core_company_profile	2026-06-16 22:26:13.015057+00
other_business	pro	core_company_profile	2026-06-16 22:26:13.015057+00
accounting_tax	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
agriculture	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
auto_workshop	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
clinic	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
hospital	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
dental	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
pharmacy	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
school_college	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
ecommerce	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
retail_shop	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
super_mart	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
wholesale_distribution	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
restaurant_cafe	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
hotel_hospitality	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
travel_tourism	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
salon_spa	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
gym_fitness	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
real_estate	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
construction	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
manufacturing	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
logistics_transport	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
event_management	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
hr_payroll	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
recruitment_agency	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
law_firm	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
ngo_nonprofit	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
professional_services	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
software_it	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
home_services	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
security_services	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
cleaning_services	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
media_marketing	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
telecom_communication	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
other_business	enterprise	core_company_profile	2026-06-16 22:26:13.015057+00
auto_workshop	starter	core_users	2026-06-16 22:26:13.015057+00
hospital	starter	core_users	2026-06-16 22:26:13.015057+00
dental	starter	core_users	2026-06-16 22:26:13.015057+00
pharmacy	starter	core_users	2026-06-16 22:26:13.015057+00
school_college	starter	core_users	2026-06-16 22:26:13.015057+00
coaching_center	starter	core_users	2026-06-16 22:26:13.015057+00
ecommerce	starter	core_users	2026-06-16 22:26:13.015057+00
retail_shop	starter	core_users	2026-06-16 22:26:13.015057+00
super_mart	starter	core_users	2026-06-16 22:26:13.015057+00
wholesale_distribution	starter	core_users	2026-06-16 22:26:13.015057+00
restaurant_cafe	starter	core_users	2026-06-16 22:26:13.015057+00
hotel_hospitality	starter	core_users	2026-06-16 22:26:13.015057+00
travel_tourism	starter	core_users	2026-06-16 22:26:13.015057+00
salon_spa	starter	core_users	2026-06-16 22:26:13.015057+00
gym_fitness	starter	core_users	2026-06-16 22:26:13.015057+00
real_estate	starter	core_users	2026-06-16 22:26:13.015057+00
construction	starter	core_users	2026-06-16 22:26:13.015057+00
manufacturing	starter	core_users	2026-06-16 22:26:13.015057+00
logistics_transport	starter	core_users	2026-06-16 22:26:13.015057+00
event_management	starter	core_users	2026-06-16 22:26:13.015057+00
hr_payroll	starter	core_users	2026-06-16 22:26:13.015057+00
recruitment_agency	starter	core_users	2026-06-16 22:26:13.015057+00
ngo_nonprofit	starter	core_users	2026-06-16 22:26:13.015057+00
professional_services	starter	core_users	2026-06-16 22:26:13.015057+00
software_it	starter	core_users	2026-06-16 22:26:13.015057+00
home_services	starter	core_users	2026-06-16 22:26:13.015057+00
security_services	starter	core_users	2026-06-16 22:26:13.015057+00
cleaning_services	starter	core_users	2026-06-16 22:26:13.015057+00
media_marketing	starter	core_users	2026-06-16 22:26:13.015057+00
telecom_communication	starter	core_users	2026-06-16 22:26:13.015057+00
other_business	starter	core_users	2026-06-16 22:26:13.015057+00
accounting_tax	pro	core_users	2026-06-16 22:26:13.015057+00
agriculture	pro	core_users	2026-06-16 22:26:13.015057+00
auto_workshop	pro	core_users	2026-06-16 22:26:13.015057+00
clinic	pro	core_users	2026-06-16 22:26:13.015057+00
hospital	pro	core_users	2026-06-16 22:26:13.015057+00
dental	pro	core_users	2026-06-16 22:26:13.015057+00
pharmacy	pro	core_users	2026-06-16 22:26:13.015057+00
school_college	pro	core_users	2026-06-16 22:26:13.015057+00
coaching_center	pro	core_users	2026-06-16 22:26:13.015057+00
ecommerce	pro	core_users	2026-06-16 22:26:13.015057+00
retail_shop	pro	core_users	2026-06-16 22:26:13.015057+00
super_mart	pro	core_users	2026-06-16 22:26:13.015057+00
wholesale_distribution	pro	core_users	2026-06-16 22:26:13.015057+00
restaurant_cafe	pro	core_users	2026-06-16 22:26:13.015057+00
hotel_hospitality	pro	core_users	2026-06-16 22:26:13.015057+00
travel_tourism	pro	core_users	2026-06-16 22:26:13.015057+00
salon_spa	pro	core_users	2026-06-16 22:26:13.015057+00
gym_fitness	pro	core_users	2026-06-16 22:26:13.015057+00
real_estate	pro	core_users	2026-06-16 22:26:13.015057+00
construction	pro	core_users	2026-06-16 22:26:13.015057+00
manufacturing	pro	core_users	2026-06-16 22:26:13.015057+00
logistics_transport	pro	core_users	2026-06-16 22:26:13.015057+00
event_management	pro	core_users	2026-06-16 22:26:13.015057+00
hr_payroll	pro	core_users	2026-06-16 22:26:13.015057+00
recruitment_agency	pro	core_users	2026-06-16 22:26:13.015057+00
law_firm	pro	core_users	2026-06-16 22:26:13.015057+00
ngo_nonprofit	pro	core_users	2026-06-16 22:26:13.015057+00
professional_services	pro	core_users	2026-06-16 22:26:13.015057+00
software_it	pro	core_users	2026-06-16 22:26:13.015057+00
home_services	pro	core_users	2026-06-16 22:26:13.015057+00
security_services	pro	core_users	2026-06-16 22:26:13.015057+00
cleaning_services	pro	core_users	2026-06-16 22:26:13.015057+00
media_marketing	pro	core_users	2026-06-16 22:26:13.015057+00
telecom_communication	pro	core_users	2026-06-16 22:26:13.015057+00
other_business	pro	core_users	2026-06-16 22:26:13.015057+00
accounting_tax	enterprise	core_users	2026-06-16 22:26:13.015057+00
agriculture	enterprise	core_users	2026-06-16 22:26:13.015057+00
auto_workshop	enterprise	core_users	2026-06-16 22:26:13.015057+00
clinic	enterprise	core_users	2026-06-16 22:26:13.015057+00
hospital	enterprise	core_users	2026-06-16 22:26:13.015057+00
dental	enterprise	core_users	2026-06-16 22:26:13.015057+00
pharmacy	enterprise	core_users	2026-06-16 22:26:13.015057+00
school_college	enterprise	core_users	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	core_users	2026-06-16 22:26:13.015057+00
ecommerce	enterprise	core_users	2026-06-16 22:26:13.015057+00
retail_shop	enterprise	core_users	2026-06-16 22:26:13.015057+00
super_mart	enterprise	core_users	2026-06-16 22:26:13.015057+00
wholesale_distribution	enterprise	core_users	2026-06-16 22:26:13.015057+00
restaurant_cafe	enterprise	core_users	2026-06-16 22:26:13.015057+00
hotel_hospitality	enterprise	core_users	2026-06-16 22:26:13.015057+00
travel_tourism	enterprise	core_users	2026-06-16 22:26:13.015057+00
salon_spa	enterprise	core_users	2026-06-16 22:26:13.015057+00
gym_fitness	enterprise	core_users	2026-06-16 22:26:13.015057+00
real_estate	enterprise	core_users	2026-06-16 22:26:13.015057+00
construction	enterprise	core_users	2026-06-16 22:26:13.015057+00
manufacturing	enterprise	core_users	2026-06-16 22:26:13.015057+00
logistics_transport	enterprise	core_users	2026-06-16 22:26:13.015057+00
event_management	enterprise	core_users	2026-06-16 22:26:13.015057+00
hr_payroll	enterprise	core_users	2026-06-16 22:26:13.015057+00
recruitment_agency	enterprise	core_users	2026-06-16 22:26:13.015057+00
law_firm	enterprise	core_users	2026-06-16 22:26:13.015057+00
ngo_nonprofit	enterprise	core_users	2026-06-16 22:26:13.015057+00
professional_services	enterprise	core_users	2026-06-16 22:26:13.015057+00
software_it	enterprise	core_users	2026-06-16 22:26:13.015057+00
home_services	enterprise	core_users	2026-06-16 22:26:13.015057+00
security_services	enterprise	core_users	2026-06-16 22:26:13.015057+00
cleaning_services	enterprise	core_users	2026-06-16 22:26:13.015057+00
media_marketing	enterprise	core_users	2026-06-16 22:26:13.015057+00
telecom_communication	enterprise	core_users	2026-06-16 22:26:13.015057+00
other_business	enterprise	core_users	2026-06-16 22:26:13.015057+00
auto_workshop	starter	core_roles_permissions	2026-06-16 22:26:13.015057+00
hospital	starter	core_roles_permissions	2026-06-16 22:26:13.015057+00
dental	starter	core_roles_permissions	2026-06-16 22:26:13.015057+00
pharmacy	starter	core_roles_permissions	2026-06-16 22:26:13.015057+00
school_college	starter	core_roles_permissions	2026-06-16 22:26:13.015057+00
coaching_center	starter	core_roles_permissions	2026-06-16 22:26:13.015057+00
ecommerce	starter	core_roles_permissions	2026-06-16 22:26:13.015057+00
retail_shop	starter	core_roles_permissions	2026-06-16 22:26:13.015057+00
super_mart	starter	core_roles_permissions	2026-06-16 22:26:13.015057+00
wholesale_distribution	starter	core_roles_permissions	2026-06-16 22:26:13.015057+00
restaurant_cafe	starter	core_roles_permissions	2026-06-16 22:26:13.015057+00
hotel_hospitality	starter	core_roles_permissions	2026-06-16 22:26:13.015057+00
travel_tourism	starter	core_roles_permissions	2026-06-16 22:26:13.015057+00
salon_spa	starter	core_roles_permissions	2026-06-16 22:26:13.015057+00
gym_fitness	starter	core_roles_permissions	2026-06-16 22:26:13.015057+00
real_estate	starter	core_roles_permissions	2026-06-16 22:26:13.015057+00
construction	starter	core_roles_permissions	2026-06-16 22:26:13.015057+00
manufacturing	starter	core_roles_permissions	2026-06-16 22:26:13.015057+00
logistics_transport	starter	core_roles_permissions	2026-06-16 22:26:13.015057+00
event_management	starter	core_roles_permissions	2026-06-16 22:26:13.015057+00
hr_payroll	starter	core_roles_permissions	2026-06-16 22:26:13.015057+00
recruitment_agency	starter	core_roles_permissions	2026-06-16 22:26:13.015057+00
law_firm	starter	core_roles_permissions	2026-06-16 22:26:13.015057+00
ngo_nonprofit	starter	core_roles_permissions	2026-06-16 22:26:13.015057+00
professional_services	starter	core_roles_permissions	2026-06-16 22:26:13.015057+00
super_mart	starter	billing	2026-06-16 22:26:13.015057+00
software_it	starter	core_roles_permissions	2026-06-16 22:26:13.015057+00
home_services	starter	core_roles_permissions	2026-06-16 22:26:13.015057+00
security_services	starter	core_roles_permissions	2026-06-16 22:26:13.015057+00
cleaning_services	starter	core_roles_permissions	2026-06-16 22:26:13.015057+00
media_marketing	starter	core_roles_permissions	2026-06-16 22:26:13.015057+00
telecom_communication	starter	core_roles_permissions	2026-06-16 22:26:13.015057+00
other_business	starter	core_roles_permissions	2026-06-16 22:26:13.015057+00
accounting_tax	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
agriculture	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
auto_workshop	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
clinic	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
hospital	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
dental	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
pharmacy	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
school_college	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
coaching_center	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
ecommerce	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
retail_shop	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
super_mart	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
wholesale_distribution	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
restaurant_cafe	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
hotel_hospitality	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
travel_tourism	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
salon_spa	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
gym_fitness	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
real_estate	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
construction	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
manufacturing	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
logistics_transport	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
event_management	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
hr_payroll	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
recruitment_agency	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
law_firm	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
ngo_nonprofit	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
professional_services	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
software_it	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
home_services	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
security_services	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
cleaning_services	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
media_marketing	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
telecom_communication	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
other_business	pro	core_roles_permissions	2026-06-16 22:26:13.015057+00
accounting_tax	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
agriculture	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
auto_workshop	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
clinic	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
hospital	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
dental	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
pharmacy	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
school_college	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
ecommerce	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
retail_shop	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
super_mart	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
wholesale_distribution	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
restaurant_cafe	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
hotel_hospitality	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
travel_tourism	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
salon_spa	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
gym_fitness	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
real_estate	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
construction	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
manufacturing	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
logistics_transport	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
event_management	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
hr_payroll	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
recruitment_agency	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
law_firm	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
ngo_nonprofit	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
professional_services	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
software_it	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
home_services	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
security_services	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
cleaning_services	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
media_marketing	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
telecom_communication	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
other_business	enterprise	core_roles_permissions	2026-06-16 22:26:13.015057+00
auto_workshop	starter	core_files	2026-06-16 22:26:13.015057+00
hospital	starter	core_files	2026-06-16 22:26:13.015057+00
dental	starter	core_files	2026-06-16 22:26:13.015057+00
pharmacy	starter	core_files	2026-06-16 22:26:13.015057+00
school_college	starter	core_files	2026-06-16 22:26:13.015057+00
coaching_center	starter	core_files	2026-06-16 22:26:13.015057+00
ecommerce	starter	core_files	2026-06-16 22:26:13.015057+00
retail_shop	starter	core_files	2026-06-16 22:26:13.015057+00
super_mart	starter	core_files	2026-06-16 22:26:13.015057+00
wholesale_distribution	starter	core_files	2026-06-16 22:26:13.015057+00
restaurant_cafe	starter	core_files	2026-06-16 22:26:13.015057+00
hotel_hospitality	starter	core_files	2026-06-16 22:26:13.015057+00
travel_tourism	starter	core_files	2026-06-16 22:26:13.015057+00
salon_spa	starter	core_files	2026-06-16 22:26:13.015057+00
gym_fitness	starter	core_files	2026-06-16 22:26:13.015057+00
real_estate	starter	core_files	2026-06-16 22:26:13.015057+00
construction	starter	core_files	2026-06-16 22:26:13.015057+00
manufacturing	starter	core_files	2026-06-16 22:26:13.015057+00
logistics_transport	starter	core_files	2026-06-16 22:26:13.015057+00
event_management	starter	core_files	2026-06-16 22:26:13.015057+00
hr_payroll	starter	core_files	2026-06-16 22:26:13.015057+00
recruitment_agency	starter	core_files	2026-06-16 22:26:13.015057+00
law_firm	starter	core_files	2026-06-16 22:26:13.015057+00
ngo_nonprofit	starter	core_files	2026-06-16 22:26:13.015057+00
professional_services	starter	core_files	2026-06-16 22:26:13.015057+00
software_it	starter	core_files	2026-06-16 22:26:13.015057+00
home_services	starter	core_files	2026-06-16 22:26:13.015057+00
security_services	starter	core_files	2026-06-16 22:26:13.015057+00
cleaning_services	starter	core_files	2026-06-16 22:26:13.015057+00
media_marketing	starter	core_files	2026-06-16 22:26:13.015057+00
telecom_communication	starter	core_files	2026-06-16 22:26:13.015057+00
other_business	starter	core_files	2026-06-16 22:26:13.015057+00
accounting_tax	pro	core_files	2026-06-16 22:26:13.015057+00
agriculture	pro	core_files	2026-06-16 22:26:13.015057+00
auto_workshop	pro	core_files	2026-06-16 22:26:13.015057+00
clinic	pro	core_files	2026-06-16 22:26:13.015057+00
hospital	pro	core_files	2026-06-16 22:26:13.015057+00
dental	pro	core_files	2026-06-16 22:26:13.015057+00
pharmacy	pro	core_files	2026-06-16 22:26:13.015057+00
school_college	pro	core_files	2026-06-16 22:26:13.015057+00
coaching_center	pro	core_files	2026-06-16 22:26:13.015057+00
ecommerce	pro	core_files	2026-06-16 22:26:13.015057+00
retail_shop	pro	core_files	2026-06-16 22:26:13.015057+00
super_mart	pro	core_files	2026-06-16 22:26:13.015057+00
wholesale_distribution	pro	core_files	2026-06-16 22:26:13.015057+00
restaurant_cafe	pro	core_files	2026-06-16 22:26:13.015057+00
hotel_hospitality	pro	core_files	2026-06-16 22:26:13.015057+00
travel_tourism	pro	core_files	2026-06-16 22:26:13.015057+00
salon_spa	pro	core_files	2026-06-16 22:26:13.015057+00
gym_fitness	pro	core_files	2026-06-16 22:26:13.015057+00
real_estate	pro	core_files	2026-06-16 22:26:13.015057+00
construction	pro	core_files	2026-06-16 22:26:13.015057+00
manufacturing	pro	core_files	2026-06-16 22:26:13.015057+00
logistics_transport	pro	core_files	2026-06-16 22:26:13.015057+00
event_management	pro	core_files	2026-06-16 22:26:13.015057+00
hr_payroll	pro	core_files	2026-06-16 22:26:13.015057+00
recruitment_agency	pro	core_files	2026-06-16 22:26:13.015057+00
law_firm	pro	core_files	2026-06-16 22:26:13.015057+00
ngo_nonprofit	pro	core_files	2026-06-16 22:26:13.015057+00
professional_services	pro	core_files	2026-06-16 22:26:13.015057+00
software_it	pro	core_files	2026-06-16 22:26:13.015057+00
home_services	pro	core_files	2026-06-16 22:26:13.015057+00
security_services	pro	core_files	2026-06-16 22:26:13.015057+00
cleaning_services	pro	core_files	2026-06-16 22:26:13.015057+00
media_marketing	pro	core_files	2026-06-16 22:26:13.015057+00
telecom_communication	pro	core_files	2026-06-16 22:26:13.015057+00
other_business	pro	core_files	2026-06-16 22:26:13.015057+00
accounting_tax	enterprise	core_files	2026-06-16 22:26:13.015057+00
agriculture	enterprise	core_files	2026-06-16 22:26:13.015057+00
auto_workshop	enterprise	core_files	2026-06-16 22:26:13.015057+00
clinic	enterprise	core_files	2026-06-16 22:26:13.015057+00
hospital	enterprise	core_files	2026-06-16 22:26:13.015057+00
dental	enterprise	core_files	2026-06-16 22:26:13.015057+00
pharmacy	enterprise	core_files	2026-06-16 22:26:13.015057+00
school_college	enterprise	core_files	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	core_files	2026-06-16 22:26:13.015057+00
ecommerce	enterprise	core_files	2026-06-16 22:26:13.015057+00
retail_shop	enterprise	core_files	2026-06-16 22:26:13.015057+00
super_mart	enterprise	core_files	2026-06-16 22:26:13.015057+00
wholesale_distribution	enterprise	core_files	2026-06-16 22:26:13.015057+00
restaurant_cafe	enterprise	core_files	2026-06-16 22:26:13.015057+00
hotel_hospitality	enterprise	core_files	2026-06-16 22:26:13.015057+00
travel_tourism	enterprise	core_files	2026-06-16 22:26:13.015057+00
salon_spa	enterprise	core_files	2026-06-16 22:26:13.015057+00
gym_fitness	enterprise	core_files	2026-06-16 22:26:13.015057+00
real_estate	enterprise	core_files	2026-06-16 22:26:13.015057+00
construction	enterprise	core_files	2026-06-16 22:26:13.015057+00
manufacturing	enterprise	core_files	2026-06-16 22:26:13.015057+00
logistics_transport	enterprise	core_files	2026-06-16 22:26:13.015057+00
event_management	enterprise	core_files	2026-06-16 22:26:13.015057+00
hr_payroll	enterprise	core_files	2026-06-16 22:26:13.015057+00
recruitment_agency	enterprise	core_files	2026-06-16 22:26:13.015057+00
law_firm	enterprise	core_files	2026-06-16 22:26:13.015057+00
ngo_nonprofit	enterprise	core_files	2026-06-16 22:26:13.015057+00
professional_services	enterprise	core_files	2026-06-16 22:26:13.015057+00
software_it	enterprise	core_files	2026-06-16 22:26:13.015057+00
home_services	enterprise	core_files	2026-06-16 22:26:13.015057+00
security_services	enterprise	core_files	2026-06-16 22:26:13.015057+00
cleaning_services	enterprise	core_files	2026-06-16 22:26:13.015057+00
media_marketing	enterprise	core_files	2026-06-16 22:26:13.015057+00
telecom_communication	enterprise	core_files	2026-06-16 22:26:13.015057+00
other_business	enterprise	core_files	2026-06-16 22:26:13.015057+00
auto_workshop	starter	core_calendar	2026-06-16 22:26:13.015057+00
hospital	starter	core_calendar	2026-06-16 22:26:13.015057+00
dental	starter	core_calendar	2026-06-16 22:26:13.015057+00
pharmacy	starter	core_calendar	2026-06-16 22:26:13.015057+00
school_college	starter	core_calendar	2026-06-16 22:26:13.015057+00
coaching_center	starter	core_calendar	2026-06-16 22:26:13.015057+00
ecommerce	starter	core_calendar	2026-06-16 22:26:13.015057+00
retail_shop	starter	core_calendar	2026-06-16 22:26:13.015057+00
super_mart	starter	core_calendar	2026-06-16 22:26:13.015057+00
wholesale_distribution	starter	core_calendar	2026-06-16 22:26:13.015057+00
restaurant_cafe	starter	core_calendar	2026-06-16 22:26:13.015057+00
hotel_hospitality	starter	core_calendar	2026-06-16 22:26:13.015057+00
travel_tourism	starter	core_calendar	2026-06-16 22:26:13.015057+00
salon_spa	starter	core_calendar	2026-06-16 22:26:13.015057+00
gym_fitness	starter	core_calendar	2026-06-16 22:26:13.015057+00
real_estate	starter	core_calendar	2026-06-16 22:26:13.015057+00
construction	starter	core_calendar	2026-06-16 22:26:13.015057+00
manufacturing	starter	core_calendar	2026-06-16 22:26:13.015057+00
logistics_transport	starter	core_calendar	2026-06-16 22:26:13.015057+00
event_management	starter	core_calendar	2026-06-16 22:26:13.015057+00
hr_payroll	starter	core_calendar	2026-06-16 22:26:13.015057+00
recruitment_agency	starter	core_calendar	2026-06-16 22:26:13.015057+00
law_firm	starter	core_calendar	2026-06-16 22:26:13.015057+00
ngo_nonprofit	starter	core_calendar	2026-06-16 22:26:13.015057+00
professional_services	starter	core_calendar	2026-06-16 22:26:13.015057+00
software_it	starter	core_calendar	2026-06-16 22:26:13.015057+00
home_services	starter	core_calendar	2026-06-16 22:26:13.015057+00
security_services	starter	core_calendar	2026-06-16 22:26:13.015057+00
cleaning_services	starter	core_calendar	2026-06-16 22:26:13.015057+00
media_marketing	starter	core_calendar	2026-06-16 22:26:13.015057+00
telecom_communication	starter	core_calendar	2026-06-16 22:26:13.015057+00
other_business	starter	core_calendar	2026-06-16 22:26:13.015057+00
accounting_tax	pro	core_calendar	2026-06-16 22:26:13.015057+00
agriculture	pro	core_calendar	2026-06-16 22:26:13.015057+00
auto_workshop	pro	core_calendar	2026-06-16 22:26:13.015057+00
clinic	pro	core_calendar	2026-06-16 22:26:13.015057+00
hospital	pro	core_calendar	2026-06-16 22:26:13.015057+00
dental	pro	core_calendar	2026-06-16 22:26:13.015057+00
pharmacy	pro	core_calendar	2026-06-16 22:26:13.015057+00
school_college	pro	core_calendar	2026-06-16 22:26:13.015057+00
coaching_center	pro	core_calendar	2026-06-16 22:26:13.015057+00
ecommerce	pro	core_calendar	2026-06-16 22:26:13.015057+00
retail_shop	pro	core_calendar	2026-06-16 22:26:13.015057+00
super_mart	pro	core_calendar	2026-06-16 22:26:13.015057+00
wholesale_distribution	pro	core_calendar	2026-06-16 22:26:13.015057+00
restaurant_cafe	pro	core_calendar	2026-06-16 22:26:13.015057+00
hotel_hospitality	pro	core_calendar	2026-06-16 22:26:13.015057+00
travel_tourism	pro	core_calendar	2026-06-16 22:26:13.015057+00
salon_spa	pro	core_calendar	2026-06-16 22:26:13.015057+00
gym_fitness	pro	core_calendar	2026-06-16 22:26:13.015057+00
real_estate	pro	core_calendar	2026-06-16 22:26:13.015057+00
construction	pro	core_calendar	2026-06-16 22:26:13.015057+00
manufacturing	pro	core_calendar	2026-06-16 22:26:13.015057+00
logistics_transport	pro	core_calendar	2026-06-16 22:26:13.015057+00
event_management	pro	core_calendar	2026-06-16 22:26:13.015057+00
hr_payroll	pro	core_calendar	2026-06-16 22:26:13.015057+00
recruitment_agency	pro	core_calendar	2026-06-16 22:26:13.015057+00
law_firm	pro	core_calendar	2026-06-16 22:26:13.015057+00
ngo_nonprofit	pro	core_calendar	2026-06-16 22:26:13.015057+00
professional_services	pro	core_calendar	2026-06-16 22:26:13.015057+00
software_it	pro	core_calendar	2026-06-16 22:26:13.015057+00
home_services	pro	core_calendar	2026-06-16 22:26:13.015057+00
security_services	pro	core_calendar	2026-06-16 22:26:13.015057+00
cleaning_services	pro	core_calendar	2026-06-16 22:26:13.015057+00
media_marketing	pro	core_calendar	2026-06-16 22:26:13.015057+00
telecom_communication	pro	core_calendar	2026-06-16 22:26:13.015057+00
other_business	pro	core_calendar	2026-06-16 22:26:13.015057+00
accounting_tax	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
agriculture	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
auto_workshop	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
clinic	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
hospital	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
dental	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
pharmacy	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
school_college	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
ecommerce	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
retail_shop	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
super_mart	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
wholesale_distribution	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
restaurant_cafe	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
hotel_hospitality	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
travel_tourism	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
salon_spa	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
gym_fitness	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
real_estate	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
construction	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
manufacturing	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
logistics_transport	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
event_management	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
hr_payroll	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
recruitment_agency	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
law_firm	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
ngo_nonprofit	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
professional_services	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
software_it	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
home_services	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
security_services	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
cleaning_services	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
media_marketing	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
telecom_communication	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
other_business	enterprise	core_calendar	2026-06-16 22:26:13.015057+00
auto_workshop	starter	core_notifications	2026-06-16 22:26:13.015057+00
hospital	starter	core_notifications	2026-06-16 22:26:13.015057+00
dental	starter	core_notifications	2026-06-16 22:26:13.015057+00
pharmacy	starter	core_notifications	2026-06-16 22:26:13.015057+00
school_college	starter	core_notifications	2026-06-16 22:26:13.015057+00
coaching_center	starter	core_notifications	2026-06-16 22:26:13.015057+00
ecommerce	starter	core_notifications	2026-06-16 22:26:13.015057+00
retail_shop	starter	core_notifications	2026-06-16 22:26:13.015057+00
super_mart	starter	core_notifications	2026-06-16 22:26:13.015057+00
wholesale_distribution	starter	core_notifications	2026-06-16 22:26:13.015057+00
restaurant_cafe	starter	core_notifications	2026-06-16 22:26:13.015057+00
hotel_hospitality	starter	core_notifications	2026-06-16 22:26:13.015057+00
travel_tourism	starter	core_notifications	2026-06-16 22:26:13.015057+00
salon_spa	starter	core_notifications	2026-06-16 22:26:13.015057+00
gym_fitness	starter	core_notifications	2026-06-16 22:26:13.015057+00
real_estate	starter	core_notifications	2026-06-16 22:26:13.015057+00
construction	starter	core_notifications	2026-06-16 22:26:13.015057+00
manufacturing	starter	core_notifications	2026-06-16 22:26:13.015057+00
logistics_transport	starter	core_notifications	2026-06-16 22:26:13.015057+00
event_management	starter	core_notifications	2026-06-16 22:26:13.015057+00
hr_payroll	starter	core_notifications	2026-06-16 22:26:13.015057+00
recruitment_agency	starter	core_notifications	2026-06-16 22:26:13.015057+00
law_firm	starter	core_notifications	2026-06-16 22:26:13.015057+00
ngo_nonprofit	starter	core_notifications	2026-06-16 22:26:13.015057+00
professional_services	starter	core_notifications	2026-06-16 22:26:13.015057+00
software_it	starter	core_notifications	2026-06-16 22:26:13.015057+00
home_services	starter	core_notifications	2026-06-16 22:26:13.015057+00
security_services	starter	core_notifications	2026-06-16 22:26:13.015057+00
cleaning_services	starter	core_notifications	2026-06-16 22:26:13.015057+00
media_marketing	starter	core_notifications	2026-06-16 22:26:13.015057+00
telecom_communication	starter	core_notifications	2026-06-16 22:26:13.015057+00
other_business	starter	core_notifications	2026-06-16 22:26:13.015057+00
accounting_tax	pro	core_notifications	2026-06-16 22:26:13.015057+00
agriculture	pro	core_notifications	2026-06-16 22:26:13.015057+00
auto_workshop	pro	core_notifications	2026-06-16 22:26:13.015057+00
clinic	pro	core_notifications	2026-06-16 22:26:13.015057+00
hospital	pro	core_notifications	2026-06-16 22:26:13.015057+00
dental	pro	core_notifications	2026-06-16 22:26:13.015057+00
pharmacy	pro	core_notifications	2026-06-16 22:26:13.015057+00
school_college	pro	core_notifications	2026-06-16 22:26:13.015057+00
coaching_center	pro	core_notifications	2026-06-16 22:26:13.015057+00
ecommerce	pro	core_notifications	2026-06-16 22:26:13.015057+00
retail_shop	pro	core_notifications	2026-06-16 22:26:13.015057+00
super_mart	pro	core_notifications	2026-06-16 22:26:13.015057+00
wholesale_distribution	pro	core_notifications	2026-06-16 22:26:13.015057+00
restaurant_cafe	pro	core_notifications	2026-06-16 22:26:13.015057+00
hotel_hospitality	pro	core_notifications	2026-06-16 22:26:13.015057+00
travel_tourism	pro	core_notifications	2026-06-16 22:26:13.015057+00
salon_spa	pro	core_notifications	2026-06-16 22:26:13.015057+00
gym_fitness	pro	core_notifications	2026-06-16 22:26:13.015057+00
real_estate	pro	core_notifications	2026-06-16 22:26:13.015057+00
construction	pro	core_notifications	2026-06-16 22:26:13.015057+00
manufacturing	pro	core_notifications	2026-06-16 22:26:13.015057+00
logistics_transport	pro	core_notifications	2026-06-16 22:26:13.015057+00
event_management	pro	core_notifications	2026-06-16 22:26:13.015057+00
hr_payroll	pro	core_notifications	2026-06-16 22:26:13.015057+00
recruitment_agency	pro	core_notifications	2026-06-16 22:26:13.015057+00
law_firm	pro	core_notifications	2026-06-16 22:26:13.015057+00
ngo_nonprofit	pro	core_notifications	2026-06-16 22:26:13.015057+00
professional_services	pro	core_notifications	2026-06-16 22:26:13.015057+00
software_it	pro	core_notifications	2026-06-16 22:26:13.015057+00
home_services	pro	core_notifications	2026-06-16 22:26:13.015057+00
security_services	pro	core_notifications	2026-06-16 22:26:13.015057+00
cleaning_services	pro	core_notifications	2026-06-16 22:26:13.015057+00
media_marketing	pro	core_notifications	2026-06-16 22:26:13.015057+00
telecom_communication	pro	core_notifications	2026-06-16 22:26:13.015057+00
other_business	pro	core_notifications	2026-06-16 22:26:13.015057+00
accounting_tax	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
agriculture	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
auto_workshop	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
clinic	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
hospital	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
dental	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
pharmacy	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
school_college	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
ecommerce	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
retail_shop	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
super_mart	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
wholesale_distribution	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
restaurant_cafe	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
hotel_hospitality	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
travel_tourism	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
salon_spa	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
gym_fitness	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
real_estate	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
construction	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
manufacturing	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
logistics_transport	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
event_management	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
hr_payroll	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
recruitment_agency	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
law_firm	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
ngo_nonprofit	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
professional_services	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
software_it	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
home_services	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
security_services	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
cleaning_services	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
media_marketing	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
telecom_communication	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
other_business	enterprise	core_notifications	2026-06-16 22:26:13.015057+00
auto_workshop	starter	core_activity_logs	2026-06-16 22:26:13.015057+00
hospital	starter	core_activity_logs	2026-06-16 22:26:13.015057+00
dental	starter	core_activity_logs	2026-06-16 22:26:13.015057+00
pharmacy	starter	core_activity_logs	2026-06-16 22:26:13.015057+00
school_college	starter	core_activity_logs	2026-06-16 22:26:13.015057+00
coaching_center	starter	core_activity_logs	2026-06-16 22:26:13.015057+00
ecommerce	starter	core_activity_logs	2026-06-16 22:26:13.015057+00
retail_shop	starter	core_activity_logs	2026-06-16 22:26:13.015057+00
super_mart	starter	core_activity_logs	2026-06-16 22:26:13.015057+00
wholesale_distribution	starter	core_activity_logs	2026-06-16 22:26:13.015057+00
restaurant_cafe	starter	core_activity_logs	2026-06-16 22:26:13.015057+00
hotel_hospitality	starter	core_activity_logs	2026-06-16 22:26:13.015057+00
travel_tourism	starter	core_activity_logs	2026-06-16 22:26:13.015057+00
salon_spa	starter	core_activity_logs	2026-06-16 22:26:13.015057+00
gym_fitness	starter	core_activity_logs	2026-06-16 22:26:13.015057+00
real_estate	starter	core_activity_logs	2026-06-16 22:26:13.015057+00
construction	starter	core_activity_logs	2026-06-16 22:26:13.015057+00
manufacturing	starter	core_activity_logs	2026-06-16 22:26:13.015057+00
logistics_transport	starter	core_activity_logs	2026-06-16 22:26:13.015057+00
event_management	starter	core_activity_logs	2026-06-16 22:26:13.015057+00
hr_payroll	starter	core_activity_logs	2026-06-16 22:26:13.015057+00
recruitment_agency	starter	core_activity_logs	2026-06-16 22:26:13.015057+00
law_firm	starter	core_activity_logs	2026-06-16 22:26:13.015057+00
ngo_nonprofit	starter	core_activity_logs	2026-06-16 22:26:13.015057+00
professional_services	starter	core_activity_logs	2026-06-16 22:26:13.015057+00
software_it	starter	core_activity_logs	2026-06-16 22:26:13.015057+00
home_services	starter	core_activity_logs	2026-06-16 22:26:13.015057+00
security_services	starter	core_activity_logs	2026-06-16 22:26:13.015057+00
cleaning_services	starter	core_activity_logs	2026-06-16 22:26:13.015057+00
media_marketing	starter	core_activity_logs	2026-06-16 22:26:13.015057+00
telecom_communication	starter	core_activity_logs	2026-06-16 22:26:13.015057+00
other_business	starter	core_activity_logs	2026-06-16 22:26:13.015057+00
accounting_tax	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
agriculture	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
auto_workshop	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
clinic	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
hospital	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
dental	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
pharmacy	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
school_college	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
coaching_center	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
ecommerce	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
retail_shop	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
super_mart	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
wholesale_distribution	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
restaurant_cafe	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
hotel_hospitality	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
travel_tourism	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
salon_spa	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
gym_fitness	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
real_estate	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
construction	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
manufacturing	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
logistics_transport	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
event_management	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
hr_payroll	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
recruitment_agency	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
law_firm	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
ngo_nonprofit	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
professional_services	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
software_it	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
home_services	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
security_services	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
cleaning_services	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
media_marketing	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
telecom_communication	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
other_business	pro	core_activity_logs	2026-06-16 22:26:13.015057+00
accounting_tax	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
agriculture	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
auto_workshop	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
clinic	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
hospital	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
dental	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
pharmacy	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
school_college	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
ecommerce	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
retail_shop	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
super_mart	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
wholesale_distribution	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
restaurant_cafe	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
hotel_hospitality	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
travel_tourism	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
salon_spa	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
gym_fitness	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
real_estate	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
construction	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
manufacturing	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
logistics_transport	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
event_management	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
hr_payroll	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
recruitment_agency	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
law_firm	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
ngo_nonprofit	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
professional_services	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
software_it	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
home_services	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
security_services	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
cleaning_services	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
media_marketing	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
telecom_communication	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
other_business	enterprise	core_activity_logs	2026-06-16 22:26:13.015057+00
auto_workshop	starter	core_import_export	2026-06-16 22:26:13.015057+00
hospital	starter	core_import_export	2026-06-16 22:26:13.015057+00
dental	starter	core_import_export	2026-06-16 22:26:13.015057+00
pharmacy	starter	core_import_export	2026-06-16 22:26:13.015057+00
school_college	starter	core_import_export	2026-06-16 22:26:13.015057+00
coaching_center	starter	core_import_export	2026-06-16 22:26:13.015057+00
ecommerce	starter	core_import_export	2026-06-16 22:26:13.015057+00
retail_shop	starter	core_import_export	2026-06-16 22:26:13.015057+00
super_mart	starter	core_import_export	2026-06-16 22:26:13.015057+00
wholesale_distribution	starter	core_import_export	2026-06-16 22:26:13.015057+00
restaurant_cafe	starter	core_import_export	2026-06-16 22:26:13.015057+00
hotel_hospitality	starter	core_import_export	2026-06-16 22:26:13.015057+00
travel_tourism	starter	core_import_export	2026-06-16 22:26:13.015057+00
salon_spa	starter	core_import_export	2026-06-16 22:26:13.015057+00
gym_fitness	starter	core_import_export	2026-06-16 22:26:13.015057+00
real_estate	starter	core_import_export	2026-06-16 22:26:13.015057+00
construction	starter	core_import_export	2026-06-16 22:26:13.015057+00
manufacturing	starter	core_import_export	2026-06-16 22:26:13.015057+00
logistics_transport	starter	core_import_export	2026-06-16 22:26:13.015057+00
event_management	starter	core_import_export	2026-06-16 22:26:13.015057+00
hr_payroll	starter	core_import_export	2026-06-16 22:26:13.015057+00
recruitment_agency	starter	core_import_export	2026-06-16 22:26:13.015057+00
law_firm	starter	core_import_export	2026-06-16 22:26:13.015057+00
ngo_nonprofit	starter	core_import_export	2026-06-16 22:26:13.015057+00
professional_services	starter	core_import_export	2026-06-16 22:26:13.015057+00
software_it	starter	core_import_export	2026-06-16 22:26:13.015057+00
home_services	starter	core_import_export	2026-06-16 22:26:13.015057+00
security_services	starter	core_import_export	2026-06-16 22:26:13.015057+00
cleaning_services	starter	core_import_export	2026-06-16 22:26:13.015057+00
media_marketing	starter	core_import_export	2026-06-16 22:26:13.015057+00
telecom_communication	starter	core_import_export	2026-06-16 22:26:13.015057+00
other_business	starter	core_import_export	2026-06-16 22:26:13.015057+00
accounting_tax	pro	core_import_export	2026-06-16 22:26:13.015057+00
agriculture	pro	core_import_export	2026-06-16 22:26:13.015057+00
auto_workshop	pro	core_import_export	2026-06-16 22:26:13.015057+00
clinic	pro	core_import_export	2026-06-16 22:26:13.015057+00
hospital	pro	core_import_export	2026-06-16 22:26:13.015057+00
dental	pro	core_import_export	2026-06-16 22:26:13.015057+00
pharmacy	pro	core_import_export	2026-06-16 22:26:13.015057+00
school_college	pro	core_import_export	2026-06-16 22:26:13.015057+00
coaching_center	pro	core_import_export	2026-06-16 22:26:13.015057+00
ecommerce	pro	core_import_export	2026-06-16 22:26:13.015057+00
retail_shop	pro	core_import_export	2026-06-16 22:26:13.015057+00
super_mart	pro	core_import_export	2026-06-16 22:26:13.015057+00
wholesale_distribution	pro	core_import_export	2026-06-16 22:26:13.015057+00
restaurant_cafe	pro	core_import_export	2026-06-16 22:26:13.015057+00
hotel_hospitality	pro	core_import_export	2026-06-16 22:26:13.015057+00
travel_tourism	pro	core_import_export	2026-06-16 22:26:13.015057+00
salon_spa	pro	core_import_export	2026-06-16 22:26:13.015057+00
gym_fitness	pro	core_import_export	2026-06-16 22:26:13.015057+00
real_estate	pro	core_import_export	2026-06-16 22:26:13.015057+00
construction	pro	core_import_export	2026-06-16 22:26:13.015057+00
manufacturing	pro	core_import_export	2026-06-16 22:26:13.015057+00
logistics_transport	pro	core_import_export	2026-06-16 22:26:13.015057+00
event_management	pro	core_import_export	2026-06-16 22:26:13.015057+00
hr_payroll	pro	core_import_export	2026-06-16 22:26:13.015057+00
recruitment_agency	pro	core_import_export	2026-06-16 22:26:13.015057+00
law_firm	pro	core_import_export	2026-06-16 22:26:13.015057+00
ngo_nonprofit	pro	core_import_export	2026-06-16 22:26:13.015057+00
professional_services	pro	core_import_export	2026-06-16 22:26:13.015057+00
software_it	pro	core_import_export	2026-06-16 22:26:13.015057+00
home_services	pro	core_import_export	2026-06-16 22:26:13.015057+00
security_services	pro	core_import_export	2026-06-16 22:26:13.015057+00
cleaning_services	pro	core_import_export	2026-06-16 22:26:13.015057+00
media_marketing	pro	core_import_export	2026-06-16 22:26:13.015057+00
telecom_communication	pro	core_import_export	2026-06-16 22:26:13.015057+00
other_business	pro	core_import_export	2026-06-16 22:26:13.015057+00
accounting_tax	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
agriculture	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
auto_workshop	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
clinic	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
hospital	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
dental	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
pharmacy	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
school_college	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
ecommerce	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
retail_shop	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
super_mart	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
wholesale_distribution	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
restaurant_cafe	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
hotel_hospitality	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
travel_tourism	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
salon_spa	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
gym_fitness	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
real_estate	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
construction	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
manufacturing	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
logistics_transport	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
event_management	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
hr_payroll	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
recruitment_agency	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
law_firm	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
ngo_nonprofit	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
professional_services	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
software_it	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
home_services	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
security_services	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
cleaning_services	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
media_marketing	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
telecom_communication	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
other_business	enterprise	core_import_export	2026-06-16 22:26:13.015057+00
auto_workshop	starter	core_custom_fields	2026-06-16 22:26:13.015057+00
hospital	starter	core_custom_fields	2026-06-16 22:26:13.015057+00
dental	starter	core_custom_fields	2026-06-16 22:26:13.015057+00
pharmacy	starter	core_custom_fields	2026-06-16 22:26:13.015057+00
school_college	starter	core_custom_fields	2026-06-16 22:26:13.015057+00
coaching_center	starter	core_custom_fields	2026-06-16 22:26:13.015057+00
ecommerce	starter	core_custom_fields	2026-06-16 22:26:13.015057+00
retail_shop	starter	core_custom_fields	2026-06-16 22:26:13.015057+00
super_mart	starter	core_custom_fields	2026-06-16 22:26:13.015057+00
wholesale_distribution	starter	core_custom_fields	2026-06-16 22:26:13.015057+00
restaurant_cafe	starter	core_custom_fields	2026-06-16 22:26:13.015057+00
hotel_hospitality	starter	core_custom_fields	2026-06-16 22:26:13.015057+00
travel_tourism	starter	core_custom_fields	2026-06-16 22:26:13.015057+00
salon_spa	starter	core_custom_fields	2026-06-16 22:26:13.015057+00
gym_fitness	starter	core_custom_fields	2026-06-16 22:26:13.015057+00
real_estate	starter	core_custom_fields	2026-06-16 22:26:13.015057+00
construction	starter	core_custom_fields	2026-06-16 22:26:13.015057+00
manufacturing	starter	core_custom_fields	2026-06-16 22:26:13.015057+00
logistics_transport	starter	core_custom_fields	2026-06-16 22:26:13.015057+00
event_management	starter	core_custom_fields	2026-06-16 22:26:13.015057+00
hr_payroll	starter	core_custom_fields	2026-06-16 22:26:13.015057+00
recruitment_agency	starter	core_custom_fields	2026-06-16 22:26:13.015057+00
law_firm	starter	core_custom_fields	2026-06-16 22:26:13.015057+00
ngo_nonprofit	starter	core_custom_fields	2026-06-16 22:26:13.015057+00
professional_services	starter	core_custom_fields	2026-06-16 22:26:13.015057+00
software_it	starter	core_custom_fields	2026-06-16 22:26:13.015057+00
home_services	starter	core_custom_fields	2026-06-16 22:26:13.015057+00
security_services	starter	core_custom_fields	2026-06-16 22:26:13.015057+00
cleaning_services	starter	core_custom_fields	2026-06-16 22:26:13.015057+00
media_marketing	starter	core_custom_fields	2026-06-16 22:26:13.015057+00
telecom_communication	starter	core_custom_fields	2026-06-16 22:26:13.015057+00
other_business	starter	core_custom_fields	2026-06-16 22:26:13.015057+00
accounting_tax	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
agriculture	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
auto_workshop	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
clinic	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
hospital	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
dental	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
pharmacy	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
school_college	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
coaching_center	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
ecommerce	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
retail_shop	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
super_mart	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
wholesale_distribution	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
restaurant_cafe	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
hotel_hospitality	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
travel_tourism	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
salon_spa	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
gym_fitness	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
real_estate	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
construction	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
manufacturing	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
logistics_transport	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
event_management	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
hr_payroll	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
recruitment_agency	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
law_firm	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
ngo_nonprofit	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
professional_services	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
software_it	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
home_services	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
security_services	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
cleaning_services	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
media_marketing	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
telecom_communication	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
other_business	pro	core_custom_fields	2026-06-16 22:26:13.015057+00
accounting_tax	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
agriculture	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
auto_workshop	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
clinic	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
hospital	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
dental	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
pharmacy	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
school_college	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
ecommerce	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
retail_shop	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
super_mart	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
wholesale_distribution	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
restaurant_cafe	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
hotel_hospitality	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
travel_tourism	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
salon_spa	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
gym_fitness	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
real_estate	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
construction	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
manufacturing	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
logistics_transport	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
event_management	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
hr_payroll	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
recruitment_agency	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
law_firm	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
ngo_nonprofit	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
professional_services	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
software_it	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
home_services	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
security_services	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
cleaning_services	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
media_marketing	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
telecom_communication	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
other_business	enterprise	core_custom_fields	2026-06-16 22:26:13.015057+00
auto_workshop	starter	core_tasks	2026-06-16 22:26:13.015057+00
hospital	starter	core_tasks	2026-06-16 22:26:13.015057+00
dental	starter	core_tasks	2026-06-16 22:26:13.015057+00
pharmacy	starter	core_tasks	2026-06-16 22:26:13.015057+00
school_college	starter	core_tasks	2026-06-16 22:26:13.015057+00
coaching_center	starter	core_tasks	2026-06-16 22:26:13.015057+00
ecommerce	starter	core_tasks	2026-06-16 22:26:13.015057+00
retail_shop	starter	core_tasks	2026-06-16 22:26:13.015057+00
super_mart	starter	core_tasks	2026-06-16 22:26:13.015057+00
wholesale_distribution	starter	core_tasks	2026-06-16 22:26:13.015057+00
restaurant_cafe	starter	core_tasks	2026-06-16 22:26:13.015057+00
super_mart	starter	reports	2026-06-16 22:26:13.015057+00
hotel_hospitality	starter	core_tasks	2026-06-16 22:26:13.015057+00
travel_tourism	starter	core_tasks	2026-06-16 22:26:13.015057+00
salon_spa	starter	core_tasks	2026-06-16 22:26:13.015057+00
gym_fitness	starter	core_tasks	2026-06-16 22:26:13.015057+00
real_estate	starter	core_tasks	2026-06-16 22:26:13.015057+00
construction	starter	core_tasks	2026-06-16 22:26:13.015057+00
manufacturing	starter	core_tasks	2026-06-16 22:26:13.015057+00
logistics_transport	starter	core_tasks	2026-06-16 22:26:13.015057+00
event_management	starter	core_tasks	2026-06-16 22:26:13.015057+00
hr_payroll	starter	core_tasks	2026-06-16 22:26:13.015057+00
recruitment_agency	starter	core_tasks	2026-06-16 22:26:13.015057+00
law_firm	starter	core_tasks	2026-06-16 22:26:13.015057+00
ngo_nonprofit	starter	core_tasks	2026-06-16 22:26:13.015057+00
professional_services	starter	core_tasks	2026-06-16 22:26:13.015057+00
software_it	starter	core_tasks	2026-06-16 22:26:13.015057+00
home_services	starter	core_tasks	2026-06-16 22:26:13.015057+00
security_services	starter	core_tasks	2026-06-16 22:26:13.015057+00
cleaning_services	starter	core_tasks	2026-06-16 22:26:13.015057+00
media_marketing	starter	core_tasks	2026-06-16 22:26:13.015057+00
telecom_communication	starter	core_tasks	2026-06-16 22:26:13.015057+00
other_business	starter	core_tasks	2026-06-16 22:26:13.015057+00
accounting_tax	pro	core_tasks	2026-06-16 22:26:13.015057+00
agriculture	pro	core_tasks	2026-06-16 22:26:13.015057+00
auto_workshop	pro	core_tasks	2026-06-16 22:26:13.015057+00
clinic	pro	core_tasks	2026-06-16 22:26:13.015057+00
hospital	pro	core_tasks	2026-06-16 22:26:13.015057+00
dental	pro	core_tasks	2026-06-16 22:26:13.015057+00
pharmacy	pro	core_tasks	2026-06-16 22:26:13.015057+00
school_college	pro	core_tasks	2026-06-16 22:26:13.015057+00
coaching_center	pro	core_tasks	2026-06-16 22:26:13.015057+00
ecommerce	pro	core_tasks	2026-06-16 22:26:13.015057+00
retail_shop	pro	core_tasks	2026-06-16 22:26:13.015057+00
super_mart	pro	core_tasks	2026-06-16 22:26:13.015057+00
wholesale_distribution	pro	core_tasks	2026-06-16 22:26:13.015057+00
restaurant_cafe	pro	core_tasks	2026-06-16 22:26:13.015057+00
hotel_hospitality	pro	core_tasks	2026-06-16 22:26:13.015057+00
travel_tourism	pro	core_tasks	2026-06-16 22:26:13.015057+00
salon_spa	pro	core_tasks	2026-06-16 22:26:13.015057+00
gym_fitness	pro	core_tasks	2026-06-16 22:26:13.015057+00
real_estate	pro	core_tasks	2026-06-16 22:26:13.015057+00
construction	pro	core_tasks	2026-06-16 22:26:13.015057+00
manufacturing	pro	core_tasks	2026-06-16 22:26:13.015057+00
logistics_transport	pro	core_tasks	2026-06-16 22:26:13.015057+00
event_management	pro	core_tasks	2026-06-16 22:26:13.015057+00
hr_payroll	pro	core_tasks	2026-06-16 22:26:13.015057+00
recruitment_agency	pro	core_tasks	2026-06-16 22:26:13.015057+00
law_firm	pro	core_tasks	2026-06-16 22:26:13.015057+00
ngo_nonprofit	pro	core_tasks	2026-06-16 22:26:13.015057+00
professional_services	pro	core_tasks	2026-06-16 22:26:13.015057+00
software_it	pro	core_tasks	2026-06-16 22:26:13.015057+00
home_services	pro	core_tasks	2026-06-16 22:26:13.015057+00
security_services	pro	core_tasks	2026-06-16 22:26:13.015057+00
cleaning_services	pro	core_tasks	2026-06-16 22:26:13.015057+00
media_marketing	pro	core_tasks	2026-06-16 22:26:13.015057+00
telecom_communication	pro	core_tasks	2026-06-16 22:26:13.015057+00
other_business	pro	core_tasks	2026-06-16 22:26:13.015057+00
accounting_tax	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
agriculture	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
auto_workshop	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
clinic	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
hospital	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
dental	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
pharmacy	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
school_college	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
ecommerce	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
retail_shop	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
super_mart	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
wholesale_distribution	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
restaurant_cafe	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
hotel_hospitality	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
travel_tourism	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
salon_spa	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
gym_fitness	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
real_estate	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
construction	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
manufacturing	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
logistics_transport	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
event_management	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
hr_payroll	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
recruitment_agency	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
law_firm	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
ngo_nonprofit	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
professional_services	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
software_it	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
home_services	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
security_services	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
cleaning_services	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
media_marketing	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
telecom_communication	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
other_business	enterprise	core_tasks	2026-06-16 22:26:13.015057+00
auto_workshop	starter	auto_workshop_management	2026-06-16 22:26:13.015057+00
auto_workshop	starter	auto_workshop_jobs	2026-06-16 22:26:13.015057+00
auto_workshop	starter	auto_workshop_vehicles	2026-06-16 22:26:13.015057+00
cleaning_services	starter	repair_management	2026-06-16 22:26:13.015057+00
cleaning_services	starter	tickets	2026-06-16 22:26:13.015057+00
coaching_center	starter	school_management	2026-06-16 22:26:13.015057+00
coaching_center	starter	students	2026-06-16 22:26:13.015057+00
coaching_center	starter	teachers	2026-06-16 22:26:13.015057+00
coaching_center	starter	classes_sections	2026-06-16 22:26:13.015057+00
coaching_center	starter	attendance	2026-06-16 22:26:13.015057+00
coaching_center	starter	fees	2026-06-16 22:26:13.015057+00
coaching_center	starter	exams_results	2026-06-16 22:26:13.015057+00
coaching_center	starter	timetable	2026-06-16 22:26:13.015057+00
coaching_center	starter	parents_portal	2026-06-16 22:26:13.015057+00
construction	starter	construction_management	2026-06-16 22:26:13.015057+00
construction	starter	construction_projects	2026-06-16 22:26:13.015057+00
construction	starter	construction_materials	2026-06-16 22:26:13.015057+00
dental	starter	treatment_plans	2026-06-16 22:26:13.015057+00
dental	starter	dental_management	2026-06-16 22:26:13.015057+00
dental	starter	dental_charting	2026-06-16 22:26:13.015057+00
dental	starter	dental_treatment_plans	2026-06-16 22:26:13.015057+00
ecommerce	starter	online_storefront	2026-06-16 22:26:13.015057+00
ecommerce	starter	shipping_delivery	2026-06-16 22:26:13.015057+00
ecommerce	starter	ecommerce_management	2026-06-16 22:26:13.015057+00
ecommerce	starter	ecommerce_storefront	2026-06-16 22:26:13.015057+00
ecommerce	starter	ecommerce_orders	2026-06-16 22:26:13.015057+00
event_management	starter	event_management	2026-06-16 22:26:13.015057+00
event_management	starter	event_clients	2026-06-16 22:26:13.015057+00
event_management	starter	event_bookings	2026-06-16 22:26:13.015057+00
gym_fitness	starter	gym_management	2026-06-16 22:26:13.015057+00
gym_fitness	starter	trainer_schedule	2026-06-16 22:26:13.015057+00
home_services	starter	repair_management	2026-06-16 22:26:13.015057+00
home_services	starter	tickets	2026-06-16 22:26:13.015057+00
hospital	starter	clinic_management	2026-06-16 22:26:13.015057+00
hospital	starter	patients	2026-06-16 22:26:13.015057+00
hospital	starter	appointments	2026-06-16 22:26:13.015057+00
hospital	starter	doctors	2026-06-16 22:26:13.015057+00
hospital	starter	prescriptions	2026-06-16 22:26:13.015057+00
hospital	starter	clinic_billing	2026-06-16 22:26:13.015057+00
hospital	starter	medical_records	2026-06-16 22:26:13.015057+00
hotel_hospitality	starter	room_booking	2026-06-16 22:26:13.015057+00
hotel_hospitality	starter	housekeeping	2026-06-16 22:26:13.015057+00
hotel_hospitality	starter	checkin_checkout	2026-06-16 22:26:13.015057+00
hotel_hospitality	starter	hotel_management	2026-06-16 22:26:13.015057+00
hr_payroll	starter	hr_recruitment_management	2026-06-16 22:26:13.015057+00
hr_payroll	starter	hr_candidates	2026-06-16 22:26:13.015057+00
hr_payroll	starter	hr_jobs	2026-06-16 22:26:13.015057+00
law_firm	starter	law_firm_management	2026-06-16 22:26:13.015057+00
law_firm	starter	law_clients	2026-06-16 22:26:13.015057+00
law_firm	starter	law_cases	2026-06-16 22:26:13.015057+00
logistics_transport	starter	logistics_management	2026-06-16 22:26:13.015057+00
logistics_transport	starter	logistics_shipments	2026-06-16 22:26:13.015057+00
logistics_transport	starter	logistics_pickups	2026-06-16 22:26:13.015057+00
manufacturing	starter	bom	2026-06-16 22:26:13.015057+00
manufacturing	starter	production_orders	2026-06-16 22:26:13.015057+00
manufacturing	starter	quality_control	2026-06-16 22:26:13.015057+00
manufacturing	starter	manufacturing_management	2026-06-16 22:26:13.015057+00
media_marketing	starter	email_sms	2026-06-16 22:26:13.015057+00
ngo_nonprofit	starter	ngo_management	2026-06-16 22:26:13.015057+00
ngo_nonprofit	starter	ngo_donors	2026-06-16 22:26:13.015057+00
ngo_nonprofit	starter	ngo_donations	2026-06-16 22:26:13.015057+00
other_business	starter	crm	2026-06-16 22:26:13.015057+00
pharmacy	starter	pharmacy_management	2026-06-16 22:26:13.015057+00
pharmacy	starter	pharmacy_medicine_catalog	2026-06-16 22:26:13.015057+00
pharmacy	starter	pharmacy_inventory	2026-06-16 22:26:13.015057+00
professional_services	starter	professional_services_management	2026-06-16 22:26:13.015057+00
professional_services	starter	professional_services_clients	2026-06-16 22:26:13.015057+00
professional_services	starter	professional_services_projects	2026-06-16 22:26:13.015057+00
real_estate	starter	properties	2026-06-16 22:26:13.015057+00
real_estate	starter	leads_pipeline	2026-06-16 22:26:13.015057+00
real_estate	starter	rentals	2026-06-16 22:26:13.015057+00
real_estate	starter	real_estate_management	2026-06-16 22:26:13.015057+00
recruitment_agency	starter	hr_recruitment_management	2026-06-16 22:26:13.015057+00
recruitment_agency	starter	hr_candidates	2026-06-16 22:26:13.015057+00
recruitment_agency	starter	hr_jobs	2026-06-16 22:26:13.015057+00
restaurant_cafe	starter	restaurant_management	2026-06-16 22:26:13.015057+00
restaurant_cafe	starter	menu_items	2026-06-16 22:26:13.015057+00
restaurant_cafe	starter	tables_orders	2026-06-16 22:26:13.015057+00
restaurant_cafe	starter	kitchen_display	2026-06-16 22:26:13.015057+00
restaurant_cafe	starter	restaurant_billing	2026-06-16 22:26:13.015057+00
restaurant_cafe	starter	reservations	2026-06-16 22:26:13.015057+00
restaurant_cafe	starter	delivery_orders	2026-06-16 22:26:13.015057+00
retail_shop	starter	store_management	2026-06-16 22:26:13.015057+00
retail_shop	starter	products	2026-06-16 22:26:13.015057+00
retail_shop	starter	inventory	2026-06-16 22:26:13.015057+00
retail_shop	starter	sales_orders	2026-06-16 22:26:13.015057+00
retail_shop	starter	customers	2026-06-16 22:26:13.015057+00
retail_shop	starter	suppliers	2026-06-16 22:26:13.015057+00
retail_shop	starter	billing	2026-06-16 22:26:13.015057+00
retail_shop	starter	reports	2026-06-16 22:26:13.015057+00
salon_spa	starter	service_menu	2026-06-16 22:26:13.015057+00
salon_spa	starter	staff_scheduling	2026-06-16 22:26:13.015057+00
salon_spa	starter	memberships	2026-06-16 22:26:13.015057+00
salon_spa	starter	commission	2026-06-16 22:26:13.015057+00
salon_spa	starter	salon_management	2026-06-16 22:26:13.015057+00
school_college	starter	school_management	2026-06-16 22:26:13.015057+00
school_college	starter	students	2026-06-16 22:26:13.015057+00
school_college	starter	teachers	2026-06-16 22:26:13.015057+00
school_college	starter	classes_sections	2026-06-16 22:26:13.015057+00
school_college	starter	attendance	2026-06-16 22:26:13.015057+00
school_college	starter	fees	2026-06-16 22:26:13.015057+00
school_college	starter	exams_results	2026-06-16 22:26:13.015057+00
school_college	starter	timetable	2026-06-16 22:26:13.015057+00
school_college	starter	parents_portal	2026-06-16 22:26:13.015057+00
security_services	starter	rbac_roles	2026-06-16 22:26:13.015057+00
software_it	starter	professional_services_management	2026-06-16 22:26:13.015057+00
software_it	starter	professional_services_clients	2026-06-16 22:26:13.015057+00
software_it	starter	professional_services_projects	2026-06-16 22:26:13.015057+00
super_mart	starter	store_management	2026-06-16 22:26:13.015057+00
super_mart	starter	products	2026-06-16 22:26:13.015057+00
super_mart	starter	inventory	2026-06-16 22:26:13.015057+00
super_mart	starter	sales_orders	2026-06-16 22:26:13.015057+00
super_mart	starter	customers	2026-06-16 22:26:13.015057+00
super_mart	starter	suppliers	2026-06-16 22:26:13.015057+00
telecom_communication	starter	email_sms	2026-06-16 22:26:13.015057+00
travel_tourism	starter	travel_management	2026-06-16 22:26:13.015057+00
travel_tourism	starter	travel_packages	2026-06-16 22:26:13.015057+00
travel_tourism	starter	travel_bookings	2026-06-16 22:26:13.015057+00
wholesale_distribution	starter	store_management	2026-06-16 22:26:13.015057+00
wholesale_distribution	starter	products	2026-06-16 22:26:13.015057+00
wholesale_distribution	starter	inventory	2026-06-16 22:26:13.015057+00
wholesale_distribution	starter	sales_orders	2026-06-16 22:26:13.015057+00
wholesale_distribution	starter	customers	2026-06-16 22:26:13.015057+00
wholesale_distribution	starter	suppliers	2026-06-16 22:26:13.015057+00
wholesale_distribution	starter	billing	2026-06-16 22:26:13.015057+00
wholesale_distribution	starter	reports	2026-06-16 22:26:13.015057+00
accounting_tax	pro	accounting_tax_management	2026-06-16 22:26:13.015057+00
accounting_tax	pro	accounting_clients	2026-06-16 22:26:13.015057+00
accounting_tax	pro	accounting_bookkeeping	2026-06-16 22:26:13.015057+00
accounting_tax	pro	accounting_tax_returns	2026-06-16 22:26:13.015057+00
accounting_tax	pro	accounting_expenses	2026-06-16 22:26:13.015057+00
accounting_tax	pro	accounting_reports	2026-06-16 22:26:13.015057+00
agriculture	pro	agriculture_management	2026-06-16 22:26:13.015057+00
agriculture	pro	agriculture_fields	2026-06-16 22:26:13.015057+00
agriculture	pro	agriculture_crops	2026-06-16 22:26:13.015057+00
agriculture	pro	agriculture_livestock	2026-06-16 22:26:13.015057+00
agriculture	pro	agriculture_inputs	2026-06-16 22:26:13.015057+00
agriculture	pro	agriculture_harvest	2026-06-16 22:26:13.015057+00
auto_workshop	pro	auto_workshop_management	2026-06-16 22:26:13.015057+00
auto_workshop	pro	auto_workshop_jobs	2026-06-16 22:26:13.015057+00
auto_workshop	pro	auto_workshop_vehicles	2026-06-16 22:26:13.015057+00
auto_workshop	pro	auto_workshop_parts_inventory	2026-06-16 22:26:13.015057+00
auto_workshop	pro	auto_workshop_service_history	2026-06-16 22:26:13.015057+00
auto_workshop	pro	auto_workshop_estimates	2026-06-16 22:26:13.015057+00
cleaning_services	pro	repair_management	2026-06-16 22:26:13.015057+00
cleaning_services	pro	tickets	2026-06-16 22:26:13.015057+00
cleaning_services	pro	job_cards	2026-06-16 22:26:13.015057+00
cleaning_services	pro	field_staff	2026-06-16 22:26:13.015057+00
clinic	pro	clinic_management	2026-06-16 22:26:13.015057+00
clinic	pro	patients	2026-06-16 22:26:13.015057+00
clinic	pro	appointments	2026-06-16 22:26:13.015057+00
clinic	pro	doctors	2026-06-16 22:26:13.015057+00
clinic	pro	prescriptions	2026-06-16 22:26:13.015057+00
clinic	pro	clinic_billing	2026-06-16 22:26:13.015057+00
clinic	pro	medical_records	2026-06-16 22:26:13.015057+00
clinic	pro	lab_reports	2026-06-16 22:26:13.015057+00
clinic	pro	pharmacy_stock	2026-06-16 22:26:13.015057+00
clinic	pro	patient_portal	2026-06-16 22:26:13.015057+00
clinic	pro	queue_management	2026-06-16 22:26:13.015057+00
clinic	pro	clinic_medical_records	2026-06-16 22:26:13.015057+00
clinic	pro	clinic_lab_reports	2026-06-16 22:26:13.015057+00
clinic	pro	clinic_pharmacy_stock	2026-06-16 22:26:13.015057+00
coaching_center	pro	school_management	2026-06-16 22:26:13.015057+00
coaching_center	pro	students	2026-06-16 22:26:13.015057+00
coaching_center	pro	teachers	2026-06-16 22:26:13.015057+00
coaching_center	pro	classes_sections	2026-06-16 22:26:13.015057+00
coaching_center	pro	attendance	2026-06-16 22:26:13.015057+00
coaching_center	pro	fees	2026-06-16 22:26:13.015057+00
coaching_center	pro	exams_results	2026-06-16 22:26:13.015057+00
coaching_center	pro	timetable	2026-06-16 22:26:13.015057+00
coaching_center	pro	parents_portal	2026-06-16 22:26:13.015057+00
coaching_center	pro	library	2026-06-16 22:26:13.015057+00
coaching_center	pro	admissions	2026-06-16 22:26:13.015057+00
coaching_center	pro	grades	2026-06-16 22:26:13.015057+00
coaching_center	pro	transport	2026-06-16 22:26:13.015057+00
coaching_center	pro	hostel	2026-06-16 22:26:13.015057+00
coaching_center	pro	lms	2026-06-16 22:26:13.015057+00
coaching_center	pro	school_admissions	2026-06-16 22:26:13.015057+00
coaching_center	pro	school_grades	2026-06-16 22:26:13.015057+00
construction	pro	construction_management	2026-06-16 22:26:13.015057+00
construction	pro	construction_projects	2026-06-16 22:26:13.015057+00
construction	pro	construction_materials	2026-06-16 22:26:13.015057+00
construction	pro	construction_estimates	2026-06-16 22:26:13.015057+00
construction	pro	construction_work_orders	2026-06-16 22:26:13.015057+00
construction	pro	construction_contractors	2026-06-16 22:26:13.015057+00
dental	pro	treatment_plans	2026-06-16 22:26:13.015057+00
dental	pro	dental_management	2026-06-16 22:26:13.015057+00
dental	pro	dental_charting	2026-06-16 22:26:13.015057+00
dental	pro	dental_treatment_plans	2026-06-16 22:26:13.015057+00
dental	pro	dental_billing	2026-06-16 22:26:13.015057+00
dental	pro	dental_lab_cases	2026-06-16 22:26:13.015057+00
dental	pro	dental_xray_records	2026-06-16 22:26:13.015057+00
ecommerce	pro	online_storefront	2026-06-16 22:26:13.015057+00
ecommerce	pro	shipping_delivery	2026-06-16 22:26:13.015057+00
ecommerce	pro	ecommerce_management	2026-06-16 22:26:13.015057+00
ecommerce	pro	ecommerce_storefront	2026-06-16 22:26:13.015057+00
ecommerce	pro	ecommerce_orders	2026-06-16 22:26:13.015057+00
ecommerce	pro	ecommerce_products	2026-06-16 22:26:13.015057+00
ecommerce	pro	ecommerce_cart_checkout	2026-06-16 22:26:13.015057+00
ecommerce	pro	ecommerce_shipping	2026-06-16 22:26:13.015057+00
ecommerce	pro	ecommerce_coupons	2026-06-16 22:26:13.015057+00
event_management	pro	event_management	2026-06-16 22:26:13.015057+00
event_management	pro	event_clients	2026-06-16 22:26:13.015057+00
event_management	pro	event_bookings	2026-06-16 22:26:13.015057+00
event_management	pro	event_venues	2026-06-16 22:26:13.015057+00
event_management	pro	event_vendor_management	2026-06-16 22:26:13.015057+00
event_management	pro	event_budgeting	2026-06-16 22:26:13.015057+00
gym_fitness	pro	gym_management	2026-06-16 22:26:13.015057+00
gym_fitness	pro	trainer_schedule	2026-06-16 22:26:13.015057+00
gym_fitness	pro	fitness_memberships	2026-06-16 22:26:13.015057+00
home_services	pro	repair_management	2026-06-16 22:26:13.015057+00
home_services	pro	tickets	2026-06-16 22:26:13.015057+00
home_services	pro	job_cards	2026-06-16 22:26:13.015057+00
home_services	pro	field_staff	2026-06-16 22:26:13.015057+00
hospital	pro	clinic_management	2026-06-16 22:26:13.015057+00
hospital	pro	patients	2026-06-16 22:26:13.015057+00
hospital	pro	appointments	2026-06-16 22:26:13.015057+00
hospital	pro	doctors	2026-06-16 22:26:13.015057+00
hospital	pro	prescriptions	2026-06-16 22:26:13.015057+00
hospital	pro	clinic_billing	2026-06-16 22:26:13.015057+00
hospital	pro	medical_records	2026-06-16 22:26:13.015057+00
hospital	pro	lab_reports	2026-06-16 22:26:13.015057+00
hospital	pro	pharmacy_stock	2026-06-16 22:26:13.015057+00
hospital	pro	patient_portal	2026-06-16 22:26:13.015057+00
hospital	pro	queue_management	2026-06-16 22:26:13.015057+00
hospital	pro	clinic_medical_records	2026-06-16 22:26:13.015057+00
hospital	pro	clinic_lab_reports	2026-06-16 22:26:13.015057+00
hospital	pro	clinic_pharmacy_stock	2026-06-16 22:26:13.015057+00
hotel_hospitality	pro	room_booking	2026-06-16 22:26:13.015057+00
hotel_hospitality	pro	housekeeping	2026-06-16 22:26:13.015057+00
hotel_hospitality	pro	checkin_checkout	2026-06-16 22:26:13.015057+00
hotel_hospitality	pro	hotel_management	2026-06-16 22:26:13.015057+00
hotel_hospitality	pro	hotel_room_booking	2026-06-16 22:26:13.015057+00
hotel_hospitality	pro	hotel_checkin_checkout	2026-06-16 22:26:13.015057+00
hotel_hospitality	pro	hotel_room_status	2026-06-16 22:26:13.015057+00
hotel_hospitality	pro	hotel_housekeeping	2026-06-16 22:26:13.015057+00
hr_payroll	pro	hr_recruitment_management	2026-06-16 22:26:13.015057+00
hr_payroll	pro	hr_candidates	2026-06-16 22:26:13.015057+00
hr_payroll	pro	hr_jobs	2026-06-16 22:26:13.015057+00
hr_payroll	pro	hr_applications	2026-06-16 22:26:13.015057+00
hr_payroll	pro	hr_interviews	2026-06-16 22:26:13.015057+00
hr_payroll	pro	hr_clients	2026-06-16 22:26:13.015057+00
law_firm	pro	law_firm_management	2026-06-16 22:26:13.015057+00
law_firm	pro	law_clients	2026-06-16 22:26:13.015057+00
law_firm	pro	law_cases	2026-06-16 22:26:13.015057+00
law_firm	pro	law_hearings	2026-06-16 22:26:13.015057+00
law_firm	pro	law_documents	2026-06-16 22:26:13.015057+00
law_firm	pro	law_billing	2026-06-16 22:26:13.015057+00
logistics_transport	pro	logistics_management	2026-06-16 22:26:13.015057+00
logistics_transport	pro	logistics_shipments	2026-06-16 22:26:13.015057+00
logistics_transport	pro	logistics_pickups	2026-06-16 22:26:13.015057+00
logistics_transport	pro	logistics_delivery_tracking	2026-06-16 22:26:13.015057+00
logistics_transport	pro	logistics_driver_management	2026-06-16 22:26:13.015057+00
logistics_transport	pro	logistics_vehicle_fleet	2026-06-16 22:26:13.015057+00
manufacturing	pro	bom	2026-06-16 22:26:13.015057+00
manufacturing	pro	production_orders	2026-06-16 22:26:13.015057+00
manufacturing	pro	quality_control	2026-06-16 22:26:13.015057+00
manufacturing	pro	manufacturing_management	2026-06-16 22:26:13.015057+00
manufacturing	pro	manufacturing_bom	2026-06-16 22:26:13.015057+00
manufacturing	pro	manufacturing_production_orders	2026-06-16 22:26:13.015057+00
manufacturing	pro	manufacturing_workstations	2026-06-16 22:26:13.015057+00
manufacturing	pro	manufacturing_quality_control	2026-06-16 22:26:13.015057+00
media_marketing	pro	email_sms	2026-06-16 22:26:13.015057+00
media_marketing	pro	whatsapp	2026-06-16 22:26:13.015057+00
ngo_nonprofit	pro	ngo_management	2026-06-16 22:26:13.015057+00
ngo_nonprofit	pro	ngo_donors	2026-06-16 22:26:13.015057+00
ngo_nonprofit	pro	ngo_donations	2026-06-16 22:26:13.015057+00
ngo_nonprofit	pro	ngo_campaigns	2026-06-16 22:26:13.015057+00
ngo_nonprofit	pro	ngo_beneficiaries	2026-06-16 22:26:13.015057+00
ngo_nonprofit	pro	ngo_volunteers	2026-06-16 22:26:13.015057+00
other_business	pro	crm	2026-06-16 22:26:13.015057+00
other_business	pro	website	2026-06-16 22:26:13.015057+00
pharmacy	pro	pharmacy_management	2026-06-16 22:26:13.015057+00
pharmacy	pro	pharmacy_medicine_catalog	2026-06-16 22:26:13.015057+00
pharmacy	pro	pharmacy_inventory	2026-06-16 22:26:13.015057+00
pharmacy	pro	pharmacy_batch_expiry	2026-06-16 22:26:13.015057+00
pharmacy	pro	pharmacy_prescription_sales	2026-06-16 22:26:13.015057+00
pharmacy	pro	pharmacy_supplier_orders	2026-06-16 22:26:13.015057+00
professional_services	pro	professional_services_management	2026-06-16 22:26:13.015057+00
professional_services	pro	professional_services_clients	2026-06-16 22:26:13.015057+00
professional_services	pro	professional_services_projects	2026-06-16 22:26:13.015057+00
professional_services	pro	professional_services_proposals	2026-06-16 22:26:13.015057+00
professional_services	pro	professional_services_contracts	2026-06-16 22:26:13.015057+00
professional_services	pro	professional_services_time_tracking	2026-06-16 22:26:13.015057+00
real_estate	pro	properties	2026-06-16 22:26:13.015057+00
real_estate	pro	leads_pipeline	2026-06-16 22:26:13.015057+00
real_estate	pro	rentals	2026-06-16 22:26:13.015057+00
real_estate	pro	real_estate_management	2026-06-16 22:26:13.015057+00
real_estate	pro	real_estate_properties	2026-06-16 22:26:13.015057+00
real_estate	pro	real_estate_leads	2026-06-16 22:26:13.015057+00
real_estate	pro	real_estate_rentals	2026-06-16 22:26:13.015057+00
real_estate	pro	real_estate_sales	2026-06-16 22:26:13.015057+00
recruitment_agency	pro	hr_recruitment_management	2026-06-16 22:26:13.015057+00
recruitment_agency	pro	hr_candidates	2026-06-16 22:26:13.015057+00
recruitment_agency	pro	hr_jobs	2026-06-16 22:26:13.015057+00
recruitment_agency	pro	hr_applications	2026-06-16 22:26:13.015057+00
recruitment_agency	pro	hr_interviews	2026-06-16 22:26:13.015057+00
recruitment_agency	pro	hr_clients	2026-06-16 22:26:13.015057+00
restaurant_cafe	pro	restaurant_management	2026-06-16 22:26:13.015057+00
restaurant_cafe	pro	menu_items	2026-06-16 22:26:13.015057+00
restaurant_cafe	pro	tables_orders	2026-06-16 22:26:13.015057+00
restaurant_cafe	pro	kitchen_display	2026-06-16 22:26:13.015057+00
restaurant_cafe	pro	restaurant_billing	2026-06-16 22:26:13.015057+00
restaurant_cafe	pro	reservations	2026-06-16 22:26:13.015057+00
restaurant_cafe	pro	delivery_orders	2026-06-16 22:26:13.015057+00
restaurant_cafe	pro	food_inventory	2026-06-16 22:26:13.015057+00
restaurant_cafe	pro	waiter_app	2026-06-16 22:26:13.015057+00
restaurant_cafe	pro	recipe_costing	2026-06-16 22:26:13.015057+00
restaurant_cafe	pro	restaurant_reservations	2026-06-16 22:26:13.015057+00
restaurant_cafe	pro	restaurant_delivery_orders	2026-06-16 22:26:13.015057+00
restaurant_cafe	pro	restaurant_food_inventory	2026-06-16 22:26:13.015057+00
retail_shop	pro	store_management	2026-06-16 22:26:13.015057+00
retail_shop	pro	products	2026-06-16 22:26:13.015057+00
retail_shop	pro	inventory	2026-06-16 22:26:13.015057+00
retail_shop	pro	sales_orders	2026-06-16 22:26:13.015057+00
retail_shop	pro	customers	2026-06-16 22:26:13.015057+00
retail_shop	pro	suppliers	2026-06-16 22:26:13.015057+00
retail_shop	pro	billing	2026-06-16 22:26:13.015057+00
retail_shop	pro	reports	2026-06-16 22:26:13.015057+00
retail_shop	pro	pos_terminal	2026-06-16 22:26:13.015057+00
retail_shop	pro	barcode_labeling	2026-06-16 22:26:13.015057+00
retail_shop	pro	stock_transfer	2026-06-16 22:26:13.015057+00
retail_shop	pro	purchase_orders	2026-06-16 22:26:13.015057+00
retail_shop	pro	customer_loyalty	2026-06-16 22:26:13.015057+00
retail_shop	pro	store_pos_terminal	2026-06-16 22:26:13.015057+00
retail_shop	pro	store_barcode_labeling	2026-06-16 22:26:13.015057+00
salon_spa	pro	service_menu	2026-06-16 22:26:13.015057+00
salon_spa	pro	staff_scheduling	2026-06-16 22:26:13.015057+00
salon_spa	pro	memberships	2026-06-16 22:26:13.015057+00
salon_spa	pro	commission	2026-06-16 22:26:13.015057+00
salon_spa	pro	salon_management	2026-06-16 22:26:13.015057+00
salon_spa	pro	salon_service_menu	2026-06-16 22:26:13.015057+00
salon_spa	pro	salon_booking	2026-06-16 22:26:13.015057+00
salon_spa	pro	salon_staff_scheduling	2026-06-16 22:26:13.015057+00
salon_spa	pro	salon_memberships	2026-06-16 22:26:13.015057+00
school_college	pro	school_management	2026-06-16 22:26:13.015057+00
school_college	pro	students	2026-06-16 22:26:13.015057+00
school_college	pro	teachers	2026-06-16 22:26:13.015057+00
school_college	pro	classes_sections	2026-06-16 22:26:13.015057+00
school_college	pro	attendance	2026-06-16 22:26:13.015057+00
school_college	pro	fees	2026-06-16 22:26:13.015057+00
school_college	pro	exams_results	2026-06-16 22:26:13.015057+00
school_college	pro	timetable	2026-06-16 22:26:13.015057+00
school_college	pro	parents_portal	2026-06-16 22:26:13.015057+00
school_college	pro	library	2026-06-16 22:26:13.015057+00
school_college	pro	admissions	2026-06-16 22:26:13.015057+00
school_college	pro	grades	2026-06-16 22:26:13.015057+00
school_college	pro	transport	2026-06-16 22:26:13.015057+00
school_college	pro	hostel	2026-06-16 22:26:13.015057+00
school_college	pro	lms	2026-06-16 22:26:13.015057+00
school_college	pro	school_admissions	2026-06-16 22:26:13.015057+00
school_college	pro	school_grades	2026-06-16 22:26:13.015057+00
security_services	pro	rbac_roles	2026-06-16 22:26:13.015057+00
security_services	pro	audit_logs	2026-06-16 22:26:13.015057+00
software_it	pro	professional_services_management	2026-06-16 22:26:13.015057+00
software_it	pro	professional_services_clients	2026-06-16 22:26:13.015057+00
software_it	pro	professional_services_projects	2026-06-16 22:26:13.015057+00
software_it	pro	professional_services_proposals	2026-06-16 22:26:13.015057+00
software_it	pro	professional_services_contracts	2026-06-16 22:26:13.015057+00
software_it	pro	professional_services_time_tracking	2026-06-16 22:26:13.015057+00
super_mart	pro	store_management	2026-06-16 22:26:13.015057+00
super_mart	pro	products	2026-06-16 22:26:13.015057+00
super_mart	pro	inventory	2026-06-16 22:26:13.015057+00
super_mart	pro	sales_orders	2026-06-16 22:26:13.015057+00
super_mart	pro	customers	2026-06-16 22:26:13.015057+00
super_mart	pro	suppliers	2026-06-16 22:26:13.015057+00
super_mart	pro	billing	2026-06-16 22:26:13.015057+00
super_mart	pro	reports	2026-06-16 22:26:13.015057+00
super_mart	pro	pos_terminal	2026-06-16 22:26:13.015057+00
super_mart	pro	barcode_labeling	2026-06-16 22:26:13.015057+00
super_mart	pro	stock_transfer	2026-06-16 22:26:13.015057+00
super_mart	pro	purchase_orders	2026-06-16 22:26:13.015057+00
super_mart	pro	customer_loyalty	2026-06-16 22:26:13.015057+00
super_mart	pro	store_pos_terminal	2026-06-16 22:26:13.015057+00
super_mart	pro	store_barcode_labeling	2026-06-16 22:26:13.015057+00
telecom_communication	pro	email_sms	2026-06-16 22:26:13.015057+00
telecom_communication	pro	whatsapp	2026-06-16 22:26:13.015057+00
travel_tourism	pro	travel_management	2026-06-16 22:26:13.015057+00
travel_tourism	pro	travel_packages	2026-06-16 22:26:13.015057+00
travel_tourism	pro	travel_bookings	2026-06-16 22:26:13.015057+00
travel_tourism	pro	travel_customers	2026-06-16 22:26:13.015057+00
travel_tourism	pro	travel_visa_documents	2026-06-16 22:26:13.015057+00
travel_tourism	pro	travel_flight_records	2026-06-16 22:26:13.015057+00
wholesale_distribution	pro	store_management	2026-06-16 22:26:13.015057+00
wholesale_distribution	pro	products	2026-06-16 22:26:13.015057+00
wholesale_distribution	pro	inventory	2026-06-16 22:26:13.015057+00
wholesale_distribution	pro	sales_orders	2026-06-16 22:26:13.015057+00
wholesale_distribution	pro	customers	2026-06-16 22:26:13.015057+00
wholesale_distribution	pro	suppliers	2026-06-16 22:26:13.015057+00
wholesale_distribution	pro	billing	2026-06-16 22:26:13.015057+00
wholesale_distribution	pro	reports	2026-06-16 22:26:13.015057+00
wholesale_distribution	pro	pos_terminal	2026-06-16 22:26:13.015057+00
wholesale_distribution	pro	barcode_labeling	2026-06-16 22:26:13.015057+00
wholesale_distribution	pro	stock_transfer	2026-06-16 22:26:13.015057+00
wholesale_distribution	pro	purchase_orders	2026-06-16 22:26:13.015057+00
wholesale_distribution	pro	customer_loyalty	2026-06-16 22:26:13.015057+00
wholesale_distribution	pro	store_pos_terminal	2026-06-16 22:26:13.015057+00
wholesale_distribution	pro	store_barcode_labeling	2026-06-16 22:26:13.015057+00
wholesale_distribution	enterprise	pos_terminal	2026-06-16 22:26:13.015057+00
super_mart	enterprise	pos_terminal	2026-06-16 22:26:13.015057+00
retail_shop	enterprise	pos_terminal	2026-06-16 22:26:13.015057+00
wholesale_distribution	enterprise	barcode_labeling	2026-06-16 22:26:13.015057+00
super_mart	enterprise	barcode_labeling	2026-06-16 22:26:13.015057+00
retail_shop	enterprise	barcode_labeling	2026-06-16 22:26:13.015057+00
wholesale_distribution	enterprise	stock_transfer	2026-06-16 22:26:13.015057+00
super_mart	enterprise	stock_transfer	2026-06-16 22:26:13.015057+00
retail_shop	enterprise	stock_transfer	2026-06-16 22:26:13.015057+00
wholesale_distribution	enterprise	purchase_orders	2026-06-16 22:26:13.015057+00
super_mart	enterprise	purchase_orders	2026-06-16 22:26:13.015057+00
retail_shop	enterprise	purchase_orders	2026-06-16 22:26:13.015057+00
wholesale_distribution	enterprise	customer_loyalty	2026-06-16 22:26:13.015057+00
super_mart	enterprise	customer_loyalty	2026-06-16 22:26:13.015057+00
retail_shop	enterprise	customer_loyalty	2026-06-16 22:26:13.015057+00
ecommerce	enterprise	online_storefront	2026-06-16 22:26:13.015057+00
ecommerce	enterprise	shipping_delivery	2026-06-16 22:26:13.015057+00
restaurant_cafe	enterprise	reservations	2026-06-16 22:26:13.015057+00
restaurant_cafe	enterprise	delivery_orders	2026-06-16 22:26:13.015057+00
restaurant_cafe	enterprise	food_inventory	2026-06-16 22:26:13.015057+00
restaurant_cafe	enterprise	waiter_app	2026-06-16 22:26:13.015057+00
restaurant_cafe	enterprise	recipe_costing	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	school_management	2026-06-16 22:26:13.015057+00
school_college	enterprise	school_management	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	students	2026-06-16 22:26:13.015057+00
school_college	enterprise	students	2026-06-16 22:26:13.015057+00
hospital	enterprise	clinic_medical_records	2026-06-16 22:26:13.015057+00
clinic	enterprise	clinic_medical_records	2026-06-16 22:26:13.015057+00
ecommerce	enterprise	ecommerce_cart_checkout	2026-06-16 22:26:13.015057+00
ecommerce	enterprise	ecommerce_shipping	2026-06-16 22:26:13.015057+00
ecommerce	enterprise	ecommerce_coupons	2026-06-16 22:26:13.015057+00
ecommerce	enterprise	ecommerce_reviews	2026-06-16 22:26:13.015057+00
ecommerce	enterprise	ecommerce_marketplace	2026-06-16 22:26:13.015057+00
ecommerce	enterprise	ecommerce_abandoned_cart	2026-06-16 22:26:13.015057+00
manufacturing	enterprise	manufacturing_material_planning	2026-06-16 22:26:13.015057+00
manufacturing	enterprise	manufacturing_costing	2026-06-16 22:26:13.015057+00
manufacturing	enterprise	manufacturing_maintenance	2026-06-16 22:26:13.015057+00
real_estate	enterprise	real_estate_sales	2026-06-16 22:26:13.015057+00
software_it	enterprise	professional_services_management	2026-06-16 22:26:13.015057+00
professional_services	enterprise	professional_services_management	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	teachers	2026-06-16 22:26:13.015057+00
school_college	enterprise	teachers	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	classes_sections	2026-06-16 22:26:13.015057+00
school_college	enterprise	classes_sections	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	attendance	2026-06-16 22:26:13.015057+00
school_college	enterprise	attendance	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	fees	2026-06-16 22:26:13.015057+00
school_college	enterprise	fees	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	exams_results	2026-06-16 22:26:13.015057+00
school_college	enterprise	exams_results	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	grades	2026-06-16 22:26:13.015057+00
school_college	enterprise	grades	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	transport	2026-06-16 22:26:13.015057+00
school_college	enterprise	transport	2026-06-16 22:26:13.015057+00
hospital	enterprise	clinic_doctor_schedule	2026-06-16 22:26:13.015057+00
clinic	enterprise	clinic_doctor_schedule	2026-06-16 22:26:13.015057+00
hospital	enterprise	clinic_vitals	2026-06-16 22:26:13.015057+00
clinic	enterprise	clinic_vitals	2026-06-16 22:26:13.015057+00
hospital	enterprise	clinic_insurance_claims	2026-06-16 22:26:13.015057+00
clinic	enterprise	clinic_insurance_claims	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	lms	2026-06-16 22:26:13.015057+00
school_college	enterprise	lms	2026-06-16 22:26:13.015057+00
hospital	enterprise	medical_records	2026-06-16 22:26:13.015057+00
clinic	enterprise	medical_records	2026-06-16 22:26:13.015057+00
hospital	enterprise	lab_reports	2026-06-16 22:26:13.015057+00
clinic	enterprise	lab_reports	2026-06-16 22:26:13.015057+00
dental	enterprise	dental_management	2026-06-16 22:26:13.015057+00
hospital	enterprise	patient_portal	2026-06-16 22:26:13.015057+00
clinic	enterprise	patient_portal	2026-06-16 22:26:13.015057+00
dental	enterprise	dental_charting	2026-06-16 22:26:13.015057+00
dental	enterprise	dental_treatment_plans	2026-06-16 22:26:13.015057+00
restaurant_cafe	enterprise	restaurant_recipe_costing	2026-06-16 22:26:13.015057+00
restaurant_cafe	enterprise	restaurant_floor_plan	2026-06-16 22:26:13.015057+00
restaurant_cafe	enterprise	restaurant_modifiers_addons	2026-06-16 22:26:13.015057+00
restaurant_cafe	enterprise	restaurant_shift_cash	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	school_admissions	2026-06-16 22:26:13.015057+00
school_college	enterprise	school_admissions	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	school_grades	2026-06-16 22:26:13.015057+00
school_college	enterprise	school_grades	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	school_transport	2026-06-16 22:26:13.015057+00
school_college	enterprise	school_transport	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	school_hostel	2026-06-16 22:26:13.015057+00
school_college	enterprise	school_hostel	2026-06-16 22:26:13.015057+00
dental	enterprise	dental_lab_cases	2026-06-16 22:26:13.015057+00
dental	enterprise	dental_xray_records	2026-06-16 22:26:13.015057+00
hospital	enterprise	queue_management	2026-06-16 22:26:13.015057+00
clinic	enterprise	queue_management	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	timetable	2026-06-16 22:26:13.015057+00
school_college	enterprise	timetable	2026-06-16 22:26:13.015057+00
wholesale_distribution	enterprise	store_pos_terminal	2026-06-16 22:26:13.015057+00
super_mart	enterprise	store_pos_terminal	2026-06-16 22:26:13.015057+00
retail_shop	enterprise	store_pos_terminal	2026-06-16 22:26:13.015057+00
real_estate	enterprise	real_estate_properties	2026-06-16 22:26:13.015057+00
real_estate	enterprise	real_estate_leads	2026-06-16 22:26:13.015057+00
real_estate	enterprise	real_estate_rentals	2026-06-16 22:26:13.015057+00
pharmacy	enterprise	pharmacy_compliance_reports	2026-06-16 22:26:13.015057+00
logistics_transport	enterprise	logistics_management	2026-06-16 22:26:13.015057+00
logistics_transport	enterprise	logistics_shipments	2026-06-16 22:26:13.015057+00
logistics_transport	enterprise	logistics_pickups	2026-06-16 22:26:13.015057+00
software_it	enterprise	professional_services_clients	2026-06-16 22:26:13.015057+00
professional_services	enterprise	professional_services_clients	2026-06-16 22:26:13.015057+00
auto_workshop	enterprise	auto_workshop_mechanics	2026-06-16 22:26:13.015057+00
auto_workshop	enterprise	auto_workshop_billing	2026-06-16 22:26:13.015057+00
software_it	enterprise	professional_services_time_tracking	2026-06-16 22:26:13.015057+00
professional_services	enterprise	professional_services_time_tracking	2026-06-16 22:26:13.015057+00
software_it	enterprise	professional_services_invoicing	2026-06-16 22:26:13.015057+00
professional_services	enterprise	professional_services_invoicing	2026-06-16 22:26:13.015057+00
dental	enterprise	treatment_plans	2026-06-16 22:26:13.015057+00
ngo_nonprofit	enterprise	ngo_management	2026-06-16 22:26:13.015057+00
security_services	enterprise	rbac_roles	2026-06-16 22:26:13.015057+00
security_services	enterprise	audit_logs	2026-06-16 22:26:13.015057+00
wholesale_distribution	enterprise	store_management	2026-06-16 22:26:13.015057+00
super_mart	enterprise	store_management	2026-06-16 22:26:13.015057+00
retail_shop	enterprise	store_management	2026-06-16 22:26:13.015057+00
salon_spa	enterprise	salon_management	2026-06-16 22:26:13.015057+00
hotel_hospitality	enterprise	hotel_deposits	2026-06-16 22:26:13.015057+00
pharmacy	enterprise	pharmacy_supplier_orders	2026-06-16 22:26:13.015057+00
pharmacy	enterprise	pharmacy_low_stock_alerts	2026-06-16 22:26:13.015057+00
logistics_transport	enterprise	logistics_delivery_tracking	2026-06-16 22:26:13.015057+00
logistics_transport	enterprise	logistics_driver_management	2026-06-16 22:26:13.015057+00
logistics_transport	enterprise	logistics_vehicle_fleet	2026-06-16 22:26:13.015057+00
logistics_transport	enterprise	logistics_cod_collection	2026-06-16 22:26:13.015057+00
logistics_transport	enterprise	logistics_route_planning	2026-06-16 22:26:13.015057+00
construction	enterprise	construction_management	2026-06-16 22:26:13.015057+00
construction	enterprise	construction_projects	2026-06-16 22:26:13.015057+00
construction	enterprise	construction_materials	2026-06-16 22:26:13.015057+00
construction	enterprise	construction_estimates	2026-06-16 22:26:13.015057+00
construction	enterprise	construction_work_orders	2026-06-16 22:26:13.015057+00
construction	enterprise	construction_contractors	2026-06-16 22:26:13.015057+00
construction	enterprise	construction_site_attendance	2026-06-16 22:26:13.015057+00
construction	enterprise	construction_progress_reports	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	parents_portal	2026-06-16 22:26:13.015057+00
school_college	enterprise	parents_portal	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	library	2026-06-16 22:26:13.015057+00
school_college	enterprise	library	2026-06-16 22:26:13.015057+00
restaurant_cafe	enterprise	menu_items	2026-06-16 22:26:13.015057+00
restaurant_cafe	enterprise	tables_orders	2026-06-16 22:26:13.015057+00
restaurant_cafe	enterprise	kitchen_display	2026-06-16 22:26:13.015057+00
restaurant_cafe	enterprise	restaurant_billing	2026-06-16 22:26:13.015057+00
hospital	enterprise	patients	2026-06-16 22:26:13.015057+00
clinic	enterprise	patients	2026-06-16 22:26:13.015057+00
hospital	enterprise	appointments	2026-06-16 22:26:13.015057+00
clinic	enterprise	appointments	2026-06-16 22:26:13.015057+00
other_business	enterprise	crm	2026-06-16 22:26:13.015057+00
other_business	enterprise	website	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	hostel	2026-06-16 22:26:13.015057+00
school_college	enterprise	hostel	2026-06-16 22:26:13.015057+00
wholesale_distribution	enterprise	store_barcode_labeling	2026-06-16 22:26:13.015057+00
super_mart	enterprise	store_barcode_labeling	2026-06-16 22:26:13.015057+00
retail_shop	enterprise	store_barcode_labeling	2026-06-16 22:26:13.015057+00
wholesale_distribution	enterprise	store_stock_transfer	2026-06-16 22:26:13.015057+00
super_mart	enterprise	store_stock_transfer	2026-06-16 22:26:13.015057+00
retail_shop	enterprise	store_stock_transfer	2026-06-16 22:26:13.015057+00
wholesale_distribution	enterprise	store_purchase_orders	2026-06-16 22:26:13.015057+00
super_mart	enterprise	store_purchase_orders	2026-06-16 22:26:13.015057+00
retail_shop	enterprise	store_purchase_orders	2026-06-16 22:26:13.015057+00
wholesale_distribution	enterprise	store_customer_loyalty	2026-06-16 22:26:13.015057+00
super_mart	enterprise	store_customer_loyalty	2026-06-16 22:26:13.015057+00
retail_shop	enterprise	store_customer_loyalty	2026-06-16 22:26:13.015057+00
wholesale_distribution	enterprise	store_returns_refunds	2026-06-16 22:26:13.015057+00
super_mart	enterprise	store_returns_refunds	2026-06-16 22:26:13.015057+00
retail_shop	enterprise	store_returns_refunds	2026-06-16 22:26:13.015057+00
wholesale_distribution	enterprise	store_price_lists	2026-06-16 22:26:13.015057+00
super_mart	enterprise	store_price_lists	2026-06-16 22:26:13.015057+00
retail_shop	enterprise	store_price_lists	2026-06-16 22:26:13.015057+00
telecom_communication	enterprise	email_sms	2026-06-16 22:26:13.015057+00
media_marketing	enterprise	email_sms	2026-06-16 22:26:13.015057+00
telecom_communication	enterprise	whatsapp	2026-06-16 22:26:13.015057+00
media_marketing	enterprise	whatsapp	2026-06-16 22:26:13.015057+00
wholesale_distribution	enterprise	store_low_stock_alerts	2026-06-16 22:26:13.015057+00
super_mart	enterprise	store_low_stock_alerts	2026-06-16 22:26:13.015057+00
retail_shop	enterprise	store_low_stock_alerts	2026-06-16 22:26:13.015057+00
restaurant_cafe	enterprise	restaurant_reservations	2026-06-16 22:26:13.015057+00
restaurant_cafe	enterprise	restaurant_delivery_orders	2026-06-16 22:26:13.015057+00
restaurant_cafe	enterprise	restaurant_food_inventory	2026-06-16 22:26:13.015057+00
restaurant_cafe	enterprise	restaurant_waiter_app	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	school_lms	2026-06-16 22:26:13.015057+00
school_college	enterprise	school_lms	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	school_homework	2026-06-16 22:26:13.015057+00
school_college	enterprise	school_homework	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	school_online_classes	2026-06-16 22:26:13.015057+00
school_college	enterprise	school_online_classes	2026-06-16 22:26:13.015057+00
hospital	enterprise	doctors	2026-06-16 22:26:13.015057+00
clinic	enterprise	doctors	2026-06-16 22:26:13.015057+00
hospital	enterprise	prescriptions	2026-06-16 22:26:13.015057+00
clinic	enterprise	prescriptions	2026-06-16 22:26:13.015057+00
hospital	enterprise	clinic_billing	2026-06-16 22:26:13.015057+00
clinic	enterprise	clinic_billing	2026-06-16 22:26:13.015057+00
hospital	enterprise	clinic_lab_reports	2026-06-16 22:26:13.015057+00
clinic	enterprise	clinic_lab_reports	2026-06-16 22:26:13.015057+00
hospital	enterprise	clinic_pharmacy_stock	2026-06-16 22:26:13.015057+00
clinic	enterprise	clinic_pharmacy_stock	2026-06-16 22:26:13.015057+00
hospital	enterprise	clinic_patient_portal	2026-06-16 22:26:13.015057+00
clinic	enterprise	clinic_patient_portal	2026-06-16 22:26:13.015057+00
dental	enterprise	dental_patient_recall	2026-06-16 22:26:13.015057+00
dental	enterprise	dental_orthodontics	2026-06-16 22:26:13.015057+00
wholesale_distribution	enterprise	products	2026-06-16 22:26:13.015057+00
super_mart	enterprise	products	2026-06-16 22:26:13.015057+00
retail_shop	enterprise	products	2026-06-16 22:26:13.015057+00
wholesale_distribution	enterprise	inventory	2026-06-16 22:26:13.015057+00
super_mart	enterprise	inventory	2026-06-16 22:26:13.015057+00
retail_shop	enterprise	inventory	2026-06-16 22:26:13.015057+00
wholesale_distribution	enterprise	sales_orders	2026-06-16 22:26:13.015057+00
super_mart	enterprise	sales_orders	2026-06-16 22:26:13.015057+00
retail_shop	enterprise	sales_orders	2026-06-16 22:26:13.015057+00
wholesale_distribution	enterprise	customers	2026-06-16 22:26:13.015057+00
super_mart	enterprise	customers	2026-06-16 22:26:13.015057+00
retail_shop	enterprise	customers	2026-06-16 22:26:13.015057+00
wholesale_distribution	enterprise	suppliers	2026-06-16 22:26:13.015057+00
super_mart	enterprise	suppliers	2026-06-16 22:26:13.015057+00
retail_shop	enterprise	suppliers	2026-06-16 22:26:13.015057+00
wholesale_distribution	enterprise	billing	2026-06-16 22:26:13.015057+00
super_mart	enterprise	billing	2026-06-16 22:26:13.015057+00
retail_shop	enterprise	billing	2026-06-16 22:26:13.015057+00
wholesale_distribution	enterprise	reports	2026-06-16 22:26:13.015057+00
super_mart	enterprise	reports	2026-06-16 22:26:13.015057+00
retail_shop	enterprise	reports	2026-06-16 22:26:13.015057+00
restaurant_cafe	enterprise	restaurant_management	2026-06-16 22:26:13.015057+00
salon_spa	enterprise	salon_service_menu	2026-06-16 22:26:13.015057+00
hospital	enterprise	clinic_management	2026-06-16 22:26:13.015057+00
clinic	enterprise	clinic_management	2026-06-16 22:26:13.015057+00
salon_spa	enterprise	salon_booking	2026-06-16 22:26:13.015057+00
salon_spa	enterprise	salon_staff_scheduling	2026-06-16 22:26:13.015057+00
salon_spa	enterprise	salon_memberships	2026-06-16 22:26:13.015057+00
salon_spa	enterprise	salon_packages	2026-06-16 22:26:13.015057+00
salon_spa	enterprise	salon_products	2026-06-16 22:26:13.015057+00
salon_spa	enterprise	salon_commission	2026-06-16 22:26:13.015057+00
hotel_hospitality	enterprise	hotel_room_booking	2026-06-16 22:26:13.015057+00
hotel_hospitality	enterprise	hotel_checkin_checkout	2026-06-16 22:26:13.015057+00
hotel_hospitality	enterprise	hotel_room_status	2026-06-16 22:26:13.015057+00
hotel_hospitality	enterprise	hotel_housekeeping	2026-06-16 22:26:13.015057+00
hotel_hospitality	enterprise	hotel_guest_records	2026-06-16 22:26:13.015057+00
hospital	enterprise	pharmacy_stock	2026-06-16 22:26:13.015057+00
clinic	enterprise	pharmacy_stock	2026-06-16 22:26:13.015057+00
hospital	enterprise	clinic_queue_management	2026-06-16 22:26:13.015057+00
clinic	enterprise	clinic_queue_management	2026-06-16 22:26:13.015057+00
dental	enterprise	dental_billing	2026-06-16 22:26:13.015057+00
hotel_hospitality	enterprise	hotel_management	2026-06-16 22:26:13.015057+00
travel_tourism	enterprise	travel_management	2026-06-16 22:26:13.015057+00
travel_tourism	enterprise	travel_packages	2026-06-16 22:26:13.015057+00
travel_tourism	enterprise	travel_bookings	2026-06-16 22:26:13.015057+00
travel_tourism	enterprise	travel_customers	2026-06-16 22:26:13.015057+00
travel_tourism	enterprise	travel_visa_documents	2026-06-16 22:26:13.015057+00
travel_tourism	enterprise	travel_flight_records	2026-06-16 22:26:13.015057+00
travel_tourism	enterprise	travel_hotel_reservations	2026-06-16 22:26:13.015057+00
travel_tourism	enterprise	travel_commission	2026-06-16 22:26:13.015057+00
ecommerce	enterprise	ecommerce_management	2026-06-16 22:26:13.015057+00
ecommerce	enterprise	ecommerce_storefront	2026-06-16 22:26:13.015057+00
ecommerce	enterprise	ecommerce_orders	2026-06-16 22:26:13.015057+00
ecommerce	enterprise	ecommerce_products	2026-06-16 22:26:13.015057+00
manufacturing	enterprise	manufacturing_bom	2026-06-16 22:26:13.015057+00
manufacturing	enterprise	manufacturing_production_orders	2026-06-16 22:26:13.015057+00
manufacturing	enterprise	manufacturing_workstations	2026-06-16 22:26:13.015057+00
manufacturing	enterprise	manufacturing_quality_control	2026-06-16 22:26:13.015057+00
software_it	enterprise	professional_services_contracts	2026-06-16 22:26:13.015057+00
professional_services	enterprise	professional_services_contracts	2026-06-16 22:26:13.015057+00
software_it	enterprise	professional_services_retainer_billing	2026-06-16 22:26:13.015057+00
professional_services	enterprise	professional_services_retainer_billing	2026-06-16 22:26:13.015057+00
ngo_nonprofit	enterprise	ngo_donors	2026-06-16 22:26:13.015057+00
ngo_nonprofit	enterprise	ngo_donations	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	admissions	2026-06-16 22:26:13.015057+00
school_college	enterprise	admissions	2026-06-16 22:26:13.015057+00
salon_spa	enterprise	service_menu	2026-06-16 22:26:13.015057+00
salon_spa	enterprise	staff_scheduling	2026-06-16 22:26:13.015057+00
real_estate	enterprise	real_estate_management	2026-06-16 22:26:13.015057+00
real_estate	enterprise	real_estate_visits	2026-06-16 22:26:13.015057+00
salon_spa	enterprise	memberships	2026-06-16 22:26:13.015057+00
real_estate	enterprise	real_estate_commission	2026-06-16 22:26:13.015057+00
salon_spa	enterprise	commission	2026-06-16 22:26:13.015057+00
hotel_hospitality	enterprise	room_booking	2026-06-16 22:26:13.015057+00
hotel_hospitality	enterprise	housekeeping	2026-06-16 22:26:13.015057+00
hotel_hospitality	enterprise	checkin_checkout	2026-06-16 22:26:13.015057+00
cleaning_services	enterprise	repair_management	2026-06-16 22:26:13.015057+00
home_services	enterprise	repair_management	2026-06-16 22:26:13.015057+00
cleaning_services	enterprise	tickets	2026-06-16 22:26:13.015057+00
home_services	enterprise	tickets	2026-06-16 22:26:13.015057+00
cleaning_services	enterprise	job_cards	2026-06-16 22:26:13.015057+00
home_services	enterprise	job_cards	2026-06-16 22:26:13.015057+00
cleaning_services	enterprise	field_staff	2026-06-16 22:26:13.015057+00
home_services	enterprise	field_staff	2026-06-16 22:26:13.015057+00
cleaning_services	enterprise	warranty	2026-06-16 22:26:13.015057+00
home_services	enterprise	warranty	2026-06-16 22:26:13.015057+00
manufacturing	enterprise	bom	2026-06-16 22:26:13.015057+00
manufacturing	enterprise	production_orders	2026-06-16 22:26:13.015057+00
manufacturing	enterprise	quality_control	2026-06-16 22:26:13.015057+00
real_estate	enterprise	properties	2026-06-16 22:26:13.015057+00
real_estate	enterprise	leads_pipeline	2026-06-16 22:26:13.015057+00
real_estate	enterprise	rentals	2026-06-16 22:26:13.015057+00
gym_fitness	enterprise	gym_management	2026-06-16 22:26:13.015057+00
gym_fitness	enterprise	trainer_schedule	2026-06-16 22:26:13.015057+00
gym_fitness	enterprise	fitness_memberships	2026-06-16 22:26:13.015057+00
manufacturing	enterprise	manufacturing_management	2026-06-16 22:26:13.015057+00
real_estate	enterprise	real_estate_documents	2026-06-16 22:26:13.015057+00
pharmacy	enterprise	pharmacy_management	2026-06-16 22:26:13.015057+00
pharmacy	enterprise	pharmacy_medicine_catalog	2026-06-16 22:26:13.015057+00
pharmacy	enterprise	pharmacy_inventory	2026-06-16 22:26:13.015057+00
pharmacy	enterprise	pharmacy_batch_expiry	2026-06-16 22:26:13.015057+00
pharmacy	enterprise	pharmacy_prescription_sales	2026-06-16 22:26:13.015057+00
agriculture	enterprise	agriculture_fields	2026-06-16 22:26:13.015057+00
agriculture	enterprise	agriculture_crops	2026-06-16 22:26:13.015057+00
law_firm	enterprise	law_documents	2026-06-16 22:26:13.015057+00
law_firm	enterprise	law_billing	2026-06-16 22:26:13.015057+00
law_firm	enterprise	law_time_tracking	2026-06-16 22:26:13.015057+00
law_firm	enterprise	law_compliance	2026-06-16 22:26:13.015057+00
accounting_tax	enterprise	accounting_tax_management	2026-06-16 22:26:13.015057+00
accounting_tax	enterprise	accounting_clients	2026-06-16 22:26:13.015057+00
accounting_tax	enterprise	accounting_bookkeeping	2026-06-16 22:26:13.015057+00
accounting_tax	enterprise	accounting_tax_returns	2026-06-16 22:26:13.015057+00
accounting_tax	enterprise	accounting_expenses	2026-06-16 22:26:13.015057+00
accounting_tax	enterprise	accounting_reports	2026-06-16 22:26:13.015057+00
accounting_tax	enterprise	accounting_payroll	2026-06-16 22:26:13.015057+00
accounting_tax	enterprise	accounting_audit_files	2026-06-16 22:26:13.015057+00
agriculture	enterprise	agriculture_livestock	2026-06-16 22:26:13.015057+00
agriculture	enterprise	agriculture_inputs	2026-06-16 22:26:13.015057+00
agriculture	enterprise	agriculture_harvest	2026-06-16 22:26:13.015057+00
agriculture	enterprise	agriculture_expenses	2026-06-16 22:26:13.015057+00
agriculture	enterprise	agriculture_sales	2026-06-16 22:26:13.015057+00
auto_workshop	enterprise	auto_workshop_management	2026-06-16 22:26:13.015057+00
auto_workshop	enterprise	auto_workshop_jobs	2026-06-16 22:26:13.015057+00
auto_workshop	enterprise	auto_workshop_vehicles	2026-06-16 22:26:13.015057+00
auto_workshop	enterprise	auto_workshop_parts_inventory	2026-06-16 22:26:13.015057+00
auto_workshop	enterprise	auto_workshop_service_history	2026-06-16 22:26:13.015057+00
auto_workshop	enterprise	auto_workshop_estimates	2026-06-16 22:26:13.015057+00
event_management	enterprise	event_venues	2026-06-16 22:26:13.015057+00
event_management	enterprise	event_vendor_management	2026-06-16 22:26:13.015057+00
event_management	enterprise	event_budgeting	2026-06-16 22:26:13.015057+00
event_management	enterprise	event_tasks	2026-06-16 22:26:13.015057+00
event_management	enterprise	event_invoicing	2026-06-16 22:26:13.015057+00
law_firm	enterprise	law_firm_management	2026-06-16 22:26:13.015057+00
law_firm	enterprise	law_clients	2026-06-16 22:26:13.015057+00
law_firm	enterprise	law_cases	2026-06-16 22:26:13.015057+00
law_firm	enterprise	law_hearings	2026-06-16 22:26:13.015057+00
coaching_center	enterprise	school_certificates	2026-06-16 22:26:13.015057+00
school_college	enterprise	school_certificates	2026-06-16 22:26:13.015057+00
hotel_hospitality	enterprise	hotel_rental_items	2026-06-16 22:26:13.015057+00
software_it	enterprise	professional_services_projects	2026-06-16 22:26:13.015057+00
professional_services	enterprise	professional_services_projects	2026-06-16 22:26:13.015057+00
software_it	enterprise	professional_services_proposals	2026-06-16 22:26:13.015057+00
professional_services	enterprise	professional_services_proposals	2026-06-16 22:26:13.015057+00
ngo_nonprofit	enterprise	ngo_campaigns	2026-06-16 22:26:13.015057+00
ngo_nonprofit	enterprise	ngo_beneficiaries	2026-06-16 22:26:13.015057+00
ngo_nonprofit	enterprise	ngo_volunteers	2026-06-16 22:26:13.015057+00
ngo_nonprofit	enterprise	ngo_grants	2026-06-16 22:26:13.015057+00
ngo_nonprofit	enterprise	ngo_impact_reports	2026-06-16 22:26:13.015057+00
agriculture	enterprise	agriculture_management	2026-06-16 22:26:13.015057+00
event_management	enterprise	event_management	2026-06-16 22:26:13.015057+00
event_management	enterprise	event_clients	2026-06-16 22:26:13.015057+00
event_management	enterprise	event_bookings	2026-06-16 22:26:13.015057+00
recruitment_agency	enterprise	hr_recruitment_management	2026-06-16 22:26:13.015057+00
hr_payroll	enterprise	hr_recruitment_management	2026-06-16 22:26:13.015057+00
recruitment_agency	enterprise	hr_candidates	2026-06-16 22:26:13.015057+00
hr_payroll	enterprise	hr_candidates	2026-06-16 22:26:13.015057+00
recruitment_agency	enterprise	hr_jobs	2026-06-16 22:26:13.015057+00
hr_payroll	enterprise	hr_jobs	2026-06-16 22:26:13.015057+00
recruitment_agency	enterprise	hr_applications	2026-06-16 22:26:13.015057+00
hr_payroll	enterprise	hr_applications	2026-06-16 22:26:13.015057+00
recruitment_agency	enterprise	hr_interviews	2026-06-16 22:26:13.015057+00
hr_payroll	enterprise	hr_interviews	2026-06-16 22:26:13.015057+00
recruitment_agency	enterprise	hr_clients	2026-06-16 22:26:13.015057+00
hr_payroll	enterprise	hr_clients	2026-06-16 22:26:13.015057+00
recruitment_agency	enterprise	hr_offer_letters	2026-06-16 22:26:13.015057+00
hr_payroll	enterprise	hr_offer_letters	2026-06-16 22:26:13.015057+00
recruitment_agency	enterprise	hr_onboarding	2026-06-16 22:26:13.015057+00
hr_payroll	enterprise	hr_onboarding	2026-06-16 22:26:13.015057+00
\.


--
-- Data for Name: business_type_aliases; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.business_type_aliases (alias, business_type_id, created_at) FROM stdin;
accounting	accounting_tax	2026-06-16 22:22:09.989076+00
fleet	logistics_transport	2026-06-16 22:22:09.989076+00
general_store	retail_shop	2026-06-16 22:22:09.989076+00
gym	gym_fitness	2026-06-16 22:22:09.989076+00
hotel	hotel_hospitality	2026-06-16 22:22:09.989076+00
hotel_rental	hotel_hospitality	2026-06-16 22:22:09.989076+00
hr_recruitment	recruitment_agency	2026-06-16 22:22:09.989076+00
legal_firm	law_firm	2026-06-16 22:22:09.989076+00
other	other_business	2026-06-16 22:22:09.989076+00
property_mgmt	real_estate	2026-06-16 22:22:09.989076+00
restaurant	restaurant_cafe	2026-06-16 22:22:09.989076+00
retail	retail_shop	2026-06-16 22:22:09.989076+00
salon	salon_spa	2026-06-16 22:22:09.989076+00
school	school_college	2026-06-16 22:22:09.989076+00
software	software_it	2026-06-16 22:22:09.989076+00
store	retail_shop	2026-06-16 22:22:09.989076+00
travel	travel_tourism	2026-06-16 22:22:09.989076+00
wholesale	wholesale_distribution	2026-06-16 22:22:09.989076+00
\.


--
-- Data for Name: business_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.business_types (id, name, module_category, pricing_weight, status, sort_order, created_at, updated_at) FROM stdin;
accounting_tax	Accounting & Tax Services	accounting_tax	1.00	active	10	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
agriculture	Agriculture & Farming	agriculture	1.00	active	20	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
auto_workshop	Auto Workshop & Garage	auto_workshop	1.00	active	30	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
clinic	Clinic / Healthcare Center	clinic	1.10	active	40	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
hospital	Hospital Management	clinic	1.30	active	50	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
dental	Dental Clinic	dental	1.05	active	60	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
pharmacy	Pharmacy & Medical Store	pharmacy	1.05	active	70	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
school_college	School / College Management	school	1.15	active	80	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
coaching_center	Coaching & Training Center	school	0.95	active	90	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
ecommerce	eCommerce / Online Store	ecommerce	1.05	active	100	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
retail_shop	Retail Shop / General Store	store	1.00	active	110	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
super_mart	Super Mart & Grocery	store	1.10	active	120	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
wholesale_distribution	Wholesale & Distribution	store	1.10	active	130	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
restaurant_cafe	Restaurant & Cafe	restaurant	1.10	active	140	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
hotel_hospitality	Hotel & Hospitality	hotel	1.15	active	150	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
travel_tourism	Travel & Tourism	travel	1.15	active	160	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
salon_spa	Beauty Salon & Spa	salon	1.00	active	170	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
gym_fitness	Gym & Fitness Center	gym	0.95	active	180	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
real_estate	Property & Real Estate	real_estate	1.10	active	190	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
construction	Construction Business	construction	1.10	active	200	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
manufacturing	Manufacturing & Factory	manufacturing	1.20	active	210	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
logistics_transport	Logistics & Transport	logistics	1.10	active	220	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
event_management	Event Management	event_management	1.00	active	230	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
hr_payroll	HR & Payroll Services	hr_recruitment	1.00	active	240	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
recruitment_agency	Recruitment Agency	hr_recruitment	1.00	active	250	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
law_firm	Legal Firm / Law Office	law_firm	1.00	active	260	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
ngo_nonprofit	NGO / Nonprofit Organization	ngo	0.95	active	270	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
professional_services	Professional Services	professional_services	1.00	active	280	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
software_it	Software & IT Services	professional_services	1.10	active	290	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
home_services	Home & Maintenance Services	services	0.95	active	300	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
security_services	Security Services	security	1.00	active	310	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
cleaning_services	Cleaning Services	services	0.95	active	320	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
media_marketing	Media & Marketing Agency	communication	1.00	active	330	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
telecom_communication	Telecom & Communication	communication	1.05	active	340	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
other_business	Other Business Type	business	1.00	active	350	2026-06-16 22:22:09.989076+00	2026-08-13 19:58:42.458784+00
\.


--
-- Data for Name: client_business_register; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_business_register (id, full_name, email, country_code, phone, company_name, business_reg_no, business_type, business_size, country, city, state, postal_code, address, password_hash, custom_domain, hear_about_us, terms_accepted, role, status, email_verified, phone_verified, is_active, failed_login_count, locked_until, last_login_at, created_at, updated_at) FROM stdin;
b44abfe6-514f-41e0-a5b6-2af0d4657e42	Test Client	testclient4004@gmail.com	+92	3001234567	Test Company	NTN-123	software	micro	PK	Karachi	Sindh	75500	Karachi Pakistan	$2a$10$GPWcNxAeL1qNMiSyKRwEY.n/hutu9iYoUXoKNJ6W2iKfk1eD2quEC	testcompany	linkedin	t	client_admin	pending_verification	f	f	t	0	\N	\N	2026-05-27 10:54:00.673871	2026-05-27 10:54:00.673871
0e75b0d4-1594-4ede-8468-7b38080203ec	Pervaiz Ahmed Abbasi	pervaizahmedabbasi2@gmail.com	+92	3091893640	fffffffffff	5454	school_college	small	PK	uuuuuuuuuuu	kjkjjkjkjkjkj	\N	Village Gher Gaju Po Kalhora Station Taluka Bhiria City\nSame	$2a$10$padSF/ezW9MxdFqikrdCjumsHeXDofaLj4tzp0oXi9trEA7rJDq9q	Soft Code Solution	facebook	t	client_admin	pending_verification	f	f	t	0	\N	\N	2026-05-27 10:55:33.080957	2026-05-27 10:55:33.080957
73c77869-c803-4e9a-b890-6fc4017384cf	Pervaiz Ahmed Abbasi	pervaizahmedabasi2@gmail.com	+92	3091893640	Fjf NBC j	Cjcjjcjc	hr_payroll	large	PK	Cncjc NBC c	Cvtffccc	45556	Village Gher Gaju Po Kalhora Station Taluka Bhiria City\nSame	$2a$10$vJIKGb3hSICfMiPvguXPbu31WUgg11VeaW4CRdarJm/9w6uQpYXa.	Soft Code Solution	linkedin	t	client_admin	pending_verification	f	f	t	0	\N	\N	2026-05-27 11:43:02.792716	2026-05-27 11:43:02.792716
49af0726-5afc-431b-9d5b-bbdfe18cd2e4	Pervaiz Ahmed Abbasi	pervaizahmabbasi2@gmail.com	+92	3091893640	jyuyuyuyuy	uyuyuyuyuy	property_mgmt	large	PK	ytytytytyt	ytytytytytyt	\N	Village Gher Gaju Po Kalhora Station Taluka Bhiria City\nSame	$2a$10$.LyPrFrTM4/SfICFKJgTiO6yITBHVdNze8XogUvz0ohFCPK5.cvNW	Soft Code Solution	whatsapp	t	client_admin	pending_verification	f	f	t	0	\N	\N	2026-05-29 22:51:47.982467	2026-05-29 22:51:47.982467
b9016af3-780a-4612-8892-124efda813b5	Test Client Route	testclient-route-004@example.com	+92	03001234567	Test Company Route	\N	retail	small	PK	Karachi	Sindh	\N	Test address	$2a$10$Y8NF77AobQBhM/Iit4YUku8HwS63wBT9eP.2TRfx7MwT14ASfJbSi	\N	\N	t	client_admin	pending_verification	f	f	t	0	\N	\N	2026-06-04 09:01:47.46618	2026-06-04 09:01:47.46618
7b2343fc-0a4f-45ae-86a0-b94a13e018f9	Final Extra Field Test	final-extra-field-test-002@example.com	+92	03001234567	Final Extra Company	\N	retail	small	PK	Karachi	Sindh	\N	Test address	$2a$10$lcIztMV6DqzzI4RV8tDvmunbQGSJ6rWFNNZZVspmdHXKIPMZa3jta	\N	\N	t	client_admin	pending_verification	f	f	t	0	\N	\N	2026-06-05 06:52:25.795825	2026-06-05 06:52:25.795825
88945d26-0e01-40c9-b594-abf69ed3ca8b	Pervaixxxxxxxxxx	mashalllah@gmail.com	+92	3054212545	fgffgfgffgfgfgf	gfgfgfgfgfg	retail_shop	solo	PK	fddddddddddddddddd	dfdfdfdf	fgfgfgfgfg	fdfdfdfffffffffffffffffffff	$2a$10$pKTYTTfn5O5La69Y86zirOdqObzSaMS4zLrEyEHo6CapdWBiVN3e6	dfdfdffdfdfd	tiktok	t	client_admin	pending_verification	f	f	t	0	\N	\N	2026-06-05 07:08:55.214178	2026-06-05 07:08:55.214178
bb3ab721-27d7-4680-ab1f-e0cf1aaf6b41	Admin	abbasi2@gmail.com	+92	3091893640	Jfjf jvc jfjjf	Iigiggkkggkgk	hospital	medium	PK	G.j gkgigiggi	Figjgkgkig	Jgkgkgkgkkg	Village Gher Gaju Po Kalhora Station Taluka Bhiria City\nSame	$2a$10$mnsapssFQQZx7iXVYWMIeeGC2wXbyFFMrMcKqg.CWvtvYzUewbSjC	Fm FM fkgkgkg	youtube	t	client_admin	pending_verification	f	f	t	0	\N	\N	2026-06-05 07:34:51.742904	2026-06-05 07:34:51.742904
369ec8dd-ce04-4a5f-91e4-8a2620bc331a	Molae	mala@gmail.com	+92	3091893640	Fffffffff	C CNN cjccj	coaching_center	medium	PK	Jfkfkfkvkv	Fifjvjvkvvi	Kffkfkkgvkk	Fjfjjfjvvjjvkvkvkv	$2a$10$4h2UEnHBLrxA.rjpvXvGFOf1KGUC1cnL7A24ac0hllQJ7auiaS8OS	Fffgvkkgvk	linkedin	t	client_admin	pending_verification	f	f	t	0	\N	\N	2026-06-05 21:02:47.569369	2026-06-05 21:02:47.569369
3d05fcd5-afba-4331-97fe-e09d77cd89ea	jano	jano@gmail.com	+92	3025464454	fgfgfgfgfgfgfg	565656565	legal_firm	large	QA	jgfkgjkfgjkgfjkfjg	djhfjhfjdhfjhfjhf	jkjkjkjkjkjkjjj	ghghghghhg	$2a$10$g7StTcfOdgyZpt9Q7ayJ2OeYPcpA/9vjpqvknQvO7tMrjW8qRkBWS	jhjhjhhjhhjhhh	facebook	t	client_admin	pending_verification	f	f	t	0	\N	\N	2026-06-06 15:17:32.517004	2026-06-06 15:17:32.517004
238f2ea4-4f91-41f4-8b3c-a70bc632890b	dil	dil@gmail.com	+92	54545454545	dffdfdfdfdf	ytyyyyyyyyyyyyyyyyy	property_mgmt	large	PK	fffffffffffffffffffffffff	jkkjkjjjjjjjjjjj	jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj	jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj	$2a$10$KyrOSALLcpLabu1iJpwkO.6ZpgDXzFIJohxjyEmLB/ae55.NQHG0e	ggghggggggggggggggg	tiktok	t	client_admin	pending_verification	f	f	t	0	\N	\N	2026-06-06 19:22:44.260734	2026-06-06 19:22:44.260734
37b3779b-a56d-46bd-8c74-105497ad5d45	Argon Live Test	argon2-live-1780776725@example.com	+92	03001234567	Argon Live Company	\N	retail	small	PK	Karachi	Sindh	\N	Test address	$argon2id$v=19$m=65536,t=3,p=2$6xJZs6M++vM+ZlopoePSog$/Jxcj7irVNPvcT1nSkiCgWznvBoz2uJdagLRCMXQZsk	\N	\N	t	client_admin	pending_verification	f	f	t	0	\N	\N	2026-06-06 20:12:08.872302	2026-06-06 20:12:08.872302
86d7e32b-4472-4dac-9646-428a08090da6	humera	humera@gmail.com	+92	545454656565	oppooooooooo	l;;;;;;;;;;;;;;;;;	wholesale	micro	PK	lkkkkkkkkkkkkl	kllkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk	kkkkkkkkkkkkkkkkkkk	lllkkkkkkkkkkkkkkkkkkkk	$2a$10$3dHQrQLt.nQMspnlSgPTouaQrbB48YNvJ92TwwFZGmVfdCw0z2c4q	kjkjkjkjjkjkj	youtube	t	client_admin	pending_verification	f	f	t	0	\N	\N	2026-06-06 20:35:17.197729	2026-06-06 20:35:17.197729
2e0168de-ffa4-41b3-be1a-ac8c13171b05	humayaa	humaya@gmail.com	+92	3025645454	hjhjhuygygygyg	jhjhjhuhuhhjhuhjhj	coaching_center	micro	PK	kjjjjjjjjjjjjjjjjjjjj	kjjjjjjjjjjjjjjjkjkj	jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj	kjkjkjkjjkjjjkjkjjkjkj	$argon2id$v=19$m=65536,t=3,p=2$zlElmf/5mxUpWFFFHkO+/Q$sPbuKX4RK7DKktb4bpgxT9qp1HhE7+VFA19t6RmeEp8	fgffgfgfgfgfgfgf	other	t	client_admin	approved	f	f	t	0	\N	\N	2026-06-07 06:23:22.709487	2026-06-09 18:15:29.595955
1c180306-d507-4af8-819d-dfd5ff9a613f	sumi123	sumi123@gmail.com	+92	30545152545	tyttyty	7878787878	salon_spa	small	PK	7887878	89989898	uyyyyyyyyyyyyyy	xcxcsyv udfd duu	$2a$10$SUJ/lasBan/pmlCbG1tjsOpXnGZZZ48wiMppbnu6LBiCUBcGJxbq6	87777777777777	instagram	t	client_admin	pending_verification	f	f	t	0	\N	\N	2026-06-06 20:50:45.036001	2026-06-09 19:37:51.204587
7683fd87-bd0a-4f4c-a697-68c51aa7a6ee	nanao	nanaononoasi2@gmail.com	+92	3091893640	8898989uiuiuytrtrtr	jhjhjhjhjhjh	hotel_rental	small	PK	ooooooooooooooo	oioioioioi	iiiiiiiiiiiiiiiiiiiiiiiiiiii	Village Gher Gaju Po Kalhora Station Taluka Bhiria City\nSame	$argon2id$v=19$m=65536,t=3,p=2$TCZ0DzAkYCKK/gJe+bu7Xw$3ebD6Kul8eiQDgm6pvWySxgQJGZYzIxz0822FwhJ6WY	dfdfdfdfdfdfdf	whatsapp	t	client_admin	approved	f	f	t	0	\N	\N	2026-06-08 08:05:19.832361	2026-06-10 19:05:19.066497
f888c57c-6e96-4f78-815f-744b63bd1ab0	SQLite Proof Now	sqlite-proof-now-001@example.com	+92	03001234567	SQLite Proof Company	\N	retail	small	PK	Karachi	Sindh	\N	Test address	$2a$10$dmfBIgVYh1nJNv3AUjx.5uwdKscyYdn5ovJnkovtEtyw3/CgGLDp.	\N	\N	t	client_admin	rejected	f	f	t	0	\N	\N	2026-06-06 08:52:10.968132	2026-06-10 19:22:11.377263
30edd826-5c7a-4f2f-a277-9b74d254882b	Ansar	sumi@gmail.com	+92	3068686856	Need jdjdjdjd	Fjfjiff	clinic	small	PK	Fififif	Fifffkk	Fifiihfifiiv	Fiffiivviivviv	$2a$10$BTsCAvrN.g7wSQ1lsk4iw.kd3lIOklu4M698kfOQHlYlo9kUNRk0W	Judd kcjfjfck	youtube	t	client_admin	pending_verification	f	f	t	0	\N	\N	2026-06-05 21:19:44.393216	2026-06-11 17:02:56.757561
7d8ca367-74ec-47eb-9d27-fe5efbdea672	Client Login Test	client-login-test-1780931800@example.com	+92	03001234567	Client Login Company	\N	retail	small	PK	Karachi	Sindh	\N	Test address	$argon2id$v=19$m=65536,t=3,p=2$zc7HC4HWNlQAtH+C94pITg$yyZPodDmnjUV0dYN3QOeRvHiT/1Aj/91y4WY3PWm+pA	\N	\N	t	client_admin	approved	f	f	t	0	\N	\N	2026-06-08 15:16:41.655257	2026-06-12 14:51:32.828741
4f049da4-cac7-4598-8b96-821d9e0051b3	Aslam Abc	shahnaz@gmail.com	+92	3091983640	656565656	trrtrtrtrtrtr	hotel_rental	solo	CA	tytytyty	trtrtrtrtrt	errrrrrrrrrrrrrrr	rtttttttttttttt	$argon2id$v=19$m=65536,t=3,p=2$eXZ9XKeymvpugcYSbio72g$XcjQ4gdxmI3/6s3+jft8jE44f4PPdjzOP1Gaa22CET8	656565656	tiktok	t	client_admin	approved	f	f	t	0	\N	\N	2026-06-08 18:35:22.927688	2026-07-17 16:08:42.998721
\.


--
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.modules (id, name, category, price_monthly, price_yearly, route, icon, status, sort_order, created_at, updated_at) FROM stdin;
test	Test	test	10.00	25.00	test	Package	active	0	2026-06-16 17:07:30.98315+00	2026-06-16 17:07:30.98315+00
test1	Tes123	test	252.00	230.00	test	Package	active	0	2026-06-16 19:46:15.724315+00	2026-06-16 20:00:54.079081+00
billing	Billing & Invoices	store	1500.00	15000.00	billing	CreditCard	active	70	2026-06-09 21:27:23.00887+00	2026-08-13 19:58:41.600784+00
reports	Reports	store	1000.00	10000.00	reports	BarChart3	active	80	2026-06-09 21:27:23.00887+00	2026-08-13 19:58:41.600784+00
school_management	School Management	school	3500.00	35000.00	school	GraduationCap	active	110	2026-06-10 09:34:21.634902+00	2026-08-13 19:58:41.600784+00
students	Students	school	1000.00	10000.00	students	Users	active	120	2026-06-10 09:34:21.634902+00	2026-08-13 19:58:41.600784+00
teachers	Teachers	school	1000.00	10000.00	teachers	UserCog	active	130	2026-06-10 09:34:21.634902+00	2026-08-13 19:58:41.600784+00
fees	Fees & Billing	school	1500.00	15000.00	fees	CreditCard	active	160	2026-06-10 09:34:21.634902+00	2026-08-13 19:58:41.600784+00
restaurant_management	Restaurant Management	restaurant	3000.00	30000.00	restaurant	Utensils	active	230	2026-06-09 21:27:23.00887+00	2026-08-13 19:58:41.600784+00
tables_orders	Tables & Orders	restaurant	1400.00	14000.00	tables	LayoutGrid	active	250	2026-06-10 09:34:21.634902+00	2026-08-13 19:58:41.600784+00
kitchen_display	Kitchen Display	restaurant	1300.00	13000.00	kitchen	Monitor	active	260	2026-06-10 09:34:21.634902+00	2026-08-13 19:58:41.600784+00
restaurant_billing	Restaurant Billing	restaurant	1500.00	15000.00	restaurant-billing	CreditCard	active	270	2026-06-10 09:34:21.634902+00	2026-08-13 19:58:41.600784+00
core_calendar	Calendar	core	700.00	7000.00	calendar	Calendar	active	1060	2026-06-14 19:18:54.644363+00	2026-08-13 19:58:41.600784+00
store_returns_refunds	Returns & Refunds	store	1000.00	10000.00	store-returns	Undo2	active	1170	2026-06-14 19:18:54.644363+00	2026-08-13 19:58:41.600784+00
repair_management	Repair Management	services	2500.00	25000.00	repair	Wrench	active	780	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
tickets	Tickets	services	1100.00	11000.00	tickets	Ticket	active	790	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
warranty	Warranty	services	1000.00	10000.00	warranty	ShieldCheck	active	820	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
webhooks	Webhooks	integrations	1200.00	12000.00	webhooks	Webhook	active	1040	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
email_sms	Email / SMS	communication	1200.00	12000.00	messages	Mail	active	1050	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
whatsapp	WhatsApp	communication	1500.00	15000.00	whatsapp	MessageCircle	active	1060	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
analytics_dashboard	Analytics Dashboard	analytics	1800.00	18000.00	analytics	BarChart3	active	1070	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
store_price_lists	Price Lists	store	900.00	9000.00	store-price-lists	Tags	active	1180	2026-06-14 19:18:54.644363+00	2026-08-13 19:58:41.600784+00
store_low_stock_alerts	Low Stock Alerts	store	800.00	8000.00	store-low-stock	AlertTriangle	active	1190	2026-06-14 19:18:54.644363+00	2026-08-13 19:58:41.600784+00
dental_xray_records	X-Ray Records	dental	1200.00	12000.00	dental-xray	ScanLine	active	1490	2026-06-14 19:32:36.391233+00	2026-08-13 19:58:41.600784+00
dental_patient_recall	Patient Recall	dental	900.00	9000.00	dental-recall	BellRing	active	1500	2026-06-14 19:32:36.391233+00	2026-08-13 19:58:41.600784+00
salon_management	Salon Management	salon	2500.00	25000.00	salon	Scissors	active	1520	2026-06-14 19:44:23.785827+00	2026-08-13 19:58:41.600784+00
salon_memberships	Memberships	salon	1000.00	10000.00	salon-memberships	BadgeCheck	active	1560	2026-06-14 19:44:23.785827+00	2026-08-13 19:58:41.600784+00
salon_packages	Packages	salon	1000.00	10000.00	salon-packages	PackagePlus	active	1570	2026-06-14 19:44:23.785827+00	2026-08-13 19:58:41.600784+00
salon_products	Beauty Products	salon	900.00	9000.00	salon-products	ShoppingBag	active	1580	2026-06-14 19:44:23.785827+00	2026-08-13 19:58:41.600784+00
salon_commission	Staff Commission	salon	1100.00	11000.00	salon-commission	Percent	active	1590	2026-06-14 19:44:23.785827+00	2026-08-13 19:58:41.600784+00
hotel_management	Hotel Management	hotel	3500.00	35000.00	hotel	Hotel	active	1600	2026-06-14 19:44:23.785827+00	2026-08-13 19:58:41.600784+00
custom_reports	Custom Reports	analytics	1600.00	16000.00	custom-reports	FileBarChart	active	1080	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
ai_assistant	AI Assistant	ai	2500.00	25000.00	ai-assistant	Bot	active	1090	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
ai_forecasting	AI Forecasting	ai	2200.00	22000.00	ai-forecast	TrendingUp	active	1100	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
ecommerce_management	Ecommerce Management	ecommerce	3500.00	35000.00	ecommerce	ShoppingBag	active	1760	2026-06-14 19:53:37.252876+00	2026-08-13 19:58:41.600784+00
ecommerce_products	Ecommerce Products	ecommerce	1200.00	12000.00	ecommerce-products	Package	active	1790	2026-06-14 19:53:37.252876+00	2026-08-13 19:58:41.600784+00
hr_recruitment_management	HR & Recruitment Management	hr_recruitment	3500.00	35000.00	hr-recruitment	UsersRound	active	2820	2026-06-14 20:23:56.438157+00	2026-08-13 19:58:41.600784+00
core_dashboard	Dashboard	core	0.00	0.00	dashboard	LayoutDashboard	active	1000	2026-06-14 19:18:54.644363+00	2026-08-13 19:58:41.600784+00
core_company_profile	Company Profile	core	500.00	5000.00	company-profile	Building2	active	1010	2026-06-14 19:18:54.644363+00	2026-08-13 19:58:41.600784+00
core_branches	Branches	core	800.00	8000.00	branches	GitBranch	active	1020	2026-06-14 19:18:54.644363+00	2026-08-13 19:58:41.600784+00
core_users	Users	core	1000.00	10000.00	users	Users	active	1030	2026-06-14 19:18:54.644363+00	2026-08-13 19:58:41.600784+00
core_roles_permissions	Roles & Permissions	core	1200.00	12000.00	roles-permissions	ShieldCheck	active	1040	2026-06-14 19:18:54.644363+00	2026-08-13 19:58:41.600784+00
core_files	Files & Documents	core	800.00	8000.00	files	FolderOpen	active	1050	2026-06-14 19:18:54.644363+00	2026-08-13 19:58:41.600784+00
restaurant_reservations	Reservations	restaurant	1200.00	12000.00	restaurant-reservations	CalendarCheck	active	1200	2026-06-14 19:18:54.644363+00	2026-08-13 19:58:41.600784+00
restaurant_delivery_orders	Delivery Orders	restaurant	1400.00	14000.00	restaurant-delivery	Bike	active	1210	2026-06-14 19:18:54.644363+00	2026-08-13 19:58:41.600784+00
restaurant_food_inventory	Food Inventory	restaurant	1300.00	13000.00	restaurant-food-inventory	Boxes	active	1220	2026-06-14 19:18:54.644363+00	2026-08-13 19:58:41.600784+00
restaurant_waiter_app	Waiter App	restaurant	1100.00	11000.00	restaurant-waiter	Smartphone	active	1230	2026-06-14 19:18:54.644363+00	2026-08-13 19:58:41.600784+00
ecommerce_storefront	Online Storefront	ecommerce	2500.00	25000.00	ecommerce-storefront	Globe	active	1770	2026-06-14 19:53:37.252876+00	2026-08-13 19:58:41.600784+00
job_cards	Job Cards	services	1200.00	12000.00	job-cards	ClipboardList	active	800	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
field_staff	Field Staff	services	1300.00	13000.00	field-staff	MapPin	active	810	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
bom	Bill of Materials	manufacturing	1800.00	18000.00	bom	Layers	active	840	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
production_orders	Production Orders	manufacturing	1800.00	18000.00	production	Cog	active	850	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
quality_control	Quality Control	manufacturing	1400.00	14000.00	quality	BadgeCheck	active	860	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
properties	Properties	real_estate	1400.00	14000.00	properties	Home	active	880	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
leads_pipeline	Leads Pipeline	real_estate	1300.00	13000.00	leads	GitBranch	active	890	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
rentals	Rentals	real_estate	1500.00	15000.00	rentals	Key	active	900	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
gym_management	Gym Management	gym	2500.00	25000.00	gym	Dumbbell	active	910	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
trainer_schedule	Trainer Schedule	gym	1000.00	10000.00	trainer-schedule	Calendar	active	920	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
workflow_automation	Workflow Automation	automation	2200.00	22000.00	automation	Workflow	active	1110	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
clinic_management	Clinic Management	clinic	3500.00	35000.00	clinic	Activity	active	300	2026-06-09 21:27:23.00887+00	2026-08-13 19:58:41.600784+00
patients	Patients	clinic	1200.00	12000.00	patients	Users	active	310	2026-06-10 09:34:21.634902+00	2026-08-13 19:58:41.600784+00
appointments	Appointments	clinic	1200.00	12000.00	appointments	Calendar	active	320	2026-06-10 09:34:21.634902+00	2026-08-13 19:58:41.600784+00
doctors	Doctors	clinic	1000.00	10000.00	doctors	UserCog	active	330	2026-06-10 09:34:21.634902+00	2026-08-13 19:58:41.600784+00
prescriptions	Prescriptions	clinic	1300.00	13000.00	prescriptions	FileText	active	340	2026-06-10 09:34:21.634902+00	2026-08-13 19:58:41.600784+00
clinic_billing	Clinic Billing	clinic	1500.00	15000.00	clinic-billing	CreditCard	active	350	2026-06-10 09:34:21.634902+00	2026-08-13 19:58:41.600784+00
ecommerce_orders	Online Orders	ecommerce	1800.00	18000.00	ecommerce-orders	ShoppingCart	active	1780	2026-06-14 19:53:37.252876+00	2026-08-13 19:58:41.600784+00
ecommerce_cart_checkout	Cart & Checkout	ecommerce	1500.00	15000.00	ecommerce-checkout	CreditCard	active	1800	2026-06-14 19:53:37.252876+00	2026-08-13 19:58:41.600784+00
ecommerce_shipping	Shipping	ecommerce	1200.00	12000.00	ecommerce-shipping	Truck	active	1810	2026-06-14 19:53:37.252876+00	2026-08-13 19:58:41.600784+00
crm	CRM	business	2000.00	20000.00	crm	UserCog	active	400	2026-06-09 21:27:23.00887+00	2026-08-13 19:58:41.600784+00
stock_transfer	Stock Transfer	store	1100.00	11000.00	stock-transfer	ArrowRightLeft	active	440	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
purchase_orders	Purchase Orders	store	1400.00	14000.00	purchase-orders	ShoppingCart	active	450	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
customer_loyalty	Customer Loyalty	store	1200.00	12000.00	loyalty	BadgePercent	active	460	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
online_storefront	Online Storefront	ecommerce	2500.00	25000.00	online-store	Globe	active	480	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
website	Website / Landing Pages	business	1800.00	18000.00	website	Globe	active	410	2026-06-09 21:27:23.00887+00	2026-08-13 19:58:41.600784+00
shipping_delivery	Shipping & Delivery	ecommerce	1200.00	12000.00	shipping	Truck	active	490	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
restaurant_recipe_costing	Recipe Costing	restaurant	1200.00	12000.00	restaurant-recipe-costing	Calculator	active	1240	2026-06-14 19:18:54.644363+00	2026-08-13 19:58:41.600784+00
restaurant_floor_plan	Floor Plan	restaurant	1000.00	10000.00	restaurant-floor-plan	LayoutGrid	active	1250	2026-06-14 19:18:54.644363+00	2026-08-13 19:58:41.600784+00
restaurant_modifiers_addons	Modifiers & Add-ons	restaurant	900.00	9000.00	restaurant-modifiers	ListPlus	active	1260	2026-06-14 19:18:54.644363+00	2026-08-13 19:58:41.600784+00
restaurant_shift_cash	Shift & Cash Closing	restaurant	1200.00	12000.00	restaurant-shift-cash	Receipt	active	1270	2026-06-14 19:18:54.644363+00	2026-08-13 19:58:41.600784+00
school_grades	Grades	school	1000.00	10000.00	school-grades	FileCheck	active	1290	2026-06-14 19:32:36.391233+00	2026-08-13 19:58:41.600784+00
school_transport	Transport	school	1200.00	12000.00	school-transport	Bus	active	1300	2026-06-14 19:32:36.391233+00	2026-08-13 19:58:41.600784+00
school_hostel	Hostel	school	1300.00	13000.00	school-hostel	Bed	active	1310	2026-06-14 19:32:36.391233+00	2026-08-13 19:58:41.600784+00
queue_management	Queue Management	clinic	900.00	9000.00	queue	ListOrdered	active	640	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
fitness_memberships	Fitness Memberships	gym	1200.00	12000.00	fitness-memberships	BadgeCheck	active	930	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
accounting	Accounting	finance	2200.00	22000.00	accounting	Calculator	active	940	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
expenses	Expenses	finance	1000.00	10000.00	expenses	Receipt	active	950	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
ledger	Ledger	finance	1600.00	16000.00	ledger	BookText	active	960	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
tax_management	Tax Management	finance	1200.00	12000.00	tax	FileSpreadsheet	active	970	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
payment_records	Payment Records	payments	1500.00	15000.00	payments	WalletCards	active	980	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
subscription_billing	Subscription Billing	payments	1800.00	18000.00	subscriptions	Repeat	active	990	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
license_keys	License Keys	license	1800.00	18000.00	license-keys	Key	active	1000	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
rbac_roles	RBAC Roles	security	1600.00	16000.00	rbac	ShieldCheck	active	1010	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
audit_logs	Audit Logs	security	1400.00	14000.00	audit	ScrollText	active	1020	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
api_keys	API Keys	integrations	1500.00	15000.00	api-keys	KeyRound	active	1030	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
school_lms	Learning Management	school	2200.00	22000.00	school-lms	BookOpen	active	1320	2026-06-14 19:32:36.391233+00	2026-08-13 19:58:41.600784+00
school_homework	Homework	school	900.00	9000.00	school-homework	NotebookPen	active	1330	2026-06-14 19:32:36.391233+00	2026-08-13 19:58:41.600784+00
school_certificates	Certificates	school	800.00	8000.00	school-certificates	Award	active	1350	2026-06-14 19:32:36.391233+00	2026-08-13 19:58:41.600784+00
clinic_lab_reports	Lab Reports	clinic	1200.00	12000.00	clinic-lab-reports	FlaskConical	active	1370	2026-06-14 19:32:36.391233+00	2026-08-13 19:58:41.600784+00
clinic_pharmacy_stock	Pharmacy Stock	clinic	1400.00	14000.00	clinic-pharmacy	Pill	active	1380	2026-06-14 19:32:36.391233+00	2026-08-13 19:58:41.600784+00
clinic_queue_management	Queue Management	clinic	900.00	9000.00	clinic-queue	ListOrdered	active	1400	2026-06-14 19:32:36.391233+00	2026-08-13 19:58:41.600784+00
clinic_doctor_schedule	Doctor Schedule	clinic	1000.00	10000.00	clinic-doctor-schedule	CalendarDays	active	1410	2026-06-14 19:32:36.391233+00	2026-08-13 19:58:41.600784+00
clinic_vitals	Vitals	clinic	900.00	9000.00	clinic-vitals	Activity	active	1420	2026-06-14 19:32:36.391233+00	2026-08-13 19:58:41.600784+00
clinic_insurance_claims	Insurance Claims	clinic	1500.00	15000.00	clinic-insurance	FilePlus2	active	1430	2026-06-14 19:32:36.391233+00	2026-08-13 19:58:41.600784+00
ecommerce_coupons	Coupons	ecommerce	900.00	9000.00	ecommerce-coupons	BadgePercent	active	1820	2026-06-14 19:53:37.252876+00	2026-08-13 19:58:41.600784+00
ecommerce_reviews	Reviews	ecommerce	800.00	8000.00	ecommerce-reviews	Star	active	1830	2026-06-14 19:53:37.252876+00	2026-08-13 19:58:41.600784+00
ecommerce_marketplace	Marketplace Vendors	ecommerce	2200.00	22000.00	ecommerce-marketplace	Store	active	1840	2026-06-14 19:53:37.252876+00	2026-08-13 19:58:41.600784+00
ecommerce_abandoned_cart	Abandoned Cart	ecommerce	1200.00	12000.00	ecommerce-abandoned-cart	ShoppingCart	active	1850	2026-06-14 19:53:37.252876+00	2026-08-13 19:58:41.600784+00
classes_sections	Classes & Sections	school	900.00	9000.00	classes	Layers	active	140	2026-06-10 09:34:21.634902+00	2026-08-13 19:58:41.600784+00
core_notifications	Notifications	core	700.00	7000.00	notifications	Bell	active	1070	2026-06-14 19:18:54.644363+00	2026-08-13 19:58:41.600784+00
core_activity_logs	Activity Logs	core	900.00	9000.00	activity-logs	ScrollText	active	1080	2026-06-14 19:18:54.644363+00	2026-08-13 19:58:41.600784+00
core_import_export	Import / Export	core	1000.00	10000.00	import-export	ArrowUpDown	active	1090	2026-06-14 19:18:54.644363+00	2026-08-13 19:58:41.600784+00
core_custom_fields	Custom Fields	core	900.00	9000.00	custom-fields	SlidersHorizontal	active	1100	2026-06-14 19:18:54.644363+00	2026-08-13 19:58:41.600784+00
core_tasks	Tasks	core	900.00	9000.00	tasks	CheckSquare	active	1110	2026-06-14 19:18:54.644363+00	2026-08-13 19:58:41.600784+00
store_pos_terminal	POS Terminal	store	1800.00	18000.00	store-pos	Monitor	active	1120	2026-06-14 19:18:54.644363+00	2026-08-13 19:58:41.600784+00
store_barcode_labeling	Barcode & Labeling	store	900.00	9000.00	store-barcode	ScanBarcode	active	1130	2026-06-14 19:18:54.644363+00	2026-08-13 19:58:41.600784+00
store_stock_transfer	Stock Transfer	store	1100.00	11000.00	store-stock-transfer	ArrowRightLeft	active	1140	2026-06-14 19:18:54.644363+00	2026-08-13 19:58:41.600784+00
store_purchase_orders	Purchase Orders	store	1400.00	14000.00	store-purchase-orders	ShoppingCart	active	1150	2026-06-14 19:18:54.644363+00	2026-08-13 19:58:41.600784+00
ngo_donors	Donors	ngo	1000.00	10000.00	ngo-donors	Users	active	2350	2026-06-14 20:11:59.249437+00	2026-08-13 19:58:41.600784+00
store_customer_loyalty	Customer Loyalty	store	1200.00	12000.00	store-loyalty	BadgePercent	active	1160	2026-06-14 19:18:54.644363+00	2026-08-13 19:58:41.600784+00
school_admissions	Admissions	school	1200.00	12000.00	school-admissions	UserPlus	active	1280	2026-06-14 19:32:36.391233+00	2026-08-13 19:58:41.600784+00
school_online_classes	Online Classes	school	1500.00	15000.00	school-online-classes	Video	active	1340	2026-06-14 19:32:36.391233+00	2026-08-13 19:58:41.600784+00
clinic_medical_records	Medical Records	clinic	1600.00	16000.00	clinic-medical-records	FolderOpen	active	1360	2026-06-14 19:32:36.391233+00	2026-08-13 19:58:41.600784+00
dental_management	Dental Management	dental	3500.00	35000.00	dental	Smile	active	1440	2026-06-14 19:32:36.391233+00	2026-08-13 19:58:41.600784+00
dental_charting	Dental Charting	dental	1800.00	18000.00	dental-charting	ClipboardList	active	1450	2026-06-14 19:32:36.391233+00	2026-08-13 19:58:41.600784+00
dental_treatment_plans	Treatment Plans	dental	1400.00	14000.00	dental-treatment-plans	FileText	active	1460	2026-06-14 19:32:36.391233+00	2026-08-13 19:58:41.600784+00
dental_billing	Dental Billing	dental	1300.00	13000.00	dental-billing	CreditCard	active	1470	2026-06-14 19:32:36.391233+00	2026-08-13 19:58:41.600784+00
dental_lab_cases	Dental Lab Cases	dental	1200.00	12000.00	dental-lab-cases	FlaskConical	active	1480	2026-06-14 19:32:36.391233+00	2026-08-13 19:58:41.600784+00
manufacturing_management	Manufacturing Management	manufacturing	4000.00	40000.00	manufacturing	Factory	active	1860	2026-06-14 19:53:37.252876+00	2026-08-13 19:58:41.600784+00
manufacturing_bom	Bill of Materials	manufacturing	1800.00	18000.00	manufacturing-bom	Layers	active	1870	2026-06-14 19:53:37.252876+00	2026-08-13 19:58:41.600784+00
construction_contractors	Contractors	construction	1200.00	12000.00	construction-contractors	Users	active	2230	2026-06-14 20:04:20.036168+00	2026-08-13 19:58:41.600784+00
construction_site_attendance	Site Attendance	construction	1000.00	10000.00	construction-site-attendance	MapPinned	active	2240	2026-06-14 20:04:20.036168+00	2026-08-13 19:58:41.600784+00
construction_progress_reports	Progress Reports	construction	1200.00	12000.00	construction-progress	BarChart3	active	2250	2026-06-14 20:04:20.036168+00	2026-08-13 19:58:41.600784+00
professional_services_management	Professional Services Management	professional_services	3000.00	30000.00	professional-services	Briefcase	active	2260	2026-06-14 20:11:59.249437+00	2026-08-13 19:58:41.600784+00
pharmacy_management	Pharmacy Management	pharmacy	3000.00	30000.00	pharmacy	Pill	active	2020	2026-06-14 20:04:20.036168+00	2026-08-13 19:58:41.600784+00
professional_services_time_tracking	Time Tracking	professional_services	1100.00	11000.00	professional-services-time	Clock	active	2310	2026-06-14 20:11:59.249437+00	2026-08-13 19:58:41.600784+00
store_management	Store Management	store	2500.00	25000.00	store	Package	active	10	2026-06-09 21:27:23.00887+00	2026-08-13 19:58:41.600784+00
products	Products	store	800.00	8000.00	products	Package	active	20	2026-06-09 21:27:23.00887+00	2026-08-13 19:58:41.600784+00
inventory	Inventory	store	1200.00	12000.00	inventory	Database	active	30	2026-06-09 21:27:23.00887+00	2026-08-13 19:58:41.600784+00
sales_orders	Sales & Orders	store	1500.00	15000.00	sales	WalletCards	active	40	2026-06-09 21:27:23.00887+00	2026-08-13 19:58:41.600784+00
manufacturing_production_orders	Production Orders	manufacturing	1800.00	18000.00	manufacturing-production	Cog	active	1880	2026-06-14 19:53:37.252876+00	2026-08-13 19:58:41.600784+00
manufacturing_workstations	Workstations	manufacturing	1200.00	12000.00	manufacturing-workstations	MonitorCog	active	1890	2026-06-14 19:53:37.252876+00	2026-08-13 19:58:41.600784+00
manufacturing_quality_control	Quality Control	manufacturing	1400.00	14000.00	manufacturing-quality	BadgeCheck	active	1900	2026-06-14 19:53:37.252876+00	2026-08-13 19:58:41.600784+00
manufacturing_material_planning	Material Planning	manufacturing	1600.00	16000.00	manufacturing-material-planning	Boxes	active	1910	2026-06-14 19:53:37.252876+00	2026-08-13 19:58:41.600784+00
professional_services_invoicing	Service Invoicing	professional_services	1300.00	13000.00	professional-services-invoicing	Receipt	active	2320	2026-06-14 20:11:59.249437+00	2026-08-13 19:58:41.600784+00
manufacturing_costing	Production Costing	manufacturing	1500.00	15000.00	manufacturing-costing	Calculator	active	1920	2026-06-14 19:53:37.252876+00	2026-08-13 19:58:41.600784+00
professional_services_retainer_billing	Retainer Billing	professional_services	1200.00	12000.00	professional-services-retainers	WalletCards	active	2330	2026-06-14 20:11:59.249437+00	2026-08-13 19:58:41.600784+00
manufacturing_maintenance	Machine Maintenance	manufacturing	1200.00	12000.00	manufacturing-maintenance	Wrench	active	1930	2026-06-14 19:53:37.252876+00	2026-08-13 19:58:41.600784+00
ngo_management	NGO Management	ngo	2500.00	25000.00	ngo	HeartHandshake	active	2340	2026-06-14 20:11:59.249437+00	2026-08-13 19:58:41.600784+00
ngo_donations	Donations	ngo	1200.00	12000.00	ngo-donations	HandCoins	active	2360	2026-06-14 20:11:59.249437+00	2026-08-13 19:58:41.600784+00
real_estate_management	Real Estate Management	real_estate	3000.00	30000.00	real-estate	Building	active	1940	2026-06-14 19:53:37.252876+00	2026-08-13 19:58:41.600784+00
real_estate_properties	Properties	real_estate	1400.00	14000.00	real-estate-properties	Home	active	1950	2026-06-14 19:53:37.252876+00	2026-08-13 19:58:41.600784+00
real_estate_leads	Leads Pipeline	real_estate	1300.00	13000.00	real-estate-leads	GitBranch	active	1960	2026-06-14 19:53:37.252876+00	2026-08-13 19:58:41.600784+00
real_estate_rentals	Rentals	real_estate	1500.00	15000.00	real-estate-rentals	Key	active	1970	2026-06-14 19:53:37.252876+00	2026-08-13 19:58:41.600784+00
real_estate_sales	Property Sales	real_estate	1600.00	16000.00	real-estate-sales	Handshake	active	1980	2026-06-14 19:53:37.252876+00	2026-08-13 19:58:41.600784+00
real_estate_visits	Site Visits	real_estate	900.00	9000.00	real-estate-visits	CalendarCheck	active	1990	2026-06-14 19:53:37.252876+00	2026-08-13 19:58:41.600784+00
real_estate_commission	Agent Commission	real_estate	1100.00	11000.00	real-estate-commission	Percent	active	2000	2026-06-14 19:53:37.252876+00	2026-08-13 19:58:41.600784+00
ngo_campaigns	Campaigns	ngo	1200.00	12000.00	ngo-campaigns	Megaphone	active	2370	2026-06-14 20:11:59.249437+00	2026-08-13 19:58:41.600784+00
ngo_beneficiaries	Beneficiaries	ngo	1100.00	11000.00	ngo-beneficiaries	UserRoundCheck	active	2380	2026-06-14 20:11:59.249437+00	2026-08-13 19:58:41.600784+00
ngo_volunteers	Volunteers	ngo	1000.00	10000.00	ngo-volunteers	UsersRound	active	2390	2026-06-14 20:11:59.249437+00	2026-08-13 19:58:41.600784+00
ngo_impact_reports	Impact Reports	ngo	1100.00	11000.00	ngo-impact-reports	BarChart3	active	2410	2026-06-14 20:11:59.249437+00	2026-08-13 19:58:41.600784+00
pos_terminal	POS Terminal	store	1800.00	18000.00	pos	Monitor	active	420	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
barcode_labeling	Barcode & Labeling	store	900.00	9000.00	barcode	ScanBarcode	active	430	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
reservations	Reservations	restaurant	1200.00	12000.00	reservations	CalendarCheck	active	500	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
delivery_orders	Delivery Orders	restaurant	1400.00	14000.00	delivery	Bike	active	510	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
food_inventory	Food Inventory	restaurant	1300.00	13000.00	food-inventory	Boxes	active	520	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
waiter_app	Waiter App	restaurant	1100.00	11000.00	waiter	Smartphone	active	530	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
recipe_costing	Recipe Costing	restaurant	1200.00	12000.00	recipe-costing	Calculator	active	540	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
admissions	Admissions	school	1200.00	12000.00	admissions	UserPlus	active	550	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
grades	Grades	school	1000.00	10000.00	grades	FileCheck	active	560	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
transport	Transport	school	1200.00	12000.00	transport	Bus	active	570	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
agriculture_fields	Fields & Lands	agriculture	1000.00	10000.00	agriculture-fields	Map	active	2430	2026-06-14 20:11:59.249437+00	2026-08-13 19:58:41.600784+00
agriculture_crops	Crops	agriculture	1200.00	12000.00	agriculture-crops	Wheat	active	2440	2026-06-14 20:11:59.249437+00	2026-08-13 19:58:41.600784+00
agriculture_livestock	Livestock	agriculture	1300.00	13000.00	agriculture-livestock	Beef	active	2450	2026-06-14 20:11:59.249437+00	2026-08-13 19:58:41.600784+00
agriculture_inputs	Seeds & Inputs	agriculture	1100.00	11000.00	agriculture-inputs	Package	active	2460	2026-06-14 20:11:59.249437+00	2026-08-13 19:58:41.600784+00
agriculture_harvest	Harvest Tracking	agriculture	1200.00	12000.00	agriculture-harvest	Tractor	active	2470	2026-06-14 20:11:59.249437+00	2026-08-13 19:58:41.600784+00
agriculture_expenses	Farm Expenses	agriculture	1000.00	10000.00	agriculture-expenses	Receipt	active	2480	2026-06-14 20:11:59.249437+00	2026-08-13 19:58:41.600784+00
agriculture_sales	Crop Sales	agriculture	1200.00	12000.00	agriculture-sales	Handshake	active	2490	2026-06-14 20:11:59.249437+00	2026-08-13 19:58:41.600784+00
auto_workshop_management	Auto Workshop Management	auto_workshop	3000.00	30000.00	auto-workshop	Wrench	active	2500	2026-06-14 20:11:59.249437+00	2026-08-13 19:58:41.600784+00
hostel	Hostel	school	1300.00	13000.00	hostel	Bed	active	580	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
lms	Learning Management	school	2200.00	22000.00	lms	BookOpen	active	590	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
medical_records	Medical Records	clinic	1600.00	16000.00	medical-records	FolderOpen	active	600	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
lab_reports	Lab Reports	clinic	1200.00	12000.00	lab-reports	FlaskConical	active	610	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
law_cases	Cases	law_firm	1600.00	16000.00	law-cases	Briefcase	active	2680	2026-06-14 20:23:56.438157+00	2026-08-13 19:58:41.600784+00
hr_candidates	Candidates	hr_recruitment	1200.00	12000.00	hr-candidates	UserRoundPlus	active	2830	2026-06-14 20:23:56.438157+00	2026-08-13 19:58:41.600784+00
hr_jobs	Job Openings	hr_recruitment	1200.00	12000.00	hr-jobs	BriefcaseBusiness	active	2840	2026-06-14 20:23:56.438157+00	2026-08-13 19:58:41.600784+00
hr_applications	Applications	hr_recruitment	1300.00	13000.00	hr-applications	FileUser	active	2850	2026-06-14 20:23:56.438157+00	2026-08-13 19:58:41.600784+00
hr_interviews	Interviews	hr_recruitment	1200.00	12000.00	hr-interviews	CalendarCheck	active	2860	2026-06-14 20:23:56.438157+00	2026-08-13 19:58:41.600784+00
hr_clients	Recruitment Clients	hr_recruitment	1000.00	10000.00	hr-clients	Building2	active	2870	2026-06-14 20:23:56.438157+00	2026-08-13 19:58:41.600784+00
pharmacy_compliance_reports	Compliance Reports	pharmacy	1100.00	11000.00	pharmacy-compliance	ShieldCheck	active	2090	2026-06-14 20:04:20.036168+00	2026-08-13 19:58:41.600784+00
logistics_management	Logistics Management	logistics	3500.00	35000.00	logistics	Truck	active	2100	2026-06-14 20:04:20.036168+00	2026-08-13 19:58:41.600784+00
logistics_shipments	Shipments	logistics	1500.00	15000.00	logistics-shipments	PackageCheck	active	2110	2026-06-14 20:04:20.036168+00	2026-08-13 19:58:41.600784+00
logistics_pickups	Pickups	logistics	1200.00	12000.00	logistics-pickups	PackagePlus	active	2120	2026-06-14 20:04:20.036168+00	2026-08-13 19:58:41.600784+00
logistics_delivery_tracking	Delivery Tracking	logistics	1600.00	16000.00	logistics-tracking	MapPin	active	2130	2026-06-14 20:04:20.036168+00	2026-08-13 19:58:41.600784+00
logistics_driver_management	Driver Management	logistics	1300.00	13000.00	logistics-drivers	Users	active	2140	2026-06-14 20:04:20.036168+00	2026-08-13 19:58:41.600784+00
logistics_vehicle_fleet	Vehicle Fleet	logistics	1400.00	14000.00	logistics-fleet	Truck	active	2150	2026-06-14 20:04:20.036168+00	2026-08-13 19:58:41.600784+00
menu_items	Menu Items	restaurant	900.00	9000.00	menu	List	active	240	2026-06-10 09:34:21.634902+00	2026-08-13 19:58:41.600784+00
clinic_patient_portal	Patient Portal	clinic	1600.00	16000.00	clinic-patient-portal	HeartPulse	active	1390	2026-06-14 19:32:36.391233+00	2026-08-13 19:58:41.600784+00
dental_orthodontics	Orthodontics	dental	1600.00	16000.00	dental-orthodontics	SmilePlus	active	1510	2026-06-14 19:32:36.391233+00	2026-08-13 19:58:41.600784+00
salon_service_menu	Service Menu	salon	900.00	9000.00	salon-services	List	active	1530	2026-06-14 19:44:23.785827+00	2026-08-13 19:58:41.600784+00
salon_booking	Booking	salon	1200.00	12000.00	salon-booking	CalendarCheck	active	1540	2026-06-14 19:44:23.785827+00	2026-08-13 19:58:41.600784+00
salon_staff_scheduling	Staff Scheduling	salon	1200.00	12000.00	salon-staff-schedule	CalendarDays	active	1550	2026-06-14 19:44:23.785827+00	2026-08-13 19:58:41.600784+00
hotel_room_booking	Room Booking	hotel	1600.00	16000.00	hotel-room-booking	BedDouble	active	1610	2026-06-14 19:44:23.785827+00	2026-08-13 19:58:41.600784+00
hotel_checkin_checkout	Check-in / Check-out	hotel	1200.00	12000.00	hotel-checkin	LogIn	active	1620	2026-06-14 19:44:23.785827+00	2026-08-13 19:58:41.600784+00
hotel_room_status	Room Status	hotel	1000.00	10000.00	hotel-room-status	DoorOpen	active	1630	2026-06-14 19:44:23.785827+00	2026-08-13 19:58:41.600784+00
hotel_housekeeping	Housekeeping	hotel	1000.00	10000.00	hotel-housekeeping	Sparkles	active	1640	2026-06-14 19:44:23.785827+00	2026-08-13 19:58:41.600784+00
hotel_guest_records	Guest Records	hotel	1000.00	10000.00	hotel-guests	Users	active	1650	2026-06-14 19:44:23.785827+00	2026-08-13 19:58:41.600784+00
pharmacy_stock	Pharmacy Stock	clinic	1400.00	14000.00	pharmacy	Pill	active	620	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
patient_portal	Patient Portal	clinic	1600.00	16000.00	patient-portal	HeartPulse	active	630	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
treatment_plans	Treatment Plans	dental	1400.00	14000.00	treatment-plans	FileText	active	670	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
service_menu	Service Menu	salon	900.00	9000.00	services	List	active	700	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
staff_scheduling	Staff Scheduling	salon	1200.00	12000.00	staff-schedule	CalendarDays	active	710	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
memberships	Memberships	salon	1000.00	10000.00	memberships	BadgeCheck	active	720	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
commission	Staff Commission	salon	1100.00	11000.00	commission	Percent	active	730	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
room_booking	Room Booking	hotel	1600.00	16000.00	room-booking	BedDouble	active	750	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
housekeeping	Housekeeping	hotel	1000.00	10000.00	housekeeping	Sparkles	active	760	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
checkin_checkout	Check-in / Check-out	hotel	1200.00	12000.00	checkin	LogIn	active	770	2026-06-14 23:06:59.331641+00	2026-08-13 19:58:41.590379+00
hotel_deposits	Deposits	hotel	1000.00	10000.00	hotel-deposits	WalletCards	active	1660	2026-06-14 19:44:23.785827+00	2026-08-13 19:58:41.600784+00
hotel_rental_items	Rental Items	hotel	900.00	9000.00	hotel-rental-items	Boxes	active	1670	2026-06-14 19:44:23.785827+00	2026-08-13 19:58:41.600784+00
travel_management	Travel Management	travel	3500.00	35000.00	travel	Plane	active	1680	2026-06-14 19:44:23.785827+00	2026-08-13 19:58:41.600784+00
travel_packages	Tour Packages	travel	1400.00	14000.00	travel-packages	Map	active	1690	2026-06-14 19:44:23.785827+00	2026-08-13 19:58:41.600784+00
travel_bookings	Bookings	travel	1400.00	14000.00	travel-bookings	CalendarCheck	active	1700	2026-06-14 19:44:23.785827+00	2026-08-13 19:58:41.600784+00
travel_customers	Travel Customers	travel	1000.00	10000.00	travel-customers	Users	active	1710	2026-06-14 19:44:23.785827+00	2026-08-13 19:58:41.600784+00
customers	Customers	store	1000.00	10000.00	customers	Users	active	50	2026-06-09 21:27:23.00887+00	2026-08-13 19:58:41.600784+00
suppliers	Suppliers	store	800.00	8000.00	suppliers	Building2	active	60	2026-06-09 21:27:23.00887+00	2026-08-13 19:58:41.600784+00
attendance	Attendance	school	1200.00	12000.00	attendance	CheckCircle	active	150	2026-06-10 09:34:21.634902+00	2026-08-13 19:58:41.600784+00
exams_results	Exams & Results	school	1400.00	14000.00	exams	FileText	active	170	2026-06-10 09:34:21.634902+00	2026-08-13 19:58:41.600784+00
timetable	Timetable	school	900.00	9000.00	timetable	Calendar	active	180	2026-06-10 09:34:21.634902+00	2026-08-13 19:58:41.600784+00
parents_portal	Parents Portal	school	1200.00	12000.00	parents	Users	active	190	2026-06-10 09:34:21.634902+00	2026-08-13 19:58:41.600784+00
library	Library	school	800.00	8000.00	library	BookOpen	active	200	2026-06-10 09:34:21.634902+00	2026-08-13 19:58:41.600784+00
travel_visa_documents	Visa Documents	travel	1200.00	12000.00	travel-visa-documents	FileText	active	1720	2026-06-14 19:44:23.785827+00	2026-08-13 19:58:41.600784+00
travel_flight_records	Flight Records	travel	1200.00	12000.00	travel-flights	PlaneTakeoff	active	1730	2026-06-14 19:44:23.785827+00	2026-08-13 19:58:41.600784+00
travel_hotel_reservations	Hotel Reservations	travel	1200.00	12000.00	travel-hotels	Hotel	active	1740	2026-06-14 19:44:23.785827+00	2026-08-13 19:58:41.600784+00
travel_commission	Travel Commission	travel	1100.00	11000.00	travel-commission	Percent	active	1750	2026-06-14 19:44:23.785827+00	2026-08-13 19:58:41.600784+00
real_estate_documents	Property Documents	real_estate	1000.00	10000.00	real-estate-documents	FileText	active	2010	2026-06-14 19:53:37.252876+00	2026-08-13 19:58:41.600784+00
pharmacy_medicine_catalog	Medicine Catalog	pharmacy	1200.00	12000.00	pharmacy-medicines	Tablets	active	2030	2026-06-14 20:04:20.036168+00	2026-08-13 19:58:41.600784+00
pharmacy_inventory	Pharmacy Inventory	pharmacy	1400.00	14000.00	pharmacy-inventory	Boxes	active	2040	2026-06-14 20:04:20.036168+00	2026-08-13 19:58:41.600784+00
pharmacy_batch_expiry	Batch & Expiry Tracking	pharmacy	1300.00	13000.00	pharmacy-batch-expiry	CalendarClock	active	2050	2026-06-14 20:04:20.036168+00	2026-08-13 19:58:41.600784+00
pharmacy_prescription_sales	Prescription Sales	pharmacy	1400.00	14000.00	pharmacy-prescription-sales	FileText	active	2060	2026-06-14 20:04:20.036168+00	2026-08-13 19:58:41.600784+00
pharmacy_supplier_orders	Supplier Orders	pharmacy	1200.00	12000.00	pharmacy-supplier-orders	Truck	active	2070	2026-06-14 20:04:20.036168+00	2026-08-13 19:58:41.600784+00
pharmacy_low_stock_alerts	Low Stock Alerts	pharmacy	900.00	9000.00	pharmacy-low-stock	AlertTriangle	active	2080	2026-06-14 20:04:20.036168+00	2026-08-13 19:58:41.600784+00
logistics_cod_collection	COD Collection	logistics	1200.00	12000.00	logistics-cod	Wallet	active	2160	2026-06-14 20:04:20.036168+00	2026-08-13 19:58:41.600784+00
logistics_route_planning	Route Planning	logistics	1400.00	14000.00	logistics-routes	Route	active	2170	2026-06-14 20:04:20.036168+00	2026-08-13 19:58:41.600784+00
construction_management	Construction Management	construction	3500.00	35000.00	construction	HardHat	active	2180	2026-06-14 20:04:20.036168+00	2026-08-13 19:58:41.600784+00
construction_projects	Projects	construction	1600.00	16000.00	construction-projects	ClipboardList	active	2190	2026-06-14 20:04:20.036168+00	2026-08-13 19:58:41.600784+00
construction_materials	Materials	construction	1400.00	14000.00	construction-materials	Boxes	active	2200	2026-06-14 20:04:20.036168+00	2026-08-13 19:58:41.600784+00
construction_estimates	Estimates	construction	1300.00	13000.00	construction-estimates	Calculator	active	2210	2026-06-14 20:04:20.036168+00	2026-08-13 19:58:41.600784+00
construction_work_orders	Work Orders	construction	1400.00	14000.00	construction-work-orders	Wrench	active	2220	2026-06-14 20:04:20.036168+00	2026-08-13 19:58:41.600784+00
professional_services_clients	Clients	professional_services	1000.00	10000.00	professional-services-clients	Users	active	2270	2026-06-14 20:11:59.249437+00	2026-08-13 19:58:41.600784+00
professional_services_projects	Client Projects	professional_services	1400.00	14000.00	professional-services-projects	ClipboardList	active	2280	2026-06-14 20:11:59.249437+00	2026-08-13 19:58:41.600784+00
professional_services_proposals	Proposals	professional_services	1200.00	12000.00	professional-services-proposals	FileSignature	active	2290	2026-06-14 20:11:59.249437+00	2026-08-13 19:58:41.600784+00
professional_services_contracts	Contracts	professional_services	1200.00	12000.00	professional-services-contracts	FileText	active	2300	2026-06-14 20:11:59.249437+00	2026-08-13 19:58:41.600784+00
ngo_grants	Grants	ngo	1300.00	13000.00	ngo-grants	FilePlus2	active	2400	2026-06-14 20:11:59.249437+00	2026-08-13 19:58:41.600784+00
agriculture_management	Agriculture Management	agriculture	2800.00	28000.00	agriculture	Sprout	active	2420	2026-06-14 20:11:59.249437+00	2026-08-13 19:58:41.600784+00
hr_offer_letters	Offer Letters	hr_recruitment	1000.00	10000.00	hr-offer-letters	FileSignature	active	2880	2026-06-14 20:23:56.438157+00	2026-08-13 19:58:41.600784+00
hr_onboarding	Onboarding	hr_recruitment	1300.00	13000.00	hr-onboarding	UserCheck	active	2890	2026-06-14 20:23:56.438157+00	2026-08-13 19:58:41.600784+00
auto_workshop_jobs	Repair Jobs	auto_workshop	1400.00	14000.00	auto-workshop-jobs	ClipboardList	active	2510	2026-06-14 20:11:59.249437+00	2026-08-13 19:58:41.600784+00
auto_workshop_vehicles	Customer Vehicles	auto_workshop	1200.00	12000.00	auto-workshop-vehicles	Car	active	2520	2026-06-14 20:11:59.249437+00	2026-08-13 19:58:41.600784+00
auto_workshop_parts_inventory	Parts Inventory	auto_workshop	1400.00	14000.00	auto-workshop-parts	Boxes	active	2530	2026-06-14 20:11:59.249437+00	2026-08-13 19:58:41.600784+00
auto_workshop_service_history	Service History	auto_workshop	1100.00	11000.00	auto-workshop-service-history	History	active	2540	2026-06-14 20:11:59.249437+00	2026-08-13 19:58:41.600784+00
auto_workshop_estimates	Repair Estimates	auto_workshop	1000.00	10000.00	auto-workshop-estimates	Calculator	active	2550	2026-06-14 20:11:59.249437+00	2026-08-13 19:58:41.600784+00
auto_workshop_mechanics	Mechanics	auto_workshop	1000.00	10000.00	auto-workshop-mechanics	Users	active	2560	2026-06-14 20:11:59.249437+00	2026-08-13 19:58:41.600784+00
auto_workshop_billing	Workshop Billing	auto_workshop	1300.00	13000.00	auto-workshop-billing	Receipt	active	2570	2026-06-14 20:11:59.249437+00	2026-08-13 19:58:41.600784+00
event_management	Event Management	event_management	3000.00	30000.00	event-management	PartyPopper	active	2580	2026-06-14 20:23:56.438157+00	2026-08-13 19:58:41.600784+00
event_clients	Event Clients	event_management	1000.00	10000.00	event-clients	Users	active	2590	2026-06-14 20:23:56.438157+00	2026-08-13 19:58:41.600784+00
event_bookings	Event Bookings	event_management	1400.00	14000.00	event-bookings	CalendarCheck	active	2600	2026-06-14 20:23:56.438157+00	2026-08-13 19:58:41.600784+00
event_venues	Venues	event_management	1200.00	12000.00	event-venues	MapPin	active	2610	2026-06-14 20:23:56.438157+00	2026-08-13 19:58:41.600784+00
event_vendor_management	Vendor Management	event_management	1200.00	12000.00	event-vendors	Handshake	active	2620	2026-06-14 20:23:56.438157+00	2026-08-13 19:58:41.600784+00
event_budgeting	Event Budgeting	event_management	1300.00	13000.00	event-budgeting	Calculator	active	2630	2026-06-14 20:23:56.438157+00	2026-08-13 19:58:41.600784+00
event_tasks	Event Tasks	event_management	1000.00	10000.00	event-tasks	CheckSquare	active	2640	2026-06-14 20:23:56.438157+00	2026-08-13 19:58:41.600784+00
event_invoicing	Event Invoicing	event_management	1300.00	13000.00	event-invoicing	Receipt	active	2650	2026-06-14 20:23:56.438157+00	2026-08-13 19:58:41.600784+00
law_firm_management	Law Firm Management	law_firm	3500.00	35000.00	law-firm	Scale	active	2660	2026-06-14 20:23:56.438157+00	2026-08-13 19:58:41.600784+00
law_clients	Legal Clients	law_firm	1100.00	11000.00	law-clients	Users	active	2670	2026-06-14 20:23:56.438157+00	2026-08-13 19:58:41.600784+00
law_hearings	Hearings	law_firm	1200.00	12000.00	law-hearings	CalendarDays	active	2690	2026-06-14 20:23:56.438157+00	2026-08-13 19:58:41.600784+00
law_documents	Legal Documents	law_firm	1300.00	13000.00	law-documents	FileText	active	2700	2026-06-14 20:23:56.438157+00	2026-08-13 19:58:41.600784+00
law_billing	Legal Billing	law_firm	1400.00	14000.00	law-billing	Receipt	active	2710	2026-06-14 20:23:56.438157+00	2026-08-13 19:58:41.600784+00
law_time_tracking	Legal Time Tracking	law_firm	1200.00	12000.00	law-time-tracking	Clock	active	2720	2026-06-14 20:23:56.438157+00	2026-08-13 19:58:41.600784+00
law_compliance	Compliance	law_firm	1200.00	12000.00	law-compliance	ShieldCheck	active	2730	2026-06-14 20:23:56.438157+00	2026-08-13 19:58:41.600784+00
accounting_tax_management	Accounting & Tax Management	accounting_tax	3500.00	35000.00	accounting-tax	Calculator	active	2740	2026-06-14 20:23:56.438157+00	2026-08-13 19:58:41.600784+00
accounting_clients	Accounting Clients	accounting_tax	1000.00	10000.00	accounting-clients	Users	active	2750	2026-06-14 20:23:56.438157+00	2026-08-13 19:58:41.600784+00
accounting_bookkeeping	Bookkeeping	accounting_tax	1500.00	15000.00	accounting-bookkeeping	BookOpen	active	2760	2026-06-14 20:23:56.438157+00	2026-08-13 19:58:41.600784+00
accounting_tax_returns	Tax Returns	accounting_tax	1600.00	16000.00	accounting-tax-returns	FileCheck	active	2770	2026-06-14 20:23:56.438157+00	2026-08-13 19:58:41.600784+00
accounting_expenses	Expense Tracking	accounting_tax	1000.00	10000.00	accounting-expenses	Receipt	active	2780	2026-06-14 20:23:56.438157+00	2026-08-13 19:58:41.600784+00
accounting_reports	Financial Reports	accounting_tax	1300.00	13000.00	accounting-reports	BarChart3	active	2790	2026-06-14 20:23:56.438157+00	2026-08-13 19:58:41.600784+00
accounting_payroll	Payroll	accounting_tax	1500.00	15000.00	accounting-payroll	WalletCards	active	2800	2026-06-14 20:23:56.438157+00	2026-08-13 19:58:41.600784+00
accounting_audit_files	Audit Files	accounting_tax	1200.00	12000.00	accounting-audit-files	FolderOpen	active	2810	2026-06-14 20:23:56.438157+00	2026-08-13 19:58:41.600784+00
\.


--
-- Data for Name: plan_modules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.plan_modules (plan_id, module_id, created_at) FROM stdin;
store_pro	store_management	2026-06-09 21:27:23.00887+00
store_pro	products	2026-06-09 21:27:23.00887+00
store_pro	inventory	2026-06-09 21:27:23.00887+00
store_pro	sales_orders	2026-06-09 21:27:23.00887+00
store_pro	customers	2026-06-09 21:27:23.00887+00
store_pro	suppliers	2026-06-09 21:27:23.00887+00
store_pro	reports	2026-06-09 21:27:23.00887+00
store_pro	billing	2026-06-10 09:34:21.634902+00
school_pro	school_management	2026-06-10 09:34:21.634902+00
school_pro	students	2026-06-10 09:34:21.634902+00
school_pro	teachers	2026-06-10 09:34:21.634902+00
school_pro	classes_sections	2026-06-10 09:34:21.634902+00
school_pro	attendance	2026-06-10 09:34:21.634902+00
school_pro	fees	2026-06-10 09:34:21.634902+00
school_pro	exams_results	2026-06-10 09:34:21.634902+00
school_pro	timetable	2026-06-10 09:34:21.634902+00
school_pro	parents_portal	2026-06-10 09:34:21.634902+00
school_pro	library	2026-06-10 09:34:21.634902+00
restaurant_pro	restaurant_management	2026-06-10 09:34:21.634902+00
restaurant_pro	menu_items	2026-06-10 09:34:21.634902+00
restaurant_pro	tables_orders	2026-06-10 09:34:21.634902+00
restaurant_pro	kitchen_display	2026-06-10 09:34:21.634902+00
restaurant_pro	restaurant_billing	2026-06-10 09:34:21.634902+00
restaurant_pro	reports	2026-06-10 09:34:21.634902+00
clinic_pro	clinic_management	2026-06-10 09:34:21.634902+00
clinic_pro	patients	2026-06-10 09:34:21.634902+00
clinic_pro	appointments	2026-06-10 09:34:21.634902+00
clinic_pro	doctors	2026-06-10 09:34:21.634902+00
clinic_pro	prescriptions	2026-06-10 09:34:21.634902+00
clinic_pro	clinic_billing	2026-06-10 09:34:21.634902+00
clinic_pro	reports	2026-06-10 09:34:21.634902+00
store_start	store_management	2026-06-11 23:52:01.788235+00
store_start	products	2026-06-11 23:52:01.788235+00
store_start	inventory	2026-06-11 23:52:01.788235+00
store_start	sales_orders	2026-06-11 23:52:01.788235+00
store_start	customers	2026-06-11 23:52:01.788235+00
store_start	suppliers	2026-06-11 23:52:01.788235+00
store_start	billing	2026-06-11 23:52:01.788235+00
store_start	reports	2026-06-11 23:52:01.788235+00
restaurant_start	restaurant_management	2026-06-11 23:52:01.788235+00
restaurant_start	products	2026-06-11 23:52:01.788235+00
restaurant_start	inventory	2026-06-11 23:52:01.788235+00
restaurant_start	sales_orders	2026-06-11 23:52:01.788235+00
restaurant_start	customers	2026-06-11 23:52:01.788235+00
restaurant_start	suppliers	2026-06-11 23:52:01.788235+00
restaurant_start	billing	2026-06-11 23:52:01.788235+00
restaurant_start	reports	2026-06-11 23:52:01.788235+00
school_start	school_management	2026-06-11 23:52:01.788235+00
school_start	customers	2026-06-11 23:52:01.788235+00
school_start	billing	2026-06-11 23:52:01.788235+00
school_start	reports	2026-06-11 23:52:01.788235+00
school_start	website	2026-06-11 23:52:01.788235+00
clinic_start	clinic_management	2026-06-11 23:52:01.788235+00
clinic_start	customers	2026-06-11 23:52:01.788235+00
clinic_start	billing	2026-06-11 23:52:01.788235+00
clinic_start	reports	2026-06-11 23:52:01.788235+00
clinic_start	crm	2026-06-11 23:52:01.788235+00
school_start	students	2026-06-11 23:53:07.274937+00
school_start	teachers	2026-06-11 23:53:07.274937+00
school_start	classes_sections	2026-06-11 23:53:07.274937+00
school_start	attendance	2026-06-11 23:53:07.274937+00
restaurant_start	menu_items	2026-06-11 23:53:07.274937+00
restaurant_start	tables_orders	2026-06-11 23:53:07.274937+00
clinic_start	patients	2026-06-11 23:53:07.274937+00
clinic_start	appointments	2026-06-11 23:53:07.274937+00
clinic_start	doctors	2026-06-11 23:53:07.274937+00
business_plus	store_management	2026-06-16 20:57:02.931952+00
business_plus	inventory	2026-06-16 20:57:02.931952+00
business_plus	sales_orders	2026-06-16 20:57:02.931952+00
business_plus	customers	2026-06-16 20:57:02.931952+00
business_plus	suppliers	2026-06-16 20:57:02.931952+00
business_plus	billing	2026-06-16 20:57:02.931952+00
business_plus	reports	2026-06-16 20:57:02.931952+00
business_plus	crm	2026-06-16 20:57:02.931952+00
business_plus	website	2026-06-16 20:57:02.931952+00
business_plus	products	2026-06-16 20:57:02.931952+00
starter	core_dashboard	2026-06-16 21:00:35.999748+00
starter	core_branches	2026-06-16 21:00:35.999748+00
starter	core_company_profile	2026-06-16 21:00:35.999748+00
starter	core_users	2026-06-16 21:00:35.999748+00
starter	core_roles_permissions	2026-06-16 21:00:35.999748+00
starter	core_files	2026-06-16 21:00:35.999748+00
starter	core_calendar	2026-06-16 21:00:35.999748+00
starter	core_notifications	2026-06-16 21:00:35.999748+00
starter	core_activity_logs	2026-06-16 21:00:35.999748+00
starter	core_import_export	2026-06-16 21:00:35.999748+00
starter	core_custom_fields	2026-06-16 21:00:35.999748+00
starter	core_tasks	2026-06-16 21:00:35.999748+00
pro	core_dashboard	2026-06-16 21:00:35.999748+00
pro	core_branches	2026-06-16 21:00:35.999748+00
pro	online_storefront	2026-06-16 21:00:35.999748+00
pro	shipping_delivery	2026-06-16 21:00:35.999748+00
pro	reservations	2026-06-16 21:00:35.999748+00
pro	clinic_medical_records	2026-06-16 21:00:35.999748+00
pro	ecommerce_cart_checkout	2026-06-16 21:00:35.999748+00
pro	ecommerce_shipping	2026-06-16 21:00:35.999748+00
pro	ecommerce_coupons	2026-06-16 21:00:35.999748+00
pro	ecommerce_reviews	2026-06-16 21:00:35.999748+00
pro	ecommerce_marketplace	2026-06-16 21:00:35.999748+00
pro	delivery_orders	2026-06-16 21:00:35.999748+00
pro	ecommerce_abandoned_cart	2026-06-16 21:00:35.999748+00
pro	food_inventory	2026-06-16 21:00:35.999748+00
pro	waiter_app	2026-06-16 21:00:35.999748+00
pro	recipe_costing	2026-06-16 21:00:35.999748+00
pro	school_management	2026-06-16 21:00:35.999748+00
pro	students	2026-06-16 21:00:35.999748+00
pro	teachers	2026-06-16 21:00:35.999748+00
pro	classes_sections	2026-06-16 21:00:35.999748+00
pro	attendance	2026-06-16 21:00:35.999748+00
pro	fees	2026-06-16 21:00:35.999748+00
pro	exams_results	2026-06-16 21:00:35.999748+00
pro	clinic_doctor_schedule	2026-06-16 21:00:35.999748+00
pro	clinic_vitals	2026-06-16 21:00:35.999748+00
pro	clinic_insurance_claims	2026-06-16 21:00:35.999748+00
pro	grades	2026-06-16 21:00:35.999748+00
pro	transport	2026-06-16 21:00:35.999748+00
pro	lms	2026-06-16 21:00:35.999748+00
pro	medical_records	2026-06-16 21:00:35.999748+00
pro	lab_reports	2026-06-16 21:00:35.999748+00
pro	patient_portal	2026-06-16 21:00:35.999748+00
pro	core_company_profile	2026-06-16 21:00:35.999748+00
pro	core_users	2026-06-16 21:00:35.999748+00
pro	core_roles_permissions	2026-06-16 21:00:35.999748+00
pro	core_files	2026-06-16 21:00:35.999748+00
pro	core_calendar	2026-06-16 21:00:35.999748+00
pro	core_notifications	2026-06-16 21:00:35.999748+00
pro	core_activity_logs	2026-06-16 21:00:35.999748+00
pro	core_import_export	2026-06-16 21:00:35.999748+00
pro	core_custom_fields	2026-06-16 21:00:35.999748+00
pro	core_tasks	2026-06-16 21:00:35.999748+00
pro	restaurant_recipe_costing	2026-06-16 21:00:35.999748+00
pro	restaurant_floor_plan	2026-06-16 21:00:35.999748+00
pro	restaurant_modifiers_addons	2026-06-16 21:00:35.999748+00
pro	restaurant_shift_cash	2026-06-16 21:00:35.999748+00
pro	school_admissions	2026-06-16 21:00:35.999748+00
pro	school_grades	2026-06-16 21:00:35.999748+00
pro	school_transport	2026-06-16 21:00:35.999748+00
pro	school_hostel	2026-06-16 21:00:35.999748+00
pro	queue_management	2026-06-16 21:00:35.999748+00
pro	timetable	2026-06-16 21:00:35.999748+00
pro	parents_portal	2026-06-16 21:00:35.999748+00
pro	library	2026-06-16 21:00:35.999748+00
pro	menu_items	2026-06-16 21:00:35.999748+00
pro	tables_orders	2026-06-16 21:00:35.999748+00
pro	kitchen_display	2026-06-16 21:00:35.999748+00
pro	restaurant_billing	2026-06-16 21:00:35.999748+00
pro	patients	2026-06-16 21:00:35.999748+00
pro	appointments	2026-06-16 21:00:35.999748+00
pro	hostel	2026-06-16 21:00:35.999748+00
pro	restaurant_reservations	2026-06-16 21:00:35.999748+00
pro	restaurant_delivery_orders	2026-06-16 21:00:35.999748+00
pro	restaurant_food_inventory	2026-06-16 21:00:35.999748+00
pro	restaurant_waiter_app	2026-06-16 21:00:35.999748+00
pro	school_lms	2026-06-16 21:00:35.999748+00
pro	school_homework	2026-06-16 21:00:35.999748+00
pro	school_online_classes	2026-06-16 21:00:35.999748+00
pro	clinic_management	2026-06-16 21:00:35.999748+00
pro	doctors	2026-06-16 21:00:35.999748+00
pro	prescriptions	2026-06-16 21:00:35.999748+00
pro	clinic_billing	2026-06-16 21:00:35.999748+00
pro	clinic_lab_reports	2026-06-16 21:00:35.999748+00
pro	clinic_pharmacy_stock	2026-06-16 21:00:35.999748+00
pro	clinic_patient_portal	2026-06-16 21:00:35.999748+00
pro	restaurant_management	2026-06-16 21:00:35.999748+00
pro	pharmacy_stock	2026-06-16 21:00:35.999748+00
pro	clinic_queue_management	2026-06-16 21:00:35.999748+00
pro	ecommerce_management	2026-06-16 21:00:35.999748+00
pro	ecommerce_storefront	2026-06-16 21:00:35.999748+00
pro	ecommerce_orders	2026-06-16 21:00:35.999748+00
pro	ecommerce_products	2026-06-16 21:00:35.999748+00
pro	admissions	2026-06-16 21:00:35.999748+00
pro	school_certificates	2026-06-16 21:00:35.999748+00
enterprise	pos_terminal	2026-06-16 21:00:35.999748+00
enterprise	core_dashboard	2026-06-16 21:00:35.999748+00
enterprise	core_branches	2026-06-16 21:00:35.999748+00
enterprise	barcode_labeling	2026-06-16 21:00:35.999748+00
enterprise	stock_transfer	2026-06-16 21:00:35.999748+00
enterprise	purchase_orders	2026-06-16 21:00:35.999748+00
enterprise	customer_loyalty	2026-06-16 21:00:35.999748+00
enterprise	online_storefront	2026-06-16 21:00:35.999748+00
enterprise	shipping_delivery	2026-06-16 21:00:35.999748+00
enterprise	reservations	2026-06-16 21:00:35.999748+00
enterprise	clinic_medical_records	2026-06-16 21:00:35.999748+00
enterprise	ecommerce_cart_checkout	2026-06-16 21:00:35.999748+00
enterprise	ecommerce_shipping	2026-06-16 21:00:35.999748+00
enterprise	ecommerce_coupons	2026-06-16 21:00:35.999748+00
enterprise	ecommerce_reviews	2026-06-16 21:00:35.999748+00
enterprise	ecommerce_marketplace	2026-06-16 21:00:35.999748+00
enterprise	delivery_orders	2026-06-16 21:00:35.999748+00
enterprise	ecommerce_abandoned_cart	2026-06-16 21:00:35.999748+00
enterprise	manufacturing_material_planning	2026-06-16 21:00:35.999748+00
enterprise	manufacturing_costing	2026-06-16 21:00:35.999748+00
enterprise	food_inventory	2026-06-16 21:00:35.999748+00
enterprise	waiter_app	2026-06-16 21:00:35.999748+00
enterprise	recipe_costing	2026-06-16 21:00:35.999748+00
enterprise	school_management	2026-06-16 21:00:35.999748+00
enterprise	students	2026-06-16 21:00:35.999748+00
enterprise	manufacturing_maintenance	2026-06-16 21:00:35.999748+00
enterprise	real_estate_sales	2026-06-16 21:00:35.999748+00
enterprise	professional_services_management	2026-06-16 21:00:35.999748+00
enterprise	test	2026-06-16 21:00:35.999748+00
enterprise	teachers	2026-06-16 21:00:35.999748+00
enterprise	classes_sections	2026-06-16 21:00:35.999748+00
enterprise	attendance	2026-06-16 21:00:35.999748+00
enterprise	fees	2026-06-16 21:00:35.999748+00
enterprise	exams_results	2026-06-16 21:00:35.999748+00
enterprise	test1	2026-06-16 21:00:35.999748+00
enterprise	clinic_doctor_schedule	2026-06-16 21:00:35.999748+00
enterprise	clinic_vitals	2026-06-16 21:00:35.999748+00
enterprise	clinic_insurance_claims	2026-06-16 21:00:35.999748+00
enterprise	grades	2026-06-16 21:00:35.999748+00
enterprise	transport	2026-06-16 21:00:35.999748+00
enterprise	lms	2026-06-16 21:00:35.999748+00
enterprise	medical_records	2026-06-16 21:00:35.999748+00
enterprise	dental_management	2026-06-16 21:00:35.999748+00
enterprise	dental_charting	2026-06-16 21:00:35.999748+00
enterprise	dental_treatment_plans	2026-06-16 21:00:35.999748+00
enterprise	lab_reports	2026-06-16 21:00:35.999748+00
enterprise	patient_portal	2026-06-16 21:00:35.999748+00
enterprise	core_company_profile	2026-06-16 21:00:35.999748+00
enterprise	core_users	2026-06-16 21:00:35.999748+00
enterprise	core_roles_permissions	2026-06-16 21:00:35.999748+00
enterprise	core_files	2026-06-16 21:00:35.999748+00
enterprise	core_calendar	2026-06-16 21:00:35.999748+00
enterprise	core_notifications	2026-06-16 21:00:35.999748+00
enterprise	core_activity_logs	2026-06-16 21:00:35.999748+00
enterprise	core_import_export	2026-06-16 21:00:35.999748+00
enterprise	core_custom_fields	2026-06-16 21:00:35.999748+00
enterprise	core_tasks	2026-06-16 21:00:35.999748+00
enterprise	restaurant_recipe_costing	2026-06-16 21:00:35.999748+00
enterprise	restaurant_floor_plan	2026-06-16 21:00:35.999748+00
enterprise	restaurant_modifiers_addons	2026-06-16 21:00:35.999748+00
enterprise	restaurant_shift_cash	2026-06-16 21:00:35.999748+00
enterprise	school_admissions	2026-06-16 21:00:35.999748+00
enterprise	school_grades	2026-06-16 21:00:35.999748+00
enterprise	school_transport	2026-06-16 21:00:35.999748+00
enterprise	school_hostel	2026-06-16 21:00:35.999748+00
enterprise	dental_lab_cases	2026-06-16 21:00:35.999748+00
enterprise	dental_xray_records	2026-06-16 21:00:35.999748+00
enterprise	queue_management	2026-06-16 21:00:35.999748+00
enterprise	timetable	2026-06-16 21:00:35.999748+00
enterprise	store_pos_terminal	2026-06-16 21:00:35.999748+00
enterprise	real_estate_properties	2026-06-16 21:00:35.999748+00
enterprise	real_estate_leads	2026-06-16 21:00:35.999748+00
enterprise	real_estate_rentals	2026-06-16 21:00:35.999748+00
enterprise	pharmacy_compliance_reports	2026-06-16 21:00:35.999748+00
enterprise	logistics_management	2026-06-16 21:00:35.999748+00
enterprise	logistics_shipments	2026-06-16 21:00:35.999748+00
enterprise	logistics_pickups	2026-06-16 21:00:35.999748+00
enterprise	professional_services_clients	2026-06-16 21:00:35.999748+00
enterprise	auto_workshop_mechanics	2026-06-16 21:00:35.999748+00
enterprise	auto_workshop_billing	2026-06-16 21:00:35.999748+00
enterprise	treatment_plans	2026-06-16 21:00:35.999748+00
enterprise	professional_services_time_tracking	2026-06-16 21:00:35.999748+00
enterprise	payment_records	2026-06-16 21:00:35.999748+00
enterprise	professional_services_invoicing	2026-06-16 21:00:35.999748+00
enterprise	ngo_management	2026-06-16 21:00:35.999748+00
enterprise	subscription_billing	2026-06-16 21:00:35.999748+00
enterprise	license_keys	2026-06-16 21:00:35.999748+00
enterprise	rbac_roles	2026-06-16 21:00:35.999748+00
enterprise	audit_logs	2026-06-16 21:00:35.999748+00
enterprise	store_management	2026-06-16 21:00:35.999748+00
enterprise	salon_management	2026-06-16 21:00:35.999748+00
enterprise	hotel_deposits	2026-06-16 21:00:35.999748+00
enterprise	pharmacy_supplier_orders	2026-06-16 21:00:35.999748+00
enterprise	pharmacy_low_stock_alerts	2026-06-16 21:00:35.999748+00
enterprise	logistics_delivery_tracking	2026-06-16 21:00:35.999748+00
enterprise	logistics_driver_management	2026-06-16 21:00:35.999748+00
enterprise	logistics_vehicle_fleet	2026-06-16 21:00:35.999748+00
enterprise	logistics_cod_collection	2026-06-16 21:00:35.999748+00
enterprise	logistics_route_planning	2026-06-16 21:00:35.999748+00
enterprise	construction_management	2026-06-16 21:00:35.999748+00
enterprise	construction_projects	2026-06-16 21:00:35.999748+00
enterprise	construction_materials	2026-06-16 21:00:35.999748+00
enterprise	construction_estimates	2026-06-16 21:00:35.999748+00
enterprise	construction_work_orders	2026-06-16 21:00:35.999748+00
enterprise	construction_contractors	2026-06-16 21:00:35.999748+00
enterprise	construction_site_attendance	2026-06-16 21:00:35.999748+00
enterprise	construction_progress_reports	2026-06-16 21:00:35.999748+00
enterprise	parents_portal	2026-06-16 21:00:35.999748+00
enterprise	library	2026-06-16 21:00:35.999748+00
enterprise	menu_items	2026-06-16 21:00:35.999748+00
enterprise	tables_orders	2026-06-16 21:00:35.999748+00
enterprise	kitchen_display	2026-06-16 21:00:35.999748+00
enterprise	restaurant_billing	2026-06-16 21:00:35.999748+00
enterprise	patients	2026-06-16 21:00:35.999748+00
enterprise	appointments	2026-06-16 21:00:35.999748+00
enterprise	crm	2026-06-16 21:00:35.999748+00
enterprise	website	2026-06-16 21:00:35.999748+00
enterprise	hostel	2026-06-16 21:00:35.999748+00
enterprise	tax_management	2026-06-16 21:00:35.999748+00
enterprise	api_keys	2026-06-16 21:00:35.999748+00
enterprise	webhooks	2026-06-16 21:00:35.999748+00
enterprise	email_sms	2026-06-16 21:00:35.999748+00
enterprise	whatsapp	2026-06-16 21:00:35.999748+00
enterprise	store_barcode_labeling	2026-06-16 21:00:35.999748+00
enterprise	store_stock_transfer	2026-06-16 21:00:35.999748+00
enterprise	store_purchase_orders	2026-06-16 21:00:35.999748+00
enterprise	store_customer_loyalty	2026-06-16 21:00:35.999748+00
enterprise	store_returns_refunds	2026-06-16 21:00:35.999748+00
enterprise	analytics_dashboard	2026-06-16 21:00:35.999748+00
enterprise	custom_reports	2026-06-16 21:00:35.999748+00
enterprise	ai_assistant	2026-06-16 21:00:35.999748+00
enterprise	store_price_lists	2026-06-16 21:00:35.999748+00
enterprise	store_low_stock_alerts	2026-06-16 21:00:35.999748+00
enterprise	restaurant_reservations	2026-06-16 21:00:35.999748+00
enterprise	restaurant_delivery_orders	2026-06-16 21:00:35.999748+00
enterprise	restaurant_food_inventory	2026-06-16 21:00:35.999748+00
enterprise	restaurant_waiter_app	2026-06-16 21:00:35.999748+00
enterprise	ai_forecasting	2026-06-16 21:00:35.999748+00
enterprise	workflow_automation	2026-06-16 21:00:35.999748+00
enterprise	school_lms	2026-06-16 21:00:35.999748+00
enterprise	school_homework	2026-06-16 21:00:35.999748+00
enterprise	school_online_classes	2026-06-16 21:00:35.999748+00
enterprise	clinic_management	2026-06-16 21:00:35.999748+00
enterprise	doctors	2026-06-16 21:00:35.999748+00
enterprise	prescriptions	2026-06-16 21:00:35.999748+00
enterprise	clinic_billing	2026-06-16 21:00:35.999748+00
enterprise	clinic_lab_reports	2026-06-16 21:00:35.999748+00
enterprise	clinic_pharmacy_stock	2026-06-16 21:00:35.999748+00
enterprise	clinic_patient_portal	2026-06-16 21:00:35.999748+00
enterprise	dental_patient_recall	2026-06-16 21:00:35.999748+00
enterprise	products	2026-06-16 21:00:35.999748+00
enterprise	dental_orthodontics	2026-06-16 21:00:35.999748+00
enterprise	salon_service_menu	2026-06-16 21:00:35.999748+00
enterprise	salon_booking	2026-06-16 21:00:35.999748+00
enterprise	salon_staff_scheduling	2026-06-16 21:00:35.999748+00
enterprise	salon_memberships	2026-06-16 21:00:35.999748+00
enterprise	salon_packages	2026-06-16 21:00:35.999748+00
enterprise	salon_products	2026-06-16 21:00:35.999748+00
enterprise	salon_commission	2026-06-16 21:00:35.999748+00
enterprise	hotel_room_booking	2026-06-16 21:00:35.999748+00
enterprise	inventory	2026-06-16 21:00:35.999748+00
enterprise	sales_orders	2026-06-16 21:00:35.999748+00
enterprise	customers	2026-06-16 21:00:35.999748+00
enterprise	suppliers	2026-06-16 21:00:35.999748+00
enterprise	billing	2026-06-16 21:00:35.999748+00
enterprise	reports	2026-06-16 21:00:35.999748+00
enterprise	restaurant_management	2026-06-16 21:00:35.999748+00
enterprise	hotel_checkin_checkout	2026-06-16 21:00:35.999748+00
enterprise	hotel_room_status	2026-06-16 21:00:35.999748+00
enterprise	hotel_housekeeping	2026-06-16 21:00:35.999748+00
enterprise	hotel_guest_records	2026-06-16 21:00:35.999748+00
enterprise	pharmacy_stock	2026-06-16 21:00:35.999748+00
enterprise	clinic_queue_management	2026-06-16 21:00:35.999748+00
enterprise	dental_billing	2026-06-16 21:00:35.999748+00
enterprise	hotel_management	2026-06-16 21:00:35.999748+00
enterprise	travel_management	2026-06-16 21:00:35.999748+00
enterprise	travel_packages	2026-06-16 21:00:35.999748+00
enterprise	travel_bookings	2026-06-16 21:00:35.999748+00
enterprise	travel_customers	2026-06-16 21:00:35.999748+00
enterprise	travel_visa_documents	2026-06-16 21:00:35.999748+00
enterprise	travel_flight_records	2026-06-16 21:00:35.999748+00
enterprise	travel_hotel_reservations	2026-06-16 21:00:35.999748+00
enterprise	travel_commission	2026-06-16 21:00:35.999748+00
enterprise	ecommerce_management	2026-06-16 21:00:35.999748+00
enterprise	ecommerce_storefront	2026-06-16 21:00:35.999748+00
enterprise	ecommerce_orders	2026-06-16 21:00:35.999748+00
enterprise	ecommerce_products	2026-06-16 21:00:35.999748+00
enterprise	manufacturing_bom	2026-06-16 21:00:35.999748+00
enterprise	manufacturing_production_orders	2026-06-16 21:00:35.999748+00
enterprise	manufacturing_workstations	2026-06-16 21:00:35.999748+00
enterprise	manufacturing_quality_control	2026-06-16 21:00:35.999748+00
enterprise	professional_services_contracts	2026-06-16 21:00:35.999748+00
enterprise	professional_services_retainer_billing	2026-06-16 21:00:35.999748+00
enterprise	ngo_donors	2026-06-16 21:00:35.999748+00
enterprise	ngo_donations	2026-06-16 21:00:35.999748+00
enterprise	manufacturing_management	2026-06-16 21:00:35.999748+00
enterprise	real_estate_management	2026-06-16 21:00:35.999748+00
enterprise	real_estate_visits	2026-06-16 21:00:35.999748+00
enterprise	admissions	2026-06-16 21:00:35.999748+00
enterprise	real_estate_commission	2026-06-16 21:00:35.999748+00
enterprise	service_menu	2026-06-16 21:00:35.999748+00
enterprise	staff_scheduling	2026-06-16 21:00:35.999748+00
enterprise	memberships	2026-06-16 21:00:35.999748+00
enterprise	commission	2026-06-16 21:00:35.999748+00
enterprise	room_booking	2026-06-16 21:00:35.999748+00
enterprise	housekeeping	2026-06-16 21:00:35.999748+00
enterprise	checkin_checkout	2026-06-16 21:00:35.999748+00
enterprise	repair_management	2026-06-16 21:00:35.999748+00
enterprise	tickets	2026-06-16 21:00:35.999748+00
enterprise	job_cards	2026-06-16 21:00:35.999748+00
enterprise	field_staff	2026-06-16 21:00:35.999748+00
enterprise	warranty	2026-06-16 21:00:35.999748+00
enterprise	bom	2026-06-16 21:00:35.999748+00
enterprise	production_orders	2026-06-16 21:00:35.999748+00
enterprise	quality_control	2026-06-16 21:00:35.999748+00
enterprise	properties	2026-06-16 21:00:35.999748+00
enterprise	leads_pipeline	2026-06-16 21:00:35.999748+00
enterprise	rentals	2026-06-16 21:00:35.999748+00
enterprise	gym_management	2026-06-16 21:00:35.999748+00
enterprise	trainer_schedule	2026-06-16 21:00:35.999748+00
enterprise	fitness_memberships	2026-06-16 21:00:35.999748+00
enterprise	accounting	2026-06-16 21:00:35.999748+00
enterprise	expenses	2026-06-16 21:00:35.999748+00
enterprise	ledger	2026-06-16 21:00:35.999748+00
enterprise	real_estate_documents	2026-06-16 21:00:35.999748+00
enterprise	pharmacy_management	2026-06-16 21:00:35.999748+00
enterprise	pharmacy_medicine_catalog	2026-06-16 21:00:35.999748+00
enterprise	pharmacy_inventory	2026-06-16 21:00:35.999748+00
enterprise	pharmacy_batch_expiry	2026-06-16 21:00:35.999748+00
enterprise	pharmacy_prescription_sales	2026-06-16 21:00:35.999748+00
enterprise	agriculture_fields	2026-06-16 21:00:35.999748+00
enterprise	agriculture_crops	2026-06-16 21:00:35.999748+00
enterprise	law_documents	2026-06-16 21:00:35.999748+00
enterprise	law_billing	2026-06-16 21:00:35.999748+00
enterprise	law_time_tracking	2026-06-16 21:00:35.999748+00
enterprise	law_compliance	2026-06-16 21:00:35.999748+00
enterprise	accounting_tax_management	2026-06-16 21:00:35.999748+00
enterprise	accounting_clients	2026-06-16 21:00:35.999748+00
enterprise	accounting_bookkeeping	2026-06-16 21:00:35.999748+00
enterprise	accounting_tax_returns	2026-06-16 21:00:35.999748+00
enterprise	accounting_expenses	2026-06-16 21:00:35.999748+00
enterprise	accounting_reports	2026-06-16 21:00:35.999748+00
enterprise	accounting_payroll	2026-06-16 21:00:35.999748+00
enterprise	accounting_audit_files	2026-06-16 21:00:35.999748+00
enterprise	event_venues	2026-06-16 21:00:35.999748+00
enterprise	event_vendor_management	2026-06-16 21:00:35.999748+00
enterprise	event_budgeting	2026-06-16 21:00:35.999748+00
enterprise	event_tasks	2026-06-16 21:00:35.999748+00
enterprise	event_invoicing	2026-06-16 21:00:35.999748+00
enterprise	law_firm_management	2026-06-16 21:00:35.999748+00
enterprise	law_clients	2026-06-16 21:00:35.999748+00
enterprise	law_cases	2026-06-16 21:00:35.999748+00
enterprise	law_hearings	2026-06-16 21:00:35.999748+00
enterprise	agriculture_livestock	2026-06-16 21:00:35.999748+00
enterprise	agriculture_inputs	2026-06-16 21:00:35.999748+00
enterprise	agriculture_harvest	2026-06-16 21:00:35.999748+00
enterprise	agriculture_expenses	2026-06-16 21:00:35.999748+00
enterprise	agriculture_sales	2026-06-16 21:00:35.999748+00
enterprise	auto_workshop_management	2026-06-16 21:00:35.999748+00
enterprise	auto_workshop_jobs	2026-06-16 21:00:35.999748+00
enterprise	auto_workshop_vehicles	2026-06-16 21:00:35.999748+00
enterprise	auto_workshop_parts_inventory	2026-06-16 21:00:35.999748+00
enterprise	auto_workshop_service_history	2026-06-16 21:00:35.999748+00
enterprise	auto_workshop_estimates	2026-06-16 21:00:35.999748+00
enterprise	event_management	2026-06-16 21:00:35.999748+00
enterprise	event_clients	2026-06-16 21:00:35.999748+00
enterprise	event_bookings	2026-06-16 21:00:35.999748+00
enterprise	hr_recruitment_management	2026-06-16 21:00:35.999748+00
enterprise	hr_candidates	2026-06-16 21:00:35.999748+00
enterprise	hr_jobs	2026-06-16 21:00:35.999748+00
enterprise	hr_applications	2026-06-16 21:00:35.999748+00
enterprise	hr_interviews	2026-06-16 21:00:35.999748+00
enterprise	hr_clients	2026-06-16 21:00:35.999748+00
enterprise	hr_offer_letters	2026-06-16 21:00:35.999748+00
enterprise	hr_onboarding	2026-06-16 21:00:35.999748+00
enterprise	school_certificates	2026-06-16 21:00:35.999748+00
enterprise	hotel_rental_items	2026-06-16 21:00:35.999748+00
enterprise	professional_services_projects	2026-06-16 21:00:35.999748+00
enterprise	professional_services_proposals	2026-06-16 21:00:35.999748+00
enterprise	ngo_campaigns	2026-06-16 21:00:35.999748+00
enterprise	ngo_beneficiaries	2026-06-16 21:00:35.999748+00
enterprise	ngo_volunteers	2026-06-16 21:00:35.999748+00
enterprise	ngo_grants	2026-06-16 21:00:35.999748+00
enterprise	ngo_impact_reports	2026-06-16 21:00:35.999748+00
enterprise	agriculture_management	2026-06-16 21:00:35.999748+00
\.


--
-- Data for Name: plans; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.plans (id, name, monthly_price, yearly_price, status, sort_order, created_at, updated_at) FROM stdin;
starter	Starter	2500.00	25000.00	active	10	2026-06-16 21:00:35.999748+00	2026-06-16 21:34:55.022946+00
pro	Pro	7500.00	75000.00	active	20	2026-06-16 21:00:35.999748+00	2026-06-16 21:34:55.022946+00
enterprise	Enterprise	15000.00	150000.00	active	30	2026-06-16 21:00:35.999748+00	2026-06-16 21:34:55.022946+00
custom	Custom	0.00	0.00	active	40	2026-06-16 21:00:35.999748+00	2026-06-16 21:34:55.022946+00
store_start	Store Start	2500.00	25000.00	inactive	10	2026-06-09 21:27:23.00887+00	2026-08-13 19:58:41.597308+00
store_pro	Store Pro	5500.00	55000.00	inactive	20	2026-06-09 21:27:23.00887+00	2026-08-13 19:58:41.597308+00
school_start	School Start	4500.00	45000.00	inactive	30	2026-06-10 09:34:21.634902+00	2026-08-13 19:58:41.597308+00
school_pro	School Pro	9500.00	95000.00	inactive	40	2026-06-10 09:34:21.634902+00	2026-08-13 19:58:41.597308+00
restaurant_start	Restaurant Start	3500.00	35000.00	inactive	50	2026-06-10 09:34:21.634902+00	2026-08-13 19:58:41.597308+00
restaurant_pro	Restaurant Pro	7500.00	75000.00	inactive	60	2026-06-10 09:34:21.634902+00	2026-08-13 19:58:41.597308+00
clinic_start	Clinic Start	4500.00	45000.00	inactive	70	2026-06-10 09:34:21.634902+00	2026-08-13 19:58:41.597308+00
clinic_pro	Clinic Pro	8500.00	85000.00	inactive	80	2026-06-10 09:34:21.634902+00	2026-08-13 19:58:41.597308+00
business_plus	Business Plus	12000.00	120000.00	inactive	90	2026-06-09 21:27:23.00887+00	2026-08-13 19:58:41.597308+00
enterprise_manual	Enterprise Manual	0.00	0.00	inactive	100	2026-06-09 21:27:23.00887+00	2026-08-13 19:58:41.597308+00
\.


--
-- Data for Name: rbac_audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rbac_audit_logs (id, actor_user_id, role_id, tenant_id, action, detail, ip_address, user_agent, created_at) FROM stdin;
1	adb6bf84-0d87-4ffc-a571-49dca2d19c70	\N	system	role_saved	Sales Manager saved	c954fe38d72731d54c936331	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-02 08:09:42.307118+00
2	adb6bf84-0d87-4ffc-a571-49dca2d19c70	new_custom_role_1785658079924	system	permissions_saved	Role permissions updated	4c9c7b0087ed0e9be6006ada	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-02 08:09:43.851279+00
3	adb6bf84-0d87-4ffc-a571-49dca2d19c70	\N	system	role_saved	Sales Manager saved	0c24162e27196654afe2293d	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-02 08:09:44.760886+00
4	adb6bf84-0d87-4ffc-a571-49dca2d19c70	new_custom_role_1785658079924	system	permissions_saved	Role permissions updated	78d7ccb88dacb4740e0b46f8	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-02 08:09:45.230144+00
5	adb6bf84-0d87-4ffc-a571-49dca2d19c70	\N	system	role_saved	Sales Manager Copy saved	4dc7b2dbaf815e5d736bd065	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-02 08:10:43.931881+00
6	adb6bf84-0d87-4ffc-a571-49dca2d19c70	sales_manager_copy_1785658236479	system	permissions_saved	Role permissions updated	e57d558755dc3b401960c0fd	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-02 08:10:44.395299+00
7	adb6bf84-0d87-4ffc-a571-49dca2d19c70	\N	system	role_saved	Sales Manager Copy Copy saved	c270e3469545786ad9885b9a	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-02 08:11:24.64617+00
8	adb6bf84-0d87-4ffc-a571-49dca2d19c70	sales_manager_copy_copy_1785658275287	system	permissions_saved	Role permissions updated	c86a725e84b0465263e218fd	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-02 08:11:25.111404+00
\.


--
-- Data for Name: rbac_role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rbac_role_permissions (role_id, module_code, action_key, enabled, created_at, updated_at) FROM stdin;
role_super_admin	dashboard	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	dashboard	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	dashboard	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	dashboard	delete	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	dashboard	approve	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	dashboard	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	dashboard	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	users	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	users	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	users	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	users	delete	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	users	approve	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	users	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	users	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	roles_permissions	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	roles_permissions	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	roles_permissions	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	roles_permissions	delete	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	roles_permissions	approve	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	roles_permissions	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	roles_permissions	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	audit_logs	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	audit_logs	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	audit_logs	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	audit_logs	delete	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	audit_logs	approve	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	audit_logs	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	audit_logs	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	all_clients	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	all_clients	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	all_clients	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	all_clients	delete	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	all_clients	approve	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	all_clients	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	all_clients	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	tenants	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	tenants	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	tenants	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	tenants	delete	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	tenants	approve	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	tenants	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	tenants	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	payments	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	payments	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	payments	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	payments	delete	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	payments	approve	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	payments	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	payments	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	plans_pricing	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	plans_pricing	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	plans_pricing	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	plans_pricing	delete	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	plans_pricing	approve	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	plans_pricing	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	plans_pricing	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	license	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	license	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	license	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	license	delete	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	license	approve	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	license	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	license	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	saas_control	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	saas_control	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	saas_control	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	saas_control	delete	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	saas_control	approve	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	saas_control	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	saas_control	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	business_suites	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	business_suites	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	business_suites	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	business_suites	delete	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	business_suites	approve	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	business_suites	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	business_suites	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	module_catalog	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	module_catalog	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	module_catalog	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	module_catalog	delete	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	module_catalog	approve	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	module_catalog	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	module_catalog	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	analytics	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	analytics	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	analytics	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	analytics	delete	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	analytics	approve	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	analytics	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	analytics	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	system_health	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	system_health	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	system_health	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	system_health	delete	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	system_health	approve	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	system_health	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	system_health	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	frontend	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	frontend	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	frontend	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	frontend	delete	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	frontend	approve	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	frontend	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	frontend	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	blogs	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	blogs	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	blogs	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	blogs	delete	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	blogs	approve	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	blogs	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	blogs	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	settings	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	settings	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	settings	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	settings	delete	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	settings	approve	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	settings	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	settings	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	api_gateway	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	api_gateway	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	api_gateway	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	api_gateway	delete	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	api_gateway	approve	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	api_gateway	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	api_gateway	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	updater	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	updater	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	updater	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	updater	delete	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	updater	approve	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	updater	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_super_admin	updater	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	dashboard	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	dashboard	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	dashboard	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	dashboard	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	dashboard	approve	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	dashboard	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	dashboard	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	users	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	users	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	users	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	users	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	users	approve	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	users	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	users	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	roles_permissions	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	roles_permissions	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	roles_permissions	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	roles_permissions	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	roles_permissions	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	roles_permissions	export	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	roles_permissions	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	audit_logs	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	audit_logs	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	audit_logs	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	audit_logs	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	audit_logs	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	audit_logs	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	audit_logs	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	all_clients	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	all_clients	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	all_clients	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	all_clients	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	all_clients	approve	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	all_clients	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	all_clients	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	tenants	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	tenants	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	tenants	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	tenants	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	tenants	approve	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	tenants	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	tenants	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	payments	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	payments	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	payments	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	payments	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	payments	approve	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	payments	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	payments	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	plans_pricing	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	plans_pricing	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	plans_pricing	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	plans_pricing	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	plans_pricing	approve	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	plans_pricing	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	plans_pricing	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	license	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	license	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	license	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	license	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	license	approve	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	license	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	license	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	saas_control	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	saas_control	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	saas_control	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	saas_control	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	saas_control	approve	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	saas_control	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	saas_control	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	business_suites	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	business_suites	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	business_suites	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	business_suites	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	business_suites	approve	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	business_suites	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	business_suites	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	module_catalog	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	module_catalog	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	module_catalog	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	module_catalog	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	module_catalog	approve	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	module_catalog	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	module_catalog	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	analytics	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	analytics	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	analytics	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	analytics	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	analytics	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	analytics	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	analytics	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	system_health	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	system_health	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	system_health	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	system_health	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	system_health	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	system_health	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	system_health	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	frontend	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	frontend	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	frontend	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	frontend	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	frontend	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	frontend	export	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	frontend	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	blogs	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	blogs	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	blogs	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	blogs	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	blogs	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	blogs	export	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	blogs	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	settings	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	settings	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	settings	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	settings	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	settings	approve	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	settings	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	settings	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	api_gateway	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	api_gateway	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	api_gateway	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	api_gateway	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	api_gateway	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	api_gateway	export	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	api_gateway	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	updater	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	updater	create	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	updater	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	updater	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	updater	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	updater	export	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_admin	updater	manage	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	dashboard	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	dashboard	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	dashboard	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	dashboard	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	dashboard	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	dashboard	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	dashboard	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	users	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	users	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	users	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	users	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	users	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	users	export	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	users	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	roles_permissions	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	roles_permissions	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	roles_permissions	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	roles_permissions	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	roles_permissions	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	roles_permissions	export	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	roles_permissions	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	audit_logs	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	audit_logs	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	audit_logs	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	audit_logs	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	audit_logs	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	audit_logs	export	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	audit_logs	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	all_clients	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	all_clients	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	all_clients	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	all_clients	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	all_clients	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	all_clients	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	all_clients	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	tenants	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	tenants	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	tenants	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	tenants	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	tenants	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	tenants	export	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	tenants	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	payments	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	payments	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	payments	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	payments	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	payments	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	payments	export	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	payments	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	plans_pricing	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	plans_pricing	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	plans_pricing	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	plans_pricing	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	plans_pricing	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	plans_pricing	export	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	plans_pricing	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	license	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	license	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	license	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	license	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	license	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	license	export	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	license	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	saas_control	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	saas_control	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	saas_control	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	saas_control	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	saas_control	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	saas_control	export	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	saas_control	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	business_suites	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	business_suites	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	business_suites	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	business_suites	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	business_suites	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	business_suites	export	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	business_suites	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	module_catalog	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	module_catalog	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	module_catalog	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	module_catalog	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	module_catalog	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	module_catalog	export	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	module_catalog	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	analytics	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	analytics	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	analytics	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	analytics	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	analytics	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	analytics	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	analytics	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	system_health	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	system_health	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	system_health	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	system_health	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	system_health	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	system_health	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	system_health	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	frontend	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	frontend	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	frontend	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	frontend	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	frontend	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	frontend	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	frontend	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	blogs	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	blogs	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	blogs	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	blogs	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	blogs	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	blogs	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	blogs	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	settings	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	settings	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	settings	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	settings	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	settings	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	settings	export	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	settings	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	api_gateway	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	api_gateway	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	api_gateway	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	api_gateway	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	api_gateway	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	api_gateway	export	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	api_gateway	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	updater	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	updater	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	updater	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	updater	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	updater	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	updater	export	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_client_user	updater	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	dashboard	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	dashboard	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	dashboard	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	dashboard	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	dashboard	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	dashboard	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	dashboard	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	users	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	users	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	users	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	users	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	users	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	users	export	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	users	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	roles_permissions	view	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	roles_permissions	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	roles_permissions	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	roles_permissions	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	roles_permissions	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	roles_permissions	export	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	roles_permissions	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	audit_logs	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	audit_logs	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	audit_logs	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	audit_logs	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	audit_logs	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	audit_logs	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	audit_logs	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	all_clients	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	all_clients	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	all_clients	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	all_clients	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	all_clients	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	all_clients	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	all_clients	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	tenants	view	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	tenants	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	tenants	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	tenants	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	tenants	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	tenants	export	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	tenants	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	payments	view	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	payments	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	payments	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	payments	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	payments	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	payments	export	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	payments	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	plans_pricing	view	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	plans_pricing	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	plans_pricing	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	plans_pricing	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	plans_pricing	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	plans_pricing	export	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	plans_pricing	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	license	view	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	license	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	license	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	license	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	license	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	license	export	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	license	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	saas_control	view	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	saas_control	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	saas_control	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	saas_control	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	saas_control	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	saas_control	export	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	saas_control	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	business_suites	view	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	business_suites	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	business_suites	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	business_suites	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	business_suites	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	business_suites	export	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	business_suites	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	module_catalog	view	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	module_catalog	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	module_catalog	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	module_catalog	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	module_catalog	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	module_catalog	export	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	module_catalog	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	analytics	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	analytics	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	analytics	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	analytics	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	analytics	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	analytics	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	analytics	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	system_health	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	system_health	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	system_health	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	system_health	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	system_health	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	system_health	export	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	system_health	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	frontend	view	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	frontend	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	frontend	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	frontend	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	frontend	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	frontend	export	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	frontend	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	blogs	view	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	blogs	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	blogs	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	blogs	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	blogs	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	blogs	export	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	blogs	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	settings	view	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	settings	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	settings	edit	t	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	settings	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	settings	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	settings	export	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	settings	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	api_gateway	view	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	api_gateway	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	api_gateway	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	api_gateway	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	api_gateway	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	api_gateway	export	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	api_gateway	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	updater	view	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	updater	create	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	updater	edit	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	updater	delete	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	updater	approve	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	updater	export	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
role_support	updater	manage	f	2026-08-03 13:02:30.533891+00	2026-08-03 13:02:30.533891+00
\.


--
-- Data for Name: rbac_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rbac_roles (id, name, description, is_system, status, scope, inherits_from, created_by, updated_by, created_at, updated_at) FROM stdin;
sales_manager_copy_copy_1785658275287	Sales Manager Copy Copy		f	active	department	\N	superadmin@softcodesolution.local	superadmin@softcodesolution.local	2026-08-02 08:11:24.64375+00	2026-08-02 08:11:24.64375+00
role_super_admin	Super Admin	Unrestricted platform access across every module and tenant.	t	active	Platform	\N	System	System	2026-07-31 13:26:15.142294+00	2026-08-03 13:02:30.533891+00
new_custom_role_1785658079924	Sales Manager		f	active	department	\N	superadmin@softcodesolution.local	superadmin@softcodesolution.local	2026-08-02 08:09:42.289604+00	2026-08-02 08:09:44.758401+00
role_client_admin	Client Admin	Tenant-level administration with billing, clients and module control.	t	active	Tenant	\N	System	System	2026-07-31 13:26:15.142294+00	2026-08-03 13:02:30.533891+00
role_client_user	Client User	Restricted operational access for day-to-day business work.	t	active	Branch	\N	System	System	2026-07-31 13:26:15.142294+00	2026-08-03 13:02:30.533891+00
role_support	Support	Support desk access to inspect health, logs and client state.	t	active	Platform	\N	System	System	2026-07-31 13:26:15.142294+00	2026-08-03 13:02:30.533891+00
sales_manager_copy_1785658236479	Sales Manager Copy		f	active	department	\N	superadmin@softcodesolution.local	superadmin@softcodesolution.local	2026-08-02 08:10:43.930192+00	2026-08-02 08:10:43.930192+00
\.


--
-- Data for Name: rbac_user_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rbac_user_roles (user_id, role_id, scope, created_at) FROM stdin;
41d17ca8-21b2-4928-9156-1d9218b2d2a6	role_client_admin	tenant	2026-07-31 13:26:15.142294+00
5cc47739-5212-48ff-ad30-f6dffa708d03	role_client_admin	tenant	2026-07-31 13:26:15.142294+00
9d735fb3-ef34-47c3-add7-75c17bd0a583	role_client_admin	tenant	2026-07-31 13:26:15.142294+00
adb6bf84-0d87-4ffc-a571-49dca2d19c70	role_super_admin	tenant	2026-07-31 13:26:15.142294+00
4ce6f50e-a5cd-4d11-bb3a-194687c63550	role_client_admin	tenant	2026-07-31 13:26:15.142294+00
\.


--
-- Data for Name: tenant_modules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant_modules (tenant_id, module_id, enabled, source, created_at, updated_at, monthly_price_snapshot, yearly_price_snapshot, price_override) FROM stdin;
tenant_4f049da4cac745988b96821d9e0051b3	students	f	manual	2026-06-11 08:43:04.421317+00	2026-06-15 10:45:30.685062+00	1000.00	10000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	website	f	manual	2026-06-12 19:44:15.212838+00	2026-06-17 09:41:31.424122+00	1800.00	18000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	dental_orthodontics	f	manual	2026-07-25 18:46:56.454659+00	2026-07-25 18:46:57.410965+00	1600.00	16000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	school_management	f	plan	2026-06-10 12:52:19.587481+00	2026-07-25 18:48:11.277249+00	3500.00	35000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	teachers	f	plan	2026-06-11 22:33:04.488557+00	2026-07-25 18:48:11.277249+00	1000.00	10000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	test1	f	manual	2026-06-16 20:01:38.70609+00	2026-07-25 07:55:22.478833+00	252.00	230.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_dashboard	t	plan	2026-06-17 09:42:18.477838+00	2026-07-25 18:48:11.277249+00	0.00	0.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_company_profile	t	plan	2026-06-17 09:42:18.477838+00	2026-07-25 18:48:11.277249+00	500.00	5000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_branches	t	plan	2026-06-17 09:42:18.477838+00	2026-07-25 18:48:11.277249+00	800.00	8000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_users	t	plan	2026-06-17 09:42:18.477838+00	2026-07-25 18:48:11.277249+00	1000.00	10000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	fees	f	manual	2026-06-10 12:52:58.617646+00	2026-06-12 19:25:39.449423+00	1500.00	15000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	timetable	f	manual	2026-06-10 19:05:51.254873+00	2026-06-12 19:25:39.449423+00	900.00	9000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	crm	f	manual	2026-06-09 22:39:07.671601+00	2026-06-12 19:25:39.449423+00	2000.00	20000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	exams_results	f	manual	2026-06-10 19:05:59.638158+00	2026-06-12 19:25:39.449423+00	1400.00	14000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_roles_permissions	t	plan	2026-06-17 09:42:18.477838+00	2026-07-25 18:48:11.277249+00	1200.00	12000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_files	t	plan	2026-06-17 09:42:18.477838+00	2026-07-25 18:48:11.277249+00	800.00	8000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_calendar	t	plan	2026-06-17 09:42:18.477838+00	2026-07-25 18:48:11.277249+00	700.00	7000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_notifications	t	plan	2026-06-17 09:42:18.477838+00	2026-07-25 18:48:11.277249+00	700.00	7000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	treatment_plans	f	manual	2026-06-15 11:10:28.157481+00	2026-06-17 10:57:59.024081+00	1400.00	14000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	attendance	f	manual	2026-06-11 22:33:07.442218+00	2026-06-17 10:57:59.024081+00	1200.00	12000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	patient_portal	f	manual	2026-06-15 11:10:09.544706+00	2026-06-17 10:57:59.024081+00	1600.00	16000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	travel_bookings	f	manual	2026-06-15 09:23:20.584551+00	2026-06-17 10:57:59.024081+00	1400.00	14000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	classes_sections	f	manual	2026-06-11 22:33:02.089447+00	2026-06-17 10:57:59.024081+00	900.00	9000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	store_management	f	plan	2026-06-10 21:45:16.991791+00	2026-06-17 10:57:59.024081+00	2500.00	25000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	products	f	plan	2026-06-10 21:45:16.991791+00	2026-06-17 10:57:59.024081+00	800.00	8000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	inventory	f	plan	2026-06-10 21:44:47.050432+00	2026-06-17 10:57:59.024081+00	1200.00	12000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	customers	f	plan	2026-06-10 21:44:55.89796+00	2026-06-17 10:57:59.024081+00	1000.00	10000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	suppliers	f	plan	2026-06-10 21:44:53.850162+00	2026-06-17 10:57:59.024081+00	800.00	8000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	billing	f	plan	2026-06-11 23:52:01.79975+00	2026-06-17 10:57:59.024081+00	1500.00	15000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	reports	f	plan	2026-06-11 23:52:01.79975+00	2026-06-17 10:57:59.024081+00	1000.00	10000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_activity_logs	t	plan	2026-06-17 09:42:18.477838+00	2026-07-25 18:48:11.277249+00	900.00	9000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	store_management	f	manual	2026-06-09 22:00:06.74443+00	2026-06-17 11:15:50.620171+00	2500.00	25000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	test	f	manual	2026-06-16 20:01:47.398617+00	2026-07-25 18:48:02.767341+00	10.00	25.00	f
tenant_4f049da4cac745988b96821d9e0051b3	customers	f	plan	2026-06-09 23:23:33.752558+00	2026-07-25 18:48:11.277249+00	1000.00	10000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	suppliers	f	plan	2026-06-09 23:23:33.752558+00	2026-07-25 18:48:11.277249+00	800.00	8000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	billing	f	plan	2026-06-10 12:52:01.846218+00	2026-07-25 18:48:11.277249+00	1500.00	15000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	reports	f	plan	2026-06-09 23:23:33.752558+00	2026-07-25 18:48:11.277249+00	100	10000	t
tenant_7d8ca36774ec47eb9d27fe5efbdea672	core_dashboard	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	0.00	0.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	core_branches	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	800.00	8000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	core_company_profile	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	500.00	5000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	products	f	manual	2026-06-09 23:03:12.844352+00	2026-06-15 20:35:14.005084+00	803	8000	t
tenant_7d8ca36774ec47eb9d27fe5efbdea672	core_users	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	1000.00	10000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	menu_items	f	manual	2026-06-10 22:27:13.510477+00	2026-06-12 19:25:39.449423+00	900.00	9000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	parents_portal	f	manual	2026-06-11 18:58:25.771583+00	2026-06-12 19:25:39.449423+00	1200.00	12000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	restaurant_management	f	manual	2026-06-11 18:58:27.907643+00	2026-06-12 19:25:39.449423+00	3000.00	30000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	library	f	manual	2026-06-11 18:58:23.568219+00	2026-06-12 19:25:39.449423+00	800.00	8000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	inventory	f	manual	2026-06-09 22:00:26.085447+00	2026-06-17 10:57:59.024081+00	1200.00	12000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	core_roles_permissions	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	1200.00	12000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	queue_management	f	manual	2026-06-15 11:10:18.369552+00	2026-06-17 10:57:59.024081+00	900.00	9000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	sales_orders	f	manual	2026-06-09 23:03:12.844352+00	2026-06-17 10:57:59.024081+00	1500.00	15000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	sales_orders	f	plan	2026-06-10 21:44:51.933414+00	2026-06-17 10:57:59.024081+00	1500.00	15000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	core_dashboard	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	0.00	0.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	core_branches	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	800.00	8000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	core_company_profile	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	500.00	5000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	core_users	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	1000.00	10000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	core_roles_permissions	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	1200.00	12000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	core_files	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	800.00	8000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	core_calendar	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	700.00	7000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	core_notifications	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	700.00	7000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	core_activity_logs	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	900.00	9000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	core_import_export	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	1000.00	10000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	core_custom_fields	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	900.00	9000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	core_tasks	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	900.00	9000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	hotel_management	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	3500.00	35000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	room_booking	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	1600.00	16000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	housekeeping	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	1000.00	10000.00	f
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	checkin_checkout	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	1200.00	12000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	core_files	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	800.00	8000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	core_calendar	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	700.00	7000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	core_notifications	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	700.00	7000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	core_activity_logs	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	900.00	9000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	core_import_export	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	1000.00	10000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	core_custom_fields	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	900.00	9000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	core_tasks	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	900.00	9000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	store_management	t	plan	2026-06-15 11:02:49.368133+00	2026-06-17 10:57:59.024081+00	2500.00	25000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	products	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	800.00	8000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	inventory	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	1200.00	12000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	sales_orders	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	1500.00	15000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	customers	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	1000.00	10000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	suppliers	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	800.00	8000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	billing	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	1500.00	15000.00	f
tenant_7d8ca36774ec47eb9d27fe5efbdea672	reports	t	plan	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	1000.00	10000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	hotel_room_booking	t	plan	2026-06-17 16:20:45.35332+00	2026-07-25 18:48:11.277249+00	1600.00	16000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	hotel_checkin_checkout	t	plan	2026-06-17 16:20:45.35332+00	2026-07-25 18:48:11.277249+00	1200.00	12000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	hotel_housekeeping	t	plan	2026-06-17 16:20:45.35332+00	2026-07-25 18:48:11.277249+00	1000.00	10000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_import_export	t	plan	2026-06-17 09:42:18.477838+00	2026-07-25 18:48:11.277249+00	1000.00	10000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_custom_fields	t	plan	2026-06-17 09:42:18.477838+00	2026-07-25 18:48:11.277249+00	900.00	9000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	core_tasks	t	plan	2026-06-17 09:42:18.477838+00	2026-07-25 18:48:11.277249+00	900.00	9000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	hotel_management	t	plan	2026-06-17 09:42:18.477838+00	2026-07-25 18:48:11.277249+00	3500.00	35000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	hotel_room_status	t	plan	2026-06-17 16:20:45.35332+00	2026-07-25 18:48:11.277249+00	1000.00	10000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	room_booking	t	plan	2026-06-17 09:42:18.477838+00	2026-07-25 18:48:11.277249+00	1600.00	16000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	housekeeping	t	plan	2026-06-17 09:42:18.477838+00	2026-07-25 18:48:11.277249+00	1000.00	10000.00	f
tenant_4f049da4cac745988b96821d9e0051b3	checkin_checkout	t	plan	2026-06-17 09:42:18.477838+00	2026-07-25 18:48:11.277249+00	1200.00	12000.00	f
\.


--
-- Data for Name: tenant_subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant_subscriptions (tenant_id, plan_id, status, billing_cycle, amount, started_at, updated_at, plan_base_amount, module_addons_amount) FROM stdin;
tenant_7683fd87bd0a4f4ca69768c51aa7a6ee	starter	active	monthly	3500.00	2026-06-10 21:45:16.991791+00	2026-06-17 10:57:59.024081+00	3500.00	0
tenant_7d8ca36774ec47eb9d27fe5efbdea672	starter	active	monthly	5500.00	2026-06-17 10:57:59.024081+00	2026-06-17 10:57:59.024081+00	5500.00	0
tenant_4f049da4cac745988b96821d9e0051b3	pro	active	monthly	6500.00	2026-06-09 23:03:12.844352+00	2026-07-25 18:48:11.295428+00	6500	0
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenants (id, idempotency_key, tenant_id, full_name, email, country_code, phone, company_name, business_reg_no, business_type, business_size, country, city, state, postal_code, address, custom_domain, hear_about_us, password_hash, enable_passkey, biometric_hash, terms_accepted, version, created_at, updated_at) FROM stdin;
\.


--
-- Name: rbac_audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.rbac_audit_logs_id_seq', 8, true);


--
-- Name: api_idempotency_keys api_idempotency_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_idempotency_keys
    ADD CONSTRAINT api_idempotency_keys_pkey PRIMARY KEY (idempotency_key);


--
-- Name: auth_audit_logs auth_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_audit_logs
    ADD CONSTRAINT auth_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: auth_password_reset_requests auth_password_reset_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_password_reset_requests
    ADD CONSTRAINT auth_password_reset_requests_pkey PRIMARY KEY (id);


--
-- Name: auth_sessions auth_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_sessions
    ADD CONSTRAINT auth_sessions_pkey PRIMARY KEY (id);


--
-- Name: auth_sessions auth_sessions_session_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_sessions
    ADD CONSTRAINT auth_sessions_session_hash_key UNIQUE (session_hash);


--
-- Name: auth_users auth_users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_users
    ADD CONSTRAINT auth_users_email_key UNIQUE (email);


--
-- Name: auth_users auth_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_users
    ADD CONSTRAINT auth_users_pkey PRIMARY KEY (id);


--
-- Name: business_plan_matrix business_plan_matrix_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_plan_matrix
    ADD CONSTRAINT business_plan_matrix_pkey PRIMARY KEY (business_type, plan_id);


--
-- Name: business_plan_modules business_plan_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_plan_modules
    ADD CONSTRAINT business_plan_modules_pkey PRIMARY KEY (business_type, plan_id, module_id);


--
-- Name: business_type_aliases business_type_aliases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_type_aliases
    ADD CONSTRAINT business_type_aliases_pkey PRIMARY KEY (alias);


--
-- Name: business_types business_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_types
    ADD CONSTRAINT business_types_pkey PRIMARY KEY (id);


--
-- Name: client_business_register client_business_register_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_business_register
    ADD CONSTRAINT client_business_register_email_key UNIQUE (email);


--
-- Name: client_business_register client_business_register_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_business_register
    ADD CONSTRAINT client_business_register_pkey PRIMARY KEY (id);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: plan_modules plan_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_modules
    ADD CONSTRAINT plan_modules_pkey PRIMARY KEY (plan_id, module_id);


--
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- Name: rbac_audit_logs rbac_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_audit_logs
    ADD CONSTRAINT rbac_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: rbac_role_permissions rbac_role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_role_permissions
    ADD CONSTRAINT rbac_role_permissions_pkey PRIMARY KEY (role_id, module_code, action_key);


--
-- Name: rbac_roles rbac_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_roles
    ADD CONSTRAINT rbac_roles_pkey PRIMARY KEY (id);


--
-- Name: rbac_user_roles rbac_user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_user_roles
    ADD CONSTRAINT rbac_user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: tenant_modules tenant_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_modules
    ADD CONSTRAINT tenant_modules_pkey PRIMARY KEY (tenant_id, module_id);


--
-- Name: tenant_subscriptions tenant_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_subscriptions
    ADD CONSTRAINT tenant_subscriptions_pkey PRIMARY KEY (tenant_id);


--
-- Name: tenants tenants_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_email_key UNIQUE (email);


--
-- Name: tenants tenants_idempotency_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_idempotency_key_key UNIQUE (idempotency_key);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_tenant_id_key UNIQUE (tenant_id);


--
-- Name: idx_auth_audit_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_audit_logs_created_at ON public.auth_audit_logs USING btree (created_at DESC);


--
-- Name: idx_auth_audit_logs_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_audit_logs_tenant_id ON public.auth_audit_logs USING btree (tenant_id);


--
-- Name: idx_auth_audit_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_audit_logs_user_id ON public.auth_audit_logs USING btree (user_id);


--
-- Name: idx_auth_password_reset_email_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_password_reset_email_created ON public.auth_password_reset_requests USING btree (lower(email), created_at DESC);


--
-- Name: idx_auth_password_reset_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_password_reset_expires ON public.auth_password_reset_requests USING btree (expires_at);


--
-- Name: idx_auth_sessions_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_sessions_expires_at ON public.auth_sessions USING btree (expires_at);


--
-- Name: idx_auth_sessions_revoked_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_sessions_revoked_at ON public.auth_sessions USING btree (revoked_at);


--
-- Name: idx_auth_sessions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_sessions_user_id ON public.auth_sessions USING btree (user_id);


--
-- Name: idx_auth_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_users_role ON public.auth_users USING btree (role);


--
-- Name: idx_auth_users_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_users_status ON public.auth_users USING btree (status);


--
-- Name: idx_auth_users_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_users_tenant_id ON public.auth_users USING btree (tenant_id);


--
-- Name: idx_business_plan_matrix_plan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_plan_matrix_plan ON public.business_plan_matrix USING btree (plan_id, status);


--
-- Name: idx_business_plan_modules_plan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_plan_modules_plan ON public.business_plan_modules USING btree (plan_id, business_type);


--
-- Name: idx_client_business_register_business_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_business_register_business_type ON public.client_business_register USING btree (business_type);


--
-- Name: idx_client_business_register_company_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_business_register_company_name ON public.client_business_register USING btree (company_name);


--
-- Name: idx_client_business_register_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_business_register_email ON public.client_business_register USING btree (email);


--
-- Name: idx_client_business_register_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_business_register_status ON public.client_business_register USING btree (status);


--
-- Name: idx_client_register_email_lower; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_register_email_lower ON public.client_business_register USING btree (lower((email)::text));


--
-- Name: idx_client_register_status_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_register_status_created ON public.client_business_register USING btree (status, created_at DESC);


--
-- Name: idx_cloud_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cloud_email ON public.tenants USING btree (email);


--
-- Name: idx_cloud_idempotency; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cloud_idempotency ON public.tenants USING btree (idempotency_key);


--
-- Name: idx_cloud_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cloud_tenant_id ON public.tenants USING btree (tenant_id);


--
-- Name: idx_modules_status_sort; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_modules_status_sort ON public.modules USING btree (status, sort_order, name);


--
-- Name: idx_plans_status_sort; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_plans_status_sort ON public.plans USING btree (status, sort_order, name);


--
-- Name: idx_rbac_audit_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rbac_audit_created ON public.rbac_audit_logs USING btree (created_at DESC);


--
-- Name: idx_rbac_permissions_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rbac_permissions_role ON public.rbac_role_permissions USING btree (role_id, module_code);


--
-- Name: idx_rbac_roles_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rbac_roles_status ON public.rbac_roles USING btree (status, is_system, name);


--
-- Name: idx_rbac_user_roles_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rbac_user_roles_user ON public.rbac_user_roles USING btree (user_id);


--
-- Name: idx_tenant_modules_tenant_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tenant_modules_tenant_enabled ON public.tenant_modules USING btree (tenant_id, enabled);


--
-- Name: idx_tenant_subscriptions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tenant_subscriptions_status ON public.tenant_subscriptions USING btree (status);


--
-- Name: auth_password_reset_requests auth_password_reset_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_password_reset_requests
    ADD CONSTRAINT auth_password_reset_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: auth_sessions auth_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_sessions
    ADD CONSTRAINT auth_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: business_plan_matrix business_plan_matrix_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_plan_matrix
    ADD CONSTRAINT business_plan_matrix_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id);


--
-- Name: business_plan_modules business_plan_modules_business_type_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_plan_modules
    ADD CONSTRAINT business_plan_modules_business_type_plan_id_fkey FOREIGN KEY (business_type, plan_id) REFERENCES public.business_plan_matrix(business_type, plan_id) ON DELETE CASCADE;


--
-- Name: business_plan_modules business_plan_modules_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_plan_modules
    ADD CONSTRAINT business_plan_modules_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: business_type_aliases business_type_aliases_business_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_type_aliases
    ADD CONSTRAINT business_type_aliases_business_type_id_fkey FOREIGN KEY (business_type_id) REFERENCES public.business_types(id) ON DELETE CASCADE;


--
-- Name: plan_modules plan_modules_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_modules
    ADD CONSTRAINT plan_modules_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: plan_modules plan_modules_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_modules
    ADD CONSTRAINT plan_modules_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE CASCADE;


--
-- Name: rbac_audit_logs rbac_audit_logs_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_audit_logs
    ADD CONSTRAINT rbac_audit_logs_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.auth_users(id) ON DELETE SET NULL;


--
-- Name: rbac_audit_logs rbac_audit_logs_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_audit_logs
    ADD CONSTRAINT rbac_audit_logs_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.rbac_roles(id) ON DELETE SET NULL;


--
-- Name: rbac_role_permissions rbac_role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_role_permissions
    ADD CONSTRAINT rbac_role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.rbac_roles(id) ON DELETE CASCADE;


--
-- Name: rbac_roles rbac_roles_inherits_from_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_roles
    ADD CONSTRAINT rbac_roles_inherits_from_fkey FOREIGN KEY (inherits_from) REFERENCES public.rbac_roles(id) ON DELETE SET NULL;


--
-- Name: rbac_user_roles rbac_user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_user_roles
    ADD CONSTRAINT rbac_user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.rbac_roles(id) ON DELETE CASCADE;


--
-- Name: rbac_user_roles rbac_user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_user_roles
    ADD CONSTRAINT rbac_user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: tenant_modules tenant_modules_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_modules
    ADD CONSTRAINT tenant_modules_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: tenant_subscriptions tenant_subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_subscriptions
    ADD CONSTRAINT tenant_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id);


--
-- Name: tenants isolate_tenant_data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY isolate_tenant_data ON public.tenants USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: tenants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict i0MgoP0yW13KrNCVWrfiitx7TwyfNVyAU3RLdpKUhReOamCZChjczNG3SJhOM7V

