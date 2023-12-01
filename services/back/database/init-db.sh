#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE USER readwritedelete;
  CREATE USER readwrite;
  CREATE USER read;
  REVOKE CONNECT ON DATABASE zkorum FROM PUBLIC;
  GRANT CONNECT ON DATABASE zkorum TO readwritedelete;
  GRANT CONNECT ON DATABASE zkorum TO readwrite;
  GRANT CONNECT ON DATABASE zkorum TO read;
  ALTER DEFAULT PRIVILEGES 
    FOR USER readwritedelete
    IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO readwritedelete;
  ALTER DEFAULT PRIVILEGES 
    FOR USER readwrite
    IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE ON TABLES TO readwrite;
  ALTER DEFAULT PRIVILEGES 
    FOR USER read
    IN SCHEMA public
    GRANT SELECT ON TABLES TO readwrite;
EOSQL
