DROP SCHEMA IF EXISTS repo CASCADE;
CREATE SCHEMA repo;

SET search_path TO repo;

CREATE SEQUENCE document_http_id_seq
    START WITH 1001
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE document_json_id_seq
    START WITH 1001
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE document_http (
    id bigint DEFAULT nextval('document_http_id_seq'::regclass) NOT NULL,
    type character varying(64),
    url character varying(512),
    host character varying(256),
    path character varying(512),
    code integer,
    headers jsonb,
    body text,
    length bigint,
    retry_count integer DEFAULT 0,
    ts timestamp without time zone DEFAULT now()
);

CREATE TABLE document_json (
    id bigint DEFAULT nextval('document_json_id_seq'::regclass) NOT NULL,
    type character varying(64),
    body jsonb,
    length bigint,
    ts timestamp without time zone DEFAULT now()
);

ALTER TABLE ONLY document_json ADD CONSTRAINT "document_json_PK" PRIMARY KEY (id);
ALTER TABLE ONLY document_http ADD CONSTRAINT "document_http_PK" PRIMARY KEY (id);

SET search_path TO public;
