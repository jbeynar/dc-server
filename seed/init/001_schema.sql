DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

CREATE SEQUENCE document_id_seq
    START WITH 1001
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE document (
    id bigint DEFAULT nextval('document_id_seq'::regclass) NOT NULL,
    type character varying(64),
    host character varying(256),
    path character varying(512),
    code integer,
    headers jsonb,
    body text,
    length bigint,
    ts timestamp without time zone DEFAULT now()
);

CREATE SEQUENCE stock_id_seq
    START WITH 1001
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE stock (
    id bigint DEFAULT nextval('stock_id_seq'::regclass) NOT NULL,
    symbol character varying(5),
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
    document jsonb
);

