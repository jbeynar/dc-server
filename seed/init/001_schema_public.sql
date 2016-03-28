DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

CREATE SEQUENCE stock_id_seq
    START WITH 1001
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE stock (
    id bigint DEFAULT nextval('stock_id_seq'::regclass) NOT NULL,
    symbol character varying(5) UNIQUE NOT NULL,
    symbol_long character varying(16),
    name character varying(512),
    sector character varying(128),
    website character varying(512),
    description text
);

CREATE SEQUENCE valuation_sw_id_seq
    START WITH 1001
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE valuation_sw (
    id bigint DEFAULT nextval('valuation_sw_id_seq'::regclass) NOT NULL,
    document jsonb
);

CREATE SEQUENCE valuation_br_id_seq
    START WITH 1001
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE valuation_br (
    id bigint DEFAULT nextval('valuation_br_id_seq'::regclass) NOT NULL,
    symbol character varying(5) UNIQUE NOT NULL,
    price numeric(9,3),
    value numeric(9,3),
    cwk numeric(9,3),
    cwk_rel numeric(9,3),
    cz numeric(9,3),
    cz_rel numeric(9,3),
    cp_rel numeric(9,3),
    czo_rel numeric(9,3),
    roe_rel numeric(9,3),
    roa_rel numeric(5,3)
);

