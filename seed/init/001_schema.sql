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
);

CREATE TABLE stock (
    id bigint DEFAULT nextval('stock_id_seq'::regclass) NOT NULL,
    symbol character varying(3),
    symbol_long character varying(16),
    name character varying(512),
    sector character varying(128),
    website character varying(512)
);
