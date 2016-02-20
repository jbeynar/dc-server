DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

CREATE SEQUENCE document_id_seq
    START WITH 1001
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE stock_id_seq
    START WITH 1001
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE document (
    id bigint DEFAULT nextval('document_id_seq'::regclass) NOT NULL,
    type character varying(64),
    body jsonb,
    ts timestamp without time zone DEFAULT now()
)

CREATE TABLE stock (
    id bigint DEFAULT nextval('stock_id_seq'::regclass) NOT NULL,
    symbol varying character(3),
    symbol_long varying character(16),
    name varying character(512),
    sector varying character(128),
    website varying character(512)
)
