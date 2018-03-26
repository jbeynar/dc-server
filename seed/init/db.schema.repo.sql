DROP SCHEMA IF EXISTS __SCHEMANAME__ CASCADE;
CREATE SCHEMA __SCHEMANAME__;

SET search_path TO __SCHEMANAME__;

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
    name character varying(64),
    type character varying(64),
    url character varying(512),
    host character varying(256),
    path character varying(1024),
    query character varying(1024),
    code integer,
    headers jsonb,
    body text,
    length bigint,
    retry_count integer DEFAULT 0,
    ts timestamp without time zone DEFAULT now(),
    metadata jsonb
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
