DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

CREATE SEQUENCE stock_id_seq
    START WITH 1001
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE stock (
    id int DEFAULT nextval('stock_id_seq'::regclass) NOT NULL,
    document_sw jsonb,
    documnt_br jsonb
)
